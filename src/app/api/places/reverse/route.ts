import { cachedUpstream } from '../../../../lib/server-upstream';
import { placeName } from '../../../../domain/place-name';

/** Area name for a map pin, from OpenStreetMap Nominatim (light use, cached, identified client). */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams,
    latitude = Number(q.get('lat')),
    longitude = Number(q.get('lon')),
    language = q.get('language') === 'bn' ? 'bn' : 'en';
  if (
    !q.get('lat') ||
    !q.get('lon') ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 85 ||
    Math.abs(longitude) > 180
  )
    return Response.json({ error: 'Invalid coordinates.' }, { status: 400 });
  // About 110 m: enough to name the area, and nearby pins share one cached public answer.
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.search = new URLSearchParams({
    format: 'jsonv2',
    lat: latitude.toFixed(3),
    lon: longitude.toFixed(3),
    zoom: '10',
    addressdetails: '1',
    'accept-language': language,
  }).toString();
  try {
    const name = await cachedUpstream(url.href, 7 * 86400000, async () => {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
        cache: 'no-store',
        headers: { 'User-Agent': 'RITU crop-planning prototype (https://ritu-three.vercel.app)' },
      });
      if (!response.ok) throw Error();
      return placeName(await response.json());
    });
    return Response.json({ name }, { headers: { 'Cache-Control': 'public, max-age=86400' } });
  } catch {
    return Response.json({ error: 'Place names are unavailable.' }, { status: 502 });
  }
}
