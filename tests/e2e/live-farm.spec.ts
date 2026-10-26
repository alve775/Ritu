import { test, expect, testWeather } from './browser-test';
import AxeBuilder from '@axe-core/playwright';
import { seedPlan } from './fixtures';
import { baselineClimate } from '../../src/data/demo-environment';
import { powerUrl } from '../../src/domain/nasa-power';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
});

test('landing fills the viewport, logo starts at left and growing animation can pause', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const landing = await page.locator('.landing').boundingBox();
  expect(landing!.x).toBe(0);
  expect(landing!.width).toBe(page.viewportSize()!.width);
  expect((await page.locator('.brand').boundingBox())!.x).toBeLessThan(55);
  await expect(page.getByRole('img', { name: 'An animated growing season' })).toBeVisible();
  expect(
    await page
      .locator('.growing-scene')
      .evaluate((el) => el.getAnimations({ subtree: true }).some((a) => a.playState === 'running')),
  ).toBe(true);
  await page.getByRole('button', { name: 'Pause animation', exact: true }).click();
  expect(
    await page
      .locator('.growing-scene')
      .evaluate((el) => el.getAnimations({ subtree: true }).every((a) => a.playState === 'paused')),
  ).toBe(true);
  await page.getByRole('button', { name: 'Play animation', exact: true }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  expect(
    await page
      .locator('.growing-scene')
      .evaluate(
        (el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
      ),
  ).toBe(0);
  await page.screenshot({ path: info.outputPath('landing-growing-season.png'), fullPage: true });
});

test('location leads intake, current weather loads without year or history buttons, map sits beside search', async ({
  page,
}, info) => {
  await page.goto('/farm');
  await expect(page.locator('.live-weather-metrics')).toBeVisible();
  await expect(page.getByLabel('Historical year', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Load NASA history' })).toHaveCount(0);
  const location = await page.locator('#farm-location').boundingBox(),
    field = await page.locator('[data-tour="farm-basics"]').boundingBox();
  expect(location!.y).toBeLessThan(field!.y);
  await expect(page.locator('.leaflet-marker-icon')).toBeVisible();
  if (info.project.name === 'desktop') {
    const input = await page.locator('#place-search').boundingBox(),
      map = await page.locator('.farm-map').boundingBox();
    expect(map!.x).toBeGreaterThan(input!.x + input!.width);
    expect((await page.locator('.app-header .brand').boundingBox())!.x).toBeLessThan(50);
  }
  await page.getByText('See the seven-day forecast', { exact: true }).click();
  await expect(page.locator('.forecast-scroll tbody tr')).toHaveCount(7);
  await expect(
    page
      .locator('.weather-source')
      .filter({ hasText: 'Current values are gridded model estimates' }),
  ).toBeVisible();
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page
    .locator('#farm-location')
    .screenshot({ path: info.outputPath('location-search-map-weather.png') });
});

test('Washington autocomplete selects the correct region, updates pin and weather, and avoids foreign crop dates', async ({
  page,
}) => {
  await page.route('**/api/places?**', (route) =>
    route.fulfill({
      json: {
        places: [
          {
            id: 1,
            name: 'Washington, District of Columbia, United States',
            latitude: 38.9,
            longitude: -77.04,
            countryCode: 'US',
          },
          {
            id: 2,
            name: 'Washington, England, United Kingdom',
            latitude: 54.9,
            longitude: -1.5,
            countryCode: 'GB',
          },
        ],
      },
    }),
  );
  await page.route('**/api/climate?**', (route) =>
    route.fulfill({ status: 502, json: { error: 'Not available' } }),
  );
  await page.goto('/farm');
  await page.getByRole('combobox', { name: 'Find your location', exact: true }).fill('Washington');
  await expect(page.getByRole('option', { name: /District of Columbia/ })).toBeVisible();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('.selected-location')).toContainText('38.90000°, -77.04000°');
  await expect(page.locator('.weather-panel')).toContainText('Washington, District of Columbia');
  await expect(
    page.getByRole('button', { name: 'See suggested crops', exact: true }),
  ).toBeDisabled();
  await expect(page.getByText(/Worldwide location and weather work here/)).toBeVisible();
});

test('map click or touch and keyboard center update exact coordinates and request matching data', async ({
  page,
}, info) => {
  await page.route('**/api/climate?**', (route) =>
    route.fulfill({ status: 502, json: { error: 'Unavailable' } }),
  );
  await page.goto('/farm');
  const map = page.locator('.farm-map');
  await expect(page.locator('.leaflet-marker-icon')).toBeVisible();
  const before = await page.locator('.selected-location').innerText();
  if (info.project.name === 'mobile') await map.tap({ position: { x: 80, y: 170 } });
  else await map.click({ position: { x: 80, y: 170 } });
  await expect(page.locator('.selected-location')).not.toHaveText(before);
  await expect(page.locator('.live-weather-metrics')).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'See suggested crops', exact: true }),
  ).toBeDisabled();
  const p = await page.evaluate(() => JSON.parse(localStorage.getItem('ritu-demo-v1')!).site);
  expect(p.latitude).not.toBe(24.37);
  await map.focus();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Use map center', exact: true }).click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('ritu-demo-v1')!).site.longitude),
  ).not.toBe(p.longitude);
});

test('NASA context follows a new supported pin automatically and failed data never reuses another point', async ({
  page,
}) => {
  await page.route('**/api/climate?**', (route) => {
    const q = new URL(route.request().url()).searchParams;
    const latitude = Number(q.get('latitude')),
      longitude = Number(q.get('longitude'));
    return route.fulfill({
      json: {
        climate: {
          ...baselineClimate,
          latitude,
          longitude,
          requestUrl: powerUrl(latitude, longitude, baselineClimate.year),
          id: `test-${latitude}-${longitude}`,
        },
      },
    });
  });
  await page.goto('/farm');
  await page.getByText('Enter exact coordinates instead', { exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Latitude', exact: true }).fill('24.38');
  await page.getByRole('button', { name: 'Use these coordinates', exact: true }).click();
  await expect
    .poll(async () =>
      page.evaluate(() => JSON.parse(localStorage.getItem('ritu-demo-v1')!).climate?.latitude),
    )
    .toBe(24.38);
  await expect(
    page.getByRole('button', { name: 'See suggested crops', exact: true }),
  ).toBeEnabled();
  await page.route('**/api/climate?**', (route) =>
    route.fulfill({ status: 502, json: { error: 'Unavailable' } }),
  );
  await page.getByRole('spinbutton', { name: 'Latitude', exact: true }).fill('24.39');
  await page.getByRole('button', { name: 'Use these coordinates', exact: true }).click();
  await page.getByText('NASA seasonal context & sources', { exact: true }).click();
  await expect(page.getByText(/NASA context is unavailable for this pin/)).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'See suggested crops', exact: true }),
  ).toBeDisabled();
});

test('forecast failure has no sample fallback and tracking stays attached to its saved farm', async ({
  page,
}) => {
  await seedPlan(page);
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
  const site = await page.evaluate(
    () => JSON.parse(localStorage.getItem('ritu-journey-v1')!).tracked.site,
  );
  expect(site.latitude).toBe(24.37);
  await page.goto('/farm');
  await page.getByText('Enter exact coordinates instead', { exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Latitude', exact: true }).fill('38.9');
  await page.getByRole('button', { name: 'Use these coordinates', exact: true }).click();
  await page.goto('/track');
  await expect(page.locator('.farm-monitor .weather-panel')).toContainText('Rajshahi');
  await page.route('**/api/weather?**', (route) =>
    route.fulfill({ status: 502, json: { error: 'Unavailable' } }),
  );
  await page.reload();
  await expect(page.getByText('Weather is temporarily unavailable', { exact: true })).toBeVisible();
  await expect(page.locator('.live-weather-metrics')).toHaveCount(0);
  await expect(page.getByText(/No sample weather is substituted/)).toBeVisible();
  await page.route('**/api/weather?**', (route) =>
    route.fulfill({ json: { weather: testWeather() } }),
  );
  await page.getByRole('button', { name: 'Retry weather', exact: true }).click();
  await expect(page.locator('.live-weather-metrics')).toBeVisible();
  const crop = page.locator('.tracking-crops > section').first();
  await crop.getByRole('checkbox', { name: 'Planted', exact: true }).check();
  await crop.getByLabel('Actual planting date · optional', { exact: true }).fill('2026-10-20');
  await expect(page.locator('.next-checks')).toContainText('2026-10-20');
  await page.reload();
  await expect(crop.getByLabel('Actual planting date · optional', { exact: true })).toHaveValue(
    '2026-10-20',
  );
});
