import { describe, expect, it } from 'vitest';
import { defaultFarm } from '../data/preview';
import { coveredMonths, evaluate, preferredOption, rotationsFor, segments } from './evaluate';
import type { Farm } from './types';
const assess = (changes: Partial<Farm> = {}) => {
  const farm = { ...defaultFarm, ...changes };
  return rotationsFor(farm).map((r) => evaluate(r, farm));
};
describe('preview constraint evaluation', () => {
  it('keeps every example unassessed until agronomic evidence is available', () => {
    expect(assess().map((e) => e.status)).toEqual(['confirm', 'confirm', 'confirm']);
  });
  it('re-evaluates reliable, rainfed and unknown water without silently passing unknowns', () => {
    expect(assess({ irrigation: 'reliable' }).map((e) => e.status)).toEqual([
      'confirm',
      'confirm',
      'confirm',
    ]);
    expect(assess({ irrigation: 'rainfed' }).map((e) => e.status)).toEqual([
      'confirm',
      'confirm',
      'confirm',
    ]);
    expect(assess({ irrigation: 'unknown' }).map((e) => e.status)).toEqual([
      'confirm',
      'confirm',
      'confirm',
    ]);
  });
  it('keeps known blockers ahead of missing soil information', () => {
    const result = assess({ soil: 'unknown', required: ['pulses'] });
    expect(result[0].status).toBe('blocked');
    expect(result[0].checks.find((c) => c.id === 'soil')?.state).toBe('unknown');
    expect(result[1].status).toBe('confirm');
  });
  it('never invents a crop drainage threshold from a reported category', () => {
    expect(assess({ irrigation: 'reliable', drainage: 'poor' }).map((e) => e.status)).toEqual([
      'confirm',
      'confirm',
      'confirm',
    ]);
  });
  it('does not treat unknown drainage as known suitability', () => {
    expect(
      assess({ irrigation: 'reliable', drainage: 'unknown' }).every((e) => e.status === 'confirm'),
    ).toBe(true);
  });
  it('preserves household crop requirements', () => {
    expect(
      assess({ required: ['rice', 'pulses'] })[0].checks.find((c) => c.id === 'household')?.state,
    ).toBe('block');
    expect(assess({ required: ['potato'] }).map((e) => e.status)).toEqual([
      'blocked',
      'blocked',
      'confirm',
    ]);
  });
  it('checks planting and harvest labor in the same shared month coordinate system', () => {
    expect(assess({ unavailableMonths: [8] }).every((e) => e.status === 'blocked')).toBe(true);
  });
  it('recognizes overlap after a crop crosses the calendar boundary', () => {
    const current = [
      { crop: 'boro' as const, start: 10, duration: 4 },
      { crop: 'mung' as const, start: 0, duration: 3 },
    ];
    expect(assess({ current })[0].checks.find((c) => c.id === 'calendar')?.state).toBe('block');
  });
  it('leaves unspecified months unknown instead of assuming fallow', () => {
    expect(
      assess({ irrigation: 'reliable', current: [{ crop: 'aman', start: 4, duration: 4 }] })[0]
        .status,
    ).toBe('confirm');
  });
  it('does not rank a crop-free year as a valid rotation', () => {
    expect(
      assess({ required: [], current: [{ crop: 'fallow', start: 0, duration: 12 }] })[0].status,
    ).toBe('blocked');
  });
  it('does not recommend an example from unverified suitability or preferences', () => {
    expect(preferredOption(assess(), 'water')).toBeNull();
    expect(preferredOption(assess(), 'diversity')).toBeNull();
    expect(preferredOption(assess({ irrigation: 'reliable' }), 'familiar')).toBeNull();
    expect(preferredOption(assess({ irrigation: 'unknown' }), 'water')).toBeNull();
    expect(preferredOption(assess({ irrigation: 'rainfed' }), 'diversity')).toBeNull();
  });
  it('uses crop families rather than crop count to describe diversity', () => {
    expect(assess().map((e) => e.familyCount)).toEqual([1, 2, 3]);
  });
});
describe('recurring calendar', () => {
  it('splits Boro at February / March and preserves total duration', () => {
    const p = { crop: 'boro' as const, start: 10, duration: 4 };
    expect(segments(p)).toEqual([
      { start: 10, length: 2 },
      { start: 0, length: 2 },
    ]);
    expect(coveredMonths(p)).toEqual([10, 11, 0, 1]);
  });
  it('keeps a Nov–Feb crop inside the displayed winter', () => {
    expect(segments({ crop: 'wheat', start: 8, duration: 4 })).toEqual([{ start: 8, length: 4 }]);
  });
});
