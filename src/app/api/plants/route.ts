import { loadClimateNormal } from '../../../lib/load-climate-normal';
import { calendarsAt } from '../../../lib/global-calendar';
import { searchPlantCatalogue } from '../../../domain/plant-search';
import { validDate } from '../../../domain/evidence-planner';
import type { Farm } from '../../../domain/types';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const latitude = Number(q.get('latitude')),
    longitude = Number(q.get('longitude'));
  const from = q.get('from') ?? '',
    soil = q.get('soil') ?? '',
    drainage = q.get('drainage') ?? '',
    irrigation = q.get('irrigation') ?? '';
  const page = Number(q.get('page') ?? '1'),
    area = Number(q.get('area') ?? '1'),
    text = (q.get('q') ?? '').trim().toLocaleLowerCase(),
    category = q.get('category') ?? 'food',
    cycle = q.get('cycle') ?? 'all';
  if (
    !q.get('latitude')?.trim() ||
    !q.get('longitude')?.trim() ||
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 85 ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180 ||
    !validDate(from) ||
    !Number.isFinite(area) ||
    area <= 0 ||
    area > 1000 ||
    from < '1900-01-01' ||
    from > '2100-12-31' ||
    !['loam', 'clay', 'sandy', 'unknown'].includes(soil) ||
    !['good', 'imperfect', 'poor', 'unknown'].includes(drainage) ||
    !['reliable', 'limited', 'rainfed', 'severe', 'unknown'].includes(irrigation) ||
    !Number.isInteger(page) ||
    page < 1 ||
    page > 1000 ||
    text.length > 120 ||
    category.length > 100 ||
    !['all', 'seasonal', 'perennial-review', 'unknown'].includes(cycle) ||
    !['matches', 'catalogue'].includes(q.get('mode') ?? 'matches')
  )
    return Response.json({ error: 'Invalid plant search or field conditions.' }, { status: 400 });
  try {
    const normal = await loadClimateNormal(latitude, longitude);
    return Response.json(
      searchPlantCatalogue(
        {
          site: { latitude, longitude, name: 'Selected field' },
          normal,
          calendars: calendarsAt(latitude, longitude),
          calendarSource: '',
          retrievedAt: normal.retrievedAt,
        },
        { area, soil, drainage, irrigation } as Farm,
        from,
        { page, text, category, cycle, mode: q.get('mode') ?? 'matches' },
      ),
    );
  } catch {
    return Response.json(
      { error: 'Verified climate data could not load. No sample suggestions are substituted.' },
      { status: 502 },
    );
  }
}
