import type { Season } from '../evidence-planner';
import { rotationCrops, type RotationCrop, type RotationCropId } from '../../data/rotation-crops';
import { isoOf, plusDays, yearOf } from './dates';

/** A year plan for one plot: one crop (or nothing) per season. */
export type YearPlan = Record<Season, RotationCropId | null>;
export const yearSeasons: readonly Season[] = ['winter', 'pre-monsoon', 'monsoon'];
/** Days to clear and prepare the field between two crops. */
export const turnaroundDays = 5;

export interface ScheduledCrop {
  crop: RotationCrop;
  season: Season;
  sow: string;
  harvest: string;
  windowStart: string;
  windowEnd: string;
}
export interface TimingProblem {
  before: RotationCrop;
  after: RotationCrop;
  harvest: string;
  latestSow: string;
}

/** The first occurrence of a crop's sowing window that still ends on or after `from`. */
export function windowFrom(crop: RotationCrop, from: string) {
  const [[m0, d0], [m1, d1]] = crop.window;
  const crosses = m1 < m0;
  for (let y = yearOf(from) - 1; y <= yearOf(from) + 1; y++) {
    const start = isoOf(y, m0, d0),
      end = isoOf(crosses ? y + 1 : y, m1, d1);
    if (end >= from) {
      const [sm, sd] = crop.sow;
      const preferred = isoOf(crosses && sm < m0 ? y + 1 : y, sm, sd);
      return { start, end, preferred };
    }
  }
  throw Error('No sowing window found');
}

/** Season order for a year that starts at the ready-to-plant date: the next season to open comes first. */
export function seasonOrder(from: string): Season[] {
  const lastSow = (season: Season) => {
    const ends = Object.values(rotationCrops)
      .filter((c) => c.season === season)
      .map((c) => windowFrom(c, from).end);
    return ends.sort()[0];
  };
  return [...yearSeasons].sort((a, b) => (lastSow(a) < lastSow(b) ? -1 : 1));
}

/**
 * Place each crop of a plan in time, starting at the ready date. A crop is sown at its preferred
 * date, or later if the field is still busy; if that pushes it past its sowing window the plan has a
 * timing problem. The last crop must also leave the field in time for the first crop a year later.
 */
export function schedulePlan(plan: YearPlan, from: string) {
  const items: ScheduledCrop[] = [];
  const problems: TimingProblem[] = [];
  let cursor = from;
  for (const season of seasonOrder(from)) {
    const id = plan[season];
    if (!id) continue;
    const crop = rotationCrops[id];
    // The window in this plan year: the first one that ends after the previous crop was sown.
    const w = windowFrom(crop, items.length ? items[items.length - 1].sow : from);
    const sow = w.preferred > cursor ? w.preferred : cursor;
    if (sow > w.end && items.length)
      problems.push({
        before: items[items.length - 1].crop,
        after: crop,
        harvest: items[items.length - 1].harvest,
        latestSow: w.end,
      });
    const harvest = plusDays(sow, crop.days);
    items.push({ crop, season, sow, harvest, windowStart: w.start, windowEnd: w.end });
    cursor = plusDays(harvest, turnaroundDays);
  }
  if (items.length > 1) {
    const first = items[0].crop;
    const next = windowFrom(first, plusDays(items[0].windowEnd, 1));
    if (cursor > next.end)
      problems.push({
        before: items[items.length - 1].crop,
        after: first,
        harvest: items[items.length - 1].harvest,
        latestSow: next.end,
      });
  }
  return { items, problems };
}

/** Seasons already sown on a plot, with the crop in the ground. */
export type SownSeasons = Partial<Record<Season, RotationCropId>>;

/** A plan with every sown season kept as it is: changing a plan only changes seasons not started yet. */
export function keepSown(plan: YearPlan, sown: SownSeasons): YearPlan {
  const out = { ...plan };
  for (const s of yearSeasons) {
    const crop = sown[s];
    if (crop) out[s] = crop;
  }
  return out;
}
/** Same plan, same text: used to drop suggestions that become identical once sown seasons are kept. */
export const planKey = (plan: YearPlan) => yearSeasons.map((s) => plan[s] ?? '-').join('|');
