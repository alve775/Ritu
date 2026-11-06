import photoFixture from '../fixtures/wikimedia-plant-photos.json' with { type: 'json' };
import { searchPlantCatalogue } from '../../src/domain/plant-search';
import type { Farm } from '../../src/domain/types';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import originalContexts from '../fixtures/world-growing-contexts.json' with { type: 'json' };
import auditContexts from '../fixtures/world-audit-contexts.json' with { type: 'json' };
import { suggestSeason } from '../../src/domain/plant-screen';
import { blankFarm } from '../../src/lib/evidence-store';
const exhaustive = process.env.RITU_WORLD_AUDIT === '1';
const contexts = exhaustive ? auditContexts : originalContexts;
import { testWeather } from './browser-test';
import { localToday } from '../../src/domain/global-season';
import { stepsForPageTour } from '../../src/data/tours';

const combinations = (['loam', 'clay', 'unknown'] as const).flatMap((soil) =>
  (['good', 'unknown'] as const).flatMap((drainage) =>
    (['reliable', 'rainfed'] as const).map((water) => ({ soil, drainage, water })),
  ),
);
const landProfiles = exhaustive
  ? (['unknown', 'loam', 'clay', 'sandy'] as const).flatMap((soil) =>
      (['unknown', 'good', 'poor'] as const).flatMap((drainage) =>
        (['reliable', 'limited', 'rainfed', 'severe', 'unknown'] as const).map((water) => ({
          soil,
          drainage,
          water,
        })),
      ),
    )
  : [
      { soil: 'clay', drainage: 'unknown', water: 'rainfed' },
      ...combinations.filter(
        (p) => !(p.soil === 'clay' && p.drainage === 'unknown' && p.water === 'rainfed'),
      ),
      ...(['clay', 'unknown'] as const).flatMap((soil) =>
        (['reliable', 'rainfed'] as const).map((water) => ({ soil, drainage: 'poor', water })),
      ),
    ];
test.afterEach(async ({ page }) => {
  expect((await page.pageErrors()).map((e) => e.message)).toEqual([]);
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('ritu-tour-v1', 'seen');
      localStorage.setItem(
        'ritu-page-tours-v1',
        JSON.stringify(['/farms', '/farm', '/crops', '/plan']),
      );
    } catch {
      document.cookie = 'ritu-page-tours=15; Path=/; SameSite=Lax';
    }
  });
  await page.route('https://tile.openstreetmap.org/**', (route) => route.abort());
  // Exact recorded NASA baselines; never use provider quotas for matrix QA.
  await page.route('**/api/plant-photo?**', (route) => {
    const q = new URL(route.request().url()).searchParams;
    const ids = (q.get('plants') ?? q.get('plant') ?? '').split(',');
    const photos = Object.fromEntries(
      ids.map((id) => [id, (photoFixture.photos as Record<string, unknown>)[id] ?? null]),
    );
    return route.fulfill({ json: { photos } });
  });
  // Render behavior is deterministic here; actual CDN pixels are checked in the live image audit.
  await page.route('https://thumb.wikimedia.org/**', (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8l8AAAAASUVORK5CYII=',
        'base64',
      ),
    }),
  );
  await page.route('https://upload.wikimedia.org/**', (route) =>
    route.fulfill({
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8l8AAAAASUVORK5CYII=',
        'base64',
      ),
    }),
  );
  await page.route('**/api/plants?**', (route) => {
    const q = new URL(route.request().url()).searchParams;
    const row = contexts.find(
      (c) =>
        Math.abs(c.context.site.latitude - Number(q.get('latitude'))) < 0.00001 &&
        Math.abs(c.context.site.longitude - Number(q.get('longitude'))) < 0.00001,
    );
    if (!row)
      return route.fulfill({
        status: 502,
        json: { error: 'No recorded baseline at this test point' },
      });
    return route.fulfill({
      json: searchPlantCatalogue(
        row.context,
        {
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

  await page.route('**/api/season-context?**', async (route) => {
    const q = new URL(route.request().url()).searchParams;
    const row = contexts.find(
      (c) =>
        Math.abs(c.context.site.latitude - Number(q.get('latitude'))) < 0.00001 &&
        Math.abs(c.context.site.longitude - Number(q.get('longitude'))) < 0.00001,
    );
    return row
      ? route.fulfill({ json: { context: row.context } })
      : route.fulfill({ status: 502, json: { error: 'Deliberate unavailable-data test' } });
  });
  // Browser scenarios replay recorded climate. Weather failure is explicit in
  // most matrix cases; the separate live run verifies actual online forecasts.
  await page.route('**/api/weather?**', (route) =>
    route.fulfill({ status: 502, json: { error: 'Deliberate forecast outage in QA' } }),
  );
});
async function enterLand(page: Page, row: (typeof contexts)[number], index = 0) {
  const profile = landProfiles[index];
  await page.goto('/farm');
  await page.getByText('Enter exact coordinates instead', { exact: true }).click();
  await page
    .getByRole('spinbutton', { name: 'Latitude', exact: true })
    .fill(String(row.context.site.latitude));
  await page
    .getByRole('spinbutton', { name: 'Longitude', exact: true })
    .fill(String(row.context.site.longitude));
  await page.getByRole('button', { name: 'Use these coordinates', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Farm name · optional', exact: true })
    .fill(`${row.name} field ${index}`);
  if (index % 2)
    await page.getByRole('combobox', { name: 'Area unit', exact: true }).selectOption('acres');
  await page.locator('#farm-area').fill(index % 2 ? '2' : '30');
  await page
    .getByRole('combobox', { name: 'Soil texture', exact: true })
    .selectOption(profile.soil);
  await page
    .getByRole('combobox', { name: 'Does water drain away?', exact: true })
    .selectOption(profile.drainage);
  await page
    .getByRole('radio', {
      name: {
        reliable: 'Reliable irrigation',
        limited: 'Limited irrigation',
        rainfed: 'Rain only',
        severe: 'Severe shortage',
        unknown: 'Not sure',
      }[profile.water],
      exact: true,
    })
    .check();
  await page.getByRole('button', { name: 'Show suggested crops', exact: true }).click();
  await expect(page).toHaveURL(/\/crops$/);
}
for (const row of contexts)
  for (let profile = 0; profile < landProfiles.length; profile++) {
    test(`${row.name} / land profile ${profile}: one crop creates its own persistent farm`, async ({
      page,
    }, info) => {
      await enterLand(page, row, profile);
      const setup = landProfiles[profile];
      const choices = suggestSeason(
        row.context,
        {
          ...blankFarm,
          area: 1,
          soil: setup.soil,
          drainage: setup.drainage,
          irrigation: setup.water,
        },
        localToday(row.context.site.timezone),
      );
      if (!choices.length) {
        await expect(
          page.getByRole('heading', { name: 'No results for these filters', exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole('button', { name: 'Create my farm', exact: true }),
        ).toBeDisabled();
        return;
      }
      await expect(page.locator('.season-crop-card').first()).toBeVisible();
      const radios = page.getByRole('radio');
      await radios.first().check();
      if ((await radios.count()) > 1) await radios.nth(1).check();
      await expect(page.getByRole('radio', { checked: true })).toHaveCount(1);
      await expect(page.getByRole('button', { name: 'Create my farm', exact: true })).toBeEnabled();
      await page.getByRole('button', { name: 'Create my farm', exact: true }).click();
      await expect(page).toHaveURL(/\/plan$/);
      await expect(
        page.getByRole('heading', { name: `${row.name} field ${profile}`, exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Farm calendar', exact: true })).toBeVisible();
      await expect(page.getByLabel('Actual planting date', { exact: true })).toHaveValue('');
      await page
        .getByLabel('Field notes', { exact: true })
        .fill(`${row.name}: separately saved QA note`);
      await page.reload();
      await expect(page.getByLabel('Field notes', { exact: true })).toHaveValue(
        `${row.name}: separately saved QA note`,
        { timeout: 15000 },
      );
      const records = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('ritu-season-farms-v1')!),
      );
      expect(records.farms).toHaveLength(1);
      expect(typeof records.farms[0].selection.crop).toBe('string');
      expect(records.farms[0].field.area).toBeCloseTo(profile % 2 ? 0.80937128448 : 30, 8);
      expect(records.farms[0].site.latitude).toBe(row.context.site.latitude);
      expect(records.farms[0].field.soil).toBe(landProfiles[profile].soil);
      expect(records.farms[0].field.drainage).toBe(landProfiles[profile].drainage);
      expect(records.farms[0].field.irrigation).toBe(landProfiles[profile].water);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
      ).toBe(true);
      if (profile === 0) {
        await page.screenshot({ path: info.outputPath(`${row.name}-farm.png`), fullPage: true });
      }
    });
  }
test('multiple farms keep separate notes; deleting one preserves the other', async ({ page }) => {
  const row = contexts[0];
  await enterLand(page, row);
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Create my farm', exact: true }).click();
  await page.getByLabel('Field notes', { exact: true }).fill('First farm note');
  const first = await page.evaluate(
    () => JSON.parse(localStorage.getItem('ritu-season-farms-v1')!).activeId,
  );
  await page.goto('/farms');
  await page.getByRole('button', { name: 'Add a farm', exact: true }).click();
  await enterLand(page, contexts[1], 1);
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Create my farm', exact: true }).click();
  await page.getByLabel('Field notes', { exact: true }).fill('Second farm note');
  const second = await page.evaluate(
    () => JSON.parse(localStorage.getItem('ritu-season-farms-v1')!).activeId,
  );
  await page.getByLabel('Switch farm', { exact: true }).selectOption(first);
  await expect(page.getByLabel('Field notes', { exact: true })).toHaveValue('First farm note');
  await page.getByLabel('Switch farm', { exact: true }).selectOption(second);
  await expect(page.getByLabel('Field notes', { exact: true })).toHaveValue('Second farm note');
  await page.goto('/farms');
  await expect(page.locator('.season-farm-tile')).toHaveCount(2);
  await page.getByRole('button', { name: 'Delete farm: Washington field 1', exact: true }).click();
  await page.getByRole('button', { name: 'Delete this farm', exact: true }).click();
  await expect(page.locator('.season-farm-tile')).toHaveCount(1);
  await page.getByRole('button', { name: 'Open farm', exact: true }).click();
  await expect(page.getByLabel('Field notes', { exact: true })).toHaveValue('First farm note');
});
test('actual planting, observed stage, daily guidance and export remain truthful', async ({
  page,
}) => {
  await page.route('**/api/weather?**', (route) =>
    route.fulfill({ json: { weather: testWeather(23.86186, 90.00273) } }),
  );
  await enterLand(page, contexts[0]);
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Create my farm', exact: true }).click();
  const today = localToday('Asia/Dhaka');
  await page.getByLabel('Actual planting date', { exact: true }).fill(today);
  await expect(page.getByText('Day 1 since planting', { exact: true })).toBeVisible();
  await expect(
    page.getByText('Walk the field and record what you see', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Observed stage', { exact: true }).selectOption('Flowering');
  await page.getByRole('button', { name: 'Save daily check-in', exact: true }).click();
  await expect(
    page.getByText('Give the flowering crop a careful water check', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('.season-daily').getByRole('checkbox')).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel('Actual planting date', { exact: true })).toHaveValue(today);
  await expect(page.locator('.season-observed-stage')).toContainText('Flowering');
  await expect(page.locator('.season-daily')).toContainText('Give the flowering crop');
  await expect(page.locator('.season-daily').getByRole('checkbox')).toHaveCount(0);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export all farm records', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('ritu-farm-records.json');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations).toEqual([]);
});
test('changed location invalidates confirmation; source outage has retry instead of stale suggestions', async ({
  page,
}) => {
  await enterLand(page, contexts[0]);
  await expect(page.locator('.season-crop-card').first()).toBeVisible();
  await page.getByRole('link', { name: 'Edit land details', exact: true }).click();
  await page.getByRole('combobox', { name: 'Field for this farm', exact: true }).selectOption('');
  await page.getByText('Enter exact coordinates instead', { exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Latitude', exact: true }).fill('0');
  await page.getByRole('button', { name: 'Use these coordinates', exact: true }).click();
  await page.goto('/crops');
  await expect(page).toHaveURL(/\/farm$/);
  await expect(
    page.getByRole('heading', { name: 'Tell us about your land', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.season-crop-card')).toHaveCount(0);
});
test('partial storage recovery keeps valid farms, exposes a recovery export, and reset clears all farms', async ({
  page,
}) => {
  await enterLand(page, contexts[0]);
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Create my farm', exact: true }).click();
  await page.getByLabel('Field notes', { exact: true }).fill('Valid field retained');
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('ritu-season-farms-v1')!);
    s.farms.push({
      ...s.farms[0],
      id: 'broken-second',
      selection: { ...s.farms[0].selection, reasons: null },
    });
    localStorage.setItem('ritu-season-farms-v1', JSON.stringify(s));
  });
  await page.goto('/farms');
  await expect(page.locator('.season-farm-tile')).toHaveCount(1);
  await expect(page.getByRole('alert').filter({ hasText: 'Some saved records' })).toContainText(
    'recovery copy',
  );
  expect(
    await page.evaluate(() => localStorage.getItem('ritu-season-farms-v1-recovery')),
  ).toContain('broken-second');
  await page.getByRole('button', { name: 'Open farm', exact: true }).click();
  await expect(page.getByLabel('Field notes', { exact: true })).toHaveValue('Valid field retained');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  await page.getByRole('button', { name: 'Reset all data', exact: true }).click();
  await page.goto('/farms');
  await expect(page.locator('.season-farm-tile')).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole('spinbutton', { name: 'How many fields do you have?', exact: true }),
  ).toBeVisible();
});
for (const language of ['en', 'bn'] as const)
  test(`${language}: every land-page tour stop stays within the viewport without changing farm data`, async ({
    page,
  }, info) => {
    test.setTimeout(90000);
    if (language === 'bn') await page.setViewportSize({ width: 320, height: 740 });
    await page.goto('/farm');
    if (language === 'bn') await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
    const before = await page.evaluate(() => localStorage.getItem('ritu-season-farms-v1'));
    await page
      .getByRole('button', {
        name: language === 'en' ? 'Take a tour' : 'পরিচিতি দেখুন',
        exact: true,
      })
      .click();
    const steps = stepsForPageTour('/farm');
    for (let i = 0; i < steps.length; i++) {
      const card = page.locator('.tour-card');
      await expect(card).toHaveAttribute('aria-busy', 'false');
      await expect(page.locator('#tour-title')).toHaveAccessibleName(steps[i].title[language]);
      const b = (await card.boundingBox())!,
        v = page.viewportSize()!;
      expect(
        b.x >= 0 && b.y >= 0 && b.x + b.width <= v.width + 1 && b.y + b.height <= v.height + 1,
      ).toBe(true);
      if (i === 2) await page.screenshot({ path: info.outputPath(`tour-${language}.png`) });
      const name =
        language === 'en'
          ? i === steps.length - 1
            ? 'Finish tour'
            : 'Next'
          : i === steps.length - 1
            ? 'পরিচিতি শেষ করুন'
            : 'পরের ধাপ';
      await page.getByRole('button', { name, exact: true }).click();
    }
    await expect(page.locator('.tour-dialog')).toHaveCount(0);
    expect(await page.evaluate(() => localStorage.getItem('ritu-season-farms-v1'))).toBe(before);
  });
test('NASA failure shows no sample suggestions and a retry recovers the real record', async ({
  page,
}) => {
  await enterLand(page, contexts[0]);
  await expect(page.locator('.season-crop-card').first()).toBeVisible();
  const failure = async (route: import('@playwright/test').Route) =>
    route.fulfill({ status: 502, json: { error: 'Deliberate NASA outage' } });
  await page.route('**/api/season-context?**', failure);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: 'Growing conditions are unavailable', exact: true }),
  ).toBeVisible();
  await expect(page.locator('.season-crop-card')).toHaveCount(0);
  await page.unroute('**/api/season-context?**', failure);
  await page.getByRole('button', { name: 'Retry crop matching', exact: true }).click();
  await expect(page.locator('.season-crop-card').first()).toBeVisible();
});
test('unavailable browser storage keeps in-tab farms exportable with a visible warning', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = function () {
      throw Error('Deliberate denied storage in QA');
    };
  });
  await enterLand(page, contexts[0]);
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Create my farm', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Manikganj field 0', exact: true })).toBeVisible();
  await expect(
    page.getByText('Not saved to browser storage. Export before closing.', { exact: true }),
  ).toBeVisible();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export all farm records', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('ritu-farm-records.json');
});

test('full plant catalogue is searchable and paginated, including incomplete source records', async ({
  page,
}) => {
  await enterLand(page, contexts[0]);
  await page
    .getByRole('combobox', { name: 'Evidence filter', exact: true })
    .selectOption('catalogue');
  await page.getByRole('combobox', { name: 'Plant use', exact: true }).selectOption('all');
  await expect(page.locator('.plant-result-status')).toContainText('2562 results');
  await expect(page.locator('.season-crop-card')).toHaveCount(12);
  await page
    .locator('.plant-pagination')
    .first()
    .getByRole('button', { name: 'Next', exact: true })
    .click();
  await expect(page.locator('.plant-pagination').first()).toContainText('Page 2 of 214');
  await page.getByRole('searchbox', { name: 'Search plants', exact: true }).fill('peanut');
  await expect(page.getByRole('radio', { name: 'Groundnut', exact: true })).toBeVisible();
  await page
    .getByRole('searchbox', { name: 'Search plants', exact: true })
    .fill('Citrullus lanatus');
  await expect(page.getByRole('radio', { name: 'Watermelon', exact: true })).toBeDisabled();
  await expect(page.locator('.season-crop-body')).toContainText('no harvest date is invented');
  await expect(page.getByRole('button', { name: 'Create my farm', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});

test('a perennial gets a saved care calendar without a first-harvest prediction', async ({
  page,
}, info) => {
  await enterLand(page, contexts[0], 1);
  await page
    .getByRole('searchbox', { name: 'Search plants', exact: true })
    .fill('Mangifera indica');
  await page.getByRole('radio', { name: 'Mango', exact: true }).check();
  await expect(page.locator('.season-crop-body')).toContainText('Perennial care calendar');
  await page.getByRole('button', { name: 'Create my farm', exact: true }).click();
  await expect(page.getByText('YOUR PERENNIAL CARE PLAN', { exact: true })).toBeVisible();
  await expect(page.locator('.season-hero-facts')).toContainText('Care review horizon');
  await page.getByLabel('Actual planting date', { exact: true }).fill(localToday('Asia/Dhaka'));
  await expect(
    page.getByText('Review perennial establishment and local fruiting guidance', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Check actual maturity before harvest', { exact: true })).toHaveCount(
    0,
  );
  await page.reload();
  await expect(page.getByText('YOUR PERENNIAL CARE PLAN', { exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath('perennial-care.png'), fullPage: true });
});

test('crop photos come through the batched API and retain source credit, identity and contained framing', async ({
  page,
}) => {
  await enterLand(page, contexts[0]);
  await page
    .getByRole('combobox', { name: 'Evidence filter', exact: true })
    .selectOption('catalogue');
  await page.getByRole('combobox', { name: 'Plant use', exact: true }).selectOption('all');
  for (const name of ['Lycopersicon esculentum', 'Capsicum annuum', 'Gossypium hirsutum']) {
    await page.getByRole('searchbox', { name: 'Search plants', exact: true }).fill(name);
    await page.locator('.season-crop-card').first().scrollIntoViewIfNeeded();
    const image = page.locator('.season-crop-card .crop-photo img');
    await expect(image).toHaveCount(1);
    await expect(image).toHaveAttribute('src', /^https:\/\/(?:thumb|upload)\.wikimedia\.org\//);
    expect(await image.evaluate((el) => getComputedStyle(el).objectFit)).toBe('contain');
    await expect(page.locator('.season-crop-card figcaption')).toContainText('Wikimedia Commons');
    await expect(page.getByRole('link', { name: 'Plant identity', exact: true })).toHaveAttribute(
      'href',
      /^https:\/\/www\.wikidata\.org\/wiki\/Q/,
    );
  }
});

test('photo-source failure is retryable and does not prevent crop selection', async ({ page }) => {
  const outage = (route: import('@playwright/test').Route) =>
    route.fulfill({ status: 503, json: { error: 'Deliberate photo outage' } });
  await page.route('**/api/plant-photo?**', outage);
  await enterLand(page, contexts[0]);
  await page
    .getByRole('searchbox', { name: 'Search plants', exact: true })
    .fill('Lycopersicon esculentum');
  await page.locator('.season-crop-card').first().scrollIntoViewIfNeeded();
  await expect(page.getByRole('button', { name: 'Retry photo', exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'Tomato', exact: true }).check();
  await expect(page.getByRole('button', { name: 'Create my farm', exact: true })).toBeEnabled();
  await page.unroute('**/api/plant-photo?**', outage);
  await page.getByRole('button', { name: 'Retry photo', exact: true }).click();
  await expect(page.locator('.crop-photo img')).toHaveAttribute(
    'src',
    /^https:\/\/(?:thumb|upload)\.wikimedia\.org/,
  );
});

test('recommendation labels use common English and Bangla names with Latin only in source details', async ({
  page,
}, info) => {
  await enterLand(page, contexts[0]);
  await page
    .getByRole('combobox', { name: 'Evidence filter', exact: true })
    .selectOption('catalogue');
  const search = page.locator('.plant-search input[type="search"]');
  await search.fill('Lycopersicon esculentum');
  const card = page.locator('.season-crop-card').first();
  const choice = card.locator('.season-crop-choice');
  await expect(choice.locator('strong')).toHaveText('Tomato');
  await expect(choice.locator('small')).toHaveText('টমেটো');
  await expect(choice).not.toContainText('Lycopersicon');
  await expect(card.locator('.plant-source-identity p')).not.toBeVisible();
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await expect(choice.locator('strong')).toHaveText('টমেটো');
  await expect(choice.locator('small')).toHaveText('Tomato');
  await card.scrollIntoViewIfNeeded();
  await expect(card.locator('img')).toHaveAttribute('alt', 'টমেটো · প্রজাতির উদাহরণ ছবি');
  await card.screenshot({ path: info.outputPath('bangla-common-name-card.png') });
  await card.locator('.plant-source-identity summary').click();
  await expect(card.locator('.plant-source-identity p')).toContainText('Lycopersicon esculentum');
});

test('missing common names remain identifiable without Latin recommendation headings', async ({
  page,
}) => {
  await enterLand(page, contexts[0]);
  await page
    .getByRole('combobox', { name: 'Evidence filter', exact: true })
    .selectOption('catalogue');
  await page.getByRole('combobox', { name: 'Plant use', exact: true }).selectOption('all');
  await page
    .getByRole('searchbox', { name: 'Search plants', exact: true })
    .fill('Eucalyptus camaldulensis, northern provenances');
  const card = page.locator('.season-crop-card').first();
  const choice = card.locator('.season-crop-choice');
  await expect(choice.locator('strong')).toHaveText('Common name unrecorded · plant 17648');
  await expect(choice).not.toContainText('Eucalyptus');
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await expect(choice.locator('strong')).toHaveText('প্রচলিত নাম উৎসে নেই · গাছ ১৭৬৪৮');
  await expect(card.getByRole('radio')).toBeDisabled();
});
