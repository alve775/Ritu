import type { CropId, Localized } from '../domain/types';
export interface RegionalCalendar {
  id: CropId;
  name: Localized;
  group: 'winter' | 'pre-monsoon' | 'monsoon';
  duration: { min: number; max: number };
  weeks: { first: number; last: number };
  source: { publisher: string; page: string; document: string; date: string; pageNumber: number };
  basis: Localized;
  scope: Localized;
}
const source = (page: string, document: string, date: string) => ({
  publisher: 'Department of Agricultural Extension · BAMIS',
  page,
  document,
  date,
  pageNumber: 1,
});
const scope: Localized = {
  en: 'Rajshahi region: Rajshahi, Chapainawabganj, Naogaon and Natore. Regional crop-weather reference, not a cultivar-specific field prescription.',
  bn: 'রাজশাহী অঞ্চল: রাজশাহী, চাঁপাইনবাবগঞ্জ, নওগাঁ ও নাটোর। আঞ্চলিক ফসল-আবহাওয়ার তথ্য, জাতভিত্তিক জমির চূড়ান্ত পরামর্শ নয়।',
};
/** Source facts visually transcribed from the linked original single-page government PDFs on 2026-10-26. */
export const regionalCalendars: RegionalCalendar[] = [
  {
    id: 'potato',
    name: { en: 'Potato', bn: 'আলু' },
    group: 'winter',
    duration: { min: 105, max: 105 },
    weeks: { first: 42, last: 4 },
    source: source(
      'https://www.bamis.gov.bd/calendar/1/52/2/',
      'https://www.bamis.gov.bd/res/public/calendars/2019/11/14/8864.pdf',
      '2019-11-14',
    ),
    basis: {
      en: '105-day regional reference from sprouting to harvest. This is not a cultivar-specific sowing window.',
      bn: 'অঙ্কুর থেকে কাটা পর্যন্ত ১০৫ দিনের আঞ্চলিক তথ্য। এটি জাতভিত্তিক বোনার সময়সীমা নয়।',
    },
    scope,
  },
  {
    id: 'boro',
    name: { en: 'Boro rice', bn: 'বোরো ধান' },
    group: 'winter',
    duration: { min: 150, max: 155 },
    weeks: { first: 49, last: 19 },
    source: source(
      'https://www.bamis.gov.bd/calendar/1/75/2/',
      'https://www.bamis.gov.bd/res/public/calendars/2019/08/23/5105.pdf',
      '2019-08-23',
    ),
    basis: {
      en: '150–155 days includes seedbed and transplanting. All 155 days are reserved conservatively, including nursery time; no separate nursery parcel is assumed.',
      bn: '১৫০–১৫৫ দিনে বীজতলা ও রোপণ থাকে। আলাদা বীজতলার জমি ধরে না নিয়ে সতর্কভাবে পুরো ১৫৫ দিন রাখা হয়।',
    },
    scope,
  },
  {
    id: 'aus',
    name: { en: 'Aus rice', bn: 'আউশ ধান' },
    group: 'pre-monsoon',
    duration: { min: 126, max: 126 },
    weeks: { first: 20, last: 37 },
    source: source(
      'https://www.bamis.gov.bd/calendar/1/7/2/',
      'https://www.bamis.gov.bd/res/public/calendars/2019/08/23/5072.pdf',
      '2019-08-23',
    ),
    basis: {
      en: '126 days includes seedbed and transplanting. Reserving the entire source interval can conflict with Aman; no nursery overlap is silently allowed.',
      bn: '১২৬ দিনে বীজতলা ও রোপণ থাকে। পুরো সময় রাখায় আমনের সঙ্গে সংঘাত হতে পারে; বীজতলার সময়ের সংঘাত নিজে থেকে মেনে নেওয়া হয় না।',
    },
    scope,
  },
  {
    id: 'maize',
    name: { en: 'Maize · Rabi', bn: 'ভুট্টা · রবি' },
    group: 'winter',
    duration: { min: 112, max: 112 },
    weeks: { first: 46, last: 9 },
    source: source(
      'https://www.bamis.gov.bd/calendar/1/79/2/',
      'https://www.bamis.gov.bd/res/public/calendars/2019/08/23/5125.pdf',
      '2019-08-23',
    ),
    basis: {
      en: '112-day winter maize reference from sowing to harvest. No summer-maize calendar or variety-specific response is inferred.',
      bn: 'বোনা থেকে কাটা পর্যন্ত ১১২ দিনের শীতের ভুট্টার তথ্য। গ্রীষ্মের পঞ্জিকা বা জাতের প্রতিক্রিয়া ধরে নেওয়া হয় না।',
    },
    scope,
  },
  {
    id: 'mung',
    name: { en: 'Mung bean · Kharif I', bn: 'মুগ · খরিফ ১' },
    group: 'pre-monsoon',
    duration: { min: 65, max: 70 },
    weeks: { first: 12, last: 21 },
    source: source(
      'https://www.bamis.gov.bd/calendar/1/86/2/',
      'https://www.bamis.gov.bd/res/public/calendars/2019/12/30/10931.pdf',
      '2019-12-30',
    ),
    basis: {
      en: 'Regional calendar begins with germination. Confirm the sowing date and cultivar locally; no cultivar is named in this calendar.',
      bn: 'পঞ্জিকা অঙ্কুরোদগম থেকে শুরু। বোনার দিন ও জাত স্থানীয়ভাবে নিশ্চিত করুন; পঞ্জিকায় নির্দিষ্ট জাত নেই।',
    },
    scope,
  },
  {
    id: 'aman',
    name: { en: 'Aman rice', bn: 'আমন ধান' },
    group: 'monsoon',
    duration: { min: 133, max: 133 },
    weeks: { first: 24, last: 42 },
    source: source(
      'https://www.bamis.gov.bd/calendar/1/74/2/',
      'https://www.bamis.gov.bd/res/public/calendars/2019/08/04/4326.pdf',
      '2019-08-04',
    ),
    basis: {
      en: '133 days includes the seedbed phase, followed by transplanting. Nursery dates are not field transplanting dates; confirm nursery arrangements and the variety.',
      bn: '১৩৩ দিনে বীজতলার পর্যায়সহ পরে চারা রোপণ থাকে। বীজতলার দিন মূল জমিতে রোপণের দিন নয়; বীজতলা ও জাত নিশ্চিত করুন।',
    },
    scope,
  },
  {
    id: 'wheat',
    name: { en: 'Wheat', bn: 'গম' },
    group: 'winter',
    duration: { min: 119, max: 119 },
    weeks: { first: 46, last: 10 },
    source: source(
      'https://www.bamis.gov.bd/calendar/1/9/2/',
      'https://www.bamis.gov.bd/res/public/calendars/2019/08/23/5116.pdf',
      '2019-08-23',
    ),
    basis: {
      en: 'Regional reference from sowing through harvest. Duration is 119 days; cultivar and actual maturity require confirmation.',
      bn: 'বোনা থেকে কাটা পর্যন্ত আঞ্চলিক তথ্য। সময় ১১৯ দিন; জাত ও প্রকৃত পরিপক্বতা নিশ্চিত করতে হবে।',
    },
    scope,
  },
  {
    id: 'mustard',
    name: { en: 'Mustard', bn: 'সরিষা' },
    group: 'winter',
    duration: { min: 80, max: 100 },
    weeks: { first: 47, last: 8 },
    source: source(
      'https://www.bamis.gov.bd/calendar/1/44/2/',
      'https://www.bamis.gov.bd/res/public/calendars/2019/12/30/10991.pdf',
      '2019-12-30',
    ),
    basis: {
      en: 'The source gives an 80–100 day range. The planner reserves all 100 days; it never shortens the crop to fit a rotation.',
      bn: 'উৎসে ৮০–১০০ দিন। পরিকল্পনায় পুরো ১০০ দিন রাখা হয়; ফসল মেলাতে সময় ছোট করা হয় না।',
    },
    scope,
  },
  {
    id: 'lentil',
    name: { en: 'Lentil', bn: 'মসুর' },
    group: 'winter',
    duration: { min: 119, max: 119 },
    weeks: { first: 42, last: 6 },
    source: source(
      'https://www.bamis.gov.bd/calendar/1/58/2/',
      'https://www.bamis.gov.bd/res/public/calendars/2019/11/07/8377.pdf',
      '2019-11-07',
    ),
    basis: {
      en: 'Regional reference from germination to maturity/harvest. No field-specific soil tolerance or irrigation quota is inferred.',
      bn: 'অঙ্কুরোদগম থেকে পরিপক্বতা/কাটা পর্যন্ত আঞ্চলিক তথ্য। জমির মাটির সহনসীমা বা সেচের পরিমাণ ধরে নেওয়া হয় না।',
    },
    scope,
  },
];
export const calendarByCrop = (id: CropId) => regionalCalendars.find((c) => c.id === id);
