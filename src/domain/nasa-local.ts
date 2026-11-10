import { dayCount, fromTime, isoOf, plusDays, toTime, yearOf } from './rotation/dates';

/** The pilot box the NASA files cover: west, south, east, north. */
export const rajshahiBox = [87.9, 24, 89.45, 25.3] as const;

export const inRajshahiBox = (lat: number, lon: number) =>
  lon >= rajshahiBox[0] && lon <= rajshahiBox[2] && lat >= rajshahiBox[1] && lat <= rajshahiBox[3];
const kmPerDegree = (Math.PI * 6371) / 180;

type Week = { w: number };

export interface Cell<T extends Week> {
  lat: number;
  lon: number;
  weeks: readonly T[];
}

type Grid<T extends Week> = { cells: readonly Cell<T>[] } & (
  { gridDeg: number } | { gridKm: number }
);

/** The nearest cell centre, provided the land is in the pilot box and within one grid spacing. */
export function nearestCell<T extends Week>(grid: Grid<T>, lat: number, lon: number) {
  if (!inRajshahiBox(lat, lon)) return null;

  const gridKm = 'gridKm' in grid ? grid.gridKm : grid.gridDeg * kmPerDegree;
  const lonScale = Math.cos((lat * Math.PI) / 180);
  let nearest: Cell<T> | null = null;
  let nearestKm = Infinity;
  for (const cell of grid.cells) {
    const distanceKm = kmPerDegree * Math.hypot(cell.lat - lat, (cell.lon - lon) * lonScale);
    if (distanceKm <= gridKm && distanceKm < nearestKm) {
      nearest = cell;
      nearestKm = distanceKm;
    }
  }
  return nearest;
}

/** Same ISO week and week-53 fold as the offline downloader. */
export function nasaWeek(date: string) {
  const ms = toTime(date);
  if (!Number.isFinite(ms) || fromTime(ms) !== date) return null;
  const thursday = plusDays(date, 3 - ((new Date(ms).getUTCDay() + 6) % 7));
  const daysIntoYear = dayCount(isoOf(yearOf(thursday), 1, 1), thursday);
  return Math.min(52, 1 + Math.floor(daysIntoYear / 7));
}

export function weeklyValue<T extends Week>(
  grid: Grid<T> | null | undefined,
  lat: number,
  lon: number,
  date: string,
): T | null {
  if (!grid) return null;
  const week = nasaWeek(date);
  return nearestCell(grid, lat, lon)?.weeks.find(({ w }) => w === week) ?? null;
}

/** One ISO week of the IMERG rain summary (2001 onwards) for a grid cell. */
export interface RainWeek {
  w: number;
  rainMm?: number;
  rainP20?: number;
  rainP80?: number;
  dry21?: number;
  dryYears?: number;
  drySamples?: number;
}
/** One ISO week of the SMAP L4 soil moisture summary (2015 onwards) for a grid cell, m³/m³. */
export interface SoilWeek {
  w: number;
  root?: number;
  rootP20?: number;
  rootP80?: number;
  surface?: number;
}
export interface RainFile {
  period: readonly string[];
  gridDeg: number;
  cells: readonly Cell<RainWeek>[];
}
export interface SoilFile {
  period: readonly string[];
  gridKm: number;
  cells: readonly Cell<SoilWeek>[];
}

/** What Ritu uses from NASA IMERG and SMAP for one ISO week at a land's pin. */
export interface NasaWeek {
  /** Mean rain in the week, mm (IMERG). */
  rain: number | null;
  /** Share of years with a 21-day run below 1 mm touching this week (IMERG), with its counts. */
  dry: number | null;
  dryYears: number;
  drySamples: number;
  /**
   * Usual root-zone wetness this week from SMAP, 0 (the driest week anywhere in the Rajshahi
   * region) to 1 (the wettest).
   */
  root: number | null;
}
/** NASA rain and soil summaries for a land inside the Rajshahi box: 52 ISO weeks, week 1 first. */
export interface NasaClimate {
  weeks: NasaWeek[];
  rainCell: { lat: number; lon: number };
  soilCell: { lat: number; lon: number };
  rainPeriod: [string, string];
  soilPeriod: [string, string];
}

/** The lowest and highest usual weekly root-zone wetness across all SMAP cells of the region. */
export function soilRange(soil: SoilFile): [number, number] {
  let lo = Infinity,
    hi = -Infinity;
  for (const c of soil.cells)
    for (const w of c.weeks)
      if (w.root !== undefined) {
        lo = Math.min(lo, w.root);
        hi = Math.max(hi, w.root);
      }
  return [lo, hi];
}

/** The 52 weeks Ritu needs at a pin, or null outside the box or when either grid has no cell there. */
export function nasaClimateAt(
  rain: RainFile,
  soil: SoilFile,
  lat: number,
  lon: number,
  range: [number, number] = soilRange(soil),
): NasaClimate | null {
  const r = nearestCell(rain, lat, lon),
    s = nearestCell(soil, lat, lon);
  if (!r || !s) return null;
  const [lo, hi] = range,
    span = hi - lo;
  const weeks = Array.from({ length: 52 }, (_, i): NasaWeek => {
    const a = r.weeks.find((w) => w.w === i + 1),
      b = s.weeks.find((w) => w.w === i + 1);
    const root =
      b?.root === undefined || !(span > 0)
        ? null
        : Math.round(Math.max(0, Math.min(1, (b.root - lo) / span)) * 100) / 100;
    return {
      rain: a?.rainMm ?? null,
      dry: a?.dry21 ?? null,
      dryYears: a?.dryYears ?? 0,
      drySamples: a?.drySamples ?? 0,
      root,
    };
  });
  return {
    weeks,
    rainCell: { lat: r.lat, lon: r.lon },
    soilCell: { lat: s.lat, lon: s.lon },
    rainPeriod: [rain.period[0], rain.period[1]],
    soilPeriod: [soil.period[0], soil.period[1]],
  };
}

/** The NASA week a date falls in, or null without NASA data. */
export const nasaWeekOn = (nasa: NasaClimate | null | undefined, date: string) => {
  const w = nasa ? nasaWeek(date) : null;
  return nasa && w ? (nasa.weeks[w - 1] ?? null) : null;
};
