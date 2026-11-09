import { describe, expect, it } from 'vitest';
import type { ClimateNormal } from '../global-season';
import {
  assessPlan,
  bigEvents,
  cropOn,
  dayItems,
  irrigationKey,
  monthlyClimate,
  planCrops,
  plusDays,
  quietDay,
  type PlotConditions,
} from './index';

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
  soil: 'loam',
  drainage: 'good',
  irrigation: 'reliable',
  areaHa: 1,
  lastYear: { winter: 'wheat', 'pre-monsoon': 'fallow', monsoon: 'aman' },
};
const { crops } = assessPlan(
  { winter: 'wheat', 'pre-monsoon': 'mung', monsoon: 'aman' },
  '2026-11-01',
  climate,
  plot,
);
const wheat = crops[0];
const firstIrrigation = wheat.weeks.find((w) => w.irrigate > 0)!;

describe('day plan', () => {
  it('marks an unrecorded irrigation week missed only once the crop was sown', () => {
    const after = plusDays(firstIrrigation.start, 10);
    const unsown = planCrops(crops, { sown: [], harvested: [], irrigated: {} }, after);
    expect(unsown[0].windows[0].status).toBe('past');
    const sown = planCrops(crops, { sown: ['winter'], harvested: [], irrigated: {} }, after);
    expect(sown[0].windows[0].status).toBe('missed');
    const done = planCrops(
      crops,
      {
        sown: ['winter'],
        harvested: [],
        irrigated: { [irrigationKey('winter', firstIrrigation.start)]: firstIrrigation.start },
      },
      after,
    );
    expect(done[0].windows[0].status).toBe('done');
    expect(dayItems(done, firstIrrigation.start).some((i) => i.kind === 'irrigated')).toBe(true);
  });

  it('lists the due irrigation and the crop jobs on their days', () => {
    const pcs = planCrops(
      crops,
      { sown: ['winter'], harvested: [], irrigated: {} },
      firstIrrigation.start,
    );
    expect(pcs[0].windows[0].status).toBe('due');
    const items = dayItems(pcs, firstIrrigation.start);
    expect(items.find((i) => i.kind === 'irrigate')).toMatchObject({ first: true });
    // Wheat: weeding 20 days after sowing.
    const weed = dayItems(pcs, plusDays(wheat.item.sow, 20));
    expect(weed.some((i) => i.kind === 'job' && i.job.kind === 'care')).toBe(true);
    // Sowing comes before anything else that day.
    expect(dayItems(pcs, wheat.item.sow)[0]).toMatchObject({ kind: 'sow', recorded: true });
  });

  it('says what a quiet day is for', () => {
    const pcs = planCrops(crops, { sown: [], harvested: [], irrigated: {} }, '2026-11-01');
    expect(quietDay(pcs, plusDays(wheat.item.windowStart, -5))).toMatchObject({ kind: 'plough' });
    expect(quietDay(pcs, wheat.item.windowStart)).toMatchObject({ kind: 'can-sow' });
    expect(cropOn(pcs, wheat.item.sow)?.a).toBe(wheat);
    expect(quietDay(pcs, plusDays(wheat.item.harvest, -3))).toMatchObject({ kind: 'ripening' });
  });

  it('puts the next big events in date order, starting today', () => {
    const today = wheat.item.windowStart;
    const events = bigEvents(
      planCrops(crops, { sown: [], harvested: [], irrigated: {} }, today),
      today,
    );
    expect(events.length).toBe(6);
    expect(events[0]).toMatchObject({ kind: 'sow' });
    expect(events.map((e) => e.date)).toEqual([...events.map((e) => e.date)].sort());
    expect(events.every((e) => e.date >= today)).toBe(true);
  });
});
