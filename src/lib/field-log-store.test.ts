import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fieldLogStore } from './field-log-store';

beforeEach(() => {
  const entries = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  });
  // Start from an empty log.
  fieldLogStore.removePlots(fieldLogStore.getSnapshot().state.notes.map((n) => n.plotId));
});
afterEach(() => vi.unstubAllGlobals());

describe('field log when a land goes', () => {
  it('deletes the notes and irrigation records of the given plots only, and returns the notes', () => {
    const note = (plotId: string) =>
      fieldLogStore.addNote({ plotId, date: '2026-11-10', text: `On ${plotId}` });
    const a = note('plot-a'),
      b = note('plot-b');
    fieldLogStore.recordIrrigation('plot-a', 'winter:2026-11-16', '2026-11-17');
    fieldLogStore.recordIrrigation('plot-a', 'winter:presow:2026-10-25', '2026-11-08');
    fieldLogStore.recordIrrigation('plot-b', 'winter:2026-11-16', '2026-11-17');
    const gone = fieldLogStore.removePlots(['plot-a']);
    expect(gone.map((n) => n.id)).toEqual([a.id]);
    const s = fieldLogStore.getSnapshot().state;
    expect(s.notes.map((n) => n.id)).toEqual([b.id]);
    expect(s.irrigations.map((r) => r.plotId)).toEqual(['plot-b']);
  });
});
