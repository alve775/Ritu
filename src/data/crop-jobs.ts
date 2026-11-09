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
  // No field-job guide found yet for these two: their calendars show no job reminders until one is.
  maize: [],
  tomato: [],
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
