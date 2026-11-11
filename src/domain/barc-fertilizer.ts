import type { Localized } from './types';

/** One fertiliser in BARC's recommendation, per 100 decimals. `alt` marks an "or" alternative. */
export interface FertilizerItem {
  name: string;
  nutrient: string;
  kg: number;
  alt: boolean;
}
export interface FertilizerAdvice {
  items: FertilizerItem[];
  notes: string[];
}

const strip = (s: string) =>
  s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Read BARC's fertiliser recommendation table (czis.cropzoning.gov.bd, by point, per 100 decimals):
 * one row per fertiliser, "or" rows before alternatives, then notes. Empty when BARC has no
 * recommendation for the point.
 */
export function parseFertilizer(page: string): FertilizerAdvice {
  // BARC's page repeats the numbers in HTML comments; they would leak into the notes.
  const html = page.replace(/<!--[\s\S]*?-->/g, ' ');
  const items: FertilizerItem[] = [];
  const notes: string[] = [];
  let alt = false,
    inNotes = false;
  const row = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  for (let m = row.exec(html); m; m = row.exec(html)) {
    const cells = [...m[1].matchAll(/<t([hd])[^>]*>([\s\S]*?)<\/t[hd]>/gi)].map((c) => ({
      head: c[1].toLowerCase() === 'h',
      text: strip(c[2]),
    }));
    if (cells.length === 3 && cells[0].head) {
      const amount = /^([\d.]+)\s*(kg|gm|g)\b/i.exec(cells[2].text);
      if (!amount) continue;
      const value = Number(amount[1]);
      if (!Number.isFinite(value)) continue;
      items.push({
        name: cells[0].text,
        nutrient: cells[1].text,
        kg: /^g/i.test(amount[2]) ? value / 1000 : value,
        alt,
      });
      alt = false;
    } else if (cells.length === 1) {
      const text = cells[0].text;
      if (/^or$/i.test(text)) alt = true;
      else if (/^\*?\s*note:?$/i.test(text)) inNotes = true;
      else if (inNotes && text) notes.push(text.replace(/^\*\s*/, ''));
    }
  }
  return { items, notes };
}

/** Kilograms for a plot: BARC gives kg per 100 decimals; 1 hectare is 247.105 decimals. */
export const plotKg = (kgPer100Decimal: number, areaHa: number) =>
  (kgPer100Decimal * areaHa * 247.105) / 100;

export const fertilizerNames: Record<string, Localized> = {
  Urea: { en: 'Urea', bn: 'ইউরিয়া' },
  TSP: { en: 'TSP', bn: 'টিএসপি' },
  DAP: { en: 'DAP', bn: 'ডিএপি' },
  MoP: { en: 'MoP', bn: 'এমওপি' },
  Gypsum: { en: 'Gypsum', bn: 'জিপসাম' },
  'Zinc Sulphate (M)': { en: 'Zinc sulphate', bn: 'জিংক সালফেট' },
  'Zinc Sulphate (H)': { en: 'Zinc sulphate (H)', bn: 'জিংক সালফেট (এইচ)' },
  'Boric Acid': { en: 'Boric acid', bn: 'বরিক এসিড' },
  Solubor: { en: 'Solubor', bn: 'সলুবর' },
  'Magnesium Sulphate': { en: 'Magnesium sulphate', bn: 'ম্যাগনেসিয়াম সালফেট' },
};
