import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import contexts from '../fixtures/world-growing-contexts.json' with { type: 'json' };
import { stepsForPageTour } from '../../src/data/tours';
import { trackingFarm } from '../fixtures/tracking-farm';
import { searchPlantCatalogue } from '../../src/domain/plant-search';
import { emptyEvidenceState, blankFarm } from '../../src/lib/evidence-store';
import { fieldConfirmationKey } from '../../src/domain/field-confirmation';
import type { Farm } from '../../src/domain/types';
const row = contexts[0];

test.beforeEach(async ({ page }) => {
  await page.route('https://tile.openstreetmap.org/**', (r) => r.abort());
  await page.route('**/api/weather?**', (r) =>
    r.fulfill({ status: 502, json: { error: 'QA weather outage' } }),
  );
  await page.route('**/api/plant-photo?**', (r) => r.fulfill({ json: { photos: {} } }));
  await page.route('**/api/season-context?**', (r) =>
    r.fulfill({ json: { context: row.context } }),
  );
  await page.route('**/api/plants?**', (r) => {
    const q = new URL(r.request().url()).searchParams;
    return r.fulfill({
      json: searchPlantCatalogue(
        row.context,
        {
          ...blankFarm,
          area: 1,
          soil: q.get('soil'),
          drainage: q.get('drainage'),
          irrigation: q.get('irrigation'),
        } as Farm,
        q.get('from')!,
        {
          page: Number(q.get('page')),
          text: q.get('q')!,
          category: q.get('category')!,
          cycle: q.get('cycle')!,
          mode: q.get('mode')!,
        },
      ),
    });
  });
});
test.afterEach(async ({ page }) => {
  expect((await page.pageErrors()).map((e) => e.message)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
const nav = (page: Page) => page.locator('nav[aria-label="Main navigation"]:visible');
async function tour(page: Page, path: string, language: 'en' | 'bn' = 'en') {
  const before = await page
    .evaluate(() => localStorage.getItem('ritu-season-farms-v1'))
    .catch(() => null);
  const steps = stepsForPageTour(path);
  for (let i = 0; i < steps.length; i++) {
    const card = page.locator('.tour-card');
    await expect(card).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('#tour-title')).toHaveAccessibleName(steps[i].title[language]);
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    const b = (await card.boundingBox())!,
      v = page.viewportSize()!;
    expect(
      b.x >= 0 && b.y >= 0 && b.x + b.width <= v.width + 1 && b.y + b.height <= v.height + 1,
    ).toBe(true);
    await card
      .getByRole('button', {
        name:
          i === steps.length - 1
            ? language === 'en'
              ? 'Finish tour'
              : 'পরিচিতি শেষ করুন'
            : steps[i].id === 'welcome'
              ? language === 'en'
                ? 'Start the tour'
                : 'পরিচিতি শুরু করুন'
              : language === 'en'
                ? 'Next'
                : 'পরের ধাপ',
        exact: true,
      })
      .click();
  }
  await expect(page.locator('.tour-dialog')).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  expect(
    await page.evaluate(() => localStorage.getItem('ritu-season-farms-v1')).catch(() => null),
  ).toBe(before);
}
async function land(page: Page) {
  await page.getByText('Enter exact coordinates instead', { exact: true }).click();
  await page.getByLabel('Latitude', { exact: true }).fill(String(row.context.site.latitude));
  await page.getByLabel('Longitude', { exact: true }).fill(String(row.context.site.longitude));
  await page.getByRole('button', { name: 'Use these coordinates', exact: true }).click();
  await page.getByLabel('Farm name · optional', { exact: true }).fill('Onboarding QA field');
  await page.locator('#farm-area').fill('1');
  await page.getByRole('button', { name: 'Show suggested crops', exact: true }).click();
  await expect(page).toHaveURL(/\/crops$/);
}

test('landing opens the dashboard first; its tour finishes without leaving it', async ({
  page,
}, info) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Open my dashboard', exact: true })).toHaveAttribute(
    'href',
    '/farms',
  );
  await page.getByRole('link', { name: 'Open my dashboard', exact: true }).click();
  await tour(page, '/farms');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(2);
  const items = nav(page).locator('a,button');
  await expect(items).toHaveCount(4);
  await expect(items.nth(0)).toContainText('Dashboard');
  await expect(items.nth(1)).toContainText('Land details');
  await expect(items.nth(2)).toContainText('Suggested crops');
  await expect(items.nth(2)).toBeDisabled();
  await expect(items.nth(3)).toContainText('Farm calendar');
  await expect(items.nth(3)).toBeDisabled();
  await expect(page).toHaveTitle('Step 1 of 4 · Dashboard — RITU');
  await page.screenshot({ path: info.outputPath('dashboard-first.png') });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'My farms', exact: true })).toBeVisible();
  await expect(page.locator('.tour-dialog')).toHaveCount(0);
});

test('first visit explains each page independently, leaving time to enter land and choose a crop', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.goto('/farms');
  await tour(page, '/farms');
  await page.getByRole('link', { name: 'Set up my first field', exact: true }).click();
  await tour(page, '/farm');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeLessThanOrEqual(2);
  await expect(page).toHaveTitle('Step 2 of 4 · Land details — RITU');
  await expect(page.locator('#farm-area')).toHaveValue('');
  await expect(nav(page).getByRole('button', { name: /Farm calendar/ })).toBeDisabled();
  await land(page);
  await tour(page, '/crops');
  await expect(page).toHaveTitle('Step 3 of 4 · Suggested crops — RITU');
  await expect(page.getByRole('button', { name: 'Create my farm', exact: true })).toBeDisabled();
  await page.locator('.season-crop-card').getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Create my farm', exact: true }).click();
  await tour(page, '/plan');
  await expect(page).toHaveTitle('Step 4 of 4 · Farm calendar — RITU');
  await expect(
    page.getByRole('heading', { name: 'Onboarding QA field', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('ritu-page-tours-v1')!)),
  ).toEqual(['/farms', '/farm', '/crops', '/plan']);
  await page.screenshot({ path: info.outputPath('calendar-after-choice.png') });
  await nav(page)
    .getByRole('link', { name: /Dashboard/ })
    .click();
  await expect(page.locator('.season-farm-tile')).toHaveCount(1);
  await page.getByRole('button', { name: 'Open farm', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Onboarding QA field', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.tour-dialog')).toHaveCount(0);
});

test('direct crop/calendar URLs and reloads cannot bypass current land confirmation', async ({
  page,
}) => {
  await page.goto('/crops');
  await expect(page).toHaveURL(/\/farm$/);
  await tour(page, '/farm');
  await page.goto('/plan');
  await expect(page).toHaveURL(/\/farm$/);
  await expect(nav(page).getByRole('button', { name: /Suggested crops/ })).toBeDisabled();
  await land(page);
  await tour(page, '/crops');
  await page.goto('/plan');
  await expect(page).toHaveURL(/\/crops$/);
  await expect(nav(page).getByRole('button', { name: /Farm calendar/ })).toBeDisabled();
  await page.getByRole('link', { name: 'Edit land details', exact: true }).click();
  await page.getByLabel('Soil texture', { exact: true }).selectOption('clay');
  await page.goto('/crops');
  await expect(page).toHaveURL(/\/farm$/);
  await page.reload();
  await expect(nav(page).getByRole('button', { name: /Suggested crops/ })).toBeDisabled();
});

test('saved farms open from the dashboard; a new field does not reuse the old farm selection', async ({
  page,
}) => {
  const farm = trackingFarm({ notes: 'Keep this original record' });
  await page.addInitScript((farm) => {
    if (!localStorage.getItem('nav-seeded')) {
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
      localStorage.setItem('nav-seeded', '1');
    }
  }, farm);
  await page.goto('/farms');
  await tour(page, '/farms');
  await page.getByRole('button', { name: 'Open farm', exact: true }).click();
  await tour(page, '/plan');
  await expect(page.getByLabel('Field notes', { exact: true })).toHaveValue(
    'Keep this original record',
  );
  await nav(page)
    .getByRole('link', { name: /Dashboard/ })
    .click();
  await page.getByRole('button', { name: 'Add a farm', exact: true }).click();
  await tour(page, '/farm');
  await expect(nav(page).getByRole('button', { name: /Farm calendar/ })).toBeDisabled();
  const state = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ritu-season-farms-v1')!),
  );
  expect(state.activeId).toBeNull();
  expect(state.farms).toHaveLength(1);
  expect(state.farms[0].notes).toBe('Keep this original record');
  await page.goto('/track');
  await expect(page).toHaveURL(/\/farm$/);
  await page.goto('/farms');
  await page.getByRole('button', { name: 'Open farm', exact: true }).click();
  await expect(page.getByLabel('Field notes', { exact: true })).toHaveValue(
    'Keep this original record',
  );
});

test('page acknowledgements use a session fallback when browser storage is blocked', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw Error('QA blocked storage');
    };
    Storage.prototype.setItem = () => {
      throw Error('QA blocked storage');
    };
  });
  await page.goto('/farms');
  await tour(page, '/farms');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'My farms', exact: true })).toBeVisible();
  await expect(page.locator('.tour-dialog')).toHaveCount(0);
  await page.getByRole('link', { name: 'Set up my first field', exact: true }).click();
  await tour(page, '/farm');
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Tell us about your land', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.tour-dialog')).toHaveCount(0);
  expect(await page.evaluate(() => document.cookie)).toContain('ritu-page-tours=3');
});

test('the legacy global flag does not suppress any new page guide', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
  await page.goto('/farm');
  await expect(
    page.getByRole('heading', { name: 'Tell us about your land', exact: true }),
  ).toBeVisible();
  await tour(page, '/farm');
  await page.goto('/farms');
  await tour(page, '/farms');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('ritu-page-tours-v1')!)),
  ).toEqual(['/farm', '/farms']);
});

test('the Bangla page guide can be replayed at narrow widths without changing farm records', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.addInitScript((farm) => {
    localStorage.setItem(
      'ritu-page-tours-v1',
      JSON.stringify(['/farms', '/farm', '/crops', '/plan']),
    );
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
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await page.getByRole('button', { name: 'পরিচিতি দেখুন', exact: true }).click();
  await tour(page, '/plan', 'bn');
  await expect(page.getByRole('button', { name: 'পরিচিতি দেখুন', exact: true })).toBeFocused();
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations).toEqual([]);
  await page.screenshot({ path: info.outputPath('bangla-page-guide-finished.png') });
});

test('a crop page tour waits for the actual suggestion controls after an upstream failure', async ({
  page,
}) => {
  const farm = { ...blankFarm, area: 1 },
    site = row.context.site,
    from = '2026-11-04';
  await page.addInitScript(
    ({ farm, site, from, key, state }) => {
      localStorage.setItem('ritu-evidence-v2', JSON.stringify({ ...state, farm, site, from }));
      localStorage.setItem(
        'ritu-season-farms-v1',
        JSON.stringify({ version: 1, farms: [], activeId: null, confirmedKey: key }),
      );
    },
    { farm, site, from, key: fieldConfirmationKey(farm, site, from), state: emptyEvidenceState },
  );
  let outage = true;
  await page.route('**/api/season-context?**', (r) =>
    outage
      ? r.fulfill({ status: 502, json: { error: 'QA provider failure' } })
      : r.fulfill({ json: { context: row.context } }),
  );
  await page.goto('/crops');
  await expect(
    page.getByRole('heading', { name: 'Growing conditions are unavailable', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.tour-dialog')).toHaveCount(0);
  outage = false;
  await page.getByRole('button', { name: 'Retry crop matching', exact: true }).click();
  await tour(page, '/crops');
  await expect(page.getByRole('button', { name: 'Create my farm', exact: true })).toBeDisabled();
});
