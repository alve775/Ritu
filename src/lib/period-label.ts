import { months } from '../data/preview';

/** "Feb" for a one-month period, otherwise "Feb → Apr". */
export function periodLabel(period: { start: number; duration: number }, language: 'en' | 'bn') {
  if (period.duration === 1) return months[language][period.start];
  return `${months[language][period.start]} → ${months[language][(period.start + period.duration - 1) % 12]}`;
}
