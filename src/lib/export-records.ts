import { seasonStorageKey, seasonStore } from './season-store';
import { evidenceStore } from './evidence-store';
import { fieldLogStorageKey, fieldLogStore } from './field-log-store';
import { getPhotos } from './note-photos';

/** Key of the diary photos in the export file. */
export const notePhotosKey = 'ritu-note-photos';

/**
 * Diary photos (kept in IndexedDB, not localStorage) as data URLs by photo id. The ids are taken
 * from the notes at the moment of export and read in one transaction.
 */
async function notePhotos(ids: string[]) {
  const out: Record<string, string> = {};
  let blobs = new Map<string, Blob>();
  try {
    blobs = await getPhotos(ids);
  } catch {
    /* Photo store unavailable: the note text is still exported. */
  }
  for (const [id, blob] of blobs) out[id] = await dataUrl(blob);
  return out;
}
async function dataUrl(blob: Blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return `data:${blob.type || 'image/jpeg'};base64,${btoa(binary)}`;
}

/**
 * Download every saved record (lands, plots, crops, notes and their photos) as one JSON file.
 * Resolves once the file has been handed to the browser.
 */
export function exportRecords() {
  return exportPayload().then(download);
}
/** Everything the export file holds, by storage key, as it is at the moment of the call. */
export async function exportPayload() {
  const log = fieldLogStore.getSnapshot().state;
  const ids = [...new Set(log.notes.flatMap((n) => (n.photoId ? [n.photoId] : [])))];
  const records: Record<string, unknown> = {
    [seasonStorageKey]: seasonStore.getSnapshot().state,
    'ritu-evidence-v2': evidenceStore.getSnapshot().state,
    // Note text and reminders, and the photos from the phone's photo store.
    [fieldLogStorageKey]: log,
    [notePhotosKey]: await notePhotos(ids),
  };
  try {
    const original = localStorage.getItem('ritu-evidence-v2');
    if (original && original !== JSON.stringify(records['ritu-evidence-v2'])) {
      records['ritu-evidence-v2-stored-original'] = original;
    }
  } catch {
    /* The in-tab draft remains exportable when storage is unavailable. */
  }
  try {
    if (seasonStore.getSnapshot().recovery) {
      const original = localStorage.getItem(seasonStorageKey);
      if (original) records[`${seasonStorageKey}-unreadable-original`] = original;
    }
  } catch {
    /* The valid in-tab state is still exported. */
  }
  for (const key of [
    'ritu-evidence-v2-recovery',
    'ritu-preview-v1',
    `${seasonStorageKey}-recovery`,
  ]) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          records[key] = JSON.parse(raw);
        } catch {
          records[key] = raw;
        }
      }
    } catch {
      /* In-tab farms remain exportable. */
    }
  }
  return records;
}
function download(records: Record<string, unknown>) {
  const blob = new Blob(
    [JSON.stringify({ exportedAt: new Date().toISOString(), records }, null, 2)],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = 'ritu-farm-records.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
