import { initialState, readSaved, saveState } from './storage';
import type { SavedState } from './storage';

// Server rendering always uses this deterministic snapshot. Browser storage is
// read only when React subscribes on the client, avoiding hydration differences.
const serverSnapshot = { state: initialState, ready: false, saved: true };
let snapshot = serverSnapshot;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}
export const plannerStore = {
  getServerSnapshot: () => serverSnapshot,
  getSnapshot: () => snapshot,
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (!snapshot.ready) {
      const state = readSaved();
      snapshot = { state, ready: true, saved: saveState(state) };
      emit();
    }
    return () => {
      listeners.delete(listener);
    };
  },
  update(change: (current: SavedState) => SavedState) {
    const state = change(snapshot.state);
    snapshot = { state, ready: true, saved: saveState(state) };
    emit();
  },
};
