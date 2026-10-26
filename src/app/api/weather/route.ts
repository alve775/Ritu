import { weatherUrl, parseWeather } from '../../../domain/live-weather';
import { cachedUpstream } from '../../../lib/server-upstream';
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const latitude = Number(q.get('latitude')),
    longitude = Number(q.get('longitude'));
  let url: string;
  try {
    if (!q.get('latitude')?.trim() || !q.get('longitude')?.trim()) throw Error();
    url = weatherUrl(latitude, longitude);
  } catch {
    return Response.json({ error: 'Valid coordinates are required.' }, { status: 400 });
  }
  try {
    const weather = await cachedUpstream(url, 600000, async () => {
      const response = await fetch(url, { signal: AbortSignal.timeout(15000), cache: 'no-store' });
      if (!response.ok) throw Error('Weather provider unavailable');
      return parseWeather(
        await response.json(),
        { latitude, longitude, name: 'Selected farm' },
        new Date().toISOString(),
      );
    });
    return Response.json({ weather }, { headers: { 'Cache-Control': 'private, max-age=300' } });
  } catch {
    return Response.json(
      { error: 'Current weather could not be loaded. No sample values have been substituted.' },
      { status: 502 },
    );
  }
}
