import type { Farm } from './types';
/** Display labels and asynchronously resolved timezones do not change the
 * physical field or its input conditions. A changed pin still invalidates it.
 */
export function fieldConfirmationKey(farm: Farm, site: unknown, from: string) {
  const point =
    site && typeof site === 'object' ? (site as { latitude?: number; longitude?: number }) : null;
  return JSON.stringify([
    farm,
    point ? { latitude: point.latitude, longitude: point.longitude } : null,
    from,
  ]);
}
