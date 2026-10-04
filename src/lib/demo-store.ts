import { defaultDemo } from '../data/demo-environment';
import type { DemoSettings } from '../data/demo-environment';
import { cropIds } from '../domain/types';
import { migrateRetiredCrop } from './retired-crop-migration';
const key = 'ritu-demo-v1';
const server = { settings: defaultDemo, saved: true };
let snapshot = server;
let loaded = false;
const listeners = new Set<() => void>();
export function validDemo(value: unknown): value is DemoSettings {
  if (!value || typeof value !== 'object') return false;
  const s = value as DemoSettings;
  return (
    ['barind', 'other'].includes(s.location) &&
    ['seasonal', 'dry', 'hot'].includes(s.weather) &&
    typeof s.enabled === 'boolean' &&
    Array.isArray(s.preferred) &&
    s.preferred.length <= cropIds.length &&
    new Set(s.preferred).size === s.preferred.length &&
    s.preferred.every((c) => cropIds.includes(c) && c !== 'fallow')
  );
}
function persist(settings: DemoSettings) {
  let saved = true;
  try {
    localStorage.setItem(key, JSON.stringify(settings));
  } catch {
    saved = false;
  }
  snapshot = { settings, saved };
  listeners.forEach((l) => l());
}
export const demoStore = {
  getSnapshot: () => snapshot,
  getServerSnapshot: () => server,
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (!loaded) {
      loaded = true;
      let settings = defaultDemo;
      try {
        const value: unknown = migrateRetiredCrop(JSON.parse(localStorage.getItem(key) ?? 'null'));
        if (validDemo(value)) settings = value;
      } catch {
        /* Use labelled default fixtures. */
      }
      persist(settings);
    }
    return () => {
      listeners.delete(listener);
    };
  },
  update(change: Partial<DemoSettings>) {
    persist({ ...snapshot.settings, ...change });
  },
  reset() {
    persist({ ...defaultDemo, preferred: [] });
  },
};
