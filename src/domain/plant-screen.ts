import requirements from '../data/global/crop-requirements.json' with { type: 'json' };
import type { Farm } from './types';
import type { ClimateNormal, CropSuggestion, SeasonContext } from './global-season';
import { nextCalendarDate } from './global-season';
import { addDays, validDate } from './evidence-planner';
import { commonPlantNames } from './plant-names';
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
  if (!commonPlantNames(crop).en)
    return 'No sourced common name is available. This identity remains a reference record, not a selectable planting option.';
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

export function sourceFieldCompatibility(crop: Requirement, farm: Farm) {
  const textures = `${crop.texture},${crop.toleratedTexture}`
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s.toUpperCase() !== 'NA');
  const drains = `${crop.drainage},${crop.toleratedDrainage}`
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s && s.toUpperCase() !== 'NA');
  const desiredTexture = { loam: 'medium', clay: 'heavy', sandy: 'light' }[
    farm.soil as 'loam' | 'clay' | 'sandy'
  ];
  const soilMismatch =
    farm.soil !== 'unknown' &&
    textures.length > 0 &&
    !textures.includes('wide') &&
    !textures.includes(desiredTexture);
  const desiredDrain = farm.drainage === 'good' ? 'well' : 'poorly';
  const drainageMismatch =
    farm.drainage !== 'unknown' &&
    drains.length > 0 &&
    !drains.some((s) => s.split(' ')[0] === desiredDrain);
  return {
    soilMismatch,
    drainageMismatch,
    textureRecorded: textures.length > 0,
    drainageRecorded: drains.length > 0,
  };
}

/** A coarse normal-temperature window, not a cultivar growth or frost model. */
function availableTemperatureDays(
  normal: ClimateNormal,
  start: string,
  limit: number,
  min: number,
  max: number,
) {
  let cursor = Date.parse(start + 'T00:00:00Z'),
    days = 0;
  while (days < limit) {
    const d = new Date(cursor),
      m = d.getUTCMonth(),
      t = normal.months[m].temperature;
    if (t < min || t > max) break;
    const part = Math.min(
      limit - days,
      (Date.UTC(d.getUTCFullYear(), m + 1, 1) - cursor) / 86400000,
    );
    days += part;
    cursor += part * 86400000;
  }
  return days;
}

function validScreenContext(context: SeasonContext) {
  const n = context.normal;
  let source: URL;
  try {
    source = new URL(n?.sourceUrl ?? '');
  } catch {
    return false;
  }
  return (
    !!n &&
    n.period === '1991–2020' &&
    Number.isFinite(n.annualRain) &&
    n.annualRain >= 0 &&
    Number.isFinite(context.site.latitude) &&
    Number.isFinite(context.site.longitude) &&
    Math.abs(context.site.latitude) <= 85 &&
    Math.abs(context.site.longitude) <= 180 &&
    source.origin === 'https://power.larc.nasa.gov' &&
    source.pathname === '/api/temporal/climatology/point' &&
    source.searchParams.get('start') === '1991' &&
    source.searchParams.get('end') === '2020' &&
    !!source.searchParams.get('latitude')?.trim() &&
    !!source.searchParams.get('longitude')?.trim() &&
    Number.isFinite(n.latitude) &&
    Number.isFinite(n.longitude) &&
    Math.abs(n.latitude - context.site.latitude) <= 0.006 &&
    Math.abs(n.longitude - context.site.longitude) <= 0.006 &&
    Math.abs(Number(source.searchParams.get('latitude')) - n.latitude) <= 0.006 &&
    Math.abs(Number(source.searchParams.get('longitude')) - n.longitude) <= 0.006 &&
    Array.isArray(n.months) &&
    n.months.length === 12 &&
    n.months.every(
      (m, i) =>
        m.month === i + 1 &&
        Number.isFinite(m.temperature) &&
        m.temperature >= -100 &&
        m.temperature <= 70 &&
        Number.isFinite(m.rain) &&
        m.rain >= 0,
    ) &&
    Math.abs(n.months.reduce((sum, m) => sum + m.rain, 0) - n.annualRain) <= 1e-6 &&
    Array.isArray(context.calendars)
  );
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
  temperatureWindowDays: number;
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
      const review = crop.planKind === 'perennial-review';
      const min = calendar ? Math.round(calendar.duration) : review ? 365 : Math.round(crop.GMIN!);
      let max = calendar ? min : review ? 365 : Math.min(365, Math.round(crop.GMAX!));
      if (min < 1 || max < min || max > 365) continue;
      if (!calendar && !review) {
        max = availableTemperatureDays(normal, start, max, crop.TMIN!, crop.TMAX!);
        if (max < min) continue;
      }
      const { temperature } = seasonClimate(normal, start, max);
      // Historical regional records can include dormancy (e.g. winter wheat).
      // Growing-temperature bounds cannot establish winter survival or refute
      // a historical record; any such mismatch remains explicitly unresolved.
      if (!calendar && (temperature < crop.TMIN! || temperature > crop.TMAX!)) continue;
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
        temperatureWindowDays: max,
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
        temperatureReason: `${best.temperature.toFixed(1)} °C long-term ${review ? 'annual' : 'planning-interval'} average temperature; ECOCROP growth-temperature range ${crop.TMIN!}–${crop.TMAX!} °C. This does not test daily extremes or winter survival.`,
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
    !validScreenContext(context) ||
    !validDate(from) ||
    from < '1900-01-01' ||
    from > '2100-12-31' ||
    !['loam', 'clay', 'sandy', 'unknown'].includes(farm.soil) ||
    !['good', 'poor', 'unknown'].includes(farm.drainage) ||
    !['reliable', 'limited', 'rainfed', 'severe', 'unknown'].includes(farm.irrigation) ||
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
    temperatureWindowDays,
  } of climateCandidates(context, from)) {
    const review = crop.planKind === 'perennial-review';
    const field = sourceFieldCompatibility(crop, farm);
    if (field.soilMismatch || field.drainageMismatch) continue;
    // Annual rainfall is not a crop-season water budget. Neither use it to
    // certify water adequacy nor reject a seasonal crop (e.g. winter wheat in
    // monsoonal Bangladesh) from unrelated wet-season rain. Water stays unknown.
    const cautions: string[] = [
      'Confirm local variety, planting material, soil pH, salinity, pests and legal/invasive-species restrictions before planting. Source use categories do not establish edibility.',
    ];
    if (!field.textureRecorded)
      cautions.push(
        'Source soil texture requirements are unrecorded; the entered soil has not been validated against a species requirement.',
      );
    if (!field.drainageRecorded)
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
    if (calendar && (temperature < crop.TMIN! || temperature > crop.TMAX!))
      cautions.push(
        'The historical calendar includes temperatures outside the source growth range. Dormancy, local variety and current field suitability are unverified; the record is not a current planting recommendation.',
      );
    if (!review && !calendar && max < Math.round(crop.GMAX!))
      cautions.push(
        'Only the shorter part of the source duration range fits the monthly-normal temperature window. Confirm a local variety with a compatible duration; the source maximum is not required for every variety.',
      );
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
    cautions.push(
      'Seasonal water adequacy is unverified: irrigation labels and annual rainfall do not provide a crop-specific water budget.',
    );
    const reasons = [
      temperatureReason,
      calendar
        ? `Historical ${calendar.season} planting record at the selected 0.5° grid cell.`
        : 'Screened against this location’s 1991–2020 NASA POWER climate.',
    ];
    if (farm.soil !== 'unknown' && field.textureRecorded)
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
      sourceDurationMin: crop.GMIN!,
      sourceDurationMax: crop.GMAX!,
      temperatureWindowDays,
      checks: [
        {
          factor: 'temperature',
          state:
            calendar && (temperature < crop.TMIN! || temperature > crop.TMAX!)
              ? 'unknown'
              : 'supported',
          detail: temperatureReason,
        },
        {
          factor: 'soil',
          state: farm.soil !== 'unknown' && field.textureRecorded ? 'supported' : 'unknown',
          detail:
            farm.soil !== 'unknown' && field.textureRecorded
              ? 'Entered texture occurs in the source categories.'
              : 'A confirmed field texture and a recorded species requirement are both needed.',
        },
        {
          factor: 'drainage',
          state: farm.drainage !== 'unknown' && field.drainageRecorded ? 'supported' : 'unknown',
          detail:
            farm.drainage !== 'unknown' && field.drainageRecorded
              ? 'Entered drainage occurs in the source categories.'
              : 'A confirmed drainage class and a recorded species requirement are both needed.',
        },
        {
          factor: 'water',
          state: 'unknown',
          detail: `Water choice: ${farm.irrigation}. Annual-rainfall range ${annualRainFit === null ? 'unrecorded' : annualRainFit ? 'matches' : 'does not match'}. Seasonal water adequacy has not been established.`,
        },
        {
          factor: 'local',
          state: 'unknown',
          detail:
            'Local variety, soil chemistry, pests, legal restrictions and (for perennials) overwintering/chilling are not verified.',
        },
      ],
    });
  }
  const ranked = suggestions.sort(
    (a, b) =>
      Number(b.optimalTemperature) - Number(a.optimalTemperature) ||
      Number(b.basis === 'regional-calendar') - Number(a.basis === 'regional-calendar') ||
      a.start.localeCompare(b.start) ||
      a.crop.localeCompare(b.crop),
  );
  // A crop may have several regional records or candidate months, but the
  // farmer receives one next-season option per species, never a whole year.
  const seen = new Set<string>();
  return ranked.filter((s) => !seen.has(s.crop) && !!seen.add(s.crop));
}
