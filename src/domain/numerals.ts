import type { Language } from './types';

const bengaliDigits = '০১২৩৪৫৬৭৮৯';

/** Writes a number (or text containing numbers) with Bengali digits when the page is in Bangla. */
export const localDigits = (value: string | number, language: Language) =>
  language === 'bn' ? String(value).replace(/\d/g, (d) => bengaliDigits[Number(d)]) : String(value);
