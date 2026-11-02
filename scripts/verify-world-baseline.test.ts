import { expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { suggestSeason } from '../src/domain/plant-screen';
import type { SeasonContext } from '../src/domain/global-season';
import { blankFarm } from '../src/lib/evidence-store';
const folder = 'research/global-audit-2026-11-01';
const locations = JSON.parse(fs.readFileSync(`${folder}/world-contexts.json`, 'utf8')) as {
  country: string;
  context: SeasonContext;
}[];
const baseline = JSON.parse(
  fs.readFileSync(`${folder}/screen-before-refactor.json`, 'utf8'),
) as Record<string, { hash: string; count: number }>;
for (const location of locations)
  it(`optimization preserves all 240 complete outputs: ${location.country}`, () => {
    for (const from of ['2026-11-01', '2027-02-01', '2027-05-01', '2027-08-01'])
      for (const soil of ['unknown', 'loam', 'clay', 'sandy'] as const)
        for (const drainage of ['unknown', 'good', 'poor'] as const)
          for (const irrigation of [
            'reliable',
            'limited',
            'rainfed',
            'severe',
            'unknown',
          ] as const) {
            const output = suggestSeason(
              location.context,
              { ...blankFarm, area: 1, soil, drainage, irrigation },
              from,
            );
            const key = [location.country, from, soil, drainage, irrigation].join('|');
            expect(createHash('sha256').update(JSON.stringify(output)).digest('hex'), key).toBe(
              baseline[key].hash,
            );
          }
  });
