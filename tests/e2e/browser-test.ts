import { test as base, expect } from '@playwright/test';
import raw from '../fixtures/open-meteo-20261026.json' with { type: 'json' };
import { parseWeather } from '../../src/domain/live-weather';
/** Recorded provider figures are deterministic TEST inputs, never shipped as live weather. */
export function testWeather(latitude = 24.37, longitude = 88.6) {
  const data = structuredClone(raw),
    now = Date.now();
  const local = new Date(now + data.utc_offset_seconds * 1000).toISOString().slice(0, 16);
  data.current.time = local;
  data.daily.time = Array.from({ length: 7 }, (_, i) =>
    new Date(Date.parse(`${local.slice(0, 10)}T00:00:00Z`) + i * 86400000)
      .toISOString()
      .slice(0, 10),
  );
  return parseWeather(
    data,
    { latitude, longitude, name: 'Test field' },
    new Date(now).toISOString(),
  );
}
export const test = base.extend({
  page: async ({ page }, runPage) => {
    await page.route('**/api/weather?**', (route) => {
      const q = new URL(route.request().url()).searchParams;
      return route.fulfill({
        json: { weather: testWeather(Number(q.get('latitude')), Number(q.get('longitude'))) },
      });
    });
    // Avoid bulk requests to the community tile service during exhaustive automated tours.
    await page.route('https://tile.openstreetmap.org/**', (route) =>
      route.fulfill({
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8xkAAAAASUVORK5CYII=',
          'base64',
        ),
      }),
    );
    await runPage(page);
  },
});
export { expect };
export type { Page } from '@playwright/test';
