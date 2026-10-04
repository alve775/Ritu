import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { chooseDefaultCrops, seedPlan } from './fixtures';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
});

test('farm first, passing suggestions, locked windows, calendar and task tracking form one complete journey', async ({
  page,
}, info) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (!['127.0.0.1', 'localhost'].includes(new URL(r.url()).hostname)) external.push(r.url());
  });
  await page.goto('/');
  await expect(page).toHaveURL('/farm');
  await expect(
    page.getByRole('heading', { name: 'Start with your farm', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Start month' })).toHaveCount(0);
  await chooseDefaultCrops(page);
  await expect(page).toHaveURL('/plan');
  await expect(page.locator('.option-card')).toHaveCount(1);
  await expect(page.getByRole('combobox', { name: /duration|start month/i })).toHaveCount(0);
  await expect(page.locator('.timeline .crop-bar').first()).toBeVisible();
  await page.screenshot({ path: info.outputPath('automatic-calendar.png'), scale: 'css' });
  await page.getByRole('link', { name: 'Understand this choice', exact: true }).click();
  await expect(page.locator('.demo-check')).toHaveCount(7);
  await page.getByRole('link', { name: 'Back to comparison', exact: true }).click();
  await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
  await expect(page).toHaveURL('/track');
  const crop = page.locator('.tracking-crops > section').first();
  await expect(crop.getByRole('checkbox', { name: 'Harvested', exact: true })).toBeDisabled();
  await crop.getByRole('checkbox', { name: 'Planted', exact: true }).check();
  await crop.getByRole('checkbox', { name: 'Harvested', exact: true }).check();
  await expect(crop.getByRole('checkbox', { name: 'Planted', exact: true })).toBeDisabled();
  await crop.getByRole('textbox', { name: 'Notes', exact: true }).fill('Planted by our family.');
  await expect(page.getByRole('progressbar', { name: 'Recorded task progress' })).toHaveAttribute(
    'value',
    '2',
  );
  const records = await page.evaluate(() => localStorage.getItem('ritu-journey-v1'));
  await page.reload();
  await expect(crop.getByRole('checkbox', { name: 'Harvested', exact: true })).toBeChecked();
  await expect(crop.getByRole('textbox', { name: 'Notes', exact: true })).toHaveValue(
    'Planted by our family.',
  );
  expect(await page.evaluate(() => localStorage.getItem('ritu-journey-v1'))).toBe(records);
  expect(external).toEqual([]);
});

test('missing inputs and unselected seasons cannot bypass review or force a calendar', async ({
  page,
}) => {
  await page.goto('/plan');
  await expect(page.getByRole('link', { name: 'Review farm details' })).toBeVisible();
  await page.goto('/farm');
  await page.getByRole('combobox', { name: 'Soil texture', exact: true }).selectOption('unknown');
  await expect(
    page.getByRole('button', { name: 'See suggested crops', exact: true }),
  ).toBeDisabled();
  await page.goto('/crops');
  await expect(page.locator('.suggested-crop')).toHaveCount(0);
  await page.goto('/farm');
  await page.getByRole('combobox', { name: 'Soil texture', exact: true }).selectOption('loam');
  await page.getByRole('button', { name: 'See suggested crops', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Consider Potato', exact: true })).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Consider Mung bean', exact: true }).check();
  await expect(page.getByRole('button', { name: 'Build my calendar', exact: true })).toBeDisabled();
  await expect(page.locator('[data-tour="build-calendar"]')).toContainText('Winter');
  await page.getByText('Browse 43 crops', { exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search crops' }).fill('potato');
  await page.getByRole('button', { name: 'Inspect crop: Potato', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('combobox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add to my current calendar' })).toHaveCount(0);
});

test('labor changes select alternate mock windows; impossible household demands produce no plan', async ({
  page,
}) => {
  await page.goto('/farm');
  await page.getByText('Your priorities, household & help', { exact: true }).click();
  await page.locator('.labor-months').getByRole('checkbox').first().check();
  await chooseDefaultCrops(page);
  await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem('ritu-journey-v1')!).tracked.rotation.periods,
  );
  expect(saved.find((p: { crop: string }) => p.crop === 'mung').start).toBe(1);
  await page.goto('/farm');
  await page.getByText('Your priorities, household & help', { exact: true }).click();
  await page.getByRole('checkbox', { name: 'Potato', exact: true }).check();
  await page.getByRole('button', { name: 'See suggested crops', exact: true }).click();
  for (const crop of ['Mung bean', 'Aman rice', 'Mustard'])
    await page.getByRole('checkbox', { name: `Consider ${crop}`, exact: true }).check();
  await expect(page.getByRole('button', { name: 'Build my calendar', exact: true })).toBeDisabled();
  await expect(page.getByText(/cannot meet every household/)).toBeVisible();
});

test('scenario preview is unsaved and a scenario with no compatible plan cannot Apply', async ({
  page,
}) => {
  await seedPlan(page);
  await page.goto('/plan');
  await page.getByRole('link', { name: 'Try a water-shortage scenario', exact: true }).click();
  const saved = await page.evaluate(() => localStorage.getItem('ritu-preview-v1'));
  await page
    .getByRole('combobox', { name: 'Scenario irrigation', exact: true })
    .selectOption('severe');
  await page.getByRole('combobox', { name: 'Scenario climate', exact: true }).selectOption('dry');
  await expect(page.getByRole('button', { name: 'Apply scenario', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => localStorage.getItem('ritu-preview-v1'))).toBe(saved);
  await page.getByRole('button', { name: 'Reset scenario draft', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Scenario irrigation' })).toHaveValue('limited');
  await page
    .getByRole('combobox', { name: 'Scenario irrigation', exact: true })
    .selectOption('severe');
  await expect(page.getByRole('button', { name: 'Apply scenario', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Apply scenario', exact: true }).click();
  await expect(page.locator('.option-card')).not.toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('combobox', { name: 'Scenario irrigation' })).toHaveValue('severe');
});

test('condition edits invalidate suggestions and generation but preserve the tracked snapshot', async ({
  page,
}) => {
  await seedPlan(page);
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem('ritu-journey-v1')!).tracked,
  );
  await page.goto('/farm');
  await page.getByRole('radio', { name: 'Severe shortage', exact: true }).check();
  await page.goto('/plan');
  await expect(page.getByRole('link', { name: 'Review farm details', exact: true })).toBeVisible();
  await page.goto('/track');
  await expect(page.getByText(/saved snapshot/)).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('ritu-journey-v1')!).tracked),
  ).toEqual(before);
});

test('saving the same calendar preserves progress; replacements and clearing need a deliberate action', async ({
  page,
}) => {
  await seedPlan(page);
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
  await page
    .locator('.tracking-crops > section')
    .first()
    .getByRole('checkbox', { name: 'Planted', exact: true })
    .check();
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
  await expect(
    page
      .locator('.tracking-crops > section')
      .first()
      .getByRole('checkbox', { name: 'Planted', exact: true }),
  ).toBeChecked();
  await page.goto('/plan');
  await page.locator('.option-card-select').nth(1).click();
  await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Keep my records', exact: true }).click();
  await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
  await page.getByRole('button', { name: 'Replace calendar', exact: true }).click();
  await expect(page.getByRole('progressbar', { name: 'Recorded task progress' })).toHaveAttribute(
    'value',
    '0',
  );
  await page.getByRole('button', { name: 'Clear saved calendar & progress', exact: true }).click();
  await page.getByRole('button', { name: 'Keep my records', exact: true }).click();
  await expect(page.locator('.tracking-crops > section')).toHaveCount(3);
  await page.getByRole('button', { name: 'Clear saved calendar & progress', exact: true }).click();
  await page.getByRole('button', { name: 'Clear records', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Save a calendar to begin tracking', exact: true }),
  ).toBeVisible();
});

test('extra-large Bangla reflows across all four steps and passes tested axe checks', async ({
  page,
}, info) => {
  await page.goto('/farm');
  await page.setViewportSize({ width: 320, height: 1000 });
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await page.getByRole('button', { name: 'পড়া ও শব্দ', exact: true }).click();
  await page.getByRole('radio', { name: 'আরও বড়', exact: true }).check();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'প্রস্তাবিত ফসল দেখুন', exact: true }).click();
  for (const crop of ['মুগ ডাল', 'আমন ধান', 'সরিষা'])
    await page.getByRole('checkbox', { name: `বিবেচনা করুন ${crop}`, exact: true }).check();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'আমার ক্যালেন্ডার তৈরি করুন', exact: true }).click();
  await expect(page).toHaveTitle(/Step 3.*RITU/);
  const axePlan = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(axePlan.violations.map((v) => v.id)).toEqual([]);
  await page.getByRole('button', { name: 'ক্যালেন্ডার রাখুন ও হিসাব করুন', exact: true }).click();
  await expect(page).toHaveTitle(/Step 4.*RITU/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations.map((v) => v.id)).toEqual([]);
  await page.screenshot({ path: info.outputPath('tracking-bangla-320.png'), scale: 'css' });
});
