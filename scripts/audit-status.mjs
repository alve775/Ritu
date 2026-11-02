import fs from 'node:fs';
import os from 'node:os';
console.log({
  freeMB: Math.round(os.freemem() / 1048576),
  totalMB: Math.round(os.totalmem() / 1048576),
});
for (const country of ['BD', 'US', 'RU', 'BR', 'AU', 'KE']) {
  try {
    const x = JSON.parse(
      fs.readFileSync(`research/global-audit-2026-11-01/matrix-${country}.json`),
    );
    console.log(country, x.passed, x.setupEvaluations, x.elapsedSeconds);
  } catch {}
}
try {
  const x = JSON.parse(fs.readFileSync('research/global-audit-2026-11-01/api-coverage-full.json'));
  console.log(x.lastCheckpoint, x.results.length, x.counts);
} catch {}
try {
  const x = JSON.parse(
    fs.readFileSync('research/global-audit-2026-11-01/image-delivery-refresh.json'),
  );
  console.log(
    'Image delivery',
    x.results.length + '/' + x.total,
    x.lastCheckpoint,
    Object.fromEntries(
      [...new Set(x.results.map((r) => r.status))].map((s) => [
        s,
        x.results.filter((r) => r.status === s).length,
      ]),
    ),
  );
} catch {}
