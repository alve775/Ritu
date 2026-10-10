import type { CropId, CropPeriod, Farm, Localized } from '../domain/types';

/** Authored fixtures. NOT NASA observations, weather forecasts, or local agronomic rules. */
export interface DemoSettings {
  location: 'barind' | 'other';
  weather: 'seasonal' | 'dry' | 'hot';
  preferred: CropId[];
  enabled: boolean;
}
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
const rainfall = [18, 38, 92, 185, 270, 240, 185, 88, 12, 5, 8, 14];
const temperature = [27, 31, 32, 31, 30, 30, 29, 28, 24, 20, 18, 22];
export function demoEnvironment(settings: DemoSettings): DemoMonth[] {
  return rainfall.map((rain, month) => {
    const adjusted = Math.round(
      rain * (settings.location === 'other' ? 1.3 : 1) * (settings.weather === 'dry' ? 0.45 : 1),
    );
    return {
      month,
      rain: adjusted,
      temperature: temperature[month] + (settings.weather === 'hot' ? 5 : 0),
      wetness: Number(Math.min(0.9, Math.max(0.1, 0.2 + adjusted / 400)).toFixed(2)),
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
