import { test, expect } from './browser-test';
import { emptyEvidenceState, profileKey } from '../../src/lib/evidence-store';
import { evidencePlans } from '../../src/domain/evidence-planner';
import { stepsForTour } from '../../src/data/tours';
import type { TourScope } from '../../src/data/tours';

test.beforeEach(async ({ page }) => {
  const state = structuredClone(emptyEvidenceState);
  state.site = { latitude: 24.37, longitude: 88.6, name: 'QA entered field', countryCode: 'BD' };
  state.district = 'rajshahi';
  state.farm = { ...state.farm, area: 1.2, irrigation: 'limited', drainage: 'good' };
  state.from = '2026-10-26';
  state.preferred = ['wheat', 'mustard', 'mung', 'aman'];
  state.reviewed = profileKey(state);
  const plan = evidencePlans(state.from, state.preferred, state.farm, state.priority)[0];
  state.tracked = {
    plan,
    site: state.site,
    profileKey: profileKey(state),
    savedAt: '2026-10-26T00:00:00Z',
    records: Object.fromEntries(plan.periods.map((p) => [`${p.crop}:${p.start}`, { note: '' }])),
  };
  await page.addInitScript((s) => {
    localStorage.setItem('ritu-tour-v1', 'seen');
    if (!localStorage.getItem('ritu-evidence-v2'))
      localStorage.setItem('ritu-evidence-v2', JSON.stringify(s));
  }, state);
  await page.route('**/api/season-history?**', (route) =>
    route.fulfill({ status: 502, json: { error: 'Test-only upstream unavailable' } }),
  );
});

test('every section guide remains usable, with honest counts and unchanged farm records', async ({
  page,
}, info) => {
  test.setTimeout(120000);
  await page.goto('/farm');
  const original = await page.evaluate(() => localStorage.getItem('ritu-evidence-v2'));
  const scopes: TourScope[] = ['farm', 'crops', 'compare', 'track', 'field', 'insights'];
  for (const scope of scopes) {
    await page.getByRole('button', { name: 'Take a tour', exact: true }).click();
    const chooser = page.getByRole('dialog');
    if (scope === 'field' || scope === 'insights') {
      const extra = chooser.locator('.tour-extra-help');
      if (!(await extra.evaluate((el: HTMLDetailsElement) => el.open)))
        await extra.locator('summary').click();
    }
    const steps = stepsForTour(scope);
    const choice = chooser.locator(`[data-tour-scope="${scope}"]`);
    await expect(choice).toContainText(`${steps.length} ${steps.length === 1 ? 'step' : 'steps'}`);
    await choice.click();
    for (let i = 0; i < steps.length; i++) {
      const card = page.locator('.tour-card');
      await expect(card).toHaveAttribute('aria-busy', 'false');
      await expect(page.locator('#tour-title')).toHaveAccessibleName(steps[i].title.en);
      await expect(card).toContainText(`Step ${i + 1} of ${steps.length}`);
      const light = page.locator('.tour-spotlight');
      await expect(light).toBeVisible();
      const lightBox = (await light.boundingBox())!;
      const cardBox = (await card.boundingBox())!;
      expect(lightBox.width).toBeGreaterThan(40);
      expect(lightBox.height).toBeGreaterThan(20);
      expect(
        Math.max(
          0,
          Math.min(cardBox.x + cardBox.width, lightBox.x + lightBox.width) -
            Math.max(cardBox.x, lightBox.x),
        ) *
          Math.max(
            0,
            Math.min(cardBox.y + cardBox.height, lightBox.y + lightBox.height) -
              Math.max(cardBox.y, lightBox.y),
          ),
      ).toBeLessThan(8);
      if (i === 0 || i === steps.length - 1)
        await page.screenshot({ path: info.outputPath(`guide-${scope}-${i}.png`) });
      await page
        .getByRole('button', { name: i === steps.length - 1 ? 'Finish tour' : 'Next', exact: true })
        .click();
    }
    await expect(page.locator('.tour-dialog')).toHaveCount(0);
  }
  expect(await page.evaluate(() => localStorage.getItem('ritu-evidence-v2'))).toBe(original);
});

test('optional method text and specialist tours do not hide essential planning guidance', async ({
  page,
}, info) => {
  await page.goto('/crops');
  await expect(page.locator('.evidence-boundary')).toBeVisible();
  const method = page.locator('[data-tour="crop-method"]');
  await expect(method).not.toHaveAttribute('open');
  await method.locator('summary').click();
  await expect(method).toContainText('maximum duration is reserved in full');
  await expect(method.getByRole('link', { name: 'Official calendar catalogue' })).toBeVisible();
  await page.getByRole('button', { name: 'Take a tour', exact: true }).click();
  const chooser = page.getByRole('dialog');
  await expect(chooser.locator('.tour-choices').first().locator('button').first()).toHaveAttribute(
    'data-tour-scope',
    'crops',
  );
  await expect(chooser.locator('[data-tour-scope="full"]')).toContainText('14 steps');
  await expect(chooser.locator('[data-tour-scope="field"]')).toBeHidden();
  await chooser.locator('.tour-extra-help summary').click();
  await expect(chooser.locator('[data-tour-scope="field"]')).toBeVisible();
  await expect(chooser.locator('[data-tour-scope="insights"]')).toBeVisible();
  await page.screenshot({ path: info.outputPath('tour-chooser.png') });
});

test('priority choices have implemented ranking methods and older preferences survive', async ({
  page,
}) => {
  await page.goto('/farm');
  const openPreferences = async () => {
    const section = page.locator('.optional-intake').filter({ hasText: 'Planning priority' });
    await section.locator('summary').click();
  };
  await openPreferences();
  const select = page.getByRole('combobox', { name: 'Planning priority', exact: true });
  await expect(select).toBeVisible();
  expect(
    await select
      .locator('option')
      .evaluateAll((els) =>
        (els as HTMLOptionElement[]).filter((el) => !el.disabled).map((el) => el.value),
      ),
  ).toEqual(['familiar', 'diversity', 'soil']);
  await select.selectOption('diversity');
  await page.reload();
  await openPreferences();
  await expect(select).toHaveValue('diversity');
  for (const priority of ['water', 'resilience']) {
    const records = await page.evaluate((value) => {
      const s = JSON.parse(localStorage.getItem('ritu-evidence-v2')!);
      s.priority = value;
      localStorage.setItem('ritu-evidence-v2', JSON.stringify(s));
      return s.tracked.records;
    }, priority);
    await page.reload();
    await openPreferences();
    await expect(select).toHaveValue(priority);
    await expect(select.locator('option:checked')).toHaveJSProperty('disabled', true);
    await expect(
      page.getByText('Your saved preference is preserved.', { exact: false }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('ritu-evidence-v2')!).tracked.records,
      ),
    ).toEqual(records);
    await select.selectOption('familiar');
    await expect(select.locator(`option[value="${priority}"]`)).toHaveCount(0);
  }
});

test('the complete Bangla tour stays readable and navigable at 320 pixels', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.setViewportSize({ width: 320, height: 700 });
  await page.goto('/farm');
  await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
  await page.getByRole('button', { name: 'পরিচিতি দেখুন', exact: true }).click();
  await page.locator('[data-tour-scope="full"]').click();
  const steps = stepsForTour('full');
  for (let i = 0; i < steps.length; i++) {
    const card = page.locator('.tour-card');
    await expect(card).toHaveAttribute('aria-busy', 'false');
    await expect(page.locator('#tour-title')).toHaveAccessibleName(steps[i].title.bn);
    const bounds = (await card.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0);
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(321);
    expect(bounds.y).toBeGreaterThanOrEqual(0);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(701);
    if ([0, 5, 13].includes(i))
      await page.screenshot({ path: info.outputPath(`bangla-tour-${i}.png`) });
    await page
      .getByRole('button', {
        name:
          i === steps.length - 1 ? 'পরিচিতি শেষ করুন' : i === 0 ? 'পরিচিতি শুরু করুন' : 'পরের ধাপ',
        exact: true,
      })
      .click();
  }
  await expect(page.locator('.tour-dialog')).toHaveCount(0);
});
