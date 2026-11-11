export interface FarmSite {
  latitude: number;
  longitude: number;
  name: string;
  countryCode?: string;
  timezone?: string;
}
/** The location search result for Rajshahi, so the pin sits just above the city label. */
// Farmland about 2 km north-west of Rajshahi city centre: the city pin itself has no BARC soil
// survey or fertiliser data. The map still opens with Rajshahi in view.
export const defaultSite: FarmSite = {
  latitude: 24.384,
  longitude: 88.584,
  name: 'Rajshahi, Rajshahi Division, Bangladesh',
  countryCode: 'BD',
  timezone: 'Asia/Dhaka',
};
export const validSite = (value: unknown): value is FarmSite => {
  if (!value || typeof value !== 'object') return false;
  const s = value as FarmSite;
  return (
    typeof s.latitude === 'number' &&
    Number.isFinite(s.latitude) &&
    Math.abs(s.latitude) <= 85 &&
    typeof s.longitude === 'number' &&
    Number.isFinite(s.longitude) &&
    Math.abs(s.longitude) <= 180 &&
    typeof s.name === 'string' &&
    s.name.length > 0 &&
    s.name.length <= 240 &&
    (s.countryCode === undefined || /^[A-Z]{2}$/.test(s.countryCode)) &&
    (s.timezone === undefined || (typeof s.timezone === 'string' && s.timezone.length <= 80))
  );
};
export const samePoint = (a: FarmSite, b: FarmSite) =>
  Math.abs(a.latitude - b.latitude) < 0.000005 && Math.abs(a.longitude - b.longitude) < 0.000005;
/** Leaflet may expose a repeated world beyond +/-180; persist canonical coordinates. */
export const canonicalPin = (latitude: number, longitude: number) => ({
  latitude: Number(Math.max(-85, Math.min(85, latitude)).toFixed(5)),
  longitude: Number((((((longitude + 180) % 360) + 360) % 360) - 180).toFixed(5)),
});
/** Product support boundary, not an administrative or agro-ecological boundary survey. */
export const inPilotRegion = (site: FarmSite) =>
  site.latitude >= 24 && site.latitude <= 25.3 && site.longitude >= 88 && site.longitude <= 89.3;
