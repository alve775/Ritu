import { test, expect } from './browser-test';

test('canal meets soil without a pale curved seam', async ({ page }, info) => {
  await page.goto('/');
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1900, height: 860 });
  const svg = page.locator('.farm-vector');
  await svg.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  await expect
    .poll(() =>
      svg.evaluate((root: SVGSVGElement) => {
        const r = root.getBoundingClientRect();
        return Math.abs(
          root.viewBox.baseVal.width / root.viewBox.baseVal.height - r.width / r.height,
        );
      }),
    )
    .toBeLessThan(0.001);
  const result = await svg.evaluate((root: SVGSVGElement) => {
    const water = root.querySelector<SVGGeometryElement>('[data-surface="canal-water"]')!;
    const soil = root.querySelector<SVGGeometryElement>('[data-surface="soil"]')!;
    const view = root.viewBox.baseVal,
      matrix = root.getScreenCTM()!;
    const points = [];
    for (let x = view.x + 20; x < view.x + view.width - 20; x += 35) {
      let bottom = 450;
      while (bottom >= 300 && !water.isPointInFill(new DOMPoint(x, bottom))) bottom -= 0.5;
      if (bottom < 300) throw Error('Canal edge not found');
      const point = new DOMPoint(x, bottom + 3),
        screen = point.matrixTransform(matrix);
      points.push({
        x,
        y: point.y,
        covered: soil.isPointInFill(point),
        screenX: screen.x,
        screenY: screen.y,
      });
    }
    return points;
  });
  expect(
    result.filter((p) => !p.covered),
    'Soil must meet the actual lower canal contour',
  ).toEqual([]);
  const screenshot = await page.screenshot({ path: info.outputPath('canal-soil-seam.png') });
  const wrongPaint = await page.evaluate(
    async ({ base64, points }) => {
      const bitmap = await createImageBitmap(
        await (await fetch('data:image/png;base64,' + base64)).blob(),
      );
      const ctx = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d', {
        willReadFrequently: true,
      })!;
      ctx.drawImage(bitmap, 0, 0);
      const scaleX = bitmap.width / innerWidth,
        scaleY = bitmap.height / innerHeight;
      const wrong = points.flatMap((p) => {
        const x = Math.floor(p.screenX * scaleX),
          y = Math.floor(p.screenY * scaleY);
        const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
        return a !== 255 || r - g < 20 ? [{ x, y, r, g, b, a }] : [];
      });
      bitmap.close();
      return wrong;
    },
    { base64: screenshot.toString('base64'), points: result },
  );
  expect(
    wrongPaint,
    'The canal-to-field boundary should show soil, not pale sky or bank fill',
  ).toEqual([]);
});

test('landing artwork has no outer gutters and paints both vertical edges', async ({
  page,
}, info) => {
  test.setTimeout(60000);
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  for (const [width, height] of [
    [1900, 860],
    [1440, 1000],
    [1024, 1366],
    [412, 900],
    [320, 700],
  ]) {
    await page.setViewportSize({ width, height });
    const frame = page.locator('.farm-illustration');
    await frame.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        page.locator('.farm-vector').evaluate((s: SVGSVGElement) => {
          const r = s.getBoundingClientRect();
          return Math.abs(s.viewBox.baseVal.width / s.viewBox.baseVal.height - r.width / r.height);
        }),
      )
      .toBeLessThan(0.001);
    const layout = await page.evaluate(() => {
      const landing = document.querySelector('.landing')!,
        art = document.querySelector('.landing__art')!,
        copy = document.querySelector('.landing__copy')!;
      const style = getComputedStyle(landing),
        a = art.getBoundingClientRect(),
        c = copy.getBoundingClientRect();
      return {
        padding: style.padding,
        gap: style.gap,
        right: a.right,
        left: a.left,
        top: a.top + scrollY,
        copyRight: c.right,
        bottom: a.bottom + scrollY,
        landingBottom: landing.getBoundingClientRect().bottom + scrollY,
        width: innerWidth,
      };
    });
    expect(layout.padding).toBe('0px');
    expect(layout.gap).toBe('0px');
    expect(Math.abs(layout.right - layout.width)).toBeLessThan(1);
    expect(Math.abs(layout.bottom - layout.landingBottom)).toBeLessThan(1);
    if (width > 900 && width / height > 4 / 3) {
      expect(layout.top).toBe(0);
      expect(Math.abs(layout.left - layout.copyRight)).toBeLessThan(1);
    } else expect(layout.left).toBe(0);
    // Read the actual page pixels. Element screenshots round fractional clip bounds
    // outward and can include a pixel from the neighbouring white copy panel.
    const bounds = await frame.boundingBox();
    expect(bounds).not.toBeNull();
    const screenshot = await page.screenshot({
      path: info.outputPath(`edge-${width}x${height}.png`),
    });
    const uncovered = await page.evaluate(
      async ({ base64, bounds, viewport }) => {
        const bitmap = await createImageBitmap(
          await (await fetch(`data:image/png;base64,${base64}`)).blob(),
        );
        const context = new OffscreenCanvas(bitmap.width, bitmap.height).getContext('2d', {
          willReadFrequently: true,
        })!;
        context.drawImage(bitmap, 0, 0);
        const scaleX = bitmap.width / viewport.width,
          scaleY = bitmap.height / viewport.height;
        const left = Math.ceil(bounds.x * scaleX),
          right = Math.floor((bounds.x + bounds.width) * scaleX) - 1;
        const missing = [];
        for (
          let y = Math.ceil((bounds.y + bounds.height * 0.1) * scaleY);
          y < (bounds.y + bounds.height * 0.95) * scaleY;
          y++
        )
          for (const x of [left, left + 1, right - 1, right]) {
            const [r, g, b, a] = context.getImageData(x, y, 1, 1).data;
            if (a !== 255 || (r === 255 && g === 255 && b === 255))
              missing.push({ x, y, r, g, b, a });
          }
        bitmap.close();
        return missing.slice(0, 12);
      },
      { base64: screenshot.toString('base64'), bounds: bounds!, viewport: { width, height } },
    );
    expect(uncovered, `Unpainted edge pixels at ${width}×${height}`).toEqual([]);
  }
});
