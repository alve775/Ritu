import type { Season } from '../evidence-planner';
import type { RotationCrop } from '../../data/rotation-crops';
import { cropJobs, type CropJob } from '../../data/crop-jobs';
import type { CropAssessment } from './assess';
import { weekOf, type CropWeek } from './crop-weeks';
import { plusDays } from './dates';
import type { CropEnd } from './crop-end';

/** Key of a planned irrigation week in the irrigation records. */
export const irrigationKey = (season: Season, weekStart: string) => `${season}:${weekStart}`;

export type IrrigationStatus = 'done' | 'missed' | 'due' | 'later' | 'past';
/** One planned irrigation: any day of its week counts. */
export interface IrrigationWindow {
  key: string;
  season: Season;
  crop: RotationCrop;
  start: string;
  end: string;
  mm: number;
  doneOn?: string;
  status: IrrigationStatus;
}
/** A crop of the year plan with what the farmer has recorded for it. */
export interface PlanCrop {
  a: CropAssessment;
  /** Sowing was recorded, so its weeks follow the real date and missed irrigations count. */
  sown: boolean;
  harvested: boolean;
  windows: IrrigationWindow[];
  jobs: CropJob[];
  /** Ended without a harvest. A lost crop counts as harvested on the day it was lost. */
  end?: CropEnd | null;
}

export function planCrops(
  crops: CropAssessment[],
  recorded: { sown: Season[]; harvested: Season[]; irrigated: Record<string, string> },
  today: string,
): PlanCrop[] {
  return crops.map((a) => {
    const sown = recorded.sown.includes(a.item.season);
    const windows = a.weeks
      .filter((w) => w.irrigate > 0)
      .map((w): IrrigationWindow => {
        const key = irrigationKey(a.item.season, w.start),
          end = plusDays(w.start, w.days - 1),
          doneOn = recorded.irrigated[key];
        const status: IrrigationStatus = doneOn
          ? 'done'
          : end >= today
            ? w.start <= today
              ? 'due'
              : 'later'
            : sown
              ? 'missed'
              : 'past';
        return {
          key,
          season: a.item.season,
          crop: a.item.crop,
          start: w.start,
          end,
          mm: w.irrigate,
          doneOn,
          status,
        };
      });
    return {
      a,
      sown,
      harvested: recorded.harvested.includes(a.item.season),
      windows,
      jobs: cropJobs[a.item.crop.id] ?? [],
    };
  });
}

/** The crop in the field on a date (sowing day included, harvest day not). */
export const cropOn = (crops: PlanCrop[], date: string) =>
  crops.find((c) => c.end?.kind !== 'cancelled' && c.a.item.sow <= date && date < c.a.item.harvest);
export const weekOn = (c: PlanCrop, date: string): CropWeek | null => {
  const i = weekOf(c.a.weeks, date);
  return i >= 0 ? c.a.weeks[i] : null;
};
export const windowOn = (crops: PlanCrop[], date: string) =>
  crops.flatMap((c) => c.windows).find((w) => w.start <= date && date <= w.end);

export type DayItem =
  | { kind: 'sow'; crop: RotationCrop; recorded: boolean }
  | { kind: 'harvest'; crop: RotationCrop }
  | { kind: 'lost'; crop: RotationCrop }
  | { kind: 'irrigate'; window: IrrigationWindow; first: boolean }
  | { kind: 'irrigated'; window: IrrigationWindow }
  | { kind: 'missed'; window: IrrigationWindow }
  | { kind: 'heat'; crop: RotationCrop; maxC: number }
  | { kind: 'job'; crop: RotationCrop; job: CropJob };

const rank = (i: DayItem) =>
  i.kind === 'sow' || i.kind === 'harvest' || i.kind === 'lost' ? 1 : i.kind === 'job' ? 3 : 2;

/** Everything planned or recorded for one day, most important first. */
export function dayItems(crops: PlanCrop[], date: string): DayItem[] {
  const items: DayItem[] = [];
  for (const c of crops) {
    // A cancelled crop has nothing on the calendar.
    if (c.end?.kind === 'cancelled') continue;
    const { crop, sow, harvest } = c.a.item;
    if (date === sow) items.push({ kind: 'sow', crop, recorded: c.sown });
    if (date === harvest)
      items.push(c.end?.kind === 'lost' ? { kind: 'lost', crop } : { kind: 'harvest', crop });
    for (const w of c.windows) {
      if (w.doneOn === date) items.push({ kind: 'irrigated', window: w });
      else if (w.status !== 'done' && w.status !== 'past' && w.start <= date && date <= w.end)
        items.push(
          w.status === 'missed'
            ? { kind: 'missed', window: w }
            : { kind: 'irrigate', window: w, first: date === w.start },
        );
    }
    for (const job of c.jobs) {
      const on = plusDays(sow, job.day);
      if (on === date && on < harvest) items.push({ kind: 'job', crop, job });
    }
    if (sow <= date && date < harvest) {
      const w = weekOn(c, date);
      if (w?.hot) items.push({ kind: 'heat', crop, maxC: w.maxC });
    }
  }
  return items.sort((x, y) => rank(x) - rank(y));
}

/** What a day with nothing planned is for. */
export type QuietDay =
  | { kind: 'ripening' | 'walk'; crop: RotationCrop }
  | { kind: 'can-sow' | 'plough'; crop: RotationCrop }
  | { kind: 'empty' };
export function quietDay(crops: PlanCrop[], date: string): QuietDay {
  const on = cropOn(crops, date);
  if (on)
    return {
      kind: date >= plusDays(on.a.item.harvest, -10) ? 'ripening' : 'walk',
      crop: on.a.item.crop,
    };
  const next = crops.find(
    (c) => !c.end && !c.sown && date < c.a.item.sow && date >= plusDays(c.a.item.windowStart, -14),
  );
  if (next)
    return {
      kind: date >= next.a.item.windowStart ? 'can-sow' : 'plough',
      crop: next.a.item.crop,
    };
  return { kind: 'empty' };
}

export type BigEvent =
  | { kind: 'sow'; date: string; c: PlanCrop }
  | { kind: 'irrigate'; date: string; c: PlanCrop; window: IrrigationWindow }
  | { kind: 'job'; date: string; c: PlanCrop; job: CropJob }
  | { kind: 'heat'; date: string; c: PlanCrop; week: CropWeek }
  | { kind: 'harvest'; date: string; c: PlanCrop };

/** The next big moments of the year from `today`: sowing, next irrigation, fertiliser, key stages, heat, harvest. */
export function bigEvents(crops: PlanCrop[], today: string, limit = 6): BigEvent[] {
  const out: BigEvent[] = [];
  for (const c of crops) {
    const { sow, harvest } = c.a.item;
    if (c.harvested || c.end || harvest < today) continue;
    if (!c.sown) out.push({ kind: 'sow', date: sow, c });
    const next = c.windows.find((w) => w.status === 'due' || w.status === 'later');
    if (next)
      out.push({
        kind: 'irrigate',
        date: next.start < today ? today : next.start,
        c,
        window: next,
      });
    for (const job of c.jobs)
      if (job.kind !== 'care') out.push({ kind: 'job', date: plusDays(sow, job.day), c, job });
    const hot = c.a.weeks.find((w) => w.hot);
    if (hot) out.push({ kind: 'heat', date: hot.start, c, week: hot });
    out.push({ kind: 'harvest', date: harvest, c });
  }
  return out
    .filter((e) => e.date >= today)
    .sort((x, y) => x.date.localeCompare(y.date))
    .slice(0, limit);
}
