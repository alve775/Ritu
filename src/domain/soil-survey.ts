import type { Farm } from './types';
import { appSoil, type UsdaTexture } from './soil-texture';

/**
 * BARC crop-zoning soil units (SRDI soil survey data), sampled on a grid over Rajshahi,
 * Chapainawabganj, Natore and Naogaon by scripts/fetch-barc-rajshahi.py. Each cell is an index into `units`, -1 outside the
 * districts, or -2 where there is no soil unit (rivers, towns).
 */
export interface SoilSurveyFile {
  source: string;
  sourceUrl: string;
  copyright: string;
  retrievedAt: string;
  fields: string[];
  step: number;
  origin: [number, number];
  rows: number;
  cols: number;
  units: (string | number | null)[][];
  cells: number[];
}
export const landTypes = [
  'High Land',
  'Medium High Land-1',
  'Medium High Land-2',
  'Medium Low Land',
  'Low land',
  'Very Low land',
] as const;
export const surveyTextures = ['Sand', 'Sandy Loam', 'Loam', 'Clay Loam', 'Clay'] as const;
export const drainageClasses = [
  'Well Drained',
  'Moderately Well Drained',
  'Imperfectly Drained',
  'Poorly Drained',
  'Very Poorly Drained',
] as const;
export type LandType = (typeof landTypes)[number];
export type SurveyTexture = (typeof surveyTextures)[number];
export type DrainageClass = (typeof drainageClasses)[number];

/** The soil unit at a pin, as BARC classes it, with what Ritu takes from it. */
export interface SoilSurvey {
  landType: LandType | null;
  texture: SurveyTexture | null;
  drainage: DrainageClass | null;
  reaction: string | null;
  series: string | null;
  aez: number | null;
  /** Ritu's soil choice from the survey texture; null when the unit has no texture. */
  soil: Exclude<Farm['soil'], 'unknown'> | null;
  /**
   * The app's drainage answer: well and moderately well drained units drain well; poorly and very
   * poorly drained units stay saturated for long; imperfectly drained units have no app answer.
   */
  drains: Exclude<Farm['drainage'], 'unknown'> | null;
  source: string;
  sourceUrl: string;
  retrievedAt: string;
}
/** Result at a pin: a soil unit, `none` where the grid has no unit (river, town), or null outside. */
export type SurveyAt = SoilSurvey | 'none' | null;

// BARC's class names sometimes carry stray spaces ("Sandy Loam "): compare them trimmed.
const pick = <T extends string>(list: readonly T[], v: unknown) =>
  typeof v === 'string' && (list as readonly string[]).includes(v.trim()) ? (v.trim() as T) : null;
const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** The grid cell nearest a pin: the pin's own cell, or null outside the sampled grid. */
export function soilSurveyAt(file: SoilSurveyFile, lat: number, lon: number): SurveyAt {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const i = Math.round((lat - file.origin[0]) / file.step),
    j = Math.round((lon - file.origin[1]) / file.step);
  if (i < 0 || j < 0 || i >= file.rows || j >= file.cols) return null;
  const v = file.cells[i * file.cols + j];
  if (v === undefined || v === -1) return null;
  if (v === -2) return 'none';
  const unit = file.units[v];
  if (!unit) return null;
  const at = (name: string) => unit[file.fields.indexOf(name)] ?? null;
  const texture = pick(surveyTextures, at('texture_name')),
    drainage = pick(drainageClasses, at('drainage_name')),
    landType = pick(landTypes, at('land_type_name'));
  // An empty unit (settlement, water body) carries no classes at all.
  if (!texture && !drainage && !landType) return 'none';
  const aez = at('aez');
  return {
    landType,
    texture,
    drainage,
    reaction: text(at('reaction_name')),
    series: text(at('soil_group_name')),
    aez: typeof aez === 'number' ? aez : null,
    // Same three groups as SoilGrids textures: sand and sandy loam light, clay heavy, the rest loam.
    soil: texture ? appSoil(texture.toLowerCase() as UsdaTexture) : null,
    drains:
      drainage === 'Well Drained' || drainage === 'Moderately Well Drained'
        ? 'good'
        : drainage === 'Poorly Drained' || drainage === 'Very Poorly Drained'
          ? 'poor'
          : null,
    source: file.source,
    sourceUrl: file.sourceUrl,
    retrievedAt: file.retrievedAt,
  };
}
