import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { trackingFarm, testThermalProfile } from '../fixtures/tracking-farm';
import type { SeasonFarm } from '../../src/domain/global-season';
import type { ThermalWeather } from '../../src/domain/crop-thermal';
import { addDays } from '../../src/domain/evidence-planner';
import { testWeather } from './browser-test';
const today = '2026-05-05',
  now = '2026-05-05T10:00:00Z';
async function openFarm(page: Page, farm = trackingFarm(), others: SeasonFarm[] = []) {
  await page.clock.setFixedTime(new Date(now));
  await page.addInitScript(
    ({ farms }) => {
      localStorage.setItem('ritu-tour-v1', 'seen');
      localStorage.setItem(
        'ritu-page-tours-v1',
        JSON.stringify(['/farms', '/farm', '/crops', '/plan']),
      );
      if (!localStorage.getItem('adaptive-seed')) {
        localStorage.setItem(
          'ritu-season-farms-v1',
          JSON.stringify({
            version: 1,
            farms,
            activeId: farms[0].id,
            calendarAccessId: farms[0].id,
            confirmedKey: null,
          }),
        );
        localStorage.setItem('adaptive-seed', '1');
      }
    },
    { farms: [farm, ...others] },
  );
  await page.route('**/api/weather?**', (route) => {
    const q = new URL(route.request().url()).searchParams,
      w = testWeather(Number(q.get('latitude')), Number(q.get('longitude')));
    w.fetchedAt = now;
    w.current.time = '2026-05-05T16:00';
    w.timezone = 'Asia/Dhaka';
    w.utcOffset = 21600;
    w.days = w.days.map((d, i) => ({ ...d, date: addDays(today, i) }));
    return route.fulfill({ json: { weather: w } });
  });
  await page.goto('/plan');
  await expect(
    page.getByRole('heading', { name: 'Synthetic activity QA', exact: true }),
  ).toBeVisible();
}
const status = (page: Page) => page.locator('.season-progress');
const save = (page: Page) =>
  page.getByRole('button', { name: 'Save daily check-in', exact: true }).click();
const checkin = (page: Page) => page.locator('.season-check-in');
test.afterEach(async ({ page }) => {
  expect((await page.pageErrors()).map((e) => e.message)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});

test('late crops remain active with visible reference and extension days', async ({
  page,
}, info) => {
  await openFarm(page);
  await expect(status(page)).toContainText('Beyond reference window · still growing');
  await expect(
    page.getByRole('button', { name: /2026-05-01 · Continuing beyond reference/ }),
  ).toHaveClass(/extended-day/);
  await page.getByRole('button', { name: 'Previous month', exact: true }).click();
  await expect(page.getByRole('button', { name: /2026-04-30 · Reference window/ })).toHaveClass(
    /reference-day/,
  );
  await page.getByRole('button', { name: 'Back to today', exact: true }).click();
  await status(page).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('continuing-season.png') });
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('ritu-season-farms-v1')!).farms[0].harvestedDate,
    ),
  ).toBe('');
});

test('partial picking stays active, final harvest completes, and an erroneous finish can be removed', async ({
  page,
}, info) => {
  await openFarm(page, trackingFarm({ plantedDate: '2026-03-01' }));
  await page.getByLabel('Observed stage', { exact: true }).selectOption('Harvested');
  await expect(
    page.getByRole('button', { name: 'Save daily check-in', exact: true }),
  ).toBeDisabled();
  await page.getByLabel('Harvest status', { exact: true }).selectOption('started');
  await save(page);
  await expect(status(page)).toContainText('Harvest underway · still active');
  await page.getByLabel('Observed stage', { exact: true }).selectOption('Harvested');
  await page.getByLabel('Harvest status', { exact: true }).selectOption('finished');
  await save(page);
  await expect(status(page)).toContainText('Season completed · history retained');
  await expect(
    page.getByText('Check stored produce and update your notes', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Observed stage', { exact: true })).toBeDisabled();
  await expect(page.locator('.season-calendar-grid .harvested-day')).toHaveAccessibleName(
    /2026-05-05.*Actual harvest recorded/,
  );
  await page.reload();
  await expect(status(page)).toContainText('Season completed');
  await page.getByText('Daily updates and corrections', { exact: true }).click();
  await checkin(page)
    .getByRole('button', { name: /Remove field update/ })
    .first()
    .click();
  await expect(status(page)).toContainText('Harvest underway · still active');
  await expect(page.getByLabel('Observed stage', { exact: true })).toBeEnabled();
  await page.getByLabel('Harvest status', { exact: true }).selectOption('finished');
  await page.getByLabel('Observed stage', { exact: true }).selectOption('Harvested');
  await save(page);
  await status(page).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('final-harvest.png') });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export all farm records', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('ritu-farm-records.json');
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ritu-season-farms-v1')!),
  );
  expect(state.farms[0].checkIns).toHaveLength(2);
});

test('daily stage, soil and damage reports update next-day checks without inventing a date', async ({
  page,
}, info) => {
  await openFarm(page);
  await page.getByLabel('Observed stage', { exact: true }).selectOption('Flowering');
  await page.getByText('Water and crop condition · optional', { exact: true }).click();
  await page.getByLabel('Soil water observed', { exact: true }).selectOption('dry');
  await page.getByLabel('Visible damage or symptoms', { exact: true }).selectOption('seen');
  await save(page);
  await page.getByRole('button', { name: 'See next day’s checks', exact: true }).click();
  await expect(
    page.getByText('Give the flowering crop a careful water check', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Recheck the reported dry soil', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Inspect and document the reported damage', { exact: true }),
  ).toBeVisible();
  await expect(page.getByLabel('Observed stage', { exact: true })).toBeDisabled();
  await expect(page.locator('.season-model-status')).toHaveCount(0);
  const recorded = await page.evaluate(
    () => JSON.parse(localStorage.getItem('ritu-season-farms-v1')!).farms[0],
  );
  expect(recorded.selection).toEqual(trackingFarm().selection);
  expect(recorded.harvestedDate).toBe('');
  await page.getByRole('link', { name: 'Update today’s field observations', exact: true }).click();
  await expect(page.getByLabel('Observed stage', { exact: true })).toBeEnabled();
  await page.getByLabel('Observed stage', { exact: true }).selectOption('No change');
  await save(page);
  await checkin(page).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('daily-report.png') });
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations).toEqual([]);
});

test('uncertain observations and future/preplanting dates do not become confirmed stages', async ({
  page,
}) => {
  await openFarm(page, trackingFarm({ plantedDate: '2026-05-03' }));
  await page.getByRole('button', { name: '2026-05-02', exact: true }).click();
  await expect(page.getByLabel('Observed stage', { exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Back to today', exact: true }).click();
  await page.getByLabel('Observed stage', { exact: true }).selectOption('Flowering');
  await page.getByLabel('How sure are you?', { exact: true }).selectOption('unsure');
  await save(page);
  await expect(
    page.getByText('Give the flowering crop a careful water check', { exact: true }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: '2026-05-06', exact: true }).click();
  await expect(page.getByLabel('Observed stage', { exact: true })).toBeDisabled();
});

test('perennial harvests leave care active and records stay isolated between farms', async ({
  page,
}) => {
  const base = trackingFarm(),
    mango = trackingFarm({
      selection: {
        ...base.selection,
        crop: 'ecocrop-1416',
        planKind: 'perennial-review',
        durationMin: 365,
        durationMax: 365,
        endEarly: '2027-01-01',
        endLate: '2027-01-01',
      },
    });
  await openFarm(page, mango, [
    trackingFarm({ id: 'other', field: { ...base.field, name: 'Other farm' } }),
  ]);
  await page.getByLabel('Observed stage', { exact: true }).selectOption('Harvested');
  await page.getByLabel('Harvest status', { exact: true }).selectOption('finished');
  await save(page);
  await expect(status(page)).toContainText('Perennial care continues');
  await expect(page.getByLabel('Observed stage', { exact: true })).toBeEnabled();
  await page.getByLabel('Switch farm', { exact: true }).selectOption('other');
  await expect(page.getByLabel('Actual harvest date', { exact: true })).toHaveValue('');
  await page.getByLabel('Switch farm', { exact: true }).selectOption(base.id);
  await expect(page.getByLabel('Actual harvest date', { exact: true })).toHaveValue(today);
  await expect(
    page.getByText('Review perennial establishment and local fruiting guidance', { exact: true }),
  ).toBeVisible();
});

function thermalSeries(farm: SeasonFarm): ThermalWeather {
  return {
    requested: farm.site,
    timezone: 'Asia/Dhaka',
    today,
    fetchedAt: now,
    history: [2, 3, 4].map((d) => ({
      date: `2026-05-0${d}`,
      minimum: 10,
      maximum: 30,
      sourceUrl: 'https://example.org/qa-history',
    })),
    forecast: Array.from({ length: 7 }, (_, i) => ({
      date: addDays(today, i),
      minimum: 10,
      maximum: 30,
      sourceUrl: 'https://example.org/qa-forecast',
    })),
    sources: ['https://api.open-meteo.com/v1/forecast'],
  };
}
test('documented grain-corn model has no defaults, shows a short projection, and reanchors at confirmed silking', async ({
  page,
}, info) => {
  const farm = trackingFarm({ plantedDate: '2026-05-01' });
  await page.route('**/api/crop-thermal?**', (r) =>
    r.fulfill({ json: { series: thermalSeries(farm) } }),
  );
  await openFarm(page, farm);
  await page.getByText('Grain-corn heat model · documented variety', { exact: true }).click();
  await expect(page.getByLabel('GDD to black layer', { exact: true })).toHaveValue('');
  await expect(
    page.getByRole('button', { name: 'Save documented model inputs', exact: true }),
  ).toBeDisabled();
  await page
    .getByLabel('Actual grain-corn hybrid', { exact: true })
    .fill(testThermalProfile.variety);
  await page.getByLabel('GDD to black layer', { exact: true }).fill('100');
  await page.getByLabel('GDD to 50% silking', { exact: true }).fill('60');
  await page
    .getByLabel('Heat requirement document URL', { exact: true })
    .fill(testThermalProfile.sourceUrl);
  await page
    .getByLabel('Document excerpt and method confirmation', { exact: true })
    .fill(testThermalProfile.sourceNote);
  await page.locator('.season-model-consent input').check();
  await page.getByRole('button', { name: 'Save documented model inputs', exact: true }).click();
  await expect(status(page)).toContainText('Heat-threshold projection: 7 May 2026');
  await expect(page.locator('.projected-day')).toHaveAccessibleName(
    /2026-05-07.*Forecast heat-threshold projection/,
  );
  await page.getByRole('button', { name: '2026-05-03', exact: true }).click();
  await page.getByLabel('Observed stage', { exact: true }).selectOption('Flowering');
  await page.getByText('New grain-corn milestone · optional', { exact: true }).click();
  await page
    .getByLabel('Milestone first reached on this selected date', { exact: true })
    .selectOption('maize-silking');
  await save(page);
  await expect(checkin(page).getByRole('alert')).toContainText('at least half');
  await page.getByLabel('How much of the field?', { exact: true }).selectOption('half');
  await save(page);
  await expect(status(page)).toContainText('Heat-threshold projection: 6 May 2026');
  await expect(status(page)).toContainText('Anchored to the recorded 50%-silking event');
  await status(page).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath('thermal-projection-qa-inputs.png') });
  await page.reload();
  await expect(status(page)).toContainText('Heat-threshold projection: 6 May 2026');
  await page.getByText('Daily updates and corrections', { exact: true }).click();
  await checkin(page)
    .getByRole('button', { name: /Remove field update/ })
    .first()
    .click();
  await expect(status(page)).toContainText('Heat-threshold projection: 7 May 2026');
  await page.getByLabel('Observed stage', { exact: true }).selectOption('Flowering');
  await page.getByLabel('How much of the field?', { exact: true }).selectOption('half');
  await page.getByText('New grain-corn milestone · optional', { exact: true }).click();
  await page
    .getByLabel('Milestone first reached on this selected date', { exact: true })
    .selectOption('maize-silking');
  await save(page);
  await expect(status(page)).toContainText('Heat-threshold projection: 8 May 2026');
});

test('missing temperature history and provider outage withhold numerical dates', async ({
  page,
}) => {
  const farm = trackingFarm({ plantedDate: '2026-05-01', thermalProfile: testThermalProfile });
  let outage = false;
  await page.route('**/api/crop-thermal?**', (r) => {
    const series = thermalSeries(farm);
    series.history.splice(1, 1);
    return outage
      ? r.fulfill({ status: 502, json: { error: 'QA provider outage' } })
      : r.fulfill({ json: { series } });
  });
  await openFarm(page, farm);
  await expect(status(page)).toContainText('1 completed day(s) lack usable temperature evidence');
  await expect(page.locator('.projected-day')).toHaveCount(0);
  outage = true;
  await page.reload();
  await expect(status(page)).toContainText('fresh, complete weather evidence is needed');
  await expect(page.locator('.projected-day')).toHaveCount(0);
});

test('Bangla check-ins remain readable and the update anchor clears the sticky header', async ({
  page,
}, info) => {
  await openFarm(page);
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await page.getByRole('link', { name: 'আজকের জমির খবর দিন', exact: true }).click();
  await expect(page.getByLabel('দেখা পর্যায়', { exact: true })).toBeVisible();
  await page.getByLabel('দেখা পর্যায়', { exact: true }).selectOption('Not sure');
  await page.getByRole('button', { name: 'দিনের খবর রাখুন', exact: true }).click();
  await expect(checkin(page).getByRole('status')).toContainText('রাখা হয়েছে');
  await page.screenshot({ path: info.outputPath('bangla-field-update.png') });
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations).toEqual([]);
});
