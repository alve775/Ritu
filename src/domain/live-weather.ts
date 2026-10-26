import type { FarmSite } from './farm-site';
export interface WeatherDay {
  date: string;
  maximum: number | null;
  minimum: number | null;
  rain: number | null;
  rainProbability: number | null;
  wind: number | null;
  et0: number | null;
}
export interface LiveWeather {
  requested: FarmSite;
  grid: { latitude: number; longitude: number };
  timezone: string;
  utcOffset: number;
  fetchedAt: string;
  sourceUrl: string;
  current: {
    time: string;
    interval: number;
    temperature: number | null;
    humidity: number | null;
    rain: number | null;
    wind: number | null;
  };
  days: WeatherDay[];
}
export function weatherIsRecent(weather: LiveWeather, now = Date.now()) {
  const age = now - (Date.parse(`${weather.current.time}:00Z`) - weather.utcOffset * 1000);
  return Number.isFinite(age) && age >= -900000 && age <= 10800000;
}
const object = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid weather response');
  return value as Record<string, unknown>;
};
const numberOrNull = (value: unknown): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;
export function weatherUrl(latitude: number, longitude: number) {
  if (
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 85 ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180
  )
    throw new Error('Invalid coordinates');
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
    daily:
      'temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max,et0_fao_evapotranspiration',
    timezone: 'auto',
    forecast_days: '7',
  }).toString();
  return url.href;
}
export function parseWeather(raw: unknown, site: FarmSite, fetchedAt: string): LiveWeather {
  const root = object(raw),
    current = object(root.current),
    daily = object(root.daily),
    units = object(root.current_units),
    dailyUnits = object(root.daily_units);
  if (
    units.temperature_2m !== '°C' ||
    units.precipitation !== 'mm' ||
    units.wind_speed_10m !== 'km/h' ||
    units.relative_humidity_2m !== '%' ||
    dailyUnits.precipitation_sum !== 'mm' ||
    dailyUnits.temperature_2m_max !== '°C' ||
    dailyUnits.temperature_2m_min !== '°C' ||
    dailyUnits.et0_fao_evapotranspiration !== 'mm' ||
    dailyUnits.wind_speed_10m_max !== 'km/h' ||
    dailyUnits.precipitation_probability_max !== '%'
  )
    throw new Error('Unexpected weather units');
  if (
    typeof root.timezone !== 'string' ||
    typeof root.utc_offset_seconds !== 'number' ||
    typeof current.time !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(current.time) ||
    typeof root.latitude !== 'number' ||
    typeof root.longitude !== 'number' ||
    !Array.isArray(daily.time) ||
    daily.time.length !== 7 ||
    typeof current.interval !== 'number' ||
    !Number.isFinite(current.interval) ||
    current.interval <= 0
  )
    throw new Error('Incomplete weather response');
  try {
    new Intl.DateTimeFormat('en', { timeZone: root.timezone }).format();
  } catch {
    throw new Error('Invalid weather timezone');
  }
  if (
    !Number.isFinite(root.utc_offset_seconds) ||
    Math.abs(root.utc_offset_seconds) > 50400 ||
    !Number.isFinite(root.latitude) ||
    Math.abs(root.latitude) > 90 ||
    !Number.isFinite(root.longitude) ||
    Math.abs(root.longitude) > 180 ||
    !Number.isFinite(Date.parse(fetchedAt))
  )
    throw new Error('Invalid weather metadata');
  for (const [key, min, max] of [
    ['relative_humidity_2m', 0, 100],
    ['precipitation', 0, Infinity],
    ['wind_speed_10m', 0, Infinity],
  ] as const) {
    const v = numberOrNull(current[key]);
    if (v !== null && (v < min || v > max)) throw new Error('Invalid current weather');
  }
  const keys = [
    'temperature_2m_max',
    'temperature_2m_min',
    'precipitation_sum',
    'precipitation_probability_max',
    'wind_speed_10m_max',
    'et0_fao_evapotranspiration',
  ];
  if (keys.some((k) => !Array.isArray(daily[k]) || (daily[k] as unknown[]).length !== 7))
    throw new Error('Incomplete forecast');
  const value = (key: string, i: number) => numberOrNull((daily[key] as unknown[])[i]);
  const days = daily.time.map((date, i): WeatherDay => {
    if (
      typeof date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date ||
      (i > 0 && Date.parse(date) - Date.parse(String((daily.time as string[])[i - 1])) !== 86400000)
    )
      throw new Error('Invalid forecast dates');
    const d = {
      date,
      maximum: value(keys[0], i),
      minimum: value(keys[1], i),
      rain: value(keys[2], i),
      rainProbability: value(keys[3], i),
      wind: value(keys[4], i),
      et0: value(keys[5], i),
    };
    if (
      (d.rain !== null && d.rain < 0) ||
      (d.wind !== null && d.wind < 0) ||
      (d.et0 !== null && d.et0 < 0) ||
      (d.rainProbability !== null && (d.rainProbability < 0 || d.rainProbability > 100)) ||
      (d.maximum !== null && d.minimum !== null && d.maximum < d.minimum)
    )
      throw new Error('Invalid forecast values');
    return d;
  });
  if (days[0].date !== current.time.slice(0, 10))
    throw new Error('Mismatched forecast/current date');
  return {
    requested: site,
    grid: { latitude: root.latitude, longitude: root.longitude },
    timezone: root.timezone,
    utcOffset: root.utc_offset_seconds,
    fetchedAt,
    sourceUrl: weatherUrl(site.latitude, site.longitude),
    current: {
      time: current.time,
      interval: current.interval,
      temperature: numberOrNull(current.temperature_2m),
      humidity: numberOrNull(current.relative_humidity_2m),
      rain: numberOrNull(current.precipitation),
      wind: numberOrNull(current.wind_speed_10m),
    },
    days,
  };
}
