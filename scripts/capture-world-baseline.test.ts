import { it } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { suggestSeason } from '../src/domain/plant-screen';
import type { SeasonContext } from '../src/domain/global-season';
import { blankFarm } from '../src/lib/evidence-store';
const folder = 'research/global-audit-2026-11-01';
const output = process.env.RITU_BASELINE_OUTPUT ?? `${folder}/screen-before-refactor.json`;
if (fs.existsSync(output))
  throw Error(
    'Refusing to overwrite historical baseline evidence. Choose a new RITU_BASELINE_OUTPUT path.',
  );
const locations = JSON.parse(fs.readFileSync(`${folder}/world-contexts.json`, 'utf8')) as {
  country: string;
  name: string;
  context: SeasonContext;
}[];
const dates = ['2026-11-01', '2027-02-01', '2027-05-01', '2027-08-01'];
const records: Record<string, { hash: string; count: number }> = {};
for (const location of locations)
  it(`capture unchanged screen outputs: ${location.country}`, () => {
    for (const from of dates) {
      for (const soil of ['unknown', 'loam', 'clay', 'sandy'] as const)
        for (const drainage of ['unknown', 'good', 'poor'] as const)
          for (const irrigation of [
            'reliable',
            'limited',
            'rainfed',
            'severe',
            'unknown',
          ] as const) {
            const result = suggestSeason(
              location.context,
              { ...blankFarm, area: 1, soil, drainage, irrigation },
              from,
            );
            records[[location.country, from, soil, drainage, irrigation].join('|')] = {
              hash: createHash('sha256').update(JSON.stringify(result)).digest('hex'),
              count: result.length,
            };
          }
      fs.writeFileSync(output, JSON.stringify(records));
      console.log(`Baseline ${location.country} ${from}: 60 complete outputs captured.`);
    }
  });
