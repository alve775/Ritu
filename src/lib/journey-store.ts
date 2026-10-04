import type { Rotation } from '../domain/types';
import { cropIds } from '../domain/types';
import { hasSafeTiming } from '../domain/demo-planner';
export interface ActivityRecord {
  planted: boolean;
  harvested: boolean;
  note: string;
}
export interface TrackedPlan {
  rotation: Rotation;
  fingerprint: string;
  year: number;
  records: Record<string, ActivityRecord>;
}
export interface Journey {
  reviewed: string | null;
  generatedFor: string | null;
  tracked: TrackedPlan | null;
}
const initial: Journey = { reviewed: null, generatedFor: null, tracked: null };
const server = { state: initial, saved: true };
let snapshot = server;
let loaded = false;
const listeners = new Set<() => void>();
export const activityKey = (crop: string, start: number, duration: number) =>
  `${crop}-${start}-${duration}`;
export function validJourney(value: unknown): value is Journey {
  if (!value || typeof value !== 'object') return false;
  const v = value as Journey;
  const text = (s: unknown) => s === null || (typeof s === 'string' && s.length <= 10000);
  if (!text(v.reviewed) || !text(v.generatedFor)) return false;
  if (v.tracked === null) return true;
  const p = v.tracked;
  if (
    !p ||
    typeof p.fingerprint !== 'string' ||
    p.fingerprint.length > 10000 ||
    !Number.isInteger(p.year) ||
    p.year < 2000 ||
    p.year > 2100 ||
    !p.rotation ||
    typeof p.rotation.id !== 'string' ||
    !/^demo-[a-z0-9-]{1,100}$/.test(p.rotation.id)
  )
    return false;
  const r = p.rotation;
  if (
    ![r.name, r.subtitle].every(
      (label) =>
        label &&
        typeof label.en === 'string' &&
        typeof label.bn === 'string' &&
        label.en.length <= 500 &&
        label.bn.length <= 500,
    ) ||
    !Array.isArray(r.periods) ||
    r.periods.length > 12 ||
    !r.periods.every((period) => period && cropIds.includes(period.crop)) ||
    !hasSafeTiming(r.periods) ||
    r.periods.reduce((n, period) => n + period.duration, 0) !== 12
  )
    return false;
  const keys = r.periods
    .filter((period) => period.crop !== 'fallow')
    .map((period) => activityKey(period.crop, period.start, period.duration));
  return (
    keys.length === 3 &&
    !!p.records &&
    typeof p.records === 'object' &&
    keys.length === Object.keys(p.records).length &&
    keys.every((key) => {
      const record = p.records[key];
      return (
        record &&
        typeof record.planted === 'boolean' &&
        typeof record.harvested === 'boolean' &&
        (!record.harvested || record.planted) &&
        typeof record.note === 'string' &&
        record.note.length <= 500
      );
    })
  );
}
function persist(state: Journey) {
  let saved = true;
  try {
    localStorage.setItem('ritu-journey-v1', JSON.stringify(state));
  } catch {
    saved = false;
  }
  snapshot = { state, saved };
  listeners.forEach((listener) => listener());
}
export const journeyStore = {
  getSnapshot: () => snapshot,
  getServerSnapshot: () => server,
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (!loaded) {
      loaded = true;
      let state = initial;
      try {
        const value: unknown = JSON.parse(localStorage.getItem('ritu-journey-v1') ?? 'null');
        if (validJourney(value)) state = value;
      } catch {
        /* Keep the unreviewed journey. */
      }
      persist(state);
    }
    return () => {
      listeners.delete(listener);
    };
  },
  update(change: Partial<Journey>) {
    persist({ ...snapshot.state, ...change });
  },
  reset() {
    persist(initial);
  },
};
