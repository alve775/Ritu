import { test, expect, type Page } from './browser-test';
import AxeBuilder from '@axe-core/playwright';
import contexts from '../fixtures/world-growing-contexts.json' with { type: 'json' };
import { trackingFarm } from '../fixtures/tracking-farm';
import type { SeasonContext, SeasonFarm } from '../../src/domain/global-season';
import { globalCrops } from '../../src/domain/global-season';
import type { Farm } from '../../src/domain/types';
import { addDays } from '../../src/domain/evidence-planner';
import { searchPlantCatalogue } from '../../src/domain/plant-search';
import { blankFarm } from '../../src/lib/evidence-store';
import { testWeather } from './browser-test';
const today = '2026-11-06',
  now = '2026-11-06T10:00:00Z';

test('perennial harvest stays active in preview and never closes the real planting', async ({
  page,
}) => {
  const base = trackingFarm(),
    crop = globalCrops.find((c) => c.planKind === 'perennial-review')!;
  await openSeed(page, {
    plantedDate: today,
    selection: {
      ...base.selection,
      crop: crop.id,
      planKind: 'perennial-review',
      start: today,
      durationMin: 365,
      durationMax: 365,
      endEarly: addDays(today, 365),
      endLate: addDays(today, 365),
    },
  });
  await page.getByRole('button', { name: 'Preview another day', exact: true }).click();
  await page.getByRole('button', { name: 'Next preview day', exact: true }).click();
  await page.getByLabel('Actual harvest date', { exact: true }).fill(addDays(today, 1));
  await expect(page.locator('.season-progress')).toContainText('Perennial care continues');
  await page.getByRole('button', { name: 'Next preview day', exact: true }).click();
  await expect(page.locator('.season-daily')).not.toContainText('Check stored produce');
  expect((await records(page)).farms[0].harvestedDate).toBe('');
});
test('a damaged farm does not discard readable parent fields or pending locations', async ({
  page,
}) => {
  const farm = { ...trackingFarm(), fieldId: 'parent' },
    fields = [
      { id: 'parent', name: 'Saved field', profile: farm.field, site: farm.site },
      { id: 'pending', name: 'Next field', profile: { ...blankFarm } },
    ];
  await page.addInitScript(
    ({ farm, fields }) =>
      localStorage.setItem(
        'ritu-season-farms-v1',
        JSON.stringify({
          version: 1,
          farms: [farm, null],
          fields,
          activeId: farm.id,
          confirmedKey: null,
        }),
      ),
    { farm, fields },
  );
  await page.goto('/farms');
  await expect(page.locator('.registered-field')).toHaveCount(2);
  await expect(page.locator('.season-farm-tile')).toHaveCount(1);
  expect(
    await page.evaluate(() => localStorage.getItem('ritu-season-farms-v1-recovery')),
  ).toContain('pending');
});
test.beforeEach(async ({ page }) => {
  await page.clock.setFixedTime(new Date(now));
  await page.addInitScript(() => {
    localStorage.setItem(
      'ritu-page-tours-v1',
      JSON.stringify(['/farms', '/farm', '/crops', '/plan']),
    );
    localStorage.setItem('ritu-tour-v1', 'seen');
  });
  await page.route('**/api/weather?**', (route) => {
    const q = new URL(route.request().url()).searchParams,
      w = testWeather(Number(q.get('latitude')), Number(q.get('longitude')));
    const row = contexts.find(
      (c) => Math.abs(c.context.site.latitude - w.requested.latitude) < 0.00001,
    );
    w.fetchedAt = now;
    w.timezone = row?.context.site.timezone || 'Asia/Dhaka';
    w.current.time = today + 'T16:00';
    w.days = w.days.map((d, i) => ({ ...d, date: addDays(today, i) }));
    return route.fulfill({ json: { weather: w } });
  });
  await page.route('**/api/places?**', (r) => {
    const q = new URL(r.request().url()).searchParams.get('q')?.toLowerCase() || '';
    return r.fulfill({
      json: {
        places: contexts
          .filter((c) => c.name.toLowerCase().includes(q))
          .map((c, i) => ({ ...c.context.site, id: i })),
      },
    });
  });
  await page.route('**/api/season-context?**', (r) => {
    const q = new URL(r.request().url()).searchParams,
      row = contexts.find(
        (c) => Math.abs(c.context.site.latitude - Number(q.get('latitude'))) < 0.00001,
      );
    return row
      ? r.fulfill({ json: { context: row.context } })
      : r.fulfill({ status: 502, json: { error: 'Unrecorded test coordinate' } });
  });
  await page.route('**/api/plants?**', (r) => {
    const q = new URL(r.request().url()).searchParams,
      row = contexts.find(
        (c) => Math.abs(c.context.site.latitude - Number(q.get('latitude'))) < 0.00001,
      )!;
    return r.fulfill({
      json: searchPlantCatalogue(
        row.context as SeasonContext,
        {
          ...blankFarm,
          area: Number(q.get('area') || 1),
          soil: q.get('soil'),
          drainage: q.get('drainage'),
          irrigation: q.get('irrigation'),
        } as Farm,
        q.get('from')!,
        {
          page: Number(q.get('page') || 1),
          text: q.get('q') || '',
          category: q.get('category') || '',
          cycle: q.get('cycle') || '',
          mode: q.get('mode') || '',
        },
      ),
    });
  });
  await page.route('**/api/plant-photo?**', (r) => r.fulfill({ json: { photos: {} } }));
  await page.route('**/api/soil-reference?**', (r) =>
    r.fulfill({ status: 502, json: { error: 'QA provider outage' } }),
  );
});
test('a reused field resolves its local day before defaulting the planting date', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-11-06T01:00:00Z'));
  const site = { ...contexts[1].context.site, timezone: undefined };
  await page.addInitScript(
    (site) =>
      localStorage.setItem(
        'ritu-season-farms-v1',
        JSON.stringify({
          version: 1,
          farms: [],
          fields: [
            {
              id: 'washington',
              name: 'Washington field',
              profile: {
                name: 'Washington field',
                area: 2,
                soil: 'unknown',
                drainage: 'unknown',
                irrigation: 'unknown',
                required: [],
                unavailableMonths: [],
                current: [],
              },
              site,
            },
          ],
          activeId: null,
          confirmedKey: null,
        }),
      ),
    site,
  );
  await page.route('**/api/weather?**', (r) => {
    const q = new URL(r.request().url()).searchParams,
      w = testWeather(Number(q.get('latitude')), Number(q.get('longitude')));
    w.timezone = 'America/New_York';
    w.utcOffset = -18000;
    w.fetchedAt = '2026-11-06T01:00:00Z';
    w.current.time = '2026-11-05T20:00';
    w.days = w.days.map((d, i) => ({ ...d, date: addDays('2026-11-05', i) }));
    return r.fulfill({ json: { weather: w } });
  });
  await page.goto('/farms');
  await page.getByRole('button', { name: 'Add farm to: Washington field', exact: true }).click();
  await expect(page.getByLabel('Ready to plant from', { exact: true })).toHaveValue('2026-11-05');
  await page.getByLabel('Ready to plant from', { exact: true }).fill('2027-05-01');
  await expect(page.getByLabel('Ready to plant from', { exact: true })).toHaveValue('2027-05-01');
});
test('unsaved harvest choice immediately previews the matching next work without writing records', async ({
  page,
}) => {
  await openSeed(page, { plantedDate: today });
  await page
    .getByRole('combobox', { name: 'Observed stage', exact: true })
    .selectOption('Harvested');
  await page
    .getByRole('combobox', { name: 'Harvest status', exact: true })
    .selectOption('finished');
  await expect(
    page.getByRole('region', { name: 'Preview of next checks', exact: true }),
  ).toContainText('Check stored produce');
  expect((await records(page)).farms[0].harvestedDate).toBe('');
  await expect(page.locator('.season-progress')).toContainText('Growing');
  await page.getByRole('button', { name: 'Save daily check-in', exact: true }).click();
  await expect(page.locator('.season-progress')).toContainText('Season completed');
});
test('a farm can release part of its field without losing its saved journal', async ({ page }) => {
  await openSeed(page, { notes: 'Keep my journal' });
  await page.getByRole('link', { name: 'All my farms', exact: true }).click();
  await page.getByRole('button', { name: 'Change farm area', exact: true }).click();
  await page.getByRole('spinbutton', { name: 'Farm area (hectares)', exact: true }).fill('.4');
  await page.getByRole('button', { name: 'Save farm area', exact: true }).click();
  expect((await records(page)).farms[0].field.area).toBe(0.4);
  expect((await records(page)).fields[0].profile.area).toBe(1);
  expect((await records(page)).farms[0].notes).toBe('Keep my journal');
  await expect(page.locator('.registered-field-heading')).toContainText('Available 0.6 ha');
});
test.afterEach(async ({ page }) => {
  expect((await page.pageErrors()).map((e) => e.message)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
const records = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('ritu-season-farms-v1')!));
async function openSeed(page: Page, patch: Partial<SeasonFarm> = {}) {
  const base = trackingFarm(),
    farm = {
      ...base,
      plantedDate: '',
      ...patch,
      selection: {
        ...base.selection,
        start: addDays(today, -2),
        durationMin: 30,
        durationMax: 40,
        endEarly: addDays(today, 28),
        endLate: addDays(today, 38),
        ...patch.selection,
      },
    };
  await page.addInitScript((farm) => {
    if (!localStorage.getItem('new-calendar-seed')) {
      localStorage.setItem('new-calendar-seed', '1');
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
    }
  }, farm);
  await page.goto('/plan');
  await expect(page.locator('.season-workspace')).toBeVisible();
}
async function setupField(page: Page, name: string, location: string, area: string) {
  await page.getByRole('textbox', { name: 'Field name', exact: true }).fill(name);
  await page.getByRole('combobox', { name: 'Find your location', exact: true }).fill(location);
  await page.getByRole('option', { name: location, exact: true }).click();
  await page.locator('#farm-area').fill(area);
  await page.getByRole('button', { name: 'Save field', exact: true }).click();
  await expect(page).toHaveURL(/\/farms$/);
}
async function addFarm(page: Page, field: string, name: string, area: string) {
  await page.getByRole('button', { name: `Add farm to: ${field}`, exact: true }).click();
  await page.getByRole('textbox', { name: 'Farm name · optional', exact: true }).fill(name);
  await page.locator('#farm-area').fill(area);
  await page.getByLabel('Ready to plant from', { exact: true }).fill('2027-05-01');
  await page.getByRole('button', { name: 'Show suggested crops', exact: true }).click();
  await expect(page).toHaveURL(/\/crops$/);
  await page.getByRole('radio').first().check();
  await page.getByRole('button', { name: 'Create my farm', exact: true }).click();
}

test('saved farm stays accessible when the calendar navigation stalls', async ({ page }) => {
  await page.goto('/farms');
  await page.getByRole('button', { name: 'Add fields', exact: true }).click();
  await page.getByRole('button', { name: 'Set up field', exact: true }).click();
  await setupField(page, 'Navigation recovery field', 'Manikganj', '20');
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/plan?**', async (route) => {
    await held;
    await route.continue().catch(() => {});
  });
  try {
    await addFarm(page, 'Navigation recovery field', 'Wheat field', '20');
    await expect.poll(async () => (await records(page)).farms.length).toBe(1);
    await expect(page.getByRole('link', { name: 'Open farm calendar', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Creating farm…', exact: true })).toHaveCount(0);
    await page.getByRole('link', { name: 'Open farm calendar', exact: true }).click();
    await expect(page).toHaveURL(/\/plan$/);
    await expect(page.locator('.season-workspace')).toBeVisible();
    expect((await records(page)).farms).toHaveLength(1);
  } finally {
    release();
  }
});

for (const stage of ['land', 'suggestions', 'selected-crop', 'saved-farm']) {
  test(`reset during ${stage} clears access and permits a fresh farm`, async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/farms');
    await page.getByRole('button', { name: 'Add fields', exact: true }).click();
    await page.getByRole('button', { name: 'Set up field', exact: true }).click();
    await setupField(page, 'Original field', 'Manikganj', '20');
    await page.getByRole('button', { name: 'Add farm to: Original field', exact: true }).click();
    if (stage !== 'land') {
      await page.getByRole('button', { name: 'Show suggested crops', exact: true }).click();
      await expect(page).toHaveURL(/\/crops$/);
      if (stage !== 'suggestions') {
        await page.getByRole('radio').first().check();
        if (stage === 'saved-farm') {
          await page.getByRole('button', { name: 'Create my farm', exact: true }).click();
          await expect(page.locator('.season-workspace')).toBeVisible();
        }
      }
    }
    await page.getByRole('button', { name: 'Reset', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Reset all data', exact: true })
      .click();
    expect((await records(page)).farms).toHaveLength(0);
    expect((await records(page)).fields).toHaveLength(0);
    await page.goto('/plan');
    await expect(page).toHaveURL(/\/farm$/);
    await page.goto('/crops');
    await expect(page).toHaveURL(/\/farm$/);
    await page.goto('/farms');
    await page.getByRole('button', { name: 'Add fields', exact: true }).click();
    await page.getByRole('button', { name: 'Set up field', exact: true }).click();
    await setupField(page, 'Fresh field', 'Manikganj', '20');
    await addFarm(page, 'Fresh field', 'New season', '20');
    await expect(page).toHaveURL(/\/plan$/);
    await expect(page.locator('.season-workspace')).toBeVisible();
    await page.reload();
    await expect(page.locator('.season-workspace')).toBeVisible();
    expect((await records(page)).farms).toHaveLength(1);
    expect((await records(page)).fields).toHaveLength(1);
    expect((await records(page)).farms[0].field.name).toBe('New season');
  });
}

test('list several fields before setup and keep them on reload', async ({ page }) => {
  await page.goto('/farms');
  await page
    .getByRole('spinbutton', { name: 'How many fields do you have?', exact: true })
    .fill('3');
  await page.getByRole('button', { name: 'Add fields', exact: true }).click();
  await expect(page.locator('.registered-field')).toHaveCount(3);
  await page.reload();
  await expect(page.locator('.registered-field')).toHaveCount(3);
  expect((await records(page)).farms).toHaveLength(0);
  await page
    .locator('.registered-field')
    .first()
    .getByRole('button', { name: 'Remove empty field', exact: true })
    .click();
  await page.getByRole('button', { name: 'Add fields', exact: true }).click();
  const names = (await records(page)).fields.map((f: { name: string }) => f.name);
  expect(names).toHaveLength(3);
  expect(new Set(names).size).toBe(3);
});
test('different countries have independent fields, inherited locations and subdivided areas', async ({
  page,
}, info) => {
  await page.goto('/farms');
  await page
    .getByRole('spinbutton', { name: 'How many fields do you have?', exact: true })
    .fill('2');
  await page.getByRole('button', { name: 'Add fields', exact: true }).click();
  await page
    .locator('.registered-field')
    .nth(0)
    .getByRole('button', { name: 'Set up field', exact: true })
    .click();
  await setupField(page, 'Bangladesh field', 'Manikganj', '1');
  await page
    .locator('.registered-field')
    .nth(1)
    .getByRole('button', { name: 'Set up field', exact: true })
    .click();
  await setupField(page, 'American field', 'Washington', '2');
  await addFarm(page, 'Bangladesh field', 'East plot', '.4');
  await expect(page).toHaveURL(/\/plan$/);
  await page.getByRole('link', { name: 'All my farms', exact: true }).click();
  await addFarm(page, 'Bangladesh field', 'West plot', '.6');
  await expect(page).toHaveURL(/\/plan$/);
  await page.getByRole('link', { name: 'All my farms', exact: true }).click();
  await addFarm(page, 'American field', 'US plot', '1');
  await expect(page).toHaveURL(/\/plan$/);
  const state = await records(page);
  expect(state.fields).toHaveLength(2);
  expect(state.farms).toHaveLength(3);
  expect(state.farms[0].fieldId).toBe(state.farms[1].fieldId);
  expect(state.farms[2].fieldId).not.toBe(state.farms[0].fieldId);
  expect(state.farms[0].site.latitude).toBe(contexts[0].context.site.latitude);
  expect(state.farms[2].site.longitude).toBe(contexts[1].context.site.longitude);
  await page.getByRole('link', { name: 'All my farms', exact: true }).click();
  await page.screenshot({ path: info.outputPath('two-countries-fields.png'), fullPage: true });
  await addFarm(page, 'Bangladesh field', 'Overbooked', '.1');
  await expect(page.locator('.season-page [role="alert"]')).toContainText('fit within their field');
  expect((await records(page)).farms).toHaveLength(3);
});
test('old saved farms migrate into fields without losing journals or notes', async ({ page }) => {
  await openSeed(page, { notes: 'Keep this real record', done: [today + ':field-ready'] });
  await page.getByRole('link', { name: 'All my farms', exact: true }).click();
  await expect(page.locator('.registered-field')).toHaveCount(1);
  await page.getByRole('button', { name: 'Open farm', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Field notes', exact: true })).toHaveValue(
    'Keep this real record',
  );
  const state = await records(page);
  expect(state.farms[0].fieldId).toBe(state.fields[0].id);
  expect(state.farms[0].done).toEqual([today + ':field-ready']);
});
test('daily guidance has no completion checkboxes and actual planting changes the schedule', async ({
  page,
}, info) => {
  await openSeed(page);
  await expect(page.locator('.season-daily').getByRole('checkbox')).toHaveCount(0);
  await expect(page.locator('.task-completion')).toHaveCount(0);
  await expect(page.locator('.season-daily')).toContainText('Check the field before planting');
  await expect(page.locator('.season-model-status')).toHaveCount(0);
  await page.getByRole('button', { name: 'I planted on this day', exact: true }).click();
  await expect(page.locator('.season-hero-info')).toContainText('Day 1');
  await expect(page.locator('.season-progress')).toContainText('Growing');
  await expect(page.locator('.season-daily')).toContainText('Walk the field');
  expect((await records(page)).farms[0].plantedDate).toBe(today);
  await page
    .locator('.season-work-grid')
    .screenshot({ path: info.outputPath('calendar-guidance.png') });
});
test('the growing period is green from the planned beginning to the reference end', async ({
  page,
}) => {
  await openSeed(page);
  await expect(page.locator(`.season-calendar-grid button[aria-label^="${today}"]`)).toHaveClass(
    /scheduled-day/,
  );
  await page.getByRole('button', { name: 'Go to estimated end', exact: true }).click();
  await expect(page.locator('.season-calendar-grid button.selected')).toHaveClass(/scheduled-day/);
  await page.getByRole('button', { name: 'Next day', exact: true }).click();
  await expect(page.locator('.season-calendar-grid button.selected')).not.toHaveClass(
    /scheduled-day/,
  );
});
test('preview advances dates, applies observations and early harvest, then restores exact real records', async ({
  page,
}, info) => {
  await openSeed(page);
  const original = await page.evaluate(() => localStorage.getItem('ritu-season-farms-v1'));
  await page.getByRole('button', { name: 'Preview another day', exact: true }).click();
  await expect(page.locator('.season-workspace')).toHaveAttribute('data-preview', 'true');
  await page.getByRole('button', { name: 'I planted on this day', exact: true }).click();
  await page.getByRole('button', { name: 'Next preview day', exact: true }).click();
  await expect(page.locator('.season-hero-info')).toContainText('Day 2');
  await page
    .getByRole('combobox', { name: 'Observed stage', exact: true })
    .selectOption('Flowering');
  await expect(
    page.getByRole('region', { name: 'Preview of next checks', exact: true }),
  ).toContainText('flowering crop');
  await page.getByRole('button', { name: 'Save daily check-in', exact: true }).click();
  await expect(page.locator('.season-observed-stage')).toContainText('Flowering');
  await expect(page.locator('.season-daily')).toContainText('flowering crop');
  await page.getByRole('textbox', { name: 'Field notes', exact: true }).fill('Preview-only note');
  await page
    .getByRole('textbox', { name: 'Actual harvest date', exact: true })
    .fill(addDays(today, 1));
  await expect(page.locator('.season-progress')).toContainText('Season completed');
  await page.screenshot({ path: info.outputPath('temporary-preview.png'), fullPage: true });
  expect(await page.evaluate(() => localStorage.getItem('ritu-season-farms-v1'))).toBe(original);
  await page.getByRole('button', { name: 'Finish preview', exact: true }).click();
  await expect(page.locator('.season-hero-info')).toContainText('Waiting for actual planting');
  await expect(page.getByRole('textbox', { name: 'Field notes', exact: true })).toHaveValue('');
  expect(await page.evaluate(() => localStorage.getItem('ritu-season-farms-v1'))).toBe(original);
});
test('preview can pass the reference date without silently completing the crop', async ({
  page,
}) => {
  await openSeed(page, { plantedDate: today });
  await page.getByRole('button', { name: 'Preview another day', exact: true }).click();
  await page.getByLabel('Preview date', { exact: true }).fill(addDays(today, 50));
  await expect(page.locator('.season-progress')).toContainText('Beyond reference window');
  await expect(page.locator('.season-calendar-grid button.selected')).toHaveClass(/extended-day/);
  expect((await records(page)).farms[0].harvestedDate).toBe('');
});
test('field and preview layouts expose labeled controls and remain accessible', async ({
  page,
}) => {
  await openSeed(page, { plantedDate: today });
  await page.getByRole('button', { name: 'Preview another day', exact: true }).click();
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(result.violations).toEqual([]);
});
