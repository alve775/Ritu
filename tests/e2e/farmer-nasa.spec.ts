import { expect, test } from './browser-test';
import AxeBuilder from '@axe-core/playwright';
import { seedPlan } from './fixtures';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
});
test('large navigation and visible farm decisions use the available width', async ({
  page,
}, info) => {
  await page.goto('/farm');
  await expect(page.getByText('Crops your household wants to keep', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: 'Previous crop to add', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('radio', { name: 'Reliable', exact: true })).toBeVisible();
  if (info.project.name === 'desktop') {
    await page.setViewportSize({ width: 1920, height: 1080 });
    const nav = page.locator('.planner-sidebar');
    await expect(nav).toBeVisible();
    await expect(nav.getByRole('link')).toHaveCount(4);
    expect((await nav.getByRole('link').first().boundingBox())!.height).toBeGreaterThanOrEqual(80);
    const main = (await page.locator('main').boundingBox())!;
    expect(main.x).toBe(264);
    expect(main.width).toBeGreaterThan(1550);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('farm-visible-choices.png'), fullPage: true });
});
test('crop photos, historical months and independent crop study work without WebGL or satellites', async ({
  page,
}, info) => {
  await seedPlan(page);
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Explore crops & weather', exact: true }).click();
  const explorer = page.locator('.nasa-explorer');
  await expect(
    explorer.getByRole('combobox', { name: 'Calendar month', exact: true }),
  ).toBeVisible();
  await explorer.getByRole('combobox', { name: 'Calendar month', exact: true }).selectOption('4');
  await expect(explorer.locator('.crop-photo img')).toHaveAttribute('src', /\/crops\/rice\.jpg$/);
  await expect(explorer.locator('[data-tour="nasa-month"]')).toContainText('416.5 mm');
  await explorer
    .getByRole('combobox', { name: 'Crop to explore', exact: true })
    .selectOption('potato');
  await expect(explorer.locator('.crop-photo img')).toHaveAttribute('src', /\/crops\/potato\.jpg$/);
  await expect(explorer.getByRole('combobox', { name: 'Calendar month', exact: true })).toHaveValue(
    '4',
  );
  await expect
    .poll(() =>
      explorer
        .locator('img')
        .evaluateAll((imgs) =>
          imgs.every(
            (img) =>
              (img as HTMLImageElement).complete && (img as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  await expect(explorer.getByRole('link', { name: 'Source', exact: true })).toHaveAttribute(
    'href',
    /commons.wikimedia.org/,
  );
  await expect(page.locator('canvas')).toHaveCount(0);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(
    result.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
  ).toEqual([]);
  await explorer.screenshot({ path: info.outputPath('clear-crop-photo-and-nasa-history.png') });
});
test('sample calendar and landing reading preferences do not overwrite farmer data', async ({
  page,
}) => {
  await seedPlan(page);
  await page.goto('/farm');
  const before = await page.evaluate(() => localStorage.getItem('ritu-preview-v1'));
  await page.evaluate(() =>
    localStorage.setItem(
      'ritu-display-v1',
      JSON.stringify({ text: 'larger', motion: false, sound: false }),
    ),
  );
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'larger');
  await page.getByRole('link', { name: 'See a sample plan', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'A sample season plan', exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('ritu-preview-v1'))).toBe(before);
});

test('hypothetical weather is labelled as a scenario in plan evidence', async ({ page }) => {
  await seedPlan(page);
  await page.goto('/plan');
  await page.getByRole('link', { name: 'Try a water-shortage scenario', exact: true }).click();
  await page.getByRole('combobox', { name: 'Scenario climate', exact: true }).selectOption('dry');
  await page.getByRole('button', { name: 'Apply scenario', exact: true }).click();
  await page.goto('/insights');
  await expect(page.locator('.climate-plan-evidence')).toContainText('scenario rain');
  await expect(page.locator('.climate-plan-evidence')).not.toContainText('historical rain');
  await expect(
    page.getByText(/The figures above include the explicitly selected hypothetical/),
  ).toBeVisible();
});
