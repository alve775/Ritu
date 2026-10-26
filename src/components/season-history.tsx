'use client';
import { useEffect, useState } from 'react';
import { usePlanner } from './planner-provider';
import type { FarmSite } from '../domain/farm-site';
import type { CropId } from '../domain/types';
import type { SeasonHistory } from '../domain/season-history';
import { calendarByCrop } from '../data/regional-calendars';
import { seasonHistoryUrl } from '../domain/season-history';
export function SeasonHistoryPanel({ crop, site }: { crop: CropId; site: FarmSite }) {
  const { t, language } = usePlanner(),
    [attempt, setAttempt] = useState(0),
    [state, setState] = useState<{ history?: SeasonHistory; error?: boolean }>({});
  const key = `${crop}:${site.latitude.toFixed(2)},${site.longitude.toFixed(2)}`;
  const [loadedKey, setLoadedKey] = useState('');
  useEffect(() => {
    const abort = new AbortController();
    fetch(
      `/api/season-history?${new URLSearchParams({ crop, latitude: site.latitude.toFixed(2), longitude: site.longitude.toFixed(2) })}`,
      { signal: abort.signal },
    )
      .then(async (r) => {
        if (!r.ok) throw Error('Unavailable');
        const h = (await r.json()).history as SeasonHistory;
        if (
          !h ||
          h.crop !== crop ||
          h.latitude !== Number(site.latitude.toFixed(2)) ||
          h.longitude !== Number(site.longitude.toFixed(2)) ||
          h.requestUrl !== seasonHistoryUrl(h.latitude, h.longitude, h.start, h.end) ||
          !['rain', 'temperature', 'minimum', 'maximum', 'wetness'].every((k) =>
            Number.isFinite(h[k as keyof SeasonHistory]),
          )
        )
          throw Error('Invalid history');
        if (!abort.signal.aborted) {
          setState({ history: h });
          setLoadedKey(key);
        }
      })
      .catch(() => {
        if (!abort.signal.aborted) {
          setState({ error: true });
          setLoadedKey(key);
        }
      });
    return () => abort.abort();
  }, [crop, site.latitude, site.longitude, key, attempt]);
  const current = loadedKey === key ? state : {};
  return (
    <article className="card nasa-season-card">
      <h3>{calendarByCrop(crop)!.name[language]}</h3>
      {current.history ? (
        <>
          <p>
            <time>{current.history.start}</time> → <time>{current.history.end}</time> ·{' '}
            {current.history.days} {t('recorded days', 'দিনের তথ্য')}
          </p>
          <dl className="weather-stats">
            <div>
              <dt>{t('Total precipitation', 'মোট বৃষ্টিপাত')}</dt>
              <dd>{current.history.rain.toFixed(1)} mm</dd>
            </div>
            <div>
              <dt>{t('Mean air temperature', 'গড় বায়ুর তাপমাত্রা')}</dt>
              <dd>{current.history.temperature.toFixed(1)} °C</dd>
            </div>
            <div>
              <dt>{t('Mean topsoil wetness index', 'ওপরের মাটির গড় ভেজাভাব সূচক')}</dt>
              <dd>{current.history.wetness.toFixed(3)} / 1</dd>
            </div>
          </dl>
          <p className="field-help">
            {t(
              'POWER gridded historical meteorology; wetness is a dimensionless modeled index, not your soil-test moisture percentage.',
              'পাওয়ারের আঞ্চলিক পুরোনো আবহাওয়া; ভেজাভাব মাত্রাহীন মডেল সূচক, জমির পরীক্ষিত আর্দ্রতার শতাংশ নয়।',
            )}
          </p>
          <a href={current.history.requestUrl} target="_blank" rel="noopener noreferrer">
            {t('Original NASA daily records', 'নাসার মূল দৈনিক তথ্য')}
          </a>
          <p className="field-help">
            {t('Retrieved', 'সংগ্রহ')}:{' '}
            {new Date(current.history.retrievedAt).toLocaleString(
              language === 'bn' ? 'bn-BD' : 'en-GB',
            )}{' '}
            · {current.history.sources.join(', ')}
          </p>
        </>
      ) : current.error ? (
        <>
          <p role="status">
            {t(
              'Complete NASA history is unavailable. No substitute data are shown.',
              'নাসার সম্পূর্ণ ইতিহাস পাওয়া যায়নি। বিকল্প বানানো তথ্য দেখানো হয় না।',
            )}
          </p>
          <button
            className="button secondary"
            onClick={() => {
              setLoadedKey('');
              setAttempt((x) => x + 1);
            }}
          >
            {t('Retry NASA history', 'নাসার তথ্য আবার আনুন')}
          </button>
        </>
      ) : (
        <p role="status">
          {t('Loading and validating NASA history…', 'নাসার তথ্য এনে যাচাই হচ্ছে…')}
        </p>
      )}
    </article>
  );
}
