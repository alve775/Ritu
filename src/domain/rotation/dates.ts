/** ISO calendar dates (YYYY-MM-DD) handled in UTC so day counts never shift with the time zone. */
const DAY = 86400000;
export const toTime = (iso: string) => Date.parse(iso + 'T00:00:00Z');
export const fromTime = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const plusDays = (iso: string, days: number) => fromTime(toTime(iso) + days * DAY);
export const dayCount = (a: string, b: string) => Math.round((toTime(b) - toTime(a)) / DAY);
export const isoOf = (year: number, month: number, day: number) =>
  fromTime(Date.UTC(year, month - 1, day));
/** Calendar month index 0–11 of an ISO date. */
export const monthIndex = (iso: string) => Number(iso.slice(5, 7)) - 1;
export const yearOf = (iso: string) => Number(iso.slice(0, 4));
export const daysInMonth = (iso: string) => {
  const y = yearOf(iso),
    m = monthIndex(iso);
  return new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
};
