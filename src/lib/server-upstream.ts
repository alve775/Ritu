// Public environmental records only. Never cache names, notes or household inputs here.
const records = new Map<string, { expires: number; value: unknown }>();
const pending = new Map<string, Promise<unknown>>();
export async function cachedUpstream<T>(
  key: string,
  ttl: number,
  load: () => Promise<T>,
): Promise<T> {
  const cached = records.get(key);
  if (cached && cached.expires > Date.now()) return cached.value as T;
  const existing = pending.get(key);
  if (existing) return existing as Promise<T>;
  const request = load().then((value) => {
    if (records.size >= 100) records.delete(records.keys().next().value!);
    records.set(key, { value, expires: Date.now() + ttl });
    return value;
  });
  pending.set(key, request);
  try {
    return await request;
  } finally {
    if (pending.get(key) === request) pending.delete(key);
  }
}
