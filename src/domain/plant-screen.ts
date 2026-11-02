import requirements from '../data/global/crop-requirements.json' with { type: 'json' };
import type { Farm } from './types';
import type { ClimateNormal, CropSuggestion, SeasonContext } from './global-season';
import { nextCalendarDate } from './global-season';
import { addDays, validDate } from './evidence-planner';
export { requirements };
/** Weight monthly normals by overlapping days, not thousands of per-day objects. */
function seasonClimate(normal: ClimateNormal, start: string, duration: number) {
  let cursor = Date.parse(start + 'T00:00:00Z'),
    remaining = duration,
    total = 0;
  const months = new Set<number>();
  while (remaining > 0) {
    const date = new Date(cursor),
      month = date.getUTCMonth();
    const next = Date.UTC(date.getUTCFullYear(), month + 1, 1);
    const days = Math.min(remaining, (next - cursor) / 86400000);
    total += normal.months[month].temperature * days;
    months.add(month);
    remaining -= days;
    cursor += days * 86400000;
  }
  return { temperature: total / duration, months: [...months] };
}
export function screeningGap(crop: (typeof requirements.crops)[number]): string | null {
  if (crop.planKind === 'unknown') return 'The source does not establish a planting life cycle.';
  const bounds = [crop.TMIN!, crop.TOPMN!, crop.TOPMX!, crop.TMAX!];
  if (
    bounds.some((v) => v === null || !Number.isFinite(v)) ||
    !(crop.TMIN! < crop.TMAX!) ||
    crop.TOPMN! < crop.TMIN! ||
    crop.TOPMX! > crop.TMAX! ||
    crop.TOPMN! > crop.TOPMX!
  )
    return 'Complete, consistent species temperature bounds are unavailable.';
  if (!crop.GMIN || !crop.GMAX || crop.GMIN < 1 || crop.GMAX < crop.GMIN || crop.GMAX > 365)
    return 'A usable growing-period record is unavailable; no harvest date is invented.';
  return null;
}
type Requirement = (typeof requirements.crops)[number];
interface ClimateWindow {
  crop: Requirement;
  start: string;
  calendar?: import('./global-season').LocalCropCalendar;
  min: number;
  max: number;
  temperature: number;
  optimalTemperature: boolean;
  annualRainFit: boolean | null;
}
interface ClimateCandidate extends ClimateWindow {
  endEarly: string;
  endLate: string;
  temperatureReason: string;
}
const climateCache = new WeakMap<ClimateNormal, Map<string, ClimateCandidate[]>>();
/** Climate candidates are independent of soil, water labels, field name and area.
 * Keep only the best window per species; cache two dates per immutable-value
 * fingerprint so exhaustive input validation does not repeat climate arithmetic.
 */
function climateCandidates(context: SeasonContext, from: string): ClimateCandidate[] {
  const normal = context.normal!;
  const key = JSON.stringify([
    from,
    normal.annualRain,
    normal.months.map((m) => m.temperature),
    context.calendars,
  ]);
  let cache = climateCache.get(normal);
  if (!cache) {
    cache = new Map();
    climateCache.set(normal, cache);
  }
  const hit = cache.get(key);
  if (hit) return hit;
  const candidates: ClimateCandidate[] = [];
  const monthlyStarts = Array.from({ length: 12 }, (_, i) => {
    const date = new Date(`${from}T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + i, 1);
    return { start: i === 0 ? from : date.toISOString().slice(0, 10), calendar: undefined };
  });
  for (const crop of requirements.crops) {
    if (screeningGap(crop)) continue;
    const calendars = context.calendars.filter((c) => c.crop === crop.id);
    const starts = calendars.length
      ? calendars.map((calendar) => ({ start: nextCalendarDate(calendar, from), calendar }))
      : monthlyStarts;
    let best: ClimateWindow | undefined;
    for (const { start, calendar } of starts) {
      if (!start) continue;
      const min = calendar ? Math.round(calendar.duration) : Math.round(crop.GMIN!);
      const max = calendar ? min : Math.min(365, Math.round(crop.GMAX!));
      if (min < 1 || max < min || max > 365) continue;
      const { temperature, months } = seasonClimate(normal, start, max);
      if (temperature < crop.TMIN! || temperature > crop.TMAX!) continue;
      if (
        !calendar &&
        months.some(
          (month) =>
            normal.months[month].temperature < crop.TMIN! ||
            normal.months[month].temperature > crop.TMAX!,
        )
      )
        continue;
      const optimalTemperature = temperature >= crop.TOPMN! && temperature <= crop.TOPMX!;
      const annualRainFit =
        crop.RMIN !== null && crop.RMAX !== null
          ? normal.annualRain >= crop.RMIN && normal.annualRain <= crop.RMAX
          : null;
      const candidate = {
        crop,
        start,
        calendar,
        min,
        max,
        temperature,
        optimalTemperature,
        annualRainFit,
      };
      if (
        !best ||
        Number(optimalTemperature) > Number(best.optimalTemperature) ||
        (optimalTemperature === best.optimalTemperature &&
          (Number(!!calendar) > Number(!!best.calendar) ||
            (!!calendar === !!best.calendar && start < best.start)))
      )
        best = candidate;
    }
    if (best) {
      const review = crop.planKind === 'perennial-review';
      candidates.push({
        ...best,
        endEarly: addDays(best.start, review ? 365 : best.min),
        endLate: addDays(best.start, review ? 365 : best.max),
        temperatureReason: `${best.temperature.toFixed(1)} °C long-term season-average temperature; ECOCROP species range ${crop.TMIN!}–${crop.TMAX!} °C.`,
      });
    }
  }
  if (cache.size >= 2) cache.delete(cache.keys().next().value!);
  cache.set(key, candidates);
  return candidates;
}
/** Transparent broad species climate/soil screen. No yield, pest or field-suitability model is claimed. */
export function suggestSeason(context: SeasonContext, farm: Farm, from: string): CropSuggestion[] {
  if (
    !context.normal ||
    !validDate(from) ||
    !Number.isFinite(farm.area) ||
    farm.area <= 0 ||
    farm.area > 1000
  )
    return [];
  const suggestions: CropSuggestion[] = [];
  for (const {
    crop,
    start,
    calendar,
    min,
    max,
    temperature,
    optimalTemperature,
    annualRainFit,
    endEarly,
    endLate,
    temperatureReason,
  } of climateCandidates(context, from)) {
    const review = crop.planKind === 'perennial-review';
    const texture = farm.soil === 'sandy' ? 'light' : farm.soil === 'clay' ? 'heavy' : 'medium';
    const knownTextures = `${crop.texture}, ${crop.toleratedTexture}`;
    if (
      farm.soil !== 'unknown' &&
      knownTextures.trim().length > 2 &&
      !knownTextures.includes('wide') &&
      !knownTextures.includes(texture)
    )
      continue;
    const drainage = `${crop.drainage}, ${crop.toleratedDrainage}`;
    if (
      farm.drainage === 'poor' &&
      (drainage.includes('well') || drainage.includes('excessive')) &&
      !drainage.includes('poorly')
    )
      continue;
    const cautions: string[] = [
      'Confirm local variety, planting material, soil pH, salinity, pests and legal/invasive-species restrictions before planting. Source use categories do not establish edibility.',
    ];
    if (knownTextures.trim().length <= 2)
      cautions.push(
        'Source soil texture requirements are unrecorded; the entered soil has not been validated against a species requirement.',
      );
    if (drainage.trim().length <= 2)
      cautions.push(
        'Source drainage requirements are unrecorded. Verify drainage tolerance locally.',
      );
    if (review)
      cautions.push(
        'Perennial: the 365-day calendar is a care/review horizon, not a growing duration or first-harvest prediction. Establishment season, winter survival, chilling, pollination and rootstock need local evidence.',
      );
    if (farm.soil === 'unknown') cautions.push('Soil texture has not been confirmed.');
    if (farm.drainage === 'unknown') cautions.push('Check drainage before planting.');
    if (!optimalTemperature)
      cautions.push('Season-average temperature is outside the species preferred range.');
    if (!calendar)
      cautions.push(
        'No local calendar record at this grid point; timing is a broad climate-based planning option.',
      );
    if (annualRainFit === false)
      cautions.push(
        'Long-term annual rain is outside the species rainfall range. Check seasonal water and drainage locally.',
      );
    if (
      farm.irrigation === 'rainfed' ||
      farm.irrigation === 'severe' ||
      farm.irrigation === 'limited'
    )
      cautions.push(
        'Annual rain cannot establish water available during this crop. Confirm stored soil water and seasonal supply.',
      );
    if (farm.irrigation === 'unknown') cautions.push('Water availability has not been confirmed.');
    const reasons = [
      temperatureReason,
      calendar
        ? `Historical ${calendar.season} planting record at the selected 0.5° grid cell.`
        : 'Screened against this location’s 1991–2020 NASA POWER climate.',
    ];
    if (farm.soil !== 'unknown' && knownTextures.trim().length > 2)
      reasons.push('Entered texture is included in the source soil categories.');
    suggestions.push({
      crop: crop.id,
      planKind: review ? 'perennial-review' : 'seasonal',
      start,
      endEarly,
      endLate,
      durationMin: review ? 365 : min,
      durationMax: review ? 365 : max,
      basis: calendar ? 'regional-calendar' : 'climate-screen',
      calendar,
      temperature,
      optimalTemperature,
      annualRainFit,
      cautions,
      reasons,
    });
  }
  const ranked = suggestions.sort(
    (a, b) =>
      Number(b.optimalTemperature) - Number(a.optimalTemperature) ||
      (farm.irrigation === 'rainfed' ||
      farm.irrigation === 'severe' ||
      farm.irrigation === 'limited'
        ? Number(b.annualRainFit === true) - Number(a.annualRainFit === true)
        : 0) ||
      Number(b.basis === 'regional-calendar') - Number(a.basis === 'regional-calendar') ||
      a.start.localeCompare(b.start) ||
      a.crop.localeCompare(b.crop),
  );
  // A crop may have several regional records or candidate months, but the
  // farmer receives one next-season option per species, never a whole year.
  const seen = new Set<string>();
  return ranked.filter((s) => !seen.has(s.crop) && !!seen.add(s.crop));
}
