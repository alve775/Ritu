import { describe, expect, it } from 'vitest';
import requirements from './global/crop-requirements.json' with { type: 'json' };
import { cropJobs } from './crop-jobs';
import { rotationCropIds, rotationCrops, rotationPatterns } from './rotation-crops';
import { globalCrop } from '../domain/global-season';
import { schedulePlan } from '../domain/rotation/schedule';

const ecocrop = new Map(
  (
    requirements as { crops: { id: string; PHMIN: number | null; PHMAX: number | null }[] }
  ).crops.map((c) => [c.id, c]),
);
const added = ['chickpea', 'onion', 'garlic', 'brinjal', 'groundnut', 'blackgram'] as const;

describe('year-plan crops', () => {
  it('fits every suggested pattern in one year, starting in winter or in the rainy season', () => {
    for (const from of ['2026-10-10', '2026-11-07', '2027-07-01'])
      for (const p of rotationPatterns)
        expect([p.id, from, schedulePlan(p.plan, from).problems]).toEqual([p.id, from, []]);
  });
  it('has a plant-catalogue entry for every crop', () => {
    for (const id of rotationCropIds)
      expect([id, !!globalCrop(rotationCrops[id].catalogueId)]).toEqual([id, true]);
  });
  it('takes the pH range of the added crops from ECOCROP', () => {
    for (const id of added) {
      const c = ecocrop.get(rotationCrops[id].catalogueId)!;
      expect([id, rotationCrops[id].ph]).toEqual([id, [c.PHMIN, c.PHMAX]]);
    }
  });
  it('gives every crop field jobs inside its season, in order', () => {
    for (const id of rotationCropIds) {
      const days = cropJobs[id].map((j) => j.day);
      expect([id, days.length > 0]).toEqual([id, true]);
      expect([id, [...days].sort((a, b) => a - b)]).toEqual([id, days]);
      expect([id, days.every((d) => d > 0 && d < rotationCrops[id].days)]).toEqual([id, true]);
    }
  });
  it('places the added crops in their seasons', () => {
    expect(added.map((id) => rotationCrops[id].season)).toEqual([
      'winter',
      'winter',
      'winter',
      'winter',
      'pre-monsoon',
      'monsoon',
    ]);
  });
});
