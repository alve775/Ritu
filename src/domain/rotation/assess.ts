import type { Farm } from '../types';
import type { Plot } from '../plot';
import {
  isRotationCrop,
  rotationCrops,
  rotationPatterns,
  type RotationCropId,
} from '../../data/rotation-crops';
import type { MonthlyClimate } from './climate';
import { cropWeeks, type CropWeek } from './crop-weeks';
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
  | { kind: 'water' | 'heat' | 'soil' | 'wear' | 'drainage' | 'rainfed'; watch: true }
  | { kind: 'ph'; watch: true; ph: number; measured: boolean; range: [number, number] }
  | { kind: 'pulse' | 'rain' | 'cool' | 'soil-good'; watch: false };
export interface CropAssessment {
  item: ScheduledCrop;
  weeks: CropWeek[];
  irrigations: number;
  irrigationMm: number;
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

function cropLevels(item: ScheduledCrop, weeks: CropWeek[], plan: YearPlan, c: PlotConditions) {
  const crop = item.crop;
  const irrigations = weeks.filter((w) => w.irrigate > 0).length;
  let water =
    irrigations <= 2 ? 1 : irrigations <= 4 ? 2 : irrigations <= 6 ? 3 : irrigations <= 9 ? 4 : 5;
  if ((c.irrigation === 'rainfed' || c.irrigation === 'severe') && irrigations > 1) water = 5;
  if (c.irrigation === 'limited' && irrigations > 8) water = 5;
  const hot = weeks.filter((w) => w.hot);
  const excess = hot.length ? Math.max(...hot.map((w) => w.maxC)) - crop.heat!.limitC : 0;
  const heat = !hot.length ? 1 : excess <= 1 ? 2 : excess <= 2.5 ? 3 : excess <= 4 ? 4 : 5;
  const key = soilKey(c.soil);
  let soil = key ? { good: 1, ok: 2, poor: 5 }[crop.soil[key]] : 2;
  const waterlogged = c.drainage === 'poor' && !crop.rice;
  if (waterlogged) soil = Math.min(5, soil + 2);
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
    const l = cropLevels(item, weeks, plan, c);
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
        k === 'soil' && l.phOut && !l.waterlogged
          ? {
              kind: 'ph',
              watch: true,
              ph: c.ph!.value,
              measured: c.ph!.measured,
              range: item.crop.ph,
            }
          : {
              kind:
                k === 'soil' && l.waterlogged
                  ? 'drainage'
                  : k === 'water' && (c.irrigation === 'rainfed' || c.irrigation === 'severe')
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
      irrigationMm: weeks.reduce((s, w) => s + w.irrigate, 0),
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
  const ranked = rotationPatterns
    .filter((p) => !last || !samePlan(p.plan, last))
    .map((p) => ({ id: p.id, lastYear: false, assessment: assessPlan(p.plan, from, climate, c) }))
    .filter((p) => !p.assessment.problems.length && p.assessment.levels.soil < 5)
    .sort((a, b) => b.assessment.score - a.assessment.score);
  // Always three plans: when last year isn't known, a third regional pattern takes Plan A's place.
  return [...out, ...ranked.slice(0, 3 - out.length)];
}

/** Hours of pumping for one irrigation on a plot. A shallow tube well gives about 14 litres a second. */
export function pumpHours(mm: number, areaHa: number, litresPerSecond = 14) {
  const cubicMetres = mm * areaHa * 10;
  return Math.max(0.5, Math.round((cubicMetres / (litresPerSecond * 3.6)) * 2) / 2);
}
