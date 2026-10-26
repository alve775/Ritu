import { afterEach, describe, expect, it, vi } from 'vitest';
import raw from '../../../../tests/fixtures/open-meteo-20261026.json';
afterEach(() => vi.unstubAllGlobals());
const request = () =>
  new Request('http://localhost/api/weather?latitude=24.37&longitude=88.6&url=https://example.com');
async function route() {
  vi.resetModules();
  return (await import('./route')).GET;
}
describe('weather endpoint', () => {
  it('validates query coordinates before contacting a fixed provider', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const GET = await route();
    for (const query of [
      '',
      'latitude=&longitude=88',
      'latitude=NaN&longitude=88',
      'latitude=24&longitude=181',
    ])
      expect((await GET(new Request(`http://localhost/api/weather?${query}`))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('deduplicates concurrent requests, caches public weather and ignores caller URLs', async () => {
    const fetcher = vi.fn().mockImplementation(async () => Response.json(raw));
    vi.stubGlobal('fetch', fetcher);
    const GET = await route();
    const responses = await Promise.all([GET(request()), GET(request())]);
    expect(responses.every((r) => r.status === 200)).toBe(true);
    const body = await responses[0].json();
    expect(body.weather.current.temperature).toBe(raw.current.temperature_2m);
    await GET(request());
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(new URL(fetcher.mock.calls[0][0]).hostname).toBe('api.open-meteo.com');
  });
  it('reports unavailable or invalid upstream data rather than returning samples', async () => {
    for (const result of [
      () => Promise.reject(Error('offline')),
      () => Promise.resolve(Response.json({})),
      () => Promise.resolve(new Response('limited', { status: 429 })),
    ]) {
      vi.stubGlobal('fetch', vi.fn().mockImplementation(result));
      const GET = await route();
      const response = await GET(request());
      expect(response.status).toBe(502);
      expect((await response.json()).weather).toBeUndefined();
    }
  });
});
