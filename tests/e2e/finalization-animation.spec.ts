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
    [4, 'care'],
    [7, 'grow'],
    [10, 'harvest'],
    [12.1, 'sow'],
  ] as const) {
    await svg.evaluate((s: SVGSVGElement, t) => s.setCurrentTime(t), time);
    await expect(scene).toHaveAttribute('data-stage', stage);
    await expect(svg.locator('[data-activity]')).toHaveCount(1);
    await expect(svg.locator('[data-activity]')).toHaveAttribute('data-activity', stage);
    await page.screenshot({ path: info.outputPath(`chapter-${stage}-${time}.png`) });
  }
  // Test an automatic boundary with real SVG time, rather than only selecting tabs.
  await svg.evaluate((s: SVGSVGElement) => s.setCurrentTime(2.7));
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

test('held grain, sickle and watering can stay in their grips throughout the motion', async ({
  page,
}) => {
  await page.goto('/');
  const svg = page.locator('.farm-vector');
  await svg.scrollIntoViewIfNeeded();
  for (const [chapter, start, props] of [
    ['Care', 3, ['watering-can']],
    ['Harvest', 9, ['grain', 'sickle']],
  ] as const) {
    await page.getByRole('button', { name: new RegExp(`^${chapter} · chapter`) }).click();
    const samples = await svg.evaluate(
      (root: SVGSVGElement, { start, props }) => {
        root.pauseAnimations();
        const point = (selector: string) => {
          const marker = root.querySelector<SVGCircleElement>(selector)!;
          const matrix = marker.getScreenCTM()!;
          return new DOMPoint(marker.cx.baseVal.value, marker.cy.baseVal.value).matrixTransform(
            matrix,
          );
        };
        return Array.from({ length: 30 }, (_, i) => {
          root.setCurrentTime(start + i * 0.095);
          return props.map((prop) => {
            const hand = point(`[data-grip="${prop}"]`),
              contact = point(`[data-contact="${prop}"]`);
            return {
              prop,
              gap: Math.hypot(hand.x - contact.x, hand.y - contact.y),
              x: contact.x,
              y: contact.y,
            };
          });
        });
      },
      { start, props },
    );
    for (const sample of samples.flat())
      expect(sample.gap, `${chapter}: ${sample.prop} detached`).toBeLessThan(0.01);
    for (const prop of props) {
      const points = samples.flat().filter((s) => s.prop === prop);
      expect(
        Math.max(...points.map((p) => p.y)) - Math.min(...points.map((p) => p.y)),
        `${prop} must actually move`,
      ).toBeGreaterThan(2);
    }
  }
});

test('the sickle reaches the stalks on the pull; seed flight starts at the open hand', async ({
  page,
}) => {
  await page.goto('/');
  const svg = page.locator('.farm-vector');
  await svg.scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Harvest · chapter 4 of 4' }).click();
  const gaps = await svg.evaluate((root: SVGSVGElement) => {
    root.pauseAnimations();
    const point = (selector: string) => {
      const marker = root.querySelector<SVGCircleElement>(selector)!;
      // Measure in illustration units so the assertions do not depend on viewport size.
      const matrix = root.getScreenCTM()!.inverse().multiply(marker.getScreenCTM()!);
      return new DOMPoint(marker.cx.baseVal.value, marker.cy.baseVal.value).matrixTransform(matrix);
    };
    // One cutting stroke lasts 1.8 s: sample a stroke and a half.
    return Array.from({ length: 55 }, (_, i) => {
      root.setCurrentTime(9 + i * 0.05);
      const base = point('[data-stalk-base]'),
        edge = point('[data-cutting-edge]');
      return Math.hypot(base.x - edge.x, base.y - edge.y);
    });
  });
  expect(Math.min(...gaps), 'blade meets the stalks').toBeLessThan(5);
  expect(Math.max(...gaps), 'blade clears the stalks on the reach').toBeGreaterThan(15);
  await page.getByRole('button', { name: 'Sow · chapter 1 of 4' }).click();
  const release = await svg.evaluate((root: SVGSVGElement) => {
    root.pauseAnimations();
    const seed = root.querySelector<SVGUseElement>('[data-seed-release] use')!;
    const point = (selector: string) => {
      const marker = root.querySelector<SVGCircleElement>(selector)!;
      return new DOMPoint(marker.cx.baseVal.value, marker.cy.baseVal.value).matrixTransform(
        root.getScreenCTM()!.inverse().multiply(marker.getScreenCTM()!),
      );
    };
    root.setCurrentTime(0.1);
    const hiddenBeforeRelease = getComputedStyle(seed).opacity;
    root.setCurrentTime(0.91);
    const hand = point('[data-release-point]'),
      origin = point('[data-seed-origin]');
    root.setCurrentTime(1.25);
    const released = Number(getComputedStyle(seed).opacity);
    root.setCurrentTime(2.5);
    return {
      hiddenBeforeRelease,
      gap: Math.hypot(hand.x - origin.x, hand.y - origin.y),
      released,
      hiddenAfterLanding: getComputedStyle(seed).opacity,
    };
  });
  expect(release.hiddenBeforeRelease).toBe('0');
  expect(release.gap).toBeLessThan(3);
  expect(release.released).toBeGreaterThan(0.5);
  expect(release.hiddenAfterLanding).toBe('0');
});
