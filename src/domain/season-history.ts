import { calendarByCrop } from '../data/regional-calendars';
import { addDays, referenceWeekStart, validDate } from './evidence-planner';
import type { CropId } from './types';
import { powerParameters } from './nasa-power';
export interface SeasonHistory {
  crop: CropId;
  latitude: number;
  longitude: number;
  start: string;
  end: string;
  days: number;
  rain: number;
  temperature: number;
  minimum: number;
  maximum: number;
  wetness: number;
  requestUrl: string;
  retrievedAt: string;
  sources: string[];
  apiVersion: string;
}
/** Latest completed reference interval, with three days reserved for POWER publication latency. End is inclusive. */
export function historyRange(crop: CropId, now = new Date()) {
  const c = calendarByCrop(crop);
  if (!c) throw Error('Unsupported regional crop');
  const limit = addDays(now.toISOString().slice(0, 10), -3);
  for (let year = now.getUTCFullYear(); year >= 2000; year--) {
    const start = referenceWeekStart(year, c.weeks.first),
      end = addDays(start, c.duration.max - 1);
    if (end <= limit) return { start, end };
  }
  throw Error('No completed source interval');
}
export function seasonHistoryUrl(latitude: number, longitude: number, start: string, end: string) {
  if (
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90 ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180 ||
    !validDate(start) ||
    !validDate(end) ||
    start > end ||
    start < '2000-01-01' ||
    Date.parse(end) - Date.parse(start) > 370 * 86400000
  )
    throw Error('Invalid history request');
  const url = new URL('https://power.larc.nasa.gov/api/temporal/daily/point');
  url.search = new URLSearchParams({
    parameters: powerParameters.join(','),
    community: 'AG',
    latitude: latitude.toFixed(2),
    longitude: longitude.toFixed(2),
    start: start.replaceAll('-', ''),
    end: end.replaceAll('-', ''),
    format: 'JSON',
    'time-standard': 'LST',
  }).toString();
  return url.href;
}
const record = (x: unknown): Record<string, unknown> => {
  if (!x || typeof x !== 'object' || Array.isArray(x)) throw Error('Invalid NASA record');
  return x as Record<string, unknown>;
};
export function parseSeasonHistory(
  raw: unknown,
  crop: CropId,
  latitude: number,
  longitude: number,
  start: string,
  end: string,
  retrievedAt: string,
): SeasonHistory {
  const requestUrl = seasonHistoryUrl(latitude, longitude, start, end),
    root = record(raw),
    header = record(root.header),
    parameters = record(record(root.properties).parameter),
    metadata = record(root.parameters),
    coordinates = record(root.geometry).coordinates;
  if (
    header.start !== start.replaceAll('-', '') ||
    header.end !== end.replaceAll('-', '') ||
    header.time_standard !== 'LST' ||
    !Number.isFinite(Date.parse(retrievedAt))
  )
    throw Error('Unexpected NASA period');
  if (
    !Array.isArray(coordinates) ||
    !Number.isFinite(coordinates[0]) ||
    !Number.isFinite(coordinates[1]) ||
    Math.abs(Number(coordinates[0]) - longitude) > 0.011 ||
    Math.abs(Number(coordinates[1]) - latitude) > 0.011
  )
    throw Error('Wrong NASA location');
  powerParameters.forEach((p, i) => {
    if (record(metadata[p]).units !== ['C', 'C', 'C', 'mm/day', '1'][i])
      throw Error('Unexpected NASA units');
  });
  const sum = [0, 0, 0, 0, 0];
  let days = 0;
  for (let date = start; date <= end; date = addDays(date, 1)) {
    const values = powerParameters.map((p, i) => {
      const v = record(parameters[p])[date.replaceAll('-', '')];
      if (
        typeof v !== 'number' ||
        !Number.isFinite(v) ||
        v === header.fill_value ||
        v === -999 ||
        (i === 3 && v < 0) ||
        (i === 4 && (v < 0 || v > 1))
      )
        throw Error('Incomplete NASA interval: no missing observations are filled');
      return v;
    });
    if (values[2] > values[0] || values[1] < values[0])
      throw Error('Inconsistent NASA temperature');
    values.forEach((v, i) => (sum[i] += v));
    days++;
  }
  return {
    crop,
    latitude,
    longitude,
    start,
    end,
    days,
    rain: sum[3],
    temperature: sum[0] / days,
    maximum: sum[1] / days,
    minimum: sum[2] / days,
    wetness: sum[4] / days,
    requestUrl,
    retrievedAt,
    sources: Array.isArray(header.sources)
      ? header.sources.filter((x): x is string => typeof x === 'string')
      : [],
    apiVersion: String(record(header.api).version),
  };
}
