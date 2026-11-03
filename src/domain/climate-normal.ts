import type { ClimateNormal } from './global-season';
export function climateNormalUrl(latitude: number, longitude: number) {
  if (
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 85 ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180
  )
    throw Error('Invalid coordinates');
  const url = new URL('https://power.larc.nasa.gov/api/temporal/climatology/point');
  url.search = new URLSearchParams({
    parameters: 'T2M,PRECTOTCORR',
    community: 'AG',
    latitude: latitude.toFixed(2),
    longitude: longitude.toFixed(2),
    start: '1991',
    end: '2020',
    format: 'JSON',
  }).toString();
  return url.href;
}
export function parseClimateNormal(
  raw: unknown,
  latitude: number,
  longitude: number,
): ClimateNormal {
  const d = raw as {
    geometry?: { coordinates?: number[] };
    header?: { range?: string };
    parameters?: Record<string, { units: string }>;
    properties?: { parameter?: Record<string, Record<string, number>> };
  };
  const coordinates = d.geometry?.coordinates;
  // POWER may echo three decimal places; requests here use two. Allow that
  // rounding, but never accept a different location or nonnumeric geometry.
  if (
    !coordinates ||
    coordinates.length < 2 ||
    !coordinates.slice(0, 2).every(Number.isFinite) ||
    Math.abs(coordinates[0] - longitude) > 0.006 ||
    Math.abs(coordinates[1] - latitude) > 0.006
  )
    throw Error('NASA returned a different requested point.');
  if (
    !d.header?.range?.includes('1991') ||
    !d.header.range.includes('2020') ||
    d.parameters?.T2M?.units !== 'C' ||
    d.parameters?.PRECTOTCORR?.units !== 'mm/day'
  )
    throw Error('Unexpected baseline or units');
  const p = d.properties?.parameter;
  const names = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ];
  // The actual 1991–2020 interval has eight leap days, not an assumed 7.5.
  const lengths = Array.from(
    { length: 12 },
    (_, month) =>
      Array.from(
        { length: 30 },
        (_, i) => (Date.UTC(1991 + i, month + 1, 1) - Date.UTC(1991 + i, month, 1)) / 86400000,
      ).reduce((sum, days) => sum + days, 0) / 30,
  );
  const months = names.map((key, i) => {
    const temperature = p?.T2M?.[key],
      rate = p?.PRECTOTCORR?.[key];
    if (
      typeof temperature !== 'number' ||
      !Number.isFinite(temperature) ||
      temperature < -100 ||
      temperature > 70 ||
      typeof rate !== 'number' ||
      !Number.isFinite(rate) ||
      rate < 0 ||
      rate > 1000
    )
      throw Error('Missing climate values');
    return { month: i + 1, temperature, rain: rate * lengths[i] };
  });
  return {
    latitude,
    longitude,
    period: '1991–2020',
    sourceUrl: climateNormalUrl(latitude, longitude),
    retrievedAt: new Date().toISOString(),
    months,
    annualRain: months.reduce((total, m) => total + m.rain, 0),
  };
}
