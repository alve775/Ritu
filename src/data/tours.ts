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
  farm: { en: 'Mission 1 · Know your farm', bn: 'কাজ ১ · খামারকে জানুন' },
  crops: { en: 'Mission 2 · Choose suggested crops', bn: 'কাজ ২ · প্রস্তাবিত ফসল বাছুন' },
  compare: { en: 'Mission 3 · Choose a calendar', bn: 'কাজ ৩ · ক্যালেন্ডার বাছুন' },
  field: { en: 'Explore the field', bn: 'জমি দেখুন' },
  insights: { en: 'Understand your choice', bn: 'সিদ্ধান্ত বুঝুন' },
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
    ['Your mission: plan, then keep track', 'আপনার কাজ: পরিকল্পনা ও কাজের হিসাব'],
    [
      'I’m Mati. We start with your farm, show matching mock crops, build a calendar with locked dates, and record progress. This tour uses a temporary example and never changes your farm or saved plan.',
      'আমি মাটি। আগে খামার, তারপর নমুনার ফসল, স্থির সময়ের ক্যালেন্ডার ও কাজের হিসাব। পরিচিতি সাময়িক নমুনা দেখায়; খামার বা রাখা পরিকল্পনা বদলায় না।',
    ],
  ),
  step(
    'basics',
    'farm',
    '/farm',
    '[data-tour="farm-basics"] .form-grid',
    ['Make this farm yours', 'নিজের খামারের তথ্য দিন'],
    [
      'Give your field a name and area. Area does not predict yield. Invalid entries keep the previous value and stop Continue until corrected.',
      'খামারের নাম ও আয়তন দিন। আয়তন ফলন বলে না। ভুল তথ্য ঠিক না হওয়া পর্যন্ত পরের ধাপে যাওয়া বন্ধ থাকে।',
    ],
  ),
  step(
    'water',
    'farm',
    '/farm',
    '.water-control',
    ['Tell Ritu about water access', 'সেচের সুযোগ জানান'],
    [
      'Choose reliable, limited, rainfed, severe shortage or Not sure. Unknown water is never silently assumed; suggestions wait for confirmation.',
      'নিয়মিত, সীমিত, বৃষ্টিনির্ভর, তীব্র সংকট বা জানা নেই বাছুন। অজানা পানি ধরে নেওয়া হয় না; নিশ্চিত না হওয়া পর্যন্ত প্রস্তাব আসে না।',
    ],
  ),
  step(
    'soil',
    'farm',
    '/farm',
    '.soil-fields',
    ['Record soil and drainage separately', 'মাটি ও নিষ্কাশন আলাদা দিন'],
    [
      'Soil texture and drainage are separate mock constraints. Not sure is allowed, but you must confirm them before crop suggestions are available.',
      'মাটির গঠন ও নিষ্কাশন আলাদা নমুনার শর্ত। জানা নেই বলা যায়; ফসলের প্রস্তাবের আগে নিশ্চিত করতে হবে।',
    ],
  ),
  step(
    'demo-location',
    'farm',
    '/farm',
    '.demo-controls',
    ['Choose a location and mock climate', 'স্থান ও নমুনার জলবায়ু বাছুন'],
    [
      'Choose an authored location and seasonal, drier or hotter fixture. All numbers and crop windows are fictional. No NASA API is called.',
      'হাতে তৈরি স্থান ও মৌসুমি, শুষ্ক বা উষ্ণ নমুনা বাছুন। সংখ্যা ও সময় কাল্পনিক। নাসার API নেই।',
    ],
  ),
  step(
    'priorities',
    'farm',
    '/farm',
    '.priority-control',
    ['Choose what matters most', 'অগ্রাধিকার বাছুন'],
    [
      'Priority ranks only already passing mock options. Water, diversity, familiarity, drought and pulse inclusion never override a failed check.',
      'শুধু মেলা নমুনার মধ্যে অগ্রাধিকার কাজ করে। পানি, বৈচিত্র্য, পরিচিতি, খরা ও ডাল কোনো ব্যর্থ শর্ত ঢাকে না।',
    ],
  ),
  step(
    'household',
    'farm',
    '/farm',
    '.household-control',
    ['Keep the food your family needs', 'পরিবারের দরকারি খাবার রাখুন'],
    [
      'Selected household groups must occur in the complete rotation. If your chosen crops cannot provide them, the builder refuses to make a conflicting plan.',
      'পরিবারের বাছা ফসল সম্পূর্ণ ক্রমে থাকতে হবে। বাছা ফসল তা না মেটালে সংঘাতের পরিকল্পনা হয় না।',
    ],
  ),
  step(
    'labor',
    'farm',
    '/farm',
    '.labor-control',
    ['Check when help is unavailable', 'কখন শ্রম নেই তা দিন'],
    [
      'Optional: mark months without planting or harvest help. Windows that start or finish in those months are excluded before you choose crops.',
      'ঐচ্ছিক: রোপণ বা কাটার শ্রম না থাকার মাস বাছুন। ওই মাসে শুরু বা শেষ হওয়া সময় ফসল বাছার আগেই বাদ যায়।',
    ],
  ),
  step(
    'history',
    'farm',
    '/farm',
    '[data-tour="farm-history"] section',
    ['Record previous crops', 'আগের ফসল লিখুন'],
    [
      'Previous crop names inform familiarity. This is history, not a date editor; it cannot create overlapping future periods.',
      'আগের ফসল পরিচিতির তথ্য দেয়। এটি ইতিহাস; সময়ের সম্পাদক নয়। ভবিষ্যতের সময় মেলাতে পারে না।',
    ],
  ),
  step(
    'farm-continue',
    'farm',
    '/farm',
    '[data-tour="farm-continue"]',
    ['Review, then continue', 'দেখে পরের ধাপে যান'],
    [
      'After this tour, See suggested crops confirms your inputs. Changing conditions requires another review; your tracking snapshot stays intact.',
      'পরিচিতির পরে প্রস্তাবিত ফসল দেখুন দিয়ে তথ্য নিশ্চিত করুন। শর্ত বদলালে আবার দেখতে হবে; রাখা কাজের তথ্য অক্ষত থাকে।',
    ],
  ),
  step(
    'suggestions',
    'crops',
    '/crops',
    '[data-tour="suggestion-summary"]',
    ['See only matching suggestions', 'শুধু মেলা প্রস্তাব দেখুন'],
    [
      'Only windows passing every mock soil, drainage, water, climate and help check appear. These are demo matches, not verified local advice.',
      'নমুনার মাটি, নিষ্কাশন, পানি, জলবায়ু ও শ্রমে মেলা সময়ই আসে। এগুলো যাচাইকৃত স্থানীয় পরামর্শ নয়।',
    ],
  ),
  step(
    'crop-choices',
    'crops',
    '/crops',
    '[data-tour="suggested-crops"]',
    ['Choose among the suggestions', 'প্রস্তাবের মধ্যে ফসল বাছুন'],
    [
      'After the tour, tick the crops you want to consider. Suggested dates are shown with each crop. You cannot enter arbitrary crops or dates.',
      'পরিচিতির পরে চান এমন ফসল বাছুন। প্রতিটির প্রস্তাবিত সময় দেখানো আছে। নিজের ইচ্ছামতো ফসল বা সময় বসানো যায় না।',
    ],
  ),
  step(
    'build-calendar',
    'crops',
    '/crops',
    '[data-tour="build-calendar"]',
    ['Let RITU assign the dates', 'ঋতুকে সময় ঠিক করতে দিন'],
    [
      'Choose a crop for each season. The builder searches passing windows and keeps only complete compatible rotations. No plan is forced when your choices cannot fit.',
      'প্রতি মৌসুমের ফসল বাছুন। ইঞ্জিন শুধু মেলা সময়ের সম্পূর্ণ ক্রম রাখে। না মিললে জোর করে পরিকল্পনা হয় না।',
    ],
  ),
  step(
    'catalogue',
    'crops',
    '/crops',
    '.catalogue-controls',
    ['Explore the reference library', 'ফসলের তথ্য দেখুন'],
    [
      'Search 42 crop identities and open their sources. The library is read-only; entries without mock windows cannot bypass suggestions.',
      '৪২টি ফসলের নাম ও উৎস দেখুন। তথ্যভান্ডার থেকে সময় বসানো যায় না; নিয়মহীন ফসল প্রস্তাবের বাইরে থাকে।',
    ],
  ),
  step(
    'calendars',
    'compare',
    '/plan',
    '.calendar-board .calendar-scroll',
    ['Compare the same twelve months', 'একই বারো মাস তুলনা করুন'],
    [
      'Follow crop names across months. Dates are locked and non-overlapping; idle intervals are marked rest. Use the guide arrows to pan the whole calendar.',
      'মাস ধরে ফসল দেখুন। সময় স্থির ও আলাদা; খালি সময় বিরতি। তীর দিয়ে পুরো ক্যালেন্ডার দেখুন।',
    ],
  ),
  step(
    'selection',
    'compare',
    '/plan',
    '.choice-summary',
    ['Choose an explained plan', 'ব্যাখ্যাসহ পরিকল্পনা বাছুন'],
    [
      'Review alternatives and open Understand this choice. A selected demo match remains a fictional model, not a verified farming recommendation.',
      'বিকল্প ও পছন্দের ব্যাখ্যা দেখুন। মেলা নমুনা বাস্তব চাষের যাচাইকৃত সুপারিশ নয়।',
    ],
  ),
  step(
    'demo-scenario',
    'compare',
    '/plan',
    '#scenario-simulator > section',
    ['Try a scenario before applying it', 'প্রয়োগের আগে পরিস্থিতি দেখুন'],
    [
      'Draft changes recalculate passing calendars. Reset leaves your farm unchanged. Apply is disabled if the scenario has no compatible plan.',
      'খসড়ায় মেলা ক্রমের হিসাব বদলায়। রিসেট খামার বদলায় না। কোনো মেলা ক্রম না থাকলে প্রয়োগ বন্ধ।',
    ],
  ),
  step(
    'save-calendar',
    'compare',
    '/plan',
    '[data-tour="save-calendar"]',
    ['Save a cycle for tracking', 'কাজের হিসাবের জন্য চক্র রাখুন'],
    [
      'Choose a year label, then save the selected calendar. Replacing a saved cycle asks before clearing its existing progress and notes.',
      'বছরের নাম দিয়ে বাছা ক্রম রাখুন। আগের কাজ ও নোট মুছতে বদলানোর আগে জিজ্ঞেস করা হয়।',
    ],
  ),
  step(
    'field-months',
    'field',
    '/plan',
    '[data-tour="field-months"]',
    ['Inspect one rotation and month', 'একটি ক্রম ও মাস দেখুন'],
    [
      'The field follows the assigned calendar. Choose a month to inspect its planned crop, rest or activity; this does not change dates.',
      'জমির দৃশ্য নির্ধারিত ক্যালেন্ডার মেনে চলে। মাস বাছলে ফসল বা বিরতি দেখা যায়; সময় বদলায় না।',
    ],
  ),
  step(
    'field-crop-study',
    'field',
    '/plan',
    '.crop-study-selector',
    ['Study a crop independently', 'আলাদাভাবে ফসলের গঠন দেখুন'],
    [
      'The crop-study selector opens the five supported schematic entries even during rest. It never edits the calendar.',
      'বিরতির সময়ও পাঁচটি সমর্থিত ফসলের নমুনা দেখা যায়। ক্যালেন্ডার বদলায় না।',
    ],
  ),
  step(
    'field-controls',
    'field',
    '/plan',
    '.field-viewport',
    ['Explore without losing your place', 'সহজে জমি ঘুরে দেখুন'],
    [
      'Rotate, zoom, view from above or reset. Drag is optional. These source-informed structures are not measured growth or surveyed field geometry.',
      'ঘোরান, কাছে দেখুন, ওপর থেকে দেখুন বা রিসেট করুন। এগুলো মাপা বৃদ্ধি বা বাস্তব জমির জ্যামিতি নয়।',
    ],
  ),
  step(
    'field-layers',
    'field',
    '/plan',
    '.field-study-controls',
    ['Read the model, not just the picture', 'দেখার অর্থ বুঝুন'],
    [
      'Close-up and cutaway explain plant anatomy. Young/mature structure is manual and independent of the month; source notes state its limits.',
      'কাছের দৃশ্য ও মাটির ভেতর গঠন বোঝায়। ছোট/পূর্ণ গাছ মাসের বৃদ্ধি নয়; উৎসে সীমা আছে।',
    ],
  ),
  step(
    'checks',
    'insights',
    '/insights',
    '.demo-reasons',
    ['Read each mock rule and reason', 'নমুনার প্রতিটি নিয়ম পড়ুন'],
    [
      'Expand the mock checks. The separate real-world checks still say Not assessed because NASA observations and validated rules are not integrated.',
      'নমুনার শর্ত খুলুন। বাস্তব তথ্য ও যাচাইকৃত নিয়ম না থাকায় বাস্তব শর্তের যাচাই বাকি থাকে।',
    ],
  ),
  step(
    'evidence',
    'insights',
    '/insights',
    '.missing-card',
    ['See what still needs evidence', 'কোন প্রমাণ বাকি দেখুন'],
    [
      'Review source links and missing observations. Fictional climate and windows must later be replaced with reviewed data and regional crop knowledge.',
      'উৎস ও বাকি তথ্য দেখুন। পরে কাল্পনিক জলবায়ু ও সময় যাচাইকৃত তথ্য দিয়ে বদলাতে হবে।',
    ],
  ),
  step(
    'tracking-calendar',
    'track',
    '/track',
    '[data-tour="tracking-calendar"]',
    ['Keep your saved calendar', 'রাখা ক্যালেন্ডার দেখুন'],
    [
      'Tracking uses a saved snapshot, so later farm edits cannot silently change its dates or erase your recorded tasks.',
      'হিসাব রাখা ক্রমের অনুলিপি মেনে চলে। খামার বদলালে সময় বা কাজের তথ্য নিজে থেকে বদলায় না।',
    ],
  ),
  step(
    'tracking-progress',
    'track',
    '/track',
    '[data-tour="tracking-progress"]',
    ['Track recorded progress', 'কাজের অগ্রগতি দেখুন'],
    [
      'Progress counts only tasks you explicitly mark. No planting or harvest is inferred from the date or the 3D model.',
      'শুধু নিজের চিহ্নিত কাজ গোনা হয়। তারিখ বা থ্রিডি দেখে কাজ ধরে নেওয়া হয় না।',
    ],
  ),
  step(
    'tracking-crops',
    'track',
    '/track',
    '[data-tour="tracking-crops"]',
    ['Record planting, harvest and notes', 'রোপণ, কাটা ও নোট লিখুন'],
    [
      'Mark planting before harvest. To undo planting, undo harvest first. Notes and tasks are saved on this device; no server receives them.',
      'কাটার আগে রোপণ চিহ্নিত করুন। রোপণ সরানোর আগে কাটা সরান। নোট ও কাজ এই ডিভাইসে থাকে; সার্ভারে যায় না।',
    ],
  ),
  step(
    'comfort',
    'track',
    '/track',
    '.reading-launch',
    ['Choose your reading and farm sounds', 'লেখা ও খামারের শব্দ বাছুন'],
    [
      'After the tour, adjust text size, motion, morning/evening ambience and volume. Sounds start only after Play, and you can mute all sounds.',
      'পরিচিতির পরে লেখা, অ্যানিমেশন, সকাল/সন্ধ্যার শব্দ ও মাত্রা বাছুন। চালান বাছলেই শব্দ শুরু; সব বন্ধ করা যায়।',
    ],
  ),
];
export function stepsForTour(scope: TourScope): TourStep[] {
  return scope === 'full' ? tourSteps : tourSteps.filter((step) => step.scope === scope);
}
