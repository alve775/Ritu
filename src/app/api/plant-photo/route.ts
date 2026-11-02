import { globalCrop } from '../../../domain/global-season';
import { resolvePlantPhotos } from '../../../lib/plant-photo-source';
import type { GlobalCrop } from '../../../domain/global-season';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const ids = (q.get('plants') ?? q.get('plant') ?? '').split(',');
  if (
    !ids.length ||
    ids.length > 12 ||
    new Set(ids).size !== ids.length ||
    ids.some((id) => !globalCrop(id))
  )
    return Response.json({ error: 'Choose between one and twelve known plants.' }, { status: 400 });
  const plants = ids.map((id) => globalCrop(id)!) as GlobalCrop[];
  try {
    const photos = await resolvePlantPhotos(plants);
    return Response.json(
      { photos, ...(q.has('plant') ? { photo: photos[ids[0]] } : {}) },
      { headers: { 'Cache-Control': 'public, max-age=3600' } },
    );
  } catch (error) {
    const advised = (error as { retryAfterSeconds?: number })?.retryAfterSeconds;
    const retryAfter = Number.isFinite(advised) && advised! > 0 ? Math.ceil(advised!) : 60;
    return Response.json(
      {
        error:
          'The image source is temporarily unavailable. Crop choices and farm records still work.',
      },
      { status: 503, headers: { 'Retry-After': String(retryAfter), 'Cache-Control': 'no-store' } },
    );
  }
}
