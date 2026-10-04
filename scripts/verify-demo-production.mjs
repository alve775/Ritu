import { chromium, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
const base = process.argv[2] ?? 'http://127.0.0.1:3004';
const output = 'research/journey-production';
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
const errors = [];
const external = [];
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
    reducedMotion: 'reduce',
  });
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('request', (r) => {
    if (!['127.0.0.1', 'localhost'].includes(new URL(r.url()).hostname)) external.push(r.url());
  });
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
  await page.goto(base);
  await expect(
    page.getByRole('heading', { name: 'Start with your farm', exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: output + '/farm.png', scale: 'css' });
  await page.getByText('Location & demo environment', { exact: true }).click();
  await page.getByRole('button', { name: 'Help: Demo environment', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('authored example');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'See suggested crops', exact: true }).click();
  for (const crop of ['Mung bean', 'Aman rice', 'Mustard', 'Wheat'])
    await page.getByRole('checkbox', { name: 'Consider ' + crop, exact: true }).check();
  await page.screenshot({ path: output + '/suggestions.png', scale: 'css' });
  await page.getByRole('button', { name: 'Build my calendar', exact: true }).click();
  await expect(page.locator('.option-card')).toHaveCount(2);
  await page.screenshot({ path: output + '/calendar.png', scale: 'css' });
  await page.getByRole('link', { name: 'Try a water-shortage scenario', exact: true }).click();
  await page.getByRole('button', { name: 'Help: Scenario simulator', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('excluded');
  await page.keyboard.press('Escape');
  const original = await page.evaluate(() => localStorage.getItem('ritu-preview-v1'));
  await page
    .getByRole('combobox', { name: 'Scenario irrigation', exact: true })
    .selectOption('severe');
  await page.getByRole('combobox', { name: 'Scenario climate', exact: true }).selectOption('dry');
  await expect(page.getByRole('button', { name: 'Apply scenario', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('ritu-preview-v1'))).toBe(original);
  await page.getByRole('button', { name: 'Reset scenario draft', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'Scenario irrigation', exact: true })
    .selectOption('severe');
  await page.getByRole('button', { name: 'Apply scenario', exact: true }).click();
  await page.reload();
  await expect(
    page.getByRole('combobox', { name: 'Scenario irrigation', exact: true }),
  ).toHaveValue('severe');
  await page.getByRole('link', { name: 'Understand this choice', exact: true }).click();
  await expect(page.locator('.demo-check')).toHaveCount(7);
  await page.getByRole('button', { name: 'Help: Demo comparison rules', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('invented');
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Back to comparison', exact: true }).click();
  await page.getByRole('button', { name: 'Explore 3D crops', exact: true }).click();
  await expect(page.locator('.field-viewport')).toHaveAttribute('data-renderer', 'ready');
  await page.getByRole('combobox', { name: 'Crop to study', exact: true }).selectOption('potato');
  await page.getByRole('button', { name: 'Soil cutaway', exact: true }).click();
  await expect(page.getByText(/tubers connected to stolons/)).toBeVisible();
  await page.screenshot({ path: output + '/crop-study.png', scale: 'css' });
  await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
  await expect(page).toHaveURL(base + '/track');
  const crop = page.locator('.tracking-crops > section').first();
  await crop.getByRole('checkbox', { name: 'Planted', exact: true }).check();
  await crop.getByRole('checkbox', { name: 'Harvested', exact: true }).check();
  await crop.getByRole('textbox', { name: 'Notes', exact: true }).fill('Demo field record');
  await page.reload();
  await expect(crop.getByRole('checkbox', { name: 'Harvested', exact: true })).toBeChecked();
  await expect(crop.getByRole('textbox', { name: 'Notes', exact: true })).toHaveValue(
    'Demo field record',
  );
  await page.screenshot({ path: output + '/tracking.png', scale: 'css' });
  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await page.getByRole('button', { name: 'পড়া ও শব্দ', exact: true }).click();
  await page.getByRole('radio', { name: 'আরও বড়', exact: true }).check();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: output + '/tracking-bangla.png', fullPage: true, scale: 'css' });
  expect(errors).toEqual([]);
  expect(external).toEqual([]);
  console.log(
    'PASS: optimized four-step journey, locked windows, seven explanations, strict scenarios, tracking/reload, WebGL and 320px Bangla; no external requests or page errors',
  );
} finally {
  await browser.close();
}
