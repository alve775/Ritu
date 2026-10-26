import { describe, it, expect } from 'vitest';
import {
  addDays,
  referencePeriods,
  noOverlap,
  evidencePlans,
  referenceWeekStart,
} from './evidence-planner';
import { regionalCalendars } from '../data/regional-calendars';
import {
  blankFarm,
  emptyEvidenceState,
  profileKey,
  validEvidenceState,
} from '../lib/evidence-store';
import { seedQuantity, germination, cropFieldChecks } from '../data/crop-practices';
import type { CropId } from './types';
const farm = { ...blankFarm, area: 1.2, irrigation: 'limited' as const, drainage: 'good' as const };
const choose: CropId[] = ['wheat', 'mung', 'aman', 'mustard', 'maize'];
const plans = () => evidencePlans('2026-10-26', choose, farm, 'diversity');
describe('source-based rotation references', () => {
  it('starts with no assumed farm observations', () => {
    expect(emptyEvidenceState.site).toBeUndefined();
    expect(blankFarm.area).toBe(0);
    expect(blankFarm.irrigation).toBe('unknown');
    expect(blankFarm.current).toEqual([]);
    expect(emptyEvidenceState.from).toBe('');
    expect(validEvidenceState(emptyEvidenceState)).toBe(true);
  });
  it('retains exact original maximum durations across years and leap days', () => {
    for (const p of referencePeriods('2027-01-01')) {
      const c = regionalCalendars.find((c) => c.id === p.crop)!;
      expect(p.end).toBe(addDays(p.start, c.duration.max));
      expect(p.durationDays).toBe(c.duration.max);
      expect(p.source).toBe(c.source.document);
    }
    expect(addDays('2028-02-28', 2)).toBe('2028-03-01');
    expect(referenceWeekStart(2027, 46)).toBe('2027-11-12');
  });
  it('generates up to three distinct, ordered and non-overlapping sourced sequences', () => {
    const result = plans();
    expect(result).toHaveLength(3);
    expect(new Set(result.map((x) => x.id)).size).toBe(3);
    expect(result[0].periods[0].crop).toBe('mustard');
    expect(result[0].familyCount).toBe(3);
    for (const p of result) {
      expect(noOverlap(p.periods)).toBe(true);
      expect(p.periods).toHaveLength(3);
    }
  });
  it('never fabricates a result for missing choices, unmet household crops or absent help', () => {
    expect(evidencePlans('2026-10-26', ['aman'], farm, 'water')).toEqual([]);
    expect(evidencePlans('2026-10-26', choose, { ...farm, required: ['potato'] }, 'water')).toEqual(
      [],
    );
    expect(
      evidencePlans(
        '2026-10-26',
        choose,
        { ...farm, unavailableMonths: Array.from({ length: 12 }, (_, i) => i) },
        'water',
      ),
    ).toEqual([]);
  });
  it('can leave a season unplanted only after an explicit choice', () => {
    const a = evidencePlans('2026-10-26', ['boro', 'aman'], farm, 'water');
    expect(a).toEqual([]);
    const b = evidencePlans('2026-10-26', ['boro', 'aman'], farm, 'water', ['pre-monsoon']);
    expect(b).toHaveLength(1);
    expect(b[0].periods.map((x) => x.crop)).toEqual(['boro', 'aman']);
    expect(b[0].periods[0].durationDays).toBe(155);
    expect(b[0].gaps.length).toBe(1);
    expect(
      evidencePlans('2026-10-26', choose, farm, 'water', ['winter', 'pre-monsoon', 'monsoon']),
    ).toEqual([]);
  });
  it('does not shorten Aus or Boro to make a three-crop sequence fit', () => {
    expect(evidencePlans('2026-10-26', ['boro', 'mung', 'aman'], farm, 'water')).toEqual([]);
    expect(evidencePlans('2026-10-26', ['wheat', 'aus', 'aman'], farm, 'water')).toEqual([]);
  });
  it('enforces the source-backed mung standing-water constraint', () => {
    expect(cropFieldChecks('mung', { ...farm, drainage: 'poor' }).blocked).toBe(true);
    expect(evidencePlans('2026-10-26', choose, { ...farm, drainage: 'poor' }, 'water')).toEqual([]);
    expect(cropFieldChecks('mung', { ...farm, drainage: 'unknown' }).blocked).toBe(false);
  });
  it.each(['2026-02-30', 'wrong', '1999-01-01', '2099-01-01'])(
    'rejects invalid or unsupported start %s',
    (d) => {
      expect(referencePeriods(d)).toEqual([]);
    },
  );
  it('counts actual families without invented water or drought scores', () => {
    const a = evidencePlans('2026-10-26', choose, farm, 'water'),
      b = evidencePlans('2026-10-26', choose, farm, 'resilience');
    expect(a).toEqual(b);
    expect(a[0]).not.toHaveProperty('waterScore');
  });
});
describe('saved evidence and recovery boundary', () => {
  const saved = () => {
    const state = structuredClone(emptyEvidenceState),
      plan = plans()[0];
    state.farm = farm;
    state.from = '2026-10-26';
    state.site = { latitude: 24.37, longitude: 88.6, name: 'Entered field' };
    state.tracked = {
      plan,
      site: state.site,
      profileKey: profileKey(state),
      savedAt: '2026-10-26T00:00:00Z',
      records: Object.fromEntries(plan.periods.map((p) => [`${p.crop}:${p.start}`, { note: '' }])),
    };
    return state;
  };
  it('accepts a valid saved source sequence with actual blank records', () =>
    expect(validEvidenceState(saved())).toBe(true));
  it.each([
    'duration',
    'source',
    'date',
    'record-key',
    'harvest-order',
    'plan-id',
    'gap',
    'unplanted',
  ])('rejects altered %s instead of trusting stale or fabricated saved data', (kind) => {
    const s = saved(),
      p = s.tracked!.plan.periods[0],
      r = s.tracked!.records[`${p.crop}:${p.start}`];
    if (kind === 'duration') p.durationDays--;
    if (kind === 'source') p.source = 'https://example.com';
    if (kind === 'date') p.start = '9999-01-01';
    if (kind === 'record-key') s.tracked!.records = {};
    if (kind === 'harvest-order') {
      r.plantedDate = '2026-10-20';
      r.harvestedDate = '2026-10-01';
    }
    if (kind === 'plan-id') s.tracked!.plan.id = 'regional-fake';
    if (kind === 'gap') s.tracked!.plan.gaps = [];
    if (kind === 'unplanted') s.unplanted = ['winter', 'winter'];
    expect(validEvidenceState(s)).toBe(false);
  });
  it('changes profile identity for real inputs without treating NASA refresh as a changed farm', () => {
    const a = profileKey(emptyEvidenceState);
    expect(profileKey({ ...emptyEvidenceState, farm: { ...blankFarm, area: 2 } })).not.toBe(a);
    expect(profileKey({ ...emptyEvidenceState })).toBe(a);
  });
});
describe('published arithmetic tools', () => {
  it('requires a named variety and real area', () => {
    expect(seedQuantity(0, '')).toBeNull();
    expect(seedQuantity(1.2, '')).toBeNull();
  });
  it('rejects impossible seedling counts and calculates actual observations', () => {
    expect(germination(43, 50)).toBe(86);
    expect(germination(0, 50)).toBe(0);
    expect(germination(51, 50)).toBeNull();
    expect(germination(1.5, 50)).toBeNull();
  });
});
