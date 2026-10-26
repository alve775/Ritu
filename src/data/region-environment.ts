import baseline from './nasa/rajshahi-2025.json' with { type: 'json' };
import type { PowerClimate } from '../domain/nasa-power';
import { defaultSite } from '../domain/farm-site';
import type { FarmSite } from '../domain/farm-site';
export interface RegionEnvironment {
  site?: FarmSite;
  climate?: PowerClimate;
}
export const baselineClimate: PowerClimate = { ...baseline, source: 'NASA POWER' };
export const climateFor = (settings: RegionEnvironment): PowerClimate =>
  settings.climate ?? baselineClimate;
export const siteFor = (settings: RegionEnvironment): FarmSite => settings.site ?? defaultSite;
export const climateMatchesSite = (settings: RegionEnvironment) =>
  !!settings.site &&
  Number(settings.site.latitude.toFixed(2)) === climateFor(settings).latitude &&
  Number(settings.site.longitude.toFixed(2)) === climateFor(settings).longitude;
