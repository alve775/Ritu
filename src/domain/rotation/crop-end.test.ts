import { describe, expect, it } from 'vitest';
import { cropEnd, lastHarvestDay, lastSowDay } from './crop-end';
import { schedulePlan } from './schedule';

// Mustard (85 days, best 25 Oct – 30 Nov), mung bean (65 days, 25 Feb – 5 Apr), aman (105 days, 15 Jul – 20 Aug).
const { items } = schedulePlan(
  { winter: 'mustard', 'pre-monsoon': 'mung', monsoon: 'aman' },
  '2026-11-01',
);

describe('crop deadlines', () => {
  it('ends sowing when the crop would no longer fit before the next crop, or 45 days late', () => {
    expect(items.map((c) => c.crop.id)).toEqual(['mustard', 'mung', 'aman']);
    // Mustard sown after 10 Jan is still growing on 5 Apr, mung bean's last good sowing day.
    expect(lastSowDay(items, 0)).toBe('2027-01-10');
    // Mung bean: 45 days after 5 Apr comes first.
    expect(lastSowDay(items, 1)).toBe('2027-05-20');
    // The last crop of the plan only has the 45 days.
    expect(lastSowDay(items, 2)).toBe('2027-10-04');
  });
  it('ends the harvest 45 days late, or at the next crop sowing', () => {
    expect(lastHarvestDay(items, 0, '2026-11-09')).toBe('2027-03-19');
    expect(lastHarvestDay(items, 0, '2026-11-09', '2027-03-01')).toBe('2027-03-01');
  });
  it('cancels an unsown crop after its last sowing day, and closes a sown one with no harvest', () => {
    const none = { plantedDate: '', harvestedDate: '' };
    expect(cropEnd(items, 0, none, '2027-01-10')).toBeNull();
    expect(cropEnd(items, 0, none, '2027-01-11')).toEqual({
      kind: 'cancelled',
      date: '2027-01-11',
      auto: true,
    });
    expect(cropEnd(items, 0, undefined, '2027-01-11')?.kind).toBe('cancelled');
    const sown = { plantedDate: '2026-11-09', harvestedDate: '' };
    expect(cropEnd(items, 0, sown, '2027-03-19')).toBeNull();
    expect(cropEnd(items, 0, sown, '2027-03-20')?.kind).toBe('closed');
    expect(cropEnd(items, 0, { ...sown, harvestedDate: '2027-02-02' }, '2027-06-01')).toBeNull();
  });
  it('keeps what the farmer recorded: a cancel before sowing, a loss after', () => {
    expect(
      cropEnd(
        items,
        0,
        {
          plantedDate: '',
          harvestedDate: '',
          cancelled: { date: '2026-11-20', reason: 'no-seed' },
        },
        '2026-11-21',
      ),
    ).toEqual({ kind: 'cancelled', date: '2026-11-20', auto: false, reason: 'no-seed' });
    expect(
      cropEnd(
        items,
        0,
        {
          plantedDate: '2026-11-09',
          harvestedDate: '',
          lost: { date: '2027-01-05', reason: 'flood' },
        },
        '2027-01-06',
      ),
    ).toEqual({ kind: 'lost', date: '2027-01-05', auto: false, reason: 'flood' });
  });
});

import { assessPlan, monthlyClimate } from './index';
import { isClockTime, reminderMinutes, validReminder } from '../field-log';

describe('soil pH in plan scores', () => {
  const months = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    temperature: [17, 20, 26, 29, 30, 30, 29, 29, 29, 27, 23, 19][i],
    temperatureMax: [24, 27, 33, 35, 34, 33, 32, 32, 32, 31, 29, 25][i],
    temperatureMin: [11, 13, 18, 23, 25, 26, 26, 26, 26, 23, 17, 12][i],
    rain: [10, 15, 25, 60, 150, 300, 330, 300, 250, 120, 15, 5][i],
  }));
  const climate = monthlyClimate({ months } as never);
  const base = {
    soil: 'loam' as const,
    drainage: 'good' as const,
    irrigation: 'reliable' as const,
    areaHa: 1,
    lastYear: { winter: 'fallow', 'pre-monsoon': 'fallow', monsoon: 'fallow' } as never,
  };
  const plan = { winter: 'tomato', 'pre-monsoon': 'mung', monsoon: 'aman' } as const;
  it('marks a crop whose tolerated pH range excludes the soil, and says where the pH came from', () => {
    const tomato = (ph?: { value: number; measured: boolean }) =>
      assessPlan(plan, '2026-10-01', climate, { ...base, ...(ph ? { ph } : {}) }).crops[0];
    expect(tomato().levels.soil).toBe(1);
    expect(tomato({ value: 6.5, measured: true }).levels.soil).toBe(1);
    const tested = tomato({ value: 8.0, measured: true });
    expect(tested.levels.soil).toBe(5);
    expect(tested.reason).toMatchObject({ kind: 'ph', ph: 8, measured: true, range: [5, 7.5] });
    expect(tomato({ value: 8.0, measured: false }).levels.soil).toBe(4);
  });
});

describe('reminder clock times', () => {
  it('accepts a picked clock time as well as the quick choices', () => {
    expect(isClockTime('19:50')).toBe(true);
    expect(isClockTime('24:00')).toBe(false);
    expect(reminderMinutes('morning')).toBe(420);
    expect(reminderMinutes('19:50')).toBe(1190);
    expect(validReminder({ date: '2026-11-10', time: '07:05', done: false })).toBe(true);
    expect(validReminder({ date: '2026-11-10', time: '7:5', done: false })).toBe(false);
  });
});
