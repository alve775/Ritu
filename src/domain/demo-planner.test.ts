import { describe, expect, it } from 'vitest';
import { defaultFarm } from '../data/preview';
import { defaultDemo, demoEnvironment, demoWindows } from '../data/demo-environment';
import { assessDemo, generateDemoPlans, completeCalendar, hasSafeTiming } from './demo-planner';
import { validJourney, activityKey } from '../lib/journey-store';
import type { CropId } from './types';
import { evaluate, coveredMonths } from './evaluate';
import { validDemo } from '../lib/demo-store';
import { isSavedState, initialState } from '../lib/storage';

describe('explicitly fictional planning engine', () => {
  it('generates deterministic complete rotations using only preferred crops and no overlapping slots', () => {
    const plans = generateDemoPlans(defaultFarm, defaultDemo, 'water');
    expect(plans).toHaveLength(2);
    expect(plans).toEqual(generateDemoPlans(defaultFarm, defaultDemo, 'water'));
    for (const plan of plans) {
      expect(new Set(plan.periods.flatMap(coveredMonths)).size).toBe(12);
      expect(plan.periods.flatMap(coveredMonths)).toHaveLength(12);
      expect(
        plan.periods
          .filter((p) => p.crop !== 'fallow')
          .every((p) => defaultDemo.preferred.includes(p.crop)),
      ).toBe(true);
      expect(evaluate(plan, defaultFarm).checks.find((c) => c.id === 'water')?.state).toBe(
        'unknown',
      );
    }
  });
  it('does not fabricate a missing season or silently substitute unsupported crop rules', () => {
    expect(
      generateDemoPlans(defaultFarm, { ...defaultDemo, preferred: ['mung'] }, 'water'),
    ).toEqual([]);
    expect(
      generateDemoPlans(defaultFarm, { ...defaultDemo, preferred: ['tomato', 'cabbage'] }, 'water'),
    ).toEqual([]);
    const unsupported = {
      id: 'u',
      name: { en: 'u', bn: 'u' },
      subtitle: { en: '', bn: '' },
      periods: [{ crop: 'tomato' as const, start: 0, duration: 12 }],
    };
    expect(
      assessDemo(unsupported, defaultFarm, defaultDemo)
        .checks.slice(0, 3)
        .every((c) => c.state === 'unknown'),
    ).toBe(true);
  });
  it('retains unknown soil and water rather than converting them to a fit', () => {
    const farm = { ...defaultFarm, soil: 'unknown' as const, irrigation: 'unknown' as const };
    expect(generateDemoPlans(farm, defaultDemo, 'water')).toEqual([]);
    const result = assessDemo(
      generateDemoPlans(defaultFarm, defaultDemo, 'water')[0],
      farm,
      defaultDemo,
    );
    expect(result.checks.find((c) => c.id === 'soil')?.state).toBe('unknown');
    expect(result.checks.find((c) => c.id === 'water')?.state).toBe('unknown');
    expect(result.demand).toBeNull();
  });
  it('changes ranked candidates for severe shortage without mutating farm or fixture settings', () => {
    const farm = { ...defaultFarm, irrigation: 'reliable' as const };
    const copy = structuredClone(farm),
      settingsCopy = structuredClone(defaultDemo);
    const regular = generateDemoPlans(farm, defaultDemo, 'familiar');
    const scarce = generateDemoPlans({ ...farm, irrigation: 'severe' }, defaultDemo, 'water');
    expect(regular[0].id).not.toBe(scarce[0].id);
    expect(assessDemo(scarce[0], { ...farm, irrigation: 'severe' }, defaultDemo).conflicts).toBe(0);
    expect(farm).toEqual(copy);
    expect(defaultDemo).toEqual(settingsCopy);
  });
  it('refuses impossible household requirements rather than presenting a conflicting candidate', () => {
    const farm = { ...defaultFarm, required: ['potato' as const], unavailableMonths: [0] };
    expect(generateDemoPlans(farm, defaultDemo, 'water')).toEqual([]);
  });
  it('keeps every generated month non-overlapping across the mock condition matrix', () => {
    let produced = 0;
    for (const soil of ['loam', 'clay', 'sandy'] as const)
      for (const drainage of ['good', 'poor'] as const)
        for (const irrigation of ['reliable', 'limited', 'severe', 'rainfed', 'unknown'] as const)
          for (const weather of ['seasonal', 'dry', 'hot'] as const)
            for (const priority of ['water', 'resilience', 'diversity'] as const) {
              const farm = {
                ...defaultFarm,
                soil,
                drainage,
                irrigation,
                required: [],
                unavailableMonths: [0],
              };
              const settings = {
                ...defaultDemo,
                weather,
                preferred: Object.keys(demoWindows) as CropId[],
              };
              for (const plan of generateDemoPlans(farm, settings, priority)) {
                produced++;
                const occupancy = Array(12).fill(0);
                for (const p of plan.periods) {
                  expect(p.start + p.duration).toBeLessThanOrEqual(12);
                  for (let month = p.start; month < p.start + p.duration; month++)
                    occupancy[month]++;
                  if (p.crop !== 'fallow') expect(farm.unavailableMonths).not.toContain(p.start);
                }
                expect(occupancy).toEqual(Array(12).fill(1));
                expect(
                  assessDemo(plan, farm, settings).checks.every((c) => c.state === 'fit'),
                ).toBe(true);
              }
            }
    expect(produced).toBeGreaterThan(0);
  }, 15000);
  it('rejects overlapping, out-of-cycle and malformed windows before completing a calendar', () => {
    expect(
      hasSafeTiming([
        { crop: 'mung', start: 0, duration: 3 },
        { crop: 'aman', start: 2, duration: 4 },
      ]),
    ).toBe(false);
    expect(hasSafeTiming([{ crop: 'boro', start: 10, duration: 4 }])).toBe(false);
    expect(() => completeCalendar([{ crop: 'mung', start: 1.5, duration: 2 }])).toThrow();
  });
  it('selects another passing window when the first suggested planting month has no help', () => {
    const farm = { ...defaultFarm, unavailableMonths: [0], required: [] };
    const settings = { ...defaultDemo, preferred: ['mung', 'aman', 'mustard'] as CropId[] };
    const plans = generateDemoPlans(farm, settings, 'water');
    expect(plans.length).toBeGreaterThan(0);
    expect(plans.every((p) => p.periods.find((w) => w.crop === 'mung')?.start === 1)).toBe(true);
  });
  it('validates saved tracking snapshots and rejects overlaps or harvesting before planting', () => {
    const rotation = generateDemoPlans(defaultFarm, defaultDemo, 'water')[0];
    const records = Object.fromEntries(
      rotation.periods
        .filter((p) => p.crop !== 'fallow')
        .map((p) => [
          activityKey(p.crop, p.start, p.duration),
          { planted: false, harvested: false, note: '' },
        ]),
    );
    const tracked = { rotation, fingerprint: 'fixture', year: 2027, records };
    expect(validJourney({ reviewed: null, generatedFor: null, tracked })).toBe(true);
    const key = Object.keys(records)[0];
    expect(
      validJourney({
        reviewed: null,
        generatedFor: null,
        tracked: {
          ...tracked,
          records: { ...records, [key]: { planted: false, harvested: true, note: '' } },
        },
      }),
    ).toBe(false);
    expect(
      validJourney({
        reviewed: null,
        generatedFor: null,
        tracked: {
          ...tracked,
          rotation: {
            ...rotation,
            periods: [...rotation.periods, { crop: 'mung', start: 0, duration: 1 }],
          },
        },
      }),
    ).toBe(false);
  });
  it('responds to weather and location fixtures and guards malformed stored demo settings', () => {
    expect(demoEnvironment({ ...defaultDemo, weather: 'dry' })[0].rain).toBeLessThan(
      demoEnvironment(defaultDemo)[0].rain,
    );
    expect(demoEnvironment({ ...defaultDemo, weather: 'hot' })[0].temperature).toBeGreaterThan(
      demoEnvironment(defaultDemo)[0].temperature,
    );
    expect(demoEnvironment({ ...defaultDemo, location: 'other' })[0].rain).toBeGreaterThan(
      demoEnvironment(defaultDemo)[0].rain,
    );
    expect(validDemo(defaultDemo)).toBe(true);
    expect(validDemo({ ...defaultDemo, preferred: ['mung', 'mung'] })).toBe(false);
    expect(validDemo({ ...defaultDemo, location: 'unreviewed' })).toBe(false);
    expect(validDemo({ ...defaultDemo, preferred: ['fake'] })).toBe(false);
  });
  it('persists valid generated selection, shortage and added priorities without accepting arbitrary identifiers', () => {
    const value = {
      ...initialState,
      selected: 'demo-mung-aman-mustard',
      priority: 'resilience',
      farm: { ...defaultFarm, irrigation: 'severe' },
    };
    expect(isSavedState(value)).toBe(true);
    expect(isSavedState({ ...value, selected: 'demo-<script>' })).toBe(false);
  });
});
