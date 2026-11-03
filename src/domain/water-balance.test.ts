import { describe, it, expect } from 'vitest';
import {
  calculateWaterDay,
  validWaterDayInput,
  validWaterDayRecord,
  type WaterDayInput,
} from './water-balance';
import { validSeasonState } from '../lib/season-store';
import { trackingFarm } from '../../tests/fixtures/tracking-farm';
import { referenceWindow, cycleStatus } from './season-lifecycle';
import { actionsForDay } from './season-actions';
import { addDays } from './evidence-planner';
import { mungCultivars } from '../data/cultivar-references';
import { validSoilEvidence } from './soil-evidence';

// FAO-56 Example 37 inputs, not a user default or field calibration.
export const textbookWater = (): WaterDayInput => ({
  date: '2026-03-01',
  system: 'upland',
  mode: 'scenario',
  fieldCapacity: 0.32,
  wiltingPoint: 0.12,
  initialWater: 0.25125,
  rootDepth: 0.8,
  depletionFraction: 0.4,
  cropCoefficient: 1.2,
  et0: 5,
  rain: 0,
  runoff: 0,
  netIrrigation: 0,
  capillaryRise: 0,
  evidence: 'FAO Example 37, illustrative soil',
  coefficientSource: 'FAO Example 37, illustrative tomato',
  et0Source: 'FAO Example 37, illustrative weather',
});
describe('FAO-56 bounded daily water accounting', () => {
  it('reproduces ten published Example 37 end-of-day depletions', () => {
    const d = textbookWater();
    for (const expected of [61, 67, 72.8, 78.3, 83.4, 88.2, 92.6, 96.9, 100.8, 104.5]) {
      const r = calculateWaterDay(d);
      expect(r.status).toBe('calculated');
      if (r.status !== 'calculated') throw Error();
      expect(r.taw).toBeCloseTo(160);
      expect(r.raw).toBeCloseTo(64);
      expect(Math.abs(r.finalDepletion - expected)).toBeLessThan(0.051);
      d.initialWater = r.finalWater;
    }
  });
  it.each([
    [0.4, 0.3, 0.15, 0.06, 36, 11],
    [0.4, 0.3, 0.32, 0.15, 68, 20],
    [0.4, 0.3, 0.35, 0.23, 48, 14],
    [0.8, 0.4, 0.15, 0.06, 72, 29],
    [0.8, 0.4, 0.32, 0.15, 136, 54],
    [0.8, 0.4, 0.35, 0.23, 96, 38],
    [1.2, 0.55, 0.15, 0.06, 108, 59],
    [1.2, 0.55, 0.32, 0.15, 204, 112],
    [1.2, 0.55, 0.35, 0.23, 144, 79],
  ])(
    'reproduces Example 36 at root depth %s and depletion fraction %s',
    (depth, p, fc, wp, taw, raw) => {
      const r = calculateWaterDay({
        ...textbookWater(),
        rootDepth: depth,
        depletionFraction: p,
        fieldCapacity: fc,
        wiltingPoint: wp,
        initialWater: fc,
      });
      expect(r.status).toBe('calculated');
      if (r.status !== 'calculated') throw Error();
      expect(r.taw).toBeCloseTo(taw);
      expect(Math.abs(r.raw - raw)).toBeLessThanOrEqual(0.50001);
    },
  );
  it('conserves water and physical bounds across 10000 deterministic input cases', () => {
    let seed = 130811;
    const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
    for (let i = 0; i < 10000; i++) {
      const wp = 0.03 + random() * 0.15,
        fc = wp + 0.05 + random() * 0.25,
        rain = random() * 100;
      const d = {
        ...textbookWater(),
        wiltingPoint: wp,
        fieldCapacity: fc,
        initialWater: wp + random() * (fc - wp),
        rootDepth: 0.1 + random() * 2.4,
        depletionFraction: 0.1 + random() * 0.7,
        cropCoefficient: random() * 1.5,
        et0: random() * 8,
        rain,
        runoff: rain * random(),
        netIrrigation: random() * 40,
        capillaryRise: random(),
      };
      const r = calculateWaterDay(d);
      if (r.status === 'smaller-step-needed') continue;
      expect(r.status).toBe('calculated');
      if (r.status !== 'calculated') throw Error();
      const before = 1000 * (d.initialWater - d.wiltingPoint) * d.rootDepth,
        after = r.taw - r.finalDepletion;
      expect(after).toBeCloseTo(
        before + d.rain - d.runoff + d.netIrrigation + d.capillaryRise - r.adjustedEt - r.drainage,
        8,
      );
      expect(r.ks).toBeGreaterThanOrEqual(0);
      expect(r.ks).toBeLessThanOrEqual(1);
      expect(r.finalDepletion).toBeGreaterThanOrEqual(0);
      expect(r.finalDepletion).toBeLessThanOrEqual(r.taw + 1e-7);
    }
  });
  it('rejects incompatible inputs and separates ponded paddy and undersized time steps', () => {
    for (const patch of [
      { fieldCapacity: 0.1 },
      { initialWater: 0.5 },
      { initialWater: 0.01 },
      { rootDepth: 0 },
      { depletionFraction: 1 },
      { et0: NaN },
      { runoff: 1 },
      { evidence: '' },
      { cropCoefficient: Infinity },
    ])
      expect(validWaterDayInput({ ...textbookWater(), ...patch })).toBe(false);
    expect(calculateWaterDay({ ...textbookWater(), system: 'ponded' }).status).toBe('unsupported');
    expect(
      calculateWaterDay({
        ...textbookWater(),
        fieldCapacity: 0.13,
        wiltingPoint: 0.12,
        initialWater: 0.13,
        rootDepth: 0.001,
        et0: 50,
        cropCoefficient: 3,
      }).status,
    ).toBe('smaller-step-needed');
  });
  it('persists evidence without changing a legacy farm and distinguishes scenario prompts', () => {
    const record = {
      ...textbookWater(),
      id: 'water-qa',
      savedAt: '2026-03-01T15:00:00Z',
      initialWater: 0.2,
    };
    expect(validWaterDayRecord(record)).toBe(true);
    const farm = trackingFarm({ plantedDate: '2026-02-01', waterRecords: [record] });
    const state = { version: 1, farms: [farm], activeId: farm.id, confirmedKey: null };
    expect(validSeasonState(state)).toBe(true);
    farm.waterRecords = [record, { ...record, id: 'other-id-same-date' }];
    expect(validSeasonState(state)).toBe(false);
    farm.waterRecords = [record];
    expect(actionsForDay(farm, '2026-03-01', null).some((a) => a.id === 'water-budget-check')).toBe(
      false,
    );
    farm.waterRecords![0] = { ...record, mode: 'reported' };
    expect(actionsForDay(farm, '2026-03-01', null).some((a) => a.id === 'water-budget-check')).toBe(
      true,
    );
    expect(actionsForDay(farm, '2026-03-02', null).some((a) => a.id === 'water-budget-check')).toBe(
      false,
    );
    farm.waterRecords![0].rain = -1;
    expect(validSeasonState(state)).toBe(false);
  });
});
describe('named cultivar and soil evidence boundaries', () => {
  it('uses documented reference intervals, preserves original source dates and supports clearing', () => {
    expect(mungCultivars.map((c) => [c.id, c.durationMin, c.durationMax, c.low, c.high])).toEqual([
      ['bari-mung-2', 60, 65, 30, 35],
      ['bari-mung-8', 60, 62, 30, 35],
      ['bari-mung-5', 55, 60, 45, 50],
      ['bari-mung-6', 55, 60, 45, 50],
      ['bari-mung-7', 60, 62, 45, 50],
    ]);
    const farm = trackingFarm();
    farm.selection = { ...farm.selection, crop: 'mung' };
    farm.site = { ...farm.site, countryCode: 'BD' };
    const original = referenceWindow(farm);
    farm.plantedDate = '2026-03-01';
    farm.cultivarReference = {
      registry: 'csisa-bd-mung-2016',
      varietyId: 'bari-mung-6',
      countryConfirmed: 'BD',
      selectedAt: '2026-03-01T00:00:00Z',
    };
    expect(referenceWindow(farm).early).toBe(addDays(farm.plantedDate, 54));
    expect(referenceWindow(farm).late).toBe(addDays(farm.plantedDate, 59));
    expect(referenceWindow(farm).originalEarly).toBe(original.originalEarly);
    expect(cycleStatus(farm, addDays(farm.plantedDate, 60))).toBe('extended');
    farm.cultivarReference = undefined;
    expect(referenceWindow(farm).cultivar).toBeUndefined();
  });
  it('keeps measured pH and its method/depth/source explicit', () => {
    const evidence = {
      ph: 6.3,
      method: 'water',
      depthCm: 15,
      sampledOn: '2026-03-01',
      source: 'QA laboratory record',
    };
    expect(validSoilEvidence(evidence)).toBe(true);
    for (const patch of [
      { ph: 15 },
      { ph: NaN },
      { depthCm: 0 },
      { method: 'guess' },
      { sampledOn: '2026-02-30' },
      { source: '' },
    ])
      expect(validSoilEvidence({ ...evidence, ...patch })).toBe(false);
  });
});
