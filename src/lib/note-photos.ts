import { useEffect, useState } from 'react';

/** Note photos live in IndexedDB: they are too large for localStorage beside the season records. */
const dbName = 'ritu-note-photos',
  storeName = 'photos';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function run<T>(mode: IDBTransactionMode, work: (s: IDBObjectStore) => IDBRequest<T>) {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const request = work(tx.objectStore(storeName));
    tx.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}
export const putPhoto = (id: string, blob: Blob) => run('readwrite', (s) => s.put(blob, id));
export const getPhoto = (id: string) => run<Blob | undefined>('readonly', (s) => s.get(id));
export const deletePhoto = (id: string) => run('readwrite', (s) => s.delete(id));
export async function clearPhotos() {
  try {
    await run('readwrite', (s) => s.clear());
  } catch {
    /* Nothing stored. */
  }
}

/** Shrinks a camera photo to at most 1024 px on the long side, as JPEG, before it is stored. */
export async function shrinkPhoto(file: Blob, longSide = 1024): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, longSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(Error('Photo could not be read'))),
      'image/jpeg',
      0.75,
    ),
  );
}

/** An object URL for a stored photo, released when the note leaves the screen. */
export function useNotePhoto(id: string | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    let alive = true,
      made: string | null = null;
    getPhoto(id)
      .then((blob) => {
        if (!alive || !blob) return;
        made = URL.createObjectURL(blob);
        setUrl(made);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      if (made) URL.revokeObjectURL(made);
      setUrl(null);
    };
  }, [id]);
  return url;
}
