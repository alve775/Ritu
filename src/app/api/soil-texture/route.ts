import { loadSoilTexture, soilDepths, type SoilDepth } from '../../../lib/soil-reference';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams,
    latitude = Number(q.get('latitude')),
    longitude = Number(q.get('longitude')),
    depth = q.get('depth') ?? '5-15';
  if (
    !q.get('latitude')?.trim() ||
    !q.get('longitude')?.trim() ||
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 85 ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180 ||
    !soilDepths.includes(depth as SoilDepth)
  )
    return Response.json(
      { error: 'Valid coordinates and a supported soil depth are required.' },
      { status: 400 },
    );
  try {
    return Response.json(
      { texture: await loadSoilTexture(latitude, longitude, depth as SoilDepth) },
      { headers: { 'Cache-Control': 'private, max-age=3600' } },
    );
  } catch {
    return Response.json(
      { error: 'A soil texture estimate could not be obtained near this point.' },
      { status: 502 },
    );
  }
}
