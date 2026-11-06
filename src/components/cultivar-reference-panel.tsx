'use client';
import { useState } from 'react';
import { mungCultivars } from '../data/cultivar-references';
import { usePlanner } from './planner-provider';
import { useFarmRecordWriter } from './farm-record-scope';
import type { SeasonFarm } from '../domain/global-season';

export function CultivarReferencePanel({ farm }: { farm: SeasonFarm }) {
  const writeFarm = useFarmRecordWriter();
  const { t } = usePlanner(),
    [chosen, setChosen] = useState(farm.cultivarReference?.varietyId ?? ''),
    [confirmed, setConfirmed] = useState(false),
    [message, setMessage] = useState('');
  if (farm.selection.crop !== 'mung') return null;
  const variety = mungCultivars.find((v) => v.id === chosen),
    outside = farm.site.countryCode && farm.site.countryCode !== 'BD';
  return (
    <details className="card cultivar-reference">
      <summary>
        {t(
          'Named mungbean varieties · Bangladesh reference',
          'নির্দিষ্ট মুগের জাত · বাংলাদেশের তথ্য',
        )}
      </summary>
      <p>
        {t(
          'Choose your seed variety to see its reference growing period and broadcast seed quantity. Source: CIMMYT/CSISA Bangladesh, July 2016.',
          'বীজের জাত বাছলে উৎসের সময়সীমা ও ছিটিয়ে বোনার বীজের পরিমাণ পাবেন। উৎস: CIMMYT/CSISA বাংলাদেশ, জুলাই ২০১৬।',
        )}
      </p>
      <label>
        {t('Actual mungbean variety', 'আসল মুগের জাত')}
        <select
          aria-label={t('Actual mungbean variety', 'আসল মুগের জাত')}
          value={chosen}
          onChange={(e) => {
            setChosen(e.target.value);
            setConfirmed(false);
          }}
        >
          <option value="">{t('Choose your actual variety', 'আসল জাত বাছুন')}</option>
          {mungCultivars.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </label>
      {variety && (
        <>
          <p>
            {t('Guide: seeding to maturity', 'নির্দেশিকায়: বীজ বোনা থেকে পরিপক্বতা')}:{' '}
            <strong>
              {variety.durationMin}–{variety.durationMax} {t('days', 'দিন')}
            </strong>
            .{' '}
            {t(
              'Reference growing time varies with sowing date.',
              'রোপণের দিন অনুযায়ী বৃদ্ধির সময় বদলাতে পারে।',
            )}
          </p>
          <p>
            {t('Broadcast seed reference for this area', 'এই জমিতে ছিটিয়ে বোনার বীজের তথ্য')}:{' '}
            <strong>
              {(variety.low * farm.field.area).toFixed(1)}–
              {(variety.high * farm.field.area).toFixed(1)} kg
            </strong>{' '}
            ({variety.low}–{variety.high} kg/ha × {farm.field.area} ha).{' '}
            {t(
              'Not a machine/bed sowing rate. Confirm seed quality and local practice.',
              'যন্ত্র/বেডে বোনার হার নয়। বীজের মান ও স্থানীয় পদ্ধতি যাচাই করুন।',
            )}
          </p>
        </>
      )}
      {outside ? (
        <p className="notice-amber">
          {t(
            'This variety reference covers Bangladesh fields.',
            'এই জাতের তথ্য বাংলাদেশের জমির জন্য।',
          )}
        </p>
      ) : (
        <label className="setting-check">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          {t(
            'My farm is in Bangladesh and this is the actual variety. Use the dated guide as a reference, subject to local verification.',
            'আমার জমি বাংলাদেশে এবং এটাই আসল জাত। স্থানীয় যাচাই সাপেক্ষে পুরোনো নির্দেশিকার তথ্য ব্যবহার করুন।',
          )}
        </label>
      )}
      <div className="button-row">
        <button
          type="button"
          className="button secondary"
          disabled={!variety || !confirmed || !!outside}
          onClick={() => {
            writeFarm(farm.id, {
              cultivarReference: {
                registry: 'csisa-bd-mung-2016',
                varietyId: chosen,
                countryConfirmed: 'BD',
                selectedAt: new Date().toISOString(),
              },
            });
            setMessage(
              t(
                'Named-variety reference applied. Original source calendar is retained.',
                'জাতের তথ্য লাগানো হয়েছে। মূল উৎসের পঞ্জিকা রাখা আছে।',
              ),
            );
          }}
        >
          {t('Use this variety reference', 'এই জাতের তথ্য ব্যবহার করুন')}
        </button>
        {farm.cultivarReference && (
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              writeFarm(farm.id, { cultivarReference: undefined });
              setMessage(
                t('Returned to the original source reference.', 'মূল উৎসের সময়ে ফেরা হয়েছে।'),
              );
            }}
          >
            {t('Use original reference instead', 'মূল উৎসের তথ্য ব্যবহার করুন')}
          </button>
        )}
      </div>
      {message && <p role="status">{message}</p>}
      <p>
        <a href={mungCultivars[0].source} target="_blank" rel="noreferrer">
          CIMMYT/CSISA · 2016 · {t('printed pp.6 and 12', 'মুদ্রিত পৃ.৬ ও ১২')} · CC BY 4.0
        </a>
      </p>
    </details>
  );
}
