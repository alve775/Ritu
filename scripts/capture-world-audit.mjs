import fs from 'node:fs';
import crypto from 'node:crypto';
const base = 'http://127.0.0.1:3000';
const folder = 'research/global-audit-2026-11-01';
fs.mkdirSync(folder, { recursive: true });
const sites = [
  {
    name: 'Manikganj, Bangladesh',
    country: 'BD',
    latitude: 23.86186,
    longitude: 90.00273,
    timezone: 'Asia/Dhaka',
  },
  {
    name: 'Washington DC, United States',
    country: 'US',
    latitude: 38.9072,
    longitude: -77.0369,
    timezone: 'America/New_York',
  },
  {
    name: 'Novosibirsk, Russia',
    country: 'RU',
    latitude: 55.0084,
    longitude: 82.9357,
    timezone: 'Asia/Novosibirsk',
  },
  {
    name: 'Sao Paulo, Brazil',
    country: 'BR',
    latitude: -23.5505,
    longitude: -46.6333,
    timezone: 'America/Sao_Paulo',
  },
  {
    name: 'Griffith, Australia',
    country: 'AU',
    latitude: -34.2892,
    longitude: 146.0509,
    timezone: 'Australia/Sydney',
  },
  {
    name: 'Nairobi, Kenya',
    country: 'KE',
    latitude: -1.2864,
    longitude: 36.8172,
    timezone: 'Africa/Nairobi',
  },
];
const captured = [];
for (const site of sites) {
  const q = new URLSearchParams({
    latitude: String(site.latitude),
    longitude: String(site.longitude),
  });
  let context;
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(`${base}/api/season-context?${q}`, {
      signal: AbortSignal.timeout(90000),
    });
    const data = await r.json();
    if (r.ok) {
      context = data.context;
      break;
    }
    console.log(`${site.country}: climate source attempt ${attempt + 1} failed.`);
  }
  if (!context?.normal) throw Error(`Verified climate unavailable for ${site.name}`);
  const rawResponse = await fetch(context.normal.sourceUrl, { signal: AbortSignal.timeout(90000) });
  if (!rawResponse.ok) throw Error(`Original NASA record unavailable for ${site.name}`);
  const bytes = Buffer.from(await rawResponse.arrayBuffer());
  const raw = JSON.parse(bytes.toString());
  const sourceFile = `power-${site.country}.json`;
  fs.writeFileSync(`${folder}/${sourceFile}`, bytes);
  const latitude = Number(site.latitude.toFixed(2)),
    longitude = Number(site.longitude.toFixed(2));
  if (
    !raw.geometry?.coordinates ||
    Math.abs(raw.geometry.coordinates[0] - longitude) > 0.006 ||
    Math.abs(raw.geometry.coordinates[1] - latitude) > 0.006
  )
    throw Error('Original NASA point mismatch');
  if (!raw.header.range.includes('1991') || !raw.header.range.includes('2020'))
    throw Error('Wrong NASA baseline');
  const keys = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'],
    days = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  for (let i = 0; i < 12; i++) {
    const m = context.normal.months[i];
    if (
      m.month !== i + 1 ||
      Math.abs(m.temperature - raw.properties.parameter.T2M[keys[i]]) > 1e-9 ||
      Math.abs(m.rain - raw.properties.parameter.PRECTOTCORR[keys[i]] * days[i]) > 1e-8
    )
      throw Error('App climate does not reproduce original NASA units/values');
  }
  const weatherResponse = await fetch(`${base}/api/weather?${q}`, {
    signal: AbortSignal.timeout(45000),
  });
  const weather = await weatherResponse.json();
  context.site = { ...site };
  captured.push({
    name: site.name,
    country: site.country,
    context,
    weather: weatherResponse.ok ? weather.weather : null,
    weatherError: weatherResponse.ok ? null : weather.error,
    evidence: {
      capturedAt: new Date().toISOString(),
      nasaUrl: context.normal.sourceUrl,
      rawFile: sourceFile,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      baseline: '1991–2020',
      setupIsQAInput: true,
    },
  });
  fs.writeFileSync(`${folder}/world-contexts.json`, JSON.stringify(captured, null, 2));
  console.log(
    `${site.country}: original NASA climate verified; ${context.calendars.length} local calendar records; live forecast ${weatherResponse.status}.`,
  );
}
console.log(
  'PASS: six real environmental contexts captured with original NASA records and hashes.',
);
