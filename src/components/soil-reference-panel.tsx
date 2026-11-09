'use client';
import { useEffect, useState } from 'react';
import { usePlanner } from './planner-provider';
import type { FarmSite } from '../domain/farm-site';
import type { SoilReference } from '../lib/soil-reference';

/** Topsoil depth used for the modeled pH; the same depth as the soil texture estimate. */
const depth = '5-15';

/** Modeled topsoil pH at the pin, with its likely range and the source credit. */
export function SoilReferencePanel({ site }: { site?: FarmSite }) {
  const { t } = usePlanner();
  const latitude = site?.latitude,
    longitude = site?.longitude,
    key = latitude === undefined || longitude === undefined ? '' : `${latitude},${longitude}`;
  const [state, setState] = useState<{ key: string; soil?: SoilReference; error?: boolean } | null>(
    null,
  );
  useEffect(() => {
    if (!key || latitude === undefined || longitude === undefined) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetch(
        `/api/soil-reference?${new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), depth })}`,
        { signal: controller.signal },
      )
        .then(async (r) => {
          const body = await r.json();
          if (
            !r.ok ||
            !body.soil ||
            body.soil.latitude !== latitude ||
            body.soil.longitude !== longitude ||
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
  }, [key, latitude, longitude]);
  const soil = state?.key === key ? state.soil : undefined,
    error = state?.key === key && state.error;
  const low = soil?.lower.toFixed(1),
    high = soil?.upper.toFixed(1);
  return (
    <div className="soil-reference">
      <p aria-live="polite">
        <strong>{t('From data', 'তথ্য থেকে')}:</strong>{' '}
        {!key ? (
          t('choose your field location first', 'আগে জমির স্থান বাছুন')
        ) : soil ? (
          <>
            <strong>{soil.median.toFixed(1)}</strong> ·{' '}
            {t(`likely between ${low} and ${high}`, `সম্ভাব্য সীমা ${low}–${high}`)}
            {soil.distanceM
              ? ` · ${t('nearest data', 'নিকটতম তথ্য')} ${(soil.distanceM / 1000).toFixed(1)} km ${t('away', 'দূরে')}`
              : ''}
          </>
        ) : error ? (
          t('not available near this field', 'এই জমির কাছে পাওয়া যায়নি')
        ) : (
          t('loading…', 'আনা হচ্ছে…')
        )}
      </p>
      <p className="soil-reference-source">
        {t('Source', 'উৎস')}:{' '}
        <a
          href="https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_01.html"
          target="_blank"
          rel="noreferrer"
        >
          ISRIC SoilGrids
        </a>{' '}
        · CC BY 4.0
      </p>
    </div>
  );
}
