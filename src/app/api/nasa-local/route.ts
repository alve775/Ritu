import { loadNasaClimate } from '../../../lib/nasa-local-data';
export const runtime = 'nodejs';

/** NASA IMERG rain and SMAP soil weeks for a pin in the Rajshahi box; `nasa` is null outside it. */
export function GET(request: Request) {
  const q = new URL(request.url).searchParams,
    latitude = Number(q.get('latitude')),
    longitude = Number(q.get('longitude'));
  if (
    !q.get('latitude')?.trim() ||
    !q.get('longitude')?.trim() ||
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90 ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180
  )
    return Response.json({ error: 'Valid coordinates are required.' }, { status: 400 });
  return Response.json(
    { nasa: loadNasaClimate(latitude, longitude) },
    { headers: { 'Cache-Control': 'public, max-age=86400' } },
  );
}
