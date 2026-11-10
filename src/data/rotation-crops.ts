import type { Season } from '../domain/evidence-planner';
import type { CropId } from '../domain/types';

/**
 * Crops Ritu can place in a year plan for the Rajshahi region.
 *
 * Sowing windows and durations are planning values for common varieties in north-west Bangladesh
 * (BARI / BRRI / DAE crop calendars). Crop coefficients follow FAO-56 Table 12. Heat limits are the
 * day-maximum temperatures above which the named stage is commonly reported to suffer. Check these
 * values with a local agronomist before relying on them; every rating in the app depends on them.
 */
export interface RotationCrop {
  id: RotationCropId;
  /** Plant catalogue id used when this crop's calendar is created. */
  catalogueId: string;
  season: Season;
  name: { en: string; bn: string };
  /** Month (1–12) and day of the preferred sowing (or transplanting) date. */
  sow: [number, number];
  /** Earliest and latest good sowing dates, as [month, day]. */
  window: [[number, number], [number, number]];
  /** Days from sowing (or transplanting) to harvest. */
  days: number;
  /** FAO-56 crop coefficients: initial, mid-season, end of season. */
  kc: [number, number, number];
  /** Flooded rice: puddling water before transplanting and seepage every day. */
  rice?: boolean;
  /** Pulse crops leave nitrogen for the next crop. */
  pulse?: boolean;
  /** Plant family, where it matters for rotation: crops of one family share soil diseases. */
  family?: 'nightshade' | 'allium';
  /** Heat-sensitive part of the season (share of days from sowing) and the day-max limit in °C. */
  heat?: { from: number; to: number; limitC: number; stage: HeatStage };
  /** How the crop does on each soil texture. */
  soil: { clay: SoilFit; loam: SoilFit; sandy: SoilFit };
  /** Soil pH the crop tolerates (FAO ECOCROP PHMIN-PHMAX, as in data/global/crop-requirements.json). */
  ph: [number, number];
}
export type RotationCropId = Extract<
  CropId,
  | 'mustard'
  | 'wheat'
  | 'lentil'
  | 'potato'
  | 'boro'
  | 'maize'
  | 'tomato'
  | 'mung'
  | 'aus'
  | 'jute'
  | 'sesame'
  | 'aman'
  | 'chickpea'
  | 'groundnut'
  | 'onion'
  | 'garlic'
  | 'brinjal'
  | 'blackgram'
>;
export type SoilFit = 'good' | 'ok' | 'poor';
export type HeatStage = 'flowering' | 'grain' | 'pod' | 'tuber';

export const rotationCrops: Record<RotationCropId, RotationCrop> = {
  mustard: {
    id: 'mustard',
    catalogueId: 'mustard',
    season: 'winter',
    name: { en: 'Mustard', bn: 'সরিষা' },
    sow: [11, 10],
    window: [
      [10, 25],
      [11, 30],
    ],
    days: 85,
    kc: [0.35, 1.0, 0.35],
    heat: { from: 0.35, to: 0.6, limitC: 30, stage: 'flowering' },
    soil: { clay: 'ok', loam: 'good', sandy: 'ok' },
    ph: [5, 8],
  },
  wheat: {
    id: 'wheat',
    catalogueId: 'wheat',
    season: 'winter',
    name: { en: 'Wheat', bn: 'গম' },
    sow: [11, 20],
    window: [
      [11, 10],
      [12, 10],
    ],
    days: 105,
    kc: [0.3, 1.15, 0.4],
    heat: { from: 0.6, to: 0.9, limitC: 30, stage: 'grain' },
    soil: { clay: 'ok', loam: 'good', sandy: 'ok' },
    ph: [5.5, 8.5],
  },
  lentil: {
    id: 'lentil',
    catalogueId: 'lentil',
    season: 'winter',
    name: { en: 'Lentil', bn: 'মসুর' },
    sow: [11, 5],
    window: [
      [10, 25],
      [11, 25],
    ],
    days: 105,
    kc: [0.4, 1.1, 0.3],
    pulse: true,
    heat: { from: 0.55, to: 0.85, limitC: 32, stage: 'pod' },
    soil: { clay: 'ok', loam: 'good', sandy: 'ok' },
    ph: [4.5, 8.2],
  },
  potato: {
    id: 'potato',
    catalogueId: 'potato',
    season: 'winter',
    name: { en: 'Potato', bn: 'আলু' },
    sow: [11, 15],
    window: [
      [11, 1],
      [12, 5],
    ],
    days: 95,
    kc: [0.5, 1.15, 0.75],
    heat: { from: 0.4, to: 0.9, limitC: 30, stage: 'tuber' },
    family: 'nightshade',
    soil: { clay: 'poor', loam: 'good', sandy: 'good' },
    ph: [4.2, 8.5],
  },
  boro: {
    id: 'boro',
    catalogueId: 'rice',
    season: 'winter',
    name: { en: 'Boro rice', bn: 'বোরো ধান' },
    sow: [1, 15],
    window: [
      [12, 25],
      [1, 31],
    ],
    days: 120,
    kc: [1.05, 1.2, 0.9],
    rice: true,
    heat: { from: 0.6, to: 0.75, limitC: 35, stage: 'flowering' },
    soil: { clay: 'good', loam: 'good', sandy: 'poor' },
    ph: [4.5, 9],
  },
  /**
   * Winter maize: 112 days, season from week 46, as in the DAE/BAMIS Rajshahi maize calendar in
   * regional-calendars.ts. The sowing window around that start week is an estimate. Kc: FAO-56
   * Table 12, maize (grain). Heat limit and soil fit are commonly reported values, not yet checked
   * against a source.
   */
  maize: {
    id: 'maize',
    catalogueId: 'maize',
    season: 'winter',
    name: { en: 'Maize', bn: 'ভুট্টা' },
    sow: [11, 15],
    window: [
      [11, 1],
      [12, 15],
    ],
    days: 112,
    kc: [0.3, 1.2, 0.35],
    heat: { from: 0.5, to: 0.65, limitC: 35, stage: 'flowering' },
    soil: { clay: 'ok', loam: 'good', sandy: 'ok' },
    ph: [4.5, 8.5],
  },
  /**
   * Chickpea (BARI Chola-9 type), the rainfed crop after Aman in the High Barind. Window: DAE
   * guidance 20 Nov - 10 Dec; on-farm trials in the High Barind found 30 Nov - 10 Dec best
   * (Crop & Pasture Science, CP13331). 125 days: BARI Chola-9 matures in about 125-130 days
   * (Godagari trial, SAARC J. Agric.). Kc: FAO-56 Table 12, chick pea. Heat: pod development is
   * impaired above about 30 °C and most lines set no pods above 35 °C (Devasirvatham et al.,
   * Crop & Pasture Science 2012). Soil fit: grown on the Barind's silty clay loams; sandy is marked
   * ok, not checked against a source. In the DAE district crop table for Rajshahi and
   * Chapainawabganj.
   */
  chickpea: {
    id: 'chickpea',
    catalogueId: 'chickpea',
    season: 'winter',
    name: { en: 'Chickpea', bn: 'ছোলা' },
    sow: [12, 1],
    window: [
      [11, 20],
      [12, 10],
    ],
    days: 125,
    kc: [0.4, 1.0, 0.35],
    pulse: true,
    heat: { from: 0.55, to: 0.85, limitC: 30, stage: 'pod' },
    soil: { clay: 'ok', loam: 'good', sandy: 'ok' },
    ph: [4.7, 9.5],
  },
  /**
   * Rabi onion, transplanted. The DAE/BAMIS Rajshahi-region onion calendar (Rajshahi,
   * Chapainawabganj, Naogaon, Natore) runs from standard week 49 to week 13 with a life span of
   * 100-120 days; seedlings are raised in a nursery before that. The window around week 49 is an
   * estimate. Harvest when 70-80% of the leaves have fallen (DAE). Kc: FAO-56 Table 12, onion (dry).
   * No heat rating: ECOCROP's optimum maximum (25 °C) is passed every March while bulbs form, which
   * is the normal season here, and no stage limit from a source was found. Soil fit: loam best,
   * not checked against a source.
   */
  onion: {
    id: 'onion',
    catalogueId: 'onion',
    season: 'winter',
    name: { en: 'Onion', bn: 'পেঁয়াজ' },
    sow: [12, 5],
    window: [
      [11, 25],
      [12, 31],
    ],
    days: 110,
    kc: [0.7, 1.05, 0.75],
    family: 'allium',
    soil: { clay: 'ok', loam: 'good', sandy: 'ok' },
    ph: [4.3, 8.3],
  },
  /**
   * Garlic, planted as cloves; Natore grows about a third of Bangladesh's garlic, much of it
   * planted without tillage after Aman. Planting mid-October to November (DAE). 140 days: the
   * BAMIS garlic calendars for other regions run weeks 44-12 with 140-150 days; no Rajshahi
   * calendar was found. Stop irrigating 3 weeks before harvest (DAE). Kc: FAO-56 Table 12, garlic.
   * No heat rating, as for onion. Soil fit: loam best, not checked against a source.
   */
  garlic: {
    id: 'garlic',
    catalogueId: 'ecocrop-367',
    season: 'winter',
    name: { en: 'Garlic', bn: 'রসুন' },
    sow: [11, 5],
    window: [
      [10, 15],
      [11, 30],
    ],
    days: 140,
    kc: [0.7, 1.0, 0.7],
    family: 'allium',
    soil: { clay: 'ok', loam: 'good', sandy: 'ok' },
    ph: [5, 8.5],
  },
  /**
   * Rabi brinjal, transplanted. The DAE/BAMIS Rajshahi-region brinjal calendar runs from standard
   * week 44 to week 12 with a life span of 140-150 days (nursery included); the window around week
   * 44 is an estimate. Kc: FAO-56 Table 12, egg plant. Heat limit: ECOCROP optimum maximum (35 °C).
   * Soil fit: loam best, not checked against a source.
   */
  brinjal: {
    id: 'brinjal',
    catalogueId: 'ecocrop-1965',
    season: 'winter',
    name: { en: 'Brinjal', bn: 'বেগুন' },
    sow: [11, 1],
    window: [
      [10, 15],
      [11, 30],
    ],
    days: 140,
    kc: [0.6, 1.05, 0.9],
    family: 'nightshade',
    heat: { from: 0.3, to: 0.8, limitC: 35, stage: 'flowering' },
    soil: { clay: 'ok', loam: 'good', sandy: 'ok' },
    ph: [4.3, 8.5],
  },
  /**
   * Winter tomato, transplanted. Window: planting-date trials in Bangladesh found October best
   * (SAU 2019-20: 15 Oct; 2020 study: 5 and 25 Oct), and winter transplanting runs on through
   * November. About 110 days in the field: the BAMIS Bogra tomato calendar gives 130-140 days with
   * a 25-30 day nursery. Kc: FAO-56 Table 12, tomato (end 0.70-0.90, middle used). Heat limit
   * (fruit set) and soil fit are commonly reported values, not yet checked against a source.
   */
  tomato: {
    id: 'tomato',
    catalogueId: 'tomato',
    season: 'winter',
    name: { en: 'Tomato', bn: 'টমেটো' },
    sow: [10, 15],
    window: [
      [10, 1],
      [11, 30],
    ],
    days: 110,
    kc: [0.6, 1.15, 0.8],
    family: 'nightshade',
    heat: { from: 0.3, to: 0.7, limitC: 32, stage: 'flowering' },
    soil: { clay: 'ok', loam: 'good', sandy: 'ok' },
    ph: [5, 7.5],
  },
  mung: {
    id: 'mung',
    catalogueId: 'mung',
    season: 'pre-monsoon',
    name: { en: 'Mung bean', bn: 'মুগ ডাল' },
    sow: [3, 15],
    window: [
      [2, 25],
      [4, 5],
    ],
    days: 65,
    kc: [0.4, 1.05, 0.35],
    pulse: true,
    heat: { from: 0.4, to: 0.6, limitC: 38, stage: 'flowering' },
    soil: { clay: 'ok', loam: 'good', sandy: 'ok' },
    ph: [4.3, 8.3],
  },
  /**
   * Groundnut in Kharif I. The DAE/BAMIS Rajshahi-region calendar (Rajshahi, Chapainawabganj,
   * Naogaon, Natore) gives Kharif groundnut from standard week 10 to week 27, 120-130 days; it is
   * grown on the Padma chars. The window around week 10 is an estimate. Kc: FAO-56 Table 12,
   * groundnut. Heat: pollen production and viability fall above a day temperature of 34 °C
   * (Prasad et al., Annals of Botany 1999). Soil fit: light, well-drained soils, so clay is poor;
   * not checked against a source.
   */
  groundnut: {
    id: 'groundnut',
    catalogueId: 'groundnut',
    season: 'pre-monsoon',
    name: { en: 'Groundnut', bn: 'চিনাবাদাম' },
    sow: [3, 5],
    window: [
      [2, 20],
      [3, 31],
    ],
    days: 125,
    kc: [0.4, 1.15, 0.6],
    heat: { from: 0.3, to: 0.6, limitC: 34, stage: 'flowering' },
    soil: { clay: 'poor', loam: 'good', sandy: 'good' },
    ph: [4.5, 8.5],
  },
  aus: {
    id: 'aus',
    catalogueId: 'rice',
    season: 'pre-monsoon',
    name: { en: 'Aus rice', bn: 'আউশ ধান' },
    sow: [4, 15],
    window: [
      [4, 1],
      [5, 10],
    ],
    days: 100,
    kc: [1.05, 1.2, 0.9],
    rice: true,
    heat: { from: 0.6, to: 0.75, limitC: 35, stage: 'flowering' },
    soil: { clay: 'good', loam: 'good', sandy: 'poor' },
    ph: [4.5, 9],
  },
  jute: {
    id: 'jute',
    catalogueId: 'ecocrop-4849',
    season: 'pre-monsoon',
    name: { en: 'Jute', bn: 'পাট' },
    sow: [4, 1],
    window: [
      [3, 15],
      [4, 30],
    ],
    days: 110,
    kc: [0.5, 1.05, 0.6],
    soil: { clay: 'ok', loam: 'good', sandy: 'ok' },
    ph: [5, 8.6],
  },
  sesame: {
    id: 'sesame',
    catalogueId: 'sesame',
    season: 'pre-monsoon',
    name: { en: 'Sesame', bn: 'তিল' },
    sow: [3, 1],
    window: [
      [2, 15],
      [3, 20],
    ],
    days: 90,
    kc: [0.35, 1.1, 0.25],
    heat: { from: 0.35, to: 0.6, limitC: 40, stage: 'flowering' },
    soil: { clay: 'poor', loam: 'good', sandy: 'good' },
    ph: [4.5, 8],
  },
  aman: {
    id: 'aman',
    catalogueId: 'rice',
    season: 'monsoon',
    name: { en: 'Aman rice', bn: 'আমন ধান' },
    sow: [8, 1],
    window: [
      [7, 15],
      [8, 20],
    ],
    days: 105,
    kc: [1.05, 1.2, 0.9],
    rice: true,
    heat: { from: 0.6, to: 0.75, limitC: 35, stage: 'flowering' },
    soil: { clay: 'good', loam: 'good', sandy: 'poor' },
    ph: [4.5, 9],
  },
  /**
   * Black gram (mashkalai) in Kharif II, grown on the chars of the Padma and Mohananda in Rajshahi
   * and Chapainawabganj. Window 15 Aug - 15 Sep (BINA Mash-1 guidance). 78 days: BARI Mash-3 in a
   * Chapainawabganj trial sown 25-27 Aug (Bangladesh J. Nuclear Agric.). Kc: FAO-56 Table 12, green
   * gram. Heat limit: ECOCROP optimum maximum (35 °C). Soil fit: char sandy loams; not checked
   * against a source. Grown instead of Aman on land that does not hold water for rice.
   */
  blackgram: {
    id: 'blackgram',
    catalogueId: 'ecocrop-2149',
    season: 'monsoon',
    name: { en: 'Black gram', bn: 'মাষকলাই' },
    sow: [8, 30],
    window: [
      [8, 15],
      [9, 15],
    ],
    days: 78,
    kc: [0.4, 1.05, 0.35],
    pulse: true,
    heat: { from: 0.4, to: 0.6, limitC: 35, stage: 'flowering' },
    soil: { clay: 'ok', loam: 'good', sandy: 'good' },
    ph: [4.5, 7.5],
  },
};
export const rotationCropIds = Object.keys(rotationCrops) as RotationCropId[];
export const isRotationCrop = (id: unknown): id is RotationCropId =>
  typeof id === 'string' && id in rotationCrops;

/**
 * Common year patterns in the Rajshahi region, as winter / summer / rainy crops (null = left empty).
 * Ritu suggests from this list after removing patterns that clash in time or don't suit the plot.
 */
export const rotationPatterns: {
  id: string;
  plan: Record<Season, RotationCropId | null>;
  /** Suggested only when no other pattern fits the plot (black gram in place of Aman). */
  standIn?: true;
}[] = [
  { id: 'boro-aman', plan: { winter: 'boro', 'pre-monsoon': null, monsoon: 'aman' } },
  { id: 'mustard-mung-aman', plan: { winter: 'mustard', 'pre-monsoon': 'mung', monsoon: 'aman' } },
  { id: 'wheat-mung-aman', plan: { winter: 'wheat', 'pre-monsoon': 'mung', monsoon: 'aman' } },
  { id: 'lentil-jute-aman', plan: { winter: 'lentil', 'pre-monsoon': 'jute', monsoon: 'aman' } },
  { id: 'lentil-mung-aman', plan: { winter: 'lentil', 'pre-monsoon': 'mung', monsoon: 'aman' } },
  { id: 'wheat-jute-aman', plan: { winter: 'wheat', 'pre-monsoon': 'jute', monsoon: 'aman' } },
  { id: 'potato-aus-aman', plan: { winter: 'potato', 'pre-monsoon': 'aus', monsoon: 'aman' } },
  { id: 'mustard-aus-aman', plan: { winter: 'mustard', 'pre-monsoon': 'aus', monsoon: 'aman' } },
  { id: 'wheat-aman', plan: { winter: 'wheat', 'pre-monsoon': null, monsoon: 'aman' } },
  { id: 'mustard-aman', plan: { winter: 'mustard', 'pre-monsoon': null, monsoon: 'aman' } },
  // Added after checking each against the scheduler: none clashes in time, starting in winter or
  // in the rainy season. Boro is left out of the sesame plans: it is harvested after sesame's window.
  { id: 'tomato-mung-aman', plan: { winter: 'tomato', 'pre-monsoon': 'mung', monsoon: 'aman' } },
  { id: 'tomato-jute-aman', plan: { winter: 'tomato', 'pre-monsoon': 'jute', monsoon: 'aman' } },
  { id: 'tomato-aus-aman', plan: { winter: 'tomato', 'pre-monsoon': 'aus', monsoon: 'aman' } },
  {
    id: 'tomato-sesame-aman',
    plan: { winter: 'tomato', 'pre-monsoon': 'sesame', monsoon: 'aman' },
  },
  { id: 'tomato-aman', plan: { winter: 'tomato', 'pre-monsoon': null, monsoon: 'aman' } },
  { id: 'maize-mung-aman', plan: { winter: 'maize', 'pre-monsoon': 'mung', monsoon: 'aman' } },
  { id: 'maize-jute-aman', plan: { winter: 'maize', 'pre-monsoon': 'jute', monsoon: 'aman' } },
  { id: 'maize-aus-aman', plan: { winter: 'maize', 'pre-monsoon': 'aus', monsoon: 'aman' } },
  { id: 'maize-sesame-aman', plan: { winter: 'maize', 'pre-monsoon': 'sesame', monsoon: 'aman' } },
  { id: 'maize-aman', plan: { winter: 'maize', 'pre-monsoon': null, monsoon: 'aman' } },
  {
    id: 'mustard-sesame-aman',
    plan: { winter: 'mustard', 'pre-monsoon': 'sesame', monsoon: 'aman' },
  },
  {
    id: 'lentil-sesame-aman',
    plan: { winter: 'lentil', 'pre-monsoon': 'sesame', monsoon: 'aman' },
  },
  { id: 'wheat-sesame-aman', plan: { winter: 'wheat', 'pre-monsoon': 'sesame', monsoon: 'aman' } },
  {
    id: 'potato-sesame-aman',
    plan: { winter: 'potato', 'pre-monsoon': 'sesame', monsoon: 'aman' },
  },
  // Crops added from the DAE district crop table and the BAMIS Rajshahi-region calendars. Chickpea
  // after Aman is the High Barind's rainfed pattern; garlic after Aman is Natore's. The rest are
  // combinations of these crops whose seasons fit, checked against the scheduler like those above.
  { id: 'chickpea-aman', plan: { winter: 'chickpea', 'pre-monsoon': null, monsoon: 'aman' } },
  {
    id: 'chickpea-jute-aman',
    plan: { winter: 'chickpea', 'pre-monsoon': 'jute', monsoon: 'aman' },
  },
  { id: 'garlic-aman', plan: { winter: 'garlic', 'pre-monsoon': null, monsoon: 'aman' } },
  { id: 'garlic-jute-aman', plan: { winter: 'garlic', 'pre-monsoon': 'jute', monsoon: 'aman' } },
  { id: 'onion-jute-aman', plan: { winter: 'onion', 'pre-monsoon': 'jute', monsoon: 'aman' } },
  { id: 'onion-aus-aman', plan: { winter: 'onion', 'pre-monsoon': 'aus', monsoon: 'aman' } },
  { id: 'brinjal-aman', plan: { winter: 'brinjal', 'pre-monsoon': null, monsoon: 'aman' } },
  {
    id: 'potato-groundnut-aman',
    plan: { winter: 'potato', 'pre-monsoon': 'groundnut', monsoon: 'aman' },
  },
  {
    id: 'mustard-groundnut-aman',
    plan: { winter: 'mustard', 'pre-monsoon': 'groundnut', monsoon: 'aman' },
  },
  // Black gram replaces Aman only on char and high land that does not hold water for rice, such as
  // sandy plots where Aman doesn't fit. The scoring would rank a pulse above Aman everywhere, so
  // these are suggested only when no pattern above fits the plot.
  {
    id: 'wheat-jute-blackgram',
    plan: { winter: 'wheat', 'pre-monsoon': 'jute', monsoon: 'blackgram' },
    standIn: true,
  },
  {
    id: 'mustard-jute-blackgram',
    plan: { winter: 'mustard', 'pre-monsoon': 'jute', monsoon: 'blackgram' },
    standIn: true,
  },
  {
    id: 'lentil-jute-blackgram',
    plan: { winter: 'lentil', 'pre-monsoon': 'jute', monsoon: 'blackgram' },
    standIn: true,
  },
];
