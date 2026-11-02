import { describe, expect, it, vi, afterEach } from 'vitest';
import rawContexts from '../../tests/fixtures/world-audit-contexts.json';
import { areaFromHectares, areaToHectares, hectaresPerUnit, type AreaUnit } from './area-units';
import { canonicalPin, validSite } from './farm-site';
import { blankFarm } from '../lib/evidence-store';
import { suggestSeason } from './plant-screen';
import { validSeasonState } from '../lib/season-store';
import { actionsForDay } from './season-actions';
import type { SeasonContext, SeasonFarm } from './global-season';
import type { LiveWeather } from './live-weather';
const contexts = rawContexts as { name: string; context: SeasonContext }[];
const context = contexts[0].context;
const farm: SeasonFarm = {
  id: 'boundary',
  createdAt: '2026-11-01T00:00:00Z',
  site: context.site,
  context,
  field: { ...blankFarm, area: 1 },
  selection: suggestSeason(context, { ...blankFarm, area: 1 }, '2026-11-01')[0],
  plantedDate: '',
  harvestedDate: '',
  notes: '',
  done: [],
  observations: [],
};
const valid = (f: SeasonFarm) =>
  validSeasonState({ version: 1, farms: [f], activeId: f.id, confirmedKey: null });
afterEach(() => vi.useRealTimers());
describe('continuous-input and provenance boundaries', () => {
  it('round-trips all area units across 400 deterministic magnitudes', () => {
    for (const unit of Object.keys(hectaresPerUnit) as AreaUnit[])
      for (let i = 0; i < 100; i++) {
        const hectares = 10 ** (-6 + (i * 9) / 99);
        expect(areaToHectares(areaFromHectares(hectares, unit), unit)).toBeCloseTo(hectares, 7);
      }
  });
  it.each([0, -1, 1000.00001, NaN, Infinity])('rejects unsupported field area %s', (area) => {
    expect(valid({ ...farm, field: { ...farm.field, area } })).toBe(false);
    expect(suggestSeason(context, { ...farm.field, area }, '2026-11-01')).toHaveLength(0);
  });
  it('preserves exact valid coordinates and canonically wraps repeated map worlds', () => {
    for (let i = 0; i < 1000; i++) {
      const p = canonicalPin(-100 + i * 0.2, -1800 + i * 3.7);
      expect(validSite({ ...p, name: 'ক্ষেত 🌱' })).toBe(true);
      expect(p.latitude).toBeGreaterThanOrEqual(-85);
      expect(p.longitude).toBeLessThanOrEqual(180);
    }
    expect(validSite({ latitude: NaN, longitude: 0, name: 'field' })).toBe(false);
    expect(validSite({ latitude: 0, longitude: 181, name: 'field' })).toBe(false);
  });
  it('rejects a different farm climate, forged source URL and negative rainfall in stored records', () => {
    expect(valid(farm)).toBe(true);
    expect(valid({ ...farm, context: { ...context, site: contexts[1].context.site } })).toBe(false);
    expect(valid({ ...farm, context: { ...context, normal: contexts[1].context.normal } })).toBe(
      false,
    );
    for (const sourceUrl of [
      'https://power.larc.nasa.gov.evil.invalid/',
      'https://power.larc.nasa.gov/incorrect',
    ])
      expect(
        valid({ ...farm, context: { ...context, normal: { ...context.normal!, sourceUrl } } }),
      ).toBe(false);
    expect(
      valid({ ...farm, context: { ...context, normal: { ...context.normal!, annualRain: -1 } } }),
    ).toBe(false);
    const months = context.normal!.months.map((m, i) => ({ ...m, rain: i === 0 ? -1 : m.rain }));
    expect(
      valid({ ...farm, context: { ...context, normal: { ...context.normal!, months } } }),
    ).toBe(false);
  });
  it('accepts readable Unicode names without allowing oversized or impossible records', () => {
    expect(
      valid({ ...farm, field: { ...farm.field, name: 'আমার ক্ষেত · مزرعة · ферма 🌱' } }),
    ).toBe(true);
    expect(valid({ ...farm, field: { ...farm.field, name: 'x'.repeat(81) } })).toBe(false);
    expect(valid({ ...farm, plantedDate: '2027-02-29' })).toBe(false);
    expect(valid({ ...farm, plantedDate: '2028-02-29' })).toBe(true);
    expect(valid({ ...farm, plantedDate: '2026-11-02', harvestedDate: '2026-11-01' })).toBe(false);
  });
  it('uses only a recent forecast for the actual farm, never another farm or stale response', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));
    const weather: LiveWeather = {
      requested: farm.site,
      grid: farm.site,
      timezone: 'UTC',
      utcOffset: 0,
      fetchedAt: '2026-11-01T12:00:00Z',
      sourceUrl: 'https://api.open-meteo.com/',
      current: {
        time: '2026-11-01T12:00',
        interval: 900,
        temperature: 25,
        humidity: 60,
        rain: 0,
        wind: 10,
      },
      days: [
        {
          date: '2026-11-01',
          maximum: 30,
          minimum: 20,
          rain: 5,
          rainProbability: 80,
          wind: 10,
          et0: 3,
        },
      ],
    };
    const weatherActions = (w: LiveWeather) =>
      actionsForDay(farm, '2026-11-01', w).filter((a) => a.kind === 'weather');
    expect(weatherActions(weather).length).toBeGreaterThan(0);
    expect(weatherActions({ ...weather, requested: contexts[1].context.site })).toEqual([]);
    expect(
      weatherActions({ ...weather, current: { ...weather.current, time: '2026-10-31T12:00' } }),
    ).toEqual([]);
  });
});
