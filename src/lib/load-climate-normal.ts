import { cachedUpstream } from './server-upstream';
import { parseClimateNormal, climateNormalUrl } from '../domain/climate-normal';
export async function loadClimateNormal(latitude: number, longitude: number) {
  const url = climateNormalUrl(latitude, longitude);
  return await cachedUpstream(`climate-normal-calendar-v4:${url}`, 30 * 86400000, async () => {
    const r = await fetch(url, { signal: AbortSignal.timeout(30000), cache: 'no-store' });
    if (!r.ok) throw Error('NASA climate baseline is unavailable.');
    return parseClimateNormal(
      await r.json(),
      Number(latitude.toFixed(2)),
      Number(longitude.toFixed(2)),
    );
  });
}
