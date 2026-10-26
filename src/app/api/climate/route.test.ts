import { afterEach, describe, expect, it, vi } from 'vitest';
import raw from '../../../../tests/fixtures/power-rajshahi-2025.json';

afterEach(() => vi.unstubAllGlobals());
async function route() {
  vi.resetModules();
  return (await import('./route')).GET;
}
describe('NASA climate endpoint', () => {
  it('rejects malformed query values without contacting NASA', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    const GET = await route();
    for (const query of [
      '',
      'latitude=&longitude=88&year=2025',
      'latitude=abc&longitude=88&year=2025',
      'latitude=95&longitude=88&year=2025',
      'latitude=24&longitude=88&year=9999',
    ])
      expect((await GET(new Request(`http://localhost/api/climate?${query}`))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('fetches only the fixed NASA host, validates data and reuses the cache', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(raw));
    vi.stubGlobal('fetch', fetcher);
    const GET = await route(),
      request = new Request(
        'http://localhost/api/climate?latitude=24.37&longitude=88.60&year=2025&url=https://example.com',
      );
    const first = await GET(request);
    expect(first.status).toBe(200);
    const json = await first.json();
    expect(json.climate.source).toBe('NASA POWER');
    expect(json.climate.months).toHaveLength(12);
    expect(new URL(fetcher.mock.calls[0][0]).host).toBe('power.larc.nasa.gov');
    const second = await GET(request);
    expect((await second.json()).delivery).toBe('server-cache');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it('returns a clear error rather than fabricated data when NASA is unavailable or incomplete', async () => {
    for (const result of [
      () => Promise.reject(new Error('offline')),
      () => Promise.resolve(Response.json({})),
      () => Promise.resolve(new Response('busy', { status: 429 })),
    ]) {
      const fetcher = vi.fn().mockImplementation(result);
      vi.stubGlobal('fetch', fetcher);
      const GET = await route(),
        response = await GET(
          new Request('http://localhost/api/climate?latitude=24.37&longitude=88.60&year=2025'),
        );
      expect(response.status).toBe(502);
      expect((await response.json()).climate).toBeUndefined();
    }
  });
});
