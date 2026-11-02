import { crops } from '../data/crops';
import type { GlobalCrop } from './global-season';
import type { Language } from './types';

// Reuse the existing sourced local common names, matching whole common names
// only. Scientific identities and the imported source records stay unchanged.
const localNames = new Map(
  Object.values(crops).flatMap((crop) =>
    crop.name.en.split(' / ').map((name) => [name.trim().toLowerCase(), crop.name.bn] as const),
  ),
);
const hasBangla = (value: string) => /[\u0980-\u09ff]/.test(value);
function commonText(value: string, scientific: string) {
  const escaped = scientific.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return value
    .replace(new RegExp(`\\s*\\(\\s*${escaped}\\s*\\)`, 'gi'), '')
    .replace(new RegExp(escaped, 'gi'), '')
    .replace(/\s*\((?:species reference|প্রজাতির তথ্য)\)/gi, '')
    .replace(/^[\s,;·-]+|[\s,;·-]+$/g, '')
    .trim();
}
export function commonPlantNames(plant: GlobalCrop) {
  const en = commonText(plant.name.en, plant.scientific) || null;
  const recorded = commonText(plant.name.bn, plant.scientific);
  const bn = hasBangla(recorded)
    ? recorded
    : en
      ? (localNames.get(en.toLowerCase()) ?? null)
      : null;
  return { en, bn };
}
export function plantDisplayName(plant: GlobalCrop, language: Language) {
  const names = commonPlantNames(plant);
  if (names[language]) return names[language];
  if (language === 'bn' && names.en) return names.en;
  const code =
    language === 'bn'
      ? plant.ecocropId.replace(/\d/g, (digit) => '০১২৩৪৫৬৭৮৯'[Number(digit)])
      : plant.ecocropId;
  return language === 'bn'
    ? `প্রচলিত নাম উৎসে নেই · গাছ ${code}`
    : `Common name unrecorded · plant ${code}`;
}
