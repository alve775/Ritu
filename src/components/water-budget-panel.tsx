'use client';
import { useState } from 'react';
import { usePlanner } from './planner-provider';
import type { SeasonFarm } from '../domain/global-season';
import type { LiveWeather } from '../domain/live-weather';
import { weatherIsRecent } from '../domain/live-weather';
import { samePoint } from '../domain/farm-site';
import { addDays } from '../domain/evidence-planner';
import {
  calculateWaterDay,
  cropCoefficientSource,
  waterBalanceSource,
  type WaterDayInput,
  type WaterDayRecord,
} from '../domain/water-balance';
import { useFarmRecordWriter } from './farm-record-scope';

const fields = [
  ['fieldCapacity', 'Field capacity · volume %', 'ক্ষেত্রধারণ ক্ষমতা · আয়তন %', 0, 100],
  ['wiltingPoint', 'Wilting point · volume %', 'স্থায়ী নেতিয়ে পড়ার পানি · আয়তন %', 0, 100],
  ['initialWater', 'Beginning soil water · volume %', 'শুরুর মাটির পানি · আয়তন %', 0, 100],
  ['rootDepth', 'Effective root depth (m)', 'কার্যকর শিকড়ের গভীরতা (মিটার)', 0.001, 10],
  ['depletionFraction', 'Depletion fraction p (0–1)', 'পানি কমার সহনীয় অংশ p (০–১)', 0.001, 0.999],
  ['cropCoefficient', 'Crop-stage coefficient Kc', 'ফসলের পর্যায়ের সহগ Kc', 0, 3],
  ['et0', 'Reference ET₀ (mm/day)', 'রেফারেন্স ET₀ (মিমি/দিন)', 0, 50],
  ['rain', 'Rainfall (mm)', 'বৃষ্টি (মিমি)', 0, 2000],
  ['runoff', 'Rainfall runoff (mm)', 'বৃষ্টির বয়ে যাওয়া পানি (মিমি)', 0, 2000],
  ['netIrrigation', 'Infiltrated irrigation (mm)', 'মাটিতে প্রবেশ করা সেচ (মিমি)', 0, 2000],
  ['capillaryRise', 'Capillary rise (mm)', 'নিচ থেকে উঠে আসা পানি (মিমি)', 0, 2000],
] as const;
type Key = (typeof fields)[number][0];
const volumetric = new Set<Key>(['fieldCapacity', 'wiltingPoint', 'initialWater']);
const toStrings = (record?: WaterDayInput) =>
  Object.fromEntries(
    fields.map(([k]) => [k, record ? String(record[k] * (volumetric.has(k) ? 100 : 1)) : '']),
  ) as Record<Key, string>;

export function WaterBudgetPanel({
  farm,
  date,
  today,
  weather,
}: {
  farm: SeasonFarm;
  date: string;
  today: string;
  weather: LiveWeather | null;
}) {
  const { t } = usePlanner();
  const writeFarm = useFarmRecordWriter();
  const saved = (farm.waterRecords ?? []).find((r) => r.date === date);
  const [values, setValues] = useState(() => toStrings(saved));
  const [system, setSystem] = useState(saved?.system ?? '');
  const [mode, setMode] = useState<WaterDayInput['mode']>(saved?.mode ?? 'scenario');
  const [evidence, setEvidence] = useState(saved?.evidence ?? '');
  const [et0Source, setEt0Source] = useState(saved?.et0Source ?? '');
  const [coefficientSource, setCoefficientSource] = useState(saved?.coefficientSource ?? '');
  const [confirmed, setConfirmed] = useState(false);
  const [shown, setShown] = useState<WaterDayRecord | null>(saved ?? null);
  const [message, setMessage] = useState('');
  const edit = (key: Key, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setShown(null);
    setConfirmed(false);
  };
  const forecast =
    weather && weatherIsRecent(weather) && samePoint(weather.requested, farm.site)
      ? weather.days.find((d) => d.date === date)
      : undefined;
  const previous = (farm.waterRecords ?? []).find((r) => r.date === addDays(date, -1));
  const result = shown ? calculateWaterDay(shown) : null;
  return (
    <details className="card water-budget-panel" id="farm-water-budget">
      <summary>{t('Daily water balance · FAO-56', 'দৈনিক পানির হিসাব · FAO-56')}</summary>
      <p>
        {t(
          'Calculate daily root-zone water balance using your crop-stage coefficients and field measurements. This model covers non-ponded soil at a fixed root depth.',
          'ফসলের পর্যায়ের সহগ ও জমির মাপ দিয়ে শিকড়ের দৈনিক পানির হিসাব করুন। এই মডেল স্থির শিকড়ের গভীরতা ও জমা পানি নেই এমন মাটির জন্য।',
        )}
      </p>
      <p>
        <strong>
          {t('Selected day', 'বাছা দিন')}: {date}
        </strong>
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const numbers = Object.fromEntries(
            fields.map(([k]) => [k, Number(values[k]) / (volumetric.has(k) ? 100 : 1)]),
          );
          const input = {
            ...numbers,
            date,
            system,
            mode,
            evidence: evidence.trim(),
            et0Source: et0Source.trim(),
            coefficientSource: coefficientSource.trim(),
          } as WaterDayInput;
          const calculated = calculateWaterDay(input);
          if (
            !confirmed ||
            fields.some(([k]) => !values[k].trim()) ||
            (mode === 'reported' && date > today) ||
            calculated.status !== 'calculated'
          ) {
            setMessage(
              calculated.status === 'unsupported'
                ? t(
                    'Ponded paddy needs a separate water model; no upland result is substituted.',
                    'জমা পানির ধানে আলাদা মডেল দরকার; অন্য মাটির ফল বসানো হয় না।',
                  )
                : calculated.status === 'smaller-step-needed'
                  ? t(
                      'These inputs need a smaller time step or a more detailed model; the balance would go below wilting point.',
                      'এই তথ্যে ছোট সময়ের ধাপ বা বিস্তারিত মডেল দরকার; পানি নেতিয়ে পড়ার সীমার নিচে যাচ্ছে।',
                    )
                  : t(
                      'Complete the sources and valid inputs: wilting point < field capacity, beginning water within that interval, runoff ≤ rain, and no future reported measurements.',
                      'উৎস ও সঠিক তথ্য পূরণ করুন: নেতিয়ে পড়ার সীমা < ক্ষেত্রধারণ ক্ষমতা, শুরুর পানি এই সীমায়, বয়ে যাওয়া পানি ≤ বৃষ্টি, ভবিষ্যতের মাপা তথ্য নয়।',
                    ),
            );
            return;
          }
          const record: WaterDayRecord = {
            ...input,
            id: saved?.id ?? crypto.randomUUID(),
            savedAt: new Date().toISOString(),
          };
          try {
            writeFarm(farm.id, {
              waterRecords: [
                ...(farm.waterRecords ?? []).filter((r) => r.date !== date),
                record,
              ].sort((a, b) => a.date.localeCompare(b.date)),
            });
            setShown(record);
            setMessage(
              t('Calculation saved for this farm and day.', 'এই জমি ও দিনের হিসাব রাখা হয়েছে।'),
            );
          } catch {
            setMessage(t('Could not save this calculation.', 'হিসাব রাখা যায়নি।'));
          }
        }}
      >
        <div className="season-form-grid">
          <label>
            {t('Water-balance purpose', 'পানির হিসাবের ধরন')}
            <select
              aria-label={t('Water-balance purpose', 'পানির হিসাবের ধরন')}
              value={mode}
              onChange={(e) => {
                setMode(e.target.value as WaterDayInput['mode']);
                setShown(null);
              }}
            >
              <option value="scenario">
                {t(
                  'Planning scenario · may include forecasts',
                  'পরিকল্পনার হিসাব · পূর্বাভাস থাকতে পারে',
                )}
              </option>
              <option value="reported">
                {t('Farmer-reported daily inputs', 'কৃষকের দেওয়া দিনের তথ্য')}
              </option>
            </select>
          </label>
          <label>
            {t('Field water system', 'জমির পানির ব্যবস্থা')}
            <select
              aria-label={t('Field water system', 'জমির পানির ব্যবস্থা')}
              required
              value={system}
              onChange={(e) => {
                setSystem(e.target.value);
                setShown(null);
              }}
            >
              <option value="">{t('Choose the actual system', 'আসল ব্যবস্থা বাছুন')}</option>
              <option value="upland">
                {t('Non-ponded root zone', 'জমা পানি নেই এমন শিকড়ের অঞ্চল')}
              </option>
              <option value="ponded">
                {t('Ponded paddy · not supported by this model', 'জমা পানির ধান · এই মডেলে হয় না')}
              </option>
            </select>
          </label>
        </div>
        <div className="button-row">
          {forecast?.et0 !== null && forecast?.et0 !== undefined && (
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                edit('et0', String(forecast.et0));
                setEt0Source(weather!.sourceUrl);
                setMode('scenario');
                setMessage(
                  t(
                    'Modeled reference ET₀ imported. Enter the rainfall and field measurements below.',
                    'মডেলের রেফারেন্স ET₀ আনা হয়েছে। নিচে বৃষ্টি ও জমির মাপ দিন।',
                  ),
                );
              }}
            >
              {t('Use forecast reference ET₀', 'পূর্বাভাসের রেফারেন্স ET₀ নিন')}
            </button>
          )}
          {previous && (
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                const balance = calculateWaterDay(previous);
                if (balance.status !== 'calculated') return;
                setValues((v) => ({
                  ...v,
                  fieldCapacity: String(previous.fieldCapacity * 100),
                  wiltingPoint: String(previous.wiltingPoint * 100),
                  initialWater: String(balance.finalWater * 100),
                  rootDepth: String(previous.rootDepth),
                }));
                setEvidence(
                  `Previous calculation ${previous.date}; calculated soil state, not a new measurement. ${previous.evidence}`.slice(
                    0,
                    2000,
                  ),
                );
                setMode('scenario');
                setShown(null);
                setConfirmed(false);
              }}
            >
              {t(
                'Carry previous day’s calculated soil state',
                'আগের দিনের হিসাবের মাটির অবস্থা নিন',
              )}
            </button>
          )}
        </div>
        <div className="season-form-grid water-inputs">
          {fields.map(([key, en, bn, min, max]) => (
            <label key={key}>
              {t(en, bn)}
              <input
                required
                type="number"
                min={min}
                max={max}
                step="any"
                value={values[key]}
                onChange={(e) => edit(key, e.target.value)}
              />
            </label>
          ))}
        </div>
        <p className="field-help">
          {t(
            'Use measured or documented values, including any zero. Irrigation means water entering the root zone. Use a depletion fraction p for this crop and stage.',
            'শূন্যসহ প্রতিটি মান মাপ বা নথি থেকে দিন। সেচ বলতে শিকড়ের অঞ্চলে প্রবেশ করা পানি বোঝায়। এই ফসল ও পর্যায়ের উপযুক্ত p ব্যবহার করুন।',
          )}
        </p>
        <label>
          {t('Soil/root-zone and water-input evidence', 'মাটি/শিকড়ের অঞ্চল ও পানির উৎসের তথ্য')}
          <textarea
            aria-label={t(
              'Soil/root-zone and water-input evidence',
              'মাটি/শিকড়ের অঞ্চল ও পানির উৎসের তথ্য',
            )}
            required
            maxLength={2000}
            value={evidence}
            onChange={(e) => {
              setEvidence(e.target.value);
              setShown(null);
            }}
          />
        </label>
        <label>
          {t(
            'Kc and p source · actual crop/stage and conditions',
            'Kc ও p-এর উৎস · আসল ফসল/পর্যায় ও পরিবেশ',
          )}
          <textarea
            aria-label={t(
              'Kc and p source · actual crop/stage and conditions',
              'Kc ও p-এর উৎস · আসল ফসল/পর্যায় ও পরিবেশ',
            )}
            required
            maxLength={2000}
            value={coefficientSource}
            onChange={(e) => {
              setCoefficientSource(e.target.value);
              setShown(null);
            }}
          />
        </label>
        <label>
          {t('Reference ET₀ source', 'রেফারেন্স ET₀-এর উৎস')}
          <input
            required
            maxLength={2000}
            value={et0Source}
            onChange={(e) => {
              setEt0Source(e.target.value);
              setShown(null);
            }}
          />
        </label>
        <label className="setting-check">
          <input
            type="checkbox"
            required
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          {t(
            'These inputs apply to this crop stage and the effective root zone. The daily approximation and source documents still need local verification.',
            'তথ্য এই ফসলের পর্যায় ও কার্যকর শিকড়ের অঞ্চলের জন্য। দৈনিক আনুমানিক পদ্ধতি ও উৎসের নথি স্থানীয় যাচাই দরকার।',
          )}
        </label>
        <div className="button-row">
          <button className="button primary" type="submit">
            {t('Calculate & save water balance', 'পানির হিসাব করে রাখুন')}
          </button>
        </div>
        {message && <p role="status">{message}</p>}
      </form>
      {result?.status === 'calculated' && (
        <section
          className="water-budget-result"
          aria-label={t('Water balance result', 'পানির হিসাবের ফল')}
        >
          <h3>{t('Calculated root-zone water', 'হিসাবের শিকড়ের অঞ্চলের পানি')}</h3>
          <p>
            {shown?.mode === 'scenario'
              ? t(
                  'Planning scenario · includes assumptions or model data',
                  'পরিকল্পনার হিসাব · অনুমান বা মডেলের তথ্য আছে',
                )
              : t('Calculated from farmer-reported inputs', 'কৃষকের দেওয়া তথ্য থেকে হিসাব')}
          </p>
          <dl className="season-form-grid">
            {[
              [t('Total available water (TAW)', 'মোট ব্যবহারযোগ্য পানি (TAW)'), result.taw, 'mm'],
              [
                t('Readily available water (RAW)', 'সহজে ব্যবহারযোগ্য পানি (RAW)'),
                result.raw,
                'mm',
              ],
              [t('Potential crop ET', 'সম্ভাব্য ফসলের ET'), result.potentialEt, 'mm/day'],
              [
                t('Stress-adjusted crop ET', 'পানির চাপ অনুযায়ী ফসলের ET'),
                result.adjustedEt,
                'mm/day',
              ],
              [t('End-of-day depletion', 'দিন শেষে পানির ঘাটতি'), result.finalDepletion, 'mm'],
              [t('Modeled deep drainage', 'মডেলে গভীরে নেমে যাওয়া পানি'), result.drainage, 'mm'],
            ].map(([label, value, unit]) => (
              <div key={String(label)}>
                <dt>{label}</dt>
                <dd>
                  {Number(value).toFixed(2)} {unit}
                </dd>
              </div>
            ))}
          </dl>
          <p className={result.thresholdExceeded ? 'notice-amber' : 'field-help'}>
            {result.thresholdExceeded
              ? t(
                  'Calculated depletion exceeds RAW. Inspect root-zone moisture and review the crop’s irrigation schedule.',
                  'হিসাবের ঘাটতি RAW পেরিয়েছে। শিকড়ের মাটির আর্দ্রতা ও ফসলের সেচের সময়সূচি দেখুন।',
                )
              : t(
                  'Calculated depletion is within the supplied RAW threshold for this day.',
                  'এই দিনের হিসাবের ঘাটতি দেওয়া RAW সীমার মধ্যে আছে।',
                )}
          </p>
          <p>
            {t(
              'Assumptions: stress uses beginning-of-day water; wetting is represented by daily totals; surplus above field capacity drains at day end. Within-day timing, root growth, salinity and paddy storage are not resolved. Storage depletion is not a gross irrigation application amount.',
              'শর্ত: শুরুর পানি দিয়ে চাপের হিসাব, পানি যোগ দিনের মোট হিসাবে, ধারণক্ষমতার বেশি পানি দিন শেষে নেমে যায়। দিনের ভেতরের সময়, শিকড়ের বৃদ্ধি, লবণাক্ততা ও ধানের জমা পানি ধরা হয় না। ঘাটতি সেচের মোট প্রয়োগমাত্রা নয়।',
            )}
          </p>
        </section>
      )}
      {(farm.waterRecords ?? []).length > 0 && (
        <details>
          <summary>
            {t('Saved water calculations', 'রাখা পানির হিসাব')} ({farm.waterRecords!.length})
          </summary>
          <ul>
            {farm.waterRecords!.map((r) => (
              <li key={r.id}>
                {r.date} ·{' '}
                {r.mode === 'scenario'
                  ? t('Scenario', 'পরিকল্পনা')
                  : t('Reported inputs', 'দেওয়া তথ্য')}{' '}
                <button
                  type="button"
                  className="text-button"
                  aria-label={`${t('Delete water calculation', 'পানির হিসাব মুছুন')} ${r.date}`}
                  onClick={() => {
                    writeFarm(farm.id, {
                      waterRecords: farm.waterRecords!.filter((x) => x.id !== r.id),
                    });
                    if (r.date === date) setShown(null);
                    setMessage(t('Saved calculation deleted.', 'রাখা হিসাব মুছে ফেলা হয়েছে।'));
                  }}
                >
                  {t('Delete', 'মুছুন')}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
      <p>
        <a href={waterBalanceSource} target="_blank" rel="noreferrer">
          FAO-56 · {t('water balance', 'পানির হিসাব')}
        </a>{' '}
        ·{' '}
        <a href={cropCoefficientSource} target="_blank" rel="noreferrer">
          {t('crop coefficients and local stages', 'ফসলের সহগ ও স্থানীয় পর্যায়')}
        </a>
      </p>
    </details>
  );
}
