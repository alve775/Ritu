import { expect, test } from '@playwright/test';

test('farm soundscape plays only on request; volume, scenes, hiding, stop and mute control the audio graph', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('ritu-tour-v1', 'seen');
    const audit = {
      contexts: 0,
      loops: 0,
      stopped: 0,
      hidden: false,
      analysers: [] as AnalyserNode[],
    };
    Object.assign(window, { soundAudit: audit });
    Object.defineProperty(document, 'hidden', { get: () => audit.hidden, configurable: true });
    const Base = AudioContext;
    window.AudioContext = class extends Base {
      constructor(...args: ConstructorParameters<typeof AudioContext>) {
        super(...args);
        audit.contexts++;
      }
      createBufferSource() {
        const node = super.createBufferSource();
        const start = node.start.bind(node),
          stop = node.stop.bind(node);
        node.start = (...args) => {
          audit.loops++;
          start(...args);
        };
        node.stop = (...args) => {
          audit.stopped++;
          stop(...args);
        };
        return node;
      }
      createGain() {
        const gain = super.createGain();
        const connect = gain.connect.bind(gain);
        gain.connect = ((destination: AudioNode, ...args: number[]) => {
          if (destination === this.destination) {
            const analyser = this.createAnalyser();
            connect(analyser);
            audit.analysers.push(analyser);
          }
          return connect(destination, ...args);
        }) as typeof gain.connect;
        return gain;
      }
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Reading & sound' }).click();
  const state = () =>
    page.evaluate(() => {
      const a = (
        window as unknown as {
          soundAudit: {
            contexts: number;
            loops: number;
            stopped: number;
            hidden: boolean;
            analysers: AnalyserNode[];
          };
        }
      ).soundAudit;
      const values = new Float32Array(2048);
      a.analysers[0]?.getFloatTimeDomainData(values);
      return {
        contexts: a.contexts,
        loops: a.loops,
        stopped: a.stopped,
        peak: Math.max(...values.map(Math.abs)),
      };
    });
  expect((await state()).contexts).toBe(0);
  await page.getByRole('button', { name: 'Play farm sounds' }).click();
  await expect(page.getByText('Farm sounds are playing', { exact: true })).toBeVisible();
  await expect.poll(async () => (await state()).peak).toBeGreaterThan(0);
  const first = await state();
  await page.getByRole('combobox', { name: 'Soundscape' }).selectOption('evening');
  await expect.poll(async () => (await state()).loops).toBeGreaterThan(first.loops);
  expect((await state()).stopped).toBeGreaterThanOrEqual(1);
  await page.getByRole('slider', { name: 'Sound volume' }).fill('0');
  await expect(page.getByText('Muted · volume is zero')).toBeVisible();
  const silent = await state();
  await page.waitForTimeout(200);
  expect((await state()).loops).toBe(silent.loops);
  await page.getByRole('slider', { name: 'Sound volume' }).fill('60');
  await expect(page.getByText('Farm sounds are playing', { exact: true })).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { soundAudit: { hidden: boolean } }).soundAudit.hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByText('Paused while this tab is hidden')).toBeVisible();
  await page.evaluate(() => {
    (window as unknown as { soundAudit: { hidden: boolean } }).soundAudit.hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect(page.getByText('Farm sounds are playing', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Stop farm sounds' }).click();
  await expect(page.getByText('Farm sounds are off', { exact: true })).toBeVisible();
  const stopped = await state();
  expect(stopped.stopped).toBe(stopped.loops);
  await page.getByRole('button', { name: 'Play farm sounds' }).click();
  await page.getByRole('checkbox', { name: 'Quiet click sounds' }).check();
  await page.getByRole('button', { name: 'Mute all sounds' }).click();
  await expect(page.getByRole('slider', { name: 'Sound volume' })).toHaveValue('0');
  await expect(page.getByRole('checkbox', { name: 'Quiet click sounds' })).not.toBeChecked();
  expect((await state()).stopped).toBe((await state()).loops);
  await page.reload();
  await page.getByRole('button', { name: 'Reading & sound' }).click();
  await expect(page.getByRole('slider', { name: 'Sound volume' })).toHaveValue('0');
  await expect(page.getByRole('combobox', { name: 'Soundscape' })).toHaveValue('evening');
  expect((await state()).contexts).toBe(0);
});

test('denied audio reports a useful error and leaves the planner usable', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ritu-tour-v1', 'seen');
    const Base = AudioContext;
    window.AudioContext = class extends Base {
      resume() {
        return Promise.reject(new DOMException('Blocked', 'NotAllowedError'));
      }
    };
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Reading & sound' }).click();
  await page.getByRole('button', { name: 'Play farm sounds' }).click();
  await expect(page.getByText('Audio unavailable. Try again or use Ritu silently.')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('link', { name: 'Edit farm', exact: true }).click();
  await page.getByLabel('Farm name', { exact: true }).fill('My quiet farm');
  await expect(page.getByLabel('Farm name', { exact: true })).toHaveValue('My quiet farm');
});
