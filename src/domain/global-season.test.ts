import { suggestSeason, requirements } from './plant-screen';
import { describe, expect, it } from 'vitest';
import actualContexts from '../../tests/fixtures/world-growing-contexts.json';
import normalRaw from '../../tests/fixtures/power-normal-manikganj.json';
import { nextCalendarDate, localToday, daysBetween } from './global-season';
import type { SeasonContext, SeasonFarm } from './global-season';
import { calendarsAt } from '../lib/global-calendar';
import { blankFarm } from '../lib/evidence-store';
import { parseClimateNormal } from './climate-normal';
import { actionsForDay } from './season-actions';
import { validSeasonState } from '../lib/season-store';
import { areaToHectares, areaFromHectares } from './area-units';

const contexts = actualContexts as { name: string; context: SeasonContext }[];
const profile = { ...blankFarm, area: 30, soil: 'clay' as const, irrigation: 'rainfed' as const };
describe('actual recorded NASA baseline and unextrapolated global crop records', () => {
  it('parses the 1991–2020 point and retains correct source units', () => {
    const normal = parseClimateNormal(normalRaw, 23.86, 90);
    expect(normal.months[0].temperature).toBe(17.84);
    expect(normal.months[0].rain).toBeCloseTo(0.27 * 31);
    expect(normal.annualRain).toBeCloseTo(1645.1475);
    expect(normal.sourceUrl).toContain('start=1991');
    expect(() =>
      parseClimateNormal({ ...normalRaw, header: { range: 'Another baseline' } }, 23.86, 90),
    ).toThrow();
    const missing = structuredClone(normalRaw);
    missing.properties.parameter.T2M.JAN = -999;
    expect(() => parseClimateNormal(missing, 23.86, 90)).toThrow();
  });
  it('gets local records for Manikganj without borrowing Rajshahi records', () => {
    const rows = calendarsAt(23.86186, 90.00273);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows.every((r) => r.grid.latitude === 23.75 && r.grid.longitude === 90.25)).toBe(true);
    expect(
      rows.every(
        (r) => r.sourceUrl.includes('.crop.calendar.nc.gz') && !r.sourceUrl.includes('.fill.'),
      ),
    ).toBe(true);
    expect(calendarsAt(0, -140)).toEqual([]);
    expect(() => calendarsAt(NaN, 0)).toThrow();
  });
  it('supports acres without changing stored area on unit changes', () => {
    expect(areaToHectares(1, 'acres')).toBeCloseTo(0.40468564224, 12);
    expect(areaFromHectares(areaToHectares(3.5, 'acres'), 'acres')).toBe(3.5);
  });
  it('retains real fractional New Year observations instead of dropping them', () => {
    const rows = calendarsAt(0.75, 29.75);
    const rice = rows.find((r) => r.season === 'Rice');
    expect(rice?.planting).toBe(0.5);
    expect(rice?.observation).toBe(149);
    expect(rice?.first).toBe(335);
    expect(rice?.last).toBe(31);
  });
});

// 8 real climate locations x 3 soils x 3 drainage states x 3 water systems = 216
// independent QA profiles. These are not measurements of 216 actual farms.
for (const { name, context } of contexts)
  for (const soil of ['loam', 'clay', 'unknown'] as const)
    for (const drainage of ['good', 'poor', 'unknown'] as const)
      for (const irrigation of ['reliable', 'rainfed', 'severe'] as const)
        it(`${name}: ${soil}/${drainage}/${irrigation} single-season crop screen`, () => {
          const farm = { ...profile, soil, drainage, irrigation };
          const result = suggestSeason(context, farm, '2026-11-01');
          expect(new Set(result.map((s) => s.crop)).size).toBe(result.length);
          for (const choice of result) {
            const crop = requirements.crops.find((c) => c.id === choice.crop)!;
            expect(choice.start >= '2026-11-01').toBe(true);
            expect(choice.endEarly > choice.start && choice.endLate >= choice.endEarly).toBe(true);
            expect(daysBetween(choice.start, choice.endEarly)).toBe(choice.durationMin);
            expect(daysBetween(choice.start, choice.endLate)).toBe(choice.durationMax);
            expect(choice.temperature).toBeGreaterThanOrEqual(crop.TMIN!);
            expect(choice.temperature).toBeLessThanOrEqual(crop.TMAX!);
            if (drainage === 'poor') {
              const allowed = crop.drainage + crop.toleratedDrainage;
              expect(!allowed.includes('well') || allowed.includes('poorly')).toBe(true);
            }
            expect(choice.reasons.length).toBeGreaterThan(1);
            if (choice.basis === 'regional-calendar') expect(choice.calendar?.grid).toBeTruthy();
            else expect(choice.cautions.some((s) => s.includes('No local calendar'))).toBe(true);
          }
        });

describe('single-season contract and calendar boundaries', () => {
  const context = contexts[0].context;
  it('suggests crops for the actual Manikganj case, independently of annual rotation choices', () => {
    const result = suggestSeason(context, profile, '2026-11-01');
    expect(result.length).toBeGreaterThan(0);
    expect(result.some((r) => r.crop === 'wheat')).toBe(true);
    expect(suggestSeason({ ...context, normal: null }, profile, '2026-11-01')).toEqual([]);
    expect(suggestSeason(context, { ...profile, area: 0 }, '2026-11-01')).toEqual([]);
  });
  it('recognizes the source wide texture range for rice rather than excluding every known soil', () => {
    const unknown = suggestSeason(
      context,
      { ...profile, soil: 'unknown', drainage: 'unknown' },
      '2026-11-01',
    );
    expect(unknown.some((c) => c.crop === 'rice')).toBe(true);
    for (const soil of ['loam', 'clay', 'sandy'] as const)
      expect(
        suggestSeason(context, { ...profile, soil, drainage: 'unknown' }, '2026-11-01').some(
          (c) => c.crop === 'rice',
        ),
      ).toBe(true);
  });
  it('does not accept waterlogged conditions for a source that only tolerates excessive drainage', () => {
    const unknown = suggestSeason(
      context,
      { ...profile, soil: 'unknown', drainage: 'unknown' },
      '2026-11-01',
    );
    expect(unknown.some((c) => c.crop === 'ecocrop-3814')).toBe(true);
    expect(
      suggestSeason(context, { ...profile, soil: 'unknown', drainage: 'poor' }, '2026-11-01').some(
        (c) => c.crop === 'ecocrop-3814',
      ),
    ).toBe(false);
  });
  it('does not hide a freezing month inside a warm season average in the climate-only fallback', () => {
    const london = contexts.find((c) => c.name === 'London')!.context;
    const choices = suggestSeason(
      { ...london, calendars: [] },
      { ...profile, soil: 'unknown' },
      '2026-11-01',
    );
    const maize = choices.find((c) => c.crop === 'maize');
    if (maize) expect(Number(maize.start.slice(5, 7))).toBeGreaterThan(3);
  });
  it('handles a planting window crossing New Year without reversing dates', () => {
    const calendar = { ...context.calendars[0], first: 335, last: 31 };
    expect(nextCalendarDate(calendar, '2027-01-12')).toBe('2027-01-12');
    expect(nextCalendarDate(calendar, '2027-02-01')).toBe('2027-12-01');
  });
  it('uses the farm timezone rather than the computer date for today', () => {
    expect(localToday('Australia/Sydney', new Date('2026-10-31T20:00:00Z'))).toBe('2026-11-01');
    expect(localToday('America/New_York', new Date('2026-10-31T20:00:00Z'))).toBe('2026-10-31');
  });
  const selection = suggestSeason(context, profile, '2026-11-01')[0];
  const farm: SeasonFarm = {
    id: 'qa-field',
    createdAt: '2026-10-31T13:00:00Z',
    field: profile,
    site: context.site,
    context,
    selection,
    plantedDate: '',
    harvestedDate: '',
    notes: '',
    done: [],
    observations: [],
  };
  it('does not count a planned crop as actually planted', () => {
    expect(actionsForDay(farm, '2026-11-01', null).map((a) => a.id)).toContain('record-planting');
    expect(actionsForDay(farm, '2026-11-01', null).map((a) => a.id)).not.toContain('walk-field');
  });
  it('updates checks from the recorded crop stage, without inventing that stage', () => {
    const actual = { ...farm, plantedDate: '2026-10-01' };
    expect(actionsForDay(actual, '2026-11-01', null).some((a) => a.id === 'flowering-water')).toBe(
      false,
    );
    expect(
      actionsForDay(
        {
          ...actual,
          observations: [{ date: '2026-10-30', stage: 'Flowering', note: 'Observed in field' }],
        },
        '2026-11-01',
        null,
      ).some((a) => a.id === 'flowering-water'),
    ).toBe(true);
  });
  it('preserves multiple farms and rejects corrupt records rather than merging their activities', () => {
    const state = {
      version: 1 as const,
      farms: [farm, { ...farm, id: 'second', notes: 'Separate field' }],
      activeId: 'second',
      confirmedKey: null,
    };
    expect(validSeasonState(state)).toBe(true);
    expect(validSeasonState({ ...state, farms: [farm, { ...farm, id: 'qa-field' }] })).toBe(false);
    expect(validSeasonState({ ...state, farms: [{ ...farm, harvestedDate: '2026-11-01' }] })).toBe(
      false,
    );
    expect(
      validSeasonState({
        ...state,
        farms: [{ ...farm, selection: { ...selection, crop: 'not-real' } }],
      }),
    ).toBe(false);
  });
});
