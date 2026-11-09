import { fromArrayBuffer } from 'geotiff';
import { cachedUpstream } from './server-upstream';

import { appSoil, usdaTexture, type UsdaTexture } from '../domain/soil-texture';

export const soilDepths = ['0-5', '5-15', '15-30'] as const;
export type SoilProperty = 'phh2o' | 'clay' | 'sand' | 'silt';
/** Built-up and water cells have no prediction; use the nearest predicted cell within this. */
export const soilSearchRadiusM = 2000;
export type SoilDepth = (typeof soilDepths)[number];
export interface SoilReference {
  latitude: number;
  longitude: number;
  depth: SoilDepth;
  median: number;
  lower: number;
  upper: number;
  fetchedAt: string;
  provider: 'ISRIC SoilGrids 2.0';
  method: 'modeled pH(H2O)';
  nativeResolutionM: 250;
  sourceUrls: string[];
  unitsSource: string;
  /** Distance to the predicted cell used; 0 when the pin's own cell has a prediction. */
  distanceM?: number;
}
export interface SoilTexture {
  latitude: number;
  longitude: number;
  depth: SoilDepth;
  clayPct: number;
  sandPct: number;
  siltPct: number;
  texture: UsdaTexture;
  soil: ReturnType<typeof appSoil>;
  distanceM: number;
  fetchedAt: string;
  provider: 'ISRIC SoilGrids 2.0';
  nativeResolutionM: 250;
  sourceUrls: string[];
  unitsSource: string;
}
export function soilCoverageUrl(
  latitude: number,
  longitude: number,
  depth: SoilDepth,
  quantile: '0.05' | '0.5' | '0.95',
  property: SoilProperty = 'phh2o',
) {
  if (
    !Number.isFinite(latitude) ||
    Math.abs(latitude) > 85 ||
    !Number.isFinite(longitude) ||
    Math.abs(longitude) > 180 ||
    !soilDepths.includes(depth)
  )
    throw Error('Invalid soil point.');
  // A small projected box avoids geographic axis-order ambiguity. GeoTIFF
  // output is independently checked in EPSG:4326 before selecting its pixel.
  const r = 6378137,
    x = (r * longitude * Math.PI) / 180,
    y = r * Math.log(Math.tan(Math.PI / 4 + (latitude * Math.PI) / 360));
  const radius = soilSearchRadiusM / Math.cos((latitude * Math.PI) / 180),
    limit = Math.PI * r;
  const url = new URL('https://maps.isric.org/mapserv');
  url.search = new URLSearchParams({
    map: `/map/${property}.map`,
    SERVICE: 'WCS',
    VERSION: '2.0.1',
    REQUEST: 'GetCoverage',
    COVERAGEID: `${property}_${depth}cm_Q${quantile}`,
    FORMAT: 'GEOTIFF_INT16',
    SUBSETTINGCRS: 'http://www.opengis.net/def/crs/EPSG/0/3857',
    OUTPUTCRS: 'http://www.opengis.net/def/crs/EPSG/0/4326',
  }).toString();
  url.searchParams.append(
    'SUBSET',
    `X(${Math.max(-limit, x - radius)},${Math.min(limit, x + radius)})`,
  );
  url.searchParams.append('SUBSET', `Y(${y - radius},${y + radius})`);
  return url.href;
}
async function smallResponse(url: string) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(25000),
    cache: 'no-store',
    redirect: 'error',
  });
  if (
    !response.ok ||
    !response.headers.get('content-type')?.includes('image/tiff') ||
    Number(response.headers.get('content-length') ?? 0) > 1048576
  )
    throw Error('Soil coverage unavailable.');
  const reader = response.body?.getReader();
  if (!reader) throw Error('Empty coverage.');
  const parts: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 1048576) {
      await reader.cancel();
      throw Error('Oversized coverage.');
    }
    parts.push(value);
  }
  const buffer = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    buffer.set(part, offset);
    offset += part.length;
  }
  return buffer.buffer;
}
export async function readSoilPixel(buffer: ArrayBuffer, latitude: number, longitude: number) {
  const image = await (await fromArrayBuffer(buffer)).getImage(),
    bounds = image.getBoundingBox();
  const [left, bottom, right, top] = bounds,
    width = image.getWidth(),
    height = image.getHeight();
  if (
    image.getGeoKeys()?.GeographicTypeGeoKey !== 4326 ||
    image.getSamplesPerPixel() !== 1 ||
    image.getBitsPerSample() !== 16 ||
    width < 1 ||
    height < 1 ||
    width > 64 ||
    height > 64 ||
    !bounds.every(Number.isFinite) ||
    left >= right ||
    bottom >= top ||
    longitude < left ||
    longitude >= right ||
    latitude <= bottom ||
    latitude > top
  )
    throw Error('Coverage does not establish this point.');
  const col = Math.floor(((longitude - left) / (right - left)) * width),
    row = Math.floor(((top - latitude) / (top - bottom)) * height);
  const pixels = await image.readRasters({
    samples: [0],
    window: [col, row, col + 1, row + 1],
    interleave: true,
  });
  const raw = Number(pixels[0]);
  // WCS can return zero-filled land-mask cells without a no-data tag. Zero is
  // treated as ambiguous/unavailable, never displayed as measured pH zero.
  if (!Number.isFinite(raw) || raw === image.getGDALNoData() || raw <= 0 || raw > 140)
    throw Error('No usable soil prediction at this point.');
  return raw / 10; // Official SoilGrids layer codebook, not the WCS template uom.
}
/**
 * The raw value of the pin's own cell, or of the nearest valid cell within maxDistanceM.
 * Zero and no-data cells are treated as unavailable, never as measured zeros.
 */
export async function nearestSoilPixel(
  buffer: ArrayBuffer,
  latitude: number,
  longitude: number,
  maxDistanceM: number,
  valid: (raw: number) => boolean,
) {
  const image = await (await fromArrayBuffer(buffer)).getImage(),
    bounds = image.getBoundingBox();
  const [left, bottom, right, top] = bounds,
    width = image.getWidth(),
    height = image.getHeight();
  if (
    image.getGeoKeys()?.GeographicTypeGeoKey !== 4326 ||
    image.getSamplesPerPixel() !== 1 ||
    image.getBitsPerSample() !== 16 ||
    width < 1 ||
    height < 1 ||
    width > 64 ||
    height > 64 ||
    !bounds.every(Number.isFinite) ||
    left >= right ||
    bottom >= top ||
    longitude < left ||
    longitude >= right ||
    latitude <= bottom ||
    latitude > top
  )
    throw Error('Coverage does not establish this point.');
  const pixels = (await image.readRasters({ samples: [0], interleave: true })) as ArrayLike<number>;
  const noData = image.getGDALNoData(),
    usable = (raw: number) => Number.isFinite(raw) && raw !== noData && raw > 0 && valid(raw);
  const dx = (right - left) / width,
    dy = (top - bottom) / height,
    ownCol = Math.floor((longitude - left) / dx),
    ownRow = Math.floor((top - latitude) / dy);
  const centre = (col: number, row: number) => ({
    latitude: top - (row + 0.5) * dy,
    longitude: left + (col + 0.5) * dx,
  });
  const own = Number(pixels[ownRow * width + ownCol]);
  if (usable(own)) return { raw: own, ...centre(ownCol, ownRow), distanceM: 0 };
  let best: { raw: number; latitude: number; longitude: number; distanceM: number } | null = null;
  for (let row = 0; row < height; row++)
    for (let col = 0; col < width; col++) {
      const raw = Number(pixels[row * width + col]);
      if (!usable(raw)) continue;
      const c = centre(col, row),
        distanceM = Math.hypot(
          (c.longitude - longitude) * 111320 * Math.cos((latitude * Math.PI) / 180),
          (c.latitude - latitude) * 110540,
        );
      if (distanceM <= maxDistanceM && (!best || distanceM < best.distanceM))
        best = { raw, ...c, distanceM };
    }
  if (!best) throw Error('No usable soil prediction near this point.');
  return best;
}
export async function loadSoilReference(
  latitude: number,
  longitude: number,
  depth: SoilDepth,
): Promise<SoilReference> {
  const sourceUrls = (['0.05', '0.5', '0.95'] as const).map((q) =>
    soilCoverageUrl(latitude, longitude, depth, q),
  );
  return cachedUpstream(
    `soil-reference-v2:${latitude},${longitude}:${depth}`,
    86400000,
    async () => {
      const [lowerTiff, medianTiff, upperTiff] = await Promise.all(sourceUrls.map(smallResponse));
      const pick = await nearestSoilPixel(
        medianTiff,
        latitude,
        longitude,
        soilSearchRadiusM,
        (raw) => raw <= 140,
      );
      const median = pick.raw / 10;
      const [lower, upper] = await Promise.all(
        [lowerTiff, upperTiff].map((tiff) => readSoilPixel(tiff, pick.latitude, pick.longitude)),
      );
      if (lower > median || median > upper) throw Error('Inconsistent soil uncertainty.');
      return {
        latitude,
        longitude,
        depth,
        lower,
        median,
        upper,
        fetchedAt: new Date().toISOString(),
        provider: 'ISRIC SoilGrids 2.0',
        method: 'modeled pH(H2O)',
        nativeResolutionM: 250,
        sourceUrls,
        unitsSource: 'https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_01.html',
        distanceM: Math.round(pick.distanceM),
      };
    },
  );
}
/** Median clay, sand and silt at the pin (g/kg in the SoilGrids codebook, shown as %). */
export async function loadSoilTexture(
  latitude: number,
  longitude: number,
  depth: SoilDepth,
): Promise<SoilTexture> {
  const sourceUrls = (['clay', 'sand', 'silt'] as const).map((property) =>
    soilCoverageUrl(latitude, longitude, depth, '0.5', property),
  );
  return cachedUpstream(`soil-texture-v1:${latitude},${longitude}:${depth}`, 86400000, async () => {
    const [clayTiff, sandTiff, siltTiff] = await Promise.all(sourceUrls.map(smallResponse));
    const fraction = (raw: number) => raw <= 1000;
    const pick = await nearestSoilPixel(clayTiff, latitude, longitude, soilSearchRadiusM, fraction);
    const [sand, silt] = await Promise.all(
      [sandTiff, siltTiff].map(
        async (tiff) =>
          (await nearestSoilPixel(tiff, pick.latitude, pick.longitude, 0, fraction)).raw,
      ),
    );
    const clay = pick.raw,
      total = clay + sand + silt;
    // The three medians are separate predictions, so they need not add up to 1000 g/kg
    // (about 880–900 near Rajshahi); they are scaled to 100% before classifying.
    if (total < 700 || total > 1300) throw Error('Inconsistent soil texture fractions.');
    const pct = (v: number) => Math.round((v / total) * 1000) / 10,
      texture = usdaTexture(sand, silt, clay);
    return {
      latitude,
      longitude,
      depth,
      clayPct: pct(clay),
      sandPct: pct(sand),
      siltPct: pct(silt),
      texture,
      soil: appSoil(texture),
      distanceM: Math.round(pick.distanceM),
      fetchedAt: new Date().toISOString(),
      provider: 'ISRIC SoilGrids 2.0',
      nativeResolutionM: 250,
      sourceUrls,
      unitsSource: 'https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_01.html',
    };
  });
}
