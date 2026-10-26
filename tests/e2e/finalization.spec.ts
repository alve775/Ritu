import { test, expect } from './browser-test';
import type { Page } from './browser-test';
import AxeBuilder from '@axe-core/playwright';
import { emptyEvidenceState, profileKey } from '../../src/lib/evidence-store';
import { evidencePlans } from '../../src/domain/evidence-planner';
import { stepsForTour } from '../../src/data/tours';
import snapshot from '../../src/data/nasa/rajshahi-2025.json' with { type: 'json' };
const prepared = () => {
  const s = structuredClone(emptyEvidenceState);
  s.farm = {
    ...s.farm,
    area: 1.2,
    name: 'Entered test farm',
    irrigation: 'limited',
    drainage: 'good',
    soil: 'loam',
  };
  s.site = { latitude: 24.37, longitude: 88.6, name: 'Entered test field', countryCode: 'BD' };
  s.district = 'rajshahi';
  s.from = '2026-10-26';
  s.priority = 'diversity';
  s.preferred = ['wheat', 'mustard', 'maize', 'mung', 'aman'];
  s.reviewed = profileKey(s);
  return s;
};
async function seed(page: Page, save = false, bn = false) {
  const s = prepared();
  if (bn) s.language = 'bn';
  if (save) {
    const p = evidencePlans(s.from, s.preferred, s.farm, s.priority)[0];
    s.tracked = {
      plan: p,
      site: s.site!,
      profileKey: profileKey(s),
      savedAt: '2026-10-26T00:00:00Z',
      records: Object.fromEntries(p.periods.map((x) => [`${x.crop}:${x.start}`, { note: '' }])),
    };
  }
  await page.addInitScript((s) => {
    if (!localStorage.getItem('ritu-evidence-v2'))
      localStorage.setItem('ritu-evidence-v2', JSON.stringify(s));
  }, s);
  return s;
}
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
  await page.route('**/api/climate?**', (r) => r.fulfill({ json: { climate: snapshot } }));
  await page.route('**/api/season-history?**', (r) =>
    r.fulfill({ status: 502, json: { error: 'Provider failure for test' } }),
  );
});
test('empty profile, all field input gates, previous-crop controls and calendar save', async ({
  page,
}, info) => {
  await page.goto('/farm');
  await expect(page.getByRole('textbox', { name: 'Farm name · optional' })).toHaveValue('');
  await expect(page.getByRole('spinbutton', { name: 'Field area (hectares)' })).toHaveValue('');
  await page.getByRole('button', { name: 'See crop references' }).click();
  await expect(page.locator('.evidence-page [role="alert"]')).toContainText('Choose your farm pin');
  await page.getByText('Enter exact coordinates instead', { exact: true }).click();
  await page.getByRole('button', { name: 'Use these coordinates' }).click();
  await page.getByRole('textbox', { name: 'Farm name · optional' }).fill('User-entered farm');
  await page.getByRole('spinbutton', { name: 'Field area (hectares)' }).fill('1.2');
  await page.getByRole('combobox', { name: 'Confirm your district' }).selectOption('rajshahi');
  await page.getByLabel('Plan from', { exact: true }).fill('2026-10-26');
  await page.getByRole('radio', { name: 'Limited', exact: true }).check();
  await page.getByRole('combobox', { name: 'Drainage', exact: true }).selectOption('good');
  await page.getByText('Previous crops · optional', { exact: true }).click();
  await page.getByRole('button', { name: 'Add previous crop', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Remove previous crop: Wheat' })).toBeVisible();
  await page.getByRole('button', { name: 'Remove previous crop: Wheat' }).click();
  await page.getByRole('button', { name: 'See crop references' }).click();
  await expect(page).toHaveURL(/\/crops$/);
  await page.getByRole('button', { name: 'All seasons', exact: true }).click();
  for (const name of ['Wheat', 'Mung bean · Kharif I', 'Aman rice'])
    await page.getByRole('checkbox', { name, exact: true }).check();
  await page.getByRole('link', { name: 'Compare calendars', exact: true }).click();
  await expect(page.locator('[data-tour="calendar-dates"]')).toContainText('119 days reserved');
  await expect(page.getByRole('button', { name: 'Save calendar & track' })).toBeDisabled();
  await expect(page.locator('[data-tour="nasa-seasonal"]')).toContainText(
    'Complete NASA history is unavailable',
  );
  await page.locator('[data-tour="calendar-save"] input').check();
  await page.getByRole('button', { name: 'Save calendar & track' }).click();
  await expect(page).toHaveURL(/\/track$/);
  await expect(page.getByLabel('Actual planting date', { exact: true }).first()).toHaveValue('');
  await page
    .getByLabel('Field observations & notes', { exact: true })
    .first()
    .fill('Actual field observation');
  await expect
    .poll(() =>
      page.evaluate(() =>
        Object.values(JSON.parse(localStorage.getItem('ritu-evidence-v2')!).tracked.records).map(
          (r) => (r as { note: string }).note,
        ),
      ),
    )
    .toContain('Actual field observation');
  await page.reload();
  await expect(page.getByLabel('Field observations & notes', { exact: true }).first()).toHaveValue(
    'Actual field observation',
  );
  await page.screenshot({ path: info.outputPath('actual-flow-tracking.png'), fullPage: true });
});
test('source crop photos, practical arithmetic and explicit unplanted season', async ({ page }) => {
  await seed(page);
  await page.goto('/crops');
  await page.getByRole('button', { name: 'All seasons', exact: true }).click();
  await expect(page.locator('.source-crop-card')).toHaveCount(9);
  for (const photo of await page.locator('.source-crop-card img').all())
    await photo.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      page
        .locator('.source-crop-card img')
        .evaluateAll((imgs) => imgs.every((img) => (img as HTMLImageElement).naturalWidth > 0)),
    )
    .toBe(true);
  await page.getByText('Practical mung bean tools · CIMMYT / CSISA', { exact: true }).click();
  await page.getByRole('combobox', { name: 'Actual variety' }).selectOption('bari-mung-6');
  await expect(page.locator('.practice-tools')).toContainText('54.0–60.0 kg');
  await page.getByRole('spinbutton', { name: 'Healthy seedlings out of 50' }).fill('43');
  await expect(page.locator('.practice-tools')).toContainText('86%');
  const choices = page.locator('.source-crop-choice input');
  for (const c of await choices.all()) if (await c.isChecked()) await c.uncheck();
  await page.getByRole('checkbox', { name: 'Boro rice', exact: true }).check();
  await page.getByRole('checkbox', { name: 'Aman rice', exact: true }).check();
  await expect(page.getByRole('link', { name: 'Compare calendars', exact: true })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  await page.getByRole('checkbox', { name: /Leave unplanted: Pre-monsoon/ }).check();
  await page.getByRole('link', { name: 'Compare calendars', exact: true }).click();
  await expect(page.locator('.dated-period-list li')).toHaveCount(2);
  await expect(page.locator('.dated-period-list')).toContainText('155 days reserved');
});
test('actual dates reject future and harvest-before-planting; edits preserve saved site and records', async ({
  page,
}) => {
  const s = await seed(page, true);
  await page.goto('/track');
  const plant = page.getByLabel('Actual planting date', { exact: true }).first(),
    harvest = page.getByLabel('Actual harvest date', { exact: true }).first();
  await expect(harvest).toBeDisabled();
  await plant.fill('2090-01-01');
  await expect(page.locator('.evidence-page [role="alert"]')).toContainText('future');
  await expect(plant).toHaveValue('');
  await plant.fill('2026-10-20');
  await harvest.fill('2026-10-01');
  await expect(page.locator('.evidence-page [role="alert"]')).toContainText('on or after');
  await harvest.fill('2026-10-21');
  await expect(plant).toBeDisabled();
  await harvest.fill('');
  await expect(plant).toBeEnabled();
  await page.getByLabel('Field observations & notes').first().fill('Keep this note');
  await page.goto('/farm');
  await page.getByRole('textbox', { name: 'Farm name · optional' }).fill('Changed profile');
  await page.goto('/track');
  await expect(page.getByText(/Your setup has changed/)).toBeVisible();
  await expect(page.getByLabel('Field observations & notes').first()).toHaveValue('Keep this note');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('ritu-evidence-v2')!).tracked.site),
  ).toEqual(s.site);
});
test('global weather does not unlock Rajshahi crop dates for another country', async ({ page }) => {
  const s = prepared();
  s.site = {
    latitude: 38.9,
    longitude: -77.04,
    name: 'Washington, United States',
    countryCode: 'US',
  };
  s.district = 'other';
  s.reviewed = profileKey(s);
  await page.addInitScript((s) => localStorage.setItem('ritu-evidence-v2', JSON.stringify(s)), s);
  await page.goto('/crops');
  await expect(
    page.getByRole('heading', {
      name: 'Local calendar evidence is not integrated for this location',
    }),
  ).toBeVisible();
  await expect(page.locator('.source-crop-choice')).toHaveCount(0);
  await page.goto('/plan');
  await expect(
    page.getByRole('heading', { name: 'Local crop-calendar evidence is needed' }),
  ).toBeVisible();
});
test('reset clears every farm value and saved plan only after confirmation', async ({ page }) => {
  await seed(page, true);
  await page.goto('/farm');
  await page.getByRole('button', { name: 'Reset all data', exact: true }).click();
  await page.getByRole('button', { name: 'Keep my data', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Farm name · optional' })).toHaveValue(
    'Entered test farm',
  );
  await page.getByRole('button', { name: 'Reset all data', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Reset all data', exact: true })
    .click();
  await expect(page.getByRole('textbox', { name: 'Farm name · optional' })).toHaveValue('');
  await expect(page.getByRole('spinbutton', { name: 'Field area (hectares)' })).toHaveValue('');
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem('ritu-evidence-v2')!));
  expect(s.site).toBeUndefined();
  expect(s.farm.irrigation).toBe('unknown');
  expect(s.tracked).toBeNull();
  expect(s.preferred).toEqual([]);
});
test('old experimental data is preserved for export and never becomes actual input', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'ritu-demo-v1',
      JSON.stringify({ farm: { name: 'Old sample' }, tracked: 'sample' }),
    ),
  );
  await page.goto('/farm');
  await expect(page.getByRole('textbox', { name: 'Farm name · optional' })).toHaveValue('');
  expect(await page.evaluate(() => localStorage.getItem('ritu-demo-v1'))).toContain('Old sample');
  await page.goto('/sample');
  await expect(page.getByRole('heading', { name: 'Data sources & methods' })).toBeVisible();
});
test('malformed saved data survives recovery and cannot crash the planner', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-evidence-v2', '{broken actual record'));
  await page.goto('/farm');
  await expect(page.getByRole('textbox', { name: 'Farm name · optional' })).toHaveValue('');
  expect(await page.evaluate(() => localStorage.getItem('ritu-evidence-v2-recovery'))).toBe(
    '{broken actual record',
  );
});
test('all routes are accessible without document overflow', async ({ page }, info) => {
  await seed(page, true);
  for (const path of ['/farm', '/crops', '/plan', '/track', '/sources']) {
    await page.goto(path);
    await expect(page.locator('.evidence-page')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const a = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(a.violations.map((v) => ({ id: v.id, target: v.nodes.map((n) => n.target) }))).toEqual(
      [],
    );
    await page.screenshot({ path: info.outputPath(path.slice(1) + '.png'), fullPage: true });
  }
});
for (const complete of [false, true])
  test(`every tour step settles and keeps spotlight separate from card; completed=${complete}`, async ({
    page,
  }, info) => {
    test.setTimeout(90000);
    if (complete) await seed(page, true);
    await page.goto('/farm');
    await page.getByRole('button', { name: 'Take a tour', exact: true }).click();
    await page.getByRole('button', { name: /Full mission tour/ }).click();
    const before = await page.evaluate(() => localStorage.getItem('ritu-evidence-v2'));
    const tourSteps = stepsForTour('full');
    for (let i = 0; i < tourSteps.length; i++) {
      const card = page.locator('.tour-card');
      await expect(card).toHaveAttribute('aria-busy', 'false');
      await expect(page.locator('#tour-title')).toHaveAccessibleName(tourSteps[i].title.en);
      const b = await card.boundingBox();
      expect(b!.x).toBeGreaterThanOrEqual(0);
      expect(b!.y).toBeGreaterThanOrEqual(0);
      const spot = (await page.locator('.tour-spotlight').count())
        ? await page.locator('.tour-spotlight').boundingBox()
        : null;
      if (spot) {
        expect(spot.width).toBeGreaterThan(40);
        expect(spot.height).toBeGreaterThan(20);
        expect(
          Math.max(0, Math.min(b!.x + b!.width, spot.x + spot.width) - Math.max(b!.x, spot.x)) *
            Math.max(0, Math.min(b!.y + b!.height, spot.y + spot.height) - Math.max(b!.y, spot.y)),
        ).toBeLessThan(8);
      }
      if ([4, 8, 13, 17].includes(i))
        await page.screenshot({ path: info.outputPath(`tour-${complete}-${i}.png`) });
      await page
        .getByRole('button', {
          name: i === tourSteps.length - 1 ? 'Finish tour' : i === 0 ? 'Start the tour' : 'Next',
          exact: true,
        })
        .click();
    }
    await expect(page.locator('.tour-dialog')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('ritu-evidence-v2'))).toBe(before);
  });
test('Bangla at 320px and enlarged reading stay usable', async ({ page }, info) => {
  await seed(page, true, true);
  await page.addInitScript(() =>
    localStorage.setItem(
      'ritu-display-v1',
      JSON.stringify({
        text: 'larger',
        motion: false,
        sound: false,
        volume: 25,
        ambience: 'morning',
      }),
    ),
  );
  await page.setViewportSize({ width: 320, height: 700 });
  for (const p of ['/farm', '/crops', '/plan', '/track']) {
    await page.goto(p);
    await expect(page.locator('html')).toHaveAttribute('lang', 'bn');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await page.screenshot({ path: info.outputPath('bangla-320-larger.png'), fullPage: true });
});
test('detailed 2D landing scene has external controls, pause, activity focus and reduced motion', async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1900, height: 860 });
  await page.goto('/');
  await expect(page.locator('.growing-scene')).toHaveAttribute('data-renderer', 'svg-2d', {
    timeout: 30000,
  });
  const canvas = page.locator('.farm-vector');
  await canvas.scrollIntoViewIfNeeded();
  await expect(page.locator('canvas')).toHaveCount(0);
  await expect
    .poll(() => canvas.evaluate((s: SVGSVGElement) => s.getCurrentTime()))
    .toBeGreaterThan(0.1);
  await page.getByRole('button', { name: 'Pause animation' }).click();
  const time = await canvas.evaluate((s: SVGSVGElement) => s.getCurrentTime());
  await page.waitForTimeout(300);
  expect(await canvas.evaluate((s: SVGSVGElement) => s.getCurrentTime())).toBe(time);
  expect(await canvas.evaluate((s: SVGSVGElement) => s.animationsPaused())).toBe(true);
  for (const name of ['Sow', 'Care', 'Grow', 'Harvest']) {
    await page.getByRole('button', { name: new RegExp(`^${name} · chapter`) }).click();
    await expect(
      page.getByRole('button', { name: new RegExp(`^${name} · chapter`) }),
    ).toHaveAttribute('aria-pressed', 'true');
  }
  const box = await canvas.boundingBox(),
    toolbar = await page.locator('.farm-scene-toolbar').boundingBox();
  expect(toolbar!.y).toBeGreaterThanOrEqual(box!.y + box!.height - 1);
  await page.getByRole('button', { name: 'Replay from sowing' }).click();
  await page.screenshot({
    path: info.outputPath('detailed-farm-external-controls.png'),
    fullPage: true,
  });
  await expect
    .poll(() => canvas.evaluate((s: SVGSVGElement) => s.getCurrentTime()))
    .toBeGreaterThan(0.1);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect.poll(() => canvas.evaluate((s: SVGSVGElement) => s.animationsPaused())).toBe(true);
  await expect(page.getByRole('link', { name: 'Plan my season' })).toBeEnabled();
});
test('weather outage never creates synthetic field weather', async ({ page }) => {
  await seed(page, true);
  await page.route('**/api/weather?**', (r) =>
    r.fulfill({ status: 502, json: { error: 'outage' } }),
  );
  await page.goto('/track');
  await expect(page.locator('.farm-monitor')).toContainText(/unavailable|could not/i);
  await expect(page.locator('.farm-monitor')).not.toContainText('°C');
});
