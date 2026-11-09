import { afterEach, describe, expect, it, vi } from 'vitest';
afterEach(() => vi.unstubAllGlobals());
async function route() {
  vi.resetModules();
  return (await import('./route')).GET;
}
const rajshahi = {
  name: 'Rajshahi',
  address: {
    city: 'Rajshahi',
    state_district: 'Rajshahi District',
    state: 'Rajshahi Division',
    country: 'Bangladesh',
  },
};
describe('reverse place names for map pins', () => {
  it('rejects missing or impossible coordinates without calling the service', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const GET = await route();
    for (const query of ['', '?lat=24.4', '?lat=x&lon=88.6', '?lat=91&lon=88.6', '?lat=24&lon=200'])
      expect((await GET(new Request(`http://local/api/places/reverse${query}`))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('asks the fixed host with rounded coordinates and the UI language', async () => {
    const fetcher = vi.fn().mockImplementation(async () => Response.json(rajshahi));
    vi.stubGlobal('fetch', fetcher);
    const GET = await route();
    const response = await GET(
      new Request('http://local/api/places/reverse?lat=24.37399&lon=88.6013&language=bn'),
    );
    expect(await response.json()).toEqual({ name: 'Rajshahi, Rajshahi District, Bangladesh' });
    const url = new URL(fetcher.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://nominatim.openstreetmap.org/reverse');
    expect(url.searchParams.get('lat')).toBe('24.374');
    expect(url.searchParams.get('lon')).toBe('88.601');
    expect(url.searchParams.get('accept-language')).toBe('bn');
    expect(fetcher.mock.calls[0][1].headers['User-Agent']).toMatch(/RITU/);
    await GET(new Request('http://local/api/places/reverse?lat=24.3741&lon=88.6012&language=bn'));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('returns null for unnamed places and 502 when the service fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => Response.json({ error: 'Unable to geocode' })),
    );
    let GET = await route();
    expect(
      await (await GET(new Request('http://local/api/places/reverse?lat=0&lon=-30'))).json(),
    ).toEqual({ name: null });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => new Response('', { status: 503 })),
    );
    GET = await route();
    expect((await GET(new Request('http://local/api/places/reverse?lat=24&lon=88'))).status).toBe(
      502,
    );
  });
});
