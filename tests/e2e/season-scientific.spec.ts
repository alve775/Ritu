import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { trackingFarm, testThermalProfile } from '../fixtures/tracking-farm';
import { testWeather } from './browser-test';
import { addDays } from '../../src/domain/evidence-planner';
const today = '2026-05-05',
  now = '2026-05-05T10:00:00Z';
async function open(page: Page, farm = trackingFarm()) {
  await page.clock.install({ time: new Date(now) });
  await page.addInitScript(
    ({ farm }) => {
      localStorage.setItem('ritu-tour-v1', 'seen');
      localStorage.setItem(
        'ritu-page-tours-v1',
        JSON.stringify(['/farms', '/farm', '/crops', '/plan']),
      );
      if (!localStorage.getItem('scientific-seed')) {
        localStorage.setItem(
          'ritu-season-farms-v1',
          JSON.stringify({
            version: 1,
            farms: [farm],
            activeId: farm.id,
            calendarAccessId: farm.id,
            confirmedKey: null,
          }),
        );
        localStorage.setItem('scientific-seed', '1');
      }
    },
    { farm },
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
  // Deliberate provider outage unless a case supplies its own synthetic response.
  await page.route('**/api/soil-reference?**', (r) =>
    r.fulfill({ status: 502, json: { error: 'QA provider outage' } }),
  );
  await page.goto('/plan');
  await expect(
    page.getByRole('heading', { name: 'Synthetic activity QA', exact: true }),
  ).toBeVisible();
}
test.afterEach(async ({ page }) => {
  expect((await page.pageErrors()).map((e) => e.message)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
async function fillWater(page: Page) {
  const panel = page.locator('.water-budget-panel');
  await panel.locator('> summary').click();
  await panel.getByLabel('Field water system', { exact: true }).selectOption('upland');
  for (const [label, value] of [
    ['Field capacity · volume %', '32'],
    ['Wilting point · volume %', '12'],
    ['Beginning soil water · volume %', '25.125'],
    ['Effective root depth (m)', '0.8'],
    ['Depletion fraction p (0–1)', '0.4'],
    ['Crop-stage coefficient Kc', '1.2'],
    ['Reference ET₀ (mm/day)', '5'],
    ['Rainfall (mm)', '0'],
    ['Rainfall runoff (mm)', '0'],
    ['Infiltrated irrigation (mm)', '0'],
    ['Capillary rise (mm)', '0'],
  ])
    await panel.getByLabel(label, { exact: true }).fill(value);
  await panel
    .getByLabel('Soil/root-zone and water-input evidence', { exact: true })
    .fill('FAO Example 37 inputs, QA only; not a surveyed farm');
  await panel
    .getByLabel('Kc and p source · actual crop/stage and conditions', { exact: true })
    .fill('FAO Example 37 numerical verification only');
  await panel.getByLabel('Reference ET₀ source', { exact: true }).fill('FAO Example 37');
  await panel.getByRole('checkbox').check();
  return panel;
}
test('published water example saves, reloads and exports without inventing measurements', async ({
  page,
}, info) => {
  await open(page);
  const panel = await fillWater(page);
  await panel.getByRole('button', { name: 'Calculate & save water balance', exact: true }).click();
  const result = panel.getByRole('region', { name: 'Water balance result', exact: true });
  await expect(result).toContainText('160.00 mm');
  await expect(result).toContainText('61.00 mm');
  await expect(result).toContainText('Planning scenario');
  const stored = await page.evaluate(
    () => JSON.parse(localStorage.getItem('ritu-season-farms-v1')!).farms[0],
  );
  expect(stored.waterRecords).toHaveLength(1);
  expect(stored.waterRecords[0].mode).toBe('scenario');
  expect(stored.selection.crop).toBe('maize');
  await result.screenshot({ path: info.outputPath('published-water-result.png') });
  await page.reload();
  await page.locator('.water-budget-panel > summary').click();
  await expect(
    page.getByRole('region', { name: 'Water balance result', exact: true }),
  ).toContainText('61.00 mm');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export all farm records', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('ritu-farm-records.json');
});
test('ponded paddy and inconsistent rainfall do not produce an upland result', async ({ page }) => {
  await open(page);
  const panel = await fillWater(page);
  await panel.getByLabel('Field water system', { exact: true }).selectOption('ponded');
  await panel.getByRole('button', { name: 'Calculate & save water balance', exact: true }).click();
  await expect(panel).toContainText('Ponded paddy needs a separate water model');
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('ritu-season-farms-v1')!).farms[0].waterRecords,
    ),
  ).toBeUndefined();
  await panel.getByLabel('Field water system', { exact: true }).selectOption('upland');
  await panel.getByLabel('Rainfall runoff (mm)', { exact: true }).fill('1');
  await panel.getByRole('checkbox').check();
  await panel.getByRole('button', { name: 'Calculate & save water balance', exact: true }).click();
  await expect(panel).toContainText('runoff ≤ rain');
});
test('soil record persists independently of modeled references, and can be cleared', async ({
  page,
}, info) => {
  await open(page);
  const panel = page.locator('.soil-evidence-form');
  await panel.locator('> summary').click();
  await panel.getByLabel('Measured soil pH', { exact: true }).fill('6.3');
  await panel.getByLabel('pH measurement method', { exact: true }).selectOption('cacl2');
  await panel.getByLabel('Sample depth (cm)', { exact: true }).fill('15');
  await panel.getByLabel('Soil sampling date', { exact: true }).fill('2026-05-01');
  await panel
    .getByLabel('Laboratory / field source and report reference', { exact: true })
    .fill('Synthetic laboratory QA record');
  await panel.getByRole('button', { name: 'Save soil test record', exact: true }).click();
  await page.reload();
  await panel.locator('> summary').click();
  await expect(panel.getByLabel('Measured soil pH', { exact: true })).toHaveValue('6.3');
  await expect(page.locator('.soil-reference')).toContainText('not available near this field');
  await expect(panel.getByLabel('pH measurement method', { exact: true })).toHaveValue('cacl2');
  await panel.screenshot({ path: info.outputPath('measured-soil-and-source.png') });
  await panel.getByRole('button', { name: 'Clear soil test record', exact: true }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('ritu-season-farms-v1')!).farms[0].field.soilEvidence,
    ),
  ).toBeUndefined();
});
test('Bangladesh named variety changes the reference window while preserving its original source', async ({
  page,
}, info) => {
  const farm = trackingFarm({ plantedDate: '2026-05-01' });
  farm.selection = { ...farm.selection, crop: 'mung' };
  farm.site = { ...farm.site, countryCode: 'BD' };
  await open(page, farm);
  const original = await page.evaluate(
    () => JSON.parse(localStorage.getItem('ritu-season-farms-v1')!).farms[0].selection,
  );
  const panel = page.locator('.cultivar-reference');
  await panel.locator('> summary').click();
  await panel.getByLabel('Actual mungbean variety', { exact: true }).selectOption('bari-mung-6');
  await expect(
    panel.getByRole('button', { name: 'Use this variety reference', exact: true }),
  ).toBeDisabled();
  await panel.getByRole('checkbox').check();
  await panel.getByRole('button', { name: 'Use this variety reference', exact: true }).click();
  await expect(page.locator('.season-progress')).toContainText('BARI Mung-6');
  await expect(page.locator('.season-progress')).toContainText('24 Jun 2026');
  await panel.screenshot({ path: info.outputPath('named-mung-variety.png') });
  await page.reload();
  await expect(page.locator('.season-progress')).toContainText('BARI Mung-6');
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('ritu-season-farms-v1')!).farms[0].selection,
    ),
  ).toEqual(original);
  await page.locator('.cultivar-reference > summary').click();
  await page.getByRole('button', { name: 'Use original reference instead', exact: true }).click();
  await expect(page.locator('.season-progress')).not.toContainText('BARI Mung-6');
});
test('weather pause survives reload and stops timers/visibility updates; manual refresh still works', async ({
  page,
}) => {
  let requests = 0,
    thermalRequests = 0;
  await page.route('**/api/crop-thermal?**', (r) =>
    r.fulfill({ status: 502, json: { error: 'QA heat-provider outage' } }),
  );
  page.on('request', (r) => {
    if (new URL(r.url()).pathname === '/api/weather') requests++;
    if (new URL(r.url()).pathname === '/api/crop-thermal') thermalRequests++;
  });
  await open(page, trackingFarm({ thermalProfile: testThermalProfile }));
  await expect(page.getByRole('button', { name: 'Update weather now', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Reading & sound', exact: true }).click();
  await page
    .getByRole('checkbox', {
      name: 'Automatically refresh weather and crop heat data',
      exact: true,
    })
    .uncheck();
  await page.keyboard.press('Escape');
  await expect(page.getByText('Automatic updates paused', { exact: true })).toBeVisible();
  await page.waitForTimeout(100);
  const before = requests,
    thermalBefore = thermalRequests;
  await page.clock.fastForward(660000);
  await page.evaluate(() => {
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('online'));
  });
  await page.waitForTimeout(150);
  expect(requests).toBe(before);
  expect(thermalRequests).toBe(thermalBefore);
  await page.getByRole('button', { name: 'Update weather now', exact: true }).click();
  await expect.poll(() => requests).toBeGreaterThan(before);
  await expect.poll(() => thermalRequests).toBeGreaterThan(thermalBefore);
  await page.reload();
  await expect(page.getByText('Automatic updates paused', { exact: true })).toBeVisible();
});

test('the topsoil pH prediction shows its likely range without becoming a measured soil test', async ({
  page,
}) => {
  await open(page);
  await page.unroute('**/api/soil-reference?**');
  const depths: string[] = [];
  await page.route('**/api/soil-reference?**', (r) => {
    const q = new URL(r.request().url()).searchParams,
      depth = q.get('depth')!;
    depths.push(depth);
    return r.fulfill({
      json: {
        soil: {
          latitude: Number(q.get('latitude')),
          longitude: Number(q.get('longitude')),
          depth,
          median: depth === '5-15' ? 6.8 : 6.6,
          lower: 5.5,
          upper: 8.1,
          fetchedAt: now,
          provider: 'ISRIC SoilGrids 2.0',
          method: 'modeled pH(H2O)',
          nativeResolutionM: 250,
          sourceUrls: ['https://maps.isric.org/mapserv?QA-only'],
          unitsSource: 'https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_01.html',
        },
      },
    });
  });
  const soil = page.locator('.soil-reference');
  await expect(soil).toContainText('6.8 · likely between 5.5 and 8.1');
  expect([...new Set(depths)]).toEqual(['5-15']);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('ritu-season-farms-v1')!).farms[0].field.soilEvidence,
    ),
  ).toBeUndefined();
});

test('forecast import and carried water remain explicit planning scenarios', async ({ page }) => {
  await open(page);
  const panel = await fillWater(page);
  await panel.getByLabel('Water-balance purpose', { exact: true }).selectOption('reported');
  await expect(
    panel.getByRole('button', { name: 'Use forecast reference ET₀', exact: true }),
  ).toBeVisible();
  await panel.getByRole('button', { name: 'Use forecast reference ET₀', exact: true }).click();
  await expect(panel.getByLabel('Water-balance purpose', { exact: true })).toHaveValue('scenario');
  await expect(panel.getByRole('checkbox')).not.toBeChecked();
  await expect(panel.getByLabel('Reference ET₀ source', { exact: true })).toHaveValue(/https:\/\//);
  await expect(panel.getByLabel('Rainfall (mm)', { exact: true })).toHaveValue('0');
  await panel.getByRole('checkbox').check();
  await panel.getByRole('button', { name: 'Calculate & save water balance', exact: true }).click();
  await expect(
    panel.getByRole('region', { name: 'Water balance result', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: /^2026-05-06(?: ·|$)/ }).click();
  await page.locator('.water-budget-panel > summary').click();
  await page
    .getByRole('button', { name: 'Carry previous day’s calculated soil state', exact: true })
    .click();
  await expect(panel.getByLabel('Water-balance purpose', { exact: true })).toHaveValue('scenario');
  await expect(
    panel.getByLabel('Soil/root-zone and water-input evidence', { exact: true }),
  ).toHaveValue(/calculated soil state, not a new measurement/);
  await expect(panel.getByLabel('Crop-stage coefficient Kc', { exact: true })).toHaveValue('');
  await expect(panel.getByLabel('Rainfall (mm)', { exact: true })).toHaveValue('');
});

test('a Bangladesh variety reference cannot be applied to a known non-Bangladesh location', async ({
  page,
}) => {
  const farm = trackingFarm();
  farm.selection = { ...farm.selection, crop: 'mung' };
  farm.site = { ...farm.site, countryCode: 'US' };
  await open(page, farm);
  const panel = page.locator('.cultivar-reference');
  await panel.locator('> summary').click();
  await panel.getByLabel('Actual mungbean variety', { exact: true }).selectOption('bari-mung-6');
  await expect(panel).toContainText('This variety reference covers Bangladesh fields.');
  await expect(
    panel.getByRole('button', { name: 'Use this variety reference', exact: true }),
  ).toBeDisabled();
  await expect(panel.getByRole('checkbox')).toHaveCount(0);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('ritu-season-farms-v1')!).farms[0].cultivarReference,
    ),
  ).toBeUndefined();
});
test('new water, soil and cultivar controls remain usable in Bangla with accessible labels', async ({
  page,
}, info) => {
  const farm = trackingFarm();
  farm.selection = { ...farm.selection, crop: 'mung' };
  await open(page, farm);
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await page.locator('.water-budget-panel > summary').click();
  await page.locator('.soil-evidence-form > summary').click();
  await page.locator('.cultivar-reference > summary').click();
  await expect(page.getByLabel('ক্ষেত্রধারণ ক্ষমতা · আয়তন %', { exact: true })).toBeVisible();
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations).toEqual([]);
  await page
    .locator('.water-budget-panel')
    .screenshot({ path: info.outputPath('bangla-water-controls.png') });
});
