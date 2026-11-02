import fs from 'node:fs';
import { chromium, expect } from '@playwright/test';
const folder = 'research/global-audit-2026-11-01/walkthrough';
fs.mkdirSync(folder, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1600 },
  deviceScaleFactor: 2,
  reducedMotion: 'reduce',
});
await context.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
const page = await context.newPage(),
  errors = [],
  sources = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('response', async (response) => {
  if (!/\/api\/(season-context|weather|plant-photo|plants)\?/.test(response.url())) return;
  try {
    sources.push({
      url: response.url(),
      status: response.status(),
      at: new Date().toISOString(),
      body: await response.json(),
    });
  } catch {}
});
const shot = async (name, locator) => {
  await locator.scrollIntoViewIfNeeded();
  // Keep the component below the real sticky header; viewport intersection
  // alone does not account for an overlapping sticky element.
  for (let pass = 0; pass < 2; pass++) {
    await locator.evaluate((el) => {
      const bar = document.querySelector('.season-pick-bar');
      const offset = Math.max(110, bar ? bar.getBoundingClientRect().bottom + 32 : 0);
      window.scrollTo({
        top: Math.max(0, window.scrollY + el.getBoundingClientRect().top - offset),
        behavior: 'instant',
      });
    });
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
  }
  await expect
    .poll(() =>
      locator.evaluate((el) => {
        const bar = document.querySelector('.season-pick-bar');
        return !bar || el.getBoundingClientRect().top >= bar.getBoundingClientRect().bottom + 8;
      }),
    )
    .toBe(true);
  await locator.screenshot({ path: `${folder}/${name}.png` });
};
try {
  await page.goto('http://127.0.0.1:3000/farm');
  await page.getByText('Enter exact coordinates instead', { exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Latitude', exact: true }).fill('23.86186');
  await page.getByRole('spinbutton', { name: 'Longitude', exact: true }).fill('90.00273');
  await page.getByRole('button', { name: 'Use these coordinates', exact: true }).click();
  await expect(page.getByText('Selected field', { exact: true })).toBeVisible();
  await expect
    .poll(
      () =>
        sources.some(
          (r) =>
            r.status === 200 &&
            r.body.context?.site.latitude === 23.86186 &&
            r.body.context?.normal,
        ),
      { timeout: 90000 },
    )
    .toBe(true);
  await shot('01-location', page.locator('#farm-location'));
  await page
    .getByRole('textbox', { name: 'Farm name · optional', exact: true })
    .fill('Manikganj - QA walkthrough');
  await page.locator('#farm-area').fill('1');
  await page.getByRole('combobox', { name: 'Soil texture', exact: true }).selectOption('clay');
  await page
    .getByRole('combobox', { name: 'Does water drain away?', exact: true })
    .selectOption('unknown');
  await page.getByRole('radio', { name: 'Rain only', exact: true }).check();
  await shot('02a-field', page.locator('[data-tour="farm-basics"]'));
  await shot('02b-soil', page.locator('[data-tour="farm-soil"]'));
  await shot('02c-water', page.locator('[data-tour="farm-water"]'));
  await page.screenshot({ path: `${folder}/02-land-full.png`, fullPage: true });
  await page.getByRole('button', { name: 'Show suggested crops', exact: true }).click();
  await expect(page).toHaveURL(/\/crops$/);
  await page.getByRole('searchbox', { name: 'Search plants', exact: true }).fill('wheat');
  await expect(page.locator('.season-crop-card').first()).toBeVisible({ timeout: 60000 });
  const wheat = page
    .locator('.season-crop-card')
    .filter({ has: page.getByRole('radio', { name: 'Wheat', exact: true }) });
  await expect(wheat).toHaveCount(1);
  await wheat.getByRole('radio').check();
  // Let the real API/CDN settle; failures remain visible rather than mocked.
  await expect(wheat.locator('img')).toBeVisible({ timeout: 90000 });
  await expect
    .poll(() => wheat.locator('img').evaluate((img) => img.complete && img.naturalWidth > 32), {
      timeout: 90000,
    })
    .toBe(true);
  await shot('03-wheat', wheat);
  await page.screenshot({ path: `${folder}/04-selection-full.png`, fullPage: true });
  await page.getByRole('button', { name: 'Create my farm', exact: true }).click();
  await expect(page).toHaveURL(/\/plan$/);
  await expect(page.getByRole('heading', { name: 'Farm calendar', exact: true })).toBeVisible();
  await expect(page.getByLabel('Actual planting date', { exact: true })).toHaveValue('');
  await page.screenshot({ path: `${folder}/05-farm-full.png`, fullPage: true });
  await shot('05a-hero', page.locator('.season-farm-hero'));
  await shot('06-calendar', page.locator('.season-calendar'));
  await shot('07-daily', page.locator('.season-daily'));
  const weather = page.locator('[data-tour="track-weather"]');
  await weather.scrollIntoViewIfNeeded();
  await expect
    .poll(
      () =>
        sources.some(
          (r) =>
            r.url.includes('/api/weather?') &&
            r.status === 200 &&
            r.body.weather?.requested.latitude === 23.86186 &&
            r.body.weather?.requested.longitude === 90.00273,
        ),
      {
        timeout: 60000,
      },
    )
    .toBe(true);
  await expect(weather.locator('tbody tr')).toHaveCount(7);
  await shot('08-weather', weather);
  const records = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ritu-season-farms-v1')),
  );
  fs.writeFileSync(`${folder}/farm-records.json`, JSON.stringify(records, null, 2));
  await page.goto('http://127.0.0.1:3000/farms');
  await expect(page.locator('.season-farm-tile')).toHaveCount(1);
  await page.screenshot({ path: `${folder}/09-saved-farms.png`, fullPage: true });
  await shot('09a-farm-tile', page.locator('.season-farm-tile'));
  fs.writeFileSync(
    `${folder}/result.json`,
    JSON.stringify(
      {
        capturedAt: new Date().toISOString(),
        input: {
          coordinates: [23.86186, 90.00273],
          areaHa: 1,
          soil: 'clay',
          drainage: 'unknown',
          irrigation: 'rainfed',
          fieldInputs: 'QA assumptions, not measured farm facts',
        },
        selection: records.farms[0].selection,
        actualPlantingRecorded: false,
        errors,
        sources,
      },
      null,
      2,
    ),
  );
  if (errors.length) throw Error(errors.join('\n'));
} finally {
  await browser.close();
}
