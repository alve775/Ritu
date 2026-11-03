/** Synthetic activity/model inputs for tests, with a captured real climate context.
 * The example hybrid and heat requirements are never production recommendations.
 */
import contexts from './world-growing-contexts.json' with { type: 'json' };
import type {
  SeasonContext,
  SeasonFarm,
  MaizeThermalProfile,
  DailyFieldCheckIn,
} from '../../src/domain/global-season';
import { blankFarm } from '../../src/lib/evidence-store';
import { addDays } from '../../src/domain/evidence-planner';
export function trackingFarm(patch: Partial<SeasonFarm> = {}): SeasonFarm {
  const context = contexts[0].context as SeasonContext;
  return {
    id: 'tracking-qa',
    createdAt: '2026-03-01T00:00:00Z',
    field: { ...blankFarm, name: 'Synthetic activity QA', area: 1 },
    site: context.site,
    context,
    selection: {
      crop: 'maize',
      planKind: 'seasonal',
      start: '2026-01-01',
      endEarly: addDays('2026-01-01', 120),
      endLate: addDays('2026-01-01', 120),
      durationMin: 120,
      durationMax: 120,
      basis: 'climate-screen',
      temperature: 25,
      optimalTemperature: true,
      annualRainFit: null,
      cautions: [],
      reasons: [],
    },
    plantedDate: '2026-01-01',
    harvestedDate: '',
    notes: '',
    done: [],
    observations: [],
    ...patch,
  };
}
export const testThermalProfile: MaizeThermalProfile = {
  version: 1,
  crop: 'maize',
  purpose: 'grain',
  method: 'corn-86-50-f',
  origin: 'planting',
  variety: 'Synthetic QA hybrid — not an agronomic recommendation',
  targetGdd: 100,
  sourceUrl: 'https://example.org/test-only-seed-document',
  sourceNote: 'Synthetic test inputs, 86/50 F units from planting.',
};
export function fieldCheck(patch: Partial<DailyFieldCheckIn> = {}): DailyFieldCheckIn {
  return {
    id: 'qa-check',
    date: '2026-03-02',
    stage: 'Flowering',
    confidence: 'sure',
    coverage: 'half',
    water: 'not-checked',
    damage: 'not-checked',
    harvest: 'none',
    milestone: 'none',
    note: 'Test observation',
    ...patch,
  };
}
