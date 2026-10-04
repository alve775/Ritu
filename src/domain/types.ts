export type Language = 'en' | 'bn';
export type Irrigation = 'reliable' | 'limited' | 'rainfed' | 'unknown';
export const cropIds = [
  'boro',
  'aman',
  'wheat',
  'mung',
  'potato',
  'fallow',
  'aus',
  'maize',
  'barley',
  'sorghum',
  'lentil',
  'chickpea',
  'blackgram',
  'pigeonpea',
  'khesari',
  'cowpea',
  'mustard',
  'groundnut',
  'soybean',
  'sunflower',
  'sesame',
  'linseed',
  'jute',
  'cotton',
  'sugarcane',
  'onion',
  'garlic',
  'chilli',
  'sweetpotato',
  'tomato',
  'brinjal',
  'cabbage',
  'cauliflower',
  'okra',
  'pumpkin',
  'bottlegourd',
  'cucumber',
  'radish',
  'countrybean',
  'yardlongbean',
  'bittergourd',
  'ashgourd',
  'amaranth',
  'indianspinach',
] as const;
export type CropId = (typeof cropIds)[number];
export type CropCategory =
  'cereal' | 'pulse' | 'oilseed' | 'vegetable' | 'tuber' | 'spice' | 'fibre' | 'sugar' | 'rest';
export type HouseholdCrop = 'rice' | 'pulses' | 'potato';
export type Priority = 'water' | 'diversity' | 'familiar';
export interface CropPeriod {
  crop: CropId;
  start: number;
  duration: number;
}
export interface Farm {
  name: string;
  area: number;
  irrigation: Irrigation;
  soil: 'loam' | 'clay' | 'sandy' | 'unknown';
  drainage: 'good' | 'poor' | 'unknown';
  required: HouseholdCrop[];
  unavailableMonths: number[];
  current: CropPeriod[];
}
export interface Localized {
  en: string;
  bn: string;
}
export interface Crop {
  id: CropId;
  name: Localized;
  family: Localized;
  household?: HouseholdCrop;
  color: string;
  description: Localized;
  category?: CropCategory;
  familyReviewed?: boolean;
  reference?: { name: string; url: string };
}
export interface Rotation {
  id: string;
  name: Localized;
  subtitle: Localized;
  periods: CropPeriod[];
  isCurrent?: boolean;
}
export interface Check {
  id: string;
  state: 'pass' | 'block' | 'unknown';
  label: Localized;
  detail: Localized;
}
export interface Evaluation {
  rotation: Rotation;
  checks: Check[];
  status: 'passes' | 'blocked' | 'confirm';
  familyCount: number;
  legumeMonths: number;
  fallowMonths: number;
}
export interface PreviewData {
  mode: 'illustrative';
  version: string;
  locality: Localized;
  crops: Record<CropId, Crop>;
  alternatives: Rotation[];
}
