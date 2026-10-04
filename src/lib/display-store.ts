export interface DisplayPreferences {
  text: 'comfortable' | 'larger';
  motion: boolean;
  sound: boolean;
  volume: number;
  ambience: 'morning' | 'evening';
}
const defaults: DisplayPreferences = {
  text: 'comfortable',
  motion: true,
  sound: false,
  volume: 35,
  ambience: 'morning',
};
const server = { preferences: defaults, saved: true };
let snapshot = server;
let initialized = false;
const listeners = new Set<() => void>();
const key = 'ritu-display-v1';
function apply() {
  document.documentElement.dataset.textSize = snapshot.preferences.text;
  document.documentElement.dataset.motion = snapshot.preferences.motion ? 'on' : 'off';
  document.dispatchEvent(new Event('ritu-motion-change'));
}
export const displayStore = {
  getServerSnapshot: () => server,
  getSnapshot: () => snapshot,
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (!initialized) {
      initialized = true;
      try {
        const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
        if (
          parsed &&
          typeof parsed === 'object' &&
          'text' in parsed &&
          'motion' in parsed &&
          'sound' in parsed &&
          (parsed.text === 'comfortable' || parsed.text === 'larger') &&
          typeof parsed.motion === 'boolean' &&
          typeof parsed.sound === 'boolean'
        )
          snapshot = {
            preferences: {
              text: parsed.text,
              motion: parsed.motion,
              sound: parsed.sound,
              volume:
                'volume' in parsed &&
                typeof parsed.volume === 'number' &&
                Number.isFinite(parsed.volume)
                  ? Math.max(0, Math.min(100, parsed.volume))
                  : defaults.volume,
              ambience:
                'ambience' in parsed && parsed.ambience === 'evening' ? 'evening' : 'morning',
            },
            saved: true,
          };
      } catch {
        snapshot = { ...snapshot, saved: false };
      }
      apply();
      listeners.forEach((notify) => notify());
    }
    return () => {
      listeners.delete(listener);
    };
  },
  update(change: Partial<DisplayPreferences>) {
    const preferences = { ...snapshot.preferences, ...change };
    let saved = true;
    try {
      localStorage.setItem(key, JSON.stringify(preferences));
    } catch {
      saved = false;
    }
    snapshot = { preferences, saved };
    apply();
    listeners.forEach((notify) => notify());
  },
};
