import { afterEach, describe, expect, it, vi } from 'vitest';
import actual from '../../../../tests/fixtures/power-normal-manikganj.json';
import { GET } from './route';
vi.mock('../../../lib/server-upstream', () => ({
  cachedUpstream: async (_key: string, _ttl: number, load: () => Promise<unknown>) => load(),
}));
afterEach(() => vi.unstubAllGlobals());
const base =
  'http://localhost/api/plants?latitude=23.86186&longitude=90.00273&from=2026-11-01&soil=unknown&drainage=unknown&irrigation=reliable';
describe('plant search endpoint', () => {
  it('validates request bounds before any network access', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    for (const [key, value] of [
      ['latitude', ' '],
      ['longitude', 'Infinity'],
      ['from', '9999-12-31'],
      ['from', '2026-02-30'],
      ['soil', 'invented'],
      ['page', '1.5'],
      ['mode', 'invented'],
      ['q', 'a'.repeat(121)],
    ]) {
      const url = new URL(base);
      url.searchParams.set(key, value);
      expect((await GET(new Request(url))).status).toBe(400);
    }
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('returns case-insensitive, source-backed results with bounded pages and exact source identifiers', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => Response.json(actual));
    vi.stubGlobal('fetch', fetcher);
    const response = await GET(
      new Request(base + '&mode=catalogue&category=all&q=MANGIFERA%20INDICA'),
    );
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.total).toBe(2562);
    expect(data.count).toBe(1);
    expect(data.items[0].plant.scientific).toBe('Mangifera indica');
    expect(data.items[0].suggestion.planKind).toBe('perennial-review');
    expect(fetcher.mock.calls[0][0]).toContain('https://power.larc.nasa.gov/');
    expect(data.source.sha256).toMatch(/^[0-9a-f]{64}$/);
  });
  it('does not manufacture suggestions when NASA cannot be verified', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('', { status: 503 })),
    );
    const response = await GET(new Request(base));
    expect(response.status).toBe(502);
    expect((await response.json()).error).toContain('No sample suggestions');
  });
});
