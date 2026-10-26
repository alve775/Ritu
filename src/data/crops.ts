import type { CropId, Crop } from '../domain/types';
import { extraCrops, cropReferences } from './crop-catalogue';
/** Botanical identity and credited references only; no invented calendar data. */
export const crops: Record<CropId, Crop> = {
  ...extraCrops,
  boro: {
    id: 'boro',
    category: 'cereal',
    reference: cropReferences.barc,
    name: { en: 'Boro rice', bn: 'বোরো ধান' },
    family: { en: 'Grass family (Poaceae)', bn: 'ঘাস পরিবার (পোয়েসি)' },
    household: 'rice',
    color: 'rice',
    description: {
      en: 'Irrigated dry-season rice. Botanical identity is a reference; use the official regional calendar and local cultivar guidance for management.',
      bn: 'সেচনির্ভর শীতের ধান। পরিচয় তথ্যের জন্য; ব্যবস্থাপনায় আঞ্চলিক পঞ্জিকা ও জাতের পরামর্শ দেখুন।',
    },
  },
  aman: {
    id: 'aman',
    category: 'cereal',
    reference: cropReferences.barc,
    name: { en: 'Aman rice', bn: 'আমন ধান' },
    family: { en: 'Grass family (Poaceae)', bn: 'ঘাস পরিবার (পোয়েসি)' },
    household: 'rice',
    color: 'aman',
    description: {
      en: 'A monsoon-season rice crop. Rainfall suitability has not been assessed.',
      bn: 'বর্ষা মৌসুমের ধান। বৃষ্টির উপযোগিতা এখনো যাচাই করা হয়নি।',
    },
  },
  wheat: {
    id: 'wheat',
    category: 'cereal',
    reference: cropReferences.barc,
    name: { en: 'Wheat', bn: 'গম' },
    family: { en: 'Grass family (Poaceae)', bn: 'ঘাস পরিবার (পোয়েসি)' },
    color: 'wheat',
    description: {
      en: 'Wheat is in the grass family. Local growing dates, irrigation and drainage requirements have not been reviewed.',
      bn: 'গম ঘাস পরিবারের ফসল। স্থানীয় চাষের সময়, সেচ ও নিষ্কাশনের চাহিদা যাচাই হয়নি।',
    },
  },
  mung: {
    id: 'mung',
    category: 'pulse',
    reference: cropReferences.barc,
    name: { en: 'Mung bean', bn: 'মুগ ডাল' },
    family: { en: 'Legume family (Fabaceae)', bn: 'ডাল পরিবার (ফ্যাবেসি)' },
    household: 'pulses',
    color: 'mung',
    description: {
      en: 'A pulse crop that adds a legume to the sequence. No soil or yield benefit is quantified.',
      bn: 'এই ডাল ফসল ক্রমে বৈচিত্র্য যোগ করে। মাটি বা ফলনের উপকারের পরিমাণ নির্ধারিত নয়।',
    },
  },
  potato: {
    id: 'potato',
    category: 'tuber',
    reference: cropReferences.barc,
    name: { en: 'Potato', bn: 'আলু' },
    family: { en: 'Nightshade family (Solanaceae)', bn: 'সোলানেসি পরিবার' },
    household: 'potato',
    color: 'potato',
    description: {
      en: 'Potato belongs to the nightshade family. Its tubers form on underground stems; local growing requirements remain unassessed.',
      bn: 'আলু সোলানেসি পরিবারের ফসল। মাটির নিচের কাণ্ডে আলু তৈরি হয়; স্থানীয় চাষের চাহিদা যাচাই বাকি।',
    },
  },
  fallow: {
    id: 'fallow',
    category: 'rest',
    name: { en: 'Rest / fallow', bn: 'বিরতি / পতিত' },
    family: { en: 'No crop', bn: 'ফসল নেই' },
    color: 'fallow',
    description: {
      en: 'A planned gap in this calendar. Cover and management are unspecified.',
      bn: 'এই ক্যালেন্ডারে ফসলের বিরতি। আচ্ছাদন ও ব্যবস্থাপনা নির্ধারিত নয়।',
    },
  },
};
