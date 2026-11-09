import type { FarmSite } from './farm-site';
import type { CropId, Localized } from './types';
import type { Season } from './evidence-planner';

export interface RegionDistrict {
  id: string;
  name: Localized;
  /** Boundary rings as [longitude, latitude] pairs. */
  rings: number[][][];
}
export interface RegionBoundary {
  source: string;
  license: string;
  url: string;
  sourceUrl: string;
  processing: string;
  districts: RegionDistrict[];
}
/**
 * A pilot region: an area where Ritu has sourced crop calendars, so it can compare rotations.
 * Adding a region means adding one data file with its boundary, crops and sources.
 */
export interface PilotRegion {
  id: string;
  name: Localized;
  /** What the region's crop calendars cover, in the source's own terms. */
  scope: Localized;
  calendarSource: Localized;
  boundary: RegionBoundary;
  /** Crops offered per season: those with a sourced calendar for this region. */
  seasonCrops: Record<Season, CropId[]>;
}
export interface RegionMatch {
  region: PilotRegion;
  district: RegionDistrict;
}

/** Even–odd ray casting. Points exactly on an edge may fall either way. */
export function pointInRings(longitude: number, latitude: number, rings: number[][][]) {
  let inside = false;
  for (const ring of rings)
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i],
        [xj, yj] = ring[j];
      if (
        yi > latitude !== yj > latitude &&
        longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi
      )
        inside = !inside;
    }
  return inside;
}

/** The pilot region and district containing a field's pin, or null outside every pilot region. */
export function regionFor(
  site: Pick<FarmSite, 'latitude' | 'longitude'> | undefined,
  regions: PilotRegion[],
): RegionMatch | null {
  if (!site || !Number.isFinite(site.latitude) || !Number.isFinite(site.longitude)) return null;
  for (const region of regions)
    for (const district of region.boundary.districts)
      if (pointInRings(site.longitude, site.latitude, district.rings)) return { region, district };
  return null;
}
