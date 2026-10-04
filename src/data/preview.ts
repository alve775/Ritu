import type { Farm, PreviewData } from '../domain/types';
import { extraCrops, cropReferences } from './crop-catalogue';

// Fictional, editable calendar fixtures, explicitly labeled in the interface.
// They carry no water-demand ranking, suitability rule or climate observation.
export const previewData: PreviewData = {
  mode: 'illustrative',
  version: 'preview-1',
  locality: { en: 'Rajshahi, Bangladesh', bn: 'রাজশাহী, বাংলাদেশ' },
  crops: {
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
        en: 'Rice structure is illustrated here. This example calendar does not establish local dates or water needs.',
        bn: 'এখানে ধানগাছের গঠন দেখানো হয়েছে। নমুনার সময় স্থানীয় তারিখ বা পানির চাহিদা নির্ধারণ করে না।',
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
        en: 'A planned gap in this sample calendar. Cover and management are unspecified.',
        bn: 'এই নমুনা ক্যালেন্ডারে ফসলের বিরতি। আচ্ছাদন ও ব্যবস্থাপনা নির্ধারিত নয়।',
      },
    },
  },
  alternatives: [
    {
      id: 'balanced',
      name: { en: 'Example 1: rice, pulses & wheat', bn: 'নমুনা ১: ধান, ডাল ও গম' },
      subtitle: { en: 'Mung bean → Aman rice → Wheat', bn: 'মুগ ডাল → আমন ধান → গম' },
      periods: [
        { crop: 'mung', start: 0, duration: 3 },
        { crop: 'fallow', start: 3, duration: 1 },
        { crop: 'aman', start: 4, duration: 4 },
        { crop: 'wheat', start: 8, duration: 4 },
      ],
    },
    {
      id: 'diverse',
      name: { en: 'Example 2: rice, pulses & potato', bn: 'নমুনা ২: ধান, ডাল ও আলু' },
      subtitle: { en: 'Mung bean → Aman rice → Potato', bn: 'মুগ ডাল → আমন ধান → আলু' },
      periods: [
        { crop: 'mung', start: 0, duration: 3 },
        { crop: 'fallow', start: 3, duration: 1 },
        { crop: 'aman', start: 4, duration: 4 },
        { crop: 'potato', start: 8, duration: 4 },
      ],
    },
  ],
};

export const defaultFarm: Farm = {
  name: 'My Rajshahi farm',
  area: 1.2,
  irrigation: 'limited',
  soil: 'loam',
  drainage: 'good',
  required: ['rice'],
  unavailableMonths: [],
  current: [
    { crop: 'boro', start: 10, duration: 4 },
    { crop: 'fallow', start: 2, duration: 2 },
    { crop: 'aman', start: 4, duration: 5 },
    { crop: 'fallow', start: 9, duration: 1 },
  ],
};
export const months = {
  en: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
  bn: [
    'মার্চ',
    'এপ্রি',
    'মে',
    'জুন',
    'জুলা',
    'আগ',
    'সেপ্টে',
    'অক্টো',
    'নভে',
    'ডিসে',
    'জানু',
    'ফেব্রু',
  ],
};
