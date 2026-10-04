import { describe, expect, it } from 'vitest';
import { initialState, isSavedState } from './storage';
describe('saved plan validation', () => {
  it('accepts the versioned default state', () => {
    expect(isSavedState(initialState)).toBe(true);
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
