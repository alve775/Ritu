import { expect, test } from '@playwright/test';
import { stepsForTour, type TourScope } from '../../src/data/tours';

for (const language of ['en', 'bn'] as const) {
  test(`every step in all five tours has useful unobscured focus · ${language}`, async ({
    page,
  }, info) => {
    test.setTimeout(180000);
    const width =
      info.project.name === 'mobile'
        ? language === 'bn'
          ? 320
          : 412
        : language === 'bn'
          ? 1000
          : 1440;
    await page.setViewportSize({ width, height: 1000 });
    if (language === 'bn') await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.addInitScript(
      ({ language }) => {
        localStorage.setItem('ritu-tour-v1', 'seen');
        localStorage.setItem(
          'ritu-display-v1',
          JSON.stringify({
            text: language === 'bn' ? 'larger' : 'comfortable',
            motion: true,
            sound: false,
          }),
        );
      },
      { language },
    );
    await page.goto('/');
    await expect(page.getByText('Saved on this device')).toBeVisible();
    if (language === 'bn') await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const saved = await page.evaluate(() => localStorage.getItem('ritu-preview-v1'));
    const choices = {
      full: language === 'en' ? 'Full mission tour' : 'সম্পূর্ণ পরিচিতি',
      farm: language === 'en' ? 'Your farm' : 'আপনার খামার',
      compare: language === 'en' ? 'Compare rotations' : 'ফসলক্রম তুলনা',
      field: language === 'en' ? 'Interactive field' : 'জমির ইন্টারঅ্যাকটিভ দৃশ্য',
      insights: language === 'en' ? 'Your choice, explained' : 'আপনার সিদ্ধান্তের ব্যাখ্যা',
    };
    for (const scope of Object.keys(choices) as TourScope[]) {
      await page.locator('[data-tour-launch]').click();
      await page
        .getByRole('dialog')
        .getByRole('button', { name: new RegExp(choices[scope]) })
        .click();
      const steps = stepsForTour(scope);
      for (const [index, step] of steps.entries()) {
        await test.step(`${scope} ${index + 1}: ${step.id}`, async () => {
          const card = page.locator('.tour-card');
          await expect(card).toHaveAttribute('aria-busy', 'false');
          await expect(page.locator('#tour-title')).toHaveAccessibleName(step.title[language]);
          const c = (await card.boundingBox())!;
          expect(c.x).toBeGreaterThanOrEqual(0);
          expect(c.y).toBeGreaterThanOrEqual(0);
          expect(c.x + c.width).toBeLessThanOrEqual(width + 1);
          expect(c.y + c.height).toBeLessThanOrEqual(1001);
          if (step.target) {
            const light = (await page.locator('.tour-spotlight').boundingBox())!;
            const target = (await page.locator(step.target).boundingBox())!;
            const overlapWidth = Math.max(
              0,
              Math.min(c.x + c.width, light.x + light.width) - Math.max(c.x, light.x),
            );
            const overlapHeight = Math.max(
              0,
              Math.min(c.y + c.height, light.y + light.height) - Math.max(c.y, light.y),
            );
            expect(overlapWidth * overlapHeight, `${step.id}: guide covers spotlight`).toBe(0);
            const visibleHeight = Math.max(
              0,
              Math.min(target.y + target.height, light.y + light.height) -
                Math.max(target.y, light.y),
            );
            expect(visibleHeight, `${step.id}: useful section height`).toBeGreaterThanOrEqual(
              Math.min(140, target.height * 0.8),
            );
            expect(light.width, `${step.id}: useful section width`).toBeGreaterThanOrEqual(
              Math.min(220, target.width * 0.8),
            );
            if (step.id === 'calendars') {
              const timeline = (await page
                .locator('.calendar-board .timeline')
                .first()
                .boundingBox())!;
              expect(timeline.y).toBeLessThan(light.y + light.height);
              expect(timeline.y + timeline.height).toBeGreaterThan(light.y);
              const scroll = await page.locator(step.target).evaluate((el) => el.scrollLeft);
              const pan = page.getByRole('button', {
                name: language === 'en' ? 'Later calendar months' : 'ক্যালেন্ডারের পরের মাস',
              });
              if (await pan.count()) {
                await pan.click();
                await expect
                  .poll(() => page.locator(step.target!).evaluate((el) => el.scrollLeft))
                  .toBeGreaterThan(scroll);
              }
            }
            const lower = page.getByRole('button', {
              name: language === 'en' ? 'Show lower part of section' : 'অংশের নিচের ভাগ দেখুন',
            });
            if (await lower.count()) {
              const scroll = await page.evaluate(() => scrollY);
              await lower.click();
              await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(scroll);
              await page
                .getByRole('button', {
                  name: language === 'en' ? 'Show upper part of section' : 'অংশের ওপরের ভাগ দেখুন',
                })
                .click();
            }
            if (step.id === 'selection' && width >= 1200) {
              const action = (await page.locator('.choice-panel .button').boundingBox())!;
              expect(action.x + action.width).toBeLessThan(c.x);
              expect(action.y).toBeGreaterThanOrEqual(light.y);
              expect(action.y + action.height).toBeLessThanOrEqual(light.y + light.height);
            }
          }
          await page.screenshot({
            scale: 'css',
            path: info.outputPath(`${scope}-${String(index + 1).padStart(2, '0')}-${step.id}.png`),
          });
          const next = page.locator('.tour-card-actions > div > button').last();
          const nextBox = (await next.boundingBox())!;
          expect(nextBox.y + nextBox.height).toBeLessThanOrEqual(1001);
          await next.click();
        });
      }
      await expect(page.locator('.tour-dialog')).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.dataset.tourLayout),
      ).toBeUndefined();
    }
    expect(await page.evaluate(() => localStorage.getItem('ritu-preview-v1'))).toBe(saved);
    expect(errors).toEqual([]);
  });
}
