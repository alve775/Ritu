import type { ClimateNormal } from '../global-season';
import type { NasaClimate } from '../nasa-local';

/** Twelve monthly values (January first) for one location, from the NASA POWER 1991–2020 normal. */
export interface MonthlyClimate {
  latitude: number;
  /** Rain in mm for the whole month. */
  rain: number[];
  /** Average, average daily maximum and average daily minimum temperature, °C. */
  mean: number[];
  max: number[];
  min: number[];
  /** Top-soil wetness 0–1 (NASA GWETTOP); null when the normal predates that field. */
  wetness: (number | null)[];
  /** Reference crop water use ET0, mm per day (Hargreaves). */
  et0: number[];
  /** True when max/min had to be estimated because an older saved normal lacks them. */
  estimated: boolean;
  /** NASA IMERG rain and SMAP soil weeks at the pin, when the land is inside the Rajshahi box. */
  nasa?: NasaClimate;
}

/** FAO-56 eq. 21: extraterrestrial radiation in mm/day of evaporation for a latitude and day of year. */
export function extraterrestrialMm(latitude: number, dayOfYear: number) {
  const phi = (latitude * Math.PI) / 180;
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * dayOfYear) / 365);
  const delta = 0.409 * Math.sin((2 * Math.PI * dayOfYear) / 365 - 1.39);
  const ws = Math.acos(Math.max(-1, Math.min(1, -Math.tan(phi) * Math.tan(delta))));
  const ra =
    ((24 * 60) / Math.PI) *
    0.082 *
    dr *
    (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws));
  return 0.408 * ra;
}

/** FAO-56 eq. 52 (Hargreaves): reference evapotranspiration in mm/day. */
export function hargreavesEt0(
  latitude: number,
  month: number,
  mean: number,
  max: number,
  min: number,
) {
  const midDay = [15, 46, 74, 105, 135, 166, 196, 227, 258, 288, 319, 349][month];
  const range = Math.max(0, max - min);
  return Math.max(
    0,
    0.0023 * (mean + 17.8) * Math.sqrt(range) * extraterrestrialMm(latitude, midDay),
  );
}

export function monthlyClimate(normal: ClimateNormal): MonthlyClimate {
  const months = [...normal.months].sort((a, b) => a.month - b.month);
  const estimated = months.some((m) => !Number.isFinite(m.maximum) || !Number.isFinite(m.minimum));
  const mean = months.map((m) => m.temperature);
  // Older saved normals have only the mean; a ±5 °C spread is a rough stand-in until they refresh.
  const max = months.map((m) => (Number.isFinite(m.maximum) ? m.maximum! : m.temperature + 5));
  const min = months.map((m) => (Number.isFinite(m.minimum) ? m.minimum! : m.temperature - 5));
  return {
    latitude: normal.latitude,
    rain: months.map((m) => m.rain),
    mean,
    max,
    min,
    wetness: months.map((m) => (Number.isFinite(m.wetness) ? m.wetness! : null)),
    et0: months.map((_, i) => hargreavesEt0(normal.latitude, i, mean[i], max[i], min[i])),
    estimated,
  };
}
