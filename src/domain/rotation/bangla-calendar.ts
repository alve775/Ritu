import { isoOf, toTime, yearOf, dayCount } from './dates';

/**
 * Bangla calendar months as used in Bangladesh since the 2019 revision: Boishakh starts on
 * 14 April, the first six months have 31 days, Falgun has 29 (30 in a Gregorian leap year) and the
 * rest 30. Each entry is the Gregorian [month, day] the Bangla month starts on.
 */
export const banglaMonths = [
  { bn: 'বৈশাখ', en: 'Boishakh', start: [4, 14] },
  { bn: 'জ্যৈষ্ঠ', en: 'Joishtho', start: [5, 15] },
  { bn: 'আষাঢ়', en: 'Asharh', start: [6, 15] },
  { bn: 'শ্রাবণ', en: 'Srabon', start: [7, 16] },
  { bn: 'ভাদ্র', en: 'Bhadro', start: [8, 16] },
  { bn: 'আশ্বিন', en: 'Ashwin', start: [9, 16] },
  { bn: 'কার্তিক', en: 'Kartik', start: [10, 17] },
  { bn: 'অগ্রহায়ণ', en: 'Agrahayan', start: [11, 16] },
  { bn: 'পৌষ', en: 'Poush', start: [12, 16] },
  { bn: 'মাঘ', en: 'Magh', start: [1, 15] },
  { bn: 'ফাল্গুন', en: 'Falgun', start: [2, 14] },
  { bn: 'চৈত্র', en: 'Choitro', start: [3, 15] },
] as const;

/** Start date of every Bangla month that begins in the given Gregorian year. */
export function banglaMonthStarts(year: number) {
  return banglaMonths
    .map((m, index) => ({ index, iso: isoOf(year, m.start[0], m.start[1]) }))
    .sort((a, b) => toTime(a.iso) - toTime(b.iso));
}

/** Day and month of the Bangla calendar for an ISO date. */
export function banglaDate(iso: string) {
  const year = yearOf(iso);
  const starts = [...banglaMonthStarts(year - 1), ...banglaMonthStarts(year)].filter(
    (s) => s.iso <= iso,
  );
  const start = starts[starts.length - 1];
  return { day: dayCount(start.iso, iso) + 1, month: start.index, name: banglaMonths[start.index] };
}
