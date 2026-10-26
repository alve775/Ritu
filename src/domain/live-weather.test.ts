import { describe, expect, it } from 'vitest';
import raw from '../../tests/fixtures/open-meteo-20261026.json';
import { canonicalPin, defaultSite, validSite } from './farm-site';
import { parseWeather, weatherIsRecent, weatherUrl } from './live-weather';
import { farmReminders } from './farm-reminders';
import { generateDemoPlans } from './demo-planner';
import { defaultFarm } from '../data/preview';
import { defaultDemo } from '../data/demo-environment';
import { activityKey, validJourney } from '../lib/journey-store';
import type { TrackedPlan } from '../lib/journey-store';

const parsed = () => parseWeather(raw, defaultSite, '2026-10-25T19:00:00Z');
const now = Date.parse(`${raw.current.time}:00Z`) - raw.utc_offset_seconds * 1000;
describe('current weather and forecast provenance', () => {
  it('canonicalizes repeated map worlds and keeps polar pins within the supported map range', () => {
    const pin = canonicalPin(86, 283);
    expect(pin).toEqual({ latitude: 85, longitude: -77 });
    expect(validSite({ ...pin, name: 'Pinned field' })).toBe(true);
  });
  it('requires the provider interval instead of fabricating a fifteen-minute observation', () => {
    const data = structuredClone(raw) as unknown as { current: Record<string, unknown> };
    delete data.current.interval;
    expect(() => parseWeather(data, defaultSite, '2026-10-25T19:00:00Z')).toThrow(/Incomplete/);
  });
  it('preserves actual provider values, grid, source time and all seven local dates', () => {
    const w = parsed();
    expect(w.current.temperature).toBe(raw.current.temperature_2m);
    expect(w.grid.latitude).toBe(raw.latitude);
    expect(w.days[0].rain).toBe(raw.daily.precipitation_sum[0]);
    expect(w.days).toHaveLength(7);
    expect(w.timezone).toBe('Asia/Dhaka');
    expect(w.sourceUrl).toContain('api.open-meteo.com');
  });
  it('keeps unknown rain null, distinguishes it from zero and rejects incorrect units', () => {
    const r = structuredClone(raw) as unknown as Record<string, Record<string, unknown>>;
    r.current.precipitation = null;
    (r.daily.precipitation_sum as unknown[])[0] = null;
    const w = parseWeather(r, defaultSite, '2026-10-25T19:00:00Z');
    expect(w.current.rain).toBeNull();
    expect(w.days[0].rain).toBeNull();
    r.current_units.precipitation = 'in';
    expect(() => parseWeather(r, defaultSite, '2026-10-25T19:00:00Z')).toThrow(/units/);
  });
  it.each(['units', 'timezone', 'dates', 'range', 'grid'])(
    'rejects malformed %s without manufacturing weather',
    (kind) => {
      const r = structuredClone(raw);
      if (kind === 'units') r.daily_units.precipitation_probability_max = 'mm';
      if (kind === 'timezone') r.timezone = 'Unknown/Zone';
      if (kind === 'dates') r.daily.time[2] = '2026-02-30';
      if (kind === 'range') r.current.relative_humidity_2m = 101;
      if (kind === 'grid') r.latitude = Infinity;
      expect(() => parseWeather(r, defaultSite, '2026-10-25T19:00:00Z')).toThrow();
    },
  );
  it('uses a fixed provider URL and rejects invalid coordinates', () => {
    const u = new URL(weatherUrl(38.9, -77));
    expect(u.hostname).toBe('api.open-meteo.com');
    expect(u.searchParams.get('forecast_days')).toBe('7');
    for (const lat of [NaN, Infinity, 91]) expect(() => weatherUrl(lat, 88)).toThrow();
  });
  it('uses source time and UTC offset, not download time, to suppress stale reminders', () => {
    const w = parsed();
    expect(weatherIsRecent(w, now + 600000)).toBe(true);
    expect(weatherIsRecent(w, now + 10800001)).toBe(false);
    expect(farmReminders(w, null, now + 10800001).map((r) => r.id)).toEqual(['save-plan']);
  });
  it('unknown rain produces no dry-weather assertion; freezing air does not assert crop damage', () => {
    const w = parsed();
    w.days.forEach((d) => (d.rain = null));
    w.days[0].minimum = -1;
    const r = farmReminders(w, null, now);
    expect(r.some((r) => r.id === 'moisture-check' || r.id === 'rain-check')).toBe(false);
    expect(r.find((r) => r.id === 'freezing-air')?.detail.en).toContain(
      'does not predict frost damage',
    );
  });
  it('ties rain reminders to the stated forecast rather than prescribing irrigation amounts', () => {
    const w = parsed();
    w.days[0].rain = 7.5;
    w.days[0].rainProbability = 65;
    const r = farmReminders(w, null, now).find((r) => r.id === 'rain-check')!;
    expect(r.detail.en).toContain('7.5 mm');
    expect(r.detail.en).toContain('65%');
    expect(r.detail.en).toContain('Inspect root-zone moisture');
  });
  it('preserves saved farm and actual planting date; rejects impossible dates and never infers a growth stage', () => {
    const rotation = generateDemoPlans(defaultFarm, defaultDemo, 'water')[0];
    const tracked: TrackedPlan = {
      rotation,
      fingerprint: 'saved',
      year: 2026,
      site: defaultSite,
      records: Object.fromEntries(
        rotation.periods
          .filter((p) => p.crop !== 'fallow')
          .map((p) => [
            activityKey(p.crop, p.start, p.duration),
            { planted: false, harvested: false, note: '' },
          ]),
      ),
    };
    const record = Object.values(tracked.records)[0];
    record.planted = true;
    record.plantedDate = '2026-10-20';
    expect(validJourney({ reviewed: null, generatedFor: null, tracked })).toBe(true);
    expect(
      farmReminders(null, tracked, now).find((r) => r.id === 'field-observation')?.detail.en,
    ).toContain('2026-10-20');
    record.plantedDate = '2026-02-30';
    expect(validJourney({ reviewed: null, generatedFor: null, tracked })).toBe(false);
  });
});
