import { test, expect, testWeather } from './browser-test';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
  await page.route('**/api/climate?**', (route) =>
    route.fulfill({ status: 502, json: { error: 'Test upstream unavailable' } }),
  );
});

test('device location records accuracy and map marker dragging updates the farm pin', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 24.38, longitude: 88.61, accuracy: 8 });
  await page.goto('/farm');
  await page.getByRole('button', { name: 'Use my location', exact: true }).click();
  await expect(page.locator('.selected-location')).toContainText('24.38000°, 88.61000°');
  await expect(
    page.getByText('Device accuracy: about 8 m. Adjust the pin if needed.', { exact: true }),
  ).toBeVisible();
  const marker = page.locator('.leaflet-marker-icon');
  await marker.scrollIntoViewIfNeeded();
  const box = (await marker.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 55, box.y + box.height / 2 - 35, { steps: 12 });
  await page.mouse.up();
  await expect(page.locator('.selected-location')).not.toContainText('24.38000°, 88.61000°');
  await expect(page.locator('.live-weather-metrics')).toBeVisible();
});

test('denied GPS and unavailable map tiles leave typed coordinates usable', async ({ page }) => {
  await page.addInitScript(() => {
    navigator.geolocation.getCurrentPosition = (_success, error) =>
      error?.({
        code: 1,
        message: 'Denied',
        PERMISSION_DENIED: 1,
        POSITION_UNAVAILABLE: 2,
        TIMEOUT: 3,
      });
  });
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
  await page.goto('/farm');
  await page.getByRole('button', { name: 'Use my location', exact: true }).click();
  await expect(page.getByText(/Location was unavailable or permission was denied/)).toBeVisible();
  await expect(page.getByText(/The map background could not load/)).toBeVisible();
  await page.getByText('Enter exact coordinates instead', { exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Latitude', exact: true }).fill('91');
  await expect(
    page.getByRole('button', { name: 'Use these coordinates', exact: true }),
  ).toBeDisabled();
  await page.getByRole('spinbutton', { name: 'Latitude', exact: true }).fill('24.38');
  await page.getByRole('button', { name: 'Use these coordinates', exact: true }).click();
  await expect(page.locator('.selected-location')).toContainText('24.38000°');
});

test('older requests never overwrite a newer farm location', async ({ page }) => {
  await page.route('**/api/weather?**', async (route) => {
    const q = new URL(route.request().url()).searchParams,
      lat = Number(q.get('latitude')),
      lon = Number(q.get('longitude'));
    const weather = testWeather(lat, lon);
    weather.current.temperature = lat === 24.38 ? 10 : 34;
    if (lat === 24.38) await new Promise((resolve) => setTimeout(resolve, 1800));
    try {
      await route.fulfill({ json: { weather } });
    } catch {
      /* The obsolete browser request was intentionally aborted. */
    }
  });
  await page.goto('/farm');
  await page.getByText('Enter exact coordinates instead', { exact: true }).click();
  const lat = page.getByRole('spinbutton', { name: 'Latitude', exact: true }),
    use = page.getByRole('button', { name: 'Use these coordinates', exact: true });
  await lat.fill('24.38');
  const request = page.waitForRequest((r) => r.url().includes('/api/weather?latitude=24.38'));
  await use.click();
  await request;
  await lat.fill('24.39');
  await use.click();
  await expect(page.locator('.live-weather-metrics')).toContainText('34.0 °C');
  await page.waitForTimeout(2000);
  await expect(page.locator('.selected-location')).toContainText('24.39000°');
  await expect(page.locator('.live-weather-metrics')).not.toContainText('10.0 °C');
});

test('returning online refreshes weather and stale provider timestamps are labelled', async ({
  page,
}) => {
  let count = 0;
  let online = false;
  await page.route('**/api/weather?**', (route) => {
    count++;
    const weather = testWeather();
    weather.current.temperature = online ? 29 : 25;
    if (!online)
      weather.current.time = new Date(Date.parse(`${weather.current.time}:00Z`) - 14400000)
        .toISOString()
        .slice(0, 16);
    return route.fulfill({ json: { weather } });
  });
  await page.goto('/farm');
  await expect(
    page.getByText(/provider’s current timestamp is over three hours old/),
  ).toBeVisible();
  const before = count;
  online = true;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.locator('.live-weather-metrics')).toContainText('29.0 °C');
  await expect(page.getByText(/provider’s current timestamp is over three hours old/)).toHaveCount(
    0,
  );
  expect(count).toBe(before + 1);
});

test('map styles can recover after an interrupted first load', async ({ page }) => {
  let attempts = 0;
  await page.route('**/vendor/leaflet/leaflet.css', (route) => {
    attempts++;
    return attempts === 1 ? route.abort() : route.continue();
  });
  await page.goto('/farm');
  await page.getByRole('button', { name: 'Retry map', exact: true }).click();
  await expect(page.locator('.leaflet-marker-icon')).toBeVisible();
  expect(await page.locator('.farm-map').evaluate((el) => getComputedStyle(el).overflow)).toBe(
    'hidden',
  );
  await expect(page.getByRole('button', { name: 'Retry map', exact: true })).toHaveCount(0);
});
