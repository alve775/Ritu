import { regionalCalendars, calendarByCrop } from '../data/regional-calendars';
import { crops } from '../data/crops';
import { cropTaxonomy } from '../data/crop-taxonomy';
import type { CropId, Farm, Priority } from './types';
import { cropFieldChecks } from '../data/crop-practices';
export type Season = 'winter' | 'pre-monsoon' | 'monsoon';
export interface DatedPeriod {
  crop: CropId;
  start: string;
  end: string;
  source: string;
  durationDays: number;
}
export interface EvidencePlan {
  id: string;
  periods: DatedPeriod[];
  gaps: { start: string; end: string }[];
  familyCount: number;
  includesPulse: boolean;
  familiarCount: number;
}
export const validDate = (s: unknown): s is string =>
  typeof s === 'string' &&
  /^\d{4}-\d{2}-\d{2}$/.test(s) &&
  Number.isFinite(Date.parse(s)) &&
  new Date(s).toISOString().slice(0, 10) === s;
export const addDays = (date: string, days: number) => {
  if (!validDate(date) || !Number.isInteger(days)) throw Error('Invalid date or duration');
  return new Date(Date.parse(date) + days * 86400000).toISOString().slice(0, 10);
};
/** Display convention only: January 1-based seven-day blocks, not an optimal sowing prescription. */
export function referenceWeekStart(year: number, week: number) {
  if (
    !Number.isInteger(year) ||
    year < 2000 ||
    year > 2100 ||
    !Number.isInteger(week) ||
    week < 1 ||
    week > 52
  )
    throw Error('Invalid reference week');
  return addDays(`${year}-01-01`, (week - 1) * 7);
}
export function referencePeriods(from: string): DatedPeriod[] {
  if (!validDate(from)) return [];
  const year = Number(from.slice(0, 4));
  if (year < 2000 || year > 2098) return [];
  const until = addDays(from, 550);
  return regionalCalendars
    .flatMap((c) =>
      [year, year + 1, year + 2].map((y) => ({
        crop: c.id,
        start: referenceWeekStart(y, c.weeks.first),
        end: addDays(referenceWeekStart(y, c.weeks.first), c.duration.max),
        source: c.source.document,
        durationDays: c.duration.max,
      })),
    )
    .filter((p) => p.start >= from && p.start < until)
    .sort((a, b) => a.start.localeCompare(b.start) || a.crop.localeCompare(b.crop));
}
export const seasonKey = (p: DatedPeriod) =>
  `${calendarByCrop(p.crop)!.group}:${p.start.slice(0, 4)}`;
export const upcomingSeasons = (from: string) =>
  [...new Set(referencePeriods(from).map(seasonKey))].slice(0, 3);
export function noOverlap(periods: DatedPeriod[]) {
  const sorted = [...periods].sort((a, b) => a.start.localeCompare(b.start));
  return sorted.every(
    (p, i) =>
      validDate(p.start) &&
      validDate(p.end) &&
      p.end > p.start &&
      (!i || sorted[i - 1].end <= p.start),
  );
}
export function summarizePlan(periods: DatedPeriod[], farm: Farm): EvidencePlan {
  const sorted = [...periods].sort((a, b) => a.start.localeCompare(b.start));
  return {
    id: `regional-${sorted.map((p) => `${p.crop}-${p.start}`).join('_')}`,
    periods: sorted,
    gaps: sorted
      .slice(1)
      .flatMap((p, i) => (sorted[i].end < p.start ? [{ start: sorted[i].end, end: p.start }] : [])),
    familyCount: new Set(
      sorted.flatMap((p) => (cropTaxonomy[p.crop] ? [cropTaxonomy[p.crop]!.family] : [])),
    ).size,
    includesPulse: sorted.some((p) => crops[p.crop].household === 'pulses'),
    familiarCount: sorted.filter((p) => farm.current.some((c) => c.crop === p.crop)).length,
  };
}
/** Literal source durations and entered constraints only. Leaving a season unplanted is an explicit farmer choice. */
export function evidencePlans(
  from: string,
  preferred: CropId[],
  farm: Farm,
  priority: Priority,
  unplanted: Season[] = [],
): EvidencePlan[] {
  const keys = upcomingSeasons(from);
  if (keys.length !== 3) return [];
  const available = referencePeriods(from).filter(
    (p) => preferred.includes(p.crop) && !cropFieldChecks(p.crop, farm).blocked,
  );
  const choices: (DatedPeriod | null)[][] = keys.map((key) =>
    unplanted.includes(key.split(':')[0] as Season)
      ? [null]
      : available.filter((p) => seasonKey(p) === key),
  );
  if (choices.some((c) => !c.length)) return [];
  const result: EvidencePlan[] = [];
  for (const a of choices[0])
    for (const b of choices[1])
      for (const c of choices[2]) {
        const periods = [a, b, c]
          .filter((p): p is DatedPeriod => p !== null)
          .sort((x, y) => x.start.localeCompare(y.start));
        if (!periods.length || !noOverlap(periods)) continue;
        if (
          farm.unavailableMonths.some((m) =>
            periods.some((p) =>
              [
                (new Date(p.start).getUTCMonth() + 10) % 12,
                (new Date(addDays(p.end, -1)).getUTCMonth() + 10) % 12,
              ].includes(m),
            ),
          )
        )
          continue;
        if (farm.required.some((group) => !periods.some((p) => crops[p.crop].household === group)))
          continue;
        result.push(summarizePlan(periods, farm));
      }
  return result
    .sort(
      (a, b) =>
        (priority === 'diversity'
          ? b.familyCount - a.familyCount
          : priority === 'familiar'
            ? b.familiarCount - a.familiarCount
            : priority === 'soil'
              ? Number(b.includesPulse) - Number(a.includesPulse)
              : 0) || a.id.localeCompare(b.id),
    )
    .slice(0, 3);
}
