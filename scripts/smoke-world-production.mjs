import fs from 'node:fs';
import assert from 'node:assert/strict';
const base = 'http://127.0.0.1:3015';
const report = { at: new Date().toISOString(), checks: [] };
for (let attempt = 0; attempt < 30; attempt++) {
  try {
    if ((await fetch(base, { signal: AbortSignal.timeout(3000) })).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 500));
}
for (const route of ['/', '/farm', '/crops', '/plan', '/farms']) {
  const response = await fetch(base + route);
  assert.equal(response.status, 200);
  assert((await response.text()).includes('RITU'));
  report.checks.push({ route, status: response.status });
}
const query = new URLSearchParams({ latitude: '23.86186', longitude: '90.00273' });
const response = await fetch(`${base}/api/season-context?${query}`, {
  signal: AbortSignal.timeout(60000),
});
const data = await response.json();
assert.equal(response.status, 200);
assert(data.context.normal);
assert.equal(data.context.normal.period, '1991–2020');
assert.equal(data.context.site.latitude, 23.86186);
assert(
  data.context.normal.sourceUrl.startsWith(
    'https://power.larc.nasa.gov/api/temporal/climatology/point?',
  ),
);
report.checks.push({
  route: '/api/season-context',
  source: data.context.normal.sourceUrl,
  retrievedAt: data.context.normal.retrievedAt,
});
const from = new Date().toISOString().slice(0, 10);
const search = new URLSearchParams({
  ...Object.fromEntries(query),
  area: '1',
  soil: 'clay',
  drainage: 'unknown',
  irrigation: 'rainfed',
  from,
  q: 'wheat',
  category: 'food',
  cycle: 'all',
  mode: 'matches',
  page: '1',
});
const plants = await fetch(`${base}/api/plants?${search}`, { signal: AbortSignal.timeout(60000) });
const result = await plants.json();
assert.equal(plants.status, 200);
assert(result.items.some((r) => r.plant.id === 'wheat' && r.suggestion));
report.checks.push({
  route: '/api/plants',
  count: result.count,
  wheat: result.items.find((r) => r.plant.id === 'wheat'),
});
const image = await fetch(`${base}/api/plant-photo?plant=tomato`, {
  signal: AbortSignal.timeout(90000),
});
const photo = await image.json();
assert.equal(image.status, 200);
assert(photo.photo);
assert.equal(photo.photo.scientific, 'Lycopersicon esculentum');
assert(photo.photo.src.includes('/thumb/'));
assert(photo.photo.matchedScientific.split(' ').length >= 2);
report.checks.push({ route: '/api/plant-photo', photo: photo.photo });
report.passed = true;
fs.writeFileSync(
  'research/global-audit-2026-11-01/production-smoke.json',
  JSON.stringify(report, null, 2),
);
console.log(
  `${report.checks.length} production checks passed with actual NASA and image-provider responses.`,
);
