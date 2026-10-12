import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
});

const bodyBackground = (page: import('@playwright/test').Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test('auto theme follows the system colour scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/farm');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await bodyBackground(page)).toBe('rgb(15, 29, 23)');
  await page.emulateMedia({ colorScheme: 'light' });
  expect(await bodyBackground(page)).toBe('rgb(244, 245, 239)');
});

test('a manual dark theme persists across reloads and overrides the system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/farm');
  await page.getByRole('button', { name: 'Reading & sound' }).click();
  await page.getByRole('radio', { name: 'Dark', exact: true }).check();
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await bodyBackground(page)).toBe('rgb(15, 29, 23)');
});

test('an invalid stored theme falls back to auto', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'ritu-display-v1',
      JSON.stringify({ text: 'larger', motion: true, sound: false, theme: 'neon' }),
    ),
  );
  await page.goto('/farm');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'larger');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
});

test('a stored record without a theme key loads other preferences and uses auto', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'ritu-display-v1',
      JSON.stringify({ text: 'larger', motion: true, sound: false }),
    ),
  );
  await page.goto('/farm');
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'larger');
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
});

test('manual light overrides a dark system scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/farm');
  await page.getByRole('button', { name: 'Reading & sound' }).click();
  await page.getByRole('radio', { name: 'Light', exact: true }).check();
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  expect(await bodyBackground(page)).toBe('rgb(244, 245, 239)');
});
