import { it, expect, vi, afterEach } from 'vitest';
import { writeArrayBuffer } from 'geotiff';
import { readSoilPixel, soilCoverageUrl } from './soil-reference';
import { GET } from '../app/api/soil-reference/route';
const raster = (values = [55, 60, 65, 70], crs = 4326) =>
  writeArrayBuffer(new Uint16Array(values), {
    width: 2,
    height: 2,
    BitsPerSample: [16],
    SampleFormat: [1],
    GeographicTypeGeoKey: crs,
    ModelPixelScale: [1, 1, 0],
    ModelTiepoint: [0, 0, 0, 10, 20, 0],
  });
afterEach(() => vi.unstubAllGlobals());
it('selects the requested numeric pixel and applies documented pH scale, not an image colour', async () => {
  expect(await readSoilPixel(raster(), 19.5, 10.5)).toBe(5.5);
  expect(await readSoilPixel(raster(), 18.5, 11.5)).toBe(7);
  await expect(readSoilPixel(raster(), 30, 50)).rejects.toThrow();
  await expect(readSoilPixel(raster([0, 0, 0, 0]), 19.5, 10.5)).rejects.toThrow();
  await expect(readSoilPixel(raster([55, 60, 65, 70], 3857), 19.5, 10.5)).rejects.toThrow();
});
it('uses only the verified provider and fixed property, depth and quantile identities', () => {
  const url = new URL(soilCoverageUrl(24.37, 88.6, '5-15', '0.5'));
  expect(url.origin).toBe('https://maps.isric.org');
  expect(url.searchParams.get('COVERAGEID')).toBe('phh2o_5-15cm_Q0.5');
  expect(url.searchParams.getAll('SUBSET')).toHaveLength(2);
  for (const [lat, lon] of [
    [NaN, 1],
    [86, 1],
    [1, 181],
  ])
    expect(() => soilCoverageUrl(lat, lon, '5-15', '0.5')).toThrow();
});
it('rejects invalid/missing query coordinates and does not fetch caller URLs', async () => {
  const upstream = vi.fn();
  vi.stubGlobal('fetch', upstream);
  for (const query of [
    '',
    'latitude=&longitude=10',
    'latitude=86&longitude=10',
    'latitude=1&longitude=2&depth=999',
  ])
    expect((await GET(new Request(`http://local/api/soil-reference?${query}`))).status).toBe(400);
  expect(upstream).not.toHaveBeenCalled();
});
it('does not substitute soil values when the real coverage endpoint fails', async () => {
  const upstream = vi.fn().mockResolvedValue(new Response('failure', { status: 503 }));
  vi.stubGlobal('fetch', upstream);
  const response = await GET(
    new Request(
      'http://local/api/soil-reference?latitude=21.98765&longitude=91.98765&url=https://example.com',
    ),
  );
  expect(response.status).toBe(502);
  expect(await response.json()).not.toHaveProperty('soil');
  expect(upstream).toHaveBeenCalled();
  for (const call of upstream.mock.calls) expect(new URL(call[0]).hostname).toBe('maps.isric.org');
});
