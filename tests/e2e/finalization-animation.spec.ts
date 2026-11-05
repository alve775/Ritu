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

test('held grain, sickle and watering can stay in their grips throughout the motion', async ({
  page,
}) => {
  await page.goto('/');
  const svg = page.locator('.farm-vector');
  await svg.scrollIntoViewIfNeeded();
  for (const [chapter, start, props] of [
    ['Care', 7, ['watering-can']],
    ['Harvest', 23, ['grain', 'sickle']],
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
        return Array.from({ length: 81 }, (_, i) => {
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

test('both harvest arms retain matching segment lengths in every pose', async ({ page }) => {
  await page.goto('/');
  const svg = page.locator('.farm-vector');
  await svg.scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Harvest · chapter 4 of 4' }).click();
  const samples = await svg.evaluate((root: SVGSVGElement) => {
    root.pauseAnimations();
    const body = root.querySelector<SVGGElement>(
      '[data-farm-worker="harvest"] [data-worker-body]',
    )!;
    return Array.from({ length: 81 }, (_, i) => {
      root.setCurrentTime(23 + i * 0.095);
      return ['far', 'near'].map((arm) => {
        const joint = (name: string) => {
          const point = body.querySelector<SVGCircleElement>(
            `[data-worker-arm="${arm}"] [data-arm-joint="${name}"]`,
          )!;
          return new DOMPoint(0, 0).matrixTransform(
            body.getCTM()!.inverse().multiply(point.getCTM()!),
          );
        };
        const shoulder = joint('shoulder'),
          elbow = joint('elbow'),
          wrist = joint('wrist');
        return {
          arm,
          upper: Math.hypot(shoulder.x - elbow.x, shoulder.y - elbow.y),
          forearm: Math.hypot(elbow.x - wrist.x, elbow.y - wrist.y),
        };
      });
    });
  });
  for (const pose of samples) {
    for (const arm of pose) {
      expect(arm.upper, `${arm.arm} upper arm`).toBeCloseTo(20, 6);
      expect(arm.forearm, `${arm.arm} forearm`).toBeCloseTo(18, 6);
    }
    expect(pose[0].upper).toBeCloseTo(pose[1].upper, 6);
    expect(pose[0].forearm).toBeCloseTo(pose[1].forearm, 6);
  }
});

test('harvest arm silhouettes remain separated through the entire action', async ({ page }) => {
  await page.goto('/');
  const svg = page.locator('.farm-vector');
  await svg.scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Harvest · chapter 4 of 4' }).click();
  const samples = await svg.evaluate((root: SVGSVGElement) => {
    root.pauseAnimations();
    const body = root.querySelector<SVGGElement>(
      '[data-farm-worker="harvest"] [data-worker-body]',
    )!;
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 220;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const mask = (arm: string) => {
      ctx.resetTransform();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      body
        .querySelectorAll<SVGPathElement>(
          `[data-worker-arm="${arm}"] [data-arm-silhouette], [data-worker-arm="${arm}"] [data-arm-sleeve], [data-worker-arm="${arm}"] [data-arm-hand]`,
        )
        .forEach((path) => {
          const m = body.getCTM()!.inverse().multiply(path.getCTM()!);
          ctx.setTransform(2 * m.a, 2 * m.b, 2 * m.c, 2 * m.d, 70 + 2 * m.e, 45 + 2 * m.f);
          ctx.fillStyle = ctx.strokeStyle = '#fff';
          ctx.lineWidth = Number.parseFloat(getComputedStyle(path).strokeWidth);
          const shape = new Path2D(path.getAttribute('d')!);
          ctx.fill(shape);
          ctx.stroke(shape);
        });
      return ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    return Array.from({ length: 81 }, (_, i) => {
      const time = 23 + i * 0.095;
      root.setCurrentTime(time);
      const holding = mask('far'),
        cutting = mask('near');
      let overlap = 0,
        holdingPixels = 0,
        cuttingPixels = 0;
      for (let p = 3; p < holding.length; p += 4) {
        if (holding[p] > 128) holdingPixels++;
        if (cutting[p] > 128) cuttingPixels++;
        if (holding[p] > 128 && cutting[p] > 128) overlap++;
      }
      return { time, overlap, holdingPixels, cuttingPixels };
    });
  });
  for (const sample of samples) {
    expect(sample.holdingPixels).toBeGreaterThan(300);
    expect(sample.cuttingPixels).toBeGreaterThan(300);
    expect(sample.overlap, `arm intersection at ${sample.time}s`).toBe(0);
  }
});

test('harvest cuts before lifting; seed flight starts at the open hand', async ({ page }) => {
  await page.goto('/');
  const svg = page.locator('.farm-vector');
  await svg.scrollIntoViewIfNeeded();
  await page.getByRole('button', { name: 'Harvest · chapter 4 of 4' }).click();
  const harvest = await svg.evaluate((root: SVGSVGElement) => {
    root.pauseAnimations();
    const point = (selector: string) => {
      const marker = root.querySelector<SVGCircleElement>(selector)!;
      // Measure in illustration units so the assertions do not depend on viewport size.
      const matrix = root.getScreenCTM()!.inverse().multiply(marker.getScreenCTM()!);
      return new DOMPoint(marker.cx.baseVal.value, marker.cy.baseVal.value).matrixTransform(matrix);
    };
    const pose = (time: number) => {
      root.setCurrentTime(time);
      const base = point('[data-stalk-base]'),
        edge = point('[data-cutting-edge]'),
        grip = point('[data-grip="grain"]');
      return {
        base: { x: base.x, y: base.y },
        grip: { x: grip.x, y: grip.y },
        cutGap: Math.hypot(base.x - edge.x, base.y - edge.y),
      };
    };
    return {
      approach: pose(23.1),
      cut: pose(24.4),
      lift: pose(25.6),
      settled: pose(27.1),
      end: pose(30.4),
    };
  });
  expect(
    Math.hypot(
      harvest.approach.base.x - harvest.cut.base.x,
      harvest.approach.base.y - harvest.cut.base.y,
    ),
  ).toBeLessThan(0.01);
  expect(harvest.cut.cutGap).toBeLessThan(5);
  expect(harvest.lift.grip.y).toBeLessThan(harvest.cut.grip.y - 20);
  expect(
    Math.hypot(
      harvest.settled.grip.x - harvest.end.grip.x,
      harvest.settled.grip.y - harvest.end.grip.y,
    ),
  ).toBeLessThan(0.01);
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
