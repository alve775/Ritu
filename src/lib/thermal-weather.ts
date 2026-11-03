import type { FarmSite } from '../domain/farm-site';
import type { TemperatureDay, ThermalWeather } from '../domain/crop-thermal';
import { localToday, daysBetween } from '../domain/global-season';
import { addDays, validDate } from '../domain/evidence-planner';

export function thermalWeatherUrls(site: FarmSite, from: string, now = new Date()) {
  const utcToday = now.toISOString().slice(0, 10);
  if (
    !validDate(from) ||
    from > addDays(utcToday, 1) ||
    daysBetween(from, utcToday) > 730 ||
    !Number.isFinite(site.latitude) ||
    Math.abs(site.latitude) > 85 ||
    !Number.isFinite(site.longitude) ||
    Math.abs(site.longitude) > 180
  )
    throw Error(
      'A valid planting date within the last 730 days and valid coordinates are required.',
    );
  const shared = {
    latitude: String(site.latitude),
    longitude: String(site.longitude),
    daily: 'temperature_2m_max,temperature_2m_min',
    temperature_unit: 'celsius',
    timezone: 'auto',
  };
  const forecast =
    'https://api.open-meteo.com/v1/forecast?' +
    new URLSearchParams({ ...shared, past_days: '14', forecast_days: '7' });
  // ERA5 has publication latency. Last week's completed local days come from
  // the recent model-history series; neither is a field temperature sensor.
  const start = addDays(from, 1),
    end = addDays(utcToday, -7);
  const archive =
    start <= end
      ? 'https://archive-api.open-meteo.com/v1/archive?' +
        new URLSearchParams({ ...shared, start_date: start, end_date: end })
      : null;
  return { forecast, archive };
}
export function parseTemperatureSeries(raw: unknown, site: FarmSite, sourceUrl: string) {
  if (!raw || typeof raw !== 'object') throw Error('Invalid temperature response');
  const r = raw as {
    latitude: number;
    longitude: number;
    timezone: string;
    daily_units?: Record<string, string>;
    daily?: Record<string, unknown>;
  };
  if (
    !Number.isFinite(r.latitude) ||
    !Number.isFinite(r.longitude) ||
    Math.abs(r.latitude - site.latitude) > 1 ||
    Math.min(Math.abs(r.longitude - site.longitude), 360 - Math.abs(r.longitude - site.longitude)) >
      1 ||
    typeof r.timezone !== 'string'
  )
    throw Error('Wrong weather grid or missing timezone');
  new Intl.DateTimeFormat('en', { timeZone: r.timezone }).format();
  if (r.daily_units?.temperature_2m_min !== '°C' || r.daily_units?.temperature_2m_max !== '°C')
    throw Error('Celsius temperature units are required');
  const dates = r.daily?.time,
    mins = r.daily?.temperature_2m_min,
    maxs = r.daily?.temperature_2m_max;
  if (
    !Array.isArray(dates) ||
    !Array.isArray(mins) ||
    !Array.isArray(maxs) ||
    dates.length !== mins.length ||
    dates.length !== maxs.length ||
    dates.length > 750 ||
    new Set(dates).size !== dates.length
  )
    throw Error('Invalid daily series');
  const days: TemperatureDay[] = dates.map((date, i) => {
    if (!validDate(date)) throw Error('Invalid temperature date');
    const minimum = mins[i],
      maximum = maxs[i];
    for (const v of [minimum, maximum])
      if (v !== null && (typeof v !== 'number' || !Number.isFinite(v) || v < -90 || v > 65))
        throw Error('Invalid temperature value');
    if (minimum !== null && maximum !== null && minimum > maximum)
      throw Error('Inverted temperature range');
    return { date, minimum, maximum, sourceUrl };
  });
  return { timezone: r.timezone, days };
}
export function combineThermalWeather(
  site: FarmSite,
  from: string,
  forecast: ReturnType<typeof parseTemperatureSeries>,
  archive: ReturnType<typeof parseTemperatureSeries> | null,
  sources: string[],
  now = new Date(),
): ThermalWeather {
  if (archive && archive.timezone !== forecast.timezone)
    throw Error('The history and forecast timezones disagree');
  const today = localToday(forecast.timezone, now);
  const history = new Map(
    forecast.days.filter((d) => d.date > from && d.date < today).map((d) => [d.date, d]),
  );
  for (const d of archive?.days ?? [])
    if (d.date > from && d.date < today && d.minimum !== null && d.maximum !== null)
      history.set(d.date, d);
  return {
    requested: site,
    timezone: forecast.timezone,
    today,
    fetchedAt: now.toISOString(),
    history: [...history.values()].sort((a, b) => a.date.localeCompare(b.date)),
    forecast: forecast.days.filter((d) => d.date >= today && d.date <= addDays(today, 6)),
    sources,
  };
}
