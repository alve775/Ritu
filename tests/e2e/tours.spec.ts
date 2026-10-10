import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { tourSteps } from '../../src/data/tours';

test('first visit offers a tour; skipping preserves the plan and does not repeat on reload', async ({
  page,
}) => {
  await page.goto('/');
  const tour = page.getByRole('dialog');
  await expect(
    tour.getByRole('heading', { name: 'Your mission: plan, then keep track' }),
  ).toBeVisible();
  const saved = await page.evaluate(() => localStorage.getItem('ritu-preview-v1'));
  await tour.getByRole('button', { name: 'Skip tour' }).click();
  await expect(tour).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Take a tour', exact: true })).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('ritu-preview-v1'))).toBe(saved);
  expect(await page.evaluate(() => localStorage.getItem('ritu-tour-v1'))).toBe('seen');
  await page.reload();
  await expect(page.getByText('Saved on this device')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('full mission visits every control with visible spotlights and preserves inputs', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto('/');
  const tour = page.getByRole('dialog');
  await expect(tour).toBeVisible();
  const saved = await page.evaluate(() => localStorage.getItem('ritu-preview-v1'));
  await tour.getByRole('button', { name: 'Start the tour' }).click();
  await expect(tour.getByRole('heading', { name: 'Make this farm yours' })).toBeVisible();
  await expect(page).toHaveURL('/farm');
  await tour.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(
    tour.getByRole('heading', { name: 'Your mission: plan, then keep track' }),
  ).toBeVisible();
  await tour.getByRole('button', { name: 'Start the tour' }).click();
  for (let step = 2; step <= tourSteps.length; step++) {
    await expect(tour.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(step));
    await expect(tour.locator('.tour-spotlight')).toBeVisible();
    const box = await tour.locator('.tour-card').boundingBox();
    const viewport = page.viewportSize()!;
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
    if (step === tourSteps.length) await tour.getByRole('button', { name: 'Finish tour' }).click();
    else await tour.getByRole('button', { name: 'Next', exact: true }).click();
  }
  await expect(tour).toHaveCount(0);
  await expect(page).toHaveURL('/track');
  expect(await page.evaluate(() => localStorage.getItem('ritu-preview-v1'))).toBe(saved);
});

test('top tour chooser replays every section and reopens a collapsed field', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
  await page.goto('/');
  const cases = [
    { choice: 'Interactive field', title: 'Inspect one rotation and month', route: '/plan' },
    { choice: 'Suggested crops', title: 'See only matching suggestions', route: '/crops' },
    { choice: 'Track your plan', title: 'Keep your saved calendar', route: '/track' },
    { choice: 'Your farm', title: 'Make this farm yours', route: '/farm' },
    { choice: 'Compare rotations', title: 'Compare the same twelve months', route: '/plan' },
    {
      choice: 'Your choice, explained',
      title: 'Read each rule and reason',
      route: '/insights',
    },
  ];
  for (const item of cases) {
    await page.getByRole('button', { name: 'Take a tour', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: new RegExp(item.choice) })
      .click();
    await expect(page).toHaveURL(item.route);
    await expect(page.getByRole('dialog').getByRole('heading', { name: item.title })).toBeVisible();
    await expect(page.locator('.tour-spotlight')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Take a tour', exact: true })).toBeFocused();
  }
});

test('tour is accessible, keyboard-contained and supports Bangla at 320px', async ({ page }) => {
  await page.goto('/');
  const tour = page.getByRole('dialog');
  await expect(tour).toBeVisible();
  let result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
  await tour.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(
    tour.getByRole('heading', { name: 'আপনার কাজ: পরিকল্পনা ও কাজের হিসাব' }),
  ).toBeVisible();
  await tour.getByRole('button', { name: 'পরিচিতি শুরু করুন' }).click();
  await expect(page).toHaveURL('/farm');
  await expect(tour.getByRole('heading', { name: 'নিজের জমির তথ্য দিন' })).toBeVisible();
  await tour.getByRole('button', { name: 'পরের ধাপ' }).click();
  await expect(tour.getByRole('heading', { name: 'সেচের সুযোগ জানান' })).toBeVisible();
  for (let i = 0; i < 10; i++) {
    await page.keyboard.press('Tab');
    expect(await tour.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  const card = await tour.locator('.tour-card').boundingBox();
  expect(card!.x + card!.width).toBeLessThanOrEqual(320);
  expect(card!.y + card!.height).toBeLessThanOrEqual(800);
  result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
  await page.keyboard.press('Escape');
  await expect(tour).toHaveCount(0);
});

test('first-visit tour can be dismissed when storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new DOMException('Unavailable', 'SecurityError');
    };
    Storage.prototype.setItem = () => {
      throw new DOMException('Unavailable', 'SecurityError');
    };
  });
  await page.goto('/');
  await page.getByRole('dialog').getByRole('button', { name: 'Skip tour' }).click();
  await expect(page.getByText('Storage unavailable — keep this tab open')).toBeVisible();
  await page.goto('/farm');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByLabel('Farm name', { exact: true })).toBeVisible();
});
