import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { chooseDefaultCrops, seedPlan } from './fixtures';

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

for (const size of [
  { width: 800, height: 1100 },
  { width: 1440, height: 900 },
]) {
  for (const text of ['comfortable', 'larger'] as const) {
    test(`tabbing through the calendar never hides the focused control behind the save bar · ${size.width}px ${text} text`, async ({
      page,
    }) => {
      await page.addInitScript((value) => {
        localStorage.setItem(
          'ritu-display-v1',
          JSON.stringify({
            text: value,
            motion: false,
            sound: false,
            volume: 35,
            ambience: 'morning',
            theme: 'light',
          }),
        );
      }, text);
      await page.setViewportSize(size);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/farm');
      await chooseDefaultCrops(page);
      await page.getByRole('button', { name: 'Open field view', exact: true }).click();
      await expect(page.getByRole('region', { name: 'Seasonal field explorer' })).toBeVisible();
      await page.evaluate(() => {
        (document.activeElement as HTMLElement | null)?.blur();
        window.scrollTo(0, 0);
      });
      const covered: string[] = [];
      let visited = 0;
      for (let i = 0; i < 130; i++) {
        await page.keyboard.press('Tab');
        const result = await page.evaluate(() => {
          const el = document.activeElement as HTMLElement | null;
          const bar = document.querySelector('.save-bar');
          if (!el || el === document.body || !bar || bar.contains(el)) return null;
          const a = el.getBoundingClientRect();
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
  }
}

test('the year wheel is keyboard operable and stays in sync with the calendar month', async ({
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

test('track wheel renders at zero and full progress without broken paths', async ({ page }) => {
  await seedPlan(page);
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
  await expect(page).toHaveURL('/track');
  const paths = () =>
    page
      .locator('.track-summary .year-wheel path')
      .evaluateAll((els) => els.map((el) => el.getAttribute('d') ?? ''));
  expect((await paths()).some((d) => /NaN|Infinity/.test(d))).toBe(false);
  for (const crop of await page.locator('.tracking-crops > section').all()) {
    await crop.getByRole('checkbox', { name: 'Planted' }).check();
    await crop.getByRole('checkbox', { name: 'Harvested' }).check();
  }
  await expect(page.getByText(/6 \/ 6/)).toBeVisible();
  expect((await paths()).some((d) => /NaN|Infinity/.test(d))).toBe(false);
});

for (const theme of ['light', 'dark'] as const)
  for (const language of ['en', 'bn'] as const)
    test(`no overflow or clipping at 320px · ${language} · ${theme} · extra large`, async ({
      page,
    }) => {
      await seedPlan(page);
      await page.addInitScript(
        ({ theme, language }) => {
          localStorage.setItem(
            'ritu-display-v1',
            JSON.stringify({ text: 'larger', motion: false, sound: false, theme }),
          );
          const saved = JSON.parse(localStorage.getItem('ritu-preview-v1') ?? '{}');
          localStorage.setItem('ritu-preview-v1', JSON.stringify({ ...saved, language }));
        },
        { theme, language },
      );
      await page.setViewportSize({ width: 320, height: 800 });
      for (const route of ['/farm', '/crops', '/plan', '/insights']) {
        await page.goto(route);
        const html = page.locator('html');
        await expect(html).toHaveAttribute('lang', language);
        await expect(html).toHaveAttribute('data-text-size', 'larger');
        await expect(html).toHaveAttribute('data-theme', theme);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          route,
        ).toBe(true);
        const clipped = await page
          .locator(
            '.nav-text strong, .button, .tool-button, .season-chip, .tracker-slot, .language-switch button',
          )
          .evaluateAll((els) =>
            els
              .filter((el) => el.getBoundingClientRect().width > 0)
              .filter((el) => el.scrollWidth > el.clientWidth + 1)
              .map((el) => el.textContent),
          );
        expect(clipped, route).toEqual([]);
      }
    });

for (const theme of ['light', 'dark'] as const)
  test(`axe finds no WCAG A/AA violations on any page · ${theme} theme`, async ({ page }) => {
    await seedPlan(page);
    await page.addInitScript((theme) => {
      localStorage.setItem(
        'ritu-display-v1',
        JSON.stringify({ text: 'comfortable', motion: false, sound: false, theme }),
      );
    }, theme);
    const scan = async (route: string) => {
      await page.evaluate(() => document.fonts.ready);
      const result = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      expect(
        result.violations.map(
          (v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`,
        ),
        `${route} · ${theme}`,
      ).toEqual([]);
    };
    for (const route of ['/farm', '/crops', '/plan']) {
      await page.goto(route);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      if (route === '/plan') {
        await page.getByRole('button', { name: 'Open field view', exact: true }).click();
        await expect(page.getByRole('region', { name: 'Seasonal field explorer' })).toBeVisible();
      }
      await scan(route);
    }
    await page.goto('/plan');
    await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
    await expect(page).toHaveURL('/track');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await scan('/track');
    await page.goto('/insights');
    await expect(page.getByRole('heading', { level: 1, name: 'Know the why.' })).toBeVisible();
    await scan('/insights');
  });

test('Bangla headings use weight 600 on the calendar page', async ({ page }) => {
  await seedPlan(page);
  await page.addInitScript(() => {
    const saved = JSON.parse(localStorage.getItem('ritu-preview-v1') ?? '{}');
    localStorage.setItem('ritu-preview-v1', JSON.stringify({ ...saved, language: 'bn' }));
  });
  await page.goto('/plan');
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn');
  const weights = await page
    .locator('main h1, main h2, main h3')
    .evaluateAll((els) => els.map((el) => getComputedStyle(el).fontWeight));
  expect(weights.length).toBeGreaterThan(2);
  expect([...new Set(weights)]).toEqual(['600']);
});
