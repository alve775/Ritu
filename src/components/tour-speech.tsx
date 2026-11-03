'use client';
import { useEffect, useRef, useState } from 'react';
import { Volume2, Square } from 'lucide-react';
import { usePlanner } from './planner-provider';
import { displayStore } from '../lib/display-store';

/** Reads the actual visible guide text. No fabricated voice or autoplay claim. */
export function TourSpeech({ text }: { text: string }) {
  const { t, language } = usePlanner();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [supported, setSupported] = useState(false);
  const [chosen, setChosen] = useState('');
  const [status, setStatus] = useState<'idle' | 'starting' | 'playing' | 'error'>('idle');
  const active = useRef<SpeechSynthesisUtterance | null>(null);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => {
    if (timeout.current) clearTimeout(timeout.current);
    if (active.current) {
      active.current = null;
      window.speechSynthesis?.cancel();
    }
    setStatus('idle');
  };
  useEffect(() => {
    if (!window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== 'function') return;
    const synth = window.speechSynthesis;
    const refresh = () => {
      setSupported(true);
      setVoices(synth.getVoices());
    };
    refresh();
    synth.addEventListener('voiceschanged', refresh);
    const mute = () => stop();
    const visibility = () => {
      if (document.hidden) stop();
    };
    window.addEventListener('ritu-audio-mute', mute);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      synth.removeEventListener('voiceschanged', refresh);
      window.removeEventListener('ritu-audio-mute', mute);
      document.removeEventListener('visibilitychange', visibility);
      if (timeout.current) clearTimeout(timeout.current);
      if (active.current) {
        active.current = null;
        synth.cancel();
      }
    };
  }, []);
  const matching = voices.filter(
    (v) => v.lang.toLowerCase().replace('_', '-').split('-')[0] === language,
  );
  const voice = matching.find((v) => v.voiceURI === chosen) ?? matching[0];
  return (
    <div className="tour-speech">
      <div className="button-row">
        <button
          className="button secondary"
          type="button"
          disabled={!supported || !voice || status === 'starting' || status === 'playing'}
          onClick={() => {
            stop();
            if (!voice) return;
            if (!displayStore.getSnapshot().preferences.volume) displayStore.update({ volume: 35 });
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = voice;
            utterance.lang = voice.lang;
            utterance.rate = 0.95;
            utterance.volume = displayStore.getSnapshot().preferences.volume / 100;
            active.current = utterance;
            setStatus('starting');
            const finish = (failed: boolean) => {
              if (active.current !== utterance) return;
              if (timeout.current) clearTimeout(timeout.current);
              active.current = null;
              setStatus(failed ? 'error' : 'idle');
            };
            utterance.onstart = () => {
              if (active.current === utterance) {
                if (timeout.current) clearTimeout(timeout.current);
                setStatus('playing');
              }
            };
            utterance.onend = () => finish(false);
            utterance.onerror = () => finish(true);
            timeout.current = setTimeout(() => {
              if (active.current === utterance) {
                active.current = null;
                window.speechSynthesis.cancel();
                setStatus('error');
              }
            }, 5000);
            try {
              window.speechSynthesis.speak(utterance);
            } catch {
              finish(true);
            }
          }}
        >
          <Volume2 size={16} />
          {t('Read this step aloud', 'এই ধাপ শুনুন')}
        </button>
        <button
          className="button secondary"
          type="button"
          disabled={status !== 'starting' && status !== 'playing'}
          onClick={stop}
        >
          <Square size={14} />
          {t('Stop speaking', 'কথা বন্ধ করুন')}
        </button>
      </div>
      {matching.length > 1 && (
        <label>
          {t('Narration voice', 'পরিচিতির কণ্ঠ')}
          <select
            aria-label={t('Narration voice', 'পরিচিতির কণ্ঠ')}
            value={voice?.voiceURI ?? ''}
            onChange={(e) => {
              stop();
              setChosen(e.target.value);
            }}
          >
            {matching.map((v) => (
              <option key={v.voiceURI} value={v.voiceURI}>
                {v.name} · {v.lang}
              </option>
            ))}
          </select>
        </label>
      )}
      <p role="status" className="field-help">
        {!supported
          ? t(
              'Spoken narration is unavailable in this browser.',
              'এই ব্রাউজারে কথা শোনানো যায় না।',
            )
          : !voice
            ? t(
                `No ${language === 'bn' ? 'Bangla' : 'English'} voice is available in this browser. Check your device’s speech-language settings.`,
                `${language === 'bn' ? 'বাংলা' : 'ইংরেজি'} কণ্ঠ এই ব্রাউজারে নেই। ডিভাইসের কথার ভাষার ব্যবস্থা দেখুন।`,
              )
            : status === 'error'
              ? t(
                  'Speech could not start. Try again or choose another available voice.',
                  'কথা শুরু করা যায়নি। আবার চেষ্টা করুন বা অন্য কণ্ঠ বাছুন।',
                )
              : status === 'starting'
                ? t('Starting narration…', 'কথা শুরু হচ্ছে…')
                : status === 'playing'
                  ? t('Reading this step aloud', 'এই ধাপ পড়ে শোনানো হচ্ছে')
                  : t(`Browser voice: ${voice.name}`, `ব্রাউজারের কণ্ঠ: ${voice.name}`)}
      </p>
      {supported && !voice && (
        <button
          className="text-button"
          type="button"
          onClick={() => setVoices(window.speechSynthesis.getVoices())}
        >
          {t('Check voices again', 'আবার কণ্ঠ দেখুন')}
        </button>
      )}
    </div>
  );
}
