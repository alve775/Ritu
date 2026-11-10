import { describe, expect, it } from 'vitest';
import type { ClimateNormal } from '../global-season';
import {
  assessPlan,
  banglaDate,
  cropWeeks,
  hargreavesEt0,
  keepSown,
  planKey,
  monthlyClimate,
  pumpHours,
  schedulePlan,
  seasonOrder,
  suggestPlans,
  type PlotConditions,
} from './index';
import { rotationCrops } from '../../data/rotation-crops';

// Rajshahi-like 1991–2020 monthly values, January first.
const mean = [17.5, 21, 26, 30, 30.5, 29.5, 29, 29, 29, 27.5, 23, 19];
const max = [24, 28, 33, 36, 35, 33, 32, 32, 32, 31, 29, 26];
const min = [11, 14, 19, 24, 25, 26, 26, 26, 25, 23, 17, 12];
const rain = [8, 15, 20, 60, 160, 300, 330, 290, 260, 110, 12, 6];
const normal: ClimateNormal = {
  latitude: 24.37,
  longitude: 88.6,
  period: '1991–2020',
  sourceUrl: 'https://power.larc.nasa.gov/api/temporal/climatology/point',
  retrievedAt: '2026-11-07T00:00:00Z',
  annualRain: rain.reduce((a, b) => a + b, 0),
  months: mean.map((temperature, i) => ({
    month: i + 1,
    temperature,
    rain: rain[i],
    maximum: max[i],
    minimum: min[i],
    wetness: 0.5,
  })),
};
const climate = monthlyClimate(normal);
const plot: PlotConditions = {
  soil: 'clay',
  drainage: 'unknown',
  irrigation: 'limited',
  areaHa: 1,
  lastYear: { winter: 'boro', 'pre-monsoon': 'fallow', monsoon: 'aman' },
};

describe('Bangla calendar', () => {
  it('converts dates with the revised Bangladesh calendar', () => {
    expect(banglaDate('2026-11-07')).toMatchObject({ day: 22, name: { en: 'Kartik' } });
    expect(banglaDate('2026-04-14')).toMatchObject({ day: 1, name: { en: 'Boishakh' } });
    expect(banglaDate('2027-03-14')).toMatchObject({ day: 29, name: { en: 'Falgun' } });
    expect(banglaDate('2027-03-15')).toMatchObject({ day: 1, name: { en: 'Choitro' } });
    expect(banglaDate('2027-01-01')).toMatchObject({ day: 17, name: { en: 'Poush' } });
  });
});

describe('climate', () => {
  it('gives a plausible Hargreaves ET0 for Rajshahi', () => {
    const april = hargreavesEt0(24.37, 3, 30, 36, 24);
    expect(april).toBeGreaterThan(4);
    expect(april).toBeLessThan(7);
    expect(climate.estimated).toBe(false);
  });
  it('estimates max and min when an older normal lacks them', () => {
    const old = {
      ...normal,
      months: normal.months.map(({ month, temperature, rain }) => ({ month, temperature, rain })),
    };
    const c = monthlyClimate(old);
    expect(c.estimated).toBe(true);
    expect(c.max[0]).toBe(22.5);
  });
});

describe('timing', () => {
  it('starts the year with the next season to open', () => {
    expect(seasonOrder('2026-11-07')).toEqual(['winter', 'pre-monsoon', 'monsoon']);
    expect(seasonOrder('2027-03-01')).toEqual(['pre-monsoon', 'monsoon', 'winter']);
  });
  it('fits Mustard, Mung bean and Aman in one year', () => {
    const s = schedulePlan(
      { winter: 'mustard', 'pre-monsoon': 'mung', monsoon: 'aman' },
      '2026-11-07',
    );
    expect(s.problems).toEqual([]);
    expect(s.items.map((i) => i.crop.id)).toEqual(['mustard', 'mung', 'aman']);
    expect(s.items[0].sow).toBe('2026-11-10');
  });
  it('blocks Boro followed by Mung bean', () => {
    const s = schedulePlan(
      { winter: 'boro', 'pre-monsoon': 'mung', monsoon: 'aman' },
      '2026-11-07',
    );
    expect(s.problems.map((p) => [p.before.id, p.after.id])).toEqual([['boro', 'mung']]);
  });
  it('sows late when the ready date is after the preferred date', () => {
    const s = schedulePlan(
      { winter: 'mustard', 'pre-monsoon': null, monsoon: 'aman' },
      '2026-11-20',
    );
    expect(s.items[0].sow).toBe('2026-11-20');
  });
});

describe('water and heat', () => {
  it('needs many irrigations for Boro and few for Aman', () => {
    const boro = cropWeeks(rotationCrops.boro, '2027-01-15', climate).filter(
      (w) => w.irrigate,
    ).length;
    const aman = cropWeeks(rotationCrops.aman, '2027-08-01', climate).filter(
      (w) => w.irrigate,
    ).length;
    expect(boro).toBeGreaterThanOrEqual(8);
    expect(aman).toBeLessThanOrEqual(4);
  });
  it('flags March heat for late wheat but not for mustard', () => {
    expect(cropWeeks(rotationCrops.wheat, '2026-12-10', climate).some((w) => w.hot)).toBe(true);
    expect(cropWeeks(rotationCrops.mustard, '2026-11-10', climate).some((w) => w.hot)).toBe(false);
  });
  it('converts irrigation depth to shallow-pump hours', () => {
    expect(pumpHours(35, 1)).toBe(7);
  });
});

describe('plans', () => {
  it('suggests last year plus two plans that fit', () => {
    const plans = suggestPlans('2026-11-07', climate, plot);
    expect(plans).toHaveLength(3);
    expect(plans[0].lastYear).toBe(true);
    expect(plans.slice(1).every((p) => !p.assessment.problems.length)).toBe(true);
    expect(plans[1].assessment.irrigations).toBeLessThan(plans[0].assessment.irrigations);
  });
  it('still suggests three plans when last year is not known', () => {
    const unknown = {
      ...plot,
      lastYear: { winter: 'unknown', 'pre-monsoon': 'unknown', monsoon: 'unknown' },
    } as PlotConditions;
    const plans = suggestPlans('2026-11-07', climate, unknown);
    expect(plans).toHaveLength(3);
    expect(plans.every((p) => !p.lastYear)).toBe(true);
  });
  it('gives every crop a verdict and a reason', () => {
    const a = assessPlan(
      { winter: 'potato', 'pre-monsoon': 'mung', monsoon: 'aman' },
      '2026-11-07',
      climate,
      plot,
    );
    expect(a.crops.every((c) => c.verdict && c.reason)).toBe(true);
    expect(a.crops[0].levels.soil).toBe(5);
    expect(a.crops[0].verdict).toBe('risky');
  });
  it('suggests black gram in place of Aman only where no Aman plan fits', () => {
    const ids = (soil: PlotConditions['soil']) =>
      suggestPlans('2026-11-07', climate, { ...plot, soil }).map((p) => p.id);
    expect(ids('clay').some((id) => id.endsWith('blackgram'))).toBe(false);
    const sandy = ids('sandy');
    expect(sandy).toHaveLength(3);
    expect(sandy.slice(1).every((id) => id.endsWith('blackgram'))).toBe(true);
  });
  it('marks rice after rice as wearing out the soil', () => {
    const a = assessPlan(
      { winter: 'boro', 'pre-monsoon': null, monsoon: 'aman' },
      '2026-11-07',
      climate,
      plot,
    );
    expect(a.levels.wear).toBe(5);
  });
  it('keeps a sown season when the plan changes', () => {
    const next = keepSown(
      { winter: 'wheat', 'pre-monsoon': 'mung', monsoon: 'aman' },
      { winter: 'mustard' },
    );
    expect(next).toEqual({ winter: 'mustard', 'pre-monsoon': 'mung', monsoon: 'aman' });
    // Two plans that differ only in the sown season become the same plan.
    expect(planKey(next)).toBe(
      planKey(
        keepSown(
          { winter: 'lentil', 'pre-monsoon': 'mung', monsoon: 'aman' },
          { winter: 'mustard' },
        ),
      ),
    );
    const a = assessPlan(next, '2026-11-07', climate, plot);
    expect(a.crops.map((c) => c.item.crop.id)).toContain('mustard');
  });
});
