import { describe, expect, it } from 'vitest';
import { seasonCoverage } from './season-coverage';
import type { DemoSuggestion } from './demo-planner';

const suggestion = (crop: DemoSuggestion['period']['crop'], season: number): DemoSuggestion => ({
  season,
  period: { crop, start: season * 4, duration: 2 },
  assessment: {} as DemoSuggestion['assessment'],
});
const all = [suggestion('mung', 0), suggestion('aman', 1), suggestion('mustard', 2)];

describe('seasonCoverage', () => {
  it('marks every season chosen when each has a preferred offered crop', () => {
    expect(seasonCoverage(all, all, ['mung', 'aman', 'mustard'])).toEqual([
      'chosen',
      'chosen',
      'chosen',
    ]);
  });
  it('marks seasons without a preferred crop as missing', () => {
    expect(seasonCoverage(all, all, ['aman'])).toEqual(['missing', 'chosen', 'missing']);
  });
  it('marks seasons with no suggestion at all as unavailable, even if a crop is preferred', () => {
    const onlyMonsoon = [suggestion('aman', 1)];
    expect(seasonCoverage(onlyMonsoon, onlyMonsoon, ['aman', 'mung'])).toEqual([
      'unavailable',
      'chosen',
      'unavailable',
    ]);
  });
  it('ignores preferred crops that are not offered', () => {
    expect(seasonCoverage(all, [suggestion('aman', 1)], ['mung', 'aman'])).toEqual([
      'missing',
      'chosen',
      'missing',
    ]);
  });
});
