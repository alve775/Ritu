import { test, expect, type Page } from '@playwright/test';
import { trackingFarm } from '../fixtures/tracking-farm';
import contexts from '../fixtures/world-growing-contexts.json' with { type: 'json' };
import photos from '../fixtures/wikimedia-plant-photos.json' with { type: 'json' };
import { blankFarm, emptyEvidenceState } from '../../src/lib/evidence-store';
import { fieldConfirmationKey } from '../../src/domain/field-confirmation';
import { globalCrop } from '../../src/domain/global-season';
import { readFile } from 'node:fs/promises';

const guides = ['/farms', '/farm', '/crops', '/plan'];
test('large Bangla bottom navigation reserves its full height above footer controls', async ({
  page,
}) => {
  await prepare(page, []);
  await page.setViewportSize({ width: 320, height: 740 });
  await page.addInitScript((state) => {
    localStorage.setItem('ritu-evidence-v2', JSON.stringify({ ...state, language: 'bn' }));
    localStorage.setItem(
      'ritu-display-v1',
      JSON.stringify({ text: 'larger', motion: false, sound: false }),
    );
  }, emptyEvidenceState);
  await page.goto('/farms');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('.tab-bar')).toBeVisible();
  await expect
    .poll(() =>
      page.evaluate(() => {
        const height = document.querySelector('.tab-bar')!.getBoundingClientRect().height;
        const reserved = parseFloat(
          getComputedStyle(document.documentElement).getPropertyValue('--tabbar-h'),
        );
        return reserved >= height - 1;
      }),
    )
    .toBe(true);
  await page.evaluate(() =>
    scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }),
  );
  expect(
    await page.evaluate(
      () =>
        document.querySelector('.footer-inner')!.getBoundingClientRect().bottom <=
        document.querySelector('.tab-bar')!.getBoundingClientRect().top + 1,
    ),
  ).toBe(true);
});
test.afterEach(async ({ page }, info) => {
  expect((await page.pageErrors()).map((error) => error.message)).toEqual([]);
  if (info.status === 'passed' && info.title.includes('soil sampling')) {
    await page
      .locator('.soil-evidence-form')
      .screenshot({ path: info.outputPath('local-soil-date.png') });
  }
});
async function prepare(page: Page, farms = [trackingFarm()]) {
  await page.context().route('https://tile.openstreetmap.org/**', (r) => r.abort());
  await page
    .context()
    .route('**/api/weather?**', (r) =>
      r.fulfill({ status: 502, json: { error: 'QA unavailable forecast' } }),
    );
  await page
    .context()
    .route('**/api/soil-reference?**', (r) =>
      r.fulfill({ status: 502, json: { error: 'QA unavailable soil prediction' } }),
    );
  await page.context().addInitScript(
    ({ farms, guides }) => {
      localStorage.setItem('ritu-page-tours-v1', JSON.stringify(guides));
      if (!localStorage.getItem('full-sweep-seeded')) {
        localStorage.setItem(
          'ritu-season-farms-v1',
          JSON.stringify({
            version: 1,
            farms,
            activeId: farms[0]?.id ?? null,
            calendarAccessId: farms[0]?.id ?? null,
            confirmedKey: null,
          }),
        );
        localStorage.setItem('full-sweep-seeded', '1');
      }
    },
    { farms, guides },
  );
}

test('reset in another tab clears the land draft without resurrecting it', async ({ page }) => {
  await prepare(page, []);
  await page.goto('/farm');
  const name = page.getByLabel('Farm name · optional', { exact: true });
  await name.fill('Draft that must be cleared');
  await page.locator('#farm-area').fill('2');
  const writer = await page.context().newPage();
  await writer.goto('/farm');
  await expect(writer.getByLabel('Farm name · optional', { exact: true })).toHaveValue(
    'Draft that must be cleared',
  );
  await writer.getByRole('button', { name: 'Reset all data', exact: true }).first().click();
  await writer
    .getByRole('dialog')
    .getByRole('button', { name: 'Reset all data', exact: true })
    .click();
  await expect(name).toHaveValue('');
  await expect(page.locator('#farm-area')).toHaveValue('');
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('ritu-evidence-v2')!).farm.name),
  ).toBe('');
  await writer.close();
});

test('removing farm storage in another tab cannot resurrect deleted farms', async ({ page }) => {
  await prepare(page);
  await page.goto('/plan');
  await expect(page.getByLabel('Field notes', { exact: true })).toBeVisible();
  const writer = await page.context().newPage();
  await writer.goto('/farms');
  await writer.evaluate(() => localStorage.removeItem('ritu-season-farms-v1'));
  await expect(page).toHaveURL(/\/farm$/);
  await page.reload();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('ritu-season-farms-v1') ?? '{"farms":[]}').farms,
    ),
  ).toEqual([]);
  await writer.close();
});

test('export includes the in-tab land draft when browser storage writes fail', async ({ page }) => {
  await prepare(page, []);
  await page.addInitScript(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'ritu-evidence-v2')
        throw new DOMException('QA full storage', 'QuotaExceededError');
      return set.call(this, key, value);
    };
  });
  await page.goto('/farm');
  await page
    .getByLabel('Farm name · optional', { exact: true })
    .fill('Unsaved field must be exportable');
  await page.locator('#farm-area').fill('2');
  // A client navigation keeps the unsaved in-memory draft; do not reload it away.
  await page.getByRole('link', { name: /^My farms/ }).click();
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export all farm records', exact: true }).click(),
  ]);
  const records = JSON.parse(await readFile((await download.path())!, 'utf8')).records;
  expect(records['ritu-evidence-v2']?.farm.name).toBe('Unsaved field must be exportable');
  expect(records['ritu-evidence-v2']?.farm.area).toBe(2);
});

test('a malformed journal entry does not hide an unrelated valid saved farm', async ({ page }) => {
  const valid = trackingFarm({ id: 'valid-sweep-farm' });
  const broken = trackingFarm({ id: 'damaged-sweep-farm' });
  // Deliberately corrupt stored data, never an API or production fixture.
  const farms = [valid, { ...broken, checkIns: [null] }] as unknown as (typeof valid)[];
  await prepare(page, farms);
  await page.goto('/farms');
  await expect(page.locator('.season-farm-tile')).toHaveCount(1);
  await page.getByRole('button', { name: 'Open farm', exact: true }).click();
  await expect(page.getByLabel('Field notes', { exact: true })).toBeVisible();
  const recovery = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('ritu-season-farms-v1-recovery')!),
  );
  expect(recovery.farms).toHaveLength(2);
  expect(recovery.farms[1].checkIns).toEqual([null]);
});

test('moving a map pin does not retain the previous place country or timezone', async ({
  page,
}) => {
  await prepare(page, []);
  const site = { ...contexts[1].context.site, countryCode: 'US' };
  await page.route('**/api/places?**', (r) =>
    r.fulfill({ json: { places: [{ ...site, id: 1 }] } }),
  );
  await page.goto('/farm');
  await page.getByLabel('Find your location', { exact: true }).fill('Washington');
  await page.getByRole('option', { name: 'Washington', exact: true }).click();
  const map = page.locator('.farm-map');
  await expect(map.locator('.leaflet-marker-icon')).toBeVisible();
  const bounds = (await map.boundingBox())!;
  await map.click({ position: { x: bounds.width * 0.72, y: bounds.height * 0.63 } });
  const point = await page.evaluate(
    () => JSON.parse(localStorage.getItem('ritu-evidence-v2')!).site,
  );
  expect(point.latitude).not.toBe(site.latitude);
  expect(point.countryCode).toBeUndefined();
  expect(point.timezone).toBeUndefined();
  expect(point.name).not.toBe(site.name);
});

test('plant-use categories are translated when the farmer chooses Bangla', async ({ page }) => {
  const context = contexts[0].context,
    field = { ...blankFarm, area: 1 },
    from = '2026-11-05';
  await prepare(page, []);
  await page.context().addInitScript(
    ({ context, field, from, state, key }) => {
      localStorage.setItem(
        'ritu-evidence-v2',
        JSON.stringify({ ...state, language: 'bn', farm: field, site: context.site, from }),
      );
      localStorage.setItem(
        'ritu-season-farms-v1',
        JSON.stringify({ version: 1, farms: [], activeId: null, confirmedKey: key }),
      );
    },
    {
      context,
      field,
      from,
      state: emptyEvidenceState,
      key: fieldConfirmationKey(field, context.site, from),
    },
  );
  await page.route('**/api/season-context?**', (r) => r.fulfill({ json: { context } }));
  await page.route('**/api/plants?**', (r) =>
    r.fulfill({ json: { total: 1, matches: 0, count: 0, page: 1, pages: 1, items: [] } }),
  );
  await page.goto('/crops');
  await expect(
    page
      .getByRole('combobox', { name: 'গাছের ব্যবহার', exact: true })
      .locator('option[value="fruits & nuts"]'),
  ).toHaveText('ফল ও বাদাম');
});

test('a late GPS result cannot replace a field chosen after requesting location', async ({
  page,
}) => {
  await prepare(page, []);
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition(success: PositionCallback) {
          (window as typeof window & { sweepGps?: PositionCallback }).sweepGps = success;
        },
      },
    });
  });
  await page.goto('/farm');
  await page.getByRole('button', { name: 'Use my location', exact: true }).click();
  await page.getByText('Enter exact coordinates instead', { exact: true }).click();
  await page.getByLabel('Latitude', { exact: true }).fill('38.9072');
  await page.getByLabel('Longitude', { exact: true }).fill('-77.0369');
  await page.getByRole('button', { name: 'Use these coordinates', exact: true }).click();
  await page.evaluate(() => {
    (window as typeof window & { sweepGps?: PositionCallback }).sweepGps?.({
      coords: { latitude: 23.86186, longitude: 90.00273, accuracy: 10 },
    } as GeolocationPosition);
  });
  const point = await page.evaluate(
    () => JSON.parse(localStorage.getItem('ritu-evidence-v2')!).site,
  );
  expect(point.latitude).toBe(38.9072);
  expect(point.longitude).toBe(-77.0369);
});

for (const [index, instant, expected] of [
  [0, '2026-11-04T19:30:00Z', '2026-11-05'],
  [1, '2026-11-05T00:30:00Z', '2026-11-04'],
] as const) {
  test(`soil sampling uses the farm's local day in ${contexts[index].name}`, async ({ page }) => {
    await page.clock.install({ time: new Date(instant) });
    const context = contexts[index].context;
    await prepare(page, [trackingFarm({ site: context.site, context })]);
    await page.goto('/plan');
    await page.locator('.soil-evidence-form > summary').click();
    await expect(page.getByLabel('Soil sampling date', { exact: true })).toHaveAttribute(
      'max',
      expected,
    );
    await expect(page.getByLabel('Actual planting date', { exact: true })).toHaveAttribute(
      'max',
      expected,
    );
  });
}

test('retrying a failed photo fetches fresh image metadata instead of the cached broken URL', async ({
  page,
}) => {
  const context = contexts[0].context,
    field = { ...blankFarm, area: 1 },
    from = '2026-11-05';
  await prepare(page, []);
  await page.context().addInitScript(
    ({ context, field, from, state, key }) => {
      localStorage.setItem(
        'ritu-evidence-v2',
        JSON.stringify({ ...state, farm: field, site: context.site, from }),
      );
      localStorage.setItem(
        'ritu-season-farms-v1',
        JSON.stringify({ version: 1, farms: [], activeId: null, confirmedKey: key }),
      );
    },
    {
      context,
      field,
      from,
      state: emptyEvidenceState,
      key: fieldConfirmationKey(field, context.site, from),
    },
  );
  await page.route('**/api/season-context?**', (r) => r.fulfill({ json: { context } }));
  await page.route('**/api/plants?**', (r) =>
    r.fulfill({
      json: {
        total: 1,
        matches: 0,
        count: 1,
        page: 1,
        pages: 1,
        items: [
          { plant: globalCrop('tomato'), suggestion: null, unavailable: 'QA photo retry case' },
        ],
      },
    }),
  );
  let calls = 0;
  await page.route('**/api/plant-photo?**', (r) => {
    calls++;
    return r.fulfill({
      json: {
        photos: {
          tomato: {
            ...photos.photos.tomato,
            src: `https://upload.wikimedia.org/full-sweep-${calls === 1 ? 'broken' : 'fresh'}.png`,
          },
        },
      },
    });
  });
  await page.route('https://upload.wikimedia.org/full-sweep-*.png', (r) =>
    r.request().url().includes('broken')
      ? r.fulfill({ status: 404, body: 'QA expired thumbnail' })
      : r.fulfill({
          contentType: 'image/png',
          body: Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8xkAAAAASUVORK5CYII=',
            'base64',
          ),
        }),
  );
  await page.goto('/crops');
  const photo = page.locator('.plant-reference').first();
  await photo.scrollIntoViewIfNeeded();
  await photo.getByRole('button', { name: 'Retry photo', exact: true }).click();
  await expect.poll(() => calls).toBe(2);
  await expect(photo.locator('img')).toHaveAttribute('src', /full-sweep-fresh/);
  await expect
    .poll(() =>
      photo
        .locator('img')
        .evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0),
    )
    .toBe(true);
});
