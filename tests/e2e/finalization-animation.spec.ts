import { test, expect } from './browser-test';
test('story advances sow, care, grow, harvest and replay with exactly one action', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const svg = page.locator('.farm-vector'),
    scene = page.locator('.growing-scene');
  await svg.scrollIntoViewIfNeeded();
  await expect(scene).toHaveAttribute('data-stage', 'sow');
  for (const [time, stage] of [
    [1, 'sow'],
    [8, 'care'],
    [18, 'grow'],
    [26, 'harvest'],
    [31.1, 'sow'],
  ] as const) {
    await svg.evaluate((s: SVGSVGElement, t) => s.setCurrentTime(t), time);
    await expect(scene).toHaveAttribute('data-stage', stage);
    await expect(svg.locator('[data-activity]')).toHaveCount(1);
    await expect(svg.locator('[data-activity]')).toHaveAttribute('data-activity', stage);
    await page.screenshot({ path: info.outputPath(`chapter-${stage}-${time}.png`) });
  }
  // Test an automatic boundary with real SVG time, rather than only selecting tabs.
  await svg.evaluate((s: SVGSVGElement) => s.setCurrentTime(6.7));
  await expect(scene).toHaveAttribute('data-stage', 'care', { timeout: 2500 });
  await page.getByRole('button', { name: 'Pause animation' }).click();
  const time = await svg.evaluate((s: SVGSVGElement) => s.getCurrentTime());
  await page.waitForTimeout(700);
  expect(await svg.evaluate((s: SVGSVGElement) => s.getCurrentTime())).toBe(time);
  await expect(scene).toHaveAttribute('data-stage', 'care');
  await page.getByRole('button', { name: 'Harvest · chapter 4 of 4' }).click();
  await expect(scene).toHaveAttribute('data-stage', 'harvest');
  expect(await svg.evaluate((s: SVGSVGElement) => s.animationsPaused())).toBe(true);
  await page.getByRole('button', { name: 'Replay from sowing' }).click();
  await expect(scene).toHaveAttribute('data-stage', 'sow');
  await expect.poll(() => svg.evaluate((s: SVGSVGElement) => s.animationsPaused())).toBe(false);
});
test('reduced-motion storyboard remains still and chapters remain selectable', async ({ page }) => {
  await page.goto('/');
  const svg = page.locator('.farm-vector');
  await svg.scrollIntoViewIfNeeded();
  await expect.poll(() => svg.evaluate((s: SVGSVGElement) => s.animationsPaused())).toBe(true);
  for (const [name, stage] of [
    ['Care · chapter 2 of 4', 'care'],
    ['Grow · chapter 3 of 4', 'grow'],
    ['Harvest · chapter 4 of 4', 'harvest'],
  ] as const) {
    await page.getByRole('button', { name }).click();
    await expect(page.locator('.growing-scene')).toHaveAttribute('data-stage', stage);
    await expect(svg.locator('[data-activity]')).toHaveCount(1);
    const time = await svg.evaluate((s: SVGSVGElement) => s.getCurrentTime());
    await page.waitForTimeout(100);
    expect(await svg.evaluate((s: SVGSVGElement) => s.getCurrentTime())).toBe(time);
  }
});
