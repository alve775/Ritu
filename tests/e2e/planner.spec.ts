import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seedPlan } from './fixtures';
const openCalendar = async (page: Page) =>
  page.getByRole('button', { name: 'All options', exact: true }).click();
const openField = async (page: Page) =>
  page.getByRole('button', { name: 'Open field view', exact: true }).click();
test.beforeEach(async ({ page }) => {
  await seedPlan(page);
  await page.goto('/plan');
  await expect(
    page.getByRole('heading', { name: 'Choose your automatic calendar', exact: true }),
  ).toBeVisible();
});
test('generated options pass mock checks while real suitability stays unverified', async ({
  page,
}) => {
  await expect(page.locator('.option-card')).toHaveCount(3);
  await expect(page.locator('.option-card .status.confirm')).toHaveCount(3);
  await expect(page.locator('.demo-card-result')).toHaveText(
    Array(3).fill('Model: 0 conflicts · 0 unknowns'),
  );
  await openCalendar(page);
  await expect(page.locator('.calendar-board .rotation-row')).toHaveCount(3);
});
test('calendar crop details support Escape and restore focus', async ({ page }) => {
  const trigger = page.locator('.timeline .crop-bar').first();
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
test('all journey screens reflow and pass automated WCAG checks without runtime errors', async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
  for (const route of ['/farm', '/crops', '/plan', '/insights', '/track']) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page).toHaveTitle(/ritu/i);
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      result.violations.map((v) => ({ route, id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
  }
  expect(errors).toEqual([]);
});
test('Bangla and explicit reset preserve language and clear calendar records', async ({ page }) => {
  await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
  await expect(page).toHaveURL('/track');
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn');
  await page.getByRole('button', { name: 'রিসেট', exact: true }).click();
  await page.getByRole('button', { name: 'আমার তথ্য রাখুন', exact: true }).click();
  await expect(page.locator('.tracking-crops > section')).toHaveCount(3);
  await page.getByRole('button', { name: 'রিসেট', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'সব তথ্য রিসেট করুন', exact: true })
    .click();
  await expect(page.locator('.tracking-crops > section')).toHaveCount(0);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('ritu-journey-v1')!).tracked),
  ).toBeNull();
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn');
});
test('unavailable storage is reported while in-tab planning works; corrupt records recover safely', async ({
  page,
}) => {
  await page.evaluate(() => localStorage.setItem('ritu-journey-v1', '{broken-json'));
  await page.reload();
  await expect(page.getByRole('link', { name: 'Review farm details', exact: true })).toBeVisible();
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Unavailable', 'SecurityError');
    };
  });
  await page.goto('/farm');
  await expect(page.getByText('Storage unavailable — keep this tab open')).toBeVisible();
  await page.getByRole('radio', { name: 'Reliable', exact: true }).check();
  await expect(page.getByRole('radio', { name: 'Reliable', exact: true })).toBeChecked();
});
test('calendar and field stay connected across crops, rest and the year boundary', async ({
  page,
}) => {
  await openField(page);
  const explorer = page.getByRole('region', { name: 'Seasonal field explorer' });
  await page.getByRole('button', { name: 'Inspect month: Jun', exact: true }).click();
  await expect(explorer.getByRole('button', { name: 'Jun', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(explorer.getByText('Planned rest / fallow', { exact: true })).toBeVisible();
  await explorer.getByRole('button', { name: 'Jan', exact: true }).click();
  await expect(explorer.getByText('Harvest month', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Inspect month: Jan', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await explorer.getByRole('button', { name: 'Mar', exact: true }).click();
  await explorer.getByRole('button', { name: 'Inspect this month' }).click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Mung bean', exact: true }),
  ).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(explorer.getByRole('button', { name: 'Inspect this month' })).toBeFocused();
});
test('Three.js renders, camera controls change the view, and reopening creates one canvas', async ({
  page,
}) => {
  await openField(page);
  const viewport = page.locator('.field-viewport');
  await expect(viewport).toHaveAttribute('data-renderer', 'ready', { timeout: 20000 });
  const canvas = viewport.locator('canvas');
  await canvas.scrollIntoViewIfNeeded();
  const initial = await canvas.screenshot();
  await page.getByRole('button', { name: 'View field from above' }).click();
  await expect.poll(async () => (await canvas.screenshot()).equals(initial)).toBe(false);
  const fromAbove = await canvas.screenshot();
  await page.getByRole('button', { name: 'Reset field camera' }).click();
  await expect.poll(async () => (await canvas.screenshot()).equals(fromAbove)).toBe(false);
  const reset = await canvas.screenshot();
  await page.getByRole('button', { name: 'Reset field camera' }).click();
  await expect.poll(async () => (await canvas.screenshot()).equals(reset)).toBe(true);
  await page.getByRole('button', { name: 'Enable drag to rotate' }).click();
  await expect(page.getByRole('button', { name: 'Drag to rotate · turn off' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Collapse field view' }).click();
  await expect(page.locator('.field-canvas canvas')).toHaveCount(0);
  await page.getByRole('button', { name: 'Open field view' }).click();
  await expect(viewport).toHaveAttribute('data-renderer', 'ready');
  await expect(page.locator('.field-canvas canvas')).toHaveCount(1);
});

test('planning and month details remain usable without WebGL', async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: unknown[]) {
      if (type === 'webgl2' || type === 'webgl') return null;
      return Reflect.apply(original, this, [type, ...args]);
    } as typeof original;
  });
  await page.reload();
  await openField(page);
  await expect(page.locator('.field-viewport')).toHaveAttribute('data-renderer', 'fallback');
  await expect(
    page.getByText('3D is unavailable here. All planning controls still work.'),
  ).toBeVisible();
  const explorer = page.getByRole('region', { name: 'Seasonal field explorer' });
  await explorer.getByRole('button', { name: 'Apr', exact: true }).click();
  await expect(explorer.getByText('Harvest month', { exact: true })).toBeVisible();
  await explorer.getByRole('button', { name: 'Inspect this month' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('planning text remains readable on desktop and phones', async ({ page }) => {
  await openCalendar(page);
  await openField(page);
  const sizes = await page.evaluate(() => {
    const fontSize = (selector: string) =>
      parseFloat(getComputedStyle(document.querySelector(selector)!).fontSize);
    return {
      body: fontSize('body'),
      crop: fontSize('.crop-bar'),
      helper: fontSize('.month-activity small'),
      input: fontSize('.explorer-selection select'),
    };
  });
  expect(sizes.body).toBeGreaterThanOrEqual(20);
  expect(sizes.crop).toBeGreaterThanOrEqual(16);
  expect(sizes.helper).toBeGreaterThanOrEqual(16);
  expect(sizes.input).toBeGreaterThanOrEqual(20);
});

test('crop study and soil cutaway stay separate from calendar timing and expose sources', async ({
  page,
}) => {
  await openField(page);
  const explorer = page.getByRole('region', { name: 'Seasonal field explorer' });
  await explorer
    .getByRole('combobox', { name: 'Crop to study', exact: true })
    .selectOption('potato');
  await explorer.getByRole('button', { name: 'Jan', exact: true }).click();
  await expect(explorer.locator('.field-model-title')).toContainText('Potato');
  await expect(page.locator('.field-viewport')).toHaveAttribute('data-renderer', 'ready');
  const canvas = page.locator('.field-canvas canvas');
  await canvas.scrollIntoViewIfNeeded();
  const field = await canvas.screenshot();
  await explorer.getByRole('button', { name: 'Crop close-up', exact: true }).click();
  await expect.poll(async () => (await canvas.screenshot()).equals(field)).toBe(false);
  await explorer.getByRole('button', { name: 'Soil cutaway', exact: true }).click();
  await expect(explorer.getByText(/tubers connected to stolons/)).toBeVisible();
  await explorer
    .getByRole('combobox', { name: 'Plant structure', exact: true })
    .selectOption('young');
  await explorer.getByRole('button', { name: 'Oct', exact: true }).click();
  await expect(
    explorer.getByRole('combobox', { name: 'Plant structure', exact: true }),
  ).toHaveValue('young');
  await expect(explorer.getByText('Harvest month', { exact: true })).toBeVisible();
  await explorer.getByRole('button', { name: 'Model sources & limits', exact: true }).click();
  await expect(
    page
      .getByRole('dialog')
      .getByRole('link', { name: 'International Potato Center · How potato grows' }),
  ).toHaveAttribute('href', 'https://cipotato.org/potato/how-potato-grows/');
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
});
