import { afterEach, describe, expect, it, vi } from 'vitest';
import actual from '../../../../tests/fixtures/power-normal-manikganj.json';
import { GET } from './route';
vi.mock('../../../lib/server-upstream', () => ({
  cachedUpstream: async (_key: string, _ttl: number, load: () => Promise<unknown>) => load(),
}));
afterEach(() => vi.unstubAllGlobals());
describe('global season context API', () => {
  it('rejects incomplete point coordinates instead of accepting unverified geography', async () => {
    for (const coordinates of [[], [90]]) {
      const incomplete = structuredClone(actual);
      incomplete.geometry.coordinates = coordinates;
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(incomplete)));
      const response = await GET(
        new Request('http://localhost/api/season-context?latitude=23.86186&longitude=90.00273'),
      );
      expect(response.status).toBe(502);
    }
  });
  it('rejects absent and invalid points without an upstream request', async () => {
    const fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    for (const query of [
      '',
      '?latitude=23',
      '?latitude=NaN&longitude=90',
      '?latitude=86&longitude=90',
    ])
      expect((await GET(new Request('http://localhost/api/season-context' + query))).status).toBe(
        400,
      );
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('returns actual baseline values and the selected point’s unfilled calendar records', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(actual)));
    const response = await GET(
      new Request('http://localhost/api/season-context?latitude=23.86186&longitude=90.00273'),
    );
    expect(response.status).toBe(200);
    const { context } = await response.json();
    expect(context.normal.period).toBe('1991–2020');
    expect(context.normal.months[0].temperature).toBe(17.84);
    expect(context.site.latitude).toBe(23.86186);
    expect(context.calendars.length).toBeGreaterThan(0);
    expect(
      context.calendars.every((c: { sourceUrl: string }) => !c.sourceUrl.includes('.fill.')),
    ).toBe(true);
  });
  it('does not turn another point’s response or failed NASA call into suggestions', async () => {
    const wrong = structuredClone(actual);
    wrong.geometry.coordinates[1] = 1;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(wrong)));
    expect(
      (
        await GET(
          new Request('http://localhost/api/season-context?latitude=23.86186&longitude=90.00273'),
        )
      ).status,
    ).toBe(502);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('Unavailable', { status: 503 })));
    const r = await GET(
      new Request('http://localhost/api/season-context?latitude=23.86186&longitude=90.00273'),
    );
    expect(r.status).toBe(502);
    expect((await r.json()).context).toBeUndefined();
  });
});
