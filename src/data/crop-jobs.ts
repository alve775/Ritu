import type { RotationCropId } from './rotation-crops';

export type CropJobKind = 'fertiliser' | 'care' | 'key-stage';
export interface CropJob {
  /** Days after sowing (or transplanting for rice). */
  day: number;
  kind: CropJobKind;
  en: string;
  bn: string;
}

/**
 * Typical field jobs for each year-plan crop, by days after sowing or transplanting.
 *
 * Planning values from common BARI / BRRI / DAE guidance for north-west Bangladesh, rounded to the
 * day. Local advice, the variety and the season's weather can move them by a week or more.
 */
export const cropJobs: Record<RotationCropId, CropJob[]> = {
  // DAE/BAMIS maize package of practice: thin and weed within a month of germination; urea at
  // 25-30 and 40-50 days after germination (about 5 days after sowing); irrigate at cob emergence
  // (60-70 days) and avoid standing water at flowering and grain filling.
  maize: [
    {
      day: 28,
      kind: 'care',
      en: 'Thin the seedlings and weed',
      bn: 'চারা পাতলা করুন, নিড়ানি দিন',
    },
    {
      day: 32,
      kind: 'fertiliser',
      en: 'Top-dress urea while the soil is moist',
      bn: 'মাটি ভেজা থাকতে ইউরিয়া উপরি প্রয়োগ করুন',
    },
    {
      day: 50,
      kind: 'fertiliser',
      en: 'Second urea top-dressing',
      bn: 'দ্বিতীয় কিস্তি ইউরিয়া উপরি প্রয়োগ করুন',
    },
    {
      day: 65,
      kind: 'key-stage',
      en: 'Cobs coming: keep the soil moist, no standing water',
      bn: 'মোচা আসছে: মাটি ভেজা রাখুন, পানি জমতে দেবেন না',
    },
    { day: 105, kind: 'care', en: 'Get ready to harvest', bn: 'কাটার প্রস্তুতি নিন' },
  ],
  // DAE/BAMIS tomato guidance: urea and potash 10, 25 and 40 days after transplanting; weed at
  // 25-30 days; spray against fruit borer only when found; pick ripe and half-ripe fruit.
  tomato: [
    {
      day: 10,
      kind: 'fertiliser',
      en: 'First top-dressing of urea and potash',
      bn: 'প্রথম কিস্তি ইউরিয়া ও পটাশ উপরি প্রয়োগ করুন',
    },
    {
      day: 25,
      kind: 'fertiliser',
      en: 'Weed, then second urea and potash',
      bn: 'নিড়ানি দিয়ে দ্বিতীয় কিস্তি ইউরিয়া ও পটাশ দিন',
    },
    {
      day: 40,
      kind: 'fertiliser',
      en: 'Third urea and potash',
      bn: 'তৃতীয় কিস্তি ইউরিয়া ও পটাশ দিন',
    },
    {
      day: 45,
      kind: 'key-stage',
      en: 'Fruits setting: check for fruit borer',
      bn: 'ফল ধরছে: ফল ছিদ্রকারী পোকা দেখুন',
    },
    {
      day: 75,
      kind: 'care',
      en: 'Pick ripe and half-ripe fruit with care',
      bn: 'পাকা ও আধপাকা ফল সাবধানে তুলুন',
    },
  ],
  // DAE/BAMIS chickpea guidance: weed at 25-30 days; if the soil dries out, a light irrigation;
  // hold irrigation where plants are wilting from root rot, as water spreads it.
  chickpea: [
    { day: 25, kind: 'care', en: 'Weed the field', bn: 'নিড়ানি দিন, আগাছা তুলুন' },
    {
      day: 55,
      kind: 'key-stage',
      en: 'Flowering: check for pod borer and wilting plants',
      bn: 'ফুল আসছে: ফল ছিদ্রকারী পোকা ও ঢলে পড়া গাছ দেখুন',
    },
    {
      day: 115,
      kind: 'care',
      en: 'Pods ripening: get ready to harvest',
      bn: 'শুঁটি পাকছে: কাটার প্রস্তুতি নিন',
    },
  ],
  // Same jobs as mung bean, the other Vigna pulse; harvest prep 8 days before the end.
  blackgram: [
    { day: 18, kind: 'care', en: 'Weed the field', bn: 'নিড়ানি দিন' },
    {
      day: 32,
      kind: 'key-stage',
      en: 'Flowers coming: check for pests and yellow mosaic',
      bn: 'ফুল আসছে: পোকা ও হলুদ মোজাইক রোগ দেখুন',
    },
    {
      day: 70,
      kind: 'care',
      en: 'Pods ripening: get ready to harvest',
      bn: 'শুঁটি পাকছে: কাটার প্রস্তুতি নিন',
    },
  ],
  groundnut: [
    {
      day: 20,
      kind: 'care',
      en: 'Thin the seedlings and weed',
      bn: 'চারা পাতলা করুন, নিড়ানি দিন',
    },
    {
      day: 35,
      kind: 'key-stage',
      en: 'Flowering: weed lightly, keep the soil loose',
      bn: 'ফুল আসছে: হালকা নিড়ানি দিন, মাটি ঝুরঝুরে রাখুন',
    },
    { day: 115, kind: 'care', en: 'Get ready to harvest', bn: 'তোলার প্রস্তুতি নিন' },
  ],
  // DAE/BAMIS onion guidance: half the urea and potash at planting, the rest at 25 and 50 days;
  // weed after irrigating; sprays for purple blotch at 10-15 day intervals when it appears;
  // harvest when 70-80% of the leaves have fallen.
  onion: [
    {
      day: 25,
      kind: 'fertiliser',
      en: 'Weed, then top-dress urea and potash',
      bn: 'নিড়ানি দিয়ে ইউরিয়া ও পটাশ উপরি প্রয়োগ করুন',
    },
    {
      day: 45,
      kind: 'key-stage',
      en: 'Check the leaves for purple blotch',
      bn: 'পাতায় বেগুনি দাগ রোগ দেখুন',
    },
    {
      day: 50,
      kind: 'fertiliser',
      en: 'Second urea and potash',
      bn: 'দ্বিতীয় কিস্তি ইউরিয়া ও পটাশ দিন',
    },
    {
      day: 100,
      kind: 'care',
      en: 'Harvest when most leaves have fallen over',
      bn: 'বেশিরভাগ পাতা নুয়ে পড়লে তুলুন',
    },
  ],
  // DAE/BAMIS garlic guidance: first weeding at 20-25 days; urea and potash at 25 and 50 days;
  // sprays against downy mildew when it appears; stop irrigating 3 weeks before harvest.
  garlic: [
    { day: 22, kind: 'care', en: 'Weed the field', bn: 'নিড়ানি দিন, আগাছা তুলুন' },
    {
      day: 25,
      kind: 'fertiliser',
      en: 'Top-dress urea and potash',
      bn: 'ইউরিয়া ও পটাশ উপরি প্রয়োগ করুন',
    },
    {
      day: 50,
      kind: 'fertiliser',
      en: 'Second urea and potash',
      bn: 'দ্বিতীয় কিস্তি ইউরিয়া ও পটাশ দিন',
    },
    {
      day: 60,
      kind: 'key-stage',
      en: 'Check the leaves for blight and mildew',
      bn: 'পাতায় ঝলসানো ও মিলডিউ রোগ দেখুন',
    },
    {
      day: 119,
      kind: 'care',
      en: 'Stop irrigating: harvest in 3 weeks',
      bn: 'সেচ বন্ধ করুন: ৩ সপ্তাহ পরে তুলবেন',
    },
  ],
  // DAE/BAMIS brinjal guidance: first top-dressing 10-15 days after transplanting; weed at 25-30
  // days; the Rajshahi-region calendar is built around the shoot and fruit borer.
  brinjal: [
    {
      day: 12,
      kind: 'fertiliser',
      en: 'First top-dressing of urea and potash',
      bn: 'প্রথম কিস্তি ইউরিয়া ও পটাশ উপরি প্রয়োগ করুন',
    },
    { day: 27, kind: 'care', en: 'Weed the field', bn: 'নিড়ানি দিন, আগাছা তুলুন' },
    {
      day: 40,
      kind: 'key-stage',
      en: 'Flowering: cut off wilted shoots (shoot and fruit borer)',
      bn: 'ফুল আসছে: ঢলে পড়া ডগা কেটে ফেলুন (ডগা ও ফল ছিদ্রকারী পোকা)',
    },
  ],
  mustard: [
    {
      day: 18,
      kind: 'care',
      en: 'Thin the seedlings and weed',
      bn: 'চারা পাতলা করুন, নিড়ানি দিন',
    },
    {
      day: 25,
      kind: 'fertiliser',
      en: 'Top-dress urea while the soil is moist',
      bn: 'মাটি ভেজা থাকতে ইউরিয়া উপরি প্রয়োগ করুন',
    },
    {
      day: 35,
      kind: 'key-stage',
      en: 'Flowering: check for aphids',
      bn: 'ফুল আসছে: জাব পোকা দেখুন',
    },
    {
      day: 78,
      kind: 'care',
      en: 'Stop irrigating, get ready to harvest',
      bn: 'সেচ বন্ধ করুন, কাটার প্রস্তুতি নিন',
    },
  ],
  wheat: [
    { day: 20, kind: 'care', en: 'Weed the field', bn: 'নিড়ানি দিন, আগাছা তুলুন' },
    {
      day: 23,
      kind: 'fertiliser',
      en: 'Top-dress urea while the soil is moist',
      bn: 'মাটি ভেজা থাকতে ইউরিয়া উপরি প্রয়োগ করুন',
    },
    {
      day: 60,
      kind: 'key-stage',
      en: 'Ears coming: check for pests and disease',
      bn: 'শীষ আসছে: পোকা ও রোগ দেখুন',
    },
    {
      day: 95,
      kind: 'care',
      en: 'Stop irrigating, get ready to harvest',
      bn: 'সেচ বন্ধ করুন, কাটার প্রস্তুতি নিন',
    },
  ],
  lentil: [
    { day: 25, kind: 'care', en: 'Weed the field', bn: 'নিড়ানি দিন, আগাছা তুলুন' },
    {
      day: 50,
      kind: 'key-stage',
      en: 'Flowering: check for leaf blight',
      bn: 'ফুল আসছে: পাতা ঝলসানো রোগ দেখুন',
    },
    {
      day: 95,
      kind: 'care',
      en: 'Pods ripening: get ready to harvest',
      bn: 'শুঁটি পাকছে: কাটার প্রস্তুতি নিন',
    },
  ],
  potato: [
    {
      day: 25,
      kind: 'fertiliser',
      en: 'Top-dress urea and earth up',
      bn: 'ইউরিয়া উপরি প্রয়োগ করে মাটি তুলে দিন',
    },
    { day: 45, kind: 'care', en: 'Earth up again', bn: 'আবার মাটি তুলে দিন' },
    {
      day: 55,
      kind: 'key-stage',
      en: 'Foggy days: check for late blight',
      bn: 'কুয়াশায় নাবি ধসা রোগ দেখুন',
    },
    {
      day: 85,
      kind: 'care',
      en: 'Cut the vines 7–10 days before lifting',
      bn: 'তোলার ৭–১০ দিন আগে গাছ কেটে দিন',
    },
  ],
  boro: [
    { day: 15, kind: 'fertiliser', en: 'First urea split', bn: 'প্রথম কিস্তি ইউরিয়া দিন' },
    { day: 25, kind: 'care', en: 'Weed the field', bn: 'আগাছা পরিষ্কার করুন' },
    { day: 35, kind: 'fertiliser', en: 'Second urea split', bn: 'দ্বিতীয় কিস্তি ইউরিয়া দিন' },
    { day: 55, kind: 'fertiliser', en: 'Third urea split', bn: 'তৃতীয় কিস্তি ইউরিয়া দিন' },
    {
      day: 75,
      kind: 'key-stage',
      en: 'Flowering: keep water in the field',
      bn: 'ফুল আসছে: জমিতে পানি ধরে রাখুন',
    },
    {
      day: 108,
      kind: 'care',
      en: 'Drain the field, get ready to harvest',
      bn: 'পানি সরিয়ে দিন, কাটার প্রস্তুতি নিন',
    },
  ],
  mung: [
    { day: 15, kind: 'care', en: 'Weed the field', bn: 'নিড়ানি দিন' },
    {
      day: 28,
      kind: 'key-stage',
      en: 'Flowers coming: check for pests',
      bn: 'ফুল আসছে: পোকা দেখুন',
    },
    { day: 50, kind: 'care', en: 'Start picking ripe pods', bn: 'পাকা শুঁটি তুলতে শুরু করুন' },
  ],
  aus: [
    { day: 15, kind: 'fertiliser', en: 'First urea split', bn: 'প্রথম কিস্তি ইউরিয়া দিন' },
    { day: 25, kind: 'care', en: 'Weed the field', bn: 'আগাছা পরিষ্কার করুন' },
    { day: 35, kind: 'fertiliser', en: 'Second urea split', bn: 'দ্বিতীয় কিস্তি ইউরিয়া দিন' },
    {
      day: 65,
      kind: 'key-stage',
      en: 'Flowering: keep water in the field',
      bn: 'ফুল আসছে: জমিতে পানি ধরে রাখুন',
    },
    {
      day: 90,
      kind: 'care',
      en: 'Drain the field, get ready to harvest',
      bn: 'পানি সরিয়ে দিন, কাটার প্রস্তুতি নিন',
    },
  ],
  jute: [
    {
      day: 15,
      kind: 'care',
      en: 'Thin the seedlings and weed',
      bn: 'চারা পাতলা করুন, নিড়ানি দিন',
    },
    { day: 30, kind: 'fertiliser', en: 'Top-dress urea', bn: 'ইউরিয়া উপরি প্রয়োগ করুন' },
    {
      day: 45,
      kind: 'fertiliser',
      en: 'Second urea after weeding',
      bn: 'নিড়ানির পরে দ্বিতীয় কিস্তি ইউরিয়া দিন',
    },
    {
      day: 100,
      kind: 'care',
      en: 'Get ready to cut and ret',
      bn: 'কাটা ও জাগ দেওয়ার প্রস্তুতি নিন',
    },
  ],
  sesame: [
    {
      day: 15,
      kind: 'care',
      en: 'Thin the seedlings and weed',
      bn: 'চারা পাতলা করুন, নিড়ানি দিন',
    },
    { day: 25, kind: 'fertiliser', en: 'Top-dress urea', bn: 'ইউরিয়া উপরি প্রয়োগ করুন' },
    {
      day: 35,
      kind: 'key-stage',
      en: 'Flowering: do not let water stand',
      bn: 'ফুল আসছে: জমিতে পানি জমতে দেবেন না',
    },
    { day: 82, kind: 'care', en: 'Get ready to harvest', bn: 'কাটার প্রস্তুতি নিন' },
  ],
  aman: [
    { day: 15, kind: 'fertiliser', en: 'First urea split', bn: 'প্রথম কিস্তি ইউরিয়া দিন' },
    { day: 25, kind: 'care', en: 'Weed the field', bn: 'আগাছা পরিষ্কার করুন' },
    { day: 35, kind: 'fertiliser', en: 'Second urea split', bn: 'দ্বিতীয় কিস্তি ইউরিয়া দিন' },
    { day: 50, kind: 'fertiliser', en: 'Third urea split', bn: 'তৃতীয় কিস্তি ইউরিয়া দিন' },
    {
      day: 65,
      kind: 'key-stage',
      en: 'Flowering: keep water in the field',
      bn: 'ফুল আসছে: জমিতে পানি ধরে রাখুন',
    },
    {
      day: 95,
      kind: 'care',
      en: 'Drain the field, get ready to harvest',
      bn: 'পানি সরিয়ে দিন, কাটার প্রস্তুতি নিন',
    },
  ],
};
