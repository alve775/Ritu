import { historyRange, parseSeasonHistory, seasonHistoryUrl } from '../../../domain/season-history';
import { calendarByCrop } from '../../../data/regional-calendars';
import { cachedUpstream } from '../../../lib/server-upstream';
import type { CropId } from '../../../domain/types';
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams,
    crop = q.get('crop') as CropId,
    latitude = Number(q.get('latitude')),
    longitude = Number(q.get('longitude'));
  let range: { start: string; end: string }, url: string;
  try {
    if (!q.get('latitude')?.trim() || !q.get('longitude')?.trim() || !calendarByCrop(crop))
      throw Error('Missing coordinates or crop');
    range = historyRange(crop);
    url = seasonHistoryUrl(latitude, longitude, range.start, range.end);
  } catch {
    return Response.json(
      { error: 'Choose valid coordinates and a supported crop.' },
      { status: 400 },
    );
  }
  try {
    const history = await cachedUpstream(url, 86400000, async () => {
      const r = await fetch(url, { signal: AbortSignal.timeout(25000), cache: 'no-store' });
      if (!r.ok) throw Error('NASA unavailable');
      return parseSeasonHistory(
        await r.json(),
        crop,
        Number(latitude.toFixed(2)),
        Number(longitude.toFixed(2)),
        range.start,
        range.end,
        new Date().toISOString(),
      );
    });
    return Response.json({ history }, { headers: { 'Cache-Control': 'private, max-age=3600' } });
  } catch {
    return Response.json(
      {
        error:
          'A complete NASA historical interval could not be verified. No substitute data are shown.',
      },
      { status: 502 },
    );
  }
}
