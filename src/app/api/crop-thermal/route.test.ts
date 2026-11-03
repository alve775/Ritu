import { afterEach, describe, expect, it, vi } from 'vitest';
import { trackingFarm } from '../../../../tests/fixtures/tracking-farm';
const site = trackingFarm().site;
function raw() {
  return {
    latitude: site.latitude,
    longitude: site.longitude,
    timezone: 'Asia/Dhaka',
    daily_units: { temperature_2m_min: '°C', temperature_2m_max: '°C' },
    daily: {
      time: ['2026-03-04', '2026-03-05', '2026-03-06'],
      temperature_2m_min: [10, 10, 10],
      temperature_2m_max: [30, 30, 30],
    },
  };
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
async function handler() {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-03-05T10:00:00Z'));
  return (await import('./route')).GET;
}
const request = (from = '2026-03-01') =>
  new Request(
    `http://localhost/api/crop-thermal?latitude=${site.latitude}&longitude=${site.longitude}&from=${from}&url=https://example.org&note=private`,
  );
describe('crop temperature endpoint', () => {
  it('validates dates and coordinates without contacting providers', async () => {
    const GET = await handler(),
      fetcher = vi.fn();
    vi.stubGlobal('fetch', fetcher);
    for (const q of [
      '',
      'latitude=&longitude=88&from=2026-03-01',
      'latitude=NaN&longitude=88&from=2026-03-01',
      'latitude=90&longitude=88&from=2026-03-01',
      'latitude=24&longitude=88&from=2020-01-01',
    ])
      expect((await GET(new Request('http://localhost/api/crop-thermal?' + q))).status).toBe(400);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it('deduplicates public source loads, ignores caller URLs/private inputs, and returns parsed evidence', async () => {
    const GET = await handler(),
      fetcher = vi.fn<(url: string) => Promise<Response>>(async () => Response.json(raw()));
    vi.stubGlobal('fetch', fetcher);
    const results = await Promise.all([GET(request()), GET(request())]);
    expect(results.every((r) => r.status === 200)).toBe(true);
    const body = await results[0].json();
    expect(body.series.history).toHaveLength(1);
    expect(body.series.forecast).toHaveLength(2);
    await GET(request());
    expect(fetcher).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetcher.mock.calls[0][0]));
    expect(url.hostname).toBe('api.open-meteo.com');
    expect(url.searchParams.has('note')).toBe(false);
  });
  it('keeps missing archive history absent and fails honestly if the forecast provider fails', async () => {
    const GET = await handler();
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) =>
        url.includes('archive-api')
          ? new Response('unavailable', { status: 503 })
          : Response.json(raw()),
      ),
    );
    const r = await GET(request('2026-02-01'));
    expect(r.status).toBe(200);
    const body = await r.json();
    expect(body.series.history).toHaveLength(1);
    expect(body.series.sources).toHaveLength(1);
    const next = await handler();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('limited', { status: 429 })),
    );
    const failure = await next(request());
    expect(failure.status).toBe(502);
    expect((await failure.json()).series).toBeUndefined();
  });
});
