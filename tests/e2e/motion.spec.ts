import { expect, test } from '@playwright/test';

test.use({ reducedMotion: 'no-preference' });

test('tour moves continuously, reveals its instructions and guards repeated navigation', async ({
  page,
}) => {
  await page.goto('/');
  const tour = page.locator('.tour-dialog');
  await expect(tour.getByRole('button', { name: 'Start the tour' })).toBeEnabled();
  await tour.getByRole('button', { name: 'Start the tour' }).click();
  const next = tour.getByRole('button', { name: 'Next', exact: true });
  await expect(next).toBeEnabled();
  const samples = await next.evaluate(async (button) => {
    const records: {
      time: number;
      scroll: number;
      left: number;
      width: number;
      opacity: number;
      moving: boolean;
      cardTop: number;
      cardBottom: number;
    }[] = [];
    const start = performance.now();
    button.click();
    button.click();
    button.click();
    await new Promise<void>((resolve) => {
      const sample = () => {
        const light = document.querySelector('.tour-spotlight')!;
        const box = light.getBoundingClientRect();
        const heading = document.querySelector('#tour-title')!;
        const card = document.querySelector('.tour-card')!.getBoundingClientRect();
        records.push({
          time: performance.now() - start,
          scroll: window.scrollY,
          left: box.left,
          width: box.width,
          opacity: Number(getComputedStyle(heading).opacity),
          moving: light.getAnimations().some((a) => a.playState === 'running'),
          cardTop: card.top,
          cardBottom: card.bottom,
        });
        if (document.querySelector('.tour-card')?.getAttribute('aria-busy') === 'false') resolve();
        else requestAnimationFrame(sample);
      };
      requestAnimationFrame(sample);
    });
    return records;
  });
  await expect(tour.getByRole('heading', { name: 'Tell Ritu about water access' })).toBeVisible();
  await expect(tour.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
  expect(samples.at(-1)!.time).toBeGreaterThan(1000);
  expect(samples.some((s) => s.moving)).toBe(true);
  expect(samples.some((s) => s.opacity > 0 && s.opacity < 0.95 && s.time > 200)).toBe(true);
  expect(
    samples.every((s) => s.cardTop >= 0 && s.cardBottom <= page.viewportSize()!.height + 1),
  ).toBe(true);
  const first = samples[0].scroll;
  const last = samples.at(-1)!.scroll;
  expect(Math.abs(last - first)).toBeGreaterThan(10);
  expect(
    samples.some(
      (s) => s.scroll > Math.min(first, last) + 2 && s.scroll < Math.max(first, last) - 2,
    ),
  ).toBe(true);
  const box = await tour.locator('.tour-card').boundingBox();
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  await page.keyboard.press('Escape');
});

test('Escape during travel cancels motion, restores focus and preserves the farm', async ({
  page,
}) => {
  await page.goto('/');
  const tour = page.locator('.tour-dialog');
  await expect(tour.getByRole('button', { name: 'Start the tour' })).toBeEnabled();
  const saved = await page.evaluate(() => localStorage.getItem('ritu-preview-v1'));
  await tour.getByRole('button', { name: 'Start the tour' }).click();
  await expect(page).toHaveURL('/farm');
  const next = tour.getByRole('button', { name: 'Next', exact: true });
  await expect(next).toBeEnabled();
  // Enter the next step without a route handoff: navigation auto-waiting can
  // otherwise outlast the first animation, especially on an emulated phone.
  await next.evaluate((button) => (button as HTMLButtonElement).click());
  await expect(tour.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '3');
  await expect(tour.locator('.tour-card')).toHaveAttribute('aria-busy', 'true');
  await page.keyboard.press('Escape');
  await expect(tour).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Take a tour', exact: true })).toBeFocused();
  const scroll = await page.evaluate(() => window.scrollY);
  await page.waitForTimeout(1000); // Deliberately outlast the cancelled travel.
  expect(await page.evaluate(() => window.scrollY)).toBe(scroll);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
  expect(await page.evaluate(() => localStorage.getItem('ritu-preview-v1'))).toBe(saved);
});

test('switching to reduced motion settles a moving tour and keeps navigation usable', async ({
  page,
}) => {
  await page.goto('/');
  const tour = page.locator('.tour-dialog');
  await tour.getByRole('button', { name: 'Start the tour' }).click();
  await expect(page).toHaveURL('/farm');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const next = tour.getByRole('button', { name: 'Next', exact: true });
  await expect(next).toBeEnabled();
  await next.click();
  await expect(tour.getByRole('heading', { name: 'Tell Ritu about water access' })).toBeVisible();
  await expect(next).toBeEnabled();
  expect(
    await tour.evaluate(
      (element) =>
        element.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
    ),
  ).toBe(0);
});

test('3D camera renders intermediate views and stops rendering when settled', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ritu-tour-v1', 'seen');
    const state = window as Window & { rituDrawTimes?: number[] };
    state.rituDrawTimes = [];
    const original = WebGL2RenderingContext.prototype.drawElementsInstanced;
    WebGL2RenderingContext.prototype.drawElementsInstanced = function (...args) {
      state.rituDrawTimes!.push(performance.now());
      return original.apply(this, args);
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Open field view', exact: true }).click();
  await expect(page.locator('.field-viewport')).toHaveAttribute('data-renderer', 'ready');
  await page.locator('.field-viewport').scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  await page.evaluate(() => {
    (window as Window & { rituDrawTimes: number[] }).rituDrawTimes = [];
  });
  await page.getByRole('button', { name: 'View field from above' }).click();
  await expect
    .poll(async () =>
      page.evaluate(
        () =>
          new Set(
            (window as Window & { rituDrawTimes: number[] }).rituDrawTimes.map((time) =>
              Math.floor(time / 40),
            ),
          ).size,
      ),
    )
    .toBeGreaterThan(2);
  await page.waitForTimeout(700);
  const count = await page.evaluate(
    () => (window as Window & { rituDrawTimes: number[] }).rituDrawTimes.length,
  );
  await page.waitForTimeout(250);
  expect(
    await page.evaluate(
      () => (window as Window & { rituDrawTimes: number[] }).rituDrawTimes.length,
    ),
  ).toBe(count);
  await page.getByRole('button', { name: 'Reset field camera' }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.waitForTimeout(100);
  const settled = await page.evaluate(
    () => (window as Window & { rituDrawTimes: number[] }).rituDrawTimes.length,
  );
  await page.waitForTimeout(200);
  expect(
    await page.evaluate(
      () => (window as Window & { rituDrawTimes: number[] }).rituDrawTimes.length,
    ),
  ).toBe(settled);
});
