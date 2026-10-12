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

test('tabbing through the farm form never hides the focused control behind the sticky bar', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/farm');
  await expect(
    page.getByRole('button', { name: 'See suggested crops', exact: true }),
  ).toBeEnabled();
  for (const summary of await page.locator('main details > summary').all()) await summary.click();
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
    window.scrollTo(0, 0);
  });
  const covered: string[] = [];
  let visited = 0;
  for (let i = 0; i < 70; i++) {
    await page.keyboard.press('Tab');
    const result = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      const bar = document.querySelector('.farm-bottom-cta');
      if (!el || el === document.body || !bar || bar.contains(el)) return null;
      // Radios and checkboxes are visually hidden inside their label tile.
      const target = el.matches('input') ? (el.closest('label') ?? el) : el;
      const a = target.getBoundingClientRect();
      if (!a.width || !a.height) return null;
      const b = bar.getBoundingClientRect();
      const x = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left));
      const y = Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
      const name = (el.getAttribute('aria-label') ?? el.textContent ?? el.tagName).trim();
      return { ratio: (x * y) / (a.width * a.height), name: name.slice(0, 40) };
    });
    if (!result) continue;
    visited++;
    if (result.ratio > 0.5) covered.push(`${result.name} (${Math.round(result.ratio * 100)}%)`);
  }
  expect(visited).toBeGreaterThan(20);
  expect(covered).toEqual([]);
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

test('the disabled Build button points to the status that explains it, and filters never change choices', async ({
  page,
}) => {
  await page.goto('/farm');
  await page.getByRole('button', { name: 'See suggested crops', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Consider Mung bean', exact: true }).check();
  const checkboxes = page.getByRole('checkbox');
  const states = () =>
    checkboxes.evaluateAll((els) => els.map((el) => (el as HTMLInputElement).checked));
  const before = await states();
  expect(before.filter(Boolean).length).toBeGreaterThan(0);
  const build = page.getByRole('button', { name: 'Build my calendar', exact: true });
  await expect(build).toBeDisabled();
  const describedBy = await build.getAttribute('aria-describedby');
  expect(describedBy).toBeTruthy();
  await expect(page.locator(`#${describedBy}`)).toContainText('Choose a suggested crop for:');
  await page.getByRole('button', { name: 'Pre-monsoon', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Pre-monsoon', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'All', exact: true }).click();
  expect(await states()).toEqual(before);
});

test('season filters with no matching crops are disabled in the blocker state', async ({
  page,
}) => {
  await page.goto('/farm');
  await page.getByRole('combobox', { name: 'Drainage', exact: true }).selectOption('poor');
  await page.getByRole('button', { name: 'See suggested crops', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Consider Aman rice', exact: true }).check();
  const build = page.getByRole('button', { name: 'Build my calendar', exact: true });
  const describedBy = await build.getAttribute('aria-describedby');
  await expect(page.locator(`#${describedBy}`)).toContainText(
    'No matching crop windows for: Pre-monsoon, Winter.',
  );
  await expect(page.getByRole('button', { name: 'Pre-monsoon', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Winter', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'All', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Monsoon', exact: true })).toBeEnabled();
});
