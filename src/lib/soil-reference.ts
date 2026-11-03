import { fromArrayBuffer } from 'geotiff';
import { cachedUpstream } from './server-upstream';

export const soilDepths = ['0-5', '5-15', '15-30'] as const;
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
}
export function soilCoverageUrl(
  latitude: number,
  longitude: number,
  depth: SoilDepth,
  quantile: '0.05' | '0.5' | '0.95',
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
  const radius = 400 / Math.cos((latitude * Math.PI) / 180),
    limit = Math.PI * r;
  const url = new URL('https://maps.isric.org/mapserv');
  url.search = new URLSearchParams({
    map: '/map/phh2o.map',
    SERVICE: 'WCS',
    VERSION: '2.0.1',
    REQUEST: 'GetCoverage',
    COVERAGEID: `phh2o_${depth}cm_Q${quantile}`,
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
export async function loadSoilReference(
  latitude: number,
  longitude: number,
  depth: SoilDepth,
): Promise<SoilReference> {
  const sourceUrls = (['0.05', '0.5', '0.95'] as const).map((q) =>
    soilCoverageUrl(latitude, longitude, depth, q),
  );
  return cachedUpstream(
    `soil-reference-v1:${latitude},${longitude}:${depth}`,
    86400000,
    async () => {
      const [lower, median, upper] = await Promise.all(
        sourceUrls.map(async (url) => readSoilPixel(await smallResponse(url), latitude, longitude)),
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
      };
    },
  );
}
