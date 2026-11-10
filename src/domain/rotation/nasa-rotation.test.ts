import { describe, expect, it } from 'vitest';
import type { ClimateNormal } from '../global-season';
import type { NasaClimate, NasaWeek } from '../nasa-local';
import { nasaWeek } from '../nasa-local';
import { validIrrigation } from '../field-log';
import {
  assessPlan,
  cropWeeks,
  dayItems,
  drySpell,
  monthlyClimate,
  planCrops,
  plusDays,
  presowKey,
  startSoil,
  suggestPlans,
  type MonthlyClimate,
  type PlotConditions,
  type YearPlan,
} from './index';
import { rotationCrops } from '../../data/rotation-crops';

// Rajshahi-like 1991–2020 monthly values, January first (as in rotation.test.ts).
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
const power = monthlyClimate(normal);
/** A NASA climate with the same value every week unless `at` changes it. */
const nasa = (at: (w: number) => Partial<NasaWeek> = () => ({})): NasaClimate => ({
  weeks: Array.from({ length: 52 }, (_, i) => ({
    rain: 0,
    dry: 0,
    dryYears: 0,
    drySamples: 24,
    root: 0.7,
    ...at(i + 1),
  })),
  rainCell: { lat: 24.35, lon: 88.55 },
  soilCell: { lat: 24.4, lon: 88.55 },
  rainPeriod: ['2001-01-01', '2025-09-30'],
  soilPeriod: ['2015-04-01', '2025-12-31'],
});
const withNasa = (n: NasaClimate): MonthlyClimate => ({ ...power, nasa: n });
const plot = (irrigation: PlotConditions['irrigation']): PlotConditions => ({
  soil: 'clay',
  drainage: 'unknown',
  irrigation,
  areaHa: 1,
  lastYear: { winter: 'fallow', 'pre-monsoon': 'fallow', monsoon: 'fallow' },
});
const amanOnly: YearPlan = { winter: null, 'pre-monsoon': null, monsoon: 'aman' };
const from = '2027-07-01';
/** A dry spell in every week of aman's October flowering and grain filling (ISO weeks 39–44). */
const dryOct = (dry: number, years: number) =>
  nasa((w) => (w >= 39 && w <= 44 ? { dry, dryYears: years } : {}));
const aman = (climate: MonthlyClimate, irrigation: PlotConditions['irrigation'] = 'reliable') =>
  assessPlan(amanOnly, from, climate, plot(irrigation));

describe('soil water at sowing (NASA SMAP)', () => {
  const mustard = rotationCrops.mustard,
    mung = rotationCrops.mung;
  it('keeps the old start without SMAP: full after the monsoon, half otherwise; rice starts dry', () => {
    expect(startSoil(mustard, '2026-11-10', power)).toEqual({
      store: 60,
      presow: 0,
      wetness: null,
    });
    expect(startSoil(mung, '2027-03-15', power)).toEqual({ store: 30, presow: 0, wetness: null });
    expect(
      startSoil(rotationCrops.aman, '2027-08-01', withNasa(nasa(() => ({ root: 0.1 })))),
    ).toEqual({ store: 0, presow: 0, wetness: 0.1 });
  });
  it('starts from the usual root-zone water, and below half adds an irrigation before sowing', () => {
    expect(startSoil(mustard, '2026-11-10', withNasa(nasa(() => ({ root: 0.71 }))))).toEqual({
      store: 43,
      presow: 0,
      wetness: 0.71,
    });
    expect(startSoil(mustard, '2026-11-10', withNasa(nasa(() => ({ root: 0.39 }))))).toEqual({
      store: 60,
      presow: 40,
      wetness: 0.39,
    });
    // Exactly half: no irrigation before sowing.
    expect(startSoil(mustard, '2026-11-10', withNasa(nasa(() => ({ root: 0.5 }))))).toEqual({
      store: 30,
      presow: 0,
      wetness: 0.5,
    });
  });
  it('uses the sowing week only, and falls back when that week has no SMAP value', () => {
    const week = nasaWeek('2026-11-10')!;
    const gap = withNasa(nasa((w) => (w === week ? { root: null } : { root: 0.1 })));
    expect(startSoil(mustard, '2026-11-10', gap)).toEqual({ store: 60, presow: 0, wetness: null });
  });
  it('a drier start brings the first irrigation forward', () => {
    const first = (c: MonthlyClimate) =>
      cropWeeks(mustard, '2026-11-10', c).findIndex((w) => w.irrigate > 0);
    expect(first(withNasa(nasa(() => ({ root: 0.55 }))))).toBeLessThan(first(power));
  });
  it('counts the irrigation before sowing in the crop and plan totals', () => {
    const plan: YearPlan = { winter: 'mustard', 'pre-monsoon': null, monsoon: null };
    const base = assessPlan(plan, '2026-11-01', power, plot('reliable'));
    const dry = assessPlan(
      plan,
      '2026-11-01',
      withNasa(nasa(() => ({ root: 0.2 }))),
      plot('reliable'),
    );
    const c0 = base.crops[0],
      c1 = dry.crops[0];
    expect(c0.presow).toBe(0);
    expect(c1.presow).toBe(50);
    expect(c1.irrigations).toBe(c0.irrigations + 1);
    expect(c1.irrigationMm).toBe(c0.irrigationMm + 50);
    expect(dry.irrigations).toBe(base.irrigations + 1);
    expect(dry.score).toBe(base.score - 1);
  });
});

describe('dry-spell risk at flowering (NASA IMERG)', () => {
  const none = aman(withNasa(nasa()));
  it('has no effect without NASA data, for a crop without a flowering stage, or below 20% of years', () => {
    expect(aman(power).crops[0].dry).toBeNull();
    expect(none.crops[0].dry).toBeNull();
    expect(aman(withNasa(dryOct(0.19, 4))).crops[0].dry).toBeNull();
    expect(aman(withNasa(dryOct(0.19, 4))).score).toBe(none.score);
    const jute = rotationCrops.jute;
    expect(
      drySpell(
        jute,
        cropWeeks(jute, '2027-04-01', power),
        withNasa(nasa(() => ({ dry: 1 }))),
        'limited',
      ),
    ).toBeNull();
  });
  it('ignores dry spells where the water plan counts on almost no rain (winter crops)', () => {
    const mustard = rotationCrops.mustard;
    const weeks = cropWeeks(mustard, '2026-11-10', power);
    expect(
      drySpell(mustard, weeks, withNasa(nasa(() => ({ dry: 1, dryYears: 24 }))), 'limited'),
    ).toBeNull();
  });
  it('from 20% of years lowers the score by the expected extra irrigations, without changing the bars', () => {
    const a = aman(withNasa(dryOct(0.29, 7)));
    const d = a.crops[0].dry!;
    expect(d).toMatchObject({
      chance: 0.29,
      years: 7,
      samples: 24,
      high: false,
      raisesWater: false,
    });
    expect(d.reliedMm).toBeGreaterThan(20);
    expect(d.extra).toBeGreaterThanOrEqual(1);
    expect(d.expected).toBeGreaterThan(0);
    expect(a.crops[0].levels).toEqual(none.crops[0].levels);
    expect(a.crops[0].verdict).toBe(none.crops[0].verdict);
    expect(a.score).toBeCloseTo(none.score - d.expected, 6);
  });
  it('picks the riskiest week of flowering and grain filling, with its year counts', () => {
    const a = aman(
      withNasa(
        nasa((w) =>
          w === 42 ? { dry: 0.46, dryYears: 11 } : w === 40 ? { dry: 0.25, dryYears: 6 } : {},
        ),
      ),
    );
    expect(a.crops[0].dry).toMatchObject({ chance: 0.46, years: 11, high: true });
    expect(nasaWeek(a.crops[0].dry!.week)).toBe(42);
  });
  it('from 40% is high; with a reliable pump the water bar stays, it only costs score', () => {
    const a = aman(withNasa(dryOct(0.54, 13)), 'reliable');
    expect(a.crops[0].dry).toMatchObject({ high: true, raisesWater: false });
    expect(a.crops[0].levels.water).toBe(aman(withNasa(nasa()), 'reliable').crops[0].levels.water);
    expect(a.score).toBeLessThan(aman(withNasa(nasa()), 'reliable').score);
  });
  it('from 40% on a plot with limited water or rain only, the water bar goes up one step', () => {
    for (const irrigation of ['limited', 'rainfed', 'severe'] as const) {
      const base = aman(withNasa(nasa()), irrigation).crops[0],
        risky = aman(withNasa(dryOct(0.54, 13)), irrigation).crops[0];
      expect(risky.dry?.raisesWater).toBe(true);
      expect(risky.levels.water).toBe(Math.min(5, base.levels.water + 1));
    }
    const unknown = aman(withNasa(dryOct(0.54, 13)), 'unknown').crops[0];
    expect(unknown.dry?.raisesWater).toBe(false);
    expect(unknown.levels.water).toBe(aman(withNasa(nasa()), 'unknown').crops[0].levels.water);
  });
  it('never removes plans: three are still offered when every week is dry', () => {
    const allDry = withNasa(nasa(() => ({ dry: 1, dryYears: 24, root: 0 })));
    expect(suggestPlans('2026-11-10', allDry, plot('limited'))).toHaveLength(3);
  });
});

describe('the irrigation before sowing on the calendar', () => {
  const plan: YearPlan = { winter: 'mustard', 'pre-monsoon': null, monsoon: null };
  const dryStart = withNasa(nasa(() => ({ root: 0.2 })));
  const a = assessPlan(plan, '2026-11-01', dryStart, plot('reliable')).crops[0];
  const { sow, windowStart } = a.item;
  const key = presowKey('winter', windowStart);
  const at = (today: string, sown = false, irrigated: Record<string, string> = {}) =>
    planCrops([a], { sown: sown ? ['winter'] : [], harvested: [], irrigated }, today)[0].windows[0];
  it('is the first window, in the three days before sowing, with its own key per season and year', () => {
    const w = at(plusDays(sow, -10));
    expect(w).toMatchObject({ presow: true, key, mm: 50, status: 'later' });
    expect(w.start).toBe(plusDays(sow, -3));
    expect(w.end).toBe(plusDays(sow, -1));
    expect(at(plusDays(sow, -2)).status).toBe('due');
  });
  it('waits for a late sowing, never counts as missed once sown, and records like any irrigation', () => {
    const late = at(plusDays(sow, 5));
    expect(late).toMatchObject({ status: 'due', start: plusDays(sow, 5), end: plusDays(sow, 5) });
    expect(at(plusDays(sow, 5), true).status).toBe('past');
    const done = at(plusDays(sow, 5), true, { [key]: plusDays(sow, -2) });
    expect(done).toMatchObject({ status: 'done', doneOn: plusDays(sow, -2) });
  });
  it('appears on its days as a pre-sowing irrigation, and as done on the day it was given', () => {
    const today = plusDays(sow, -10);
    const pcs = planCrops([a], { sown: [], harvested: [], irrigated: {} }, today);
    const item = dayItems(pcs, plusDays(sow, -3)).find((i) => i.kind === 'irrigate');
    expect(item && item.kind === 'irrigate' && item.window.presow).toBe(true);
    expect(dayItems(pcs, plusDays(sow, -4)).some((i) => i.kind === 'irrigate')).toBe(false);
    const given = planCrops(
      [a],
      { sown: [], harvested: [], irrigated: { [key]: plusDays(sow, -2) } },
      sow,
    );
    expect(dayItems(given, plusDays(sow, -2)).some((i) => i.kind === 'irrigated')).toBe(true);
  });
  it('can be saved in the irrigation records', () => {
    const record = { plotId: 'p1', key, date: plusDays(sow, -2), savedAt: '2026-11-08T03:00:00Z' };
    expect(validIrrigation(record)).toBe(true);
    expect(validIrrigation({ ...record, key: 'winter:presow:soon' })).toBe(false);
  });
  it('is absent when the soil is usually moist enough', () => {
    const moist = assessPlan(plan, '2026-11-01', withNasa(nasa()), plot('reliable')).crops[0];
    const pcs = planCrops([moist], { sown: [], harvested: [], irrigated: {} }, '2026-11-01');
    expect(pcs[0].windows.some((w) => w.presow)).toBe(false);
  });
});
