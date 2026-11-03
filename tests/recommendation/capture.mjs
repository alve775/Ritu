import fs from 'node:fs';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const out = 'research/recommendation-audit-2026-11-03';
fs.mkdirSync(out, { recursive: true });
if (fs.existsSync(`${out}/contexts.json`))
  throw Error('Existing evidence retained; choose a new output directory before recapture.');
const sites = JSON.parse(fs.readFileSync('tests/fixtures/world-audit-contexts.json', 'utf8'));
const captured = [];
for (const { country, name, context: previous } of sites) {
  const site = previous.site;
  const r = await fetch(
    'http://127.0.0.1:3000/api/season-context?' +
      new URLSearchParams({ latitude: String(site.latitude), longitude: String(site.longitude) }),
    { signal: AbortSignal.timeout(90000) },
  );
  const body = await r.json();
  if (!r.ok || !body.context?.normal) throw Error(name + ': real climate unavailable');
  const context = { ...body.context, site };
  const original = await fetch(context.normal.sourceUrl, { signal: AbortSignal.timeout(60000) });
  if (!original.ok) throw Error(name + ': original NASA response unavailable');
  const bytes = Buffer.from(await original.arrayBuffer()),
    raw = JSON.parse(bytes);
  if (
    !Array.isArray(raw.geometry?.coordinates) ||
    Math.abs(raw.geometry.coordinates[0] - Number(site.longitude.toFixed(2))) > 0.006 ||
    Math.abs(raw.geometry.coordinates[1] - Number(site.latitude.toFixed(2))) > 0.006
  )
    throw Error(name + ': original NASA point mismatch');
  const keys = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  if (
    raw.parameters.T2M.units !== 'C' ||
    raw.parameters.PRECTOTCORR.units !== 'mm/day' ||
    !raw.header.range.includes('1991') ||
    !raw.header.range.includes('2020')
  )
    throw Error('Wrong units/period');
  for (let i = 0; i < 12; i++) {
    let totalDays = 0;
    for (let year = 1991; year <= 2020; year++)
      totalDays += new Date(Date.UTC(year, i + 1, 0)).getUTCDate();
    const m = context.normal.months[i];
    if (
      Math.abs(m.temperature - raw.properties.parameter.T2M[keys[i]]) > 1e-9 ||
      Math.abs(m.rain - (raw.properties.parameter.PRECTOTCORR[keys[i]] * totalDays) / 30) > 1e-8
    )
      throw Error(name + ': source conversion mismatch');
  }
  fs.writeFileSync(`${out}/power-${country}.json`, bytes);
  captured.push({
    country,
    name,
    context,
    evidence: {
      retrievedAt: new Date().toISOString(),
      url: context.normal.sourceUrl,
      sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      sourceFile: `power-${country}.json`,
      landInputsAreQA: true,
    },
  });
  fs.writeFileSync(`${out}/contexts-progress.json`, JSON.stringify(captured, null, 2));
  console.log(
    `${country}: actual NASA record and app conversion verified; ${context.calendars.length} historical calendar records.`,
  );
}
fs.writeFileSync(`${out}/contexts.json`, JSON.stringify(captured, null, 2));
const requirements = JSON.parse(fs.readFileSync('src/data/global/crop-requirements.json', 'utf8'));
const csvResponse = await fetch(requirements.sourceUrl, { signal: AbortSignal.timeout(60000) });
if (!csvResponse.ok) throw Error('Pinned source unavailable');
const csv = Buffer.from(await csvResponse.arrayBuffer()),
  hash = crypto.createHash('sha256').update(csv).digest('hex');
if (hash !== requirements.sha256) throw Error('Pinned crop source hash differs');
fs.writeFileSync(`${out}/ecocrop-source.csv`, csv);
fs.writeFileSync(
  `${out}/source-manifest.json`,
  JSON.stringify(
    {
      url: requirements.sourceUrl,
      sha256: hash,
      capturedAt: new Date().toISOString(),
      records: requirements.sourceCount,
    },
    null,
    2,
  ),
);
const before = execFileSync('git', ['show', 'HEAD:src/domain/plant-screen.ts'], {
  encoding: 'utf8',
})
  .replaceAll("'../data/global/", "'../../src/data/global/")
  .replaceAll("'./types'", "'../../src/domain/types'")
  .replaceAll("'./global-season'", "'../../src/domain/global-season'")
  .replaceAll("'./evidence-planner'", "'../../src/domain/evidence-planner'");
fs.writeFileSync(`${out}/before-screen.ts`, before);
console.log(
  'CAPTURE PASS: six source-bound contexts, original CSV and preserved before-change engine.',
);
