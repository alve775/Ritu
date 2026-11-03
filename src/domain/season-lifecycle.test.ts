import { describe, it, expect } from 'vitest';
import { trackingFarm, fieldCheck, testThermalProfile } from '../../tests/fixtures/tracking-farm';
import {
  cycleStatus,
  referenceWindow,
  recordFieldCheckIn,
  latestFieldUpdate,
  validCheckIn,
  removeFieldCheckIn,
} from './season-lifecycle';
import { actionsForDay } from './season-actions';
import { validSeasonState } from '../lib/season-store';
import type { SeasonFarm } from './global-season';
const valid = (farm: SeasonFarm) =>
  validSeasonState({ version: 1, farms: [farm], activeId: farm.id, confirmedKey: null });
describe('actual crop lifecycle and field updates', () => {
  it('removes incorrect events, reopens a mistaken completion, and retains unrelated history', () => {
    const base = trackingFarm(),
      partial = fieldCheck({ id: 'partial', harvest: 'started', stage: 'Harvested' }),
      final = fieldCheck({
        id: 'final',
        date: '2026-03-03',
        harvest: 'finished',
        stage: 'Harvested',
      });
    const farm = {
      ...base,
      checkIns: [partial, final],
      harvestStartedDate: partial.date,
      harvestedDate: final.date,
    };
    const corrected = { ...farm, ...removeFieldCheckIn(farm, 'final') };
    expect(corrected.harvestedDate).toBe('');
    expect(corrected.checkIns).toEqual([partial]);
    expect(cycleStatus(corrected, '2026-03-04')).toBe('harvesting');
    expect(valid(corrected)).toBe(true);
    const clean = { ...corrected, ...removeFieldCheckIn(corrected, 'partial') };
    expect(clean.harvestStartedDate).toBe('');
    expect(clean.checkIns).toEqual([]);
    expect(
      removeFieldCheckIn({ ...farm, harvestedDate: '2026-03-04' }, 'final').harvestedDate,
    ).toBe('2026-03-04');
  });
  it('continues beyond the inclusive 120-day reference without finishing the farm', () => {
    const farm = trackingFarm();
    expect(referenceWindow(farm).late).toBe('2026-04-30');
    expect(cycleStatus(farm, '2026-04-30')).toBe('growing');
    expect(cycleStatus(farm, '2026-05-01')).toBe('extended');
    expect(actionsForDay(farm, '2026-05-01', null).map((a) => a.id)).toContain('extended-growth');
    expect(farm.harvestedDate).toBe('');
  });
  it('shifts reference dates with actual planting without rewriting the original plan', () => {
    const farm = trackingFarm({ plantedDate: '2026-01-05' });
    expect(referenceWindow(farm)).toMatchObject({
      early: '2026-05-04',
      late: '2026-05-04',
      originalEarly: '2026-04-30',
    });
    expect(farm.selection.start).toBe('2026-01-01');
  });
  it.each(['2026-03-02', '2026-06-10'])(
    'completes an early or late season only on confirmed final harvest %s',
    (date) => {
      const original = trackingFarm();
      const farm = {
        ...original,
        ...recordFieldCheckIn(
          original,
          fieldCheck({ date, stage: 'Harvested', harvest: 'finished' }),
          '2026-06-20',
        ),
      };
      expect(valid(farm)).toBe(true);
      expect(cycleStatus(farm, date)).toBe('completed');
      expect(actionsForDay(farm, date, null).map((a) => a.id)).toEqual(['post-harvest']);
      expect(farm.selection).toEqual(original.selection);
      expect(farm.checkIns).toHaveLength(1);
    },
  );
  it('keeps partial pickings active and preserves the first picking date', () => {
    const f = trackingFarm();
    const first = {
      ...f,
      ...recordFieldCheckIn(
        f,
        fieldCheck({ stage: 'Harvested', harvest: 'started' }),
        '2026-03-10',
      ),
    };
    const next = {
      ...first,
      ...recordFieldCheckIn(
        first,
        fieldCheck({ id: 'later', date: '2026-03-05', harvest: 'started' }),
        '2026-03-10',
      ),
    };
    expect(next.harvestedDate).toBe('');
    expect(next.harvestStartedDate).toBe('2026-03-02');
    expect(cycleStatus(next, '2026-03-10')).toBe('harvesting');
    expect(actionsForDay(next, '2026-03-10', null).map((a) => a.id)).toContain('harvest-underway');
  });
  it('continues perennial care after harvest and permits a later harvesting round', () => {
    const base = trackingFarm();
    const farm = trackingFarm({
      selection: {
        ...base.selection,
        crop: 'ecocrop-1416',
        planKind: 'perennial-review',
        durationMin: 365,
        durationMax: 365,
        endEarly: '2027-01-01',
        endLate: '2027-01-01',
      },
    });
    const finished = {
      ...farm,
      ...recordFieldCheckIn(
        farm,
        fieldCheck({ stage: 'Harvested', harvest: 'finished' }),
        '2026-06-20',
      ),
    };
    expect(cycleStatus(finished, '2026-06-20')).toBe('perennial');
    expect(actionsForDay(finished, '2026-06-20', null).map((a) => a.id)).toContain(
      'perennial-review',
    );
    const next = {
      ...finished,
      ...recordFieldCheckIn(
        finished,
        fieldCheck({
          id: 'next-round',
          date: '2026-06-19',
          stage: 'Harvested',
          harvest: 'started',
        }),
        '2026-06-20',
      ),
    };
    expect(cycleStatus(next, '2026-06-20')).toBe('harvesting');
    expect(valid(next)).toBe(true);
  });
  it('rejects a Harvested note without a partial/final decision, uncertain milestones, duplicate and impossible events', () => {
    const farm = trackingFarm();
    expect(validCheckIn(fieldCheck({ stage: 'Harvested' }))).toBe(false);
    expect(validCheckIn(fieldCheck({ milestone: 'maize-maturity', confidence: 'unsure' }))).toBe(
      false,
    );
    expect(() =>
      recordFieldCheckIn({ ...farm, plantedDate: '' }, fieldCheck(), '2026-03-10'),
    ).toThrow();
    expect(() =>
      recordFieldCheckIn(farm, fieldCheck({ date: '2025-12-31' }), '2026-03-10'),
    ).toThrow();
    expect(() =>
      recordFieldCheckIn(farm, fieldCheck({ date: '2026-03-11' }), '2026-03-10'),
    ).toThrow();
    expect(() =>
      recordFieldCheckIn({ ...farm, checkIns: [fieldCheck()] }, fieldCheck(), '2026-03-10'),
    ).toThrow();
    expect(() =>
      recordFieldCheckIn({ ...farm, harvestedDate: '2026-03-01' }, fieldCheck(), '2026-03-10'),
    ).toThrow();
  });
  it('uses the latest same-day report, never a future report, and does not extend stale soil claims', () => {
    const farm = trackingFarm({
      observations: [{ date: '2026-03-01', stage: 'Establishing', note: '' }],
      checkIns: [
        fieldCheck({ id: 'first', water: 'dry' }),
        fieldCheck({ id: 'last', stage: 'Fruit / grain filling', water: 'moist' }),
        fieldCheck({ id: 'future', date: '2026-03-20', stage: 'Maturing' }),
      ],
    });
    expect(latestFieldUpdate(farm, '2026-03-02')?.stage).toBe('Fruit / grain filling');
    expect(actionsForDay(farm, '2026-03-03', null).map((a) => a.id)).toContain('filling');
    expect(actionsForDay(farm, '2026-03-03', null).map((a) => a.id)).not.toContain(
      'observed-maturity',
    );
    const dry = { ...farm, checkIns: [fieldCheck({ water: 'dry', damage: 'seen' })] };
    expect(actionsForDay(dry, '2026-03-03', null).map((a) => a.id)).toContain('reported-dry');
    expect(actionsForDay(dry, '2026-03-04', null).map((a) => a.id)).not.toContain('reported-dry');
  });
  it('resolves no-change reports without inventing a stage and ignores uncertain stage-specific advice', () => {
    const farm = trackingFarm({
      checkIns: [
        fieldCheck(),
        fieldCheck({ id: 'unchanged', date: '2026-03-03', stage: 'No change' }),
      ],
    });
    expect(latestFieldUpdate(farm, '2026-03-03')?.stage).toBe('Flowering');
    expect(
      actionsForDay(
        { ...farm, checkIns: [fieldCheck({ confidence: 'unsure' })] },
        '2026-03-02',
        null,
      ).map((a) => a.id),
    ).not.toContain('flowering-water');
    expect(
      latestFieldUpdate({ ...farm, checkIns: [fieldCheck({ stage: 'No change' })] }, '2026-03-02')
        ?.stage,
    ).toBe('Not sure');
  });
  it('keeps existing farms readable and round-trips new optional data while rejecting corrupt state', () => {
    const farm = trackingFarm();
    expect(valid(farm)).toBe(true);
    expect(
      valid(
        JSON.parse(
          JSON.stringify({ ...farm, thermalProfile: testThermalProfile, checkIns: [fieldCheck()] }),
        ),
      ),
    ).toBe(true);
    expect(valid({ ...farm, checkIns: [fieldCheck(), fieldCheck()] })).toBe(false);
    expect(valid({ ...farm, checkIns: [fieldCheck({ date: '2025-01-01' })] })).toBe(false);
    expect(valid({ ...farm, thermalProfile: { ...testThermalProfile, targetGdd: NaN } })).toBe(
      false,
    );
    expect(
      valid({
        ...farm,
        selection: { ...farm.selection, crop: 'rice' },
        thermalProfile: testThermalProfile,
      }),
    ).toBe(false);
  });
});
