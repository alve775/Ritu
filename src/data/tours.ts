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
      en: 'This dashboard keeps your farms together. Add a farm when you are ready. Each page has its own short guide, then you can explore before continuing. Tours do not change your records.',
      bn: 'এই ড্যাশবোর্ডে সব খামার একসঙ্গে থাকে। প্রস্তুত হলে খামার যোগ করুন। প্রতি পাতার আলাদা ছোট পরিচিতি শেষে নিজে দেখে পরের ধাপে যান। পরিচিতিতে হিসাব বদলায় না।',
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
    target: '.location-map-grid',
    title: {
      en: 'Find your field anywhere',
      bn: 'যেকোনো স্থানে জমি খুঁজুন',
    },
    description: {
      en: 'Search a town or enter coordinates, then pin your actual field. Weather and long-term climate load automatically for the selected point. The starting map is not a selected farm.',
      bn: 'স্থান বা স্থানাঙ্ক দিয়ে আসল জমিতে পিন দিন। বাছা স্থানের আবহাওয়া ও দীর্ঘ সময়ের জলবায়ু নিজে থেকে আসবে। শুরুর মানচিত্র বাছা জমি নয়।',
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
      en: 'Area and next season',
      bn: 'আয়তন ও পরের মৌসুম',
    },
    description: {
      en: 'Enter the measured area in your preferred unit and when you are ready to plant. A farm name is optional. You are planning one crop, not an annual rotation.',
      bn: 'পছন্দের এককে মাপা আয়তন ও রোপণে প্রস্তুত হওয়ার দিন দিন। নাম ঐচ্ছিক। একটি ফসলের পরিকল্পনা, বার্ষিক ফসলক্রম নয়।',
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
      en: 'Choose what you know; use Not sure when needed. Known incompatible source soil and drainage categories are filtered out. Climate cannot measure your field soil.',
      bn: 'যা জানেন বাছুন, প্রয়োজনে জানা নেই দিন। উৎসের সঙ্গে অমিল জানা মাটি ও নিষ্কাশনের ফসল বাদ যায়। জলবায়ু জমির মাটি মাপে না।',
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
      en: 'Choose water you can actually use. Crop suggestions explain rainfall-related checks, but annual rainfall cannot establish water stored in your root zone.',
      bn: 'বাস্তবে ব্যবহার করা পানি বাছুন। প্রস্তাবে বৃষ্টির যাচাই থাকে, কিন্তু বার্ষিক বৃষ্টি শিকড়ের মজুত পানি নয়।',
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
      en: 'This bar shows the one crop you choose below. Once selected, Create my farm opens a separate workspace without replacing your other farms. First confirm land details if suggestions are not yet available.',
      bn: 'নিচে বাছা একটি ফসল এই বারে থাকবে। বাছার পরে খামার তৈরির বোতামে আলাদা কাজের জায়গা খুলবে, অন্য খামার বদলাবে না। প্রস্তাব না এলে আগে জমির তথ্য নিশ্চিত করুন।',
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
      en: 'After confirming land details, see species screened against NASA climate and source requirements. Search by name, plant use or life cycle. Open the reasons and limits. Select one planting; perennials have a care review, not a predicted first harvest.',
      bn: 'জমি নিশ্চিত করলে নাসার জলবায়ু ও উৎসের চাহিদায় মেলা ফসল দেখুন। কারণ ও সীমা খুলে পড়ুন। এই মৌসুমে শুধু একটি ফসল বাছুন।',
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
      en: 'Your farm workspace',
      bn: 'খামারের কাজের জায়গা',
    },
    description: {
      en: 'Once a farm exists, its crop, planned start and growing-time reference appear here. The illustration is an overview, not a measurement of your crop.',
      bn: 'খামার তৈরি হলে ফসল, শুরুর পরিকল্পনা ও সময়ের তথ্য আসে। আঁকা জমি পরিচিতি, আসল ফসলের মাপ নয়।',
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
      en: 'Record actual planting, then use daily field updates to change the checks. Partial picking keeps the crop active; only final harvest completes a seasonal crop. Tick completed work. Forecasts refresh while the app is open; they do not operate irrigation hardware.',
      bn: 'আসল রোপণের পরে দিনের খবর দিলে যাচাই বদলায়। আংশিক তোলায় চাষ চলে; শেষ তোলায় মৌসুমি ফসলের চাষ শেষ হয়। করা কাজে টিক দিন। অ্যাপ খোলা থাকলে পূর্বাভাস বদলায়; সেচযন্ত্র চালায় না।',
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
      en: 'Manage more than one field',
      bn: 'একাধিক জমি পরিচালনা করুন',
    },
    description: {
      en: 'Add a farm for another plot or crop. Each keeps its own location, crop, dates and notes. Switch farms without replacing their records.',
      bn: 'অন্য জমি বা ফসলের জন্য খামার যোগ করুন। প্রতি খামারের স্থান, ফসল, দিন ও নোট আলাদা। অন্যটি খুললে হিসাব হারায় না।',
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
      en: 'Farms are saved on this browser, not synced to an account. Export all farm records for a backup. Previous rotation records remain accessible when present.',
      bn: 'খামার এই ব্রাউজারে থাকে, অ্যাকাউন্টে যায় না। ব্যাকআপে সব হিসাব নামান। আগের ফসলক্রমের হিসাব থাকলে খোলা যায়।',
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
      en: 'NASA 1991–2020 climate and ECOCROP requirements support a broad species screen. Historical regional calendars improve timing evidence where available. No yield or profit score is invented.',
      bn: 'নাসার ১৯৯১–২০২০ জলবায়ু ও ECOCROP দিয়ে প্রজাতির প্রাথমিক যাচাই হয়। আঞ্চলিক পুরোনো পঞ্জিকা থাকলে সময়ের তথ্য মেলে। ফলন বা লাভের নম্বর বানানো হয় না।',
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
