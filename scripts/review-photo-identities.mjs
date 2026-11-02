import fs from 'node:fs';
const folder = 'research/global-audit-2026-11-01';
const report = JSON.parse(fs.readFileSync(`${folder}/api-coverage-full.json`));
const normal = (x) =>
  x
    .toLowerCase()
    .normalize('NFC')
    .replace(/\s*×\s*/g, ' x ')
    .replace(/\s+(?:var\.|subsp\.|ssp\.)\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
const rows = report.results
  .filter((r) => r.photo && normal(r.scientific) !== normal(r.matchedScientific))
  .map((r) => ({
    id: r.id,
    scientific: r.scientific,
    matched: r.matchedScientific,
    title: r.title,
    source: r.source,
    entity: r.entity,
    higherRank: normal(r.matchedScientific).split(' ').length < 2,
    broaderInfraspecies:
      normal(r.scientific).split(' ').length > 2 &&
      normal(r.matchedScientific).split(' ').length === 2,
  }));
fs.writeFileSync(
  `${folder}/photo-name-differences.json`,
  JSON.stringify(
    {
      checked: report.results.length,
      nonExactNames: rows.length,
      higherRank: rows.filter((r) => r.higherRank).length,
      broaderInfraspecies: rows.filter((r) => r.broaderInfraspecies).length,
      rows,
    },
    null,
    2,
  ),
);
console.log(
  JSON.stringify({
    nonExactNames: rows.length,
    higherRank: rows.filter((r) => r.higherRank),
    broaderInfraspecies: rows.filter((r) => r.broaderInfraspecies),
  }),
);
