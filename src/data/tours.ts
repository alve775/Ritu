import type { Localized } from '../domain/types';
import { canonicalTourPage } from '../lib/page-tours';

export type TourScope = 'full' | 'farm' | 'crops' | 'compare' | 'field' | 'insights' | 'track';

export interface TourStep {
  id: string;
  route: string;
  target?: string;
  title: Localized;
  description: Localized;
}

export const tourMission: Localized = {
  en: 'RITU · Your growing season',
  bn: 'ঋতু · আপনার চাষের মৌসুম',
};

function step(
  id: string,
  route: string,
  anchor: string | null,
  title: Localized,
  description: Localized,
): TourStep {
  return { id, route, target: anchor ? `[data-tour="${anchor}"]` : undefined, title, description };
}

export const tourSteps: TourStep[] = [
  step(
    'welcome',
    '/farms',
    null,
    { en: 'Meet Mati, your farm guide', bn: 'আপনার কৃষি সহায়ক মাটির পরিচয়' },
    {
      en: 'Start by adding land and its plots. Use Dashboard to manage them, Crop calendar to follow crop work, and Your diary for notes and reminders.',
      bn: 'প্রথমে জমি ও তার প্লট যোগ করুন। জমি ও প্লটের জন্য ড্যাশবোর্ড খুলুন। ফসলের কাজ দেখতে ফসলের ক্যালেন্ডার খুলুন। নোট ও রিমাইন্ডারের জন্য আপনার ডায়েরি খুলুন।',
    },
  ),
  step(
    'manage-land',
    '/farms',
    'dashboard-add-land',
    { en: 'Add or manage land', bn: 'জমি যোগ করুন বা তথ্য বদলান' },
    {
      en: 'Select Add land to start. On a land card, use Edit land to change its details or Remove land to stop using it or delete it.',
      bn: 'শুরু করতে জমি যোগ করুন চাপুন। জমির তথ্য পাল্টাতে জমির তথ্য বদলান চাপুন। জমি ব্যবহার বন্ধ করতে বা মুছে ফেলতে জমি সরান চাপুন।',
    },
  ),
  step(
    'plot-cards',
    '/farms',
    'dashboard-plots',
    { en: 'Find a plot’s plan', bn: 'প্লটের পরিকল্পনা দেখুন' },
    {
      en: 'Add a plot if there’s room. See last year’s crops and what’s marked Done, Now or Next. Use Open plot, or Choose crops if no crop is chosen yet. For a saved year plan, use Change plan or Edit or remove plot. Select Calendar beside a crop when it’s shown.',
      bn: 'জায়গা থাকলে প্লট যোগ করুন। গত বছরের ফসল দেখুন। কোন ফসল শেষ, এখন কোনটি আর এরপর কোনটি দেখুন। প্লট খুলুন চাপুন, অথবা ফসল না বাছা থাকলে ফসল বাছুন চাপুন। বছরের পরিকল্পনা থাকলে পরিকল্পনা বদলান বা প্লট বদলান বা সরান ব্যবহার করুন। ফসলের পাশে ক্যালেন্ডার দেখালে সেটি চাপুন।',
    },
  ),
  step(
    'export',
    '/farms',
    'farm-export',
    { en: 'Keep a copy of your records', bn: 'হিসাবের কপি রাখুন' },
    {
      en: 'Download a copy of your lands, plots, crop records and diary from this browser.',
      bn: 'এই ব্রাউজারে রাখা জমি, প্লট, ফসলের হিসাব ও ডায়েরির কপি নামিয়ে রাখুন।',
    },
  ),
  step(
    'location',
    '/farm',
    'farm-location',
    { en: 'Pin your land', bn: 'জমিতে পিন দিন' },
    {
      en: 'Search for a place or enter coordinates. Put the pin on your land. Ritu loads the forecast, usual weather and soil information for this area.',
      bn: 'জায়গা খুঁজুন বা স্থানাঙ্ক লিখুন। পিনটি জমির ওপর রাখুন। ঋতু এই এলাকার আবহাওয়ার পূর্বাভাস ও মাটির তথ্য আনে। এখানে সাধারণত কেমন আবহাওয়া থাকে তাও দেখায়।',
    },
  ),
  step(
    'basics',
    '/farm',
    'farm-basics',
    { en: 'Name your land', bn: 'জমির নাম দিন' },
    {
      en: 'Give the land a name you recognise. Enter its size in the unit you use.',
      bn: 'সহজে চেনা যায় এমন নাম দিন। যে একক ব্যবহার করেন তাতে আয়তন লিখুন।',
    },
  ),
  step(
    'soil',
    '/farm',
    'farm-soil',
    { en: 'Check soil and drainage', bn: 'মাটি ও নিষ্কাশন দেখুন' },
    {
      en: 'Ritu can fill in the soil type from a soil map. Check it and choose how well water drains. Choose Not sure if you don’t know.',
      bn: 'ঋতু মাটির মানচিত্র থেকে মাটির ধরন বসিয়ে দিতে পারে। মিলিয়ে দেখুন ও পানি কতটা সরে যায় তা বাছুন। জানা না থাকলে জানা নেই বাছুন।',
    },
  ),
  step(
    'water',
    '/farm',
    'farm-water',
    { en: 'Choose water and save', bn: 'পানির ব্যবস্থা বেছে জমি সংরক্ষণ করুন' },
    {
      en: 'Choose the water supply you can use. Select Save land to finish.',
      bn: 'যে পানির ব্যবস্থা আছে তা বাছুন। শেষে জমি সংরক্ষণ করুন চাপুন।',
    },
  ),
  step(
    'plot-basics',
    '/plot',
    'plot-basics',
    { en: 'Set up this plot', bn: 'প্লটের তথ্য দিন' },
    {
      en: 'Give the plot a name. Enter its size and choose when it will be ready to plant.',
      bn: 'প্লটের নাম ও আয়তন দিন। কবে থেকে রোপণ করতে পারবেন তা বাছুন।',
    },
  ),
  step(
    'plot-differences',
    '/plot',
    'plot-differences',
    { en: 'Set this plot’s water and drainage', bn: 'প্লটের পানি ও নিষ্কাশন ঠিক করুন' },
    {
      en: 'Open this section if the plot has a different water supply or drainage. Choose what applies to this plot.',
      bn: 'প্লটে পানির ব্যবস্থা বা নিষ্কাশন আলাদা হলে এই অংশ খুলুন। প্লটের জন্য যা মেলে তা বাছুন।',
    },
  ),
  step(
    'last-year',
    '/plot',
    'plot-suggest',
    { en: 'Enter last year’s crops', bn: 'গত বছরের ফসল দিন' },
    {
      en: 'Select Show suggested plans and answer for each season. Choose Left empty or Not sure when needed.',
      bn: 'পরামর্শ দেখুন চাপুন ও প্রতি মৌসুমের জন্য উত্তর দিন। দরকার হলে খালি ছিল বা নিশ্চিত নই বাছুন।',
    },
  ),
  step(
    'compare-plans',
    '/crops',
    'year-plan',
    { en: 'Compare year plans', bn: 'বছরের পরিকল্পনাগুলো মিলিয়ে দেখুন' },
    {
      en: 'Look at the crop order. Compare the four bars for Water needed, Heat risk, Soil trouble and Wears out the soil.',
      bn: 'ফসলগুলোর ক্রম দেখুন। চারটি দাগে পানি কত লাগবে, গরমের ঝুঁকি, মাটির সমস্যা আর জমির উর্বরতা কমার ভয় তুলনা করুন।',
    },
  ),
  step(
    'plan-nasa',
    '/crops',
    'year-plan-nasa',
    { en: 'Check for dry weeks', bn: 'শুকনো সপ্তাহের খবর দেখুন' },
    {
      en: 'The notes can show how often dry spells came around flowering in this area. They can also suggest watering once before sowing.',
      bn: 'নোটে দেখা যেতে পারে এই এলাকায় ফুল আসার সময় কতবার টানা শুকনো দিন পড়েছে। বোনার আগে একবার সেচ দেওয়ার পরামর্শও থাকতে পারে।',
    },
  ),
  step(
    'choose-plan',
    '/crops',
    'year-plan-choose',
    { en: 'Choose a plan', bn: 'একটি পরিকল্পনা বাছুন' },
    {
      en: 'Select Choose this plan and confirm. Ritu opens the plot’s calendar.',
      bn: 'এই পরিকল্পনা নিন চাপুন ও নিশ্চিত করুন। ঋতু প্লটের ক্যালেন্ডার খুলবে।',
    },
  ),
  step(
    'make-plan',
    '/crops',
    'year-plan-custom',
    { en: 'Make your own plan', bn: 'নিজের পরিকল্পনা করুন' },
    {
      en: 'Select Choose crops myself to decide what to grow each season. You can leave a season empty.',
      bn: 'নিজে ফসল বাছুন চাপুন ও ঠিক করুন কোন মৌসুমে কী চাষ করবেন। চাইলে কোনো মৌসুম খালি রাখুন।',
    },
  ),
  step(
    'build-plan',
    '/crops',
    'year-plan-builder',
    { en: 'Choose crops by season', bn: 'মৌসুম ধরে ফসল বাছুন' },
    {
      en: 'Pick one crop for each season you want to plant. Use Leave empty for any season you want to skip.',
      bn: 'যে মৌসুমে চাষ করবেন, তার জন্য একটি ফসল বাছুন। যে মৌসুমে চাষ করবেন না, সেখানে খালি রাখুন চাপুন।',
    },
  ),
  step(
    'saved-plan',
    '/crops',
    'year-plan-saved',
    { en: 'See your saved plan', bn: 'রাখা পরিকল্পনা দেখুন' },
    {
      en: 'Check the year’s crops. Use Change plan to see other choices.',
      bn: 'বছরের ফসলগুলো দেখুন। অন্য পরিকল্পনা দেখতে পরিকল্পনা বদলান চাপুন।',
    },
  ),
  step(
    'one-season-crop',
    '/crops',
    'one-season-search',
    { en: 'Choose a crop for one season', bn: 'এক মৌসুমের ফসল বাছুন' },
    {
      en: 'Search by crop name or browse the list. Whole-year plans are available in the Rajshahi pilot area.',
      bn: 'ফসলের নাম দিয়ে খুঁজুন বা তালিকা দেখুন। রাজশাহী অঞ্চলের নির্দিষ্ট এলাকায় পুরো বছরের পরিকল্পনা পাওয়া যায়।',
    },
  ),
  step(
    'year-wheel',
    '/plan',
    'year-at-a-glance',
    { en: 'See the whole year', bn: 'পুরো বছর এক নজরে দেখুন' },
    {
      en: 'The wheel shows the crops and when they grow. Use Change plan to see other plans. Use Switch plot at the top to open another plot.',
      bn: 'চাকায় দেখা যায় কোন ফসল কখন বাড়ে। অন্য পরিকল্পনা দেখতে পরিকল্পনা বদলান চাপুন। ওপরের অন্য প্লট খুলুন থেকে অন্য প্লট বাছুন।',
    },
  ),
  step(
    'today',
    '/plan',
    'year-today',
    { en: 'See what to do today', bn: 'আজ কী করবেন দেখুন' },
    {
      en: 'Check today’s weather and work. Use the buttons to record sowing, watering or harvest. A note may say this area is usually dry this week or suggest watering before sowing.',
      bn: 'আজকের আবহাওয়া আর কাজ দেখুন। বোনা, সেচ বা কাটার খবর রাখতে বোতাম চাপুন। নোটে দেখা যেতে পারে এই এলাকায় সপ্তাহটি সাধারণত শুকনো যায় কি না। বোনার আগে সেচ দেওয়ার পরামর্শও থাকতে পারে।',
    },
  ),
  step(
    'calendar-day',
    '/plan',
    'year-month',
    { en: 'Open a day', bn: 'একটি দিন খুলুন' },
    {
      en: 'Tap a date here or in the week strip to see weather, jobs and notes. When available, see how wet the soil near the roots usually is in this area and how often a dry spell covered that week.',
      bn: 'এখানে বা সপ্তাহের তালিকায় কোনো দিনে চাপ দিয়ে আবহাওয়া, কাজ আর নোট দেখুন। তথ্য থাকলে দেখবেন এই এলাকায় শিকড়ের কাছে মাটি সাধারণত কতটা ভেজা আর সপ্তাহটি কতবার টানা শুকনো সময়ের মধ্যে পড়েছে।',
    },
  ),
  step(
    'calendar-events',
    '/plan',
    'year-events',
    { en: 'See what’s coming', bn: 'সামনের কাজ দেখুন' },
    {
      en: 'See the next jobs and dates. Tap an event to open that day.',
      bn: 'সামনের কাজ আর তারিখ দেখুন। কোনো কাজে চাপ দিলে সেই দিন খুলবে।',
    },
  ),
  step(
    'calendar-details',
    '/plan',
    'year-weekly-details',
    { en: 'Check water and heat by week', bn: 'সপ্তাহ ধরে পানি ও গরম দেখুন' },
    {
      en: 'Open Details and choose a crop. See when this area is usually hot or rainy and when the crop may need watering.',
      bn: 'বিস্তারিত খুলে একটি ফসল বাছুন। এই এলাকায় কখন সাধারণত গরম পড়ে বা বৃষ্টি হয়, আর কখন ফসলে সেচ লাগতে পারে দেখুন।',
    },
  ),
  step(
    'calendar-fix',
    '/plan',
    'year-fix-dates',
    { en: 'Correct dates or record a loss', bn: 'তারিখ ঠিক করুন বা নষ্ট ফসলের খবর রাখুন' },
    {
      en: 'Use Fix it to correct a sowing or harvest date. On the Today card, you can cancel a crop you haven’t sown or mark a crop as lost.',
      bn: 'বোনা বা কাটার ভুল তারিখ বদলাতে ঠিক করুন অংশটি খুলুন। আজ কী করবেন অংশে না বোনা ফসল বাতিল করতে বা নষ্ট ফসলের খবর লিখতে পারবেন।',
    },
  ),
  step(
    'one-season-calendar',
    '/plan',
    'one-season-dates',
    { en: 'Follow this crop', bn: 'এই ফসলের কাজ দেখুন' },
    {
      en: 'Pick a date to see the work for that day. Record the days you planted and harvested.',
      bn: 'কোনো দিন বেছে তার কাজ দেখুন। রোপণ আর ফসল কাটার তারিখ লিখে রাখুন।',
    },
  ),
  step(
    'diary',
    '/notes',
    'diary-pickers',
    { en: 'Open a plot’s diary', bn: 'প্লটের ডায়েরি খুলুন' },
    {
      en: 'Choose a land and plot. Write a note, pick topics or add a photo.',
      bn: 'একটি জমি ও প্লট বাছুন। নোট লিখুন, বিষয় বাছুন বা ছবি যোগ করুন।',
    },
  ),
  step(
    'reminder',
    '/notes',
    'diary-reminders',
    { en: 'Set a reminder', bn: 'রিমাইন্ডার রাখুন' },
    {
      en: 'While writing a note, select Remind me. Choose a day and a preset time, or set your own with Other time. Saved reminders appear here.',
      bn: 'নোট লেখার সময় মনে করিয়ে দিন চাপুন। দিন বাছুন। দেওয়া সময়গুলোর একটি নিন বা অন্য সময় চাপুন। রাখা রিমাইন্ডার এখানে দেখবেন।',
    },
  ),
  step(
    'sources',
    '/sources',
    'sources-heading',
    { en: 'See where the information comes from', bn: 'তথ্য কোথা থেকে আসে দেখুন' },
    {
      en: 'Find the sources for weather, soil and crop information. The Rajshahi section explains how Ritu uses NASA rain and soil data for this area.',
      bn: 'আবহাওয়া, মাটি আর ফসলের তথ্য কোথা থেকে আসে দেখুন। রাজশাহীর অংশে আছে এই এলাকার বৃষ্টি আর মাটির জন্য নাসার তথ্য কীভাবে কাজে লাগে।',
    },
  ),
];

/** Page guides stay on the current route, including older URLs for the same page. */
export function stepsForPageTour(path: string): TourStep[] {
  return tourSteps.filter((step) => step.route === canonicalTourPage(path));
}

/** Older acceptance tests refer to guides by scope. */
export const stepsForTour = (scope: TourScope) =>
  scope === 'full' ? tourSteps : stepsForPageTour(`/${scope}`);
