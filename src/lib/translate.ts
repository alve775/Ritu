import type { Language } from '../domain/types';
export const tr = (language: Language, en: string, bn: string): string =>
  language === 'bn' ? bn : en;
