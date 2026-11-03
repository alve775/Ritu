import fs from 'node:fs';
import { chromium, expect } from '@playwright/test';
const out = 'output/audit/recommendation-2026-11-03';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true });
try {
  for (const [device, viewport] of [
    ['desktop', { width: 1440, height: 1100 }],
    ['phone', { width: 393, height: 852 }],
  ]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce' }),
      page = await context.newPage();
    await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
    // Only the wheat search's small photograph batch is requested in this proof;
    // unrelated catalogue photos are not needed to prove the input/output path.
    await page.route('**/api/plant-photo?**', (r) => {
      const q = new URL(r.request().url()).searchParams,
        ids = (q.get('plants') ?? q.get('plant') ?? '').split(',');
      return ids.length <= 2 && ids.includes('wheat')
        ? r.continue()
        : r.fulfill({
            status: 503,
            json: { error: 'Unrelated images intentionally omitted in this narrow capture' },
          });
    });
    await page.goto('http://127.0.0.1:3000/farm');
    await page.getByText('Enter exact coordinates instead', { exact: true }).click();
    await page.getByLabel('Latitude', { exact: true }).fill('23.86186');
    await page.getByLabel('Longitude', { exact: true }).fill('90.00273');
    await page.getByRole('button', { name: 'Use these coordinates', exact: true }).click();
    await page
      .getByRole('textbox', { name: 'Farm name · optional', exact: true })
      .fill('Verification only · assumed field conditions');
    await page.locator('#farm-area').fill('1');
    await page.getByLabel('Soil texture', { exact: true }).selectOption('clay');
    await page.getByLabel('Does water drain away?', { exact: true }).selectOption('unknown');
    await page.getByRole('radio', { name: 'Rain only', exact: true }).check();
    await expect(
      page.getByRole('button', { name: 'Show suggested crops', exact: true }),
    ).toBeEnabled();
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${out}/${device}-01-input.png`, fullPage: true });
    await page.getByRole('button', { name: 'Show suggested crops', exact: true }).click();
    await page.getByRole('searchbox', { name: 'Search plants', exact: true }).fill('wheat');
    await expect(page.getByRole('radio', { name: 'Wheat', exact: true })).toBeVisible();
    const card = page
      .locator('.season-crop-card')
      .filter({ has: page.getByRole('radio', { name: 'Wheat', exact: true }) });
    await card.scrollIntoViewIfNeeded();
    const retry = card.getByRole('button', { name: 'Retry photo', exact: true });
    if (await retry.isVisible()) await retry.click();
    try {
      await expect(card.locator('.crop-photo img')).toBeVisible({ timeout: 15000 });
      await card.locator('.crop-photo img').evaluate((img) => img.decode());
    } catch {
      /* An unavailable real photo stays explicitly unavailable. */
    }
    await card.getByText('Why this option & what to check', { exact: true }).click();
    // Opening one card's explanation must not stretch a neighbouring card's
    // badges and text into the expanded card's row height.
    if (device === 'desktop') {
      const other = page
        .locator('.season-crop-card')
        .filter({ has: page.getByRole('radio', { name: 'Durum wheat', exact: true }) });
      expect((await other.boundingBox()).height).toBeLessThan(
        (await card.boundingBox()).height - 100,
      );
      expect((await other.locator('.season-source-pill').boundingBox()).height).toBeLessThan(80);
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${out}/${device}-02-option.png`, fullPage: true });
    await page.getByRole('radio', { name: 'Wheat', exact: true }).check();
    await page.getByRole('button', { name: 'Create my farm', exact: true }).click();
    await expect(page).toHaveURL(/\/plan$/);
    await expect(page.getByLabel('Actual planting date', { exact: true })).toHaveValue('');
    const record = await page.evaluate(
      () => JSON.parse(localStorage.getItem('ritu-season-farms-v1')).farms[0],
    );
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: `${out}/${device}-03-calendar.png`, fullPage: true });
    fs.writeFileSync(
      `${out}/${device}-record.json`,
      JSON.stringify(
        {
          note: 'Real app/NASA data; chosen area, soil and water are QA assumptions, not surveyed facts.',
          capturedAt: new Date().toISOString(),
          record,
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify({
        device,
        crop: record.selection.crop,
        plannedStart: record.selection.start,
        referenceDays: [record.selection.durationMin, record.selection.durationMax],
        plantedDate: record.plantedDate,
        water: record.selection.checks.find((c) => c.factor === 'water').state,
        source: record.context.normal.sourceUrl,
      }),
    );
    await context.close();
  }
} finally {
  await browser.close();
}
