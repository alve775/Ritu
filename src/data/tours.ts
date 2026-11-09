import type { Localized } from '../domain/types';
export type TourScope = 'full' | 'farm' | 'crops' | 'compare' | 'field' | 'insights' | 'track';
export interface TourStep {
  id: string;
  scope: Exclude<TourScope, 'full'> | 'welcome';
  route: string | null;
  target?: string;
  title: Localized;
  description: Localized;
  mission: Localized;
}
export const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    scope: 'welcome',
    route: null,
    title: {
      en: 'Meet Mati, your farm guide',
      bn: 'আপনার কৃষি সহায়ক মাটির পরিচয়',
    },
    description: {
      en: 'Add your land with its location and size, then divide it into plots. For each plot you enter last year’s crops, get crop suggestions and follow a crop calendar. Each page has a short guide before you explore.',
      bn: 'স্থান ও আয়তন দিয়ে জমি যোগ করুন, তারপর জমিকে প্লটে ভাগ করুন। প্রতিটি প্লটে গত বছরের ফসল দিয়ে ফসলের পরামর্শ নিন ও ফসলের ক্যালেন্ডার দেখুন। প্রতি পাতার ছোট পরিচিতি শেষে নিজে দেখুন।',
    },
    mission: {
      en: 'RITU · Your growing season',
      bn: 'ঋতু · আপনার চাষের মৌসুম',
    },
  },
  {
    id: 'location',
    scope: 'farm',
    route: '/farm',
    target: '.location-map-grid, .registered-field-location',
    title: {
      en: 'Find your field anywhere',
      bn: 'যেকোনো স্থানে জমি খুঁজুন',
    },
    description: {
      en: 'Search a town or enter coordinates, then pin your field. Its weather and long-term climate load automatically.',
      bn: 'স্থান বা স্থানাঙ্ক দিয়ে জমিতে পিন দিন। সেই স্থানের আবহাওয়া ও দীর্ঘ সময়ের জলবায়ু নিজে থেকে আসবে।',
    },
    mission: {
      en: 'RITU · Your growing season',
      bn: 'ঋতু · আপনার চাষের মৌসুম',
    },
  },
  {
    id: 'basics',
    scope: 'farm',
    route: '/farm',
    target: '[data-tour="farm-basics"]',
    title: {
      en: 'Name and size',
      bn: 'নাম ও আয়তন',
    },
    description: {
      en: 'Enter the land’s size in your preferred unit and give it a name you will recognise later.',
      bn: 'পছন্দের এককে জমির আয়তন দিন এবং পরে চেনার জন্য একটি নাম দিন।',
    },
    mission: {
      en: 'RITU · Your growing season',
      bn: 'ঋতু · আপনার চাষের মৌসুম',
    },
  },
  {
    id: 'soil',
    scope: 'farm',
    route: '/farm',
    target: '[data-tour="farm-soil"]',
    title: {
      en: 'Describe soil and drainage',
      bn: 'মাটি ও নিষ্কাশন লিখুন',
    },
    description: {
      en: 'Choose the field’s soil texture and usual drainage. Select Not sure if you do not know.',
      bn: 'জমির মাটির গঠন ও সাধারণ নিষ্কাশন বাছুন। জানা না থাকলে নিশ্চিত নই বাছুন।',
    },
    mission: {
      en: 'RITU · Your growing season',
      bn: 'ঋতু · আপনার চাষের মৌসুম',
    },
  },
  {
    id: 'water',
    scope: 'farm',
    route: '/farm',
    target: '[data-tour="farm-water"]',
    title: {
      en: 'Record available water',
      bn: 'পানির সুযোগ লিখুন',
    },
    description: {
      en: 'Choose the water supply you can use on this field.',
      bn: 'এই জমিতে যে পানির সরবরাহ ব্যবহার করতে পারবেন তা বাছুন।',
    },
    mission: {
      en: 'RITU · Your growing season',
      bn: 'ঋতু · আপনার চাষের মৌসুম',
    },
  },
  {
    id: 'create',
    scope: 'crops',
    route: '/crops',
    target: '[data-tour="crop-continue"]',
    title: {
      en: 'Your crop selection stays here',
      bn: 'বাছা ফসল এখানে থাকবে',
    },
    description: {
      en: 'This bar shows the one crop you choose below. Once selected, Create crop calendar opens this plot’s calendar without changing your other plots.',
      bn: 'নিচে বাছা একটি ফসল এই বারে থাকবে। বাছার পরে ফসলের ক্যালেন্ডার তৈরি করুন চাপলে এই প্লটের ক্যালেন্ডার খুলবে, অন্য প্লট বদলাবে না।',
    },
    mission: {
      en: 'RITU · Your growing season',
      bn: 'ঋতু · আপনার চাষের মৌসুম',
    },
  },
  {
    id: 'crops',
    scope: 'crops',
    route: '/crops',
    target: '[data-tour="crop-suggestions"]',
    title: {
      en: 'Choose one suggested crop',
      bn: 'একটি প্রস্তাবিত ফসল বাছুন',
    },
    description: {
      en: 'Search crop options by name, use or life cycle. Open an option’s details to compare its requirements, then choose one crop for this plot.',
      bn: 'নাম, ব্যবহার বা জীবনচক্র দিয়ে ফসল খুঁজুন। বিস্তারিত খুলে চাহিদা তুলনা করুন, তারপর এই প্লটের জন্য একটি ফসল বাছুন।',
    },
    mission: {
      en: 'RITU · Your growing season',
      bn: 'ঋতু · আপনার চাষের মৌসুম',
    },
  },
  {
    id: 'calendar',
    scope: 'compare',
    route: '/plan',
    target: '[data-tour="calendar-main"]',
    title: {
      en: 'Your crop calendar',
      bn: 'আপনার ফসলের ক্যালেন্ডার',
    },
    description: {
      en: 'Find the crop, planting date and reference growing period here. Use Switch crop to open another planting.',
      bn: 'এখানে ফসল, রোপণের দিন ও উৎসের বৃদ্ধির সময় দেখুন। অন্য ফসল খুলতে অন্য ফসল খুলুন ব্যবহার করুন।',
    },
    mission: {
      en: 'RITU · Your growing season',
      bn: 'ঋতু · আপনার চাষের মৌসুম',
    },
  },
  {
    id: 'dates',
    scope: 'compare',
    route: '/plan',
    target: '[data-tour="calendar-dates"]',
    title: {
      en: 'Choose a calendar day',
      bn: 'ক্যালেন্ডারের দিন বাছুন',
    },
    description: {
      en: 'Tap a date to see its field checks. Rain values appear only on available forecast dates. Planned planting and actual planting are separate records.',
      bn: 'দিনে চাপলে সেই দিনের যাচাই দেখুন। শুধু পাওয়া পূর্বাভাসের দিনে বৃষ্টি থাকে। রোপণের পরিকল্পনা ও আসল রোপণ আলাদা।',
    },
    mission: {
      en: 'RITU · Your growing season',
      bn: 'ঋতু · আপনার চাষের মৌসুম',
    },
  },
  {
    id: 'daily',
    scope: 'compare',
    route: '/plan',
    target: '[data-tour="daily-actions"]',
    title: {
      en: 'Daily guidance follows your records',
      bn: 'প্রতিদিনের সহায়তা হিসাব অনুসরণ করে',
    },
    description: {
      en: 'Record planting, then add the crop stage, soil moisture and any damage in your daily field update. This changes the guidance shown. Record each picking and the final harvest when the season ends.',
      bn: 'রোপণের পর দিনের খবরে ফসলের পর্যায়, মাটির আর্দ্রতা ও ক্ষতি লিখুন। সে অনুযায়ী নির্দেশনা বদলায়। প্রতি দফার তোলা ও মৌসুম শেষে শেষ তোলা লিখুন।',
    },
    mission: {
      en: 'RITU · Your growing season',
      bn: 'ঋতু · আপনার চাষের মৌসুম',
    },
  },
  {
    id: 'farms',
    scope: 'track',
    route: '/farms',
    target: '[data-tour="my-farms"]',
    title: {
      en: 'Your lands and plots',
      bn: 'আপনার জমি ও প্লট',
    },
    description: {
      en: 'Each box is one land. Inside it are its plots, with last year’s crops and the crop growing now. Add a plot to get crop suggestions; plots must fit within their land.',
      bn: 'প্রতিটি বাক্স একটি জমি। এর ভেতরে প্লটগুলো, গত বছরের ফসল ও এখনকার ফসলসহ। ফসলের পরামর্শ পেতে প্লট যোগ করুন; প্লটগুলো জমির আয়তনের মধ্যে হতে হবে।',
    },
    mission: {
      en: 'RITU · Your growing season',
      bn: 'ঋতু · আপনার চাষের মৌসুম',
    },
  },
  {
    id: 'export',
    scope: 'track',
    route: '/farms',
    target: '[data-tour="farm-export"]',
    title: {
      en: 'Keep a backup',
      bn: 'ব্যাকআপ রাখুন',
    },
    description: {
      en: 'Your records are saved in this browser. Export them to keep a backup or move them to another device.',
      bn: 'আপনার হিসাব এই ব্রাউজারে থাকে। ব্যাকআপ বা অন্য যন্ত্রে নেওয়ার জন্য হিসাব নামান।',
    },
    mission: {
      en: 'RITU · Your growing season',
      bn: 'ঋতু · আপনার চাষের মৌসুম',
    },
  },
  {
    id: 'methods',
    scope: 'field',
    route: '/crops',
    target: '[data-tour="crop-tools"]',
    title: {
      en: 'Understand the crop screen',
      bn: 'ফসলের যাচাই বুঝুন',
    },
    description: {
      en: 'See the NASA climate data, crop requirements and regional calendar sources used for your planting options.',
      bn: 'ফসলের বিকল্পে ব্যবহৃত নাসার জলবায়ু, ফসলের চাহিদা ও আঞ্চলিক পঞ্জিকার উৎস দেখুন।',
    },
    mission: {
      en: 'RITU · Your growing season',
      bn: 'ঋতু · আপনার চাষের মৌসুম',
    },
  },
  {
    id: 'sources',
    scope: 'insights',
    route: '/sources',
    target: '.sources-page',
    title: {
      en: 'Check sources and limits',
      bn: 'উৎস ও সীমা দেখুন',
    },
    description: {
      en: 'Original datasets, time periods and methods are linked. Field measurements and locally reviewed protocols are still needed for precise water, nutrient and pest treatment decisions.',
      bn: 'মূল তথ্য, সময়কাল ও পদ্ধতির লিংক আছে। সঠিক সেচ, পুষ্টি ও বালাই চিকিৎসায় জমির মাপ ও যাচাইকৃত স্থানীয় নিয়ম দরকার।',
    },
    mission: {
      en: 'RITU · Your growing season',
      bn: 'ঋতু · আপনার চাষের মৌসুম',
    },
  },
];
export const stepsForTour = (scope: TourScope) =>
  scope === 'full'
    ? tourSteps.filter((s) => s.scope !== 'field' && s.scope !== 'insights')
    : tourSteps.filter((s) => s.scope === scope);

/** Page guides never move the farmer to another route or unlock a workflow step. */
export function stepsForPageTour(path: string): TourStep[] {
  const route =
    path === '/track' ? '/plan' : ['/insights', '/sample'].includes(path) ? '/sources' : path;
  return tourSteps
    .filter((step) => step.route === route || (route === '/farms' && step.id === 'welcome'))
    .map((step) => (step.route ? { ...step, route: path } : step));
}
