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
const missions = {
  welcome: { en: 'Welcome to RITU', bn: 'ঋতুতে স্বাগতম' },
  farm: { en: 'Mission 1 · Your farm', bn: 'কাজ ১ · আপনার জমি' },
  crops: { en: 'Mission 2 · Crop references', bn: 'কাজ ২ · ফসলের তথ্য' },
  compare: { en: 'Mission 3 · Compare calendars', bn: 'কাজ ৩ · ক্যালেন্ডার তুলনা' },
  field: { en: 'Practical crop tools', bn: 'ফসলের ব্যবহারিক সরঞ্জাম' },
  insights: { en: 'Sources & methods', bn: 'উৎস ও পদ্ধতি' },
  track: { en: 'Mission 4 · Keep track', bn: 'কাজ ৪ · কাজের হিসাব' },
};
const step = (
  id: string,
  scope: TourStep['scope'],
  route: string | null,
  target: string | undefined,
  title: [string, string],
  description: [string, string],
): TourStep => ({
  id,
  scope,
  route,
  target,
  title: { en: title[0], bn: title[1] },
  description: { en: description[0], bn: description[1] },
  mission: missions[scope],
});
export const tourSteps: TourStep[] = [
  step(
    'welcome',
    'welcome',
    null,
    undefined,
    ['Meet Mati, your farm guide', 'আপনার কৃষি সহায়ক মাটির সঙ্গে পরিচয়'],
    [
      'Start with your field, choose crops, compare calendars and track your work. This guide leaves your data unchanged. Complete each stage yourself before using the next.',
      'জমি দিয়ে শুরু করে ফসল বাছুন, ক্যালেন্ডার তুলনা করুন ও কাজের হিসাব রাখুন। পরিচিতি আপনার তথ্য বদলায় না। পরের ধাপ ব্যবহারের আগে নিজে আগের কাজ শেষ করুন।',
    ],
  ),
  step(
    'location',
    'farm',
    '/farm',
    '.location-map-grid',
    ['Find your actual field', 'নিজের আসল জমি খুঁজুন'],
    [
      'Search for your place, then move the pin onto your field. Current weather estimates and a seven-day forecast load automatically. Confirm your own pin; the starting map is not a selected farm.',
      'স্থান খুঁজে পিন নিজের জমিতে নিন। বর্তমান আবহাওয়ার অনুমান ও সাত দিনের পূর্বাভাস নিজে থেকে আসে। নিজের পিন নিশ্চিত করুন; শুরুর মানচিত্র বাছা জমি নয়।',
    ],
  ),
  step(
    'basics',
    'farm',
    '/farm',
    '[data-tour="farm-basics"]',
    ['Area, district and planning start', 'আয়তন, জেলা ও শুরুর দিন'],
    [
      'Enter the measured area, confirm your district and choose the planning start date. You can use hectares, shotok or square metres. Crop calendars currently cover four Rajshahi-region districts.',
      'মাপা আয়তন, জেলা ও শুরুর দিন দিন। হেক্টর, শতক বা বর্গমিটার ব্যবহার করতে পারেন। ফসলের পঞ্জিকা এখন রাজশাহী অঞ্চলের চার জেলায় সীমিত।',
    ],
  ),
  step(
    'soil',
    'farm',
    '/farm',
    '[data-tour="farm-soil"]',
    ['Soil and drainage are different', 'মাটি ও নিষ্কাশন আলাদা'],
    [
      'Choose what you know; use Not sure otherwise. Soil texture describes the soil, while drainage describes water collecting. Poor drainage blocks mung selection. These answers do not replace a soil test.',
      'যা জানেন বাছুন, না জানলে জানা নেই দিন। গঠন মাটির ধরন, নিষ্কাশন পানি জমে থাকা বোঝায়। দুর্বল নিষ্কাশনে মুগ বাছা যায় না। এটি মাটির পরীক্ষার বিকল্প নয়।',
    ],
  ),
  step(
    'water',
    'farm',
    '/farm',
    '[data-tour="farm-water"]',
    ['Record water access', 'সেচের সুযোগ লিখুন'],
    [
      'Choose the actual water supply. RITU records it without inventing a water-saving score or irrigation dose. Official rice irrigation guidance is linked here.',
      'আসল সেচের সুযোগ বাছুন। পানি সাশ্রয়ের নম্বর বা সেচের মাত্রা বানানো হয় না। ধানের সরকারি সেচ পরামর্শের লিংক আছে।',
    ],
  ),
  step(
    'history',
    'farm',
    '/farm',
    '[data-tour="farm-history"]',
    ['Crops you actually grew', 'বাস্তবে চাষ করা ফসল'],
    [
      'Previous crops are optional familiarity records. Add a crop or use its gray cross to remove it. No past planting dates are invented.',
      'আগের ফসল ঐচ্ছিক পরিচিতির তথ্য। যোগ করুন বা ধূসর ক্রসে বাদ দিন। আগের বোনার দিন বানানো হয় না।',
    ],
  ),
  step(
    'priorities',
    'farm',
    '/farm',
    '[data-tour="farm-priorities"]',
    ['Food, familiarity and available help', 'খাবার, পরিচিতি ও শ্রম'],
    [
      'Choose household crops and months without planting or harvest help. Family diversity, pulse presence and familiarity are literal counts; drought resilience and soil gains are not fabricated.',
      'পরিবারের ফসল ও রোপণ বা কাটার শ্রম না থাকার মাস বাছুন। পরিবার, ডাল ও পরিচিতি সংখ্যা মাত্র; খরা সহনশীলতা বা মাটির উন্নতি বানানো হয় না।',
    ],
  ),
  step(
    'unplanted',
    'crops',
    '/crops',
    '[data-tour="unplanted-seasons"]',
    ['A season can stay unplanted', 'মৌসুম খালি রাখা যায়'],
    [
      'Choose crops for each of the next three reference seasons, or explicitly leave a season unplanted. RITU never shortens a crop to make it fit. Complete farm setup first if prompted.',
      'পরের তিন মৌসুমের ফসল বাছুন বা নিজে মৌসুম খালি রাখুন। মেলাতে ফসলের সময় ছোট করা হয় না। প্রস্তুতির নির্দেশ দেখালে আগে জমির তথ্য শেষ করুন।',
    ],
  ),
  step(
    'crops',
    'crops',
    '/crops',
    '[data-tour="crop-suggestions"]',
    ['Every crop has an original source', 'প্রতি ফসলের মূল উৎস আছে'],
    [
      'Switch seasons and select crop alternatives. Open Why offered for the official calendar and field checks. Regional dates are references, not verified planting advice for your soil or variety.',
      'মৌসুম বদলে বিকল্প ফসল বাছুন। সরকারি পঞ্জিকা ও জমির শর্ত দেখতে কারণ, উৎস ও সময় খুলুন। আঞ্চলিক দিন আপনার মাটি বা জাতের যাচাইকৃত রোপণ-পরামর্শ নয়।',
    ],
  ),
  step(
    'crop-continue',
    'crops',
    '/crops',
    '[data-tour="crop-continue"]',
    ['Resolve conflicts openly', 'সময়ের সংঘাত বুঝে মেটান'],
    [
      'Compare calendars becomes available when dates do not overlap and your household and help requirements are met. If it is unavailable, read the specific issue shown here and adjust your choices.',
      'দিনের সংঘাত না থাকলে এবং পরিবার ও শ্রমের শর্ত মিললে ক্যালেন্ডার তুলনা খোলে। না খুললে এখানে দেখানো সমস্যাটি পড়ে পছন্দ বদলান।',
    ],
  ),
  step(
    'tools',
    'field',
    '/crops',
    '[data-tour="crop-tools"]',
    ['Calculate from published methods', 'প্রকাশিত পদ্ধতিতে হিসাব'],
    [
      'After farm setup, the mung tools use named-variety broadcast seed rates and a 50-seed germination test from CIMMYT/CSISA. Choose the variety and enter actual observations; no variety or test result is assumed.',
      'জমির তথ্য শেষে মুগের সরঞ্জামে সিমিট/সিএসআইএসএর নির্দিষ্ট জাতের বীজের হার ও ৫০ বীজের পরীক্ষা আছে। জাত ও আসল ফল নিজে দিন; কিছু ধরে নেওয়া হয় না।',
    ],
  ),
  step(
    'calendar',
    'compare',
    '/plan',
    '[data-tour="calendar-main"]',
    ['Compare complete sequences', 'সম্পূর্ণ ফসলক্রম তুলনা'],
    [
      'After selecting compatible crops, compare up to three calendars. The setup gate remains visible if inputs are missing. No example calendar is inserted just for the tour.',
      'মেলা ফসল বাছার পরে সর্বোচ্চ তিনটি ক্যালেন্ডার তুলনা করুন। তথ্য বাকি থাকলে প্রস্তুতির নির্দেশ থাকবে। পরিচিতির জন্য বানানো ক্যালেন্ডার বসানো হয় না।',
    ],
  ),
  step(
    'dates',
    'compare',
    '/plan',
    '[data-tour="calendar-dates"]',
    ['Read actual date intervals', 'তারিখের সময় দেখুন'],
    [
      'Read each crop’s dates and the gaps between crops. Full source durations are reserved, including rice nursery time. Confirm the actual variety, nursery and field dates before planting.',
      'ফসলের দিন ও মাঝের বিরতি দেখুন। ধানের বীজতলাসহ উৎসের পুরো সময় রাখা হয়। রোপণের আগে আসল জাত, বীজতলা ও জমির দিন নিশ্চিত করুন।',
    ],
  ),
  step(
    'nasa',
    'compare',
    '/plan',
    '[data-tour="nasa-seasonal"]',
    ['NASA history stays dated', 'নাসার ইতিহাসে তারিখ থাকে'],
    [
      'NASA POWER shows dated weather history for each crop’s reference interval. Missing records stay unavailable. This history is separate from the forecast and does not prescribe irrigation or prove crop suitability.',
      'নাসা পাওয়ার প্রতি ফসলের সময়ের তারিখসহ পুরোনো আবহাওয়া দেখায়। না পেলে তথ্য আসে না। ইতিহাস পূর্বাভাস থেকে আলাদা; সেচের মাত্রা বা ফসলের উপযোগিতা নিশ্চিত করে না।',
    ],
  ),
  step(
    'save',
    'compare',
    '/plan',
    '[data-tour="calendar-save"]',
    ['Save knowingly', 'বুঝে ক্যালেন্ডার রাখুন'],
    [
      'Read Why this calendar and acknowledge the regional timing limits before saving. Replacing an existing calendar requires confirmation and offers record export first.',
      'কেন এই ক্যালেন্ডার পড়ুন ও আঞ্চলিক সময়ের সীমা বুঝে রাখুন। আগের ক্যালেন্ডার বদলাতে নিশ্চিত করতে হয় ও আগে হিসাব ডাউনলোড করা যায়।',
    ],
  ),
  step(
    'weather',
    'track',
    '/track',
    '[data-tour="track-weather"]',
    ['Weather at the saved farm', 'রাখা জমির আবহাওয়া'],
    [
      'Check current weather estimates and the seven-day forecast at your saved farm. Next checks ask you to inspect your field; they do not diagnose pests or prescribe chemical or irrigation doses.',
      'রাখা জমির বর্তমান আবহাওয়ার অনুমান ও সাত দিনের পূর্বাভাস দেখুন। পরের কাজ জমি দেখে যাচাই করতে বলে; রোগ নির্ণয় বা রাসায়নিক ও সেচের মাত্রা দেয় না।',
    ],
  ),
  step(
    'tracking',
    'track',
    '/track',
    '[data-tour="track-records"]',
    ['Record what actually happened', 'আসল কাজের হিসাব লিখুন'],
    [
      'Record actual planting, harvest and notes after saving a calendar. Planned dates are not marked complete automatically. You can export your records, and farm edits do not silently overwrite them.',
      'ক্যালেন্ডার রাখার পরে আসল বোনা, কাটা ও নোট দিন। পরিকল্পিত দিন নিজে থেকে শেষ কাজ হয় না। হিসাব ডাউনলোড করতে পারবেন; জমির তথ্য বদলালে তা নিজে থেকে হারায় না।',
    ],
  ),
  step(
    'sources',
    'insights',
    '/sources',
    '.sources-page',
    ['Check every source and limit', 'উৎস ও সীমা যাচাই করুন'],
    [
      'NASA observations, weather forecasts, regional crop references and farmer observations are different kinds of evidence. Original links and methods are available here. Field effectiveness still requires agricultural review and farmer trials.',
      'নাসার ইতিহাস, পূর্বাভাস, আঞ্চলিক পঞ্জিকা ও কৃষকের পর্যবেক্ষণ আলাদা প্রমাণ। মূল লিংক ও পদ্ধতি এখানে আছে। কার্যকারিতা যাচাইয়ে কৃষি বিশেষজ্ঞ ও জমির পরীক্ষা দরকার।',
    ],
  ),
];
// Optional inputs and specialist explanations remain in their section guides.
// The overview teaches the main task without visiting those optional detours.
const sectionOnly = new Set(['history', 'priorities', 'tools', 'sources']);
export const stepsForTour = (scope: TourScope) =>
  scope === 'full'
    ? tourSteps.filter((s) => !sectionOnly.has(s.id))
    : tourSteps.filter((s) => s.scope === scope);
