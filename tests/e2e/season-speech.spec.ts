import { test, expect, type Page } from '@playwright/test';
import { stepsForPageTour } from '../../src/data/tours';

async function open(page: Page, empty = false) {
  await page.addInitScript((empty) => {
    localStorage.setItem(
      'ritu-page-tours-v1',
      JSON.stringify(['/farms', '/farm', '/crops', '/plan']),
    );
    const english = {
      voiceURI: 'qa-en-1',
      name: 'QA English',
      lang: 'en-US',
      localService: true,
      default: true,
    };
    const bangla = { ...english, voiceURI: 'qa-bn', name: 'QA Bangla', lang: 'bn-BD' };
    const audit = {
      voices: empty
        ? []
        : [english, { ...english, voiceURI: 'qa-en-2', name: 'QA English 2' }, bangla],
      calls: [] as { text: string; lang: string; voice: string; volume: number }[],
      cancelled: 0,
      fail: false,
    };
    Object.assign(window, { speechAudit: audit });
    class Utterance {
      text: string;
      lang = '';
      voice: { voiceURI: string } | null = null;
      rate = 1;
      volume = 1;
      onstart: ((e: Event) => void) | null = null;
      onend: ((e: Event) => void) | null = null;
      onerror: ((e: Event) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }
    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: Utterance,
    });
    const events = new EventTarget();
    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        getVoices: () => audit.voices,
        addEventListener: events.addEventListener.bind(events),
        removeEventListener: events.removeEventListener.bind(events),
        dispatchEvent: events.dispatchEvent.bind(events),
        cancel: () => {
          audit.cancelled++;
        },
        speak: (u: Utterance) => {
          audit.calls.push({
            text: u.text,
            lang: u.lang,
            voice: u.voice?.voiceURI ?? '',
            volume: u.volume,
          });
          if (audit.fail) u.onerror?.(new Event('error'));
          else u.onstart?.(new Event('start'));
        },
      },
    });
  }, empty);
  await page.route('https://tile.openstreetmap.org/**', (r) => r.abort());
  await page.goto('/farm');
  await page.getByRole('button', { name: 'Take a tour', exact: true }).click();
  await expect(page.locator('.tour-card')).toHaveAttribute('aria-busy', 'false');
}
async function audit(page: Page) {
  return page.evaluate(() => {
    const a = (
      window as unknown as {
        speechAudit: {
          calls: { text: string; lang: string; voice: string; volume: number }[];
          cancelled: number;
        };
      }
    ).speechAudit;
    return { calls: a.calls, cancelled: a.cancelled };
  });
}
test.afterEach(async ({ page }) => {
  expect((await page.pageErrors()).map((e) => e.message)).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true,
  );
});

test('read aloud uses the visible step and selected voice; changing steps cancels the old utterance', async ({
  page,
}) => {
  await open(page);
  const card = page.locator('.tour-card');
  expect((await audit(page)).calls).toHaveLength(0);
  await card.getByRole('button', { name: 'Read this step aloud', exact: true }).click();
  await expect(card.getByText('Reading this step aloud', { exact: true })).toBeVisible();
  expect((await audit(page)).calls[0].text).toBe(
    `${stepsForPageTour('/farm')[0].title.en}. ${stepsForPageTour('/farm')[0].description.en}`,
  );
  await card.getByLabel('Narration voice', { exact: true }).selectOption('qa-en-2');
  expect((await audit(page)).cancelled).toBe(1);
  await card.getByRole('button', { name: 'Read this step aloud', exact: true }).click();
  expect((await audit(page)).calls.at(-1)?.voice).toBe('qa-en-2');
  await card.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(card).toHaveAttribute('aria-busy', 'false');
  expect((await audit(page)).cancelled).toBe(2);
  await expect(card.getByRole('button', { name: 'Stop speaking', exact: true })).toBeDisabled();
  await card.getByRole('button', { name: 'Read this step aloud', exact: true }).click();
  expect((await audit(page)).calls.at(-1)?.text).toContain('Area and next season');
  await card.getByRole('button', { name: 'Close tour', exact: true }).click();
  expect((await audit(page)).cancelled).toBe(3);
});

test('Bangla text uses a Bangla voice and global mute stops speech', async ({ page }) => {
  await open(page);
  const card = page.locator('.tour-card');
  await card.locator('.tour-languages').getByRole('button', { name: 'বাংলা', exact: true }).click();
  await expect(card).toHaveAttribute('aria-busy', 'false');
  await card.getByRole('button', { name: 'এই ধাপ শুনুন', exact: true }).click();
  expect((await audit(page)).calls.at(-1)).toMatchObject({ lang: 'bn-BD', voice: 'qa-bn' });
  expect((await audit(page)).calls.at(-1)?.text).toContain(stepsForPageTour('/farm')[0].title.bn);
  await page.evaluate(() => window.dispatchEvent(new Event('ritu-audio-mute')));
  await expect(card.getByRole('button', { name: 'কথা বন্ধ করুন', exact: true })).toBeDisabled();
  expect((await audit(page)).cancelled).toBe(1);
});

test('missing voices stay unavailable until the browser reports a real matching voice', async ({
  page,
}) => {
  await open(page, true);
  const card = page.locator('.tour-card');
  await expect(
    card.getByRole('button', { name: 'Read this step aloud', exact: true }),
  ).toBeDisabled();
  await expect(card).toContainText('No English voice is available');
  expect((await audit(page)).calls).toHaveLength(0);
  await page.evaluate(() => {
    const a = (window as unknown as { speechAudit: { voices: unknown[] } }).speechAudit;
    a.voices = [
      {
        voiceURI: 'arrived-en',
        name: 'New English voice',
        lang: 'en-GB',
        localService: true,
        default: true,
      },
    ];
    window.speechSynthesis.dispatchEvent(new Event('voiceschanged'));
  });
  await expect(
    card.getByRole('button', { name: 'Read this step aloud', exact: true }),
  ).toBeEnabled();
  await card.getByRole('button', { name: 'Read this step aloud', exact: true }).click();
  expect((await audit(page)).calls.at(-1)?.voice).toBe('arrived-en');
  await card.locator('.tour-languages').getByRole('button', { name: 'বাংলা', exact: true }).click();
  await expect(card).toHaveAttribute('aria-busy', 'false');
  await expect(card.getByRole('button', { name: 'এই ধাপ শুনুন', exact: true })).toBeDisabled();
  await expect(card).toContainText('বাংলা কণ্ঠ এই ব্রাউজারে নেই');
  expect((await audit(page)).calls).toHaveLength(1);
});

test('speech errors are exposed rather than claiming successful playback', async ({ page }) => {
  await open(page);
  const card = page.locator('.tour-card');
  await page.evaluate(() => {
    (window as unknown as { speechAudit: { fail: boolean } }).speechAudit.fail = true;
  });
  await card.getByRole('button', { name: 'Read this step aloud', exact: true }).click();
  await expect(card).toContainText('Speech could not start');
  await expect(card.getByRole('button', { name: 'Stop speaking', exact: true })).toBeDisabled();
  await expect(
    card.getByRole('button', { name: 'Read this step aloud', exact: true }),
  ).toBeEnabled();
});
