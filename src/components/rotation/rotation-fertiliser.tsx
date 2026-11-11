'use client';
import type { RotationCrop } from '../../data/rotation-crops';
import { fertilizerNames, plotKg } from '../../domain/barc-fertilizer';
import { useFertilizer } from '../../lib/use-fertilizer';
import type { RotationText } from './rotation-text';
import { seasonClass } from './rotation-visuals';
import type { Season } from '../../domain/evidence-planner';

type Translate = (en: string, bn: string) => string;

/**
 * BARC's fertiliser recommendation for each crop of the plot's plan, at the land's pin, scaled to
 * the plot's size. BARC's main choice of each "or" pair is shown; its notes are in English.
 */
export function FertiliserCard({
  crops,
  site,
  areaHa,
  tx,
  t,
  language,
}: {
  crops: { crop: RotationCrop; season: Season }[];
  site?: { latitude: number; longitude: number };
  areaHa: number;
  tx: RotationText;
  t: Translate;
  language: 'en' | 'bn';
}) {
  const states = useFertilizer(
    crops.map((c) => c.crop.id),
    site,
  );
  if (!site || !crops.length) return null;
  const amount = (kg: number) =>
    kg < 1
      ? t(`${Math.round(kg * 1000)} g`, `${tx.n(Math.round(kg * 1000))} গ্রাম`)
      : t(
          `${kg < 10 ? kg.toFixed(1) : Math.round(kg)} kg`,
          `${tx.n(kg < 10 ? kg.toFixed(1) : String(Math.round(kg)))} কেজি`,
        );
  return (
    <section
      className="rot-block rot-fert"
      aria-label={t('Fertiliser for this plot', 'এই প্লটের সার')}
    >
      <div className="rot-block-head">
        <h2>{t('Fertiliser for this plot', 'এই প্লটের সার')}</h2>
        <span>{t('BARC recommendation', 'BARC-এর সুপারিশ')}</span>
      </div>
      <ul className="rot-fert-list">
        {crops.map(({ crop, season }) => {
          const s = states[crop.id] ?? { status: 'loading' };
          return (
            <li key={crop.id} className={seasonClass(season)}>
              <b>{tx.crop(crop)}</b>
              {s.status === 'loading' && (
                <span className="rot-muted">{t('Asking BARC…', 'BARC থেকে আনা হচ্ছে…')}</span>
              )}
              {s.status === 'none' && (
                <span className="rot-muted">
                  {t(
                    'BARC has no recommendation at this pin (town or river area).',
                    'এই পিনে BARC-এর সুপারিশ নেই (শহর বা নদীর এলাকা)।',
                  )}
                </span>
              )}
              {s.status === 'error' && (
                <span className="rot-muted">
                  {t('BARC could not be reached.', 'BARC-এর সঙ্গে যোগাযোগ হয়নি।')}{' '}
                  {s.pageUrl && (
                    <a href={s.pageUrl} target="_blank" rel="noopener noreferrer">
                      {t('Open BARC’s page', 'BARC-এর পাতা খুলুন')}
                    </a>
                  )}
                </span>
              )}
              {s.status === 'ok' && (
                <>
                  <span className="rot-fert-doses">
                    {s.result.items
                      .filter((i) => !i.alt)
                      .map((i) => (
                        <span key={i.name}>
                          {fertilizerNames[i.name]?.[language] ?? i.name}{' '}
                          <strong>{amount(plotKg(i.kg, areaHa))}</strong>
                        </span>
                      ))}
                  </span>
                  <small className="rot-muted">
                    {t(
                      `For ${s.result.variety}, at your land’s pin. `,
                      `${s.result.variety} জাতের জন্য, আপনার জমির পিনে। `,
                    )}
                    <a href={s.result.pageUrl} target="_blank" rel="noopener noreferrer">
                      {t('BARC’s page and notes', 'BARC-এর পাতা ও নির্দেশনা')}
                    </a>
                  </small>
                  {s.result.notes.length > 0 && (
                    <details className="rot-fert-notes">
                      <summary>
                        {t('How to apply (BARC, English)', 'কীভাবে দেবেন (BARC, ইংরেজিতে)')}
                      </summary>
                      <ul>
                        {s.result.notes.map((n) => (
                          <li key={n}>{n}</li>
                        ))}
                      </ul>
                    </details>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
      <p className="rot-source">
        {t(
          'Source: BARC Crop Zoning Information System, fertiliser recommendation by point, from SRDI soil nutrient data. Amounts are scaled to this plot’s size; check them with your local agriculture office.',
          'উৎস: BARC ফসল জোনিং তথ্যব্যবস্থা, স্থানভিত্তিক সার সুপারিশ, SRDI-এর মাটির পুষ্টির তথ্য থেকে। পরিমাণ এই প্লটের আয়তন অনুযায়ী; স্থানীয় কৃষি অফিসে মিলিয়ে নিন।',
        )}
      </p>
    </section>
  );
}
