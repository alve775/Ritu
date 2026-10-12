import { expect, test } from '@playwright/test';
import { chooseDefaultCrops } from './fixtures';

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

test.fixme('the year wheel is keyboard operable and stays in sync with the calendar month', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/farm');
  await chooseDefaultCrops(page);
  const april = page.getByRole('button', { name: 'Year wheel: Apr', exact: true });
  await april.focus();
  await page.keyboard.press('Enter');
  await expect(april).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('button', { name: 'Inspect month: Apr', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  const animation = await page
    .locator('.year-wheel.full .arc')
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe('none');
});
