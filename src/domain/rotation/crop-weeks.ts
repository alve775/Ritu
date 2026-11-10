import type { RotationCrop } from '../../data/rotation-crops';
import type { MonthlyClimate } from './climate';
import { dayCount, daysInMonth, monthIndex, plusDays } from './dates';
import { nasaWeekOn } from '../nasa-local';

export type CropStage = 'sow' | 'young' | 'grow' | 'flower' | 'harvest';
export interface CropWeek {
  start: string;
  days: number;
  /** Average rain expected in the week, mm. */
  rain: number;
  /** Water the crop uses in the week (Kc × ET0, plus seepage for flooded rice), mm. */
  use: number;
  /** Irrigation to give this week, mm; 0 when rain and soil water are enough. */
  irrigate: number;
  /** Average day maximum, °C. */
  maxC: number;
  stage: CropStage;
  /** The heat-sensitive part of the season. */
  sensitive: boolean;
  /** Sensitive and hotter than the crop's limit. */
  hot: boolean;
  /** Rain alone covers the crop's water this week. */
  wet: boolean;
}

/** Soil water the root zone can give the crop between irrigations, mm (clay-loam planning value). */
export const soilStoreMm = 60;
/** Effective share of rain that reaches the root zone. */
const effectiveRain = 0.8;
/** Flooded rice: water to puddle the field before transplanting, and daily seepage into the subsoil, mm. */
const puddlingMm = 120;
const seepageMm = 2;

/** FAO-56 crop coefficient curve: initial (15%), development (30%), mid-season (35%), late (20%). */
export function cropCoefficient(crop: RotationCrop, share: number) {
  const [ini, mid, end] = crop.kc;
  if (share < 0.15) return ini;
  if (share < 0.45) return ini + ((share - 0.15) / 0.3) * (mid - ini);
  if (share < 0.8) return mid;
  return mid + ((Math.min(share, 1) - 0.8) / 0.2) * (end - mid);
}

/** Below this usual root-zone wetness (SMAP, 0–1) the field gets one irrigation before sowing. */
export const presowBelow = 0.5;

/**
 * Soil water a crop starts with. Rice starts on a dry field it puddles. With NASA SMAP for the land,
 * other crops start with the root-zone water usual in the sowing week; when that is below half, one
 * irrigation before sowing fills the soil (presow, mm). Without SMAP: full after the monsoon
 * (October to December), half otherwise.
 */
export function startSoil(crop: RotationCrop, sow: string, climate: MonthlyClimate) {
  const wetness = nasaWeekOn(climate.nasa, sow)?.root ?? null;
  if (crop.rice) return { store: 0, presow: 0, wetness };
  if (wetness === null) {
    const m0 = monthIndex(sow);
    return { store: m0 >= 9 && m0 <= 11 ? soilStoreMm : soilStoreMm / 2, presow: 0, wetness };
  }
  const store = Math.round(soilStoreMm * wetness);
  if (wetness < presowBelow)
    return { store: soilStoreMm, presow: Math.ceil((soilStoreMm - store) / 5) * 5, wetness };
  return { store, presow: 0, wetness };
}

/**
 * Week by week through one crop's season from average weather: how much water it uses, how much rain
 * falls, when the soil store runs out (irrigate) and when its sensitive stage meets heat.
 */
export function cropWeeks(crop: RotationCrop, sow: string, climate: MonthlyClimate): CropWeek[] {
  const weeks: CropWeek[] = [];
  let store = startSoil(crop, sow, climate).store;
  for (let offset = 0; offset < crop.days; offset += 7) {
    const start = plusDays(sow, offset);
    const days = Math.min(7, crop.days - offset);
    let use = 0,
      rain = 0,
      heat = 0;
    for (let d = 0; d < days; d++) {
      const date = plusDays(start, d),
        m = monthIndex(date),
        share = (offset + d) / crop.days;
      use += cropCoefficient(crop, share) * climate.et0[m];
      if (crop.rice) use += seepageMm + (offset + d === 0 ? puddlingMm : 0);
      rain += climate.rain[m] / daysInMonth(date);
      heat += climate.max[m];
    }
    const maxC = heat / days;
    const f0 = offset / crop.days,
      f1 = (offset + days) / crop.days;
    let balance = store + effectiveRain * rain - use;
    let irrigate = 0;
    const floor = crop.rice ? 10 : 0;
    if (balance < floor) {
      const target = crop.rice ? 50 : soilStoreMm;
      irrigate = Math.ceil((target - balance) / 5) * 5;
      balance += irrigate;
    }
    store = Math.min(crop.rice ? 60 : soilStoreMm, Math.max(0, balance));
    const sensitive = !!crop.heat && f1 > crop.heat.from && f0 < crop.heat.to;
    const stage: CropStage =
      f0 < 0.1
        ? 'sow'
        : f0 < 0.3
          ? 'young'
          : sensitive
            ? 'flower'
            : f0 >= 0.85
              ? 'harvest'
              : 'grow';
    weeks.push({
      start,
      days,
      rain: Math.round(rain),
      use: Math.round(use),
      irrigate,
      maxC: Math.round(maxC * 10) / 10,
      stage,
      sensitive,
      hot: sensitive && maxC > crop.heat!.limitC,
      wet: effectiveRain * rain >= use,
    });
  }
  return weeks;
}

export const weekOf = (weeks: CropWeek[], date: string) =>
  weeks.findIndex((w) => dayCount(w.start, date) >= 0 && dayCount(w.start, date) < w.days);
