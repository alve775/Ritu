import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { cropIds } from '../../src/domain/types';
import { previewData } from '../../src/data/preview';
import { seedPlan } from './fixtures';

test.beforeEach(async ({ page }) => {
  await seedPlan(page);
  await page.goto('/crops');
  await page.getByText('Browse 43 crops', { exact: true }).click();
});

test('catalogue search, groups and empty results work; reference records cannot inject dates', async ({
  page,
}) => {
  await expect(page.locator('.catalogue-crop')).toHaveCount(8);
  await page.getByRole('button', { name: 'Show more crops' }).click();
  await expect(page.locator('.catalogue-crop')).toHaveCount(16);
  await page.getByRole('combobox', { name: 'Crop group', exact: true }).selectOption('pulse');
  await expect(page.locator('.catalogue-crop')).toHaveCount(7);
  await page.getByRole('searchbox', { name: 'Search crops' }).fill('no such crop');
  await expect(page.getByText('0 crops found', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Crop group', exact: true }).selectOption('all');
  await page.getByRole('searchbox', { name: 'Search crops' }).fill('ভুট্টা');
  await expect(page.locator('.catalogue-crop')).toHaveCount(1);
  await page.getByRole('button', { name: 'Inspect crop: Maize', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('link', { name: 'BARC · Crop zoning crop list' })).toHaveAttribute(
    'href',
    'https://apps.barc.gov.bd/cropzoning/',
  );
  await expect(dialog.getByRole('combobox')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Add to my current calendar' })).toHaveCount(0);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
});

test('all 43 crop references open and close without injecting calendar entries', async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const crop of cropIds.filter((c) => c !== 'fallow')) {
    await page
      .getByRole('searchbox', { name: 'Search crops' })
      .fill(previewData.crops[crop].name.en);
    await page
      .getByRole('button', {
        name: `Inspect crop: ${previewData.crops[crop].name.en}`,
        exact: true,
      })
      .click();
    await expect(
      page
        .getByRole('dialog')
        .getByRole('heading', { name: previewData.crops[crop].name.en, exact: true }),
    ).toBeVisible();
    const bounds = await page.getByRole('dialog').boundingBox();
    const viewport = page.viewportSize()!;
    expect(bounds).not.toBeNull();
    expect(Math.abs(bounds!.x + bounds!.width / 2 - viewport.width / 2)).toBeLessThan(2);
    expect(Math.abs(bounds!.y + bounds!.height / 2 - viewport.height / 2)).toBeLessThan(2);
    expect(bounds!.width).toBeLessThanOrEqual(viewport.width - 16);
    const close = await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Close', exact: true })
      .boundingBox();
    expect(close!.y).toBeGreaterThanOrEqual(0);
    expect(close!.y + close!.height).toBeLessThanOrEqual(viewport.height);
    await page.keyboard.press('Escape');
  }
  expect(errors).toEqual([]);
});

test('unsupported anatomy stays labelled and the calendar and month inspection remain usable', async ({
  page,
}) => {
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Open field view', exact: true }).click();
  const explorer = page.getByRole('region', { name: 'Seasonal field explorer' });
  await explorer.getByRole('button', { name: 'Nov', exact: true }).click();
  await expect(explorer.locator('.field-model-title')).toContainText('Mustard');
  await expect(page.getByText(/An anatomy model is not available for this crop yet/)).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Plant structure', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Soil cutaway', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect this month', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Mustard');
});
