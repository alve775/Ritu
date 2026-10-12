import { describe, expect, it } from 'vitest';
import {
  cropAtMonth,
  fullWheel,
  miniWheel,
  monthHitPath,
  monthLabelPoint,
  polar,
  progressSector,
  ringSector,
  seasonOfMonth,
  wheelSegments,
} from './year-wheel';
import type { CropPeriod } from './types';

const plan: CropPeriod[] = [
  { crop: 'mung', start: 0, duration: 2 },
  { crop: 'fallow', start: 2, duration: 2 },
  { crop: 'aman', start: 4, duration: 4 },
  { crop: 'mustard', start: 8, duration: 3 },
  { crop: 'fallow', start: 11, duration: 1 },
];
const finite = (path: string) => !/NaN|Infinity/.test(path);

describe('seasonOfMonth', () => {
  it('maps Mar–Jun, Jul–Oct and Nov–Feb to the three seasons', () => {
    expect([0, 3, 4, 7, 8, 11].map(seasonOfMonth)).toEqual([0, 0, 1, 1, 2, 2]);
  });
  it('wraps months outside 0–11', () => {
    expect(seasonOfMonth(12)).toBe(0);
    expect(seasonOfMonth(-1)).toBe(2);
  });
});

describe('polar', () => {
  it('puts 0° at 12 o’clock and turns clockwise', () => {
    expect(polar(100, 100, 50, 0)).toEqual({ x: 100, y: 50 });
    expect(polar(100, 100, 50, 90)).toEqual({ x: 150, y: 100 });
    expect(polar(100, 100, 50, 180)).toEqual({ x: 100, y: 150 });
  });
});

describe('ringSector', () => {
  it('uses the large-arc flag only above 180°', () => {
    expect(ringSector(160, 160, 100, 130, 0, 6)).toContain(' 0 0 1 ');
    expect(ringSector(160, 160, 100, 130, 0, 7)).toContain(' 0 1 1 ');
  });
  it('never produces a degenerate full circle', () => {
    const path = ringSector(160, 160, 100, 130, 0, 12);
    expect(finite(path)).toBe(true);
    expect(path).toContain(' 0 1 1 ');
  });
});

describe('wheelSegments', () => {
  it('returns one segment per period with season and kind', () => {
    const segments = wheelSegments(plan, fullWheel);
    expect(segments.map((s) => [s.crop, s.kind, s.season])).toEqual([
      ['mung', 'crop', 0],
      ['fallow', 'rest', 0],
      ['aman', 'crop', 1],
      ['mustard', 'crop', 2],
      ['fallow', 'rest', 2],
    ]);
    expect(segments.every((s) => finite(s.path) && finite(s.labelPath))).toBe(true);
  });
  it('flips label paths on the lower half so text reads upright', () => {
    const [mung, , aman] = wheelSegments(plan, fullWheel);
    expect(mung.labelPath).toContain(' 0 0 1 ');
    expect(aman.labelPath).toContain(' 0 0 0 ');
  });
  it('handles a full-year rest, single-month crops, February starts and no periods', () => {
    expect(wheelSegments([{ crop: 'fallow', start: 0, duration: 12 }], miniWheel)).toHaveLength(1);
    const [feb] = wheelSegments([{ crop: 'mung', start: 11, duration: 1 }], fullWheel);
    expect(feb.season).toBe(2);
    expect(finite(feb.path)).toBe(true);
    expect(wheelSegments([], fullWheel)).toEqual([]);
  });
});

describe('progressSector', () => {
  it('is empty at 0 and covers the arc at 1', () => {
    expect(progressSector(fullWheel, 4, 4, 0)).toBeNull();
    expect(progressSector(fullWheel, 4, 4, 1)).toBe(ringSector(160, 160, 100, 130, 4, 4, 1.5));
  });
  it('clamps out-of-range fractions', () => {
    expect(progressSector(fullWheel, 4, 4, 2)).toBe(progressSector(fullWheel, 4, 4, 1));
    expect(progressSector(fullWheel, 4, 4, -1)).toBeNull();
  });
});

describe('month helpers', () => {
  it('builds a finite hit wedge and label point for each month', () => {
    for (let m = 0; m < 12; m++) {
      expect(finite(monthHitPath(fullWheel, m))).toBe(true);
      const p = monthLabelPoint(fullWheel, m);
      expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    }
  });
  it('finds the period covering a month', () => {
    expect(cropAtMonth(plan, 1)?.crop).toBe('mung');
    expect(cropAtMonth(plan, 9)?.crop).toBe('mustard');
    expect(cropAtMonth([], 3)).toBeNull();
  });
});
