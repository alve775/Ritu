import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const openCalendar = async (page: Page) => {
  await page.getByText('See the planting months', { exact: true }).click();
  await page.getByRole('button', { name: 'All options', exact: true }).click();
};
const openWater = async (page: Page) =>
  page.getByText('Water access & priorities', { exact: true }).click();
const openField = async (page: Page) =>
  page.getByRole('button', { name: 'Open field view', exact: true }).click();

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
  await page.goto('/');
  await expect(page.getByText('Saved on this device')).toBeVisible();
});
test('reported irrigation saves without inventing crop suitability', async ({ page }) => {
  await openWater(page);
  await openCalendar(page);
  const current = page.getByRole('region', { name: 'Your current rotation', exact: true });
  await expect(current.first().getByText('Needs confirmation')).toBeVisible();
  await page.getByRole('radio', { name: 'Reliable', exact: true }).check();
  await expect(page.locator('.calendar-board .status.confirm')).toHaveCount(3);
  await page.getByRole('radio', { name: 'Rainfed', exact: true }).check();
  await expect(page.locator('.calendar-board .status.confirm')).toHaveCount(3);
  await page.getByRole('radio', { name: 'Not sure', exact: true }).check();
  await expect(page.locator('.calendar-board .status.confirm')).toHaveCount(3);
  await page.reload();
  await openWater(page);
  await expect(page.getByRole('radio', { name: 'Not sure', exact: true })).toBeChecked();
});
test('priorities, selection, explanations and farm requirements stay connected', async ({
  page,
}) => {
  await openWater(page);
  await page.getByRole('radio', { name: /More crop diversity/ }).check();
  await expect(page.getByText('Matches your priority')).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Select Example 2: rice, pulses & potato', exact: true })
    .click();
  await page.getByRole('link', { name: 'Understand this choice' }).click();
  await expect(page).toHaveURL('/insights');
  await expect(page.locator('.insight-summary h2')).toHaveText('Example 2: rice, pulses & potato');
  await page.getByText('Evidence & sources', { exact: true }).click();
  await expect(page.getByText('Rainfall & dry spells', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Review my farm inputs' }).click();
  await page.getByText('Family crops & available help', { exact: true }).click();
  await page.getByRole('checkbox', { name: 'Potato', exact: true }).check();
  await page.getByText('Soil & drainage information', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Soil texture', exact: true }).selectOption('unknown');
  await page.getByRole('link', { name: 'Compare my options' }).click();
  await openCalendar(page);
  await expect(page.locator('.calendar-board .status.blocked')).toHaveCount(2);
  await expect(page.locator('.calendar-board .status.confirm')).toHaveCount(1);
});
test('calendar crop details support Escape and restore focus', async ({ page }) => {
  await openCalendar(page);
  const trigger = page.getByRole('button', { name: 'Wheat, Nov — Feb, view crop details' });
  await trigger.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Wheat', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
test('Bangla works across routes and survives reload', async ({ page }) => {
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'bn');
  await expect(
    page.getByRole('heading', { name: 'ফসলক্রম তুলনা করুন', exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: /খামার বদলান/ }).click();
  await expect(page.getByLabel('খামারের নাম', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: 'বাংলা', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
test('current calendar exposes overlapping edits without covering other crops', async ({
  page,
}) => {
  await page.getByRole('link', { name: 'Edit farm' }).click();
  await page.getByText('Current crops & planting dates', { exact: true }).click();
  await page.getByRole('button', { name: /Edit sequence/ }).click();
  await page.getByRole('combobox', { name: 'Start month 1', exact: true }).selectOption('0');
  await expect(page.getByText('Crop or fallow periods overlap.')).toBeVisible();
  await expect(page.locator('.current-calendar .timeline')).toHaveCSS(
    'grid-template-rows',
    /58px 58px/,
  );
});
test('reset is deliberate; language is preserved', async ({ page }) => {
  await openWater(page);
  await page.getByRole('radio', { name: 'Rainfed', exact: true }).check();
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await page.getByRole('button', { name: 'Keep my plan', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Rainfed', exact: true })).toBeChecked();
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await page.getByRole('button', { name: 'Reset sample farm', exact: true }).click();
  await expect(page.getByRole('radio', { name: 'Limited', exact: true })).toBeChecked();
});
test('all screens fit the viewport and have no browser errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const route of ['/', '/farm', '/insights']) {
    await page.goto(route);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const size = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(size.content).toBeLessThanOrEqual(size.viewport);
  }
  expect(errors).toEqual([]);
});
test('core screens meet automated WCAG AA checks', async ({ page }) => {
  const violations: unknown[] = [];
  for (const route of ['/', '/farm', '/insights']) {
    await page.goto(route);
    await page.evaluate(() => document.fonts.ready);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    violations.push(
      ...result.violations.map((v) => ({ route, id: v.id, nodes: v.nodes.map((n) => n.target) })),
    );
  }
  expect(violations).toEqual([]);
});

test('unavailable storage is reported while planning still works', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Unavailable', 'SecurityError');
    };
  });
  await page.reload();
  await expect(page.getByText('Storage unavailable — keep this tab open')).toBeVisible();
  await openWater(page);
  await page.getByRole('radio', { name: 'Reliable', exact: true }).check();
  await expect(page.locator('.option-card .status.confirm')).toHaveCount(3);
});

test('corrupt saved inputs recover to the sample farm', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('ritu-preview-v1', '{broken-json'));
  await page.reload();
  await openWater(page);
  await expect(page.getByRole('radio', { name: 'Limited', exact: true })).toBeChecked();
  await expect(page.getByText(/Farm: My Rajshahi farm\./)).toBeVisible();
});

test('Bangla fits all screens at a narrow phone width', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  for (const route of ['/', '/farm', '/insights']) {
    await page.goto(route);
    await expect(page.locator('html')).toHaveAttribute('lang', 'bn');
    const size = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: innerWidth,
    }));
    expect(size.content).toBeLessThanOrEqual(size.viewport);
  }
});

test('data disclosure and crop dialogs meet automated accessibility checks', async ({ page }) => {
  await page.getByRole('button', { name: 'About the data', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  let result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
  await page.getByRole('button', { name: 'Close', exact: true }).click();
  await openCalendar(page);
  await page.getByRole('button', { name: 'Wheat, Nov — Feb, view crop details' }).click();
  result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
});

test('field months and calendars stay connected across rest and the year boundary', async ({
  page,
}) => {
  await openCalendar(page);
  await openField(page);
  const explorer = page.getByRole('region', { name: 'Seasonal field explorer' });
  await page.getByRole('button', { name: 'Inspect month: Jun', exact: true }).click();
  await expect(explorer.getByRole('button', { name: 'Jun', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(explorer.getByText('Planned rest / fallow', { exact: true })).toBeVisible();
  await explorer.getByRole('combobox', { name: 'Rotation to explore' }).selectOption('current');
  await explorer.getByRole('button', { name: 'Jan', exact: true }).click();
  await expect(explorer.getByText('Sample planting month', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Inspect month: Jan', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await explorer.getByRole('button', { name: 'Apr', exact: true }).click();
  await expect(explorer.getByText('Sample harvest month', { exact: true })).toBeVisible();
  await explorer.getByRole('button', { name: 'Inspect this month' }).click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Boro rice', exact: true }),
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
  await explorer.getByRole('button', { name: 'May', exact: true }).click();
  await expect(explorer.getByText('Sample harvest month', { exact: true })).toBeVisible();
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
  await explorer.getByRole('combobox', { name: 'Rotation to explore' }).selectOption('diverse');
  await explorer.getByRole('button', { name: 'Jan', exact: true }).click();
  await expect(explorer.getByRole('heading', { name: 'Potato', exact: true })).toBeVisible();
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
  await explorer.getByRole('button', { name: 'Feb', exact: true }).click();
  await expect(
    explorer.getByRole('combobox', { name: 'Plant structure', exact: true }),
  ).toHaveValue('young');
  await expect(explorer.getByText('Sample harvest month', { exact: true })).toBeVisible();
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
