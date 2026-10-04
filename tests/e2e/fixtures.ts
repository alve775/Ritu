import type { Page } from '@playwright/test';
import { defaultFarm } from '../../src/data/preview';
import { defaultDemo } from '../../src/data/demo-environment';
import { initialState } from '../../src/lib/storage';
import { generateDemoPlans, farmFingerprint, planFingerprint } from '../../src/domain/demo-planner';

export async function seedPlan(page: Page) {
  const plan = generateDemoPlans(defaultFarm, defaultDemo, 'water')[0];
  await page.addInitScript(
    (data) => {
      localStorage.setItem('ritu-tour-v1', 'seen');
      if (localStorage.getItem('ritu-preview-v1')) return;
      localStorage.setItem('ritu-preview-v1', JSON.stringify(data.planner));
      localStorage.setItem('ritu-demo-v1', JSON.stringify(data.demo));
      localStorage.setItem('ritu-journey-v1', JSON.stringify(data.journey));
    },
    {
      planner: { ...initialState, selected: plan.id },
      demo: { ...defaultDemo, enabled: true },
      journey: {
        reviewed: farmFingerprint(defaultFarm, defaultDemo, 'water'),
        generatedFor: planFingerprint(defaultFarm, defaultDemo, 'water'),
        tracked: null,
      },
    },
  );
}
export async function chooseDefaultCrops(page: Page) {
  await page.getByRole('button', { name: 'See suggested crops', exact: true }).click();
  for (const crop of ['Mung bean', 'Aman rice', 'Mustard'])
    await page.getByRole('checkbox', { name: `Consider ${crop}`, exact: true }).check();
  await page.getByRole('button', { name: 'Build my calendar', exact: true }).click();
}
