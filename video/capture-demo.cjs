// Capture only public-facing demo UI in an isolated browser. No user storage is reused.
const { chromium } = require('@playwright/test');
const fs = require('node:fs/promises');
const path = require('node:path');
const out = path.resolve('research/pitch/captures');
(async () => {
  await fs.mkdir(out, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    args: ['--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: out, size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
  const marks = [];
  const started = Date.now();
  async function shot(name, locator) {
    if (locator) await locator.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1300);
    await page.screenshot({ path: path.join(out, `${name}.png`) });
    marks.push({ name, seconds: (Date.now() - started) / 1000, url: page.url() });
    console.log(name);
    await page.waitForTimeout(2200);
  }
  try {
    await page.goto('http://127.0.0.1:3000/farm');
    await page.getByRole('heading', { name: 'Start with your farm', exact: true }).waitFor();
    await shot('01-farm');
    await shot('02-soil-water', page.getByRole('combobox', { name: 'Soil texture', exact: true }));
    await page.getByText('Your priorities, household & help', { exact: true }).click();
    await shot(
      '03-priorities',
      page.getByText('Your priorities, household & help', { exact: true }),
    );
    await page.getByRole('button', { name: 'See suggested crops', exact: true }).click();
    await shot('04-crops');
    console.log(
      'AVAILABLE',
      await page
        .getByRole('checkbox')
        .evaluateAll((es) =>
          es.map((e) => e.getAttribute('aria-label') || e.labels?.[0]?.textContent),
        ),
    );
    for (const crop of ['Mung bean', 'Aman rice', 'Mustard', 'Sesame', 'Lentil']) {
      const box = page.getByRole('checkbox', { name: `Consider ${crop}`, exact: true });
      if (await box.count()) {
        await box.check();
        await page.waitForTimeout(400);
      }
    }
    await shot('05-choose', page.getByRole('button', { name: 'Build my calendar', exact: true }));
    await page.getByRole('button', { name: 'Build my calendar', exact: true }).click();
    await shot('06-plans', page.locator('.option-card').first());
    await page.getByRole('button', { name: 'All options', exact: true }).click();
    await shot('07-calendar', page.locator('.calendar-board'));
    await page.getByRole('link', { name: 'Understand this choice', exact: true }).click();
    await shot('08-reasons', page.locator('.demo-check').first());
    await page.getByRole('link', { name: 'Back to comparison', exact: true }).click();
    await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
    const crop = page.locator('.tracking-crops > section').first();
    await shot('09-track', crop);
    await crop.getByRole('checkbox', { name: 'Planted', exact: true }).check();
    await crop
      .getByRole('textbox', { name: 'Notes', exact: true })
      .fill('Demo note: planting recorded by our family.');
    await shot('10-record', crop);
    await page.goto('http://127.0.0.1:3000/plan');
    await page.getByRole('button', { name: 'Open field view', exact: true }).click();
    await page.locator('.field-viewport[data-renderer="ready"]').waitFor({ timeout: 30000 });
    await shot('11-3d', page.locator('.field-viewport'));
    await page.getByRole('button', { name: 'View field from above' }).click();
    await shot('12-3d-above', page.locator('.field-viewport'));
    await page.getByRole('link', { name: 'Try a water-shortage scenario', exact: true }).click();
    await shot(
      '13-scenario',
      page.getByRole('combobox', { name: 'Scenario irrigation', exact: true }),
    );
    await page
      .getByRole('combobox', { name: 'Scenario irrigation', exact: true })
      .selectOption('severe');
    await shot(
      '14-scenario-change',
      page.getByRole('button', { name: 'Apply scenario', exact: true }),
    );
    await page.getByRole('combobox', { name: 'Scenario climate', exact: true }).selectOption('dry');
    await shot(
      '15-scenario-blocker',
      page.getByRole('button', { name: 'Apply scenario', exact: true }),
    );
    await page.goto('http://127.0.0.1:3000/farm');
    await page.getByRole('button', { name: 'বাংলা', exact: true }).click();
    await shot('16-bangla');
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await page.getByRole('button', { name: 'Take a tour', exact: true }).click();
    console.log('TOUR MENU', (await page.locator('body').innerText()).slice(-5000));
    await shot('17-help');
  } finally {
    const video = page.video();
    await context.close();
    if (video) await video.saveAs(path.join(out, 'real-workflow.webm'));
    await browser.close();
    await fs.writeFile(
      path.join(out, 'capture-receipt.json'),
      JSON.stringify({ marks, errors, viewport: '1440x900', isolated: true }, null, 2),
    );
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
