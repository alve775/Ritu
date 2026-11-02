import { cachedUpstream } from './server-upstream';
const hosts = {
  wikipedia: 'https://en.wikipedia.org/w/api.php',
  wikidata: 'https://www.wikidata.org/w/api.php',
  commons: 'https://commons.wikimedia.org/w/api.php',
};
let tail = Promise.resolve(),
  last = 0,
  cooldown = 0,
  waiting = 0;
const rateLimit = () =>
  Object.assign(Error('Image provider is temporarily busy.'), {
    retryAfterSeconds: Math.max(1, Math.ceil((cooldown - Date.now()) / 1000)),
  });
/** Fixed hosts, shared request pacing, bounded queue, Retry-After backoff. */
export async function wikimediaApi(host: keyof typeof hosts, params: Record<string, string>) {
  const url = `${hosts[host]}?${new URLSearchParams({ format: 'json', ...params })}`;
  return cachedUpstream(`wm-v2:${url}`, 86400000, async () => {
    if (Date.now() < cooldown) throw rateLimit();
    if (waiting >= 30)
      throw Object.assign(Error('Image provider queue is busy.'), { retryAfterSeconds: 60 });
    waiting++;
    const request = tail.then(async () => {
      if (Date.now() < cooldown) throw rateLimit();
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, 1100 - (Date.now() - last))));
      last = Date.now();
      const r = await fetch(url, {
        headers: {
          'User-Agent': 'RITU/1.0 (crop reference images; https://github.com/alve775/Ritu)',
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(20000),
        cache: 'no-store',
      });
      if (r.status === 429 || r.status === 503) {
        const header = r.headers.get('retry-after'),
          seconds = header?.trim() ? Number(header) : NaN;
        const milliseconds = Number.isFinite(seconds)
          ? seconds * 1000
          : header
            ? Date.parse(header) - Date.now()
            : 60000;
        cooldown =
          Date.now() + Math.max(30000, Number.isFinite(milliseconds) ? milliseconds : 60000);
        throw rateLimit();
      }
      if (!r.ok) throw Error('Image provider is unavailable.');
      const data = await r.json();
      if (!data || typeof data !== 'object' || data.error)
        throw Error('Invalid image provider response.');
      return data;
    });
    tail = request.then(
      () => {},
      () => {},
    );
    try {
      return await request;
    } finally {
      waiting--;
    }
  });
}
