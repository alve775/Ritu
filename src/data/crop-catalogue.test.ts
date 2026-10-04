import { describe, expect, it } from 'vitest';
import { previewData, defaultFarm } from './preview';
import { cropIds } from '../domain/types';
import { initialState, isSavedState } from '../lib/storage';
import { evaluate, rotationsFor } from '../domain/evaluate';
import { cropGeometry } from '../components/crop-geometry';
import { cropModelNotes } from './crop-models';

describe('expanded crops across storage, checks and model coverage', () => {
  it.each(cropIds)('%s survives storage and keeps agronomic claims unassessed', (crop) => {
    const farm = { ...defaultFarm, current: [{ crop, start: 0, duration: 12 }] };
    expect(isSavedState({ ...initialState, farm })).toBe(true);
    const result = evaluate(rotationsFor(farm)[0], farm);
    expect(
      result.checks
        .filter((c) => ['water', 'soil', 'drainage'].includes(c.id))
        .every((c) => c.state === 'unknown'),
    ).toBe(true);
    expect(result.status).not.toBe('passes');
    expect(previewData.crops[crop].name.bn.length).toBeGreaterThan(0);
    if (crop !== 'fallow') expect(previewData.crops[crop].reference?.url).toMatch(/^https:\/\//);
    if (previewData.crops[crop].familyReviewed === false) expect(result.familyCount).toBe(0);
  });
  it('does not substitute a different plant for unsupported anatomy', () => {
    for (const crop of cropIds.filter((c) => !cropModelNotes[c]))
      expect(cropGeometry(crop, true).children).toHaveLength(0);
  });
});
