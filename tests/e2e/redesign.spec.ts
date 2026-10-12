import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
});

test('the app frame shows the logo, four steps and the tools', async ({ page }, info) => {
  await page.goto('/farm');
  await expect(page.locator('.brand-chip img')).toBeVisible();
  const steps = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(steps.getByRole('link')).toHaveCount(4);
  await expect(steps.getByRole('link', { name: 'Your farm' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(page.getByRole('button', { name: 'Take a tour', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reading & sound' })).toBeVisible();
  await expect(page.getByText('Saved on this device')).toBeVisible();
  const box = (await page.locator('.app-header').boundingBox())!;
  expect(box.height).toBeLessThanOrEqual(info.project.name === 'mobile' ? 64 : 80);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
