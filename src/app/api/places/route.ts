import { cachedUpstream } from '../../../lib/server-upstream';
import { validSite } from '../../../domain/farm-site';
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams,
    query = q.get('q')?.trim() ?? '',
    language = q.get('language') === 'bn' ? 'bn' : 'en';
  if (query.length < 3) return Response.json({ places: [] });
  if (query.length > 120)
    return Response.json({ error: 'Search text is too long.' }, { status: 400 });
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
  url.search = new URLSearchParams({
    name: query,
    count: '8',
    language,
    format: 'json',
  }).toString();
  try {
    const places = await cachedUpstream(url.href, 86400000, async () => {
      const response = await fetch(url, { signal: AbortSignal.timeout(12000), cache: 'no-store' });
      if (!response.ok) throw Error();
      const json = await response.json();
      if (json.results !== undefined && !Array.isArray(json.results)) throw Error();
      return (json.results ?? [])
        .filter(
          (p: Record<string, unknown>) =>
            typeof p.name === 'string' &&
            typeof p.latitude === 'number' &&
            Math.abs(p.latitude) <= 85 &&
            typeof p.longitude === 'number' &&
            Math.abs(p.longitude) <= 180,
        )
        .map((p: Record<string, unknown>) => ({
          id: p.id,
          latitude: p.latitude,
          longitude: p.longitude,
          name: [p.name, p.admin1, p.country].filter(Boolean).join(', '),
          countryCode: p.country_code,
          timezone: p.timezone,
        }))
        .filter((p: { id: unknown }) => Number.isInteger(p.id) && validSite(p));
    });
    return Response.json({ places }, { headers: { 'Cache-Control': 'public, max-age=3600' } });
  } catch {
    return Response.json(
      { error: 'Place search is unavailable. Use the map, your location or coordinates.' },
      { status: 502 },
    );
  }
}
