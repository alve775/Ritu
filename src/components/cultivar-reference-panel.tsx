'use client';
import { useState } from 'react';
import { mungCultivars } from '../data/cultivar-references';
import { usePlanner } from './planner-provider';
import { seasonStore } from '../lib/season-store';
import type { SeasonFarm } from '../domain/global-season';

export function CultivarReferencePanel({ farm }: { farm: SeasonFarm }) {
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
          'Five named varieties from the July 2016 CIMMYT/CSISA Bangladesh guide. Choose only your actual seed variety. This adds a cultivar-specific reference interval and broadcast seed calculation; it does not certify the seed, current regional advice or field performance.',
          'জুলাই ২০১৬-এর CIMMYT/CSISA বাংলাদেশ নির্দেশিকার পাঁচটি জাত। আসল বীজের জাতই বাছুন। এতে জাতের সময়সীমা ও ছিটিয়ে বোনার বীজের হিসাব আসে; বীজ, বর্তমান স্থানীয় পরামর্শ বা জমির ফলন নিশ্চিত হয় না।',
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
              'Sowing date can change duration. This is not a harvest-readiness prediction.',
              'বোনার দিনে সময় বদলাতে পারে। এটি কাটার প্রস্তুতির ভবিষ্যদ্বাণী নয়।',
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
            'This selected location is outside Bangladesh; this local reference cannot be applied to its calendar.',
            'বাছা স্থান বাংলাদেশের বাইরে; এই স্থানীয় তথ্য তার পঞ্জিকায় লাগানো যায় না।',
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
            seasonStore.update(farm.id, {
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
              seasonStore.update(farm.id, { cultivarReference: undefined });
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
