import { describe, it, expect } from 'vitest';
import {
  combineThermalWeather,
  parseTemperatureSeries,
  thermalWeatherUrls,
} from './thermal-weather';
import { trackingFarm } from '../../tests/fixtures/tracking-farm';
const site = trackingFarm().site,
  now = new Date('2026-03-05T10:00:00Z');
export function rawTemperatures(dates = ['2026-03-04', '2026-03-05', '2026-03-06']) {
  return {
    latitude: site.latitude,
    longitude: site.longitude,
    timezone: 'Asia/Dhaka',
    daily_units: { temperature_2m_min: '°C', temperature_2m_max: '°C' },
    daily: {
      time: dates,
      temperature_2m_min: dates.map(() => 10 as number | null),
      temperature_2m_max: dates.map(() => 30 as number | null),
    },
  };
}
describe('real temperature provider boundary', () => {
  it('builds fixed provider URLs with daily Celsius and publication latency accounted for', () => {
    const urls = thermalWeatherUrls(site, '2026-02-01', now);
    expect(new URL(urls.forecast).hostname).toBe('api.open-meteo.com');
    expect(new URL(urls.forecast).searchParams.get('past_days')).toBe('14');
    const a = new URL(urls.archive!);
    expect(a.searchParams.get('start_date')).toBe('2026-02-02');
    expect(a.searchParams.get('end_date')).toBe('2026-02-26');
    expect(thermalWeatherUrls(site, '2026-03-04', now).archive).toBe(null);
  });
  it.each(['', 'invalid', '2026-03-07', '2020-01-01'])(
    'rejects invalid or unsupported planting dates %s',
    (from) => expect(() => thermalWeatherUrls(site, from, now)).toThrow(),
  );
  it('rejects malformed units, grids, zones, arrays, duplicates and extreme/inverted temperatures', () => {
    for (const change of [
      (r: ReturnType<typeof rawTemperatures>) => {
        r.latitude = 0;
      },
      (r: ReturnType<typeof rawTemperatures>) => {
        r.daily_units.temperature_2m_min = '°F';
      },
      (r: ReturnType<typeof rawTemperatures>) => {
        r.timezone = 'wrong';
      },
      (r: ReturnType<typeof rawTemperatures>) => {
        r.daily.time[1] = r.daily.time[0];
      },
      (r: ReturnType<typeof rawTemperatures>) => {
        r.daily.temperature_2m_max.pop();
      },
      (r: ReturnType<typeof rawTemperatures>) => {
        r.daily.temperature_2m_min[0] = 50;
      },
      (r: ReturnType<typeof rawTemperatures>) => {
        r.daily.temperature_2m_max[0] = 100;
      },
    ]) {
      const raw = rawTemperatures();
      change(raw);
      expect(() => parseTemperatureSeries(raw, site, 'https://example.org/qa')).toThrow();
    }
  });
  it('retains gaps, prefers archive for overlaps, and separates local completed history from seven future days', () => {
    const raw = rawTemperatures([
      '2026-03-01',
      '2026-03-02',
      '2026-03-04',
      '2026-03-05',
      '2026-03-06',
      '2026-03-12',
    ]);
    raw.daily.temperature_2m_min[1] = null;
    const f = parseTemperatureSeries(raw, site, 'https://example.org/recent'),
      a = rawTemperatures(['2026-03-04']);
    a.daily.temperature_2m_min[0] = 12;
    const result = combineThermalWeather(
      site,
      '2026-03-01',
      f,
      parseTemperatureSeries(a, site, 'https://example.org/archive'),
      [],
      now,
    );
    expect(result.history.map((d) => d.date)).toEqual(['2026-03-02', '2026-03-04']);
    expect(result.history[0].minimum).toBe(null);
    expect(result.history[1].minimum).toBe(12);
    expect(result.forecast.map((d) => d.date)).toEqual(['2026-03-05', '2026-03-06']);
    expect(() =>
      combineThermalWeather(site, '2026-03-01', f, { timezone: 'UTC', days: [] }, [], now),
    ).toThrow();
  });
});
