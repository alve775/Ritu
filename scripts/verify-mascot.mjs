import { chromium, expect } from '@playwright/test';

const browser = await chromium.launch();
try {
  for (const viewport of [
    { width: 1440, height: 1000 },
    { width: 320, height: 800 },
  ]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'no-preference' });
    await page.goto(process.argv[2] ?? 'http://127.0.0.1:3004');
    const guide = page.getByRole('button', { name: 'Say hello to Mati, the farm guide' });
    const wing = page.locator('.guide-wing');
    await expect(guide).toBeVisible();
    // Let the step greeting finish so it cannot be mistaken for the click wave.
    await wing.evaluate((element) => Promise.all(element.getAnimations().map((a) => a.finished)));
    await guide.focus();
    await page.keyboard.press('Enter');
    const waves = await wing.evaluate((element) =>
      element.getAnimations().map((a) => {
        const timing = a.effect.getTiming();
        return { duration: timing.duration, iterations: timing.iterations };
      }),
    );
    expect(waves).toContainEqual({ duration: 800, iterations: 1 });
    await wing.evaluate((element) => Promise.all(element.getAnimations().map((a) => a.finished)));
    expect(await wing.evaluate((element) => element.getAnimations().length)).toBe(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await guide.focus();
    await page.keyboard.press('Enter');
    expect(await wing.evaluate((element) => element.getAnimations().length)).toBe(0);
    console.log(
      `PASS: Mati keyboard wave is finite; reduced motion disables it (${viewport.width}px)`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}
