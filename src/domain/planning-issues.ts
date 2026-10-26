import type { CropId, Farm, Localized } from './types';
import { referencePeriods, upcomingSeasons, seasonKey, addDays } from './evidence-planner';
import type { Season } from './evidence-planner';
import { crops } from '../data/crops';
import { cropFieldChecks } from '../data/crop-practices';
const seasonLabel: Record<Season, Localized> = {
  winter: { en: 'Winter', bn: 'শীত' },
  'pre-monsoon': { en: 'Pre-monsoon', bn: 'প্রাক-বর্ষা' },
  monsoon: { en: 'Monsoon', bn: 'বর্ষা' },
};
/** Explain actual missing choices, recorded constraints and dated overlaps. No suitability score is inferred. */
export function planningIssues(
  from: string,
  preferred: CropId[],
  farm: Farm,
  unplanted: Season[],
): Localized[] {
  const keys = upcomingSeasons(from),
    selected = referencePeriods(from).filter(
      (p) =>
        preferred.includes(p.crop) &&
        keys.includes(seasonKey(p)) &&
        !unplanted.includes(seasonKey(p).split(':')[0] as Season),
    ),
    usable = selected.filter((p) => !cropFieldChecks(p.crop, farm).blocked),
    issues: Localized[] = [];
  for (const key of keys) {
    const season = key.split(':')[0] as Season;
    if (!unplanted.includes(season) && !usable.some((p) => seasonKey(p) === key))
      issues.push({
        en: `${seasonLabel[season].en} ${key.split(':')[1]}: choose a crop or mark the season unplanted.`,
        bn: `${seasonLabel[season].bn} ${key.split(':')[1]}: ফসল বাছুন বা মৌসুম খালি রাখুন।`,
      });
  }
  for (const p of selected) {
    const check = cropFieldChecks(p.crop, farm);
    if (check.blocked && check.notes[0]) issues.push(check.notes[0]);
    const days = [p.start, addDays(p.end, -1)].filter((d) =>
      farm.unavailableMonths.includes((new Date(d).getUTCMonth() + 10) % 12),
    );
    if (days.length)
      issues.push({
        en: `${crops[p.crop].name.en}: ${days.join(', ')} falls in a month without planting/harvest help.`,
        bn: `${crops[p.crop].name.bn}: ${days.join(', ')} রোপণ/কাটার শ্রম না থাকার মাসে।`,
      });
  }
  for (let i = 0; i < usable.length; i++)
    for (let j = i + 1; j < usable.length; j++) {
      const a = usable[i],
        b = usable[j];
      if (seasonKey(a) === seasonKey(b)) continue;
      if (a.start < b.end && b.start < a.end)
        issues.push({
          en: `${crops[a.crop].name.en} (${a.start}–${addDays(a.end, -1)}) overlaps ${crops[b.crop].name.en} (${b.start}–${addDays(b.end, -1)}). Choose another crop or leave one season unplanted.`,
          bn: `${crops[a.crop].name.bn} (${a.start}–${addDays(a.end, -1)}) ও ${crops[b.crop].name.bn} (${b.start}–${addDays(b.end, -1)}) এক সময়ে পড়ে। অন্য ফসল বাছুন বা এক মৌসুম খালি রাখুন।`,
        });
    }
  for (const need of farm.required)
    if (!usable.some((p) => crops[p.crop].household === need))
      issues.push({
        en: `Your household requires ${need === 'rice' ? 'rice' : need === 'pulses' ? 'pulses' : 'potato'}, but no usable selected crop covers it. Keep the requirement and change crop choices, or edit it yourself.`,
        bn: `পরিবারের ${need === 'rice' ? 'ধান' : need === 'pulses' ? 'ডাল' : 'আলু'} দরকার, কিন্তু বাছা ফসলে নেই। শর্ত রেখে ফসল বদলান বা নিজে শর্ত বদলান।`,
      });
  if (unplanted.length === 3)
    issues.push({
      en: 'All seasons are unplanted. Choose at least one crop to create a crop calendar.',
      bn: 'সব মৌসুম খালি। ফসলের ক্যালেন্ডার করতে অন্তত একটি ফসল বাছুন।',
    });
  return issues;
}
