'use client';
import { usePlanner } from './planner-provider';
import type { FarmSite } from '../domain/farm-site';
import { useSoilReference } from '../lib/use-soil-reference';

/** Modeled topsoil pH at the pin, with its likely range and the source credit. */
export function SoilReferencePanel({ site }: { site?: FarmSite }) {
  const { t } = usePlanner();
  const { key, soil, error } = useSoilReference(site);
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
