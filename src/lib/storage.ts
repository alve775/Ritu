import { defaultFarm } from '../data/preview';
import type { Farm, Language, Priority } from '../domain/types';
import { cropIds } from '../domain/types';

const key = 'ritu-preview-v1';
export interface SavedState {
  version: 1;
  farm: Farm;
  language: Language;
  priority: Priority;
  selected: string;
}
export const initialState: SavedState = {
  version: 1,
  farm: defaultFarm,
  language: 'en',
  priority: 'water',
  selected: 'balanced',
};
export function readSaved(): SavedState {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    if (!isSavedState(value)) return initialState;
    return value;
  } catch {
    return initialState;
  }
}
export function isSavedState(value: unknown): value is SavedState {
  if (!value || typeof value !== 'object') return false;
  const s = value as SavedState;
  const f = s.farm;
  return (
    s.version === 1 &&
    ['en', 'bn'].includes(s.language) &&
    ['water', 'diversity', 'familiar', 'resilience', 'soil'].includes(s.priority) &&
    typeof s.selected === 'string' &&
    (['current', 'balanced', 'diverse'].includes(s.selected) ||
      /^demo-[a-z0-9-]{1,100}$/.test(s.selected)) &&
    !!f &&
    typeof f.name === 'string' &&
    f.name.length <= 80 &&
    typeof f.area === 'number' &&
    f.area > 0 &&
    f.area <= 1000 &&
    ['reliable', 'limited', 'severe', 'rainfed', 'unknown'].includes(f.irrigation) &&
    ['loam', 'clay', 'sandy', 'unknown'].includes(f.soil) &&
    ['good', 'poor', 'unknown'].includes(f.drainage) &&
    Array.isArray(f.required) &&
    f.required.every((c) => ['rice', 'pulses', 'potato'].includes(c)) &&
    Array.isArray(f.unavailableMonths) &&
    f.unavailableMonths.every((m) => Number.isInteger(m) && m >= 0 && m < 12) &&
    Array.isArray(f.current) &&
    f.current.length > 0 &&
    f.current.length <= 12 &&
    f.current.every(
      (p) =>
        p &&
        cropIds.includes(p.crop) &&
        Number.isInteger(p.start) &&
        p.start >= 0 &&
        p.start < 12 &&
        Number.isInteger(p.duration) &&
        p.duration >= 1 &&
        p.duration <= 12,
    )
  );
}
export function saveState(state: SavedState): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
