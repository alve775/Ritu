import { describe, expect, it } from 'vitest';
import {
  inRajshahiBox,
  nasaClimateAt,
  nasaWeek,
  nasaWeekOn,
  nearestCell,
  soilRange,
  weeklyValue,
  type RainFile,
  type SoilFile,
} from './nasa-local';

const west = { lat: 24.37, lon: 88.5, weeks: [{ w: 46, root: 0.21 }] };
const east = { lat: 24.37, lon: 88.59, weeks: [{ w: 46, root: 0 }] };
const smap = { gridKm: 9, cells: [west, east] };

describe('local NASA weekly summaries', () => {
  it('finds the closest grid cell independently of input order', () => {
    expect(nearestCell(smap, 24.37, 88.58)).toBe(east);
  });

  it('rejects land outside the Rajshahi box, a gap in the grid, and invalid coordinates', () => {
    const edge = { gridKm: 9, cells: [{ ...west, lon: 87.92 }] };
    expect(nearestCell(edge, 24.37, 87.89)).toBeNull();
    expect(nearestCell(smap, 25.1, 89.1)).toBeNull();
    expect(nearestCell(smap, NaN, 88.58)).toBeNull();
  });

  it('returns only the requested week and preserves valid zero readings', () => {
    expect(weeklyValue(smap, 24.37, 88.58, '2026-11-09')).toEqual({ w: 46, root: 0 });
    expect(weeklyValue(smap, 24.37, 88.58, '2026-11-16')).toBeNull();
    expect(weeklyValue(null, 24.37, 88.58, '2026-11-09')).toBeNull();
  });

  it('folds ISO week 53 into 52, including at the start of the next calendar year', () => {
    expect(nasaWeek('2020-12-31')).toBe(52);
    expect(nasaWeek('2021-01-01')).toBe(52);
    expect(nasaWeek('2021-01-04')).toBe(1);
    expect(nasaWeek('2026-02-30')).toBeNull();
  });
});

describe('NASA weeks at a pin', () => {
  const rain: RainFile = {
    period: ['2001-01-01', '2025-09-30'],
    gridDeg: 0.1,
    cells: [
      {
        lat: 24.35,
        lon: 88.55,
        weeks: [
          { w: 46, rainMm: 1.77, dry21: 0.96, dryYears: 23, drySamples: 24 },
          { w: 47, rainMm: 0.04 },
        ],
      },
    ],
  };
  const soil: SoilFile = {
    period: ['2015-04-01', '2025-12-31'],
    gridKm: 9,
    cells: [
      {
        lat: 24.4,
        lon: 88.55,
        weeks: [
          { w: 46, root: 0.32 },
          { w: 47, root: 0.1 },
        ],
      },
      { lat: 24.64, lon: 88.27, weeks: [{ w: 46, root: 0.41 }] },
    ],
  };
  it('scales root-zone wetness from the driest to the wettest week anywhere in the region', () => {
    expect(soilRange(soil)).toEqual([0.1, 0.41]);
    const n = nasaClimateAt(rain, soil, 24.37, 88.6)!;
    expect(n.weeks).toHaveLength(52);
    expect(n.weeks[45]).toEqual({
      rain: 1.77,
      dry: 0.96,
      dryYears: 23,
      drySamples: 24,
      root: 0.71,
    });
    // A week without a dry-spell count, and the driest soil anywhere.
    expect(n.weeks[46]).toEqual({ rain: 0.04, dry: null, dryYears: 0, drySamples: 0, root: 0 });
    // A week neither file has.
    expect(n.weeks[0]).toEqual({ rain: null, dry: null, dryYears: 0, drySamples: 0, root: null });
    expect(n.rainCell).toEqual({ lat: 24.35, lon: 88.55 });
    expect(n.soilPeriod).toEqual(['2015-04-01', '2025-12-31']);
  });
  it('is null outside the box, without a cell in either grid, or without a soil range', () => {
    expect(inRajshahiBox(23.8, 90.4)).toBe(false);
    expect(nasaClimateAt(rain, soil, 23.8, 90.4)).toBeNull();
    expect(nasaClimateAt(rain, soil, 25.2, 89.3)).toBeNull();
    const flat = nasaClimateAt(rain, soil, 24.37, 88.6, [0.3, 0.3])!;
    expect(flat.weeks[45].root).toBeNull();
  });
  it('looks up the week of a date, folding week 53', () => {
    const n = nasaClimateAt(rain, soil, 24.37, 88.6)!;
    expect(nasaWeekOn(n, '2026-11-09')?.dry).toBe(0.96);
    expect(nasaWeekOn(null, '2026-11-09')).toBeNull();
    expect(nasaWeekOn(n, 'not a date')).toBeNull();
  });
});
