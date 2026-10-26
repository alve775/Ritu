import { test, expect } from './browser-test';
import { emptyEvidenceState, profileKey } from '../../src/lib/evidence-store';
import { evidencePlans } from '../../src/domain/evidence-planner';
const setup = () => {
  const s = structuredClone(emptyEvidenceState);
  s.site = { latitude: 24.37, longitude: 88.6, name: 'Test-only farm', countryCode: 'BD' };
  s.farm = { ...s.farm, area: 1.2, soil: 'loam', drainage: 'good', irrigation: 'limited' };
  s.district = 'rajshahi';
  s.from = '2026-10-26';
  s.preferred = ['wheat', 'mung', 'aman'];
  s.reviewed = profileKey(s);
  const p = evidencePlans(s.from, s.preferred, s.farm, s.priority)[0];
  s.tracked = {
    plan: p,
    site: s.site,
    profileKey: profileKey(s),
    savedAt: '2026-10-26T00:00:00Z',
    records: Object.fromEntries(
      p.periods.map((p) => [`${p.crop}:${p.start}`, { note: 'Test record to preserve' }]),
    ),
  };
  return s;
};
test.beforeEach(async ({ page }, info) => {
  if (!info.title.startsWith('first-visit'))
    await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
});
test('frame has no aspect-ratio gutters across short, wide, tablet and phone sizes', async ({
  page,
}, info) => {
  test.setTimeout(60000);
  await page.goto('/');
  for (const [width, height] of [
    [1920, 650],
    [1900, 860],
    [1440, 1000],
    [1024, 768],
    [1024, 1366],
    [900, 1200],
    [768, 1024],
    [412, 900],
    [320, 700],
  ]) {
    await page.setViewportSize({ width, height });
    const svg = page.locator('.farm-vector');
    await svg.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        svg.evaluate((s: SVGSVGElement) => {
          const frame = s.getBoundingClientRect();
          return Math.abs(
            s.viewBox.baseVal.width / s.viewBox.baseVal.height - frame.width / frame.height,
          );
        }),
      )
      .toBeLessThan(0.001);
    for (const [i, name] of ['Sow', 'Care', 'Grow', 'Harvest'].entries()) {
      await page.getByRole('button', { name: `${name} · chapter ${i + 1} of 4` }).click();
      await expect(page.locator('[data-activity]')).toHaveCount(1);
      await expect(page.locator('[data-farm-worker]')).toHaveCount(i === 2 ? 0 : 1);
      const clipped = await svg.evaluate((root) => {
        const frame = root.getBoundingClientRect();
        return [
          ...root.querySelectorAll(
            '[data-farm-worker], [data-frame="sun"], [data-frame="house"], [data-frame="tree"]',
          ),
        ]
          .filter((element) => {
            const b = element.getBoundingClientRect();
            return (
              b.left < frame.left - 1 ||
              b.right > frame.right + 1 ||
              b.top < frame.top - 1 ||
              b.bottom > frame.bottom + 1
            );
          })
          .map(
            (element) =>
              element.getAttribute('data-farm-worker') ?? element.getAttribute('data-frame'),
          );
      });
      expect(clipped, `Clipped focal artwork at ${width}×${height}, ${name}`).toEqual([]);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page
      .locator('.landing__art')
      .screenshot({ path: info.outputPath(`frame-${width}x${height}.png`) });
  }
});
test('area units preserve the measured value and invalid drafts preserve field records', async ({
  page,
}) => {
  await page.addInitScript((s) => {
    if (!localStorage.getItem('ritu-evidence-v2'))
      localStorage.setItem('ritu-evidence-v2', JSON.stringify(s));
  }, setup());
  await page.goto('/farm');
  await page.getByRole('combobox', { name: 'Area unit' }).selectOption('decimal');
  await page.getByRole('spinbutton', { name: 'Field area (decimal / shotok)' }).fill('100');
  await page.getByRole('combobox', { name: 'Area unit' }).selectOption('square-metres');
  await expect(page.getByRole('spinbutton', { name: 'Field area (square metres)' })).toHaveValue(
    '4046.8564224',
  );
  await page.getByRole('combobox', { name: 'Area unit' }).selectOption('hectares');
  await page.getByRole('spinbutton', { name: 'Field area (hectares)' }).fill('-1');
  await page.reload();
  await expect(page.getByRole('spinbutton', { name: 'Field area (hectares)' })).toHaveValue('-1');
  await page.goto('/track');
  await expect(page.getByLabel('Field observations & notes', { exact: true }).first()).toHaveValue(
    'Test record to preserve',
  );
});
test('missing-field guidance focuses the exact field and navigation does not claim uncompleted steps', async ({
  page,
}) => {
  await page.goto('/farm');
  await page.getByRole('button', { name: 'See crop references' }).click();
  await expect(page.locator('#farm-errors')).toBeFocused();
  await page
    .locator('#farm-errors')
    .getByRole('link', { name: 'Confirm your district', exact: true })
    .click();
  await expect(page.getByRole('combobox', { name: 'Confirm your district' })).toBeFocused();
  await page.goto('/plan');
  await expect(page.locator('.step-progress .step.done')).toHaveCount(0);
  await expect(page).toHaveTitle(/Step 3 of 4/);
});
test('season selection retains choices and incompatible selected crops can be removed', async ({
  page,
}) => {
  const s = setup();
  s.farm.irrigation = 'rainfed';
  s.preferred.push('boro');
  s.reviewed = profileKey(s);
  await page.addInitScript((s) => {
    if (!localStorage.getItem('ritu-evidence-v2'))
      localStorage.setItem('ritu-evidence-v2', JSON.stringify(s));
  }, s);
  await page.goto('/crops');
  const boro = page.getByRole('checkbox', { name: 'Boro rice', exact: true });
  await expect(boro).toBeChecked();
  await boro.uncheck();
  await expect(boro).toBeDisabled();
  await page.getByRole('button', { name: /^Pre-monsoon/ }).click();
  await expect(
    page.getByRole('checkbox', { name: 'Mung bean · Kharif I', exact: true }),
  ).toBeChecked();
  await page.getByRole('button', { name: /^Winter/ }).click();
  await expect(page.getByRole('checkbox', { name: 'Wheat', exact: true })).toBeChecked();
});
test('source dialog navigation closes the dialog and returns to the farm', async ({ page }) => {
  await page.goto('/sources');
  await page.getByRole('button', { name: 'NASA · weather · DAE sources', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('link', { name: 'Start with your farm', exact: true })
    .click();
  await expect(page).toHaveURL(/\/farm$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
test('first-visit onboarding teaches farm setup without touring locked later screens', async ({
  page,
}) => {
  await page.goto('/farm');
  const card = page.locator('.tour-card');
  await expect(card).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await expect(card).toHaveAttribute('aria-busy', 'false');
    await expect(page).toHaveURL(/\/farm$/);
    await page
      .getByRole('button', {
        name: i === 0 ? 'Start the tour' : i === 4 ? 'Finish tour' : 'Next',
        exact: true,
      })
      .click();
  }
  await expect(page.locator('.tour-dialog')).toHaveCount(0);
  await expect(page.getByRole('spinbutton', { name: 'Field area (hectares)' })).toHaveValue('');
});
test('sound is opt-in and volume, mute and reading preferences remain controllable', async ({
  page,
}) => {
  await page.goto('/farm');
  await page.getByRole('button', { name: 'Reading & sound', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Farm sounds are off', { exact: true })).toBeVisible();
  const volume = dialog.getByRole('slider', { name: 'Sound volume' });
  await volume.focus();
  await volume.press('Home');
  for (let i = 0; i < 4; i++) await volume.press('ArrowRight');
  await dialog.getByRole('button', { name: 'Play farm sounds', exact: true }).click();
  await expect(dialog.getByText('Farm sounds are playing', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Mute all sounds', exact: true }).click();
  await expect(dialog.getByRole('slider', { name: 'Sound volume' })).toHaveValue('0');
  await dialog.getByRole('radio', { name: 'Extra large', exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'larger');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-text-size', 'larger');
  await page.getByRole('button', { name: 'Reading & sound', exact: true }).click();
  await expect(page.getByRole('slider', { name: 'Sound volume' })).toHaveValue('0');
});
