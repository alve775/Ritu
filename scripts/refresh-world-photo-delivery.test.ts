/** Recheck delivery of previously API-identified files without repeating taxon search.
 * Separate evidence report: never modifies production image assignments or prior audits.
 */
import { it } from 'vitest';
import fs from 'node:fs';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { wikimediaApi } from '../src/lib/wikimedia-api';
import {
  commonThumbnailWidths,
  isStandardThumbnail,
  parseCommonsPhoto,
  type CommonsImageInfo,
  type PlantPhoto,
} from '../src/domain/plant-photo';
const folder = 'research/global-audit-2026-11-01';
const subjectReview = process.env.RITU_IMAGE_SUBJECT_REVIEW === '1';
const output = `${folder}/${subjectReview ? 'image-subject-review' : 'image-delivery-refresh'}.json`;
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
interface Row {
  id: string;
  scientific: string;
  photo: PlantPhoto;
  policy?: string;
  checkedAt?: string;
  asset?: Result['asset'] & { decoded?: boolean };
  status?: string;
}
interface Result {
  id: string;
  checkedAt: string;
  status: string;
  photo?: PlantPhoto;
  error?: string;
  downloadEvidence?: string;
  info?: CommonsImageInfo;
  asset?: {
    file: string;
    sha256: string;
    width: number;
    height: number;
    format: string;
    bytes: number;
  };
}
interface Wiki {
  query?: { pages?: Record<string, { title: string; imageinfo?: CommonsImageInfo[] }> };
}
it('refreshes standard-thumbnail delivery for each previously identified source photograph', async () => {
  const previous = JSON.parse(fs.readFileSync(`${folder}/api-coverage-full.json`, 'utf8')) as {
    results: Row[];
  };
  const delivery = subjectReview
    ? JSON.parse(fs.readFileSync(`${folder}/image-delivery-refresh.json`, 'utf8'))
    : { results: [] };
  const delivered = new Map<string, Row>(delivery.results.map((r: Row) => [r.id, r]));
  const rows = previous.results
    .map((r) => {
      const newer = delivered.get(r.id);
      return newer && (newer.checkedAt ?? '') > (r.checkedAt ?? '')
        ? {
            ...r,
            ...newer,
            asset: newer.asset
              ? { ...newer.asset, decoded: newer.status === 'available' }
              : undefined,
          }
        : r;
    })
    .filter((r) => r.photo && (!subjectReview || r.status === 'available'));
  const report = fs.existsSync(output)
    ? JSON.parse(fs.readFileSync(output, 'utf8'))
    : { startedAt: new Date().toISOString(), results: [] };
  const results = new Map<string, Result>((report.results as Result[]).map((r) => [r.id, r]));
  const put = (id: string, row: Omit<Result, 'checkedAt'>) =>
    results.set(id, { ...row, checkedAt: new Date().toISOString() });
  // A source variety redirected to a broader binomial needs the full taxon
  // resolver again; file delivery alone cannot establish that alias relation.
  for (const row of rows) {
    const words = (name: string) =>
      name
        .replace(/\b(?:var\.|subsp\.|ssp\.)\s*/g, '')
        .trim()
        .split(/\s+/);
    if (words(row.scientific).length > 2 && words(row.photo.matchedScientific).length === 2)
      put(row.id, { id: row.id, status: 'identity-unverified' });
  }
  const persist = () => {
    report.results = rows.map((r) => results.get(r.id)).filter(Boolean);
    report.lastCheckpoint = new Date().toISOString();
    report.total = rows.length;
    fs.writeFileSync(output, JSON.stringify(report, null, 2));
  };
  const request = async (titles: string[], width: number) => {
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        return (await wikimediaApi('commons', {
          action: 'query',
          prop: 'imageinfo',
          iiprop: 'url|extmetadata|mime|size',
          iiurlwidth: String(width),
          titles: titles.join('|'),
        })) as Wiki;
      } catch (error) {
        if (attempt === 3) throw error;
        const seconds = (error as { retryAfterSeconds?: number }).retryAfterSeconds ?? 60;
        await delay(seconds * 1000);
      }
    }
    throw Error('Provider unavailable');
  };
  const pending = rows.filter(
    (r) =>
      results.get(r.id)?.status !== 'available' &&
      !['source-unavailable', 'identity-unverified'].includes(results.get(r.id)?.status ?? ''),
  );
  let mediaCooldown = 0;
  const cooldownFile = `${folder}/media-provider-backoff.json`;
  if (fs.existsSync(cooldownFile))
    mediaCooldown =
      Date.parse(JSON.parse(fs.readFileSync(cooldownFile, 'utf8')).resumeNoEarlierThan) || 0;
  for (let offset = 0; offset < pending.length; offset += 40) {
    if (fs.existsSync(`${folder}/pause-image-delivery`)) {
      persist();
      throw Error('Cooperatively paused at checkpoint');
    }
    const group = pending.slice(offset, offset + 40),
      infos = new Map<string, CommonsImageInfo>();
    const collect = (data: Wiki) => {
      for (const p of Object.values(data.query?.pages ?? {}))
        if (p.imageinfo?.[0]) infos.set(p.title.replaceAll('_', ' '), p.imageinfo[0]);
    };
    try {
      collect(await request([...new Set(group.map((r) => r.photo.title))], 500));
      const smaller = new Map<number, string[]>();
      for (const [title, info] of infos) {
        if (
          isStandardThumbnail(info.thumburl ?? '') ||
          typeof info.width !== 'number' ||
          info.width < 64
        )
          continue;
        const size = [...commonThumbnailWidths].reverse().find((v) => v < info.width! && v <= 500);
        if (size) smaller.set(size, [...(smaller.get(size) ?? []), title]);
      }
      for (const [size, titles] of smaller) collect(await request(titles, size));
    } catch (error) {
      for (const row of group)
        put(row.id, { id: row.id, status: 'provider-error', error: String(error) });
      persist();
      continue;
    }
    for (const row of group) {
      const info = infos.get(row.photo.title.replaceAll('_', ' '));
      const entity = row.photo.entity.split('/').at(-1)!;
      const photo = info
        ? parseCommonsPhoto(
            info,
            row.photo.title,
            row.scientific,
            row.photo.matchedScientific,
            entity,
          )
        : null;
      if (!photo) {
        put(row.id, { id: row.id, status: 'source-unavailable', info });
        persist();
        continue;
      }
      // Reuse an already decoded, hash-checked download only when fresh Commons
      // metadata returns exactly the same standard thumbnail URL. Keep its
      // earlier capture time explicit rather than calling it a new download.
      if (row.photo.src === photo.src && row.asset?.decoded && fs.existsSync(row.asset.file)) {
        const body = fs.readFileSync(row.asset.file);
        if (crypto.createHash('sha256').update(body).digest('hex') === row.asset.sha256) {
          put(row.id, {
            id: row.id,
            status: 'available',
            photo,
            asset: row.asset,
            info,
            downloadEvidence: 'Prior decoded exact-URL bytes, captured ' + row.checkedAt,
          });
          persist();
          continue;
        }
      }
      try {
        if (Date.now() < mediaCooldown) await delay(mediaCooldown - Date.now());
        const response = await fetch(photo.src, { signal: AbortSignal.timeout(45000) });
        if ([429, 503].includes(response.status)) {
          const header = response.headers.get('retry-after');
          const numeric = header?.trim() ? Number(header) : NaN;
          const seconds = Math.max(
            1,
            Number.isFinite(numeric)
              ? numeric
              : header
                ? (Date.parse(header) - Date.now()) / 1000
                : 60,
          );
          mediaCooldown = Date.now() + seconds * 1000;
          fs.writeFileSync(
            cooldownFile,
            JSON.stringify(
              {
                observedAt: new Date().toISOString(),
                retryAfterSeconds: seconds,
                resumeNoEarlierThan: new Date(mediaCooldown).toISOString(),
                status: response.status,
              },
              null,
              2,
            ),
          );
        }
        if (!response.ok) throw Error(`Image HTTP ${response.status}`);
        if (
          !['upload.wikimedia.org', 'thumb.wikimedia.org'].includes(new URL(response.url).hostname)
        )
          throw Error('Unexpected media redirect');
        const chunks: Uint8Array[] = [];
        let bytes = 0;
        for await (const chunk of response.body!) {
          bytes += chunk.length;
          if (bytes > 12000000) throw Error('Oversized media');
          chunks.push(chunk);
        }
        const body = Buffer.concat(chunks),
          sha256 = crypto.createHash('sha256').update(body).digest('hex');
        const file = `${folder}/api-photo-evidence/${row.id}-${sha256.slice(0, 12)}.image`;
        fs.writeFileSync(file, body);
        const decoded = spawnSync(
          'D:/python app/python.exe',
          [
            '-X',
            'utf8',
            '-c',
            'from PIL import Image; import json,sys; im=Image.open(sys.argv[1]); im.verify(); im=Image.open(sys.argv[1]); print(json.dumps({"width":im.width,"height":im.height,"format":im.format}))',
            file,
          ],
          { encoding: 'utf8', windowsHide: true, timeout: 20000 },
        );
        if (decoded.status !== 0) throw Error('Decoder rejected image');
        const shape = JSON.parse(decoded.stdout);
        if (
          !['JPEG', 'PNG', 'WEBP'].includes(shape.format) ||
          shape.width < 32 ||
          shape.height < 32
        )
          throw Error('Unsupported or tiny image');
        put(row.id, {
          id: row.id,
          status: 'available',
          downloadEvidence: 'Fresh HTTP response and decoder check',
          photo,
          info,
          asset: { ...shape, file, bytes, sha256 },
        });
      } catch (error) {
        put(row.id, {
          id: row.id,
          status: 'asset-provider-error',
          photo,
          error: String(error),
        });
      }
      persist();
      await delay(350);
    }
    console.log(`Delivery: ${Math.min(offset + 40, pending.length)}/${pending.length} refreshed`);
  }
  report.finishedAt = new Date().toISOString();
  persist();
}, 3600000);
