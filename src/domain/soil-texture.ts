import type { Farm, Localized } from './types';

export type UsdaTexture =
  | 'sand'
  | 'loamy sand'
  | 'sandy loam'
  | 'loam'
  | 'silt loam'
  | 'silt'
  | 'sandy clay loam'
  | 'clay loam'
  | 'silty clay loam'
  | 'sandy clay'
  | 'silty clay'
  | 'clay';

/** USDA soil texture triangle (NRCS rules), from sand, silt and clay percentages. */
export function usdaTexture(sand: number, silt: number, clay: number): UsdaTexture {
  const total = sand + silt + clay;
  [sand, silt, clay] = [sand, silt, clay].map((v) => (v / total) * 100);
  if (silt + 1.5 * clay < 15) return 'sand';
  if (silt + 2 * clay < 30) return 'loamy sand';
  if ((clay >= 7 && clay < 20 && sand > 52) || (clay < 7 && silt < 50)) return 'sandy loam';
  if (clay >= 7 && clay < 27 && silt >= 28 && silt < 50 && sand <= 52) return 'loam';
  if ((silt >= 50 && clay >= 12 && clay < 27) || (silt >= 50 && silt < 80 && clay < 12))
    return 'silt loam';
  if (silt >= 80 && clay < 12) return 'silt';
  if (clay >= 20 && clay < 35 && silt < 28 && sand > 45) return 'sandy clay loam';
  if (clay >= 27 && clay < 40 && sand > 20) return 'clay loam';
  if (clay >= 27 && clay < 40) return 'silty clay loam';
  if (clay >= 35 && sand > 45) return 'sandy clay';
  if (clay >= 40 && silt >= 40) return 'silty clay';
  return 'clay';
}

/** The app's three soil choices: light (sandy), medium (loam) and heavy (clay) textures. */
export function appSoil(texture: UsdaTexture): Exclude<Farm['soil'], 'unknown'> {
  if (texture === 'sand' || texture === 'loamy sand' || texture === 'sandy loam') return 'sandy';
  if (texture === 'clay' || texture === 'silty clay' || texture === 'sandy clay') return 'clay';
  return 'loam';
}

export const textureNames: Record<UsdaTexture, Localized> = {
  sand: { en: 'Sand', bn: 'বালু' },
  'loamy sand': { en: 'Loamy sand', bn: 'দোআঁশ বালু' },
  'sandy loam': { en: 'Sandy loam', bn: 'বেলে দোআঁশ' },
  loam: { en: 'Loam', bn: 'দোআঁশ' },
  'silt loam': { en: 'Silt loam', bn: 'পলি দোআঁশ' },
  silt: { en: 'Silt', bn: 'পলি' },
  'sandy clay loam': { en: 'Sandy clay loam', bn: 'বেলে এঁটেল দোআঁশ' },
  'clay loam': { en: 'Clay loam', bn: 'এঁটেল দোআঁশ' },
  'silty clay loam': { en: 'Silty clay loam', bn: 'পলি এঁটেল দোআঁশ' },
  'sandy clay': { en: 'Sandy clay', bn: 'বেলে এঁটেল' },
  'silty clay': { en: 'Silty clay', bn: 'পলি এঁটেল' },
  clay: { en: 'Clay', bn: 'এঁটেল' },
};
