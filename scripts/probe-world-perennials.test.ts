import { it } from 'vitest';
import fs from 'node:fs';
import { suggestSeason, requirements } from '../src/domain/plant-screen';
import { blankFarm } from '../src/lib/evidence-store';
const folder = 'research/global-audit-2026-11-01';
it('records off-season growth-temperature review flags without inventing winter hardiness', () => {
  const locations = JSON.parse(fs.readFileSync(`${folder}/world-contexts.json`, 'utf8'));
  const plants = new Map(requirements.crops.map((c) => [c.id, c]));
  const results = locations.map((location) => {
    const choices = suggestSeason(location.context, { ...blankFarm, area: 1 }, '2026-11-01');
    const contradictions = choices.filter(
      (s) =>
        s.planKind === 'perennial-review' &&
        location.context.normal.months.some(
          (m) =>
            m.temperature < plants.get(s.crop)!.TMIN! || m.temperature > plants.get(s.crop)!.TMAX!,
        ),
    );
    return {
      country: location.country,
      contradictions: contradictions.map((c) => ({
        id: c.crop,
        scientific: plants.get(c.crop)!.scientific,
        start: c.start,
        sourceGrowingPeriod: [plants.get(c.crop)!.GMIN, plants.get(c.crop)!.GMAX],
        annualMonthTemperatures: location.context.normal.months.map((m) => m.temperature),
        temperatureBounds: [plants.get(c.crop)!.TMIN, plants.get(c.crop)!.TMAX],
      })),
    };
  });
  fs.writeFileSync(
    `${folder}/perennial-growth-window-review.json`,
    JSON.stringify(
      {
        interpretation:
          'Some months outside an active-growing temperature range are not proof of winter death. These are review flags, not validated hardiness exclusions. Dormancy and verified killing-temperature semantics require separate evidence.',
        locations: results.map((r) => ({ country: r.country, reviewFlags: r.contradictions })),
      },
      null,
      2,
    ),
  );
  console.log(
    results.map((r) => ({
      country: r.country,
      contradictions: r.contradictions.length,
      examples: r.contradictions.slice(0, 3).map((c) => c.scientific),
    })),
  );
});
