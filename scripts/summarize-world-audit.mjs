import fs from 'node:fs';
const folder = 'research/global-audit-2026-11-01';
const readJson = (file) => {
  try {
    const bytes = fs.readFileSync(file);
    return JSON.parse(
      bytes
        .toString(bytes[0] === 255 && bytes[1] === 254 ? 'utf16le' : 'utf8')
        .replace(/^\uFEFF/, ''),
    );
  } catch {
    return null;
  }
};
const source = JSON.parse(fs.readFileSync('src/data/global/crop-requirements.json'));
const countries = ['BD', 'US', 'RU', 'BR', 'AU', 'KE'];
const matrices = countries.map((c) => {
  try {
    return JSON.parse(fs.readFileSync(`${folder}/matrix-${c}.json`));
  } catch {
    return null;
  }
});
const quote = (x) => '"' + String(x ?? '').replaceAll('"', '""') + '"';
const gap = (c) => {
  if (c.planKind === 'unknown') return 'Unspecified lifecycle';
  const values = [c.TMIN, c.TOPMN, c.TOPMX, c.TMAX];
  if (!values.every((x) => typeof x === 'number' && Number.isFinite(x)))
    return 'Missing temperature bounds';
  if (!(c.TMIN < c.TMAX && c.TMIN <= c.TOPMN && c.TOPMN <= c.TOPMX && c.TOPMX <= c.TMAX))
    return 'Inconsistent temperature bounds';
  if (!(c.GMIN >= 1 && c.GMAX >= c.GMIN && c.GMAX <= 365))
    return 'Missing or unsupported growing period';
  return '';
};
const rows = source.crops.map((c) => ({
  id: c.id,
  scientific: c.scientific,
  lifeCycle: c.planKind,
  gap: gap(c),
  countries: Object.fromEntries(
    countries.map((country, i) => [country, matrices[i]?.perPlant[c.id]?.profiles ?? 0]),
  ),
}));
fs.writeFileSync(
  `${folder}/every-plant-coverage.csv`,
  [
    ['id', 'scientific', 'lifecycle', 'screeningGap', ...countries],
    ...rows.map((r) => [
      r.id,
      r.scientific,
      r.lifeCycle,
      r.gap,
      ...countries.map((c) => r.countries[c]),
    ]),
  ]
    .map((r) => r.map(quote).join(','))
    .join('\n'),
);
const browserFile = `${folder}/browser-world-results.jsonl`;
const browser = fs.existsSync(browserFile)
  ? fs
      .readFileSync(browserFile, 'utf8')
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line))
  : [];
const photos = JSON.parse(fs.readFileSync(`${folder}/api-coverage-full.json`));
const delivery = readJson(`${folder}/image-delivery-refresh.json`);
const subjectReview = readJson(`${folder}/image-subject-review.json`);
const delivered = new Map();
for (const r of [...(delivery?.results ?? []), ...(subjectReview?.results ?? [])]) {
  if (!delivered.has(r.id) || r.checkedAt > delivered.get(r.id).checkedAt) delivered.set(r.id, r);
}
const queried = new Map(photos.results.map((r) => [r.id, r]));
const latestPhotos = rows.map((plant) => {
  const original = queried.get(plant.id);
  if (!original) return { id: plant.id, status: 'not-attempted' };
  const refreshed = delivered.get(plant.id);
  if (refreshed && refreshed.checkedAt > original.checkedAt) return { ...original, ...refreshed };
  if (
    original.status === 'available' &&
    delivery &&
    !refreshed &&
    original.checkedAt < delivery.startedAt
  )
    return { ...original, status: 'delivery-pending' };
  return original;
});
const latestById = new Map(latestPhotos.map((r) => [r.id, r]));
const countStatuses = (values) =>
  Object.fromEntries(
    [...new Set(values.map((r) => r.status))].map((s) => [
      s,
      values.filter((r) => r.status === s).length,
    ]),
  );
const reruns = readJson(`${folder}/browser-timeout-reruns.json`);
const specials = readJson(`${folder}/browser-specials.json`);
const units = readJson(`${folder}/unit-api-results.json`);
const rawSource = readJson(`${folder}/raw-source-audit.json`);
const packedCalendars = readJson(`${folder}/packed-calendar-audit.json`);
const production = readJson(`${folder}/production-smoke.json`);
const passingReruns = new Set();
const rerunProjects = new Set();
function collect(suites) {
  for (const suite of suites ?? []) {
    for (const spec of suite.specs ?? [])
      for (const test of spec.tests ?? []) {
        rerunProjects.add(test.projectName);
        if (test.results?.at(-1)?.status === 'passed')
          passingReruns.add(test.projectName + '\0' + spec.title);
      }
    collect(suite.suites);
  }
}
collect(reruns?.suites);
const initialFailures = browser.filter((x) => x.type === 'test' && x.status !== 'passed');
const unresolved = initialFailures.filter(
  (x) => !passingReruns.has(x.title.find((t) => rerunProjects.has(t)) + '\0' + x.title.at(-1)),
);
const summary = {
  generatedAt: new Date().toISOString(),
  catalogueEntries: rows.length,
  sourceSha256: source.sha256,
  screeningGaps: Object.fromEntries(
    [...new Set(rows.map((r) => r.gap).filter(Boolean))].map((g) => [
      g,
      rows.filter((r) => r.gap === g).length,
    ]),
  ),
  matrixComplete: matrices.every((x) => x?.passed),
  setupEvaluations: matrices.reduce((n, x) => n + (x?.setupEvaluations ?? 0), 0),
  returnedSelectionsChecked: matrices.reduce((n, x) => n + (x?.returnedSelectionsChecked ?? 0), 0),
  storageRecordsChecked: matrices.reduce((n, x) => n + (x?.storageRecordsChecked ?? 0), 0),
  countries: matrices.map((m, i) => ({
    country: countries[i],
    passed: m?.passed ?? false,
    setupEvaluations: m?.setupEvaluations ?? 0,
    distinctPlants: m?.distinctPlants.length ?? 0,
  })),
  plantsReturnedAtLeastOnce: rows.filter((r) => Object.values(r.countries).some((n) => n > 0))
    .length,
  sourceIntegrity: {
    rawFieldComparisons: rawSource?.rawFieldComparisons ?? 0,
    normalizedMissingLabelComparisons: rawSource?.normalizedMissingLabelComparisons ?? 0,
    errors: rawSource?.errors ?? null,
    calendarCellsCompared: packedCalendars?.gridCellsCompared ?? 0,
    calendarPassed: packedCalendars?.passed ?? false,
  },
  unitApi: {
    total: units?.numTotalTests ?? 0,
    passed: units?.numPassedTests ?? 0,
    success: units?.success ?? false,
  },
  liveProduction: { capturedAt: production?.at ?? null, checks: production?.checks?.length ?? 0 },
  photoAudit: {
    attempted: photos.results.length,
    total: photos.total,
    finishedAt: photos.finishedAt ?? null,
    currentPolicy: photos.results.filter((r) => r.policy === 'standard-thumbnails-v1').length,
    counts: photos.counts,
    delivery: {
      checked: delivery?.results.length ?? 0,
      total: delivery?.total ?? 0,
      finishedAt: delivery?.finishedAt ?? null,
    },
    subjectReview: {
      checked: subjectReview?.results.length ?? 0,
      total: subjectReview?.total ?? 0,
      finishedAt: subjectReview?.finishedAt ?? null,
    },
    currentEvidenceCounts: countStatuses(latestPhotos),
    complete:
      photos.results.length === rows.length &&
      latestPhotos.every((r) => ['available', 'unavailable'].includes(r.status)) &&
      !!subjectReview?.finishedAt &&
      !!photos.finishedAt,
  },
  browser: {
    completed: browser.filter((x) => x.type === 'test').length,
    passed:
      browser.filter((x) => x.type === 'test' && x.status === 'passed').length +
      initialFailures.length -
      unresolved.length,
    initialFailures: initialFailures.length,
    failures: unresolved.length,
    rerunTests: reruns?.stats ?? null,
    additionalFeatures: specials?.stats ?? null,
    finished: browser.at(-1)?.type === 'end' && unresolved.length === 0,
  },
};
fs.writeFileSync(`${folder}/summary.json`, JSON.stringify(summary, null, 2));
fs.mkdirSync('output/audit', { recursive: true });
fs.writeFileSync('output/audit/RITU_Audit_Summary.json', JSON.stringify(summary, null, 2));
const csv = [
  [
    'id',
    'scientific',
    'lifecycle',
    'screeningGap',
    ...countries,
    'photoStatus',
    'photoCheckedAt',
    'photoSource',
    'photoLicense',
    'photoLicenseUrl',
    'photoAuthor',
    'photoMatchedScientific',
  ],
  ...rows.map((r) => {
    const image = latestById.get(r.id),
      p = image?.status === 'available' ? image.photo : null;
    return [
      r.id,
      r.scientific,
      r.lifeCycle,
      r.gap,
      ...countries.map((c) => r.countries[c]),
      image?.status,
      image?.checkedAt,
      p?.source,
      p?.license,
      p?.licenseUrl,
      p?.author,
      p?.matchedScientific,
    ];
  }),
]
  .map((r) => r.map(quote).join(','))
  .join('\n');
fs.writeFileSync('output/audit/RITU_Plant_Audit.csv', '\uFEFF' + csv);
console.log(JSON.stringify(summary, null, 2));
