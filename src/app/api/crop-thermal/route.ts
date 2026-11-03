import {
  thermalWeatherUrls,
  parseTemperatureSeries,
  combineThermalWeather,
} from '../../../lib/thermal-weather';
import { cachedUpstream } from '../../../lib/server-upstream';

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams;
  const site = {
    latitude: Number(q.get('latitude')),
    longitude: Number(q.get('longitude')),
    name: 'Selected weather point',
  };
  const from = q.get('from') ?? '';
  let urls: ReturnType<typeof thermalWeatherUrls>;
  try {
    if (!q.get('latitude')?.trim() || !q.get('longitude')?.trim()) throw Error();
    urls = thermalWeatherUrls(site, from);
  } catch {
    return Response.json(
      { error: 'Valid coordinates and an actual planting date within 730 days are required.' },
      { status: 400 },
    );
  }
  try {
    const load = (url: string) =>
      cachedUpstream(url, 900000, async () => {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(20000),
          cache: 'no-store',
        });
        if (!response.ok) throw Error('Temperature provider unavailable');
        return {
          ...parseTemperatureSeries(await response.json(), site, url),
          retrievedAt: new Date().toISOString(),
        };
      });
    const [forecast, archive] = await Promise.all([
      load(urls.forecast),
      urls.archive ? load(urls.archive).catch(() => null) : Promise.resolve(null),
    ]);
    const series = combineThermalWeather(site, from, forecast, archive, [
      urls.forecast,
      ...(archive && urls.archive ? [urls.archive] : []),
    ]);
    series.fetchedAt = forecast.retrievedAt;
    return Response.json({ series }, { headers: { 'Cache-Control': 'private, max-age=300' } });
  } catch {
    return Response.json(
      {
        error:
          'Daily temperature evidence is unavailable. No temperatures or maturity date have been invented.',
      },
      { status: 502 },
    );
  }
}
