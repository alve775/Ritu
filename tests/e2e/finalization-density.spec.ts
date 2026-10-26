import { test, expect } from './browser-test';
import fs from 'node:fs';

test.use({ launchOptions: { ignoreDefaultArgs: ['--hide-scrollbars'] } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
});

test('vine stitch reaches the exact workspace corner', async ({ page }, info) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/farm');
  await expect(
    page.getByRole('heading', { name: 'Start with your farm', exact: true }),
  ).toBeVisible();
  const corner = await page.evaluate(async () => {
    const side = document.querySelector<HTMLElement>('.planner-sidebar')!;
    const backgrounds = [
      ...getComputedStyle(side).backgroundImage.matchAll(/url\(["']?([^"')]+)["']?\)/g),
    ];
    await Promise.all(
      backgrounds.map(
        (match) =>
          new Promise<void>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject(new Error('Divider asset could not load'));
            img.src = match[1];
          }),
      ),
    );
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    const main = document.querySelector('.main-content')!.getBoundingClientRect();
    return {
      x: main.left,
      y: main.top,
      dpr: devicePixelRatio,
      scrolling: side.scrollHeight > side.clientHeight,
    };
  });
  expect(corner.scrolling).toBe(false);
  const screenshot = await page.screenshot({ path: info.outputPath('corner-full.png') });
  const paint = await page.evaluate(
    async ({ base64, corner }) => {
      const bitmap = await createImageBitmap(
        await (await fetch('data:image/png;base64,' + base64)).blob(),
      );
      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(bitmap, 0, 0);
      const pixel = [
        ...ctx.getImageData(
          Math.floor((corner.x - 0.5) * corner.dpr),
          Math.floor((corner.y - 0.5) * corner.dpr),
          1,
          1,
        ).data,
      ];
      return {
        pixel,
        differenceFromGreen: Math.max(
          Math.abs(pixel[0] - 32),
          Math.abs(pixel[1] - 75),
          Math.abs(pixel[2] - 59),
        ),
      };
    },
    { base64: screenshot.toString('base64'), corner },
  );
  fs.writeFileSync(
    info.outputPath('corner-paint.json'),
    JSON.stringify({ corner, paint }, null, 2),
  );
  await page.screenshot({
    path: info.outputPath('corner-detail.png'),
    clip: { x: corner.x - 36, y: corner.y - 40, width: 92, height: 88 },
  });
  expect(
    paint.differenceFromGreen,
    'The last painted point beside the actual white corner must contain the stitch, rather than an empty green gap',
  ).toBeGreaterThan(10);
});

test('capture the farm density and branding for visual review', async ({ page }, info) => {
  await page.goto('/farm');
  await expect(
    page.getByRole('heading', { name: 'Start with your farm', exact: true }),
  ).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const metrics = await page.evaluate(() => {
    const rect = (selector: string) => {
      const el =
        [...document.querySelectorAll(selector)].find(
          (node) => node.getBoundingClientRect().width > 0,
        ) ?? document.querySelector(selector)!;
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    return {
      rootFont: parseFloat(getComputedStyle(document.documentElement).fontSize),
      headingFont: parseFloat(getComputedStyle(document.querySelector('h1')!).fontSize),
      header: rect('.app-header'),
      brand: rect('.app .brand'),
      sidebar: rect('.planner-sidebar'),
      sidebarInnerRight: (() => {
        const el = document.querySelector<HTMLElement>('.planner-sidebar')!;
        return el.getBoundingClientRect().left + el.clientWidth;
      })(),
      location: rect('.farm-location'),
      scrollHeight: document.documentElement.scrollHeight,
      overflow: document.documentElement.scrollWidth > innerWidth,
    };
  });
  fs.writeFileSync(info.outputPath('density.json'), JSON.stringify(metrics, null, 2));
  expect(metrics.rootFont).toBe(16);
  expect(metrics.headingFont).toBeLessThanOrEqual(32);
  expect(metrics.overflow).toBe(false);
  if (info.project.name === 'desktop') {
    expect(
      Math.abs(metrics.brand.x - (metrics.sidebarInnerRight - metrics.brand.right)),
    ).toBeLessThanOrEqual(1);
    expect(metrics.brand.right).toBeLessThanOrEqual(metrics.sidebarInnerRight + 1);
    expect(metrics.brand.y - metrics.sidebar.y).toBe(24);
    expect(metrics.header.x).toBe(metrics.sidebar.right);
    await expect(page.locator('.header-context')).toHaveText('Step 1 of 4 · Your farm');
  }
  await page.screenshot({ path: info.outputPath('farm-density.png'), fullPage: true });
  await page.locator('.app-header').screenshot({ path: info.outputPath('brand-header.png') });
  if (info.project.name === 'desktop') {
    await page.screenshot({
      path: info.outputPath('brand-shell.png'),
      clip: { x: 0, y: 0, width: 1440, height: 820 },
    });
  }
});

test('reading size remains adjustable and the full logo fits narrow Bangla headers', async ({
  page,
}, info) => {
  await page.goto('/farm');
  await page.getByRole('button', { name: 'Reading & sound', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Standard', exact: true })).toBeChecked();
  await page.getByRole('radio', { name: 'Extra large', exact: true }).check();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize)),
    )
    .toBe(24);
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 700 });
  await expect(page.locator('.app-header')).toBeVisible();
  const overflow = await page.evaluate(() => {
    const header = document.querySelector('.app-header')!,
      r = header.getBoundingClientRect();
    return {
      document: document.documentElement.scrollWidth > innerWidth,
      controls: [...header.querySelectorAll('button,a')]
        .filter((e) => {
          const b = e.getBoundingClientRect();
          return b.width && b.height && (b.left < r.left - 1 || b.right > r.right + 1);
        })
        .map((e) => e.getAttribute('aria-label') ?? e.textContent),
    };
  });
  expect(overflow).toEqual({ document: false, controls: [] });
  await page
    .locator('.app-header')
    .screenshot({ path: info.outputPath('brand-bangla-large-320.png') });
  await page.getByRole('button', { name: 'পড়া ও শব্দ', exact: true }).click();
  await page.getByRole('radio', { name: 'সাধারণ', exact: true }).check();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize)),
    )
    .toBe(16);
  await page.locator('.app-header .brand').click();
  await expect(page).toHaveURL(/\/$/);
});

test('pre-pull logo badge is restored and stays before the sidebar scrollbar', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 520 });
  await page.goto('/farm');
  // Exercise a visible, non-overlay scrollbar rather than assuming a scrollbar width.
  await page.addStyleTag({
    content:
      '.planner-sidebar{overflow-y:scroll}.planner-sidebar::-webkit-scrollbar{display:block;width:16px}.planner-sidebar::-webkit-scrollbar-track{background:#eef0ee}.planner-sidebar::-webkit-scrollbar-thumb{background:#8f9693;border-radius:8px}',
  });
  const logo = page.locator('.sidebar-brand img.brand-logo');
  await expect(logo).toBeVisible();
  await expect
    .poll(() => logo.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0))
    .toBe(true);
  expect(await logo.getAttribute('src')).toContain('website_logo');
  await expect
    .poll(() =>
      page.evaluate(() => {
        const side = document.querySelector<HTMLElement>('.planner-sidebar')!,
          brand = document.querySelector('.sidebar-brand')!.getBoundingClientRect();
        return brand.right - (side.getBoundingClientRect().left + side.clientWidth);
      }),
    )
    .toBeLessThan(1);
  const measured = await page.evaluate(() => {
    const side = document.querySelector<HTMLElement>('.planner-sidebar')!,
      img = document.querySelector<HTMLImageElement>('.sidebar-brand img.brand-logo')!,
      r = img.getBoundingClientRect();
    return {
      gutter: side.offsetWidth - side.clientWidth,
      scrolls: side.scrollHeight > side.clientHeight,
      originalRatio: img.naturalWidth / img.naturalHeight,
      displayedRatio: r.width / r.height,
      fit: getComputedStyle(img).objectFit,
      transform: getComputedStyle(img).transform,
      position: getComputedStyle(img).objectPosition,
      badgeBackground: getComputedStyle(img.closest('.brand')!).backgroundColor,
      badgeRadius: getComputedStyle(img.closest('.brand')!).borderRadius,
      badgePadding: getComputedStyle(img.closest('.brand')!).padding,
      topClearance: img.closest('.brand')!.getBoundingClientRect().top,
      headingClearance:
        document.querySelector('.sidebar-heading')!.getBoundingClientRect().top -
        img.closest('.brand')!.getBoundingClientRect().bottom,
    };
  });
  expect(measured.gutter).toBeGreaterThan(0);
  expect(measured.scrolls).toBe(true);
  expect(measured.displayedRatio).toBeCloseTo(2, 4);
  expect(measured.fit).toBe('cover');
  expect(measured.position).toBe('50% 52%');
  expect(measured.badgeBackground).toBe('rgb(255, 255, 255)');
  expect(measured.badgeRadius).toBe('10px');
  expect(measured.badgePadding).toBe('8px');
  expect(measured.transform).toBe('none');
  expect(measured.topClearance).toBe(24);
  expect(measured.headingClearance).toBeGreaterThanOrEqual(24);
  fs.writeFileSync(info.outputPath('logo-scrollbar.json'), JSON.stringify(measured, null, 2));
  await page.screenshot({ path: info.outputPath('original-logo-with-scrollbar.png') });
  await page.screenshot({
    path: info.outputPath('logo-and-scrollbar-boundary.png'),
    clip: { x: 0, y: 0, width: 300, height: 240 },
  });
  await page.locator('.sidebar-brand').click();
  await expect(page).toHaveURL(/\/$/);
});

test('branding switches cleanly between sidebar and toolbar at each breakpoint', async ({
  page,
}, info) => {
  await page.goto('/farm');
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    const desktop = width >= 1024;
    await expect(page.locator('.sidebar-brand')).toBeVisible({ visible: desktop });
    await expect(page.locator('.header-brand')).toBeVisible({ visible: !desktop });
    const bounds = await page.evaluate(() => {
      const visible = [...document.querySelectorAll<HTMLElement>('.app .brand')].filter(
        (el) => el.getBoundingClientRect().width > 0,
      );
      const brand = visible[0].getBoundingClientRect();
      const header = document.querySelector('.app-header')!.getBoundingClientRect();
      const sidebar = document.querySelector('.planner-sidebar')!.getBoundingClientRect();
      const tools = document.querySelector('.header-tools')!.getBoundingClientRect();
      return {
        visibleBrands: visible.length,
        overflow: document.documentElement.scrollWidth > innerWidth,
        left: brand.left,
        right: brand.right,
        top: brand.top - header.top,
        bottom: header.bottom - brand.bottom,
        sidebarRight: sidebar.right,
        headerLeft: header.left,
        toolsRight: tools.right,
      };
    });
    expect(bounds.visibleBrands).toBe(1);
    expect(bounds.overflow).toBe(false);
    expect(bounds.left).toBeGreaterThanOrEqual(8);
    expect(bounds.toolsRight).toBeLessThanOrEqual(width - 8);
    if (desktop) {
      expect(bounds.headerLeft).toBe(bounds.sidebarRight);
      expect(bounds.right).toBeLessThan(bounds.sidebarRight);
    } else {
      expect(bounds.top).toBeGreaterThanOrEqual(8);
      expect(bounds.bottom).toBeGreaterThanOrEqual(8);
    }
    if (info.project.name === 'desktop' && [390, 768, 1024].includes(width)) {
      await page.screenshot({ path: info.outputPath(`branding-${width}.png`) });
    }
  }
});
