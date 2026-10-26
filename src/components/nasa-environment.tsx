'use client';
import { useEffect, useRef, useState } from 'react';
import { CloudSun, Download, MapPin, RefreshCw } from 'lucide-react';
import { climateFor } from '../data/demo-environment';
import { validPowerClimate } from '../domain/nasa-power';
import { months } from '../data/preview';
import { usePlanner } from './legacy-planner-provider';

export function NasaEnvironment({
  onPendingChange,
}: {
  onPendingChange?: (pending: boolean) => void;
}) {
  const { t, language, demo, setDemo } = usePlanner();
  const climate = climateFor(demo);
  const [draft, setDraft] = useState({
    latitude: String(climate.latitude),
    longitude: String(climate.longitude),
    year: String(climate.year),
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  const controller = useRef<AbortController | null>(null);
  const changeDraft = (next: typeof draft) => {
    controller.current?.abort();
    setStatus('idle');
    setDraft(next);
    onPendingChange?.(
      Number(next.latitude) !== climate.latitude ||
        Number(next.longitude) !== climate.longitude ||
        Number(next.year) !== climate.year ||
        !next.latitude.trim() ||
        !next.longitude.trim(),
    );
  };
  const preset =
    draft.latitude === '24.37' && draft.longitude === '88.6'
      ? 'rajshahi'
      : draft.latitude === '24.81' && draft.longitude === '88.95'
        ? 'naogaon'
        : 'custom';
  useEffect(() => () => controller.current?.abort(), []);
  const annualRain = climate.months.reduce((sum, m) => sum + m.rain, 0);
  const days = climate.months.reduce((sum, m) => sum + m.days, 0);
  const temperature = climate.months.reduce((sum, m) => sum + m.temperature * m.days, 0) / days;
  const wetness = climate.months.reduce((sum, m) => sum + m.wetness * m.days, 0) / days;
  const valid =
    draft.latitude.trim() !== '' &&
    draft.longitude.trim() !== '' &&
    Number(draft.latitude) >= 20.5 &&
    Number(draft.latitude) <= 26.7 &&
    Number(draft.longitude) >= 88 &&
    Number(draft.longitude) <= 92.7 &&
    Number.isInteger(Number(draft.year)) &&
    Number(draft.year) >= 1981 &&
    Number(draft.year) < new Date().getUTCFullYear();
  return (
    <section
      className="card form-card nasa-environment demo-environment"
      id="demo-environment"
      aria-labelledby="environment-title"
    >
      <div className="demo-section-heading">
        <div>
          <span className="eyebrow">
            <MapPin size={18} />
            {t('LOCATION & NASA HISTORY', 'স্থান ও নাসার ইতিহাস')}
          </span>
          <h2 id="environment-title">{t('Where is your farm?', 'আপনার জমি কোথায়?')}</h2>
        </div>
        <span className="source-badge">NASA POWER · {climate.year}</span>
      </div>
      <p>
        {t(
          'Start with Rajshahi, or load another location in Bangladesh. Coordinates select a regional weather grid, not a surveyed field.',
          'রাজশাহী দিয়ে শুরু করুন, অথবা বাংলাদেশের অন্য স্থান দিন। স্থানাঙ্ক আঞ্চলিক আবহাওয়ার গ্রিড বেছে নেয়, জরিপের জমি নয়।',
        )}
      </p>
      <div className="demo-controls climate-location-controls">
        <label>
          {t('Location', 'স্থান')}
          <select
            aria-label={t('Pilot location', 'পাইলট স্থান')}
            value={preset}
            onChange={(e) => {
              if (e.target.value === 'rajshahi')
                changeDraft({ ...draft, latitude: '24.37', longitude: '88.6' });
              else if (e.target.value === 'naogaon')
                changeDraft({ ...draft, latitude: '24.81', longitude: '88.95' });
              else changeDraft({ ...draft, latitude: '', longitude: '' });
            }}
          >
            <option value="rajshahi">{t('Rajshahi · pilot', 'রাজশাহী · পাইলট')}</option>
            <option value="naogaon">{t('Naogaon', 'নওগাঁ')}</option>
            <option value="custom">{t('Enter coordinates', 'স্থানাঙ্ক দিন')}</option>
          </select>
        </label>
        {preset === 'custom' && (
          <>
            <label>
              {t('Latitude · north', 'অক্ষাংশ · উত্তর')}
              <input
                type="number"
                step="0.01"
                min="20.5"
                max="26.7"
                value={draft.latitude}
                onChange={(e) => changeDraft({ ...draft, latitude: e.target.value })}
              />
            </label>
            <label>
              {t('Longitude · east', 'দ্রাঘিমাংশ · পূর্ব')}
              <input
                type="number"
                step="0.01"
                min="88"
                max="92.7"
                value={draft.longitude}
                onChange={(e) => changeDraft({ ...draft, longitude: e.target.value })}
              />
            </label>
          </>
        )}
        <label>
          {t('Historical year', 'ইতিহাসের বছর')}
          <input
            type="number"
            min="1981"
            max={new Date().getUTCFullYear() - 1}
            step="1"
            value={draft.year}
            onChange={(e) => changeDraft({ ...draft, year: e.target.value })}
          />
        </label>
      </div>
      {!valid && (
        <p className="field-error">
          {t(
            'Enter coordinates within Bangladesh and a complete past year (1981 onward).',
            'বাংলাদেশের স্থানাঙ্ক ও অতীতের সম্পূর্ণ বছর দিন (১৯৮১ থেকে)।',
          )}
        </p>
      )}
      <div className="button-row">
        <button
          className="button secondary"
          disabled={!valid || status === 'loading'}
          onClick={async () => {
            controller.current?.abort();
            const abort = new AbortController();
            controller.current = abort;
            setStatus('loading');
            try {
              const query = new URLSearchParams({
                latitude: draft.latitude,
                longitude: draft.longitude,
                year: draft.year,
              });
              const response = await fetch(`/api/climate?${query}`, { signal: abort.signal });
              const body = await response.json();
              if (!response.ok || !validPowerClimate(body.climate))
                throw new Error('NASA validation failed');
              if (
                body.climate.latitude !== Number(Number(draft.latitude).toFixed(2)) ||
                body.climate.longitude !== Number(Number(draft.longitude).toFixed(2)) ||
                body.climate.year !== Number(draft.year)
              )
                throw new Error('NASA returned another requested location/year');
              if (!abort.signal.aborted) {
                setDemo({ climate: body.climate, location: 'barind', weather: 'seasonal' });
                setDraft({
                  latitude: String(body.climate.latitude),
                  longitude: String(body.climate.longitude),
                  year: String(body.climate.year),
                });
                onPendingChange?.(false);
                setStatus('loaded');
              }
            } catch {
              if (!abort.signal.aborted) setStatus('error');
            }
          }}
        >
          <RefreshCw size={19} />
          {status === 'loading'
            ? t('Loading NASA history…', 'নাসার ইতিহাস লোড হচ্ছে…')
            : t('Load NASA history', 'নাসার ইতিহাস আনুন')}
        </button>
        <a
          className="text-button"
          href={climate.requestUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Download size={18} />
          {t('Open original NASA record', 'নাসার মূল তথ্য খুলুন')}
        </a>
      </div>
      <p role="status" className={status === 'error' ? 'field-error' : 'climate-load-status'}>
        {status === 'error'
          ? t(
              'NASA could not be reached or returned incomplete data. Your previous verified record is kept; the location below has not changed.',
              'নাসার সংযোগ বা সম্পূর্ণ তথ্য পাওয়া যায়নি। আগের যাচাইকৃত তথ্য রাখা আছে; নিচের স্থান বদলায়নি।',
            )
          : status === 'loaded'
            ? t(
                'NASA history loaded and validated. Review your farm before rebuilding suggestions.',
                'নাসার ইতিহাস এনে যাচাই হয়েছে। নতুন প্রস্তাবের আগে জমির তথ্য দেখুন।',
              )
            : t(
                'Using a verified NASA record saved with this app. Internet is needed only to load a different record.',
                'অ্যাপের সঙ্গে রাখা যাচাইকৃত নাসার তথ্য ব্যবহার হচ্ছে। অন্য তথ্য আনতে ইন্টারনেট লাগে।',
              )}
      </p>
      <div className="climate-active-record">
        <CloudSun size={22} />
        <strong>
          {t('Active record', 'ব্যবহৃত তথ্য')}: {climate.latitude.toFixed(2)}° N,{' '}
          {climate.longitude.toFixed(2)}° E · {climate.year} · {days} {t('days', 'দিন')}
        </strong>
      </div>
      <p className="climate-boundary">
        {t(
          'Real NASA regional history, not a forecast or soil test. Crop rules are experimental and need local review.',
          'বাস্তব নাসার আঞ্চলিক ইতিহাস; পূর্বাভাস বা মাটির পরীক্ষা নয়। ফসলের নিয়ম পরীক্ষামূলক, স্থানীয় যাচাই দরকার।',
        )}
      </p>
      {demo.weather !== 'seasonal' && (
        <p className="notice">
          {t(
            'A hypothetical scenario is active in planning. These source values remain the original NASA history.',
            'পরিকল্পনায় কাল্পনিক পরিস্থিতি চালু আছে। এখানে নাসার মূল ইতিহাসই দেখানো হচ্ছে।',
          )}
        </p>
      )}
      <details className="demo-monthly">
        <summary>{t('Monthly records & source details', 'মাসের তথ্য ও উৎসের বিবরণ')}</summary>
        <dl className="demo-metrics">
          <div>
            <dt>{t('Recorded annual rainfall', 'রেকর্ড করা বার্ষিক বৃষ্টি')}</dt>
            <dd>{annualRain.toFixed(1)} mm</dd>
          </div>
          <div>
            <dt>{t('Mean air temperature', 'গড় বাতাসের তাপমাত্রা')}</dt>
            <dd>{temperature.toFixed(1)} °C</dd>
          </div>
          <div>
            <dt>{t('Surface soil wetness · modeled', 'মাটির ওপরের ভেজাভাব · মডেল')}</dt>
            <dd>{wetness.toFixed(2)} / 1</dd>
          </div>
        </dl>
        <p className="climate-boundary">
          {t(
            'Historical regional conditions, not a forecast or soil test. The MERRA-2 source grid is about 0.5° × 0.625°. Crop suggestions use experimental rules requiring local review.',
            'এটি আঞ্চলিক ইতিহাস, পূর্বাভাস বা মাটির পরীক্ষা নয়। MERRA-2 উৎসের গ্রিড প্রায় ০.৫° × ০.৬২৫°। ফসলের পরীক্ষামূলক নিয়মে স্থানীয় যাচাই দরকার।',
          )}
        </p>
        <div
          className="demo-table-scroll"
          tabIndex={0}
          role="region"
          aria-label={t('Monthly climate table', 'মাসিক জলবায়ুর সারণি')}
        >
          <table>
            <caption>
              {t(
                `January–December ${climate.year}. Rain is summed; temperature and wetness are daily means.`,
                `${climate.year}-এর জানুয়ারি–ডিসেম্বর। বৃষ্টি যোগফল; তাপ ও ভেজাভাব দিনের গড়।`,
              )}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t('Month', 'মাস')}</th>
                <th scope="col">{t('Rain · mm', 'বৃষ্টি · মিমি')}</th>
                <th scope="col">{t('Air · °C', 'তাপ · °C')}</th>
                <th scope="col">{t('Wetness · 0–1', 'ভেজাভাব · ০–১')}</th>
              </tr>
            </thead>
            <tbody>
              {climate.months.map((m) => (
                <tr key={m.month}>
                  <th scope="row">
                    {months[language][(m.month + 9) % 12]} {climate.year}
                  </th>
                  <td>{m.rain.toFixed(1)}</td>
                  <td>{m.temperature.toFixed(1)}</td>
                  <td>{m.wetness.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          {t('Retrieved', 'সংগ্রহ')}:{' '}
          <time dateTime={climate.retrievedAt}>
            {new Date(climate.retrievedAt).toISOString().slice(0, 10)}
          </time>{' '}
          · API {climate.apiVersion} · {climate.sources.join(', ')} · LST
        </p>
        <a
          className="text-button"
          href="https://power.larc.nasa.gov/docs/services/api/temporal/daily/"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('NASA documentation & units', 'নাসার বিবরণ ও একক')}
        </a>
      </details>
    </section>
  );
}
