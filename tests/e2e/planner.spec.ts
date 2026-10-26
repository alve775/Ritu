import { expect, test, type Page } from './browser-test';
import AxeBuilder from '@axe-core/playwright';
import { seedPlan } from './fixtures';
const openCalendar = async (page: Page) =>
  page.getByRole('button', { name: 'All options', exact: true }).click();
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
  await expect(page.locator('.option-card')).toHaveCount(2);
  await expect(page.locator('.option-card .status.confirm')).toHaveCount(2);
  await expect(page.locator('.demo-card-result')).toHaveText(
    Array(2).fill('Model: 0 conflicts · 0 unknowns'),
  );
  await openCalendar(page);
  await expect(page.locator('.calendar-board .rotation-row')).toHaveCount(2);
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
