import { describe, it, expect } from 'vitest';
import { farmStoryFrame, farmChapters, farmStoryDuration } from './farm-story';
describe('sequential two-dimensional farm storyboard', () => {
  it('advances one chapter at a time, then replays sowing', () => {
    expect(
      [0, 6.99, 7, 13.99, 14, 22.99, 23, 30.99, 31, 38].map(
        (t) => farmChapters[farmStoryFrame(t).index].id,
      ),
    ).toEqual(['sow', 'sow', 'care', 'care', 'grow', 'grow', 'harvest', 'harvest', 'sow', 'care']);
  });
  it('uses a zero-opacity handoff and readable holds, without two active actions', () => {
    for (const c of farmChapters) {
      expect(farmStoryFrame(c.start).opacity).toBe(0);
      expect(farmStoryFrame(c.start + 1).opacity).toBe(1);
      expect(farmStoryFrame(c.start + c.duration - 0.1).opacity).toBeCloseTo(0.1 / 0.45, 8);
    }
  });
  it('keeps malformed or long-running clocks bounded', () => {
    for (const t of [NaN, Infinity, -2, 1e8]) {
      const f = farmStoryFrame(t);
      expect(f.index).toBeGreaterThanOrEqual(0);
      expect(f.index).toBeLessThan(4);
      expect(f.progress).toBeGreaterThanOrEqual(0);
      expect(f.progress).toBeLessThan(1);
      expect(f.elapsed).toBeLessThan(farmStoryDuration);
    }
  });
});
