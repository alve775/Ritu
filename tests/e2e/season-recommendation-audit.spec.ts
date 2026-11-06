import fs from 'node:fs';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { requirements } from '../../src/domain/plant-screen';
import type { SeasonContext } from '../../src/domain/global-season';
// Fresh, source-hashed captures. Land setups are QA assumptions, not surveyed farms.
const capturePath = 'research/recommendation-audit-2026-11-03/contexts.json';
const sites = (
  fs.existsSync(capturePath) ? JSON.parse(fs.readFileSync(capturePath, 'utf8')) : []
) as { country: string; name: string; context: SeasonContext }[];
test.skip(
  !fs.existsSync(capturePath),
  'Run npm run audit:recommendations:capture with the local preview running first.',
);
const waters = ['reliable', 'limited', 'rainfed', 'severe', 'unknown'] as const;
const labels = {
  reliable: 'Reliable irrigation',
  limited: 'Limited irrigation',
  rainfed: 'Rain only',
  severe: 'Severe shortage',
  unknown: 'Not sure',
};
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'ritu-page-tours-v1',
      JSON.stringify(['/farms', '/farm', '/crops', '/plan']),
    ),
  );
  await page.route('https://tile.openstreetmap.org/**', (r) => r.abort());
  // Crop-photo delivery is separately audited. A deliberate image-provider
  // outage keeps this suite from generating hundreds of unrelated API calls.
  await page.route('**/api/plant-photo?**', (r) =>
    r.fulfill({
      status: 503,
      json: { error: 'Deliberate photo-source outage in recommendation QA' },
    }),
  );
});
test.afterEach(async ({ page }) => {
  expect((await page.pageErrors()).map((e) => e.message)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});
async function enter(
  page: Page,
  site: (typeof sites)[number],
  index: number,
  water: (typeof waters)[number],
) {
  const soil = (['unknown', 'loam', 'clay', 'sandy'] as const)[index % 4],
    drainage = (['unknown', 'good', 'poor'] as const)[index % 3];
  await page.goto('/farm');
  await page.getByText('Enter exact coordinates instead', { exact: true }).click();
  await page
    .getByRole('spinbutton', { name: 'Latitude', exact: true })
    .fill(String(site.context.site.latitude));
  await page
    .getByRole('spinbutton', { name: 'Longitude', exact: true })
    .fill(String(site.context.site.longitude));
  await page.getByRole('button', { name: 'Use these coordinates', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Farm name · optional', exact: true })
    .fill(`QA ${site.country} ${water}`);
  if (index % 2)
    await page.getByRole('combobox', { name: 'Area unit', exact: true }).selectOption('acres');
  await page.locator('#farm-area').fill('2');
  await page.getByLabel('Ready to plant from', { exact: true }).fill('2027-06-01');
  await page.getByLabel('Soil texture', { exact: true }).selectOption(soil);
  await page.getByLabel('Does water drain away?', { exact: true }).selectOption(drainage);
  await page.getByRole('radio', { name: labels[water], exact: true }).check();
  const response = page.waitForResponse((r) => {
    const u = new URL(r.url());
    return (
      u.pathname === '/api/plants' &&
      u.searchParams.get('irrigation') === water &&
      u.searchParams.get('soil') === soil &&
      u.searchParams.get('drainage') === drainage &&
      u.searchParams.get('from') === '2027-06-01'
    );
  });
  await page.getByRole('button', { name: 'Show suggested crops', exact: true }).click();
  await expect(page).toHaveURL(/\/crops$/);
  const actual = await response;
  expect(actual.status()).toBe(200);
  const url = new URL(actual.url());
  expect(Number(url.searchParams.get('latitude'))).toBe(site.context.site.latitude);
  expect(Number(url.searchParams.get('longitude'))).toBe(site.context.site.longitude);
  expect(Number(url.searchParams.get('area'))).toBeCloseTo(index % 2 ? 0.80937128448 : 2, 10);
  return { body: await actual.json(), soil, drainage };
}
for (const [i, site] of sites.entries())
  for (const [j, water] of waters.entries())
    test(`${site.country}/${water}: real backend receives the first-section setup and exposes unresolved water`, async ({
      page,
    }, info) => {
      const { body, soil, drainage } = await enter(page, site, i + j, water);
      expect(body.source.sha256).toMatch(/^[a-f0-9]{64}$/);
      await expect(page.locator('.plant-result-status')).toContainText(`${body.count} results`);
      if (!body.count) {
        await expect(
          page.getByRole('heading', { name: 'No results for these filters', exact: true }),
        ).toBeVisible();
        await expect(
          page.getByRole('button', { name: 'Create my farm', exact: true }),
        ).toBeDisabled();
        return;
      }
      for (const entry of body.items) {
        expect(entry.suggestion).toBeTruthy();
        expect(
          entry.suggestion.checks.find((c: { factor: string }) => c.factor === 'water').state,
        ).toBe('unknown');
        const source = requirements.crops.find((c) => c.id === entry.plant.id)!;
        if (drainage !== 'unknown' && (source.drainage || source.toleratedDrainage))
          expect(
            (source.drainage + ',' + source.toleratedDrainage).includes(
              drainage === 'good' ? 'well (' : 'poorly (',
            ),
          ).toBe(true);
      }
      await expect(page.getByRole('radio', { name: /Common name unrecorded/ })).toHaveCount(0);
      await expect(page.locator('.season-crop-card').first()).toContainText(
        'Source-supported factors',
      );
      const first = page.locator('.season-crop-card').first();
      await first.getByText('Why this option & what to check', { exact: true }).click();
      await expect(first).toContainText('Unverified');
      await first.getByRole('radio').check();
      await page.getByRole('button', { name: 'Create my farm', exact: true }).click();
      await expect(page).toHaveURL(/\/plan$/);
      const saved = await page.evaluate(
        () => JSON.parse(localStorage.getItem('ritu-season-farms-v1')!).farms[0],
      );
      expect(saved.field.soil).toBe(soil);
      expect(saved.field.drainage).toBe(drainage);
      expect(saved.field.irrigation).toBe(water);
      expect(
        saved.selection.checks.find((c: { factor: string }) => c.factor === 'water').state,
      ).toBe('unknown');
      expect(saved.plantedDate).toBe('');
      if (j === 0)
        await page.screenshot({ path: info.outputPath(`actual-api-${site.country}.png`) });
    });
test('source name 10308 is Oyster nut; unresolved common-name records remain reference-only', async ({
  page,
}, info) => {
  await enter(page, sites[0], 0, 'reliable');
  const search = page.getByRole('searchbox', { name: 'Search plants', exact: true });
  await search.fill('oyster nut');
  const oyster = page.locator('.season-crop-card').filter({ hasText: 'Oyster nut' });
  await expect(oyster).toHaveCount(1);
  await expect(oyster.locator('.season-crop-choice')).not.toContainText('Telfairia');
  await oyster.locator('.plant-source-identity summary').click();
  await expect(oyster.locator('.plant-source-identity')).toContainText('Telfairia pedata');
  await expect(
    oyster.getByRole('link', { name: 'Supplemental common-name source · FAO', exact: true }),
  ).toHaveAttribute('href', 'https://www.fao.org/4/v8929e/v8929e.pdf');
  await oyster.screenshot({ path: info.outputPath('10308-verified-source-name.png') });
  const missing = requirements.crops.find(
    (c) =>
      c.id !== 'ecocrop-10308' &&
      c.name.en === c.scientific &&
      c.planKind !== 'unknown' &&
      c.GMIN &&
      c.GMAX &&
      c.GMAX <= 365 &&
      c.TMIN !== null &&
      c.TMAX !== null,
  )!;
  await search.fill(missing.scientific);
  await expect(page.locator('.season-crop-card')).toHaveCount(0);
  await page
    .getByRole('combobox', { name: 'Evidence filter', exact: true })
    .selectOption('catalogue');
  await page.getByRole('combobox', { name: 'Plant use', exact: true }).selectOption('all');
  const reference = page.locator('.season-crop-card').filter({ hasText: 'No sourced common name' });
  await expect(reference.getByRole('radio')).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Create my farm', exact: true })).toBeDisabled();
});
test('editing drainage clears a stale crop selection and updates the real backend rice result', async ({
  page,
}) => {
  await enter(page, sites[0], 0, 'reliable');
  await page.getByRole('searchbox', { name: 'Search plants', exact: true }).fill('Oryza sativa');
  await page.getByRole('radio', { name: 'Rice', exact: true }).check();
  await page.getByRole('link', { name: 'Edit land details', exact: true }).click();
  await page.getByLabel('Does water drain away?', { exact: true }).selectOption('good');
  await page.getByRole('button', { name: 'Show suggested crops', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Search plants', exact: true }).fill('Oryza sativa');
  await expect(page.locator('.season-crop-card')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Create my farm', exact: true })).toBeDisabled();
});
test('the revised result evidence is accessible in English and Bangla', async ({ page }, info) => {
  await enter(page, sites[0], 0, 'reliable');
  await page.getByRole('searchbox', { name: 'Search plants', exact: true }).fill('oyster nut');
  await expect(page.getByRole('radio', { name: 'Oyster nut', exact: true })).toBeVisible();
  let axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations).toEqual([]);
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await expect(page.locator('.season-crop-card')).toContainText('বাংলা নাম উৎসে নেই');
  await page.getByText('এই বিকল্পের কারণ ও কী যাচাই করবেন', { exact: true }).click();
  await expect(page.locator('.season-crop-card')).toContainText('অযাচাইকৃত');
  await expect(page.locator('.season-crop-card')).toContainText(
    'Seasonal water adequacy has not been established.',
  );
  await page.screenshot({ path: info.outputPath('bangla-evidence.png') });
  axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(axe.violations).toEqual([]);
});
