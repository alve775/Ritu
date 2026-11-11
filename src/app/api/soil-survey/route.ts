import { loadSoilSurvey } from '../../../lib/soil-survey-data';
export const runtime = 'nodejs';

/**
 * BARC crop-zoning soil unit (SRDI survey) at a pin. `survey` is a soil unit, `none` where the
 * grid has no unit (rivers, towns), or null outside Rajshahi, Chapainawabganj, Natore and Naogaon.
 */
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
    { survey: loadSoilSurvey(latitude, longitude) },
    { headers: { 'Cache-Control': 'public, max-age=86400' } },
  );
}
