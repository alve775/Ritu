// Bounded motion only: no idle animation loop, and no motion for reduced-motion users.
export const smoothEase = (progress: number) =>
  progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2;

export function prefersReducedMotion() {
  return (
    document.documentElement.dataset.motion === 'off' ||
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function animateFrame(
  duration: number,
  update: (progress: number) => void,
  complete: () => void = () => {},
) {
  let frame = 0;
  let start: number | null = null;
  const tick = (now: number) => {
    start ??= now;
    const progress = prefersReducedMotion() ? 1 : Math.min(1, (now - start) / duration);
    update(smoothEase(progress));
    if (progress < 1) frame = requestAnimationFrame(tick);
    else complete();
  };
  if (prefersReducedMotion()) {
    update(1);
    complete();
  } else frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}
