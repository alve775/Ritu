import { test, expect } from './browser-test';
import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { emptyEvidenceState, profileKey } from '../../src/lib/evidence-store';
import { evidencePlans } from '../../src/domain/evidence-planner';
const state = () => {
  const s = structuredClone(emptyEvidenceState);
  s.farm = { ...s.farm, area: 1.2, soil: 'loam', drainage: 'good', irrigation: 'limited' };
  s.site = { latitude: 24.37, longitude: 88.6, name: 'Test-only entered field', countryCode: 'BD' };
  s.district = 'rajshahi';
  s.from = '2026-10-26';
  s.preferred = ['wheat', 'mustard', 'mung', 'aman'];
  s.reviewed = profileKey(s);
  const p = evidencePlans(s.from, s.preferred, s.farm, s.priority)[0];
  s.tracked = {
    plan: p,
    site: s.site,
    profileKey: profileKey(s),
    savedAt: '2026-10-26T00:00:00Z',
    records: Object.fromEntries(p.periods.map((p) => [`${p.crop}:${p.start}`, { note: '' }])),
  };
  return s;
};
test('capture the full farmer journey for the current audit', async ({ page }, info) => {
  test.setTimeout(90000);
  await page.addInitScript((s) => {
    localStorage.setItem('ritu-tour-v1', 'seen');
    if (!localStorage.getItem('ritu-evidence-v2'))
      localStorage.setItem('ritu-evidence-v2', JSON.stringify(s));
  }, state());
  await page.route('**/api/season-history?**', (r) =>
    r.fulfill({ status: 502, json: { error: 'Test fixture: no upstream request' } }),
  );
  const report = [];
  for (const [i, path] of ['/', '/farm', '/crops', '/plan', '/track', '/sources'].entries()) {
    await page.goto(path);
    await expect(page.locator('h1')).toBeVisible();
    if (path === '/')
      await expect
        .poll(() =>
          page.locator('.farm-vector').evaluate((s: SVGSVGElement) => {
            const frame = s.getBoundingClientRect();
            return Math.abs(
              s.viewBox.baseVal.width / s.viewBox.baseVal.height - frame.width / frame.height,
            );
          }),
        )
        .toBeLessThan(0.001);
    await page.screenshot({
      path: info.outputPath(`${i}-${path.slice(1) || 'landing'}.png`),
      fullPage: true,
    });
    report.push({
      path,
      overflow: await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      axe: (
        await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()
      ).violations.map((v) => ({ id: v.id, target: v.nodes.map((n) => n.target) })),
    });
  }
  fs.writeFileSync(info.outputPath('audit.json'), JSON.stringify(report, null, 2));
  expect(report.every((r) => !r.overflow)).toBe(true);
  expect(report.flatMap((r) => r.axe)).toEqual([]);
});
