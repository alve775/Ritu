import { test, expect } from '@playwright/test';
import { trackingFarm } from '../fixtures/tracking-farm';

test.beforeEach(async ({ page }) => {
  await page.route('https://tile.openstreetmap.org/**', (r) => r.abort());
  await page.route('**/api/weather?**', (r) =>
    r.fulfill({ status: 502, json: { error: 'QA outage' } }),
  );
});
test.afterEach(async ({ page }) =>
  expect((await page.pageErrors()).map((e) => e.message)).toEqual([]),
);

test('a stale active farm cannot unlock a calendar for an unconfirmed land draft', async ({
  page,
}) => {
  await page.addInitScript((farm) => {
    localStorage.setItem(
      'ritu-page-tours-v1',
      JSON.stringify(['/farms', '/farm', '/crops', '/plan']),
    );
    localStorage.setItem(
      'ritu-season-farms-v1',
      JSON.stringify({ version: 1, farms: [farm], activeId: farm.id, confirmedKey: null }),
    );
  }, trackingFarm());
  await page.goto('/plan');
  await expect(page).toHaveURL(/\/farm$/);
  await expect(
    page
      .locator('nav[aria-label="Main navigation"]:visible')
      .getByRole('button', { name: /Farm calendar/ }),
  ).toBeDisabled();
});

test('the old global flag does not suppress the first page-two guide', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
  await page.goto('/farm');
  await expect(page.locator('.tour-dialog')).toBeVisible();
  await expect(page.locator('#tour-title')).toHaveAccessibleName('Find your field anywhere');
});

test('entering land setup revokes even an explicitly opened older calendar', async ({ page }) => {
  const farm = trackingFarm({ notes: 'Keep saved farm intact' });
  await page.addInitScript((farm) => {
    localStorage.setItem(
      'ritu-page-tours-v1',
      JSON.stringify(['/farms', '/farm', '/crops', '/plan']),
    );
    if (!localStorage.getItem('repairs-seed')) {
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
      localStorage.setItem('repairs-seed', '1');
    }
  }, farm);
  await page.goto('/plan');
  await expect(
    page.getByRole('heading', { name: 'Synthetic activity QA', exact: true }),
  ).toBeVisible();
  await page
    .locator('nav[aria-label="Main navigation"]:visible')
    .getByRole('link', { name: /Land details/ })
    .click();
  await expect(
    page
      .locator('nav[aria-label="Main navigation"]:visible')
      .getByRole('button', { name: /Farm calendar/ }),
  ).toBeDisabled();
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('ritu-season-farms-v1')!).calendarAccessId,
      ),
    )
    .toBeNull();
  await page.goto('/plan');
  await expect(page).toHaveURL(/\/farm$/);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('ritu-season-farms-v1')!).farms[0].notes,
    ),
  ).toBe('Keep saved farm intact');
});

test('Play explicitly unmutes a previously muted farm soundscape', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'ritu-page-tours-v1',
      JSON.stringify(['/farms', '/farm', '/crops', '/plan']),
    );
    localStorage.setItem(
      'ritu-display-v1',
      JSON.stringify({
        text: 'comfortable',
        motion: false,
        sound: false,
        volume: 0,
        ambience: 'morning',
      }),
    );
  });
  await page.goto('/farm');
  await page.getByRole('button', { name: 'Reading & sound', exact: true }).click();
  await page.getByRole('button', { name: 'Play farm sounds', exact: true }).click();
  await expect(page.getByText('Farm sounds are playing', { exact: true })).toBeVisible();
  await expect(page.getByRole('slider', { name: 'Sound volume', exact: true })).not.toHaveValue(
    '0',
  );
});

test('the tour offers an explicit read-aloud control', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'ritu-page-tours-v1',
      JSON.stringify(['/farms', '/farm', '/crops', '/plan']),
    ),
  );
  await page.goto('/farm');
  await page.getByRole('button', { name: 'Take a tour', exact: true }).click();
  await expect(
    page.locator('.tour-card').getByRole('button', { name: 'Read this step aloud', exact: true }),
  ).toBeVisible();
});
