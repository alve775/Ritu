import { isRotationCrop } from '../../../data/rotation-crops';
import { barcCrop, barcPageUrl, inBangladesh, loadFertilizer } from '../../../lib/barc-fertilizer';
export const runtime = 'nodejs';

/**
 * BARC fertiliser recommendation for a crop at a pin, per 100 decimals. `fertilizer` is null
 * outside Bangladesh; when BARC can't be reached, `fertilizer` is null and `pageUrl` links to
 * BARC's own page.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams,
    crop = q.get('crop') ?? '',
    latitude = Number(q.get('latitude')),
    longitude = Number(q.get('longitude'));
  if (
    !isRotationCrop(crop) ||
    !barcCrop(crop) ||
    !q.get('latitude')?.trim() ||
    !q.get('longitude')?.trim() ||
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 90 ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180
  )
    return Response.json(
      { error: 'A Ritu crop and valid coordinates are required.' },
      { status: 400 },
    );
  try {
    return Response.json(
      { fertilizer: await loadFertilizer(crop, latitude, longitude) },
      { headers: { 'Cache-Control': 'public, max-age=86400' } },
    );
  } catch {
    return Response.json({
      fertilizer: null,
      pageUrl: inBangladesh(latitude, longitude)
        ? barcPageUrl(barcCrop(crop)!, latitude, longitude)
        : null,
      error: 'BARC could not be reached.',
    });
  }
}
