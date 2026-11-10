import rain from '../data/nasa/rajshahi-imerg.json' with { type: 'json' };
import soil from '../data/nasa/rajshahi-smap.json' with { type: 'json' };
import { nasaClimateAt, soilRange, type RainFile, type SoilFile } from '../domain/nasa-local';

const rainFile = rain as RainFile,
  soilFile = soil as SoilFile;
let range: [number, number] | null = null;

/** NASA IMERG and SMAP weeks at a pin from the files shipped with Ritu, or null outside the Rajshahi box. */
export function loadNasaClimate(lat: number, lon: number) {
  range ??= soilRange(soilFile);
  return nasaClimateAt(rainFile, soilFile, lat, lon, range);
}
