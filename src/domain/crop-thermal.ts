import type { MaizeThermalProfile, SeasonFarm } from './global-season';
import { daysBetween } from './global-season';
import { addDays, validDate } from './evidence-planner';
import { samePoint } from './farm-site';
import type { FarmSite } from './farm-site';
import { latestFieldUpdate, cycleStatus } from './season-lifecycle';

export const thermalMethodSource =
  'https://cfaes.osu.edu/fact-sheet/corn-growing-degree-days-method-maturity-rating-hybrids';
export interface TemperatureDay {
  date: string;
  minimum: number | null;
  maximum: number | null;
  sourceUrl: string;
}
export interface ThermalWeather {
  requested: FarmSite;
  timezone: string;
  today: string;
  fetchedAt: string;
  history: TemperatureDay[];
  forecast: TemperatureDay[];
  sources: string[];
}
export function validThermalProfile(raw: unknown): raw is MaizeThermalProfile {
  if (!raw || typeof raw !== 'object') return false;
  const p = raw as MaizeThermalProfile;
  let url: URL;
  try {
    url = new URL(p.sourceUrl);
  } catch {
    return false;
  }
  return (
    p.version === 1 &&
    p.crop === 'maize' &&
    p.purpose === 'grain' &&
    p.method === 'corn-86-50-f' &&
    p.origin === 'planting' &&
    typeof p.variety === 'string' &&
    p.variety.trim().length > 0 &&
    p.variety.length <= 120 &&
    Number.isFinite(p.targetGdd) &&
    p.targetGdd >= 100 &&
    p.targetGdd <= 10000 &&
    (p.silkingGdd === undefined ||
      (Number.isFinite(p.silkingGdd) && p.silkingGdd > 0 && p.silkingGdd < p.targetGdd)) &&
    url.protocol === 'https:' &&
    p.sourceUrl.length <= 2000 &&
    !url.username &&
    !url.password &&
    typeof p.sourceNote === 'string' &&
    p.sourceNote.trim().length > 0 &&
    p.sourceNote.length <= 1000
  );
}
/** Ohio State's 86/50 Fahrenheit convention; output is degree-Fahrenheit days.
 * Daily Tmax capped at 86 F; Tmin floored at 50 F; negative daily units become 0.
 * Do not substitute ECOCROP growth-temperature limits for these method parameters.
 */
export function cornGdd(minimumC: number, maximumC: number) {
  if (
    !Number.isFinite(minimumC) ||
    !Number.isFinite(maximumC) ||
    minimumC > maximumC ||
    minimumC < -90 ||
    maximumC > 65
  )
    throw Error('Valid minimum and maximum Celsius temperatures are required.');
  return Math.max(
    0,
    (Math.min(86, maximumC * 1.8 + 32) + Math.max(50, minimumC * 1.8 + 32)) / 2 - 50,
  );
}
export interface ThermalEstimate {
  status:
    | 'not-configured'
    | 'unsupported'
    | 'waiting-planting'
    | 'unavailable'
    | 'history-incomplete'
    | 'forecast-limited'
    | 'projected'
    | 'threshold-reached'
    | 'stage-conflict'
    | 'observed-maturity'
    | 'completed';
  accumulated?: number;
  remaining?: number;
  missingDays?: number;
  projectedDate?: string;
  observedDate?: string;
  anchorDate?: string;
  anchorGdd?: number;
}
export function estimateMaizeMaturity(
  farm: SeasonFarm,
  today: string,
  weather: ThermalWeather | null,
  now = Date.now(),
): ThermalEstimate {
  if (cycleStatus(farm, today) === 'completed') return { status: 'completed' };
  if (!farm.thermalProfile) return { status: 'not-configured' };
  if (farm.selection.crop !== 'maize' || !validThermalProfile(farm.thermalProfile))
    return { status: 'unsupported' };
  if (!farm.plantedDate || farm.plantedDate > today) return { status: 'waiting-planting' };
  const p = farm.thermalProfile;
  const milestones = (farm.checkIns ?? []).filter(
    (c) =>
      c.date >= farm.plantedDate &&
      c.date <= today &&
      c.confidence === 'sure' &&
      ['half', 'most'].includes(c.coverage),
  );
  // A confirmed milestone is a first attainment event, not every repeated day
  // that the farmer still sees silks. Never shift the anchor forward repeatedly.
  const maturity = milestones
    .filter((c) => c.milestone === 'maize-maturity')
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (maturity) return { status: 'observed-maturity', observedDate: maturity.date };
  const age = weather ? now - Date.parse(weather.fetchedAt) : Infinity;
  if (
    !weather ||
    !samePoint(farm.site, weather.requested) ||
    weather.today !== today ||
    !Number.isFinite(age) ||
    age < -300000 ||
    age > 10800000 ||
    daysBetween(farm.plantedDate, today) > 730
  )
    return { status: 'unavailable' };
  const silking =
    p.silkingGdd === undefined
      ? undefined
      : milestones
          .filter((c) => c.milestone === 'maize-silking')
          .sort((a, b) => a.date.localeCompare(b.date))[0];
  const anchorDate = silking?.date ?? farm.plantedDate;
  const anchorGdd = silking ? p.silkingGdd! : 0;
  const history = new Map(
    weather.history.filter((d) => validDate(d.date) && d.date < today).map((d) => [d.date, d]),
  );
  let accumulated = anchorGdd,
    missingDays = 0;
  const first = addDays(anchorDate, 1);
  for (let date = first; date < today; date = addDays(date, 1)) {
    const d = history.get(date);
    if (!d || d.minimum === null || d.maximum === null) {
      missingDays++;
      continue;
    }
    try {
      accumulated += cornGdd(d.minimum, d.maximum);
    } catch {
      missingDays++;
    }
  }
  if (missingDays) return { status: 'history-incomplete', missingDays, anchorDate, anchorGdd };
  const remaining = Math.max(0, p.targetGdd - accumulated);
  const base = { accumulated, remaining, anchorDate, anchorGdd };
  if (remaining === 0) {
    const update = latestFieldUpdate(farm, today);
    return {
      status:
        update?.confidence === 'sure' &&
        update.date >= addDays(today, -7) &&
        ['Establishing', 'Leaf growth', 'Flowering', 'Fruit / grain filling'].includes(update.stage)
          ? 'stage-conflict'
          : 'threshold-reached',
      ...base,
    };
  }
  const forecast = new Map(weather.forecast.map((d) => [d.date, d]));
  let projected = accumulated;
  for (let offset = 0; offset < 7; offset++) {
    const date = addDays(today, offset),
      d = forecast.get(date);
    // The planting/milestone date is already the anchor. Never credit that
    // day's full forecast heat as well, even when the anchor is today.
    if (date <= anchorDate) continue;
    if (!d || d.minimum === null || d.maximum === null) break;
    try {
      projected += cornGdd(d.minimum, d.maximum);
    } catch {
      break;
    }
    if (projected >= p.targetGdd) return { status: 'projected', projectedDate: date, ...base };
  }
  // No invented long-range temperatures or arbitrary +/- day corrections.
  return { status: 'forecast-limited', ...base };
}
