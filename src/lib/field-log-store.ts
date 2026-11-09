import { useSyncExternalStore } from 'react';
import {
  blankFieldLog,
  validFieldLog,
  validNote,
  type FieldLogState,
  type FieldNote,
  type ReminderTime,
} from '../domain/field-log';

/** Notes, reminders and recorded irrigations, kept on this device beside the season records. */
export const fieldLogStorageKey = 'ritu-field-log-v1';
const server = { state: blankFieldLog, ready: false, saved: true };
let snapshot = server,
  loaded = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

function save(state: FieldLogState) {
  if (!validFieldLog(state)) throw Error('Check the note and reminder values.');
  let saved = true;
  try {
    localStorage.setItem(fieldLogStorageKey, JSON.stringify(state));
  } catch {
    saved = false;
  }
  snapshot = { state, ready: true, saved };
  notify();
}
const current = () => snapshot.state;

export const fieldLogStore = {
  getSnapshot: () => snapshot,
  getServerSnapshot: () => server,
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (!loaded) {
      loaded = true;
      window.addEventListener('storage', (event) => {
        if (event.key !== fieldLogStorageKey && event.key !== null) return;
        try {
          const state: unknown = event.newValue ? JSON.parse(event.newValue) : blankFieldLog;
          if (validFieldLog(state)) {
            snapshot = { state, ready: true, saved: true };
            notify();
          }
        } catch {
          /* Keep this tab's valid records. */
        }
      });
      let state = blankFieldLog;
      try {
        const raw = localStorage.getItem(fieldLogStorageKey);
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        if (validFieldLog(parsed)) state = parsed;
        else if (parsed && typeof parsed === 'object') {
          // Keep every readable note from a partly damaged record.
          const p = parsed as Partial<FieldLogState>;
          state = {
            ...blankFieldLog,
            notes: Array.isArray(p.notes) ? p.notes.filter(validNote) : [],
          };
          localStorage.setItem(`${fieldLogStorageKey}-recovery`, raw!);
        }
      } catch {
        /* Storage blocked: start empty in this tab. */
      }
      snapshot = { state, ready: true, saved: true };
      notify();
    }
    return () => {
      listeners.delete(listener);
    };
  },
  addNote(note: Omit<FieldNote, 'id' | 'createdAt'>) {
    const full: FieldNote = {
      ...note,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    save({ ...current(), notes: [...current().notes, full] });
    return full;
  },
  /** Change a note's text or tags; the day, photo and reminder stay. */
  updateNote(id: string, patch: Pick<FieldNote, 'text' | 'tags'>) {
    save({
      ...current(),
      notes: current().notes.map((n) =>
        n.id === id ? { ...n, ...patch, updatedAt: new Date().toISOString() } : n,
      ),
    });
  },
  removeNote(id: string) {
    const note = current().notes.find((n) => n.id === id);
    save({ ...current(), notes: current().notes.filter((n) => n.id !== id) });
    return note;
  },
  restoreNote(note: FieldNote) {
    if (current().notes.some((n) => n.id === note.id)) return;
    save({ ...current(), notes: [...current().notes, note] });
  },
  setReminderDone(id: string, done: boolean) {
    save({
      ...current(),
      notes: current().notes.map((n) =>
        n.id === id && n.reminder ? { ...n, reminder: { ...n.reminder, done } } : n,
      ),
    });
  },
  moveReminder(id: string, date: string, time?: ReminderTime) {
    save({
      ...current(),
      notes: current().notes.map((n) =>
        n.id === id && n.reminder
          ? { ...n, reminder: { date, time: time ?? n.reminder.time, done: false } }
          : n,
      ),
    });
  },
  recordIrrigation(plotId: string, key: string, date: string) {
    const rest = current().irrigations.filter((r) => !(r.plotId === plotId && r.key === key));
    save({
      ...current(),
      irrigations: [...rest, { plotId, key, date, savedAt: new Date().toISOString() }],
    });
  },
  removeIrrigation(plotId: string, key: string) {
    save({
      ...current(),
      irrigations: current().irrigations.filter((r) => !(r.plotId === plotId && r.key === key)),
    });
  },
  setNotify(on: boolean) {
    save({ ...current(), notify: on });
  },
  reset() {
    try {
      localStorage.removeItem(fieldLogStorageKey);
      localStorage.removeItem(`${fieldLogStorageKey}-recovery`);
    } catch {
      /* In-tab reset still applies. */
    }
    snapshot = { state: blankFieldLog, ready: true, saved: true };
    notify();
  },
};
export function useFieldLog() {
  return useSyncExternalStore(
    fieldLogStore.subscribe,
    fieldLogStore.getSnapshot,
    fieldLogStore.getServerSnapshot,
  );
}
