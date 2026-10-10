import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { chooseDefaultCrops, seedPlan } from './fixtures';
import { defaultFarm } from '../../src/data/preview';
import { defaultDemo } from '../../src/data/demo-environment';
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
});

test('retired crop saves preserve farm details and other choices without exposing removed crops', async ({
  page,
}) => {
  await page.goto('/farm');
  await expect(page.getByRole('textbox', { name: 'Farm name', exact: true })).toBeVisible();
  await page.evaluate(
    ({ farm, demo }) => {
      const saved = JSON.parse(localStorage.getItem('ritu-preview-v1')!);
      localStorage.setItem(
        'ritu-preview-v1',
        JSON.stringify({
          ...saved,
          farm: {
            ...farm,
            name: 'Preserved field',
            area: 4.5,
            soil: 'clay',
            current: [
              { crop: 'sorghum', start: 0, duration: 3 },
              { crop: 'wheat', start: 8, duration: 3 },
            ],
          },
        }),
      );
      localStorage.setItem(
        'ritu-demo-v1',
        JSON.stringify({
          ...demo,
          location: 'other',
          weather: 'dry',
          preferred: ['sorghum', 'mung', 'mustard'],
        }),
      );
    },
    { farm: defaultFarm, demo: defaultDemo },
  );
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Farm name', exact: true })).toHaveValue(
    'Preserved field',
  );
  await expect(
    page.getByRole('spinbutton', { name: 'Field area (hectares)', exact: true }),
  ).toHaveValue('4.5');
  await expect(page.getByRole('combobox', { name: 'Soil texture', exact: true })).toHaveValue(
    'clay',
  );
  const persisted = await page.evaluate(() => ({
    farm: JSON.parse(localStorage.getItem('ritu-preview-v1')!).farm,
    demo: JSON.parse(localStorage.getItem('ritu-demo-v1')!),
  }));
  expect(persisted.farm.current).toEqual([{ crop: 'wheat', start: 8, duration: 3 }]);
  expect(persisted.demo).toEqual({
    ...defaultDemo,
    location: 'other',
    weather: 'dry',
    preferred: ['mung', 'mustard'],
  });
  await page.getByText('Previous crops · optional', { exact: true }).click();
  await expect(
    page.getByRole('combobox', { name: 'Previous crop to add', exact: true }).locator('option'),
  ).not.toContainText(['Sorghum']);
  await page.getByRole('button', { name: 'See suggested crops', exact: true }).click();
  await expect(page.getByRole('checkbox', { name: 'Consider Sorghum', exact: true })).toHaveCount(
    0,
  );
  await page.getByText('Browse 42 crops', { exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search crops', exact: true }).fill('sorghum');
  await expect(page.getByText('0 crops found', { exact: true })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search crops', exact: true }).fill('জোয়ার');
  await expect(page.getByText('0 crops found', { exact: true })).toBeVisible();
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
  await expect(page.locator('[data-tour="build-calendar"]')).not.toContainText(
    'No matching crop windows',
  );
  await page.getByText('Browse 42 crops', { exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search crops' }).fill('potato');
  await page.getByRole('button', { name: 'Inspect crop: Potato', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('combobox')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Add to my current calendar' })).toHaveCount(0);
});

test('unavailable seasons explain the blocker and farm review restores selectable choices without forcing a plan', async ({
  page,
}, info) => {
  await page.goto('/farm');
  await page.getByRole('combobox', { name: 'Drainage', exact: true }).selectOption('poor');
  await page.getByRole('button', { name: 'See suggested crops', exact: true }).click();
  await expect(page.locator('.suggested-crop')).toHaveCount(1);
  await page.getByRole('checkbox', { name: 'Consider Aman rice', exact: true }).check();
  const panel = page.locator('[data-tour="build-calendar"]');
  await expect(panel).toContainText('No matching crop windows for: Pre-monsoon, Winter.');
  await expect(panel).not.toContainText('Choose a suggested crop for:');
  await expect(page.getByRole('button', { name: 'Build my calendar', exact: true })).toBeDisabled();
  await expect(
    panel.getByRole('link', { name: 'Review farm conditions', exact: true }),
  ).toBeVisible();
  const stored = await page.evaluate(() => ({
    farm: JSON.parse(localStorage.getItem('ritu-preview-v1')!).farm,
    demo: JSON.parse(localStorage.getItem('ritu-demo-v1')!),
  }));
  expect(stored.farm.drainage).toBe('poor');
  expect(stored.demo.enabled).toBe(false);
  const checkActionSpacing = async () => {
    const buttons = await panel.locator('.calendar-actions > .button').evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.getBoundingClientRect();
        return {
          left: box.left,
          right: box.right,
          top: box.top,
          bottom: box.bottom,
          height: box.height,
        };
      }),
    );
    expect(buttons).toHaveLength(2);
    const [review, build] = buttons;
    expect(Math.max(build.left - review.right, build.top - review.bottom)).toBeGreaterThanOrEqual(
      15.5,
    );
    expect(buttons.every((button) => button.height >= 48)).toBe(true);
  };
  await checkActionSpacing();
  await panel.screenshot({ path: `research/calendar-blocker-${info.project.name}.png` });
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 800 });
  await expect(panel).toContainText('প্রাক্‌বর্ষা, শীত');
  await expect(page.getByRole('button', { name: 'আমার ক্যালেন্ডার তৈরি করুন' })).toBeDisabled();
  await page.getByRole('button', { name: 'পড়া ও শব্দ', exact: true }).click();
  await page.getByRole('radio', { name: 'আরও বড়', exact: true }).check();
  await page.keyboard.press('Escape');
  await checkActionSpacing();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await panel.screenshot({ path: `research/calendar-blocker-bangla-${info.project.name}.png` });
  await panel.getByRole('link', { name: 'জমির শর্ত দেখুন', exact: true }).click();
  await expect(page).toHaveURL('/farm');
  await page.getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Drainage', exact: true })).toHaveValue('poor');
  await page.getByRole('combobox', { name: 'Drainage', exact: true }).selectOption('good');
  await chooseDefaultCrops(page);
  await expect(page).toHaveURL('/plan');
  await expect(page.locator('.option-card')).toHaveCount(1);
});

test('labor changes select alternate mock windows; impossible household demands are blocked and fixable', async ({
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
  // Potato is never suggested for this farm, so it cannot be made a household need.
  await expect(page.getByRole('checkbox', { name: 'Potato', exact: true })).toBeDisabled();
  await expect(
    page.getByText(/Potato is not available on this farm: it needs more water/),
  ).toBeVisible();
  // A need saved before conditions changed is flagged and can be removed from the crop list.
  await page.evaluate(() => {
    const saved = JSON.parse(localStorage.getItem('ritu-preview-v1')!);
    saved.farm.required = ['rice', 'potato'];
    localStorage.setItem('ritu-preview-v1', JSON.stringify(saved));
  });
  await page.reload();
  await page.getByText('Your priorities, household & help', { exact: true }).click();
  await expect(
    page.getByText(/Untick Potato to get a calendar: it needs more water/),
  ).toBeVisible();
  await page.getByRole('button', { name: 'See suggested crops', exact: true }).click();
  const panel = page.locator('[data-tour="build-calendar"]');
  await expect(panel).toContainText('No crop suggested for this farm can include potato');
  await expect(page.getByRole('button', { name: 'Build my calendar', exact: true })).toBeDisabled();
  await panel
    .getByRole('button', { name: 'Remove potato from household crops', exact: true })
    .click();
  await expect(page).toHaveURL('/crops');
  for (const crop of ['Mung bean', 'Aman rice', 'Mustard'])
    await page.getByRole('checkbox', { name: `Consider ${crop}`, exact: true }).check();
  await expect(page.getByRole('button', { name: 'Build my calendar', exact: true })).toBeEnabled();
  const farm = await page.evaluate(() => JSON.parse(localStorage.getItem('ritu-preview-v1')!).farm);
  expect(farm.required).toEqual(['rice']);
});

test('resetting previous crops confirms first, persists an empty history and preserves saved tracking', async ({
  page,
}, info) => {
  await seedPlan(page);
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
  const savedTracking = await page.evaluate(() => localStorage.getItem('ritu-journey-v1'));
  await page.goto('/farm');
  const history = page.locator('[data-tour="farm-history"]');
  await history.locator('summary').click();
  const originalFarm = await page.evaluate(
    () => JSON.parse(localStorage.getItem('ritu-preview-v1')!).farm,
  );
  const reset = history.getByRole('button', { name: 'Reset previous crops', exact: true });
  await reset.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Keep previous crops', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(reset).toBeFocused();
  await expect(history.locator('.previous-crop-remove')).toHaveCount(2);
  await reset.click();
  await page.keyboard.press('Escape');
  await expect(history.locator('.previous-crop-remove')).toHaveCount(2);
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByRole('button', { name: 'পড়া ও শব্দ', exact: true }).click();
  await page.getByRole('radio', { name: 'আরও বড়', exact: true }).check();
  await page.keyboard.press('Escape');
  await history.getByRole('button', { name: 'আগের ফসল রিসেট করুন', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const dialogBox = await dialog.boundingBox();
  expect(dialogBox!.x).toBeGreaterThanOrEqual(0);
  expect(dialogBox!.x + dialogBox!.width).toBeLessThanOrEqual(320);
  await page.screenshot({ path: `research/history-reset-dialog-${info.project.name}.png` });
  await dialog.getByRole('button', { name: 'আগের ফসল মুছুন', exact: true }).click();
  await expect(history.locator('.previous-crop-remove')).toHaveCount(0);
  await expect(history.getByRole('button', { name: 'আগের ফসল রিসেট করুন' })).toBeDisabled();
  await expect(history.getByRole('button', { name: 'আগের ফসল যোগ করুন' })).toBeFocused();
  await expect(history.getByText('আগের কোনো ফসল লেখা নেই।', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('ritu-journey-v1'))).toBe(savedTracking);
  const clearedFarm = await page.evaluate(
    () => JSON.parse(localStorage.getItem('ritu-preview-v1')!).farm,
  );
  expect(clearedFarm).toEqual({
    ...originalFarm,
    current: [{ crop: 'fallow', start: 0, duration: 12 }],
  });
  await page.reload();
  await history.locator('summary').click();
  await expect(history.locator('.previous-crop-remove')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await history.screenshot({ path: `research/history-reset-empty-${info.project.name}.png` });
  await history.getByRole('button', { name: 'আগের ফসল যোগ করুন', exact: true }).click();
  await expect(history.locator('.previous-crop-remove')).toHaveCount(1);
});

test('top reset restores all farm inputs and clears every saved plan record after confirmation', async ({
  page,
}, info) => {
  await seedPlan(page);
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
  const crop = page.locator('.tracking-crops > section').first();
  await crop.getByRole('checkbox', { name: 'Planted', exact: true }).check();
  await crop
    .getByRole('textbox', { name: 'Notes', exact: true })
    .fill('Reset should clear this note');
  await page.goto('/farm');
  await page.getByRole('textbox', { name: 'Farm name', exact: true }).fill('Abid test farm');
  const area = page.getByRole('spinbutton', { name: /^Field area \(hectares\)/ });
  await area.fill('1.5');
  await area.blur();
  await page.getByRole('radio', { name: 'Reliable', exact: true }).check();
  await page.getByRole('combobox', { name: 'Soil texture', exact: true }).selectOption('clay');
  await page.getByRole('combobox', { name: 'Drainage', exact: true }).selectOption('poor');
  await page.getByText('Location & environment', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Pilot location', exact: true }).selectOption('other');
  await page.getByRole('combobox', { name: 'Environment', exact: true }).selectOption('hot');
  await page.getByText('Your priorities, household & help', { exact: true }).click();
  await page
    .getByRole('radio', {
      name: 'Keep it familiar Prefer crops you have grown before',
      exact: true,
    })
    .check();
  await page.getByRole('checkbox', { name: 'Rice', exact: true }).uncheck();
  await page.locator('.labor-months').getByRole('checkbox').first().check();
  const history = page.locator('[data-tour="farm-history"]');
  await history.locator('summary').click();
  await history.getByRole('button', { name: 'Add previous crop', exact: true }).click();
  const before = await page.evaluate(() =>
    ['ritu-preview-v1', 'ritu-demo-v1', 'ritu-journey-v1'].map((key) => localStorage.getItem(key)),
  );
  const reset = page
    .locator('.planner-heading')
    .getByRole('button', { name: 'Reset all data', exact: true });
  await reset.click();
  await page.getByRole('dialog').getByRole('button', { name: 'Keep my data', exact: true }).click();
  expect(
    await page.evaluate(() =>
      ['ritu-preview-v1', 'ritu-demo-v1', 'ritu-journey-v1'].map((key) =>
        localStorage.getItem(key),
      ),
    ),
  ).toEqual(before);
  await expect(reset).toBeFocused();
  await reset.click();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => localStorage.getItem('ritu-journey-v1'))).toBe(before[2]);
  await area.fill('0');
  await expect(area).toHaveAttribute('aria-invalid', 'true');
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await page.setViewportSize({ width: 320, height: 800 });
  await page.getByRole('button', { name: 'পড়া ও শব্দ', exact: true }).click();
  await page.getByRole('radio', { name: 'আরও বড়', exact: true }).check();
  await page.keyboard.press('Escape');
  await page
    .locator('.planner-heading')
    .getByRole('button', { name: 'সব তথ্য রিসেট করুন' })
    .click();
  const dialog = page.getByRole('dialog');
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  const box = await dialog.boundingBox();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(320);
  await page.screenshot({ path: `research/full-reset-dialog-${info.project.name}.png` });
  await dialog.getByRole('button', { name: 'সব তথ্য রিসেট করুন', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const after = await page.evaluate(() => ({
    planner: JSON.parse(localStorage.getItem('ritu-preview-v1')!),
    demo: JSON.parse(localStorage.getItem('ritu-demo-v1')!),
    journey: JSON.parse(localStorage.getItem('ritu-journey-v1')!),
  }));
  expect(after.planner.farm).toEqual(defaultFarm);
  expect(after.planner.priority).toBe('water');
  expect(after.planner.language).toBe('bn');
  expect(after.demo).toEqual({ ...defaultDemo, preferred: [] });
  expect(after.journey).toEqual({ reviewed: null, generatedFor: null, tracked: null });
  const resetArea = page.getByRole('spinbutton', { name: 'জমির আয়তন (হেক্টর)', exact: true });
  await expect(resetArea).toHaveValue(String(defaultFarm.area));
  await expect(resetArea).toHaveAttribute('aria-invalid', 'false');
  await expect(
    page.locator('.planner-heading').getByRole('button', { name: 'সব তথ্য রিসেট করুন' }),
  ).toBeFocused();
  await page.reload();
  await expect(resetArea).toHaveValue(String(defaultFarm.area));
  await expect(page.getByRole('textbox', { name: 'জমির নাম', exact: true })).toHaveValue(
    defaultFarm.name,
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: `research/full-reset-farm-${info.project.name}.png` });
  await page.goto('/plan');
  await expect(page.locator('.option-card')).toHaveCount(0);
  await page.goto('/track');
  await expect(page.locator('.tracking-crops > section')).toHaveCount(0);
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

test('crop choices never reach a complete selection without a calendar', async ({ page }) => {
  await page.goto('/farm');
  await page.getByRole('button', { name: 'See suggested crops', exact: true }).click();
  const box = (crop: string) =>
    page.getByRole('checkbox', { name: `Consider ${crop}`, exact: true });
  // Mung fills pre-monsoon and monsoon, so adding a winter crop now would leave no rice.
  await box('Mung bean').check();
  await expect(box('Mustard')).toBeDisabled();
  await expect(page.getByText('Choose a rice crop first.').first()).toBeVisible();
  await box('Aman rice').check();
  await box('Mustard').check();
  await expect(box('Aman rice')).toBeDisabled();
  await expect(page.getByText('Keeps rice in your calendar.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Build my calendar', exact: true })).toBeEnabled();
  await page.evaluate(() => {
    const demo = JSON.parse(localStorage.getItem('ritu-demo-v1')!);
    localStorage.setItem(
      'ritu-demo-v1',
      JSON.stringify({ ...demo, preferred: ['mung', 'mustard'] }),
    );
  });
  await page.reload();
  await expect(page.getByRole('status').filter({ hasText: 'Added Aman rice' })).toBeVisible();
  await expect(
    page.getByRole('checkbox', { name: 'Consider Aman rice', exact: true }),
  ).toBeChecked();
  await page.getByRole('button', { name: 'Build my calendar', exact: true }).click();
  await expect(page).toHaveURL('/plan');
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ritu-demo-v1')!));
  expect(stored.preferred).toEqual(['mung', 'mustard', 'aman']);
});

test('changing water unticks a household crop the farm can no longer grow', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
  await page.goto('/farm');
  await page.getByText('Your priorities, household & help', { exact: true }).click();
  const potato = page.getByRole('checkbox', { name: 'Potato', exact: true });
  await expect(potato).toBeDisabled();
  await page.getByRole('radio', { name: 'Reliable', exact: true }).check();
  await potato.check();
  await page.getByRole('radio', { name: 'Limited', exact: true }).check();
  await expect(potato).not.toBeChecked();
  await expect(potato).toBeDisabled();
  await expect(page.getByText(/Potato was unticked: it needs more water/)).toBeVisible();
  const farm = await page.evaluate(() => JSON.parse(localStorage.getItem('ritu-preview-v1')!).farm);
  expect(farm.required).toEqual(['rice']);
  await page.getByRole('radio', { name: 'Reliable', exact: true }).check();
  await expect(potato).toBeEnabled();
  await expect(potato).not.toBeChecked();
  await expect(page.getByText(/Potato was unticked/)).toHaveCount(0);
});
