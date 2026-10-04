import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const base = process.argv[2] ?? 'http://127.0.0.1:3004';
await mkdir('research/final-production', { recursive: true });
const browser = await chromium.launch();
const errors = [];
try {
  for (const settings of [
    { width: 1440, height: 1000, language: 'en', text: 'comfortable' },
    { width: 320, height: 800, language: 'bn', text: 'comfortable' },
    { width: 320, height: 800, language: 'bn', text: 'larger' },
  ]) {
    const page = await browser.newPage({ viewport: settings, reducedMotion: 'no-preference' });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript(
      (settings) =>
        localStorage.setItem(
          'ritu-display-v1',
          JSON.stringify({ text: settings.text, motion: true, sound: false }),
        ),
      settings,
    );
    await page.goto(base);
    const tour = page.locator('.tour-dialog');
    await expect(tour.locator('.tour-card')).toHaveAttribute('aria-busy', 'false');
    if (settings.language === 'bn')
      await tour.getByRole('button', { name: 'বাংলা', exact: true }).click();
    const total = Number(await tour.getByRole('progressbar').getAttribute('aria-valuemax'));
    for (let index = 1; index <= total; index++) {
      await expect(tour.locator('.tour-card')).toHaveAttribute('aria-busy', 'false');
      await expect(tour.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(index));
      const card = await tour.locator('.tour-card').boundingBox();
      expect(card.x).toBeGreaterThanOrEqual(-1);
      expect(card.y).toBeGreaterThanOrEqual(-1);
      expect(card.x + card.width).toBeLessThanOrEqual(settings.width + 1);
      expect(card.y + card.height).toBeLessThanOrEqual(settings.height + 1);
      if (index > 1) {
        const light = await tour.locator('.tour-spotlight').boundingBox();
        expect(light.height).toBeGreaterThan(20);
        expect(light.width).toBeGreaterThan(20);
        const overlap =
          Math.max(
            0,
            Math.min(card.x + card.width, light.x + light.width) - Math.max(card.x, light.x),
          ) *
          Math.max(
            0,
            Math.min(card.y + card.height, light.y + light.height) - Math.max(card.y, light.y),
          );
        expect(overlap).toBe(0);
      }
      const next = tour.locator('.tour-card-actions > div > button').last();
      const b = await next.boundingBox();
      expect(b.y + b.height).toBeLessThanOrEqual(card.y + card.height + 1);
      await page.screenshot({
        path: `research/final-production/${settings.width}-${settings.language}-${settings.text}-${String(index).padStart(2, '0')}.png`,
        scale: 'css',
      });
      await next.click();
    }
    await expect(tour).toHaveCount(0);
    console.log(
      `PASS: ${total} animated production tour steps, ${settings.width}x${settings.height}, ${settings.language}, ${settings.text}, no guide/spotlight overlap`,
    );
    await page.close();
  }
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
  await page.goto(base);
  await page.getByRole('button', { name: 'See suggested crops', exact: true }).click();
  for (const crop of ['Mung bean', 'Aman rice', 'Mustard'])
    await page.getByRole('checkbox', { name: 'Consider ' + crop, exact: true }).check();
  await page.getByRole('button', { name: 'Build my calendar', exact: true }).click();
  await page.getByRole('button', { name: 'Open field view', exact: true }).click();
  await expect(page.locator('.field-viewport')).toHaveAttribute('data-renderer', 'ready');
  await page.getByRole('combobox', { name: 'Crop to study', exact: true }).selectOption('potato');
  await page.locator('.explorer-months').getByRole('button', { name: 'Jan', exact: true }).click();
  await page.getByRole('button', { name: 'Soil cutaway', exact: true }).click();
  await expect(page.getByText(/tubers connected to stolons/)).toBeVisible();
  await page
    .locator('.field-figure')
    .screenshot({ path: 'research/final-production/potato-cutaway.png' });
  await page.getByRole('button', { name: 'Model sources & limits' }).click();
  await expect(
    page.getByRole('dialog').getByRole('link', { name: /International Potato Center/ }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Reading & sound' }).click();
  await page.getByRole('button', { name: 'Play farm sounds' }).click();
  await expect(page.getByText('Farm sounds are playing', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Soundscape' }).selectOption('evening');
  await page.screenshot({ path: 'research/final-production/sound-controls.png' });
  await page.getByRole('button', { name: 'Mute all sounds' }).click();
  await expect(page.getByRole('slider', { name: 'Sound volume' })).toHaveValue('0');
  await page.keyboard.press('Escape');
  await page.goto(base + '/crops');
  await page.getByText('Browse 42 crops', { exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search crops' }).fill('maize');
  await page.getByRole('button', { name: 'Inspect crop: Maize', exact: true }).click();
  await expect(
    page.getByRole('dialog').getByRole('link', { name: 'BARC · Crop zoning crop list' }),
  ).toBeVisible();
  const cropDialog = await page.getByRole('dialog').boundingBox();
  expect(Math.abs(cropDialog.x + cropDialog.width / 2 - 720)).toBeLessThan(2);
  expect(Math.abs(cropDialog.y + cropDialog.height / 2 - 500)).toBeLessThan(2);
  await page.screenshot({ path: 'research/final-production/crop-reference.png' });
  expect(errors).toEqual([]);
  console.log('PASS: optimized WebGL cutaway, crop reference, playback/scene/mute; no page errors');
} finally {
  await browser.close();
}
