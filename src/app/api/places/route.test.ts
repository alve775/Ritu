import { afterEach, describe, expect, it, vi } from 'vitest';
afterEach(() => vi.unstubAllGlobals());
async function route() {
  vi.resetModules();
  return (await import('./route')).GET;
}
describe('worldwide place autocomplete', () => {
  it('avoids premature queries and rejects excessively long text', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const GET = await route();
    expect(await (await GET(new Request('http://local/api/places?q=Wa'))).json()).toEqual({
      places: [],
    });
    expect((await GET(new Request(`http://local/api/places?q=${'a'.repeat(121)}`))).status).toBe(
      400,
    );
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('keeps same-named locations disambiguated and uses only the fixed search host', async () => {
    const fetcher = vi.fn().mockImplementation(async () =>
      Response.json({
        results: [
          {
            id: 1,
            name: 'Washington',
            admin1: 'District of Columbia',
            country: 'United States',
            country_code: 'US',
            timezone: 'America/New_York',
            latitude: 38.9,
            longitude: -77,
          },
          {
            id: 2,
            name: 'Washington',
            admin1: 'England',
            country: 'United Kingdom',
            country_code: 'GB',
            latitude: 54.9,
            longitude: -1.5,
          },
        ],
      }),
    );
    vi.stubGlobal('fetch', fetcher);
    const GET = await route();
    const r = await GET(new Request('http://local/api/places?q=Washington'));
    const { places } = await r.json();
    expect(places[0].name).toContain('District of Columbia');
    expect(places[1].name).toContain('United Kingdom');
    expect(new URL(fetcher.mock.calls[0][0]).hostname).toBe('geocoding-api.open-meteo.com');
  });
  it('returns an actionable failure and no invented locations', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(Error('offline')));
    const GET = await route();
    const r = await GET(new Request('http://local/api/places?q=Washington'));
    expect(r.status).toBe(502);
    expect((await r.json()).places).toBeUndefined();
  });
});
