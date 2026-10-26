import type { CropId, Farm, Localized } from '../domain/types';
export const mungGuide = {
  url: 'https://csisa.org/wp-content/uploads/sites/2/2014/06/Easy-to-use-methods-to-improve-mungbean-production-in-Bangladesh.pdf',
  publisher: 'CIMMYT / CSISA',
  year: 2016,
  license: 'CC BY 4.0',
};
export function cropFieldChecks(
  crop: CropId,
  farm: Farm,
): { blocked: boolean; notes: Localized[]; source?: string } {
  const notes: Localized[] = [];
  if (crop === 'boro')
    notes.push({
      en:
        farm.irrigation === 'rainfed'
          ? 'Boro is an irrigated dry-season crop. With rainfed-only water access, this planner cannot include it; confirm an irrigation supply first.'
          : 'Confirm the dry-season irrigation supply before choosing Boro. This calendar does not calculate a watering dose.',
      bn:
        farm.irrigation === 'rainfed'
          ? 'বোরো সেচনির্ভর শুষ্ক মৌসুমের ফসল। শুধু বৃষ্টির পানিতে এই পরিকল্পনায় রাখা যায় না; আগে সেচের সরবরাহ নিশ্চিত করুন।'
          : 'বোরো বাছার আগে শুষ্ক মৌসুমের সেচ নিশ্চিত করুন। এই পঞ্জিকা সেচের মাত্রা গণনা করে না।',
    });
  if (crop === 'mung') {
    if (farm.drainage === 'poor')
      notes.push({
        en: 'Standing water must be drained before mung bean sowing. Resolve the water-collecting field condition before including mung in a planting calendar (CIMMYT/CSISA, printed p.20).',
        bn: 'মুগ বোনার আগে জমা পানি সরাতে হবে। মুগ ক্যালেন্ডারে রাখার আগে পানি জমার সমস্যা সমাধান করুন (CIMMYT/CSISA, মুদ্রিত পৃ.২০)।',
      });
    else if (farm.drainage === 'unknown')
      notes.push({
        en: 'Confirm there is no standing water before sowing mung bean; drainage is unknown.',
        bn: 'মুগ বোনার আগে জমা পানি নেই নিশ্চিত করুন; নিষ্কাশন জানা নেই।',
      });
    if (farm.soil === 'clay')
      notes.push({
        en: 'Heavy clay is a limitation for strip/raised-bed establishment described in this guide; texture alone does not establish that your soil is heavy clay. Confirm the establishment method (printed pp.14–15).',
        bn: 'এই নির্দেশিকায় ভারী এঁটেল মাটিতে স্ট্রিপ/বেড পদ্ধতির সীমা আছে; শুধু এঁটেল বললে ভারী এঁটেল নিশ্চিত হয় না। চাষের পদ্ধতি নিশ্চিত করুন (মুদ্রিত পৃ.১৪–১৫)।',
      });
    notes.push({
      en: 'Moist seed contact is needed for germination. Saline soils require specific review; no salinity reading has been supplied.',
      bn: 'অঙ্কুরোদগমে বীজের সঙ্গে আর্দ্র মাটির সংযোগ দরকার। লবণাক্ত মাটিতে আলাদা যাচাই দরকার; লবণাক্ততার মাপ দেওয়া নেই।',
    });
  }
  return {
    blocked:
      (crop === 'mung' && farm.drainage === 'poor') ||
      (crop === 'boro' && farm.irrigation === 'rainfed'),
    notes,
    source:
      crop === 'mung'
        ? mungGuide.url
        : crop === 'boro'
          ? 'https://www.fao.org/4/ai472e/ai472e00.htm'
          : undefined,
  };
}
export const mungBroadcastRates = [
  { id: 'bari-mung-2', name: 'BARI Mung-2', low: 30, high: 35 },
  { id: 'bari-mung-8', name: 'BARI Mung-8', low: 30, high: 35 },
  { id: 'bari-mung-5', name: 'BARI Mung-5', low: 45, high: 50 },
  { id: 'bari-mung-6', name: 'BARI Mung-6', low: 45, high: 50 },
  { id: 'bari-mung-7', name: 'BARI Mung-7', low: 45, high: 50 },
];
export function seedQuantity(area: number, rateId: string) {
  const rate = mungBroadcastRates.find((r) => r.id === rateId);
  if (!rate || !Number.isFinite(area) || area <= 0) return null;
  return { low: rate.low * area, high: rate.high * area };
}
export function germination(healthy: number, total: number) {
  return Number.isInteger(healthy) &&
    Number.isInteger(total) &&
    total > 0 &&
    healthy >= 0 &&
    healthy <= total
    ? (healthy / total) * 100
    : null;
}
