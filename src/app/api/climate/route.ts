import { parsePower, powerUrl } from '../../../domain/nasa-power';
import type { PowerClimate } from '../../../domain/nasa-power';

const cache = new Map<string, { expires: number; data: PowerClimate }>();
const pending = new Map<string, Promise<PowerClimate>>();

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  if (!['latitude', 'longitude', 'year'].every((key) => query.has(key) && query.get(key)?.trim()))
    return Response.json(
      { error: 'Latitude, longitude and a complete historical year are required.' },
      { status: 400 },
    );
  const latitude = Number(query.get('latitude')),
    longitude = Number(query.get('longitude')),
    year = Number(query.get('year'));
  let url: string;
  try {
    url = powerUrl(latitude, longitude, year);
  } catch {
    return Response.json({ error: 'Invalid coordinates or historical year.' }, { status: 400 });
  }
  const existing = cache.get(url);
  if (existing && existing.expires > Date.now())
    return Response.json({ climate: existing.data, delivery: 'server-cache' });
  try {
    let job = pending.get(url);
    if (!job) {
      job = (async () => {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(25000),
          cache: 'no-store',
        });
        if (!response.ok) throw new Error(`NASA POWER responded ${response.status}.`);
        const data = parsePower(
          await response.json(),
          Number(latitude.toFixed(2)),
          Number(longitude.toFixed(2)),
          year,
          new Date().toISOString(),
          url,
        );
        if (cache.size >= 48) cache.delete(cache.keys().next().value!);
        cache.set(url, { expires: Date.now() + 86400000, data });
        return data;
      })();
      pending.set(url, job);
    }
    const climate = await job;
    return Response.json(
      { climate, delivery: 'NASA POWER' },
      { headers: { 'Cache-Control': 'private, max-age=3600' } },
    );
  } catch {
    return Response.json(
      {
        error:
          'NASA data could not be loaded or validated. Your previous verified record is kept. Try again later.',
      },
      { status: 502 },
    );
  } finally {
    pending.delete(url);
  }
}
