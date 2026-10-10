'use client';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Settings2 } from 'lucide-react';
import { displayStore } from '../lib/display-store';
import { usePlanner } from './planner-provider';
import { Dialog } from './dialog';
import { FarmAudio } from '../lib/farm-audio';
import type { AudioStatus } from '../lib/farm-audio';

export function ReadingControls() {
  const { t } = usePlanner();
  const { preferences, saved } = useSyncExternalStore(
    displayStore.subscribe,
    displayStore.getSnapshot,
    displayStore.getServerSnapshot,
  );
  const [open, setOpen] = useState(false);
  const audio = useRef<FarmAudio | null>(null);
  const [audioStatus, setAudioStatus] = useState<AudioStatus>('off');
  useEffect(() => {
    const engine = new FarmAudio(displayStore.getSnapshot().preferences, setAudioStatus);
    audio.current = engine;
    const click = (event: MouseEvent) => {
      if (
        document.hidden ||
        !(event.target instanceof Element) ||
        !event.target.closest('button, summary, input, select')
      )
        return;
      // Read the store in this event: muting takes effect on the same click.
      engine.update(displayStore.getSnapshot().preferences);
      void engine.click();
    };
    const visibility = () => engine.visibility();
    document.addEventListener('click', click);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      document.removeEventListener('click', click);
      document.removeEventListener('visibilitychange', visibility);
      engine.dispose();
      audio.current = null;
    };
  }, []);
  useEffect(() => {
    audio.current?.update(preferences);
  }, [preferences]);
  const statusText: Record<AudioStatus, string> = {
    off: t('Farm sounds are off', 'মাঠের শব্দ বন্ধ'),
    playing: t('Farm sounds are playing', 'মাঠের শব্দ চলছে'),
    paused: t('Paused while this tab is hidden', 'ট্যাব আড়ালে থাকায় বিরতি'),
    muted: t('Muted · volume is zero', 'নিঃশব্দ · শব্দের মাত্রা শূন্য'),
    unavailable: t(
      'Audio unavailable. Try again or use Ritu silently.',
      'শব্দ চালানো যায়নি। আবার চেষ্টা করুন বা শব্দ ছাড়া ব্যবহার করুন।',
    ),
  };
  return (
    <>
      <button className="button secondary reading-launch" onClick={() => setOpen(true)}>
        <Settings2 size={20} />
        {t('Reading & sound', 'পড়া ও শব্দ')}
      </button>
      {open && (
        <Dialog
          title={t('Make Ritu easier to read', 'ঋতু সহজে পড়ার ব্যবস্থা')}
          onClose={() => setOpen(false)}
        >
          <fieldset className="reading-size">
            <legend>{t('Text size', 'লেখার আকার')}</legend>
            {(['comfortable', 'larger'] as const).map((size) => (
              <label key={size}>
                <input
                  type="radio"
                  name="reading-size"
                  checked={preferences.text === size}
                  onChange={() => displayStore.update({ text: size })}
                />
                {size === 'comfortable' ? t('Large', 'বড়') : t('Extra large', 'আরও বড়')}
              </label>
            ))}
          </fieldset>
          <label className="setting-check">
            <input
              type="checkbox"
              checked={preferences.motion}
              onChange={(event) => displayStore.update({ motion: event.target.checked })}
            />
            {t('Animate transitions and tour text', 'পরিবর্তন ও পরিচিতির লেখায় অ্যানিমেশন')}
          </label>
          <fieldset className="farm-sound-controls">
            <legend>{t('Farm sounds', 'মাঠের শব্দ')}</legend>
            <p>
              {t(
                'Original synthesized wind and bird-like or insect-like calls. Optional atmosphere, not a field recording.',
                'নিজেদের তৈরি বাতাস ও পাখি বা পোকামাকড়ের মতো শব্দ। ঐচ্ছিক আবহ, বাস্তব রেকর্ডিং নয়।',
              )}
            </p>
            <label>
              {t('Soundscape', 'শব্দের আবহ')}
              <select
                value={preferences.ambience}
                onChange={(event) =>
                  displayStore.update({ ambience: event.target.value as 'morning' | 'evening' })
                }
              >
                <option value="morning">
                  {t('Morning field · wind & birds', 'সকালের জমি · বাতাস ও পাখি')}
                </option>
                <option value="evening">
                  {t('Evening field · wind & insects', 'সন্ধ্যার জমি · বাতাস ও পোকামাকড়')}
                </option>
              </select>
            </label>
            <label>
              {t('Sound volume', 'শব্দের মাত্রা')} · {preferences.volume}%
              <input
                type="range"
                aria-label={t('Sound volume', 'শব্দের মাত্রা')}
                min="0"
                max="100"
                step="5"
                value={preferences.volume}
                onChange={(event) => displayStore.update({ volume: Number(event.target.value) })}
              />
            </label>
            <div className="button-row">
              <button className="button primary" onClick={() => void audio.current?.start()}>
                {t('Play farm sounds', 'মাঠের শব্দ চালান')}
              </button>
              <button className="button secondary" onClick={() => audio.current?.stop()}>
                {t('Stop farm sounds', 'মাঠের শব্দ বন্ধ করুন')}
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  audio.current?.stop();
                  displayStore.update({ sound: false, volume: 0 });
                }}
              >
                {t('Mute all sounds', 'সব শব্দ বন্ধ করুন')}
              </button>
            </div>
            <p role="status">{statusText[audioStatus]}</p>
            <label className="setting-check">
              <input
                type="checkbox"
                checked={preferences.sound}
                onChange={(event) => displayStore.update({ sound: event.target.checked })}
              />
              {t('Quiet click sounds', 'হালকা ক্লিকের শব্দ')}
            </label>
          </fieldset>
          <p>
            {t(
              'Sound is optional. Every result is also shown as text. Your device’s reduced-motion preference takes priority.',
              'শব্দ ঐচ্ছিক। প্রতিটি ফলাফল লেখায়ও দেখানো হয়। ডিভাইসের কম গতির পছন্দ আগে মানা হবে।',
            )}
          </p>
          {!saved && (
            <p role="status">
              {t(
                'These settings work in this tab but could not be saved.',
                'এই ট্যাবে ব্যবস্থা কাজ করবে, তবে সংরক্ষণ করা যায়নি।',
              )}
            </p>
          )}
        </Dialog>
      )}
    </>
  );
}
