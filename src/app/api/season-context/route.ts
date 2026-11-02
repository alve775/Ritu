import { loadClimateNormal } from '../../../lib/load-climate-normal';
import { calendarsAt } from '../../../lib/global-calendar';
import { climateNormalUrl } from '../../../domain/climate-normal';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  if (!q.get('latitude')?.trim() || !q.get('longitude')?.trim())
    return Response.json({ error: 'Coordinates are required.' }, { status: 400 });
  const latitude = Number(q.get('latitude')),
    longitude = Number(q.get('longitude'));
  try {
    climateNormalUrl(latitude, longitude);
  } catch {
    return Response.json({ error: 'Invalid coordinates.' }, { status: 400 });
  }
  try {
    const normal = await loadClimateNormal(latitude, longitude);
    return Response.json({
      context: {
        site: { latitude, longitude, name: 'Selected farm' },
        normal,
        calendars: calendarsAt(latitude, longitude),
        calendarSource:
          'https://sage.nelson.wisc.edu/data-and-models/datasets/crop-calendar-dataset/',
        retrievedAt: new Date().toISOString(),
      },
    });
  } catch {
    return Response.json(
      {
        error:
          'NASA’s long-term climate could not be verified. Your field is saved. Retry when connected; no sample suggestions are substituted.',
      },
      { status: 502 },
    );
  }
}
