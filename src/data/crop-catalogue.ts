import type { Crop, CropCategory, CropId, Localized } from '../domain/types';

export const cropReferences = {
  barc: { name: 'BARC · Crop zoning crop list', url: 'https://apps.barc.gov.bd/cropzoning/' },
  fao: {
    name: 'FAO / DAE · Crop diversification in Bangladesh (historical)',
    url: 'https://www.fao.org/4/X6906E/x6906e04.htm',
  },
  priorities: {
    name: 'BARC · Research priorities (2011), crop groups pp. 32–36, 48',
    url: 'https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-barc/2024/12/50b5f466c2f44ed2af49b1bff23d516a.pdf',
  },
};
export const cropCategories: Record<CropCategory, Localized> = {
  cereal: { en: 'Cereals', bn: 'দানাশস্য' },
  pulse: { en: 'Pulses', bn: 'ডাল' },
  oilseed: { en: 'Oilseeds', bn: 'তেলবীজ' },
  vegetable: { en: 'Vegetables', bn: 'সবজি' },
  tuber: { en: 'Roots & tubers', bn: 'মূল ও কন্দ' },
  spice: { en: 'Spices', bn: 'মসলা' },
  fibre: { en: 'Fibre crops', bn: 'আঁশ ফসল' },
  sugar: { en: 'Sugar crops', bn: 'চিনি ফসল' },
  rest: { en: 'Rest', bn: 'বিরতি' },
};
// Sources establish the crop's identity in Bangladesh, not local suitability or a NASA-approved crop list.
// Extra families remain explicitly unreviewed until individually sourced taxonomy is added.
const entries: [CropId, string, string, CropCategory, keyof typeof cropReferences][] = [
  ['aus', 'Aus rice', 'আউশ ধান', 'cereal', 'barc'],
  ['maize', 'Maize', 'ভুট্টা', 'cereal', 'barc'],
  ['barley', 'Barley', 'যব', 'cereal', 'fao'],
  ['sorghum', 'Sorghum', 'জোয়ার', 'cereal', 'fao'],
  ['lentil', 'Lentil', 'মসুর ডাল', 'pulse', 'barc'],
  ['chickpea', 'Chickpea', 'ছোলা', 'pulse', 'barc'],
  ['blackgram', 'Black gram', 'মাষকলাই', 'pulse', 'barc'],
  ['pigeonpea', 'Pigeon pea', 'অড়হর', 'pulse', 'fao'],
  ['khesari', 'Grass pea / khesari', 'খেসারি', 'pulse', 'fao'],
  ['cowpea', 'Cowpea', 'ফেলন', 'pulse', 'fao'],
  ['mustard', 'Mustard', 'সরিষা', 'oilseed', 'barc'],
  ['groundnut', 'Groundnut', 'চিনাবাদাম', 'oilseed', 'barc'],
  ['soybean', 'Soybean', 'সয়াবিন', 'oilseed', 'fao'],
  ['sunflower', 'Sunflower', 'সূর্যমুখী', 'oilseed', 'fao'],
  ['sesame', 'Sesame', 'তিল', 'oilseed', 'priorities'],
  ['linseed', 'Linseed', 'তিসি', 'oilseed', 'priorities'],
  ['jute', 'Jute', 'পাট', 'fibre', 'barc'],
  ['cotton', 'Cotton', 'তুলা', 'fibre', 'fao'],
  ['sugarcane', 'Sugarcane', 'আখ', 'sugar', 'barc'],
  ['onion', 'Onion', 'পেঁয়াজ', 'spice', 'barc'],
  ['garlic', 'Garlic', 'রসুন', 'spice', 'barc'],
  ['chilli', 'Chilli', 'মরিচ', 'spice', 'barc'],
  ['sweetpotato', 'Sweet potato', 'মিষ্টি আলু', 'tuber', 'fao'],
  ['tomato', 'Tomato', 'টমেটো', 'vegetable', 'priorities'],
  ['brinjal', 'Brinjal / eggplant', 'বেগুন', 'vegetable', 'priorities'],
  ['cabbage', 'Cabbage', 'বাঁধাকপি', 'vegetable', 'priorities'],
  ['cauliflower', 'Cauliflower', 'ফুলকপি', 'vegetable', 'priorities'],
  ['okra', 'Okra', 'ঢেঁড়স', 'vegetable', 'priorities'],
  ['pumpkin', 'Pumpkin', 'মিষ্টি কুমড়া', 'vegetable', 'priorities'],
  ['bottlegourd', 'Bottle gourd', 'লাউ', 'vegetable', 'priorities'],
  ['cucumber', 'Cucumber', 'শসা', 'vegetable', 'priorities'],
  ['radish', 'Radish', 'মুলা', 'vegetable', 'priorities'],
  ['countrybean', 'Country bean', 'শিম', 'vegetable', 'priorities'],
  ['yardlongbean', 'Yard long bean', 'বরবটি', 'vegetable', 'priorities'],
  ['bittergourd', 'Bitter gourd', 'করলা', 'vegetable', 'priorities'],
  ['ashgourd', 'Ash gourd', 'চালকুমড়া', 'vegetable', 'priorities'],
  ['amaranth', 'Amaranth greens', 'ডাঁটা / লালশাক', 'vegetable', 'priorities'],
  ['indianspinach', 'Indian spinach', 'পুঁইশাক', 'vegetable', 'priorities'],
];
export const extraCrops = Object.fromEntries(
  entries.map(([id, en, bn, category, reference]) => [
    id,
    {
      id,
      name: { en, bn },
      category,
      familyReviewed: false,
      family: { en: 'Taxonomy not reviewed', bn: 'উদ্ভিদ পরিবার যাচাই বাকি' },
      color: category === 'cereal' ? 'wheat' : category === 'tuber' ? 'potato' : 'mung',
      household: id === 'aus' ? 'rice' : category === 'pulse' ? 'pulses' : undefined,
      reference: cropReferences[reference],
      description: {
        en: 'Listed in Bangladesh crop references. Choose dates from your own records; this preview supplies no validated growing window, suitability rule or anatomy model for this entry.',
        bn: 'বাংলাদেশের ফসলের উৎসে উল্লেখ আছে। নিজের তথ্য থেকে সময় বাছুন; এই ফসলের যাচাইকৃত সময়, উপযোগিতার শর্ত বা গঠনের নমুনা এখানে নেই।',
      },
    } satisfies Crop,
  ]),
) as Record<Exclude<CropId, 'boro' | 'aman' | 'wheat' | 'mung' | 'potato' | 'fallow'>, Crop>;
