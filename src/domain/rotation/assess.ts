import type { Farm } from '../types';
import type { Plot } from '../plot';
import {
  isRotationCrop,
  rotationCrops,
  rotationPatterns,
  type RotationCrop,
  type RotationCropId,
} from '../../data/rotation-crops';
import type { MonthlyClimate } from './climate';
import { cropWeeks, soilStoreMm, startSoil, type CropWeek } from './crop-weeks';
import { nasaWeek } from '../nasa-local';
import {
  schedulePlan,
  yearSeasons,
  type ScheduledCrop,
  type TimingProblem,
  type YearPlan,
} from './schedule';

/** 1 = no problem … 5 = big problem. Every bar in the app reads the same way. */
export type Level = 1 | 2 | 3 | 4 | 5;
export interface Levels {
  water: Level;
  heat: Level;
  soil: Level;
  /** Wears out the soil: rice after rice, the same crop again; a pulse lowers it. */
  wear: Level;
}
export interface PlotConditions {
  soil: Farm['soil'];
  drainage: Farm['drainage'];
  irrigation: Farm['irrigation'];
  areaHa: number;
  lastYear: Plot['lastYear'];
  /** Soil pH: the farmer's test (measured) or the soil-map estimate; absent when neither is known. */
  ph?: { value: number; measured: boolean };
}
export type Verdict = 'good' | 'ok' | 'risky' | 'no';
export type Reason =
  | { kind: 'timing'; problem: TimingProblem }
  | { kind: 'water' | 'heat' | 'soil' | 'wear' | 'rainfed'; watch: true }
  /** `wet`: imperfectly drained, wet only for a while in the rains; otherwise water stands. */
  | { kind: 'drainage'; watch: true; wet?: true }
  | { kind: 'ph'; watch: true; ph: number; measured: boolean; range: [number, number] }
  | { kind: 'pulse' | 'rain' | 'cool' | 'soil-good'; watch: false };
/**
 * NASA IMERG dry-spell risk in a crop's flowering and grain weeks. Ritu's water plan counts on
 * average rain in those weeks; in a year with a 3-week dry spell that rain becomes irrigation.
 */
export interface DrySpell {
  /** Share of years (0–1) with a 21-day dry run in the riskiest of those weeks. */
  chance: number;
  years: number;
  samples: number;
  /** Start of the riskiest week. */
  week: string;
  /** Rain the water plan counts on in those weeks, mm. */
  reliedMm: number;
  /** Irrigations that rain stands for in a dry year. */
  extra: number;
  /** chance × extra: what the plan's score loses. */
  expected: number;
  /** 40% of years or more. */
  high: boolean;
  /** High, and the plot has limited water or none: the crop's water level goes up one step. */
  raisesWater: boolean;
}
/** Below this share of years a dry spell is not counted. */
export const drySpellFrom = 0.2;
/** From this share of years the risk is high. */
export const drySpellHigh = 0.4;
/** Less rain than this share of one irrigation in the weeks at risk is not worth a warning. */
const drySpellMinExtra = 0.25;
/** Flowering and grain filling: from the crop's sensitive stage to 85% of its season. */
const grainEnd = 0.85;

export function drySpell(
  crop: RotationCrop,
  weeks: CropWeek[],
  climate: MonthlyClimate,
  irrigation: Farm['irrigation'],
): DrySpell | null {
  const nasa = climate.nasa;
  if (!nasa || !crop.heat) return null;
  let reliedMm = 0,
    worst: { chance: number; years: number; samples: number; week: string } | null = null,
    offset = 0;
  for (const w of weeks) {
    const f0 = offset / crop.days,
      f1 = (offset + w.days) / crop.days;
    offset += w.days;
    if (!(f1 > crop.heat.from && f0 < grainEnd)) continue;
    reliedMm += effectiveRainShare * w.rain;
    const n = nasaWeek(w.start),
      v = n ? nasa.weeks[n - 1] : undefined;
    if (v && v.dry !== null && v.drySamples > 0 && (!worst || v.dry > worst.chance))
      worst = { chance: v.dry, years: v.dryYears, samples: v.drySamples, week: w.start };
  }
  const extra = reliedMm / (crop.rice ? riceIrrigationMm : soilStoreMm);
  if (!worst || worst.chance < drySpellFrom || extra < drySpellMinExtra) return null;
  const high = worst.chance >= drySpellHigh;
  return {
    ...worst,
    reliedMm: Math.round(reliedMm),
    extra: Math.max(1, Math.round(extra)),
    expected: Math.round(worst.chance * extra * 10) / 10,
    high,
    raisesWater:
      high && (irrigation === 'limited' || irrigation === 'rainfed' || irrigation === 'severe'),
  };
}
/** Share of rain that reaches the root zone, as in the weekly water plan. */
const effectiveRainShare = 0.8;
/** One irrigation of flooded rice, mm (the plan refills to 50 mm). */
const riceIrrigationMm = 50;

export interface CropAssessment {
  item: ScheduledCrop;
  weeks: CropWeek[];
  /** Irrigations in an average year, the one before sowing included. */
  irrigations: number;
  irrigationMm: number;
  /** Irrigation before sowing, mm; 0 when the soil is usually moist enough (NASA SMAP). */
  presow: number;
  /** NASA IMERG dry-spell risk in flowering and grain weeks; null when there is none worth counting. */
  dry: DrySpell | null;
  hottest: CropWeek | null;
  levels: Levels;
  verdict: Verdict;
  reason: Reason;
  /** Last year's crop in this season was a different crop of the same plant family. */
  sameFamilyAs?: RotationCropId;
}
export interface PlanAssessment {
  plan: YearPlan;
  crops: CropAssessment[];
  problems: TimingProblem[];
  irrigations: number;
  irrigationMm: number;
  levels: Levels;
  score: number;
}

const clamp = (n: number) => Math.max(1, Math.min(5, Math.round(n))) as Level;
const soilKey = (soil: Farm['soil']) => (soil === 'unknown' ? null : soil);

function cropLevels(
  item: ScheduledCrop,
  weeks: CropWeek[],
  plan: YearPlan,
  c: PlotConditions,
  presow: number,
  dry: DrySpell | null,
) {
  const crop = item.crop;
  const irrigations = weeks.filter((w) => w.irrigate > 0).length + (presow > 0 ? 1 : 0);
  let water =
    irrigations <= 2 ? 1 : irrigations <= 4 ? 2 : irrigations <= 6 ? 3 : irrigations <= 9 ? 4 : 5;
  if ((c.irrigation === 'rainfed' || c.irrigation === 'severe') && irrigations > 1) water = 5;
  if (c.irrigation === 'limited' && irrigations > 8) water = 5;
  // A likely dry spell at flowering, on a plot without water to spare.
  if (dry?.raisesWater) water += 1;
  const hot = weeks.filter((w) => w.hot);
  const excess = hot.length ? Math.max(...hot.map((w) => w.maxC)) - crop.heat!.limitC : 0;
  const heat = !hot.length ? 1 : excess <= 1 ? 2 : excess <= 2.5 ? 3 : excess <= 4 ? 4 : 5;
  const key = soilKey(c.soil);
  let soil = key ? { good: 1, ok: 2, poor: 5 }[crop.soil[key]] : 2;
  const waterlogged = c.drainage === 'poor' && !crop.rice;
  if (waterlogged) soil = Math.min(5, soil + 2);
  // Imperfectly drained soil stays wet for a while in the rains (June to September): half the
  // poorly drained step, for non-rice crops in the field then. Winter crops grow on dry soil.
  const wetInRains =
    c.drainage === 'imperfect' && !crop.rice && weeks.some((w) => /-0[6-9]-/.test(w.start));
  // The wet step is named as the reason only where it raised the soil risk (not on soil already poor).
  const wetRaised = wetInRains && soil < 5;
  if (wetInRains) soil = Math.min(5, soil + 1);
  // Outside the pH range the crop tolerates: poor for a tested pH, doubtful for a map estimate.
  const phOut = !!c.ph && (c.ph.value < crop.ph[0] || c.ph.value > crop.ph[1]);
  if (phOut) soil = Math.max(soil, c.ph!.measured ? 5 : 4);
  const others = yearSeasons
    .filter((s) => s !== item.season)
    .map((s) => plan[s])
    .filter((x): x is RotationCropId => !!x)
    .map((x) => rotationCrops[x]);
  // Same plant family as last year's crop (tomato after potato): the same soil diseases carry on.
  const last = c.lastYear[item.season];
  const sameFamilyAs =
    !!crop.family &&
    isRotationCrop(last) &&
    last !== crop.id &&
    rotationCrops[last].family === crop.family
      ? last
      : undefined;
  const wear = crop.pulse
    ? 1
    : crop.rice && others.some((o) => o.rice)
      ? 5
      : !crop.rice && (last === crop.id || sameFamilyAs)
        ? 3
        : 2;
  return {
    irrigations,
    hottest: hot.length ? hot.reduce((a, b) => (b.maxC > a.maxC ? b : a)) : null,
    waterlogged,
    wetInRains: wetRaised,
    phOut,
    sameFamilyAs,
    levels: {
      water: clamp(water),
      heat: clamp(heat),
      soil: clamp(soil),
      wear: clamp(wear),
    } as Levels,
  };
}

export function assessPlan(
  plan: YearPlan,
  from: string,
  climate: MonthlyClimate,
  c: PlotConditions,
): PlanAssessment {
  const { items, problems } = schedulePlan(plan, from);
  const crops: CropAssessment[] = items.map((item) => {
    const weeks = cropWeeks(item.crop, item.sow, climate);
    const { presow } = startSoil(item.crop, item.sow, climate);
    const dry = drySpell(item.crop, weeks, climate, c.irrigation);
    const l = cropLevels(item, weeks, plan, c, presow, dry);
    const problem = problems.find((p) => p.after === item.crop || p.before === item.crop);
    const sum = l.levels.water + l.levels.heat + l.levels.soil + l.levels.wear;
    const worst = Math.max(l.levels.water, l.levels.heat, l.levels.soil, l.levels.wear);
    const verdict: Verdict = problem
      ? 'no'
      : worst >= 5 || sum > 11
        ? 'risky'
        : worst >= 4 || sum > 7
          ? 'ok'
          : 'good';
    let reason: Reason;
    if (problem) reason = { kind: 'timing', problem };
    else if (worst >= 3) {
      const order = (['heat', 'soil', 'water', 'wear'] as const).filter(
        (k) => l.levels[k] === worst,
      );
      const k = order[0];
      reason =
        k === 'soil' && l.phOut && !l.waterlogged && !l.wetInRains
          ? {
              kind: 'ph',
              watch: true,
              ph: c.ph!.value,
              measured: c.ph!.measured,
              range: item.crop.ph,
            }
          : k === 'soil' && (l.waterlogged || l.wetInRains)
            ? { kind: 'drainage', watch: true, ...(l.waterlogged ? {} : { wet: true as const }) }
            : {
                kind:
                  k === 'water' && (c.irrigation === 'rainfed' || c.irrigation === 'severe')
                    ? 'rainfed'
                    : k,
                watch: true,
              };
    } else
      reason = {
        kind: item.crop.pulse
          ? 'pulse'
          : l.levels.water <= 2
            ? 'rain'
            : l.levels.heat === 1
              ? 'cool'
              : 'soil-good',
        watch: false,
      };
    return {
      item,
      weeks,
      irrigations: l.irrigations,
      irrigationMm: weeks.reduce((s, w) => s + w.irrigate, presow),
      presow,
      dry,
      hottest: l.hottest,
      levels: l.levels,
      verdict,
      reason,
      ...(l.sameFamilyAs ? { sameFamilyAs: l.sameFamilyAs } : {}),
    };
  });
  const irrigations = crops.reduce((s, x) => s + x.irrigations, 0);
  const max = (k: keyof Levels) => (crops.length ? Math.max(...crops.map((x) => x.levels[k])) : 1);
  const rice = crops.filter((x) => x.item.crop.rice).length;
  const levels: Levels = {
    water: clamp(
      irrigations <= 4
        ? 1
        : irrigations <= 8
          ? 2
          : irrigations <= 12
            ? 3
            : irrigations <= 16
              ? 4
              : 5,
    ),
    heat: clamp(max('heat')),
    soil: clamp(max('soil')),
    wear: clamp(
      crops.some((x) => x.item.crop.pulse)
        ? 1
        : rice > 1
          ? 5
          : crops.some((x) => x.levels.wear === 3)
            ? 3
            : 2,
    ),
  };
  if (crops.some((x) => x.levels.water === 5)) levels.water = 5;
  const score =
    -irrigations -
    3 * (levels.heat - 1) -
    3 * (levels.soil - 1) -
    2 * (levels.wear - 1) +
    1.5 * crops.length -
    // Irrigations a likely dry spell at flowering would add (NASA IMERG).
    crops.reduce((s, x) => s + (x.dry?.expected ?? 0), 0) -
    (problems.length ? 100 : 0);
  return {
    plan,
    crops,
    problems,
    irrigations,
    irrigationMm: crops.reduce((s, x) => s + x.irrigationMm, 0),
    levels,
    score,
  };
}

/** Last year's crops as a plan, or null when a season held a crop Ritu can't plan with. */
export function lastYearPlan(lastYear: Plot['lastYear']): YearPlan | null {
  const plan = {} as YearPlan;
  for (const s of yearSeasons) {
    const v = lastYear[s];
    if (v === 'fallow' || v === 'unknown') plan[s] = null;
    else if (isRotationCrop(v)) plan[s] = v;
    else return null;
  }
  return yearSeasons.some((s) => plan[s]) ? plan : null;
}

export const samePlan = (a: YearPlan, b: YearPlan) => yearSeasons.every((s) => a[s] === b[s]);

export interface SuggestedPlan {
  id: string;
  lastYear: boolean;
  assessment: PlanAssessment;
}

/** Plan A (last year, when known) plus the best-fitting regional patterns for this plot: three plans in all. */
export function suggestPlans(
  from: string,
  climate: MonthlyClimate,
  c: PlotConditions,
): SuggestedPlan[] {
  const last = lastYearPlan(c.lastYear);
  const out: SuggestedPlan[] = [];
  if (last)
    out.push({ id: 'last-year', lastYear: true, assessment: assessPlan(last, from, climate, c) });
  const rank = (standIn: boolean) =>
    rotationPatterns
      .filter((p) => !!p.standIn === standIn && (!last || !samePlan(p.plan, last)))
      .map((p) => ({ id: p.id, lastYear: false, assessment: assessPlan(p.plan, from, climate, c) }))
      .filter((p) => !p.assessment.problems.length && p.assessment.levels.soil < 5)
      .sort((a, b) => b.assessment.score - a.assessment.score);
  // Always three plans when enough fit: when last year isn't known, a third regional pattern takes
  // Plan A's place. Stand-in patterns fill the places no regular pattern fits.
  const ranked = rank(false);
  const all = ranked.length >= 3 - out.length ? ranked : [...ranked, ...rank(true)];
  return [...out, ...all.slice(0, 3 - out.length)];
}

/** Hours of pumping for one irrigation on a plot. A shallow tube well gives about 14 litres a second. */
export function pumpHours(mm: number, areaHa: number, litresPerSecond = 14) {
  const cubicMetres = mm * areaHa * 10;
  return Math.max(0.5, Math.round((cubicMetres / (litresPerSecond * 3.6)) * 2) / 2);
}
