import { previewData } from '../data/preview';
import type { CropPeriod, Evaluation, Farm, Priority, Rotation } from './types';

export function coveredMonths(period: CropPeriod): number[] {
  return Array.from({ length: period.duration }, (_, index) => (period.start + index) % 12);
}
export function segments(period: CropPeriod): { start: number; length: number }[] {
  const first = Math.min(period.duration, 12 - period.start);
  return period.duration > first
    ? [
        { start: period.start, length: first },
        { start: 0, length: period.duration - first },
      ]
    : [{ start: period.start, length: first }];
}
export function rotationsFor(farm: Farm, alternatives = previewData.alternatives): Rotation[] {
  const crops = farm.current
    .filter((p) => p.crop !== 'fallow')
    .map((p) => previewData.crops[p.crop]);
  return [
    {
      id: 'current',
      name: { en: 'Your current rotation', bn: 'আপনার বর্তমান ফসলক্রম' },
      subtitle: {
        en: crops.map((c) => c.name.en).join(' → '),
        bn: crops.map((c) => c.name.bn).join(' → '),
      },
      periods: farm.current,
      isCurrent: true,
    },
    ...alternatives,
  ];
}
export function evaluate(rotation: Rotation, farm: Farm): Evaluation {
  const crops = rotation.periods
    .filter((p) => p.crop !== 'fallow')
    .map((p) => previewData.crops[p.crop]);
  const occupancy = Array.from({ length: 12 }, () => 0);
  rotation.periods.forEach((p) => coveredMonths(p).forEach((m) => occupancy[m]++));
  const overlaps = occupancy.some((count) => count > 1);
  const hasCrops = crops.length > 0;
  const calendarGaps = occupancy.some((count) => count === 0);
  const waterUnknown = farm.irrigation === 'unknown';
  const missing = farm.required.filter((req) => !crops.some((c) => c.household === req));
  const laborConflict = rotation.periods
    .filter((p) => p.crop !== 'fallow')
    .some(
      (p) =>
        farm.unavailableMonths.includes(p.start) ||
        farm.unavailableMonths.includes((p.start + p.duration - 1) % 12),
    );
  const checks: Evaluation['checks'] = [
    {
      id: 'calendar',
      state: overlaps || !hasCrops ? 'block' : calendarGaps ? 'unknown' : 'pass',
      label: { en: 'Calendar fit', bn: 'ক্যালেন্ডারের মিল' },
      detail: overlaps
        ? {
            en: 'Crop or fallow periods overlap. Adjust the current planting month or duration.',
            bn: 'ফসল বা বিরতির সময় মিলে গেছে। রোপণের মাস বা সময়কাল বদলান।',
          }
        : !hasCrops
          ? {
              en: 'This sequence has no crop. Add a crop before comparing rotations.',
              bn: 'এই ক্রমে ফসল নেই। তুলনার আগে ফসল যোগ করুন।',
            }
          : calendarGaps
            ? {
                en: 'Some months are unspecified. Add crop or rest periods to complete the year.',
                bn: 'কিছু মাসের তথ্য নেই। বছর পূরণ করতে ফসল বা বিরতি যোগ করুন।',
              }
            : {
                en: 'No overlap in the sample monthly calendar. Actual planting windows still need review.',
                bn: 'নমুনা মাসভিত্তিক ক্যালেন্ডারে সময় মেলেনি। প্রকৃত রোপণের সময় যাচাই দরকার।',
              },
    },
    {
      id: 'water',
      state: 'unknown',
      label: { en: 'Water access', bn: 'সেচের সুযোগ' },
      detail: waterUnknown
        ? {
            en: 'Water access is unknown. Confirm irrigation before considering this option.',
            bn: 'সেচের সুযোগ অজানা। এই বিকল্প বিবেচনার আগে নিশ্চিত করুন।',
          }
        : {
            en: 'Water access is recorded. Crop water needs and available amounts have not been verified; suitability is not assessed.',
            bn: 'সেচের তথ্য রাখা হয়েছে। ফসলের পানির চাহিদা ও পাওয়া পানির পরিমাণ যাচাই হয়নি; উপযোগিতা যাচাই বাকি।',
          },
    },
    {
      id: 'drainage',
      state: 'unknown',
      label: { en: 'Drainage', bn: 'পানি নিষ্কাশন' },
      detail:
        farm.drainage === 'unknown'
          ? {
              en: 'Drainage is unknown. Confirm field conditions with a local agricultural adviser.',
              bn: 'নিষ্কাশন অজানা। স্থানীয় কৃষি পরামর্শকের সঙ্গে নিশ্চিত করুন।',
            }
          : {
              en: 'Drainage is recorded. Crop-specific drainage requirements need local evidence before a suitability check.',
              bn: 'নিষ্কাশনের তথ্য রাখা হয়েছে। উপযোগিতা যাচাইয়ের আগে ফসলভিত্তিক স্থানীয় প্রমাণ দরকার।',
            },
    },
    {
      id: 'soil',
      state: 'unknown',
      label: { en: 'Soil information', bn: 'মাটির তথ্য' },
      detail:
        farm.soil === 'unknown'
          ? {
              en: 'Soil texture is unknown. No soil suitability conclusion can be made.',
              bn: 'মাটির গঠন অজানা। উপযোগিতা সম্পর্কে সিদ্ধান্ত দেওয়া যায় না।',
            }
          : {
              en: 'Soil texture is recorded, but crop-specific soil suitability is not assessed in this preview.',
              bn: 'মাটির গঠন দেওয়া আছে, তবে এই নমুনায় ফসলভিত্তিক উপযোগিতা যাচাই হয়নি।',
            },
    },
    {
      id: 'household',
      state: missing.length ? 'block' : 'pass',
      label: { en: 'Household crops', bn: 'পরিবারের ফসল' },
      detail: missing.length
        ? {
            en: 'This sequence does not contain every crop your household wants to keep. Review the required crops.',
            bn: 'পরিবারের চাওয়া সব ফসল এই ক্রমে নেই। প্রয়োজনীয় ফসল দেখুন।',
          }
        : {
            en: 'Every required crop group appears in the sequence. Household quantities are not estimated.',
            bn: 'প্রয়োজনীয় সব ফসলের ধরন এই ক্রমে আছে। পরিবারের চাহিদার পরিমাণ হিসাব করা হয়নি।',
          },
    },
    {
      id: 'labor',
      state: laborConflict ? 'block' : 'pass',
      label: { en: 'Planting & harvest help', bn: 'রোপণ ও কাটার শ্রম' },
      detail: laborConflict
        ? {
            en: 'A sample planting or harvest month falls in a month without help. Change the labor constraint or calendar.',
            bn: 'নমুনার রোপণ বা কাটার মাসে শ্রম নেই। শ্রমের শর্ত বা ক্যালেন্ডার বদলান।',
          }
        : {
            en: 'No sample planting or harvest month conflicts with the months you marked.',
            bn: 'চিহ্নিত মাসে নমুনার রোপণ বা কাটার সংঘাত নেই।',
          },
    },
  ];
  return {
    rotation,
    checks,
    status: checks.some((c) => c.state === 'block')
      ? 'blocked'
      : checks.some((c) => c.state === 'unknown')
        ? 'confirm'
        : 'passes',
    familyCount: new Set(crops.filter((c) => c.familyReviewed !== false).map((c) => c.family.en))
      .size,
    legumeMonths: rotation.periods
      .filter((p) => p.crop === 'mung')
      .reduce((sum, p) => sum + p.duration, 0),
    fallowMonths: rotation.periods
      .filter((p) => p.crop === 'fallow')
      .reduce((sum, p) => sum + p.duration, 0),
  };
}
// No recommendation is made until agronomic evidence supports the checks.
export function preferredOption(evaluations: Evaluation[], priority: Priority): string | null {
  const eligible = evaluations.filter((e) => e.status === 'passes');
  if (!eligible.length) return null;
  if (priority === 'water') return null;
  return [...eligible].sort((a, b) =>
    priority === 'diversity'
      ? b.familyCount - a.familyCount
      : Number(Boolean(b.rotation.isCurrent)) - Number(Boolean(a.rotation.isCurrent)),
  )[0].rotation.id;
}
