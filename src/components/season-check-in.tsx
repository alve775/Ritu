'use client';
import { useState } from 'react';
import { observedStages, type DailyFieldCheckIn, type SeasonFarm } from '../domain/global-season';
import {
  cycleStatus,
  latestFieldUpdate,
  recordFieldCheckIn,
  removeFieldCheckIn,
} from '../domain/season-lifecycle';
import { useFarmRecordWriter } from './farm-record-scope';
import { usePlanner } from './planner-provider';
import { actionsForDay } from '../domain/season-actions';
import { actionCopy } from '../lib/action-copy';

const banglaStages: Record<string, string> = {
  'Not sure': 'নিশ্চিত নই',
  'No change': 'আগের পর্যায়েই আছে',
  Establishing: 'চারা গজানো / স্থাপিত হওয়া',
  'Leaf growth': 'পাতা বাড়ছে',
  Flowering: 'ফুল আসছে',
  'Fruit / grain filling': 'ফল / দানা ভরাট হচ্ছে',
  Maturing: 'পরিপক্ব হচ্ছে',
  Harvested: 'ফসল তোলা হয়েছে',
};
export function stageLabel(stage: string, language: 'en' | 'bn') {
  return language === 'bn' ? (banglaStages[stage] ?? stage) : stage;
}
export function DailyCheckInForm({
  farm,
  day,
  today,
  onNextDay,
}: {
  farm: SeasonFarm;
  day: string;
  today: string;
  onNextDay: () => void;
}) {
  const { t, language } = usePlanner();
  const writeFarm = useFarmRecordWriter();
  const [stage, setStage] = useState<DailyFieldCheckIn['stage'] | ''>('');
  const [confidence, setConfidence] = useState<DailyFieldCheckIn['confidence']>('sure');
  const [coverage, setCoverage] = useState<DailyFieldCheckIn['coverage']>('not-sure');
  const [water, setWater] = useState<DailyFieldCheckIn['water']>('not-checked');
  const [damage, setDamage] = useState<DailyFieldCheckIn['damage']>('not-checked');
  const [harvest, setHarvest] = useState<DailyFieldCheckIn['harvest']>('none');
  const [milestone, setMilestone] = useState<DailyFieldCheckIn['milestone']>('none');
  const [note, setNote] = useState(''),
    [error, setError] = useState(''),
    [saved, setSaved] = useState(false);
  const enabled =
    !!farm.plantedDate &&
    day >= farm.plantedDate &&
    day <= today &&
    cycleStatus(farm, day) !== 'completed';
  const previous = latestFieldUpdate(farm, day);
  let proposed: ReturnType<typeof actionsForDay> = [];
  if (enabled && stage) {
    try {
      const patch = recordFieldCheckIn(
        farm,
        {
          id: 'unsaved-preview',
          date: day,
          stage,
          confidence: stage === 'Not sure' ? 'unsure' : confidence,
          coverage,
          water,
          damage,
          harvest,
          milestone,
          note: '',
        },
        today,
      );
      proposed = actionsForDay({ ...farm, ...patch }, day, null);
    } catch {
      // Invalid draft combinations are validated by the same rules when saving.
    }
  }
  return (
    <section
      className="season-check-in"
      aria-label={t('Daily field update', 'প্রতিদিনের জমির খবর')}
    >
      <h3>{t('Daily field update', 'প্রতিদিনের জমির খবর')}</h3>
      <p>
        {t(
          'Record the crop stage, soil moisture and any damage you observed.',
          'ফসলের পর্যায়, মাটির আর্দ্রতা ও দেখা ক্ষতির খবর লিখুন।',
        )}{' '}
        <time dateTime={day}>{day}</time>
      </p>
      {!enabled && (
        <p className="notice-amber">
          {t(
            'Record actual planting first. Updates must be between planting and today, before the season’s final harvest. Correct an accidental completion in the actual harvest-date field.',
            'আগে আসল রোপণ লিখুন। রোপণ থেকে আজ পর্যন্ত, মৌসুমের শেষ কাটার আগের দিনগুলোর খবর দেওয়া যায়। ভুল করে শেষ করলে আসল কাটার তারিখ ঠিক করুন।',
          )}
        </p>
      )}
      <form
        onChange={() => setSaved(false)}
        onSubmit={(e) => {
          e.preventDefault();
          setError('');
          setSaved(false);
          if (!stage) return;
          if (
            milestone !== 'none' &&
            (confidence !== 'sure' || !['half', 'most'].includes(coverage))
          ) {
            setError(
              t(
                'A milestone needs a confident report covering at least half the plants.',
                'মাইলফলকের জন্য নিশ্চিত খবর এবং অন্তত অর্ধেক গাছের তথ্য দরকার।',
              ),
            );
            return;
          }
          try {
            const checkIn: DailyFieldCheckIn = {
              id: crypto.randomUUID(),
              date: day,
              stage,
              confidence: stage === 'Not sure' ? 'unsure' : confidence,
              coverage,
              water,
              damage,
              harvest,
              milestone,
              note,
            };
            writeFarm(farm.id, recordFieldCheckIn(farm, checkIn, today));
            setSaved(true);
            setStage('');
            setNote('');
            setHarvest('none');
            setMilestone('none');
            setWater('not-checked');
            setDamage('not-checked');
            setCoverage('not-sure');
          } catch (e) {
            setError(
              language === 'bn'
                ? 'খবরটি রাখা যায়নি। রোপণের দিন, পর্যায় ও কাটার ধরন যাচাই করুন।'
                : e instanceof Error
                  ? e.message
                  : 'The field update could not be saved.',
            );
          }
        }}
      >
        <fieldset disabled={!enabled}>
          <legend className="sr-only">{t('What did you observe?', 'কী দেখেছেন?')}</legend>
          <div className="season-form-grid">
            <label>
              {t('Observed stage', 'দেখা পর্যায়')}
              <select
                aria-label={t('Observed stage', 'দেখা পর্যায়')}
                required
                value={stage}
                onChange={(e) => {
                  setStage(e.target.value as typeof stage);
                  setSaved(false);
                }}
              >
                <option value="">{t('Choose what you see', 'যা দেখছেন বাছুন')}</option>
                {observedStages
                  .filter((s) => s !== 'No change' || !!previous)
                  .map((s) => (
                    <option key={s} value={s}>
                      {stageLabel(s, language)}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              {t('How sure are you?', 'কতটা নিশ্চিত?')}
              <select
                aria-label={t('How sure are you?', 'কতটা নিশ্চিত?')}
                value={confidence}
                onChange={(e) => setConfidence(e.target.value as typeof confidence)}
              >
                <option value="sure">
                  {t('I can identify this stage', 'পর্যায়টি চিনতে পারছি')}
                </option>
                <option value="unsure">{t('Not sure', 'নিশ্চিত নই')}</option>
              </select>
            </label>
            <label>
              {t('How much of the field?', 'জমির কত অংশে?')}
              <select
                aria-label={t('How much of the field?', 'জমির কত অংশে?')}
                value={coverage}
                onChange={(e) => setCoverage(e.target.value as typeof coverage)}
              >
                <option value="not-sure">{t('Not sure', 'নিশ্চিত নই')}</option>
                <option value="few">{t('A few plants', 'কিছু গাছে')}</option>
                <option value="half">{t('At least half the plants', 'অন্তত অর্ধেক গাছে')}</option>
                <option value="most">{t('Most plants', 'বেশিরভাগ গাছে')}</option>
              </select>
            </label>
            <label>
              {t('Harvest status', 'ফসল তোলার অবস্থা')}
              <select
                aria-label={t('Harvest status', 'ফসল তোলার অবস্থা')}
                value={harvest}
                onChange={(e) => setHarvest(e.target.value as typeof harvest)}
              >
                <option value="none">{t('Not harvested', 'ফসল তোলা হয়নি')}</option>
                <option value="started">
                  {t('Picking started — crop still active', 'তোলা শুরু — চাষ চলছে')}
                </option>
                <option value="finished">
                  {farm.selection.planKind === 'perennial-review'
                    ? t(
                        'This harvest finished — keep caring for the planting',
                        'এই দফার তোলা শেষ — গাছের পরিচর্যা চলবে',
                      )
                    : t(
                        'Final harvest finished — complete this season',
                        'শেষ ফসল তোলা হয়েছে — মৌসুম শেষ করুন',
                      )}
                </option>
              </select>
            </label>
          </div>
          {stage === 'Harvested' && harvest === 'none' && (
            <p className="notice-amber">
              {t(
                'Choose partial picking or final harvest below.',
                'নিচে আংশিক তোলা বা শেষ তোলা বাছুন।',
              )}
            </p>
          )}
          <details>
            <summary>
              {t('Water and crop condition · optional', 'পানি ও ফসলের অবস্থা · ঐচ্ছিক')}
            </summary>
            <div className="season-form-grid">
              <label>
                {t('Soil water observed', 'দেখা মাটির পানি')}
                <select
                  aria-label={t('Soil water observed', 'দেখা মাটির পানি')}
                  value={water}
                  onChange={(e) => setWater(e.target.value as typeof water)}
                >
                  <option value="not-checked">{t('Not checked', 'দেখিনি')}</option>
                  <option value="dry">{t('Dry', 'শুকনা')}</option>
                  <option value="moist">{t('Moist', 'আর্দ্র')}</option>
                  <option value="waterlogged">
                    {t('Standing water / waterlogged', 'পানি জমে আছে')}
                  </option>
                </select>
              </label>
              <label>
                {t('Visible damage or symptoms', 'দেখা ক্ষতি বা লক্ষণ')}
                <select
                  aria-label={t('Visible damage or symptoms', 'দেখা ক্ষতি বা লক্ষণ')}
                  value={damage}
                  onChange={(e) => setDamage(e.target.value as typeof damage)}
                >
                  <option value="not-checked">{t('Not checked', 'দেখিনি')}</option>
                  <option value="none-seen">{t('None seen', 'চোখে পড়েনি')}</option>
                  <option value="seen">
                    {t('Damage or symptoms seen', 'ক্ষতি বা লক্ষণ দেখেছি')}
                  </option>
                </select>
              </label>
            </div>
          </details>
          {farm.thermalProfile && (
            <details>
              <summary>
                {t('New grain-corn milestone · optional', 'দানার ভুট্টার নতুন মাইলফলক · ঐচ্ছিক')}
              </summary>
              <p>
                {t(
                  'Record only the first date at least half the plants reached this milestone. A sure answer and field coverage are required. Black layer means reported physiological maturity, not automatically dry grain ready for storage.',
                  'অন্তত অর্ধেক গাছে এই মাইলফলক প্রথম আসার দিনই লিখুন। নিশ্চিত উত্তর ও জমির অংশ দিতে হবে। কালো স্তর মানে দৈহিক পরিপক্বতার খবর, সংরক্ষণের উপযুক্ত শুকনা দানা নিশ্চিত নয়।',
                )}
              </p>
              <label>
                {t('Milestone first reached on this selected date', 'বাছা দিনে প্রথম আসা মাইলফলক')}
                <select
                  aria-label={t(
                    'Milestone first reached on this selected date',
                    'বাছা দিনে প্রথম আসা মাইলফলক',
                  )}
                  value={milestone}
                  onChange={(e) => setMilestone(e.target.value as typeof milestone)}
                >
                  <option value="none">{t('None / not sure', 'নেই / নিশ্চিত নই')}</option>
                  <option value="maize-silking">
                    {t(
                      'Silks visible on at least half the plants',
                      'অন্তত অর্ধেক গাছে মোচায় রেশম দেখা গেছে',
                    )}
                  </option>
                  <option value="maize-maturity">
                    {t(
                      'Black layer confirmed on at least half the sampled plants',
                      'পরীক্ষা করা অন্তত অর্ধেক গাছের দানায় কালো স্তর নিশ্চিত',
                    )}
                  </option>
                </select>
              </label>
            </details>
          )}
          <label>
            {t('Observation · optional', 'পর্যবেক্ষণ · ঐচ্ছিক')}
            <textarea
              aria-label={t('Observation', 'পর্যবেক্ষণ')}
              rows={2}
              maxLength={2000}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <button
            className="button primary"
            disabled={!stage || (stage === 'Harvested' && harvest === 'none')}
          >
            {t('Save daily check-in', 'দিনের খবর রাখুন')}
          </button>
        </fieldset>
      </form>
      {proposed.length > 0 && (
        <section
          className="field-update-preview"
          aria-label={t('Preview of next checks', 'পরের যাচাইয়ের প্রিভিউ')}
          aria-live="polite"
        >
          <h4>{t('Checks after saving this update', 'এই খবর রাখলে পরের যাচাই')}</h4>
          <ul>
            {proposed.map((action) => (
              <li key={action.id}>{actionCopy(action, language).title}</li>
            ))}
          </ul>
        </section>
      )}
      {error && (
        <p role="alert" className="notice-amber">
          {error}
        </p>
      )}
      {saved && (
        <p role="status">
          {t(
            'Saved. Your field checks now use this update.',
            'রাখা হয়েছে। জমির পরের যাচাইয়ে এই খবর ব্যবহার হবে।',
          )}{' '}
          <button className="text-button" onClick={onNextDay}>
            {t('See next day’s checks', 'পরের দিনের যাচাই দেখুন')}
          </button>
        </p>
      )}
      {!!farm.checkIns?.length && (
        <details>
          <summary>{t('Daily updates and corrections', 'দিনের খবর ও সংশোধন')}</summary>
          <p>
            {t(
              'Remove an incorrect update before recording its replacement. Removing its final-harvest record reopens that season; the other records remain.',
              'ভুল খবর সরিয়ে সঠিক খবর লিখুন। শেষ তোলার খবর সরালে মৌসুম আবার চালু হবে; অন্য হিসাব থাকবে।',
            )}
          </p>
          <ul>
            {farm.checkIns
              .slice()
              .reverse()
              .map((c, index) => (
                <li key={c.id}>
                  <time dateTime={c.date}>{c.date}</time> · {stageLabel(c.stage, language)} ·{' '}
                  {c.confidence === 'unsure'
                    ? t('Uncertain', 'অনিশ্চিত')
                    : t('Farmer reported', 'কৃষকের খবর')}
                  {c.harvest !== 'none' && (
                    <>
                      {' '}
                      ·{' '}
                      {c.harvest === 'finished'
                        ? t('Harvest finished', 'তোলা শেষ')
                        : t('Partial picking', 'আংশিক তোলা')}
                    </>
                  )}
                  {c.note && <> · {c.note}</>}{' '}
                  <button
                    type="button"
                    className="text-button"
                    aria-label={t(
                      `Remove field update: ${c.date}, ${stageLabel(c.stage, language)}, ${index + 1}`,
                      `দিনের খবর সরান: ${c.date}, ${stageLabel(c.stage, language)}, ${index + 1}`,
                    )}
                    onClick={() => {
                      try {
                        writeFarm(farm.id, removeFieldCheckIn(farm, c.id));
                        setSaved(false);
                        setError('');
                      } catch {
                        setError(t('The update could not be removed.', 'খবরটি সরানো যায়নি।'));
                      }
                    }}
                  >
                    {t('Remove incorrect update', 'ভুল খবর সরান')}
                  </button>
                </li>
              ))}
          </ul>
        </details>
      )}
    </section>
  );
}
