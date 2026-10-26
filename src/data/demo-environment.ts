import type { CropId, CropPeriod, Farm, Localized } from '../domain/types';
import baseline from './nasa/rajshahi-2025.json' with { type: 'json' };
import type { PowerClimate } from '../domain/nasa-power';
import { defaultSite } from '../domain/farm-site';
import type { FarmSite } from '../domain/farm-site';

/** Real historical climate; crop rules below remain experimental, not validated agronomy. */
export interface DemoSettings {
  location: 'barind' | 'other';
  weather: 'seasonal' | 'dry' | 'hot';
  preferred: CropId[];
  enabled: boolean;
  climate?: PowerClimate;
  site?: FarmSite;
}
export const baselineClimate: PowerClimate = { ...baseline, source: 'NASA POWER' };
export const climateFor = (settings: DemoSettings): PowerClimate =>
  settings.climate ?? baselineClimate;
export const siteFor = (settings: DemoSettings): FarmSite =>
  settings.site ??
  (settings.climate
    ? {
        latitude: settings.climate.latitude,
        longitude: settings.climate.longitude,
        name: 'Selected farm',
      }
    : defaultSite);
export const climateMatchesSite = (settings: DemoSettings) =>
  !settings.site ||
  (Number(settings.site.latitude.toFixed(2)) === climateFor(settings).latitude &&
    Number(settings.site.longitude.toFixed(2)) === climateFor(settings).longitude);
export const defaultDemo: DemoSettings = {
  location: 'barind',
  weather: 'seasonal',
  preferred: ['boro', 'aman', 'mung', 'wheat', 'potato', 'mustard'],
  enabled: false,
};
export const demoLocations: Record<DemoSettings['location'], Localized> = {
  barind: { en: 'Rajshahi · Barind pilot', bn: 'রাজশাহী · বরেন্দ্র পাইলট' },
  other: { en: 'Another region', bn: 'অন্য অঞ্চল' },
};
export interface DemoMonth {
  month: number;
  rain: number;
  temperature: number;
  wetness: number;
}
export function demoEnvironment(settings: DemoSettings): DemoMonth[] {
  const climate = climateFor(settings);
  return Array.from({ length: 12 }, (_, month) => {
    const historical = climate.months[(month + 2) % 12];
    // Explicit what-if perturbations, never relabelled as observed weather.
    return {
      month,
      rain: historical.rain * (settings.weather === 'dry' ? 0.45 : 1),
      temperature: historical.temperature + (settings.weather === 'hot' ? 5 : 0),
      // No invented soil-moisture response to hypothetical rainfall.
      wetness: historical.wetness,
    };
  });
}
export interface DemoCropRule {
  seasons: number[];
  water: number;
  drought: number;
  temperature: [number, number];
  soils: Farm['soil'][];
}
// Authored planning windows, not locally validated planting dates. All endpoints
// are inside one March–February cycle; intervals use [start, start + duration).
export const demoWindows: Partial<Record<CropId, Omit<CropPeriod, 'crop'>[]>> = {
  boro: [{ start: 8, duration: 4 }],
  aman: [
    { start: 4, duration: 4 },
    { start: 5, duration: 3 },
  ],
  aus: [{ start: 0, duration: 3 }],
  mung: [
    { start: 0, duration: 2 },
    { start: 1, duration: 2 },
    { start: 4, duration: 2 },
    { start: 5, duration: 2 },
  ],
  wheat: [
    { start: 8, duration: 3 },
    { start: 9, duration: 3 },
  ],
  potato: [
    { start: 8, duration: 3 },
    { start: 9, duration: 3 },
  ],
  mustard: [
    { start: 8, duration: 3 },
    { start: 9, duration: 3 },
  ],
  lentil: [{ start: 9, duration: 3 }],
  chickpea: [{ start: 8, duration: 4 }],
  maize: [
    { start: 0, duration: 4 },
    { start: 8, duration: 4 },
  ],
  groundnut: [{ start: 0, duration: 4 }],
  soybean: [
    { start: 0, duration: 3 },
    { start: 4, duration: 3 },
  ],
};
export function demoDrainage(crop: CropId): Farm['drainage'][] {
  return ['boro', 'aman', 'aus'].includes(crop) ? ['good', 'poor'] : ['good'];
}
// Every number/category below is invented to exercise the software. Do not cite it as crop evidence.
export const demoCropRules: Partial<Record<CropId, DemoCropRule>> = {
  boro: { seasons: [2], water: 3, drought: 3, temperature: [15, 36], soils: ['loam', 'clay'] },
  aman: { seasons: [1], water: 3, drought: 3, temperature: [20, 38], soils: ['loam', 'clay'] },
  aus: { seasons: [0], water: 3, drought: 3, temperature: [20, 38], soils: ['loam', 'clay'] },
  mung: { seasons: [0, 1], water: 1, drought: 2, temperature: [18, 36], soils: ['loam', 'sandy'] },
  wheat: { seasons: [2], water: 2, drought: 2, temperature: [10, 31], soils: ['loam', 'clay'] },
  potato: { seasons: [2], water: 3, drought: 3, temperature: [10, 28], soils: ['loam', 'sandy'] },
  mustard: { seasons: [2], water: 1, drought: 1, temperature: [10, 30], soils: ['loam', 'clay'] },
  lentil: { seasons: [2], water: 1, drought: 2, temperature: [10, 30], soils: ['loam', 'clay'] },
  chickpea: { seasons: [2], water: 1, drought: 1, temperature: [12, 32], soils: ['loam', 'clay'] },
  maize: { seasons: [0, 2], water: 2, drought: 2, temperature: [15, 36], soils: ['loam', 'sandy'] },
  groundnut: {
    seasons: [0],
    water: 2,
    drought: 1,
    temperature: [18, 38],
    soils: ['loam', 'sandy'],
  },
  soybean: {
    seasons: [0, 1],
    water: 2,
    drought: 2,
    temperature: [18, 36],
    soils: ['loam', 'clay'],
  },
};
