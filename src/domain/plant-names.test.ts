import { describe, expect, it } from 'vitest';
import { globalCrops, globalCrop } from './global-season';
import { commonPlantNames, plantDisplayName } from './plant-names';

describe('farmer-facing common plant names', () => {
  it('uses English and Bangla common names without Latin qualifiers', () => {
    expect(commonPlantNames(globalCrop('ecocrop-618')!)).toEqual({ en: 'Pepper', bn: 'মরিচ' });
    expect(commonPlantNames(globalCrop('ecocrop-7848')!)).toEqual({ en: 'Banana', bn: 'কলা' });
    expect(plantDisplayName(globalCrop('tomato')!, 'en')).toBe('Tomato');
    expect(plantDisplayName(globalCrop('tomato')!, 'bn')).toBe('টমেটো');
  });
  it('reuses sourced local common names without guessing a translation for unfamiliar species', () => {
    const garlic = globalCrops.find((p) => p.scientific === 'Allium sativum')!;
    expect(commonPlantNames(garlic).bn).toBe('রসুন');
    const unfamiliar = globalCrops.find((p) => p.scientific === 'Acacia auriculiformis')!;
    expect(commonPlantNames(unfamiliar).bn).toBeNull();
    expect(plantDisplayName(unfamiliar, 'bn')).toBe(unfamiliar.name.en);
  });
  it('keeps records without common names identifiable without presenting Latin as a common name', () => {
    const plant = globalCrop('ecocrop-17648')!;
    expect(plantDisplayName(plant, 'en')).toBe('Common name unrecorded · plant 17648');
    expect(plantDisplayName(plant, 'bn')).toBe('প্রচলিত নাম উৎসে নেই · গাছ ১৭৬৪৮');
    expect(plant.scientific).toBe('Eucalyptus camaldulensis, northern provenances');
  });
  it('never renders the source scientific name as a recommendation label for any retained plant', () => {
    for (const plant of globalCrops) {
      for (const language of ['en', 'bn'] as const) {
        const label = plantDisplayName(plant, language);
        expect(label, plant.id).toBeTruthy();
        expect(label.toLowerCase(), plant.id).not.toContain(plant.scientific.toLowerCase());
      }
    }
  });
});
