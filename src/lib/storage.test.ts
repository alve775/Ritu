import { describe, expect, it } from 'vitest';
import { initialState, isSavedState } from './storage';
import { migrateRetiredCrop } from './retired-crop-migration';
import { validDemo } from './demo-store';
import { defaultDemo } from '../data/demo-environment';
describe('saved plan validation', () => {
  it('accepts the versioned default state', () => {
    expect(isSavedState(initialState)).toBe(true);
  });
  it('migrates retired crop history and preferences without resetting unrelated farm data', () => {
    const farm = { ...initialState.farm, name: 'My saved field', area: 4.5, soil: 'clay' };
    const saved = {
      ...initialState,
      language: 'bn',
      selected: 'demo-sorghum-aman-mustard',
      farm: { ...farm, current: [{ crop: 'sorghum', start: 0, duration: 3 }, ...farm.current] },
    };
    const migrated = migrateRetiredCrop(saved);
    expect(isSavedState(migrated)).toBe(true);
    expect(migrated).toEqual({ ...saved, selected: 'balanced', farm });
    const settings = { ...defaultDemo, location: 'other', weather: 'dry' };
    const choices = migrateRetiredCrop({ ...settings, preferred: ['sorghum', 'mung', 'mustard'] });
    expect(validDemo(choices)).toBe(true);
    expect(choices).toEqual({ ...settings, preferred: ['mung', 'mustard'] });
    expect(isSavedState(saved)).toBe(false);
  });
  it('keeps an empty crop history valid and still rejects corruption during retirement migration', () => {
    const saved = {
      ...initialState,
      farm: { ...initialState.farm, current: [{ crop: 'sorghum', start: 0, duration: 3 }] },
    };
    const migrated = migrateRetiredCrop(saved);
    expect(isSavedState(migrated)).toBe(true);
    expect(migrated).toMatchObject({
      farm: { current: [{ crop: 'fallow', start: 0, duration: 12 }] },
    });
    expect(isSavedState(migrateRetiredCrop({ ...saved, farm: { ...saved.farm, area: -1 } }))).toBe(
      false,
    );
    expect(validDemo(migrateRetiredCrop({ ...defaultDemo, preferred: ['sorghum', 'fake'] }))).toBe(
      false,
    );
  });
  it('rejects corrupt, stale and invalid farm records', () => {
    for (const value of [
      null,
      [],
      {},
      { ...initialState, version: 0 },
      { ...initialState, farm: { ...initialState.farm, irrigation: 'made-up' } },
      { ...initialState, farm: { ...initialState.farm, area: -1 } },
      {
        ...initialState,
        farm: { ...initialState.farm, current: [{ crop: 'boro', start: 15, duration: 4 }] },
      },
    ])
      expect(isSavedState(value)).toBe(false);
  });
});
