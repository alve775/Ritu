import { describe, expect, it } from 'vitest';
import { defaultFarm, previewData } from '../data/preview';
import { rotationsFor } from './evaluate';
import { activitiesForMonth } from './season';

describe('seasonal field inspector', () => {
  it('keeps February–March progress consistent for the recurring Boro crop', () => {
    const rotation = rotationsFor(defaultFarm)[0];
    expect(activitiesForMonth(rotation, 10)[0].phase).toBe('planting');
    expect(activitiesForMonth(rotation, 11)[0].progress).toBeCloseTo(1 / 3);
    expect(activitiesForMonth(rotation, 0)[0].progress).toBeCloseTo(2 / 3);
    expect(activitiesForMonth(rotation, 1)[0].phase).toBe('harvest');
  });
  it('distinguishes explicit rest from unknown months', () => {
    expect(activitiesForMonth(previewData.alternatives[0], 3)[0].phase).toBe('rest');
    expect(activitiesForMonth({ ...previewData.alternatives[0], periods: [] }, 3)).toEqual([]);
  });
  it('returns every conflicting period, instead of hiding one in the field view', () => {
    const rotation = {
      ...previewData.alternatives[0],
      periods: [
        { crop: 'mung' as const, start: 0, duration: 3 },
        { crop: 'wheat' as const, start: 0, duration: 4 },
      ],
    };
    expect(activitiesForMonth(rotation, 0)).toHaveLength(2);
  });
  it('labels a one-month crop as both planting and harvest', () => {
    const rotation = {
      ...previewData.alternatives[0],
      periods: [{ crop: 'mung' as const, start: 0, duration: 1 }],
    };
    expect(activitiesForMonth(rotation, 0)[0].phase).toBe('plant-and-harvest');
  });
});
