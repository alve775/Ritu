import { expect, test as base, type Page } from '@playwright/test';
import contexts from '../fixtures/world-audit-contexts.json' with { type: 'json' };
import { defaultSite } from '../../src/domain/farm-site';
import { trackingFarm } from '../fixtures/tracking-farm';

const pages = ['/farms', '/farm', '/plot', '/crops', '/plan', '/notes', '/sources'];
const recordKeys = ['ritu-season-farms-v1', 'ritu-evidence-v2', 'ritu-field-log-v1'];
const rajshahi = {
  ...contexts[0].context,
  site: defaultSite,
  normal: {
    ...contexts[0].context.normal,
    latitude: 24.37,
    longitude: 88.6,
    sourceUrl: contexts[0].context.normal.sourceUrl.replace(
      'latitude=23.86&longitude=90.00',
      'latitude=24.37&longitude=88.60',
    ),
  },
  calendars: [],
};
const washington = contexts[1].context;

const test = base.extend({
  page: async ({ page, context }, runPage) => {
    const backup = await context.storageState();
    // Every test uses a fresh profile. Restore its empty snapshot after the walkthrough.
    expect(backup).toEqual({ cookies: [], origins: [] });
    await page.route('https://**/*', (route) => route.abort());
    await page.route('http://127.0.0.1:3000/api/**', (route) => {
      const url = new URL(route.request().url());
      switch (url.pathname) {
        case '/api/nasa-local':
          return route.continue();
        case '/api/season-context':
          return route.fulfill({
            json: {
              context:
                Number(url.searchParams.get('latitude')) === washington.site.latitude
                  ? washington
                  : rajshahi,
            },
          });
        case '/api/places':
          return route.fulfill({ json: { places: [{ ...washington.site, id: 1 }] } });
        case '/api/plants':
          return route.fulfill({
            json: { total: 0, matches: 0, count: 0, page: 1, pages: 1, items: [] },
          });
        default:
          return route.fulfill({ status: 502, json: { error: 'Tour test fixture' } });
      }
    });
    await runPage(page);
    await page.goto('/icons/ritu-48.png');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await context.clearCookies();
    expect(await context.storageState()).toEqual(backup);
  },
});

test.beforeEach(async ({ page }, testInfo) => {
  if (testInfo.project.name === 'mobile') await page.setViewportSize({ width: 320, height: 760 });
});

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });
const tour = (page: Page) => page.locator('.tour-dialog');
const ready = (page: Page) =>
  expect(tour(page).locator('.tour-card')).toHaveAttribute('aria-busy', 'false');
const records = (page: Page) =>
  page.evaluate((keys) => keys.map((key) => localStorage.getItem(key)), recordKeys);
const skipFirstVisits = (page: Page, paths = pages) =>
  page.addInitScript(
    (paths) => localStorage.setItem('ritu-page-tours-v1', JSON.stringify(paths)),
    paths,
  );

async function walkTour(page: Page, titles: string[], start: 'manual' | 'first-visit' = 'manual') {
  const url = page.url();
  if (start === 'manual') await button(page, 'Take a tour').click();
  const dialog = tour(page);
  await expect(dialog.getByRole('progressbar')).toHaveAttribute(
    'aria-valuemax',
    String(titles.length),
  );
  for (const [i, title] of titles.entries()) {
    await expect(dialog.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await ready(page);
    if (title === 'Meet Mati, your farm guide') {
      await expect(dialog.locator('.tour-spotlight')).toHaveCount(0);
    } else {
      const box = await dialog.locator('.tour-spotlight').boundingBox();
      expect(box?.width).toBeGreaterThan(0);
      expect(box?.height).toBeGreaterThan(0);
    }
    await expect(page).toHaveURL(url);
    await dialog
      .getByRole('button', {
        name:
          i === titles.length - 1
            ? 'Finish tour'
            : title.startsWith('Meet Mati')
              ? 'Start the tour'
              : 'Next',
        exact: true,
      })
      .click();
  }
  await expect(dialog).toHaveCount(0);
}

async function addLand(page: Page, outside = false) {
  await button(page, 'Add land').click();
  if (outside) {
    await page.getByRole('combobox', { name: 'Find your location' }).fill('Washington');
    await page.getByRole('option', { name: /Washington/ }).click();
  }
  await page.getByRole('textbox', { name: 'Land name' }).fill('Tour test land');
  await page.getByRole('spinbutton', { name: 'Land area (hectares)' }).fill('2');
  await button(page, 'Save land').click();
  await expect(page).toHaveURL(/\/plot\?/);
}

async function openPlans(page: Page) {
  await page.getByRole('textbox', { name: 'Plot name' }).fill('Tour test plot');
  await page.getByRole('spinbutton', { name: 'Plot size' }).fill('1');
  await button(page, 'Show suggested plans').click();
  const dialog = page.getByRole('dialog');
  for (const season of ['pre-monsoon', 'monsoon', 'winter']) {
    await dialog
      .locator(`label:has(input[name="plot-last-year-${season}"][value="unknown"])`)
      .click();
  }
  await dialog.getByRole('button', { name: 'Show suggested plans', exact: true }).click();
  await expect(page).toHaveURL(/\/crops$/);
}

test('dashboard welcome stays on the page and can be replayed in either language', async ({
  page,
}) => {
  await page.goto('/farms');
  const dialog = tour(page);
  await expect(dialog.getByRole('heading', { name: 'Meet Mati, your farm guide' })).toBeVisible();
  const before = await records(page);
  await ready(page);
  await dialog.getByRole('button', { name: 'Start the tour' }).click();
  await expect(dialog.getByRole('heading', { name: 'Add or manage land' })).toBeVisible();
  await ready(page);
  await dialog.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await ready(page);
  await expect(dialog.getByRole('heading', { name: 'জমি যোগ করুন বা তথ্য বদলান' })).toBeVisible();
  const box = await dialog.locator('.tour-card').boundingBox();
  const viewport = page.viewportSize()!;
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height + 1);
  await page.keyboard.press('Shift+Tab');
  for (let i = 0; i < 8; i++) {
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
    await page.keyboard.press('Tab');
  }
  await dialog.getByRole('button', { name: 'EN', exact: true }).click();
  await ready(page);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(button(page, 'Take a tour')).toBeFocused();
  expect(await records(page)).toEqual(before);
  expect(await page.evaluate(() => localStorage.getItem('ritu-page-tours-v1'))).toBe('["/farms"]');
  await page.reload();
  await walkTour(page, [
    'Meet Mati, your farm guide',
    'Add or manage land',
    'Keep a copy of your records',
  ]);
});

test('a target removed during the guide is skipped', async ({ page }) => {
  await skipFirstVisits(page);
  await page.goto('/farms');
  await button(page, 'Take a tour').click();
  const dialog = tour(page);
  await ready(page);
  await dialog.getByRole('button', { name: 'Start the tour' }).click();
  await expect(dialog.getByRole('heading', { name: 'Add or manage land' })).toBeVisible();
  await page
    .locator('[data-tour="farm-export"]')
    .evaluate((element) => element.removeAttribute('data-tour'));
  await dialog.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(dialog).toHaveCount(0);
});

test('page guides match the Rajshahi plot workflow and the plan views', async ({ page }) => {
  test.setTimeout(90000);
  await page.clock.setFixedTime(new Date('2026-11-10T06:00:00Z'));
  await skipFirstVisits(
    page,
    pages.filter((path) => path !== '/plot'),
  );
  await page.goto('/farm');
  await walkTour(page, [
    'Pin your land',
    'Name your land',
    'Check soil and drainage',
    'Choose water and save',
  ]);
  await page.goto('/farms');
  await addLand(page);
  await walkTour(
    page,
    ['Set up this plot', 'Set this plot’s water and drainage', 'Enter last year’s crops'],
    'first-visit',
  );
  await openPlans(page);
  await expect(page.locator('[data-tour="year-plan-nasa"]').first()).toBeVisible();
  await walkTour(page, [
    'Compare year plans',
    'Check for dry weeks',
    'Choose a plan',
    'Make your own plan',
  ]);
  await button(page, 'Choose crops myself').click();
  await walkTour(page, ['Choose crops by season']);
  await button(page, 'Back to plans').click();
  await button(page, 'Choose this plan').first().click();
  await button(page, 'Yes, choose this plan').click();
  await expect(page).toHaveURL(/\/plan$/);
  await walkTour(page, [
    'See the whole year',
    'See what to do today',
    'Open a day',
    'See what’s coming',
    'Check water and heat by week',
    'Correct dates or record a loss',
  ]);

  await button(page, 'Change plan').click();
  await button(page, 'Keep my plan').click();
  await walkTour(page, ['See your saved plan']);

  await page.goto('/farms');
  await walkTour(page, [
    'Meet Mati, your farm guide',
    'Add or manage land',
    'Find a plot’s plan',
    'Keep a copy of your records',
  ]);
  await page.goto('/notes');
  await walkTour(page, ['Open a plot’s diary', 'Set a reminder']);
  await page.goto('/sources');
  await walkTour(page, ['See where the information comes from']);
});

test('the one-season chooser has its own guide outside the pilot', async ({ page }) => {
  await skipFirstVisits(page);
  await page.goto('/farms');
  await addLand(page, true);
  await openPlans(page);
  await expect(page.getByRole('note').filter({ hasText: 'This land is outside it' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Find what you want to grow' })).toBeVisible();
  await walkTour(page, ['Choose a crop for one season']);
});

test('a saved one-season calendar shows only its own guide', async ({ page }) => {
  await skipFirstVisits(page);
  await page.addInitScript((farm) => {
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
  }, trackingFarm());
  await page.goto('/plan');
  await expect(button(page, 'Take a tour')).toBeEnabled();
  const before = await records(page);
  await walkTour(page, ['Follow this crop']);
  expect(await records(page)).toEqual(before);
});
