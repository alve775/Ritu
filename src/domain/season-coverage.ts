import type { DemoSuggestion } from './demo-planner';
import type { CropId } from './types';

export type CoverageState = 'chosen' | 'missing' | 'unavailable';

/**
 * Per-season state for the Crops "Your year" tracker. It mirrors the existing `unavailable`
 * and `unselected` logic in SuggestedCropsView, so the tracker and the status message never disagree.
 */
export function seasonCoverage(
  suggestions: DemoSuggestion[],
  offered: DemoSuggestion[],
  preferred: CropId[],
): [CoverageState, CoverageState, CoverageState] {
  return [0, 1, 2].map((season) =>
    !suggestions.some((s) => s.season === season)
      ? 'unavailable'
      : offered.some((s) => s.season === season && preferred.includes(s.period.crop))
        ? 'chosen'
        : 'missing',
  ) as [CoverageState, CoverageState, CoverageState];
}
