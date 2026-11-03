import catalogue from '../data/global/plant-catalogue.json' with { type: 'json' };
import type { Farm, Localized } from './types';
import type { FarmSite } from './farm-site';
import { addDays } from './evidence-planner';

export interface GlobalCrop {
  id: string;
  scientific: string;
  name: Localized;
  photo: string | null;
  ecocropId: string;
  categories: string[];
  lifespan: string;
  lifeform: string;
  planKind: 'seasonal' | 'perennial-review' | 'unknown';
}
export const globalCrops = catalogue as GlobalCrop[];
const cropIndex = new Map(globalCrops.map((crop) => [crop.id, crop]));
export const globalCrop = (id: string) => cropIndex.get(id);
export interface ClimateNormal {
  latitude: number;
  longitude: number;
  period: '1991–2020';
  sourceUrl: string;
  retrievedAt: string;
  annualRain: number;
  months: { month: number; temperature: number; rain: number }[];
}
export interface LocalCropCalendar {
  crop: string;
  season: string;
  planting: number;
  first: number | null;
  last: number | null;
  harvest: number;
  duration: number;
  observation: number;
  level: number;
  sourceUrl: string;
  grid: { latitude: number; longitude: number };
}
export interface SeasonContext {
  site: FarmSite;
  normal: ClimateNormal | null;
  calendars: LocalCropCalendar[];
  calendarSource: string;
  retrievedAt: string;
  climateError?: string;
}
export interface CropSuggestion {
  crop: string;
  /** Absent in older saved annual records. Review is not time to first harvest. */
  planKind?: 'seasonal' | 'perennial-review';
  start: string;
  endEarly: string;
  endLate: string;
  durationMin: number;
  durationMax: number;
  basis: 'regional-calendar' | 'climate-screen';
  calendar?: LocalCropCalendar;
  temperature: number;
  optimalTemperature: boolean;
  annualRainFit: boolean | null;
  cautions: string[];
  reasons: string[];
  /** New screens retain the original source duration beside any shorter
   * temperature-supported planning interval. Neither predicts a cultivar harvest.
   */
  sourceDurationMin?: number;
  sourceDurationMax?: number;
  temperatureWindowDays?: number;
  checks?: {
    factor: 'temperature' | 'soil' | 'drainage' | 'water' | 'local';
    state: 'supported' | 'unknown';
    detail: string;
  }[];
}
export interface SeasonFarm {
  cultivarReference?: import('../data/cultivar-references').CultivarReference;
  waterRecords?: import('./water-balance').WaterDayRecord[];
  id: string;
  createdAt: string;
  field: Farm;
  site: FarmSite;
  selection: CropSuggestion;
  context: SeasonContext;
  plantedDate: string;
  harvestedDate: string;
  notes: string;
  done: string[];
  observations: { date: string; stage: string; note: string }[];
  /** Optional so existing saved farms remain readable. Final harvest is harvestedDate. */
  harvestStartedDate?: string;
  checkIns?: DailyFieldCheckIn[];
  thermalProfile?: MaizeThermalProfile | null;
}
export const observedStages = [
  'Not sure',
  'No change',
  'Establishing',
  'Leaf growth',
  'Flowering',
  'Fruit / grain filling',
  'Maturing',
  'Harvested',
] as const;
export interface DailyFieldCheckIn {
  id: string;
  date: string;
  stage: (typeof observedStages)[number];
  confidence: 'sure' | 'unsure';
  coverage: 'not-sure' | 'few' | 'half' | 'most';
  water: 'not-checked' | 'dry' | 'moist' | 'waterlogged';
  damage: 'not-checked' | 'none-seen' | 'seen';
  harvest: 'none' | 'started' | 'finished';
  /** A new, dated field milestone, not an inferred stage from elapsed days. */
  milestone: 'none' | 'maize-silking' | 'maize-maturity';
  note: string;
}
export interface MaizeThermalProfile {
  version: 1;
  crop: 'maize';
  purpose: 'grain';
  method: 'corn-86-50-f';
  origin: 'planting';
  variety: string;
  targetGdd: number;
  /** Only when the document rates the same hybrid at 50% silking. */
  silkingGdd?: number;
  sourceUrl: string;
  sourceNote: string;
}
export function localToday(timezone?: string, now = new Date()) {
  try {
    const p = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    return `${p.find((x) => x.type === 'year')!.value}-${p.find((x) => x.type === 'month')!.value}-${p.find((x) => x.type === 'day')!.value}`;
  } catch {
    return now.toISOString().slice(0, 10);
  }
}
export const daysBetween = (a: string, b: string) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
function doyDate(year: number, doy: number) {
  const day = addDays('2001-01-01', Math.max(0, Math.min(364, Math.round(doy) - 1)));
  return `${year}${day.slice(4)}`;
}
/** The next date within a published historical planting window, not an optimized date. */
export function nextCalendarDate(calendar: LocalCropCalendar, from: string) {
  const y = Number(from.slice(0, 4));
  const first = calendar.first ?? calendar.planting,
    last = calendar.last ?? calendar.planting;
  const windows = [y - 1, y, y + 1].map((year) => ({
    first: doyDate(year, first),
    last: doyDate(year + (last < first ? 1 : 0), last),
  }));
  const next = windows
    .filter((w) => w.last >= from)
    .sort((a, b) => a.first.localeCompare(b.first))[0];
  return next ? (next.first > from ? next.first : from) : null;
}
