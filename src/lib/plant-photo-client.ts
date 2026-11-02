import type { PlantPhoto } from '../domain/plant-photo';
const cache = new Map<string, { expires: number; value: Promise<PlantPhoto | null> }>();
const waiting = new Map<
  string,
  { resolve: (photo: PlantPhoto | null) => void; reject: (error: Error) => void }
>();
let timer: ReturnType<typeof setTimeout> | undefined;
async function flush() {
  timer = undefined;
  const entries = [...waiting.entries()];
  waiting.clear();
  for (let offset = 0; offset < entries.length; offset += 12) {
    const batch = entries.slice(offset, offset + 12);
    try {
      const r = await fetch(
        `/api/plant-photo?plants=${encodeURIComponent(batch.map(([id]) => id).join(','))}`,
      );
      if (!r.ok) throw Error('Image source is temporarily unavailable.');
      const data = await r.json();
      if (!data.photos || typeof data.photos !== 'object') throw Error('Invalid image response.');
      for (const [id, task] of batch) task.resolve(data.photos[id] ?? null);
    } catch (error) {
      for (const [id, task] of batch) {
        cache.delete(id);
        task.reject(error instanceof Error ? error : Error('Photo unavailable'));
      }
    }
  }
}
/** Nearby visible cards share one API request; failed calls remain retryable. */
export function loadPlantPhoto(id: string): Promise<PlantPhoto | null> {
  const hit = cache.get(id);
  if (hit && hit.expires > Date.now()) return hit.value;
  const value = new Promise<PlantPhoto | null>((resolve, reject) =>
    waiting.set(id, { resolve, reject }),
  );
  if (cache.size >= 512) cache.delete(cache.keys().next().value!);
  cache.set(id, { value, expires: Date.now() + 30 * 60000 });
  if (!timer)
    timer = setTimeout(() => {
      void flush();
    }, 50);
  return value;
}
