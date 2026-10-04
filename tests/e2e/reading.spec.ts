import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seedPlan } from './fixtures';

const start = async (page: Page) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
  await page.goto('/');
  await expect(page.getByText('Saved on this device')).toBeVisible();
};

test('first screen keeps optional detail closed and does not load a 3D canvas', async ({
  page,
}) => {
  await start(page);
  await expect(page.locator('.option-card')).toHaveCount(0);
  await expect(page.locator('main details[open]')).toHaveCount(0);
  await expect(page.locator('.field-canvas canvas')).toHaveCount(0);
  await seedPlan(page);
  await page.evaluate(() => localStorage.removeItem('ritu-preview-v1'));
  await page.goto('/plan');
  await expect(page.locator('.calendar-board .rotation-row')).toHaveCount(1);
  await page.getByRole('button', { name: 'All options', exact: true }).click();
  await expect(page.locator('.calendar-board .rotation-row')).toHaveCount(3);
});

test('reading settings persist separately from the farm and honor reduced motion', async ({
  page,
}) => {
  await start(page);
  const farm = await page.evaluate(() => localStorage.getItem('ritu-preview-v1'));
  await page.getByRole('button', { name: 'Reading & sound' }).click();
  await page.getByRole('radio', { name: 'Extra large', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Animate transitions and tour text' }).uncheck();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  expect(await page.evaluate(() => getComputedStyle(document.body).fontSize)).toBe('24px');
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'larger');
  expect(await page.evaluate(() => localStorage.getItem('ritu-preview-v1'))).toBe(farm);
  await page.getByRole('button', { name: 'Take a tour', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Your farm/ })
    .click();
  await expect(page.locator('.tour-card')).toHaveAttribute('aria-busy', 'false');
  expect(
    await page
      .locator('.tour-dialog')
      .evaluate(
        (el) => el.getAnimations({ subtree: true }).filter((a) => a.playState === 'running').length,
      ),
  ).toBe(0);
  expect(
    await page
      .locator('.stream-word')
      .evaluateAll((els) => els.every((el) => getComputedStyle(el).opacity === '1')),
  ).toBe(true);
});

test('large Bangla, text resizing and user spacing keep the core flows within 320px', async ({
  page,
}) => {
  await seedPlan(page);
  await start(page);
  await page.setViewportSize({ width: 320, height: 900 });
  await page.getByRole('button', { name: 'Reading & sound' }).click();
  await page.getByRole('radio', { name: 'Extra large', exact: true }).check();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  for (const route of ['/farm', '/crops', '/plan', '/insights', '/track']) {
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('lang', 'bn');
    await page.addStyleTag({
      content: `html[data-text-size] {font-size:250%} p {margin-bottom:2em!important} * {line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}`,
    });
    await expect(page).toHaveTitle(/ritu/i);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      320,
    );
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    // Form labels and navigation must wrap instead of clipping text.
    const clipped = await page
      .locator('.nav-text strong, .form-field, .disclosure > summary')
      .evaluateAll((els) =>
        els.filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent),
      );
    expect(clipped).toEqual([]);
  }
});

test('expanded evidence and form content have no automated accessibility violations', async ({
  page,
}) => {
  await seedPlan(page);
  await start(page);
  for (const route of ['/', '/farm', '/insights']) {
    await page.goto(route);
    // Click native summaries so React hydrates each route before DOM mutation.
    for (const summary of await page.locator('main details > summary').all()) await summary.click();
    await page.evaluate(() => document.fonts.ready);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({ route, id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  }
});

test('click sound is opt in, finite, and stops creating tones after mute', async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as Window & {
      audioCounts?: { contexts: number; tones: number; durations: number[] };
    };
    const counts = (state.audioCounts = { contexts: 0, tones: 0, durations: [] });
    const Base = AudioContext;
    window.AudioContext = class extends Base {
      constructor(...args: ConstructorParameters<typeof AudioContext>) {
        super(...args);
        counts.contexts++;
      }
      createOscillator() {
        counts.tones++;
        const tone = super.createOscillator();
        const stop = tone.stop.bind(tone);
        tone.stop = (when = 0) => {
          counts.durations.push(when - this.currentTime);
          stop(when);
        };
        return tone;
      }
    };
  });
  await start(page);
  const counts = () =>
    page.evaluate(
      () =>
        (
          window as Window & {
            audioCounts: { contexts: number; tones: number; durations: number[] };
          }
        ).audioCounts,
    );
  await page.getByRole('button', { name: 'Reading & sound' }).click();
  expect((await counts()).contexts).toBe(0);
  await page.getByRole('checkbox', { name: 'Quiet click sounds' }).check();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Reading & sound' }).click();
  await expect.poll(async () => (await counts()).tones).toBeGreaterThan(0);
  expect((await counts()).durations.every((duration) => duration > 0 && duration <= 0.066)).toBe(
    true,
  );
  await page.getByRole('checkbox', { name: 'Quiet click sounds' }).uncheck();
  await page.waitForTimeout(150);
  const muted = (await counts()).tones;
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Reading & sound' }).click();
  await page.waitForTimeout(150);
  expect((await counts()).tones).toBe(muted);
});

test('tour streams whole words without layout shifts and can show all text immediately', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await start(page);
  await page.getByRole('button', { name: 'Take a tour', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: /Your farm/ })
    .click();
  const card = page.locator('.tour-card');
  await expect(card).toHaveAttribute('aria-busy', 'false');
  const samples = await page
    .getByRole('button', { name: 'Next', exact: true })
    .evaluate(async (next) => {
      next.click();
      const samples: { first: number; last: number; height: number }[] = [];
      await new Promise<void>((resolve) => {
        const from = performance.now();
        const frame = () => {
          const words = Array.from(document.querySelectorAll('#tour-description .stream-word'));
          if (words.length)
            samples.push({
              first: Number(getComputedStyle(words[0]).opacity),
              last: Number(getComputedStyle(words.at(-1)!).opacity),
              height: document.querySelector('#tour-description')!.getBoundingClientRect().height,
            });
          if (performance.now() - from > 1500) resolve();
          else requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
      return samples;
    });
  expect(samples.some((sample) => sample.first > 0.5 && sample.last < 0.5)).toBe(true);
  await expect(page.getByRole('heading', { name: 'Tell Ritu about water access' })).toBeVisible();
  // Full text is exposed once to assistive technology, visual word spans are hidden.
  await expect(page.locator('#tour-description .sr-only')).toHaveText(
    'Choose reliable, limited, rainfed, severe shortage or Not sure. Unknown water is never silently assumed; suggestions wait for confirmation.',
  );
  await page.getByRole('button', { name: 'Show text instantly' }).click();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(card).toHaveAttribute('aria-busy', 'false');
  expect(
    await page
      .locator('.stream-word')
      .evaluateAll((els) =>
        els.every(
          (el) =>
            getComputedStyle(el).opacity === '1' &&
            el.getAnimations().every((a) => a.playState !== 'running'),
        ),
      ),
  ).toBe(true);
});
