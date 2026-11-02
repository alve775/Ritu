import { afterEach, beforeEach, expect, it, vi } from 'vitest';
beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-11-01T12:00:00Z'));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
it.each(['600', 'Sun, 01 Nov 2026 12:10:00 GMT'])(
  'honors the complete provider backoff %s across different requests',
  async (header) => {
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': header } }))
      .mockResolvedValue(new Response('{"query":{}}', { status: 200 }));
    vi.stubGlobal('fetch', fetcher);
    const { wikimediaApi } = await import('./wikimedia-api');
    const first = expect(wikimediaApi('commons', { titles: 'first' })).rejects.toMatchObject({
      retryAfterSeconds: 600,
    });
    await vi.runAllTimersAsync();
    await first;
    expect(fetcher.mock.calls[0][1].headers['User-Agent']).toContain(
      'https://github.com/alve775/Ritu',
    );
    await expect(wikimediaApi('commons', { titles: 'second' })).rejects.toMatchObject({
      retryAfterSeconds: 600,
    });
    await vi.advanceTimersByTimeAsync(599000);
    await expect(wikimediaApi('commons', { titles: 'third' })).rejects.toMatchObject({
      retryAfterSeconds: 1,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    const resumed = wikimediaApi('commons', { titles: 'fourth' });
    await vi.runAllTimersAsync();
    await expect(resumed).resolves.toEqual({ query: {} });
  },
);
