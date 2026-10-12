import { coveredMonths } from './evaluate';
import type { CropId, CropPeriod } from './types';

/** Ritu's cycle starts in March: months 0–3 pre-monsoon, 4–7 monsoon, 8–11 winter. */
export type SeasonIndex = 0 | 1 | 2;
export const seasonOfMonth = (month: number): SeasonIndex =>
  Math.floor((((month % 12) + 12) % 12) / 4) as SeasonIndex;

export interface Point {
  x: number;
  y: number;
}
const round = (n: number) => Math.round(n * 100) / 100 + 0;

/** Degrees start at 12 o'clock and increase clockwise. */
export function polar(cx: number, cy: number, r: number, degrees: number): Point {
  const radians = (degrees * Math.PI) / 180;
  return { x: round(cx + r * Math.sin(radians)), y: round(cy - r * Math.cos(radians)) };
}

const MAX_SWEEP = 359.99;

/** Closed path for a ring sector covering `months` months from `startMonth`, inset `gap`° each end. */
export function ringSector(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  startMonth: number,
  months: number,
  gap = 0,
): string {
  const sweep = Math.min(MAX_SWEEP, Math.max(0.01, months * 30 - gap * 2));
  const a0 = startMonth * 30 + gap;
  const a1 = a0 + sweep;
  const large = sweep > 180 ? 1 : 0;
  const o0 = polar(cx, cy, outer, a0);
  const o1 = polar(cx, cy, outer, a1);
  const i1 = polar(cx, cy, inner, a1);
  const i0 = polar(cx, cy, inner, a0);
  return `M ${o0.x} ${o0.y} A ${outer} ${outer} 0 ${large} 1 ${o1.x} ${o1.y} L ${i1.x} ${i1.y} A ${inner} ${inner} 0 ${large} 0 ${i0.x} ${i0.y} Z`;
}

export interface WheelGeometry {
  size: number;
  center: number;
  inner: number;
  outer: number;
  labelRadius: number;
  monthRadius: number;
  hitInner: number;
  hitOuter: number;
}
export const fullWheel: WheelGeometry = {
  size: 320,
  center: 160,
  inner: 100,
  outer: 130,
  labelRadius: 142,
  monthRadius: 86,
  hitInner: 70,
  hitOuter: 158,
};
export const miniWheel: WheelGeometry = {
  size: 48,
  center: 24,
  inner: 13,
  outer: 22,
  labelRadius: 0,
  monthRadius: 0,
  hitInner: 0,
  hitOuter: 0,
};

export interface WheelSegment {
  crop: CropId;
  start: number;
  duration: number;
  kind: 'crop' | 'rest';
  season: SeasonIndex;
  path: string;
  /** Open arc for <textPath>; drawn counter-clockwise on the lower half so text stays upright. */
  labelPath: string;
  markerPoint: Point;
}

function labelArc(g: WheelGeometry, start: number, duration: number): string {
  const a0 = start * 30 + 2;
  const a1 = (start + duration) * 30 - 2;
  const mid = (a0 + a1) / 2;
  const flipped = mid > 90 && mid < 270;
  const sweep = Math.min(MAX_SWEEP, a1 - a0);
  const large = sweep > 180 ? 1 : 0;
  const r = flipped ? g.labelRadius + 6 : g.labelRadius;
  const from = polar(g.center, g.center, r, flipped ? a1 : a0);
  const to = polar(g.center, g.center, r, flipped ? a0 : a0 + sweep);
  return `M ${from.x} ${from.y} A ${r} ${r} 0 ${large} ${flipped ? 0 : 1} ${to.x} ${to.y}`;
}

export function wheelSegments(periods: CropPeriod[], g: WheelGeometry, gap = 1.5): WheelSegment[] {
  return [...periods]
    .sort((a, b) => a.start - b.start)
    .map((p) => ({
      crop: p.crop,
      start: p.start,
      duration: p.duration,
      kind: p.crop === 'fallow' ? 'rest' : 'crop',
      season: seasonOfMonth(p.start),
      path: ringSector(g.center, g.center, g.inner, g.outer, p.start, p.duration, gap),
      labelPath: labelArc(g, p.start, p.duration),
      markerPoint: polar(g.center, g.center, (g.inner + g.outer) / 2, (p.start + 0.5) * 30),
    }));
}

/** A crop arc filled to `fraction` (0–1) of its length, for tracking progress. */
export function progressSector(
  g: WheelGeometry,
  start: number,
  duration: number,
  fraction: number,
  gap = 1.5,
): string | null {
  const f = Math.max(0, Math.min(1, fraction));
  if (f === 0) return null;
  return ringSector(g.center, g.center, g.inner, g.outer, start, duration * f, gap);
}

/** Invisible wedge spanning the ring and its labels: the ≥44px tap target for one month. */
export function monthHitPath(g: WheelGeometry, month: number): string {
  return ringSector(g.center, g.center, g.hitInner, g.hitOuter, month, 1, 0);
}

export function monthLabelPoint(g: WheelGeometry, month: number): Point {
  return polar(g.center, g.center, g.monthRadius, (month + 0.5) * 30);
}

export function cropAtMonth(periods: CropPeriod[], month: number): CropPeriod | null {
  return periods.find((p) => coveredMonths(p).includes(month)) ?? null;
}
