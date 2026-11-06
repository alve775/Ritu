'use client';
import { useEffect, useState } from 'react';
import { usePlanner } from './planner-provider';
import type { FarmSite } from '../domain/farm-site';
import type { SoilReference } from '../lib/soil-reference';

export function SoilReferencePanel({ site }: { site?: FarmSite }) {
  const { t } = usePlanner(),
    [depth, setDepth] = useState('5-15'),
    [retry, setRetry] = useState(0),
    [open, setOpen] = useState(false);
  const [state, setState] = useState<{ key: string; soil?: SoilReference; error?: boolean } | null>(
    null,
  );
  const key = site ? `${site.latitude},${site.longitude}:${depth}` : '';
  useEffect(() => {
    if (!site || !key || !open) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetch(
        `/api/soil-reference?${new URLSearchParams({ latitude: String(site.latitude), longitude: String(site.longitude), depth })}`,
        { signal: controller.signal },
      )
        .then(async (r) => {
          const body = await r.json();
          if (
            !r.ok ||
            !body.soil ||
            body.soil.latitude !== site.latitude ||
            body.soil.longitude !== site.longitude ||
            body.soil.depth !== depth
          )
            throw Error();
          if (!controller.signal.aborted) setState({ key, soil: body.soil });
        })
        .catch(() => {
          if (!controller.signal.aborted) setState({ key, error: true });
        });
    }, 700);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [site, key, depth, retry, open]);
  const soil = state?.key === key ? state.soil : undefined,
    error = state?.key === key && state.error;
  return (
    <details
      className="soil-reference source-method"
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>{t('SoilGrids pH estimate', 'SoilGrids-এর pH হিসাব')}</summary>
      <p>
        {t(
          'ISRIC SoilGrids 2.0 · 250 m grid. Choose a depth to view the modeled pH and its uncertainty range.',
          'ISRIC SoilGrids 2.0 · ২৫০ মিটার গ্রিড। গভীরতা বেছে মডেলের pH ও অনিশ্চয়তার সীমা দেখুন।',
        )}
      </p>
      <label>
        {t('Soil reference depth (cm)', 'মাটির তথ্যের গভীরতা (সেমি)')}
        <select
          aria-label={t('Soil reference depth (cm)', 'মাটির তথ্যের গভীরতা (সেমি)')}
          value={depth}
          onChange={(e) => setDepth(e.target.value)}
        >
          <option value="0-5">0–5</option>
          <option value="5-15">5–15</option>
          <option value="15-30">15–30</option>
        </select>
      </label>
      {!site ? (
        <p>{t('Choose your field location first.', 'আগে জমির স্থান বাছুন।')}</p>
      ) : error ? (
        <p role="status">
          {t(
            'No usable prediction is available here right now. Your measurements and crop selection remain available.',
            'এখানে এখন ব্যবহারযোগ্য মডেলের তথ্য নেই। আপনার মাপ ও ফসল বাছা চালু আছে।',
          )}
        </p>
      ) : !soil ? (
        <p role="status">
          {t(
            'Loading the soil prediction and uncertainty…',
            'মাটির মডেলের মান ও অনিশ্চয়তা আনা হচ্ছে…',
          )}
        </p>
      ) : (
        <div className="soil-reference-result">
          <p>
            <strong>
              {t('Modeled pH(H₂O), median', 'মডেলের pH(H₂O), মধ্যক')}: {soil.median.toFixed(1)}
            </strong>
          </p>
          <p>
            {t('5th–95th prediction quantiles', 'পূর্বানুমানের ৫ম–৯৫তম কোয়ান্টাইল')}:{' '}
            {soil.lower.toFixed(1)}–{soil.upper.toFixed(1)} · {soil.depth} cm
          </p>
          <p>
            {t('Retrieved', 'আনা হয়েছে')}:{' '}
            <time dateTime={soil.fetchedAt}>{soil.fetchedAt.slice(0, 10)}</time>
          </p>
          <details>
            <summary>{t('Original soil data requests', 'মাটির মূল তথ্যের অনুরোধ')}</summary>
            <ul>
              {soil.sourceUrls.map((url, i) => (
                <li key={url}>
                  <a href={url} target="_blank" rel="noreferrer">
                    {['5th quantile', 'Median', '95th quantile'][i]} · WCS GeoTIFF
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}
      {site && (
        <button type="button" className="button secondary" onClick={() => setRetry((n) => n + 1)}>
          {t('Refresh soil reference', 'মাটির তথ্য আবার আনুন')}
        </button>
      )}
      <p>
        <a
          href="https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_01.html"
          target="_blank"
          rel="noreferrer"
        >
          ISRIC · {t('properties, units and uncertainty', 'ধর্ম, একক ও অনিশ্চয়তা')}
        </a>{' '}
        · CC BY 4.0
      </p>
    </details>
  );
}
