/** POWER meteorology is regional reanalysis, never a parcel sensor or a forecast. */
export const powerParameters = ['T2M', 'T2M_MAX', 'T2M_MIN', 'PRECTOTCORR', 'GWETTOP'] as const;
export interface ClimateMonth {
  /** Calendar month, 1 = January. */
  month: number;
  days: number;
  rain: number;
  temperature: number;
  maximum: number;
  minimum: number;
  wetness: number;
}
export interface PowerClimate {
  id: string;
  source: 'NASA POWER';
  latitude: number;
  longitude: number;
  year: number;
  retrievedAt: string;
  requestUrl: string;
  apiVersion: string;
  sources: string[];
  months: ClimateMonth[];
}
const record = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid POWER response.');
  return value as Record<string, unknown>;
};
export function powerUrl(latitude: number, longitude: number, year: number): string {
  if (
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180 ||
    !Number.isInteger(year) ||
    year < 1981 ||
    year >= new Date().getUTCFullYear()
  ) {
    throw new Error('Choose valid coordinates and a complete historical year from 1981 onward.');
  }
  const url = new URL('https://power.larc.nasa.gov/api/temporal/daily/point');
  url.search = new URLSearchParams({
    parameters: powerParameters.join(','),
    community: 'AG',
    latitude: latitude.toFixed(2),
    longitude: longitude.toFixed(2),
    start: `${year}0101`,
    end: `${year}1231`,
    format: 'JSON',
    'time-standard': 'LST',
  }).toString();
  return url.href;
}
export function parsePower(
  raw: unknown,
  latitude: number,
  longitude: number,
  year: number,
  retrievedAt: string,
  requestUrl = powerUrl(latitude, longitude, year),
): PowerClimate {
  powerUrl(latitude, longitude, year);
  const root = record(raw),
    header = record(root.header);
  const parameters = record(record(root.properties).parameter);
  const metadata = record(root.parameters);
  if (
    header.start !== `${year}0101` ||
    header.end !== `${year}1231` ||
    header.time_standard !== 'LST'
  )
    throw new Error('POWER returned a different date range or time standard.');
  const units = ['C', 'C', 'C', 'mm/day', '1'];
  powerParameters.forEach((key, i) => {
    if (record(metadata[key]).units !== units[i]) throw new Error(`Unexpected units for ${key}.`);
  });
  const coordinates = record(root.geometry).coordinates;
  if (
    !Array.isArray(coordinates) ||
    Math.abs(Number(coordinates[0]) - longitude) > 0.011 ||
    Math.abs(Number(coordinates[1]) - latitude) > 0.011
  )
    throw new Error('POWER returned another location.');
  const months = Array.from({ length: 12 }, (_, index): ClimateMonth => {
    const month = index + 1,
      days = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const sums = [0, 0, 0, 0, 0];
    for (let day = 1; day <= days; day++) {
      const date = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}`;
      powerParameters.forEach((key, i) => {
        const value = record(parameters[key])[date];
        if (
          typeof value !== 'number' ||
          !Number.isFinite(value) ||
          value === header.fill_value ||
          value === -999 ||
          (i === 3 && value < 0) ||
          (i === 4 && (value < 0 || value > 1))
        )
          throw new Error(
            `Incomplete NASA record: ${key} on ${date}. No missing values were filled.`,
          );
        sums[i] += value;
      });
      const mean = Number(record(parameters.T2M)[date]);
      if (
        Number(record(parameters.T2M_MIN)[date]) > mean ||
        Number(record(parameters.T2M_MAX)[date]) < mean
      )
        throw new Error(`Inconsistent NASA temperature record on ${date}.`);
    }
    return {
      month,
      days,
      temperature: sums[0] / days,
      maximum: sums[1] / days,
      minimum: sums[2] / days,
      rain: sums[3],
      wetness: sums[4] / days,
    };
  });
  const apiVersion = String(record(header.api).version);
  const sources = Array.isArray(header.sources)
    ? header.sources.filter((s): s is string => typeof s === 'string')
    : [];
  return {
    id: `POWER:${latitude.toFixed(2)},${longitude.toFixed(2)}:${year}:${apiVersion}:${retrievedAt}`,
    source: 'NASA POWER',
    latitude,
    longitude,
    year,
    retrievedAt,
    requestUrl,
    apiVersion,
    sources,
    months,
  };
}

/** Strict persistence boundary. Never trust a saved arbitrary URL as NASA provenance. */
export function validPowerClimate(value: unknown): value is PowerClimate {
  try {
    const c = record(value);
    if (
      c.source !== 'NASA POWER' ||
      typeof c.latitude !== 'number' ||
      typeof c.longitude !== 'number' ||
      typeof c.year !== 'number' ||
      typeof c.id !== 'string' ||
      typeof c.apiVersion !== 'string' ||
      typeof c.retrievedAt !== 'string' ||
      !Number.isFinite(Date.parse(c.retrievedAt)) ||
      typeof c.requestUrl !== 'string' ||
      !Array.isArray(c.sources) ||
      !c.sources.every((s) => typeof s === 'string')
    )
      return false;
    const url = new URL(c.requestUrl);
    powerUrl(c.latitude, c.longitude, c.year);
    if (
      url.origin !== 'https://power.larc.nasa.gov' ||
      url.pathname !== '/api/temporal/daily/point' ||
      url.username !== '' ||
      url.password !== '' ||
      !url.searchParams.has('latitude') ||
      !url.searchParams.has('longitude') ||
      Number(url.searchParams.get('latitude')) !== c.latitude ||
      Number(url.searchParams.get('longitude')) !== c.longitude ||
      url.searchParams.get('start') !== `${c.year}0101` ||
      url.searchParams.get('end') !== `${c.year}1231`
    )
      return false;
    return (
      Array.isArray(c.months) &&
      c.months.length === 12 &&
      c.months.every((month, i) => {
        const m = record(month);
        return (
          m.month === i + 1 &&
          m.days === new Date(Date.UTC(c.year as number, i + 1, 0)).getUTCDate() &&
          ['rain', 'temperature', 'minimum', 'maximum', 'wetness'].every(
            (k) => typeof m[k] === 'number' && Number.isFinite(m[k]),
          ) &&
          Number(m.rain) >= 0 &&
          Number(m.wetness) >= 0 &&
          Number(m.wetness) <= 1 &&
          Number(m.minimum) <= Number(m.temperature) &&
          Number(m.maximum) >= Number(m.temperature)
        );
      })
    );
  } catch {
    return false;
  }
}
