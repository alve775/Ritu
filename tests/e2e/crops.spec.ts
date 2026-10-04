import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { cropIds } from '../../src/domain/types';
import { previewData } from '../../src/data/preview';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
  await page.goto('/');
  await page.getByText('Browse 43 crops', { exact: true }).click();
});

test('catalogue search, groups, empty results and explicit date entry work end to end', async ({
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
  const add = dialog.getByRole('button', { name: 'Add to my current calendar' });
  await expect(add).toBeDisabled();
  await dialog.getByRole('combobox', { name: 'Your start month' }).selectOption('0');
  await expect(add).toBeDisabled();
  await dialog.getByRole('combobox', { name: 'Your duration in months' }).selectOption('3');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
  await add.click();
  await expect(
    page.getByText('Maize added with your dates. Review calendar conflicts.'),
  ).toBeVisible();
  await page.reload();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('ritu-preview-v1')!));
  expect(saved.farm.current.at(-1)).toEqual({ crop: 'maize', start: 0, duration: 3 });
  expect(saved.selected).toBe('current');
  await expect(page.locator('.choice-panel')).toContainText('Your current rotation');
});

test('every crop can be inspected and selected in the sequence editor without a runtime error', async ({
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
  await page.getByRole('link', { name: 'Edit farm', exact: true }).click();
  await page.getByText('Current crops & planting dates', { exact: true }).click();
  await page.getByRole('button', { name: 'Edit sequence', exact: true }).click();
  for (const crop of cropIds) {
    await page.getByRole('combobox', { name: 'Crop 1', exact: true }).selectOption(crop);
    await expect(page.getByRole('combobox', { name: 'Crop 1', exact: true })).toHaveValue(crop);
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('ritu-preview-v1')!).farm.current[0].crop,
      ),
    ).toBe(crop);
  }
  expect(errors).toEqual([]);
});

test('unsupported anatomy is clearly labelled and leaves 3D controls and month inspection usable', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'Edit farm', exact: true }).click();
  await page.getByText('Current crops & planting dates', { exact: true }).click();
  await page.getByRole('button', { name: 'Edit sequence', exact: true }).click();
  await page.getByRole('combobox', { name: 'Crop 1', exact: true }).selectOption('maize');
  await page.getByRole('link', { name: 'Compare my options', exact: true }).click();
  await page.getByRole('button', { name: 'Select Your current rotation', exact: true }).click();
  await page.getByRole('button', { name: 'Open field view', exact: true }).click();
  await expect(page.locator('.field-model-title')).toContainText('Maize');
  await expect(page.getByText(/An anatomy model is not available for this crop yet/)).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Plant structure', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Soil cutaway', exact: true }).click();
  await page.getByRole('button', { name: 'Inspect this month', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Maize');
});
