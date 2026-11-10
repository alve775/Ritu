import { afterEach, describe, expect, it, vi } from 'vitest';

const getPhotos = vi.fn(async (ids: readonly string[]) => {
  const out = new Map<string, Blob>();
  for (const id of ids) if (id !== 'gone') out.set(id, new Blob(['jpeg'], { type: 'image/jpeg' }));
  return out;
});
vi.mock('./note-photos', () => ({ getPhotos }));
const { exportPayload, notePhotosKey } = await import('./export-records');
const { fieldLogStore } = await import('./field-log-store');

afterEach(() => vi.unstubAllGlobals());

describe('export file', () => {
  it('includes diary photos, read together in one go, so a delete cannot cut into the copy', async () => {
    const entries = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => entries.get(key) ?? null,
      setItem: (key: string, value: string) => entries.set(key, value),
      removeItem: (key: string) => entries.delete(key),
    });
    fieldLogStore.addNote({ plotId: 'plot-a', date: '2026-11-10', text: 'Aphids', photoId: 'p1' });
    fieldLogStore.addNote({ plotId: 'plot-a', date: '2026-11-10', text: 'Leaf', photoId: 'p2' });
    fieldLogStore.addNote({ plotId: 'plot-b', date: '2026-11-10', text: '', photoId: 'gone' });
    const pending = exportPayload();
    // The land is deleted while the copy is being made: the copy is still complete.
    fieldLogStore.removePlots(['plot-a']);
    const records = await pending;
    expect(getPhotos).toHaveBeenCalledTimes(1);
    expect(getPhotos).toHaveBeenCalledWith(['p1', 'p2', 'gone']);
    const photos = records[notePhotosKey] as Record<string, string>;
    expect(Object.keys(photos)).toEqual(['p1', 'p2']);
    expect(photos.p1).toMatch(/^data:image\/jpeg;base64,/);
    const notes = (records['ritu-field-log-v1'] as { notes: { text: string }[] }).notes;
    expect(notes.map((n) => n.text)).toEqual(['Aphids', 'Leaf', '']);
  });
});
