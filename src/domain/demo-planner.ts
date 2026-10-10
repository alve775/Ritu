import {
  demoCropRules,
  demoEnvironment,
  demoWindows,
  demoDrainage,
} from '../data/demo-environment';
import type { DemoSettings } from '../data/demo-environment';
import { previewData } from '../data/preview';
import { coveredMonths, evaluate } from './evaluate';
import type {
  CropId,
  CropPeriod,
  Farm,
  HouseholdCrop,
  Localized,
  Priority,
  Rotation,
} from './types';

export interface DemoCheck {
  id: string;
  state: 'fit' | 'conflict' | 'unknown';
  label: Localized;
  detail: Localized;
}
export interface DemoAssessment {
  checks: DemoCheck[];
  conflicts: number;
  entryConflicts: number;
  unknowns: number;
  demand: number | null;
  drought: number | null;
  groups: number;
  pulseMonths: number;
  familiar: number;
}
export function assessDemo(rotation: Rotation, farm: Farm, settings: DemoSettings): DemoAssessment {
  const environment = demoEnvironment(settings);
  const crops = rotation.periods.filter((p) => p.crop !== 'fallow');
  const supported = crops.length > 0 && crops.every((p) => Boolean(demoCropRules[p.crop]));
  const knownSoil = farm.soil !== 'unknown';
  const knownWater = farm.irrigation !== 'unknown';
  const capacity = farm.irrigation === 'reliable' ? 3 : farm.irrigation === 'limited' ? 2 : 1;
  let waterConflicts = 0,
    climateConflicts = 0,
    soilConflicts = 0;
  let demand = 0,
    drought = 0,
    total = 0;
  for (const period of crops) {
    const rule = demoCropRules[period.crop];
    if (!rule) continue;
    const months = coveredMonths(period).map((m) => environment[m]);
    const rain = months.reduce((n, m) => n + m.rain, 0);
    const temp = months.reduce((n, m) => n + m.temperature, 0) / months.length;
    // Fictional rainfall credit and capacity rule; NOT effective rainfall or an irrigation calculation.
    const need = Math.max(1, rule.water - (rain >= 500 ? 2 : rain >= 200 ? 1 : 0));
    if (need > capacity) waterConflicts++;
    if (
      temp < rule.temperature[0] ||
      temp > rule.temperature[1] ||
      !rule.seasons.includes(Math.floor(period.start / 4))
    )
      climateConflicts++;
    if (knownSoil && !rule.soils.includes(farm.soil)) soilConflicts++;
    demand += need * period.duration;
    drought += rule.drought * period.duration;
    total += period.duration;
  }
  const entry = evaluate(rotation, farm);
  const checks: DemoCheck[] = [
    {
      id: 'water',
      state: !supported || !knownWater ? 'unknown' : waterConflicts ? 'conflict' : 'fit',
      label: { en: 'Water capacity', bn: 'পানির সীমা' },
      detail: {
        en: 'Demand index 1–3; rainfall credits and irrigation capacity are illustrative rules, not water volumes.',
        bn: '১–৩ চাহিদা সূচক; বৃষ্টির ছাড় ও সেচের সীমা নিয়ম, পানির পরিমাণ নয়।',
      },
    },
    {
      id: 'climate',
      state: !supported ? 'unknown' : climateConflicts ? 'conflict' : 'fit',
      label: { en: 'Climate / season fit', bn: 'জলবায়ু / মৌসুমের মিল' },
      detail: {
        en: 'Rainfall and temperature are matched against season and temperature limits. No crop-stage or parcel prediction.',
        bn: 'বৃষ্টি ও তাপমাত্রার সঙ্গে মৌসুম ও তাপের সীমা মেলানো হয়। বাস্তব জমি বা গাছের পর্যায়ের পূর্বাভাস নয়।',
      },
    },
    {
      id: 'soil',
      state: !supported || !knownSoil ? 'unknown' : soilConflicts ? 'conflict' : 'fit',
      label: { en: 'Soil match', bn: 'মাটির মিল' },
      detail: {
        en: 'Uses texture preferences. Unknown soil stays unknown. Drainage has a separate category check; soil health is not predicted.',
        bn: 'মাটির পছন্দ ব্যবহার করে। অজানা মাটি অজানা থাকে। নিষ্কাশনের যাচাই আলাদা; মাটির স্বাস্থ্যের পূর্বাভাস নেই।',
      },
    },
    {
      id: 'drainage',
      state:
        !supported || farm.drainage === 'unknown'
          ? 'unknown'
          : crops.some((p) => !demoDrainage(p.crop).includes(farm.drainage))
            ? 'conflict'
            : 'fit',
      label: { en: 'Drainage match', bn: 'নিষ্কাশনের মিল' },
      detail: {
        en: 'Drainage categories are used only in this planner; no field or crop-specific drainage evidence is integrated.',
        bn: 'শুধু নিষ্কাশনের নিয়ম; বাস্তব জমির প্রমাণ নেই।',
      },
    },
    ...entry.checks
      .filter((c) => ['calendar', 'household', 'labor'].includes(c.id))
      .map((c) => ({
        ...c,
        state:
          c.state === 'block'
            ? ('conflict' as const)
            : c.state === 'unknown'
              ? ('unknown' as const)
              : ('fit' as const),
      })),
  ];
  return {
    checks,
    conflicts: checks.filter((c) => c.state === 'conflict').length,
    entryConflicts: entry.checks.filter(
      (c) => ['calendar', 'household', 'labor'].includes(c.id) && c.state === 'block',
    ).length,
    unknowns: checks.filter((c) => c.state === 'unknown').length,
    demand: supported && knownWater && total ? demand / total : null,
    drought: supported && total ? drought / total : null,
    groups: new Set(crops.map((p) => previewData.crops[p.crop].category)).size,
    pulseMonths: crops
      .filter((p) => previewData.crops[p.crop].category === 'pulse')
      .reduce((n, p) => n + p.duration, 0),
    familiar: crops.filter((p) => farm.current.some((c) => c.crop === p.crop)).length,
  };
}
export function rankDemo(
  rotations: Rotation[],
  farm: Farm,
  settings: DemoSettings,
  priority: Priority,
): Rotation[] {
  const assessments = new Map(
    rotations.map((rotation) => [rotation.id, assessDemo(rotation, farm, settings)]),
  );
  const metric = (a: DemoAssessment) =>
    priority === 'water'
      ? (a.demand ?? Infinity)
      : priority === 'resilience'
        ? (a.drought ?? Infinity)
        : priority === 'soil'
          ? -a.pulseMonths
          : priority === 'diversity'
            ? -a.groups
            : -a.familiar;
  return [...rotations].sort((a, b) => {
    const x = assessments.get(a.id)!,
      y = assessments.get(b.id)!;
    return (
      x.entryConflicts - y.entryConflicts ||
      x.conflicts - y.conflicts ||
      x.unknowns - y.unknowns ||
      metric(x) - metric(y) ||
      a.id.localeCompare(b.id)
    );
  });
}
export function generateDemoPlans(
  farm: Farm,
  settings: DemoSettings,
  priority: Priority,
): Rotation[] {
  const suggestions = suggestDemoWindows(farm, settings, priority).filter((w) =>
    settings.preferred.includes(w.period.crop),
  );
  return rankDemo(passingRotations(suggestions, farm, settings), farm, settings, priority)
    .filter(
      (rotation, index, ranked) =>
        ranked.findIndex((r) => r.subtitle.en === rotation.subtitle.en) === index,
    )
    .slice(0, 3)
    .map((rotation, i) => ({
      ...rotation,
      name: { en: `Plan ${i + 1}`, bn: `পরিকল্পনা ${i + 1}` },
    }));
}
/** Every one-crop-per-season calendar built from these windows that passes every mock check. */
function passingRotations(
  suggestions: DemoSuggestion[],
  farm: Farm,
  settings: DemoSettings,
): Rotation[] {
  const choices = [0, 1, 2].map((season) => suggestions.filter((w) => w.season === season));
  if (choices.some((c) => !c.length)) return [];
  const rotations: Rotation[] = [];
  for (const a of choices[0])
    for (const b of choices[1])
      for (const c of choices[2]) {
        const cropPeriods = [a.period, b.period, c.period];
        if (!hasSafeTiming(cropPeriods)) continue;
        const ids = cropPeriods.map((p) => p.crop);
        const rotation: Rotation = {
          id: `demo-${cropPeriods.map((p) => `${p.crop}-${p.start}-${p.duration}`).join('-')}`,
          name: { en: 'Generated plan', bn: 'তৈরি করা পরিকল্পনা' },
          subtitle: {
            en: ids.map((id) => previewData.crops[id].name.en).join(' → '),
            bn: ids.map((id) => previewData.crops[id].name.bn).join(' → '),
          },
          periods: completeCalendar(cropPeriods),
        };
        // A ranking never overrides a failed or unknown mock constraint.
        if (assessDemo(rotation, farm, settings).checks.every((check) => check.state === 'fit'))
          rotations.push(rotation);
      }
  return rotations;
}

/**
 * Crops per season ([pre-monsoon, monsoon, winter]) of every passing calendar that any mix of
 * suggested crops can produce, best ranked first. Empty when no mix can pass.
 */
export function viableCropSets(farm: Farm, settings: DemoSettings, priority: Priority): CropId[][] {
  const suggestions = suggestDemoWindows(farm, settings, priority);
  const sets = rankDemo(
    passingRotations(suggestions, farm, settings),
    farm,
    settings,
    priority,
  ).map((rotation) => {
    const set: CropId[] = [];
    for (const p of rotation.periods)
      if (p.crop !== 'fallow') set[Math.floor(p.start / 4)] = p.crop;
    return set;
  });
  return sets.filter((set, i) => sets.findIndex((s) => s.join() === set.join()) === i);
}
/**
 * 'incomplete' while a season still has no chosen crop; otherwise whether at least one viable
 * calendar uses only chosen crops. A crop counts for every season it is suggested in.
 */
export function selectionStatus(
  preferred: CropId[],
  suggestions: DemoSuggestion[],
  sets: CropId[][],
): 'incomplete' | 'fits' | 'conflict' {
  const chosen = [0, 1, 2].map(
    (season) =>
      new Set(
        suggestions
          .filter((s) => s.season === season && preferred.includes(s.period.crop))
          .map((s) => s.period.crop),
      ),
  );
  if (chosen.some((c) => !c.size)) return 'incomplete';
  return sets.some((set) => set.every((crop, season) => chosen[season].has(crop)))
    ? 'fits'
    : 'conflict';
}
/**
 * Adds the fewest crops needed so a complete selection can build a calendar again (for example
 * after household needs change). Selections that are incomplete, already fit, or cannot be
 * fixed by any suggested crop are returned unchanged.
 */
export function repairSelection(
  preferred: CropId[],
  suggestions: DemoSuggestion[],
  sets: CropId[][],
): CropId[] {
  if (!sets.length || selectionStatus(preferred, suggestions, sets) !== 'conflict')
    return preferred;
  const missing = (set: CropId[]) => [...new Set(set.filter((c) => !preferred.includes(c)))];
  const best = sets.reduce((a, b) => (missing(b).length < missing(a).length ? b : a));
  return [...preferred, ...missing(best)];
}

export function hasSafeTiming(periods: CropPeriod[]): boolean {
  const occupied = new Set<number>();
  return periods.every(
    (p) =>
      Number.isInteger(p.start) &&
      Number.isInteger(p.duration) &&
      p.start >= 0 &&
      p.duration > 0 &&
      p.start + p.duration <= 12 &&
      coveredMonths(p).every((month) => {
        if (occupied.has(month)) return false;
        occupied.add(month);
        return true;
      }),
  );
}
export function completeCalendar(periods: CropPeriod[]): CropPeriod[] {
  if (!hasSafeTiming(periods)) throw new Error('Overlapping or out-of-cycle planning windows');
  const sorted = [...periods].sort((a, b) => a.start - b.start);
  const complete: CropPeriod[] = [];
  let cursor = 0;
  for (const period of sorted) {
    if (cursor < period.start)
      complete.push({ crop: 'fallow', start: cursor, duration: period.start - cursor });
    complete.push({ ...period });
    cursor = period.start + period.duration;
  }
  if (cursor < 12) complete.push({ crop: 'fallow', start: cursor, duration: 12 - cursor });
  return complete;
}
/** Checks a single planting window must pass to be suggested. */
const windowChecks = ['water', 'climate', 'soil', 'drainage', 'labor'];
export interface DemoSuggestion {
  season: number;
  period: CropPeriod;
  assessment: DemoAssessment;
}
export function suggestDemoWindows(
  farm: Farm,
  settings: DemoSettings,
  priority: Priority,
): DemoSuggestion[] {
  const suggestions: DemoSuggestion[] = [];
  for (const [id, windows] of Object.entries(demoWindows)) {
    for (const window of windows) {
      const period: CropPeriod = { crop: id as CropId, ...window };
      const rotation: Rotation = {
        id,
        name: { en: '', bn: '' },
        subtitle: { en: '', bn: '' },
        periods: completeCalendar([period]),
      };
      const assessment = assessDemo(rotation, farm, settings);
      if (
        assessment.checks.filter((c) => windowChecks.includes(c.id)).every((c) => c.state === 'fit')
      )
        suggestions.push({ season: Math.floor(period.start / 4), period, assessment });
    }
  }
  const metric = (a: DemoAssessment) =>
    priority === 'water'
      ? a.demand!
      : priority === 'resilience'
        ? a.drought!
        : priority === 'soil'
          ? -a.pulseMonths
          : priority === 'familiar'
            ? -a.familiar
            : -a.groups;
  return suggestions.sort(
    (a, b) =>
      a.season - b.season ||
      metric(a.assessment) - metric(b.assessment) ||
      a.period.start - b.period.start ||
      a.period.crop.localeCompare(b.period.crop),
  );
}
/**
 * The fewest household groups to drop so that some calendar becomes possible. Empty when a
 * calendar is already possible, or when household needs are not what blocks it.
 */
export function blockingHousehold(
  farm: Farm,
  settings: DemoSettings,
  priority: Priority,
): HouseholdCrop[] {
  if (viableCropSets(farm, settings, priority).length) return [];
  const drops = farm.required
    .reduce<HouseholdCrop[][]>((all, group) => [...all, ...all.map((d) => [...d, group])], [[]])
    .filter((drop) => drop.length)
    .sort((a, b) => a.length - b.length);
  return (
    drops.find(
      (drop) =>
        viableCropSets(
          { ...farm, required: farm.required.filter((group) => !drop.includes(group)) },
          settings,
          priority,
        ).length,
    ) ?? []
  );
}
/**
 * Farm facts outrank household wishes: drops the household groups that these conditions make
 * impossible, so a condition change never leaves an unreachable group ticked.
 */
export function settleHousehold(
  farm: Farm,
  settings: DemoSettings,
  priority: Priority,
): { farm: Farm; dropped: HouseholdCrop[] } {
  const dropped = blockingHousehold(farm, settings, priority);
  return dropped.length
    ? { farm: { ...farm, required: farm.required.filter((g) => !dropped.includes(g)) }, dropped }
    : { farm, dropped };
}
/**
 * Mock checks failed by the household group's closest-to-passing crop window. Empty when some
 * window passes on its own, so only the mix with other household needs can be the problem.
 */
export function householdBlockers(
  group: HouseholdCrop,
  farm: Farm,
  settings: DemoSettings,
): string[] {
  let best: string[] | null = null;
  for (const [id, windows] of Object.entries(demoWindows)) {
    if (previewData.crops[id as CropId].household !== group) continue;
    for (const window of windows) {
      const rotation: Rotation = {
        id,
        name: { en: '', bn: '' },
        subtitle: { en: '', bn: '' },
        periods: completeCalendar([{ crop: id as CropId, ...window }]),
      };
      const failed = assessDemo(rotation, farm, settings)
        .checks.filter((c) => windowChecks.includes(c.id) && c.state !== 'fit')
        .map((c) => c.id);
      if (!best || failed.length < best.length) best = failed;
    }
  }
  return best ?? [];
}
export function farmFingerprint(farm: Farm, settings: DemoSettings, priority: Priority): string {
  return JSON.stringify([farm, settings.location, settings.weather, priority]);
}
export function planFingerprint(farm: Farm, settings: DemoSettings, priority: Priority): string {
  return JSON.stringify([
    farmFingerprint(farm, settings, priority),
    [...settings.preferred].sort(),
  ]);
}
