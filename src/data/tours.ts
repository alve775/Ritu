import type { Localized } from '../domain/types';

export type TourScope = 'full' | 'farm' | 'compare' | 'field' | 'insights';
export interface TourStep {
  id: string;
  scope: Exclude<TourScope, 'full'> | 'welcome';
  route: string | null;
  target?: string;
  title: Localized;
  description: Localized;
  mission: Localized;
}
const step = (
  id: string,
  scope: TourStep['scope'],
  route: string | null,
  target: string | undefined,
  title: Localized,
  description: Localized,
  mission: Localized,
): TourStep => ({ id, scope, route, target, title, description, mission });
const farm = { en: 'Mission 1 · Know your farm', bn: 'কাজ ১ · খামারকে জানুন' };
const compare = { en: 'Mission 2 · Compare your options', bn: 'কাজ ২ · বিকল্প তুলনা করুন' };
const field = { en: 'Mission 3 · Explore the field', bn: 'কাজ ৩ · জমি দেখুন' };
const insights = { en: 'Mission 4 · Understand your choice', bn: 'কাজ ৪ · সিদ্ধান্ত বুঝুন' };

export const tourSteps: TourStep[] = [
  step(
    'welcome',
    'welcome',
    null,
    undefined,
    { en: 'Your mission: build a seasonal plan', bn: 'আপনার কাজ: মৌসুমি পরিকল্পনা তৈরি' },
    {
      en: 'I’m Mati, your farm guide. We’ll explore your farm, compare examples and read the reasons. Use the section arrows to look around; close the tour whenever you want to edit.',
      bn: 'আমি মাটি, আপনার খামারের সঙ্গী। খামার, নমুনা ও কারণ দেখাব। তীর দিয়ে অংশগুলো দেখুন; তথ্য বদলাতে পরিচিতি বন্ধ করুন।',
    },
    { en: 'Welcome to Ritu', bn: 'ঋতুতে স্বাগতম' },
  ),
  step(
    'basics',
    'farm',
    '/farm',
    '[data-tour="farm-basics"] .form-grid',
    { en: 'Make this farm yours', bn: 'নিজের খামারের তথ্য দিন' },
    {
      en: 'Enter your farm name and area in hectares. The Rajshahi sample is fictional; area does not predict yield.',
      bn: 'খামারের নাম ও হেক্টরে আয়তন দিন। রাজশাহীর নমুনাটি কাল্পনিক; আয়তন থেকে ফলন বলা হয় না।',
    },
    farm,
  ),
  step(
    'water',
    'farm',
    '/farm',
    '.water-control',
    { en: 'Tell Ritu about water access', bn: 'সেচের সুযোগ জানান' },
    {
      en: 'Record your water access, or choose Not sure. Crop water needs are not verified, so this preview cannot assess irrigation suitability.',
      bn: 'সেচের সুযোগ দিন, অথবা জানা নেই বাছুন। ফসলের পানির চাহিদা যাচাই হয়নি, তাই সেচের উপযোগিতা এখনো বলা যায় না।',
    },
    farm,
  ),
  step(
    'soil',
    'farm',
    '/farm',
    '.soil-fields',
    { en: 'Record soil and drainage separately', bn: 'মাটি ও নিষ্কাশন আলাদা দিন' },
    {
      en: 'Record soil texture and whether water drains away. Choose Not sure if needed; crop suitability still needs local evidence.',
      bn: 'মাটির গঠন ও পানি নেমে যায় কি না জানান। প্রয়োজনে জানা নেই বাছুন; ফসলের উপযোগিতা জানতে স্থানীয় প্রমাণ দরকার।',
    },
    farm,
  ),
  step(
    'household',
    'farm',
    '/farm',
    '.household-control',
    { en: 'Keep the food your family needs', bn: 'পরিবারের দরকারি খাবার রাখুন' },
    {
      en: 'Choose crop groups your family needs in the sequence. A missing required crop creates an entry conflict; food quantities are not estimated.',
      bn: 'পরিবারের দরকারি ফসল বাছুন। প্রয়োজনীয় ফসল না থাকলে সংঘাত দেখাবে; খাবারের পরিমাণ হিসাব হয় না।',
    },
    farm,
  ),
  step(
    'labor',
    'farm',
    '/farm',
    '.labor-control',
    { en: 'Check when help is unavailable', bn: 'কখন শ্রম নেই তা দিন' },
    {
      en: 'Mark months when planting or harvest help is unavailable. The preview compares these with each crop’s first and last sample month.',
      bn: 'রোপণ বা কাটার শ্রম নেই এমন মাস বাছুন। নমুনায় প্রতিটি ফসলের শুরুর ও শেষের মাসের সঙ্গে মিলিয়ে দেখা হয়।',
    },
    farm,
  ),
  step(
    'sequence',
    'farm',
    '/farm',
    '.current-calendar .card-title',
    { en: 'Set your starting rotation', bn: 'বর্তমান ফসলক্রম ঠিক করুন' },
    {
      en: 'Use Edit sequence to change crops, rest periods and months. March–February repeats each year; overlaps are conflicts and empty months remain unknown.',
      bn: 'ক্রম বদলান দিয়ে ফসল, বিরতি ও মাস বদলান। মার্চ–ফেব্রুয়ারি প্রতি বছর ফিরে আসে; একই সময়ে দুটি ফসল হলে সংঘাত, ফাঁকা মাস অজানা।',
    },
    farm,
  ),
  step(
    'calendars',
    'compare',
    '/',
    '.calendar-board .calendar-scroll',
    { en: 'Compare the same twelve months', bn: 'একই বারো মাস তুলনা করুন' },
    {
      en: 'Follow the crop names across the months. Use this guide’s arrows to see the whole calendar. After the tour, All options shows three examples and each crop opens its details.',
      bn: 'মাস ধরে ফসলের নাম দেখুন। পরিচিতির তীর দিয়ে পুরো ক্যালেন্ডার দেখুন। পরিচিতির পরে সব বিকল্পে তিনটি নমুনা ও ফসল ছুঁয়ে তথ্য পাবেন।',
    },
    compare,
  ),
  step(
    'priorities',
    'compare',
    '/',
    '.priority-control',
    { en: 'Choose what matters most', bn: 'অগ্রাধিকার বাছুন' },
    {
      en: 'Save your priority for future reviewed comparisons. This preview does not recommend an option or estimate water savings.',
      bn: 'ভবিষ্যতের যাচাইকৃত তুলনার জন্য অগ্রাধিকার রাখুন। এই নমুনা কোনো বিকল্পের পরামর্শ বা পানি সাশ্রয়ের হিসাব দেয় না।',
    },
    compare,
  ),
  step(
    'selection',
    'compare',
    '/',
    '.choice-panel',
    { en: 'Your selection is not a recommendation', bn: 'আপনার পছন্দ যাচাইকৃত পরামর্শ নয়' },
    {
      en: 'Your selection is saved here. Open Understand this choice to review conflicts and missing evidence; selection does not establish suitability.',
      bn: 'আপনার পছন্দ এখানে রাখা হয়। সংঘাত ও বাকি প্রমাণ জানতে ব্যাখ্যা খুলুন; বাছলেই ফসল উপযোগী হয় না।',
    },
    compare,
  ),
  step(
    'field-months',
    'field',
    '/',
    '.explorer-selection',
    { en: 'Inspect one rotation and month', bn: 'একটি ক্রম ও মাস দেখুন' },
    {
      en: 'Choose a rotation and month. The calendar and field share that month; sample planting, harvest and rest appear beside the scene.',
      bn: 'ফসলক্রম ও মাস বাছুন। ক্যালেন্ডার ও জমিতে একই মাস দেখা যায়; রোপণ, কাটা ও বিরতি দৃশ্যের পাশে থাকে।',
    },
    field,
  ),
  step(
    'field-controls',
    'field',
    '/',
    '.field-viewport',
    { en: 'Explore without losing your place', bn: 'সহজে জমি ঘুরে দেখুন' },
    {
      en: 'Rotate, zoom, view from above or reset. Drag rotation is optional; Inspect this month opens the same crop details without using 3D.',
      bn: 'ঘোরান, কাছে যান, ওপর থেকে দেখুন বা রিসেট করুন। টেনে ঘোরানো ঐচ্ছিক; এই মাসের তথ্য দিয়ে ৩ডি ছাড়াও একই তথ্য পাবেন।',
    },
    field,
  ),
  step(
    'field-layers',
    'field',
    '/',
    '.field-study-controls',
    { en: 'Read the model, not just the picture', bn: 'দৃশ্যের অর্থ বুঝুন' },
    {
      en: 'Open a crop close-up or soil cutaway to explore plant structures. These are schematic examples; source notes explain their limits.',
      bn: 'ফসলের গঠন দেখতে কাছে যান বা মাটির ভেতর দেখুন। এগুলো প্রতীকী নমুনা; উৎসের তথ্যে সীমা জানানো আছে।',
    },
    field,
  ),
  step(
    'checks',
    'insights',
    '/insights',
    '.checks-card:not(.missing-card)',
    { en: 'Read each check and its reason', bn: 'প্রতিটি শর্ত ও কারণ পড়ুন' },
    {
      en: 'Open a check to read its reason. Calendar and household entries can be checked; water, drainage and soil suitability are not assessed.',
      bn: 'কারণ জানতে একটি শর্ত খুলুন। ক্যালেন্ডার ও পরিবারের তথ্য দেখা যায়; সেচ, নিষ্কাশন ও মাটির উপযোগিতা যাচাই বাকি।',
    },
    insights,
  ),
  step(
    'tradeoffs',
    'insights',
    '/insights',
    '.tradeoffs-card',
    { en: 'Understand the tradeoffs', bn: 'সুবিধা ও সীমা বুঝুন' },
    {
      en: 'See which crop families appear in the example. Family counts do not establish soil improvement, water savings, income or yield.',
      bn: 'নমুনায় কোন ফসলের পরিবার আছে দেখুন। পরিবারের সংখ্যা দিয়ে মাটির উন্নতি, পানি সাশ্রয়, আয় বা ফলন বলা যায় না।',
    },
    insights,
  ),
  step(
    'evidence',
    'insights',
    '/insights',
    '.missing-card',
    { en: 'See what still needs evidence', bn: 'কোন তথ্য এখনো বাকি দেখুন' },
    {
      en: 'Rainfall, heat exposure and local suitability are not assessed. Review the source links; actual NASA data and local validation still need to be added.',
      bn: 'বৃষ্টি, তাপের প্রভাব ও স্থানীয় উপযোগিতা যাচাই বাকি। উৎস দেখুন; নাসার প্রকৃত তথ্য ও স্থানীয় যাচাই এখনো যোগ করতে হবে।',
    },
    insights,
  ),
  step(
    'next',
    'insights',
    '/insights',
    '.next-step-card',
    { en: 'Know your next action', bn: 'পরের কাজ জানুন' },
    {
      en: 'Review your entries, then discuss the example with a local agricultural adviser. Keeping a preview choice does not certify a crop plan.',
      bn: 'খামারের তথ্য দেখুন, তারপর স্থানীয় কৃষি পরামর্শকের সঙ্গে নমুনা নিয়ে কথা বলুন। পছন্দ রাখলেই পরিকল্পনা অনুমোদিত হয় না।',
    },
    insights,
  ),
  step(
    'save',
    'insights',
    '/insights',
    '.footer',
    { en: 'Keep your plan and return any time', bn: 'পরিকল্পনা রেখে আবার আসুন' },
    {
      en: 'Inputs stay in this browser; storage problems appear here. Reset asks for confirmation, and Take a tour at the top replays any section.',
      bn: 'তথ্য এই ব্রাউজারে থাকে; সংরক্ষণে সমস্যা এখানে জানায়। রিসেটের আগে নিশ্চিত করে। ওপরে পরিচিতি দেখুন দিয়ে যেকোনো অংশ আবার দেখুন।',
    },
    insights,
  ),
];
tourSteps.splice(
  10,
  0,
  step(
    'catalogue',
    'compare',
    '/',
    '.crop-catalogue .catalogue-controls',
    { en: 'Find crops without guessed dates', bn: 'অনুমান করা সময় ছাড়া ফসল খুঁজুন' },
    {
      en: 'Search in English or Bangla and filter by crop group. Open a crop for its reference; add it only with dates you choose yourself.',
      bn: 'বাংলা বা ইংরেজিতে খুঁজুন ও ধরন বাছুন। ফসল খুলে উৎস দেখুন; নিজের বাছা সময় দিয়েই যোগ করুন।',
    },
    compare,
  ),
);
tourSteps.push(
  step(
    'comfort',
    'insights',
    '/insights',
    '.reading-launch',
    { en: 'Choose your reading and farm sounds', bn: 'লেখা ও খামারের শব্দ বাছুন' },
    {
      en: 'After the tour, open Reading & sound for text size, motion, morning or evening ambience, volume and mute. Sounds start only when you choose Play.',
      bn: 'পরিচিতির পরে পড়া ও শব্দ খুলে লেখার আকার, অ্যানিমেশন, সকাল বা সন্ধ্যার শব্দ, মাত্রা ও বন্ধ করা বাছুন। চালান বাছলেই শব্দ শুরু হয়।',
    },
    insights,
  ),
);

export function stepsForTour(scope: TourScope): TourStep[] {
  return scope === 'full' ? tourSteps : tourSteps.filter((step) => step.scope === scope);
}
