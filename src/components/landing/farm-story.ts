/** Editorial storyboard timing, in seconds. This is a compressed illustration, not a growing calendar. */
export const farmChapters = [
  { id: 'sow', start: 0, duration: 3 },
  { id: 'care', start: 3, duration: 3 },
  { id: 'grow', start: 6, duration: 3 },
  { id: 'harvest', start: 9, duration: 3 },
] as const;
export const farmStoryDuration = 12;
export function farmStoryFrame(time: number) {
  const elapsed = Number.isFinite(time)
    ? ((time % farmStoryDuration) + farmStoryDuration) % farmStoryDuration
    : 0;
  const index = Math.max(
      0,
      farmChapters.findIndex((c) => elapsed < c.start + c.duration),
    ),
    chapter = farmChapters[index],
    local = elapsed - chapter.start;
  return {
    index,
    elapsed,
    progress: local / chapter.duration,
    opacity: Math.min(1, local / 0.45, (chapter.duration - local) / 0.45),
  };
}
