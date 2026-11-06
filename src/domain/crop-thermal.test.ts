import { describe, expect, it } from 'vitest';
import {
  cornGdd,
  estimateMaizeMaturity,
  validThermalProfile,
  type ThermalWeather,
} from './crop-thermal';
import { trackingFarm, testThermalProfile, fieldCheck } from '../../tests/fixtures/tracking-farm';
import { addDays } from './evidence-planner';
import { actionsForDay } from './season-actions';
const now = Date.parse('2026-03-05T10:00:00Z'),
  today = '2026-03-05';
const farm = () =>
  trackingFarm({ plantedDate: '2026-03-01', thermalProfile: { ...testThermalProfile } });
function weather(): ThermalWeather {
  return {
    requested: farm().site,
    timezone: 'Asia/Dhaka',
    today,
    fetchedAt: new Date(now).toISOString(),
    history: [2, 3, 4].map((d) => ({
      date: `2026-03-0${d}`,
      minimum: 10,
      maximum: 30,
      sourceUrl: 'https://example.org/qa',
    })),
    forecast: Array.from({ length: 7 }, (_, i) => ({
      date: addDays(today, i),
      minimum: 10,
      maximum: 30,
      sourceUrl: 'https://example.org/qa',
    })),
    sources: [],
  };
}
describe('guarded grain-corn thermal time', () => {
  it('moves the maturity inspection prompt with the model date without ordering harvest', () => {
    const estimate = { status: 'projected' as const, projectedDate: '2026-03-07' };
    expect(
      actionsForDay(farm(), '2026-03-06', null, estimate).some(
        (a) => a.id === 'thermal-maturity-check',
      ),
    ).toBe(false);
    const record = farm();
    const before = structuredClone(record);
    expect(
      actionsForDay(record, '2026-03-07', null, estimate).find(
        (a) => a.id === 'thermal-maturity-check',
      )?.title,
    ).toBe('Check physical grain maturity and moisture');
    expect(record).toEqual(before);
    expect(record.harvestedDate).toBe('');
    expect(
      actionsForDay(farm(), today, null, { status: 'stage-conflict' }).some(
        (a) => a.id === 'thermal-conflict',
      ),
    ).toBe(true);
  });
  it.each([
    [60, 80, 20],
    [40, 60, 5],
    [70, 90, 28],
    [20, 40, 0],
  ])('applies the documented 86/50 method to %s–%s F', (min, max, expected) => {
    expect(cornGdd((min - 32) / 1.8, (max - 32) / 1.8)).toBeCloseTo(expected);
  });
  it('rejects inverted, nonfinite and implausible temperatures', () => {
    for (const pair of [
      [30, 10],
      [NaN, 30],
      [-91, 20],
      [20, 66],
    ])
      expect(() => cornGdd(pair[0], pair[1])).toThrow();
  });
  it('requires documented, correctly dimensioned hybrid inputs with no generic fallback', () => {
    expect(validThermalProfile(testThermalProfile)).toBe(true);
    for (const patch of [
      { targetGdd: NaN },
      { targetGdd: 0 },
      { sourceUrl: 'javascript:alert(1)' },
      { sourceUrl: 'https://a:b@example.org' },
      { sourceUrl: 'https://example.org/' + 'a'.repeat(2001) },
      { sourceNote: '' },
      { variety: '' },
      { origin: 'emergence' },
      { method: 'celsius' },
      { purpose: 'sweetcorn' },
      { silkingGdd: 100 },
    ])
      expect(validThermalProfile({ ...testThermalProfile, ...patch })).toBe(false);
    expect(estimateMaizeMaturity(trackingFarm(), today, null, now).status).toBe('not-configured');
  });
  it('excludes planting day and today from completed heat and projects only within the forecast', () => {
    const w = weather();
    w.history.push(
      { ...w.history[0], date: '2026-03-01', maximum: 60 },
      { ...w.history[0], date: today, maximum: 60 },
    );
    expect(estimateMaizeMaturity(farm(), today, w, now)).toMatchObject({
      status: 'projected',
      accumulated: 54,
      remaining: 46,
      projectedDate: '2026-03-07',
      anchorDate: '2026-03-01',
    });
  });
  it('never fills missing completed days or silently accepts corrupt temperatures', () => {
    const w = weather();
    w.history.splice(1, 1);
    expect(estimateMaizeMaturity(farm(), today, w, now)).toEqual({
      status: 'history-incomplete',
      missingDays: 1,
      anchorDate: '2026-03-01',
      anchorGdd: 0,
    });
    const bad = weather();
    bad.history[0].minimum = 40;
    expect(estimateMaizeMaturity(farm(), today, bad, now).status).toBe('history-incomplete');
  });
  it('withholds dates when evidence is stale, for another field or another local day', () => {
    for (const w of [
      null,
      { ...weather(), requested: { ...farm().site, latitude: 0 } },
      { ...weather(), today: '2026-03-04' },
      { ...weather(), fetchedAt: '2026-03-04T10:00:00Z' },
      { ...weather(), fetchedAt: 'invalid' },
    ])
      expect(estimateMaizeMaturity(farm(), today, w, now).status).toBe('unavailable');
  });
  it('reanchors once at confirmed 50%-silking using the documented stage target', () => {
    const f = farm();
    f.thermalProfile = { ...testThermalProfile, silkingGdd: 60 };
    f.checkIns = [
      fieldCheck({ date: '2026-03-03', milestone: 'maize-silking' }),
      fieldCheck({ id: 'repeat', date: '2026-03-04', milestone: 'maize-silking' }),
    ];
    expect(estimateMaizeMaturity(f, today, weather(), now)).toMatchObject({
      status: 'projected',
      anchorDate: '2026-03-03',
      anchorGdd: 60,
      accumulated: 78,
      projectedDate: '2026-03-06',
    });
    f.thermalProfile = { ...testThermalProfile };
    expect(estimateMaizeMaturity(f, today, weather(), now).anchorGdd).toBe(0);
  });
  it('ignores uncertain milestones and treats observed maturity as observation, not final harvest', () => {
    const f = farm();
    f.checkIns = [
      fieldCheck({ date: '2026-03-04', milestone: 'maize-maturity', stage: 'Maturing' }),
    ];
    expect(estimateMaizeMaturity(f, today, null, now)).toEqual({
      status: 'observed-maturity',
      observedDate: '2026-03-04',
    });
    expect(f.harvestedDate).toBe('');
    f.checkIns[0].confidence = 'unsure';
    expect(estimateMaizeMaturity(f, today, null, now).status).toBe('unavailable');
  });
  it('flags conflict when completed heat meets the target but the recent field stage is immature', () => {
    const w = weather();
    w.history.forEach((d) => {
      d.minimum = 30;
      d.maximum = 40;
    });
    expect(estimateMaizeMaturity(farm(), today, w, now).status).toBe('threshold-reached');
    expect(
      estimateMaizeMaturity(
        { ...farm(), checkIns: [fieldCheck({ date: '2026-03-04', stage: 'Leaf growth' })] },
        today,
        w,
        now,
      ).status,
    ).toBe('stage-conflict');
  });
  it('does not project through missing forecast days or extrapolate beyond seven days', () => {
    const f = farm();
    f.thermalProfile = { ...testThermalProfile, targetGdd: 3000 };
    expect(estimateMaizeMaturity(f, today, weather(), now)).toMatchObject({
      status: 'forecast-limited',
      accumulated: 54,
    });
    const w = weather();
    w.forecast[0].minimum = null;
    expect(estimateMaizeMaturity(farm(), today, w, now).status).toBe('forecast-limited');
  });
  it('excludes today’s planting or stage-anchor day from future heat as well', () => {
    const plantedToday = { ...farm(), plantedDate: today };
    expect(estimateMaizeMaturity(plantedToday, today, weather(), now)).toMatchObject({
      status: 'projected',
      accumulated: 0,
      projectedDate: '2026-03-11',
    });
    const milestoneToday = {
      ...farm(),
      thermalProfile: { ...testThermalProfile, silkingGdd: 60 },
      checkIns: [fieldCheck({ date: today, milestone: 'maize-silking' })],
    };
    expect(estimateMaizeMaturity(milestoneToday, today, weather(), now)).toMatchObject({
      status: 'projected',
      accumulated: 60,
      projectedDate: '2026-03-08',
    });
  });
  it('does not run on another crop, before planting, or after final harvest', () => {
    expect(
      estimateMaizeMaturity(
        { ...farm(), selection: { ...farm().selection, crop: 'rice' } },
        today,
        weather(),
        now,
      ).status,
    ).toBe('unsupported');
    expect(
      estimateMaizeMaturity({ ...farm(), plantedDate: '' }, today, weather(), now).status,
    ).toBe('waiting-planting');
    expect(
      estimateMaizeMaturity({ ...farm(), harvestedDate: today }, today, weather(), now).status,
    ).toBe('completed');
  });
});
