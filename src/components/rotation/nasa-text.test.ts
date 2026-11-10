import { describe, expect, it } from 'vitest';
import { rotationText } from './rotation-text';
import { rootWord, weekRainText } from './day-text';
import type { CropAssessment, DrySpell } from '../../domain/rotation';
import { rotationCrops } from '../../data/rotation-crops';

const en = rotationText((e) => e, 'en'),
  bn = rotationText((_, b) => b, 'bn');
const crop = (dry: DrySpell | null, presow = 0) =>
  ({
    item: { crop: rotationCrops.aman, sow: '2027-08-01' },
    dry,
    presow,
  }) as unknown as CropAssessment;
const spell: DrySpell = {
  chance: 0.29,
  years: 7,
  samples: 24,
  week: '2027-10-24',
  reliedMm: 79,
  extra: 2,
  expected: 0.5,
  high: false,
  raisesWater: false,
};

describe('NASA lines in the plan and calendar', () => {
  it('says how often, what to prepare and how long to pump', () => {
    const s = en.dry(crop(spell), 1);
    expect(s).toContain('In 7 of 24 years');
    expect(s).toContain('NASA IMERG');
    expect(s).toContain('2 extra irrigations');
    expect(s).toContain('15.5 pump hours');
    expect(bn.dry(crop(spell), 1)).toContain('২৪ বছরের ৭ বছরে');
  });
  it('adds why the risk is high, depending on the plot’s water', () => {
    expect(en.dry(crop({ ...spell, high: true }), 1)).toContain('reliable pump');
    expect(en.dry(crop({ ...spell, high: true, raisesWater: true }), 1)).toContain(
      'little water to spare',
    );
    expect(en.dry(crop(null), 1)).toBe('');
  });
  it('names the irrigation before sowing and its month', () => {
    const c = { ...crop(null, 40), item: { crop: rotationCrops.mustard, sow: '2026-11-10' } };
    expect(en.presow(c as CropAssessment, 1)).toContain('usually dry in November (NASA SMAP)');
    expect(en.presow(crop(null), 1)).toBe('');
  });
  it('puts weekly rain and root-zone wetness in words', () => {
    const t = (e: string) => e;
    expect(weekRainText(0.04, en, t)).toBe('Usually none');
    expect(weekRainText(1.77, en, t)).toBe('Usually 2 mm');
    expect(rootWord(0.2, t)).toBe('Usually dry');
    expect(rootWord(0.5, t)).toBe('Usually slightly moist');
    expect(rootWord(0.71, t)).toBe('Usually moist');
    expect(rootWord(null, t)).toBe('Not available');
  });
});
