import { afterEach, describe, expect, it, vi } from 'vitest';
import { writeArrayBuffer } from 'geotiff';
import { nearestSoilPixel } from './soil-reference';
import { GET } from '../app/api/soil-texture/route';

// 3 × 3 cells of 1°, covering longitude 10–13 and latitude 17–20.
const raster = (values: number[]) =>
  writeArrayBuffer(new Uint16Array(values), {
    width: 3,
    height: 3,
    BitsPerSample: [16],
    SampleFormat: [1],
    GeographicTypeGeoKey: 4326,
    ModelPixelScale: [1, 1, 0],
    ModelTiepoint: [0, 0, 0, 10, 20, 0],
  });
const any = () => true;
afterEach(() => vi.unstubAllGlobals());

describe('nearest soil prediction', () => {
  it('uses the pin cell when it has a prediction', async () => {
    const pick = await nearestSoilPixel(raster([1, 2, 3, 4, 50, 6, 7, 8, 9]), 18.5, 11.5, 0, any);
    expect(pick).toMatchObject({ raw: 50, distanceM: 0, latitude: 18.5, longitude: 11.5 });
  });
  it('falls back to the nearest predicted cell within the radius, and says how far', async () => {
    const tiff = raster([0, 0, 0, 0, 0, 60, 0, 0, 70]);
    const pick = await nearestSoilPixel(tiff, 18.5, 11.5, 200000, any);
    expect(pick.raw).toBe(60);
    expect(pick.longitude).toBe(12.5);
    expect(pick.distanceM).toBeGreaterThan(100000);
    await expect(nearestSoilPixel(tiff, 18.5, 11.5, 0, any)).rejects.toThrow();
    await expect(
      nearestSoilPixel(raster(Array(9).fill(0)), 18.5, 11.5, 1e7, any),
    ).rejects.toThrow();
  });
  it('skips values the caller marks invalid', async () => {
    const pick = await nearestSoilPixel(
      raster([0, 0, 0, 0, 999, 61, 0, 0, 0]),
      18.5,
      11.5,
      200000,
      (raw) => raw <= 140,
    );
    expect(pick.raw).toBe(61);
  });
});

describe('soil texture route', () => {
  it('rejects invalid coordinates without calling the provider', async () => {
    const upstream = vi.fn();
    vi.stubGlobal('fetch', upstream);
    for (const query of ['', 'latitude=x&longitude=1', 'latitude=1&longitude=1&depth=99'])
      expect((await GET(new Request(`http://local/api/soil-texture?${query}`))).status).toBe(400);
    expect(upstream).not.toHaveBeenCalled();
  });
  it('turns median clay, sand and silt into a texture class', async () => {
    const values: Record<string, number> = { clay: 205, sand: 410, silt: 390 };
    const upstream = vi.fn().mockImplementation(async (url: string) => {
      const u = new URL(url);
      expect(u.hostname).toBe('maps.isric.org');
      const property = u.searchParams.get('map')!.slice(5, -4);
      expect(u.searchParams.get('COVERAGEID')).toBe(`${property}_5-15cm_Q0.5`);
      const tiff = await raster(Array(9).fill(values[property]));
      return new Response(tiff, { headers: { 'content-type': 'image/tiff' } });
    });
    vi.stubGlobal('fetch', upstream);
    const response = await GET(
      new Request('http://local/api/soil-texture?latitude=18.5&longitude=11.5'),
    );
    const { texture } = await response.json();
    expect(texture).toMatchObject({ texture: 'loam', soil: 'loam', distanceM: 0 });
    expect(texture.clayPct + texture.sandPct + texture.siltPct).toBeCloseTo(100, 0);
    expect(upstream).toHaveBeenCalledTimes(3);
  });
  it('scales medians that do not add up to 1000 g/kg, as near Rajshahi', async () => {
    const values: Record<string, number> = { clay: 459, sand: 137, silt: 280 };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (url: string) => {
        const property = new URL(url).searchParams.get('map')!.slice(5, -4);
        const tiff = await raster(Array(9).fill(values[property]));
        return new Response(tiff, { headers: { 'content-type': 'image/tiff' } });
      }),
    );
    const { texture } = await (
      await GET(new Request('http://local/api/soil-texture?latitude=18.4&longitude=11.4'))
    ).json();
    expect(texture).toMatchObject({ texture: 'clay', soil: 'clay', clayPct: 52.4 });
  });
  it('does not invent a texture when the provider fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('down', { status: 503 })));
    const response = await GET(
      new Request('http://local/api/soil-texture?latitude=22.12345&longitude=90.12345'),
    );
    expect(response.status).toBe(502);
    expect(await response.json()).not.toHaveProperty('texture');
  });
});
