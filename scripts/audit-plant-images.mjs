/** Exhaustive API/photo audit. Images are downloaded ONLY as ignored QA evidence.
 * npm run audit:images -- --all --resume --decode --out research/global-audit-2026-11-01
 * Never writes public assets or a production photo lookup table.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
const args = process.argv.slice(2),
  option = (key, fallback) => (args.includes(key) ? args[args.indexOf(key) + 1] : fallback);
const base = option('--base', 'http://127.0.0.1:3000');
const folder = path.resolve(option('--out', 'research/plant-catalogue-2026-11-01'));
if (!folder.startsWith(process.cwd() + path.sep))
  throw Error('Audit output must stay inside the workspace.');
fs.mkdirSync(folder, { recursive: true });
const catalogue = JSON.parse(fs.readFileSync('src/data/global/plant-catalogue.json', 'utf8'));
const plants = args.includes('--all')
  ? catalogue
  : catalogue.filter(
      (p) =>
        p.photo ||
        [
          'Mangifera indica',
          'Malus domestica',
          'Carica papaya',
          'Capsicum annuum',
          'Fragaria vesca',
          'Anacardium occidentale',
          'Musa acuminata',
          'Allium sativum',
          'Prunus domestica',
        ].includes(p.scientific),
    );
const output = path.join(
  folder,
  args.includes('--all') ? 'api-coverage-full.json' : 'api-coverage-sample.json',
);
let report =
  args.includes('--resume') && fs.existsSync(output)
    ? JSON.parse(fs.readFileSync(output, 'utf8'))
    : {
        startedAt: new Date().toISOString(),
        fullCatalogue: args.includes('--all'),
        total: plants.length,
        results: [],
      };
const records = new Map(report.results.map((r) => [r.id, r]));
const assets = path.join(folder, 'api-photo-evidence');
if (args.includes('--decode')) fs.mkdirSync(assets, { recursive: true });
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const policy = 'standard-thumbnails-v1';
const cooldownFile = path.join(folder, 'media-provider-backoff.json');
let mediaCooldown = fs.existsSync(cooldownFile)
  ? Date.parse(JSON.parse(fs.readFileSync(cooldownFile, 'utf8')).resumeNoEarlierThan) || 0
  : 0;
const stopFile = path.join(folder, 'pause-images');
const retrySeconds = (header, fallback) => {
  if (!header?.trim()) return fallback;
  const number = Number(header);
  return Math.max(
    1,
    Number.isFinite(number) ? number : (Date.parse(header) - Date.now()) / 1000 || fallback,
  );
};
async function respectCooldown() {
  if (fs.existsSync(stopFile)) {
    persist();
    process.exit(2);
  }
  while (Date.now() < mediaCooldown) {
    if (fs.existsSync(stopFile)) {
      persist();
      process.exit(2);
    }
    await delay(Math.min(1000, mediaCooldown - Date.now()));
  }
}
function persist() {
  report.results = plants.map((p) => records.get(p.id)).filter(Boolean);
  report.lastCheckpoint = new Date().toISOString();
  report.counts = Object.fromEntries(
    [
      'available',
      'unavailable',
      'provider-error',
      'invalid-provenance',
      'asset-provider-error',
      'invalid-image',
    ].map((status) => [status, report.results.filter((r) => r.status === status).length]),
  );
  fs.writeFileSync(output, JSON.stringify(report, null, 2));
}
const deliveryReports = ['image-delivery-refresh.json', 'image-subject-review.json']
  .map((name) => path.join(folder, name))
  .filter((file) => fs.existsSync(file))
  .flatMap((file) => JSON.parse(fs.readFileSync(file, 'utf8')).results);
const rejectedDelivery = new Set(
  args.includes('--recheck-delivery')
    ? deliveryReports
        .filter(
          (r) =>
            ['source-unavailable', 'identity-unverified'].includes(r.status) &&
            (records.get(r.id)?.checkedAt ?? '') < r.checkedAt,
        )
        .map((r) => r.id)
    : [],
);
const pending = plants.filter((p) => {
  const r = records.get(p.id);
  const photo = r?.photo;
  const risky =
    photo &&
    (photo.matchedScientific.trim().split(/\s+/).length < 2 ||
      (p.scientific
        .replace(/\b(?:var\.|subsp\.|ssp\.)\s*/g, '')
        .trim()
        .split(/\s+/).length > 2 &&
        photo.matchedScientific.trim().split(/\s+/).length === 2) ||
      /seikei.?zusetsu|flora.de.filipinas|blanco\d|lithograph|engraving/i.test(photo.title) ||
      /\billustration\b|\bdrawing\b|\blithograph\b|\bengraving\b|\bwatercolou?r\b|\bherbarium\b|botanical plate/i.test(
        photo.subject ?? '',
      ));
  return (
    !r ||
    rejectedDelivery.has(p.id) ||
    (args.includes('--recheck-risky') && risky) ||
    (args.includes('--refresh-policy') && r.policy !== policy) ||
    !['available', 'unavailable'].includes(r.status) ||
    (args.includes('--decode') && r.status === 'available' && !r.asset?.decoded)
  );
});
pending.sort((a, b) => {
  const rank = (p) =>
    !records.has(p.id) ? 0 : records.get(p.id).status === 'provider-error' ? 1 : 2;
  return rank(a) - rank(b);
});
if (pending.length) delete report.finishedAt;
console.log(
  `${plants.length} total identities; ${pending.length} pending; decode=${args.includes('--decode')}.`,
);
let batch = 0;
const groupSize = Math.max(1, Math.min(12, Math.floor(Number(option('--batch-size', '12'))) || 12));
for (let offset = 0; offset < pending.length; offset += groupSize) {
  if (fs.existsSync(stopFile)) {
    persist();
    process.exit(2);
  }
  const group = pending.slice(offset, offset + groupSize);
  let response, payload, error;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      response = await fetch(
        `${base}/api/plant-photo?plants=${encodeURIComponent(group.map((p) => p.id).join(','))}`,
        { signal: AbortSignal.timeout(180000) },
      );
      payload = await response.json();
      if (response.ok) break;
      error = `HTTP ${response.status}`;
    } catch (e) {
      error = String(e);
    }
    if (attempt < 3) {
      const seconds = Math.max(30, retrySeconds(response?.headers.get('retry-after'), 60));
      console.log(`Batch ${batch + 1}: ${error}; respecting ${seconds}s backoff.`);
      await delay(seconds * 1000);
    }
  }
  for (const plant of group) {
    const photo = payload?.photos?.[plant.id];
    const valid =
      photo &&
      photo.scientific === plant.scientific &&
      /^https:\/\/(thumb|upload)\.wikimedia\.org\//.test(photo.src) &&
      /^https:\/\/commons\.wikimedia\.org\/wiki\/File:/.test(photo.source) &&
      /^https:\/\/www\.wikidata\.org\/wiki\/Q\d+$/.test(photo.entity) &&
      photo.author &&
      photo.license &&
      photo.licenseUrl;
    const row = {
      id: plant.id,
      policy,
      scientific: plant.scientific,
      checkedAt: new Date().toISOString(),
      status: !response?.ok
        ? 'provider-error'
        : photo
          ? valid
            ? 'available'
            : 'invalid-provenance'
          : 'unavailable',
      ...(photo
        ? {
            title: photo.title,
            source: photo.source,
            entity: photo.entity,
            license: photo.license,
            matchedScientific: photo.matchedScientific,
            photo,
          }
        : {}),
      ...(!response?.ok ? { error } : {}),
    };
    if (args.includes('--decode') && row.status === 'available') {
      try {
        let image;
        for (let attempt = 0; attempt < 3; attempt++) {
          await respectCooldown();
          image = await fetch(photo.src, { signal: AbortSignal.timeout(45000) });
          if (image.ok) break;
          if ([429, 503].includes(image.status)) {
            const seconds = retrySeconds(image.headers.get('retry-after'), 60);
            mediaCooldown = Date.now() + seconds * 1000;
            fs.writeFileSync(
              path.join(folder, 'media-provider-backoff.json'),
              JSON.stringify(
                {
                  observedAt: new Date().toISOString(),
                  retryAfterSeconds: seconds,
                  resumeNoEarlierThan: new Date(mediaCooldown).toISOString(),
                  status: image.status,
                },
                null,
                2,
              ),
            );
          }
          if (![429, 503].includes(image.status) || attempt === 2)
            throw Error(`Image HTTP ${image.status}`);
        }
        if (!image?.ok) throw Error('Image unavailable');
        if (!['upload.wikimedia.org', 'thumb.wikimedia.org'].includes(new URL(image.url).hostname))
          throw Error('Image redirected outside verified hosts');
        const chunks = [];
        let bytes = 0;
        const reader = image.body.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          bytes += value.length;
          if (bytes > 12000000) {
            await reader.cancel();
            throw Error('Image exceeds bounded size');
          }
          chunks.push(value);
        }
        const body = Buffer.concat(chunks),
          sha256 = crypto.createHash('sha256').update(body).digest('hex');
        const file = path.join(assets, `${plant.id}-${sha256.slice(0, 12)}.image`);
        fs.writeFileSync(file, body);
        const script =
          'from PIL import Image; import json,sys; p=sys.argv[1]; im=Image.open(p); im.verify(); im=Image.open(p); print(json.dumps({"width":im.width,"height":im.height,"format":im.format}))';
        const decoded = spawnSync(
          option('--python', 'D:/python app/python.exe'),
          ['-X', 'utf8', '-c', script, file],
          { encoding: 'utf8', windowsHide: true, timeout: 20000 },
        );
        if (decoded.status !== 0)
          throw Error('Image decoder rejected bytes: ' + decoded.stderr.slice(0, 250));
        const shape = JSON.parse(decoded.stdout);
        if (
          !['JPEG', 'PNG', 'WEBP'].includes(shape.format) ||
          shape.width < 32 ||
          shape.height < 32
        ) {
          row.status = 'invalid-image';
          row.error = 'Unexpected/tiny image';
        }
        row.asset = {
          decoded: row.status === 'available',
          ...shape,
          bytes,
          sha256,
          file: path.relative(process.cwd(), file),
          contentType: image.headers.get('content-type'),
        };
      } catch (e) {
        row.status = 'asset-provider-error';
        row.error = String(e);
      }
      await delay(350);
    }
    records.set(plant.id, row);
    persist();
  }
  batch++;
  console.log(
    `${report.results.length}/${plants.length} checked; ${JSON.stringify(report.counts)}`,
  );
}
report.finishedAt = new Date().toISOString();
persist();
console.log('FINAL', JSON.stringify(report.counts));
if (
  ['provider-error', 'invalid-provenance', 'asset-provider-error', 'invalid-image'].some(
    (status) => report.counts[status],
  )
)
  process.exitCode = 1;
