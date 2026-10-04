'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { usePlanner } from './planner-provider';
import { suggestDemoWindows, generateDemoPlans, planFingerprint } from '../domain/demo-planner';
import { previewData, months } from '../data/preview';
import { defaultFarm } from '../data/preview';
import { defaultDemo } from '../data/demo-environment';
import type { CropPeriod } from '../domain/types';
import { activityKey } from '../lib/journey-store';
import { CalendarLegend, CalendarScrollHint, MonthHeader, Timeline } from './calendar';
import { CropCatalogue } from './crop-catalogue';

export function periodLabel(period: CropPeriod, language: 'en' | 'bn') {
  return `${months[language][period.start]} → ${months[language][period.start + period.duration - 1]}`;
}
export function JourneyGate({ step = 'farm' }: { step?: 'farm' | 'crops' }) {
  const { t } = usePlanner();
  return (
    <section className="page-enter calm-page journey-gate">
      <span className="eyebrow">
        {t('FOLLOW YOUR FARM PLAN', 'খামারের পরিকল্পনার ধাপ অনুসরণ করুন')}
      </span>
      <h1>
        {step === 'farm'
          ? t('Start with your farm', 'আপনার খামার দিয়ে শুরু করুন')
          : t('Choose suggested crops first', 'আগে প্রস্তাবিত ফসল বাছুন')}
      </h1>
      <p>
        {t(
          'Farm details → suggested crops → an automatic calendar → tracking. Your dates are checked before any plan can be saved.',
          'খামারের তথ্য → প্রস্তাবিত ফসল → স্বয়ংক্রিয় ক্যালেন্ডার → কাজের হিসাব। রাখার আগে সময়ের মিল যাচাই হয়।',
        )}
      </p>
      <Link className="button primary" href={step === 'farm' ? '/farm' : '/crops'}>
        {step === 'farm'
          ? t('Review farm details', 'খামারের তথ্য দেখুন')
          : t('Choose crops', 'ফসল বাছুন')}
        <ArrowRight size={20} />
      </Link>
    </section>
  );
}
export function SuggestedCropsView() {
  const {
    t,
    language,
    farm,
    demo,
    priority,
    reviewed,
    tourPreview,
    setDemo,
    setJourney,
    select,
    demoSaved,
  } = usePlanner();
  const router = useRouter();
  const sample = useMemo(() => ({ ...defaultDemo }), []);
  const sourceFarm = tourPreview ? defaultFarm : farm;
  const settings = tourPreview ? sample : demo;
  const suggestions = useMemo(
    () => suggestDemoWindows(sourceFarm, settings, priority),
    [sourceFarm, settings, priority],
  );
  const choices = [...new Set(suggestions.map((s) => s.period.crop))];
  const candidates = useMemo(
    () => generateDemoPlans(sourceFarm, settings, priority),
    [sourceFarm, settings, priority],
  );
  if (!reviewed && !tourPreview) return <JourneyGate />;
  const seasons = [t('Pre-monsoon', 'প্রাক্‌বর্ষা'), t('Monsoon', 'বর্ষা'), t('Winter', 'শীত')];
  const missing = [0, 1, 2].filter(
    (season) =>
      !suggestions.some((s) => s.season === season && settings.preferred.includes(s.period.crop)),
  );
  return (
    <div className="page-enter calm-page">
      <header className="planner-heading">
        <div>
          <span className="eyebrow">
            {t('STEP 2 OF 4 · SUGGESTED CROPS', 'ধাপ ২ / ৪ · প্রস্তাবিত ফসল')}
          </span>
          <h1>{t('Choose from your farm’s matches', 'খামারের মিল থেকে ফসল বাছুন')}</h1>
          <p>
            {t(
              'Select the crops you want to consider. RITU chooses compatible planting windows and builds the calendar.',
              'যেসব ফসল চান বাছুন। ঋতু উপযুক্ত সময় মিলিয়ে ক্যালেন্ডার তৈরি করবে।',
            )}
          </p>
        </div>
        <Link className="button secondary" href="/farm">
          {t('Edit farm', 'খামার বদলান')}
        </Link>
      </header>
      <p className="evidence-banner">
        {t(
          'Mock suggestions only. All crop rules and dates are fictional; no real data API or verified farming recommendation.',
          'শুধু কাল্পনিক প্রস্তাব। ফসলের নিয়ম ও সময় নমুনা; বাস্তব API বা চাষের যাচাইকৃত পরামর্শ নয়।',
        )}
      </p>
      <section className="suggestion-intro" data-tour="suggestion-summary">
        <h2>{t('Matched to your conditions', 'আপনার শর্তের সঙ্গে মেলে')}</h2>
        <p>
          {t(
            'Every selectable window passes the mock soil, water, drainage, climate and available-help checks. Missing or conflicting windows are excluded.',
            'বাছার প্রতিটি সময় নমুনার মাটি, পানি, নিষ্কাশন, জলবায়ু ও শ্রমের শর্তে মেলে। অজানা বা সংঘাতের সময় বাদ যায়।',
          )}
        </p>
        <p>
          {t(
            'The same chosen crop may be considered in several suggested seasons. Each rotation uses one crop per season.',
            'একই বাছা ফসল একাধিক মৌসুমে বিবেচিত হতে পারে। প্রতি মৌসুমে একটি ফসল থাকে।',
          )}
        </p>
      </section>
      <div className="suggested-crops" data-tour="suggested-crops">
        {choices.map((id) => {
          const windows = suggestions.filter((s) => s.period.crop === id);
          const best = windows.filter(
            (s, i) => windows.findIndex((w) => w.season === s.season) === i,
          );
          return (
            <section
              className={`suggested-crop ${settings.preferred.includes(id) ? 'chosen' : ''}`}
              key={id}
            >
              <label className="suggested-crop-choice">
                <input
                  type="checkbox"
                  aria-label={`${t('Consider', 'বিবেচনা করুন')} ${previewData.crops[id].name[language]}`}
                  checked={settings.preferred.includes(id)}
                  onChange={() =>
                    setDemo({
                      preferred: demo.preferred.includes(id)
                        ? demo.preferred.filter((crop) => crop !== id)
                        : [...demo.preferred, id],
                      enabled: false,
                    })
                  }
                />
                <strong>{previewData.crops[id].name[language]}</strong>
              </label>
              <ul className="suggested-windows">
                {best.map((s) => (
                  <li key={s.season}>
                    <span>{seasons[s.season]}</span>
                    <strong>{periodLabel(s.period, language)}</strong>
                  </li>
                ))}
              </ul>
              <details>
                <summary>{t('Why suggested?', 'কেন প্রস্তাবিত?')}</summary>
                <p>
                  {t(
                    'The displayed window passed every mock environmental and help check. Alternative passing windows may be used to find the best compatible sequence.',
                    'দেখানো সময় নমুনার পরিবেশ ও শ্রমের সব শর্তে মেলে। সেরা মিলযুক্ত ক্রমে অন্য মেলা সময় ব্যবহার হতে পারে।',
                  )}
                </p>
                <p>
                  {t('Demo water demand index', 'নমুনার পানির চাহিদা সূচক')}:{' '}
                  {best[0].assessment.demand?.toFixed(1)} / 3
                </p>
              </details>
            </section>
          );
        })}
      </div>
      {!choices.length && (
        <p role="status">
          {t(
            'No crops pass these mock conditions. Review soil, water, drainage, climate or unavailable-help months; nothing is substituted.',
            'নমুনার শর্তে কোনো ফসল মেলেনি। মাটি, পানি, নিষ্কাশন, জলবায়ু বা শ্রমের মাস দেখুন; বিকল্প ধরে নেওয়া হয় না।',
          )}
        </p>
      )}
      <section className="choice-panel" data-tour="build-calendar">
        <div>
          <h2>{t('Ready for your calendar?', 'ক্যালেন্ডারের জন্য প্রস্তুত?')}</h2>
          <p role="status">
            {missing.length
              ? t(
                  `Choose a suggested crop for: ${missing.map((i) => seasons[i]).join(', ')}.`,
                  `প্রস্তাবিত ফসল বাছুন: ${missing.map((i) => seasons[i]).join(', ')}।`,
                )
              : !candidates.length
                ? t(
                    'These choices cannot meet every household or timing constraint together. Add more suggested crops or review your requirements.',
                    'এই ফসলগুলো একসঙ্গে পরিবার ও সময়ের সব শর্ত মেটায় না। আরও প্রস্তাবিত ফসল বাছুন বা শর্ত দেখুন।',
                  )
                : t(
                    `${candidates.length} compatible calendar options available. All dates are assigned automatically; no overlaps.`,
                    `${candidates.length}টি মিলযুক্ত ক্যালেন্ডার আছে। সময় স্বয়ংক্রিয়; একটির সঙ্গে অন্যটি মেলে না।`,
                  )}
          </p>
        </div>
        <button
          className="button primary"
          disabled={!candidates.length}
          onClick={() => {
            setDemo({ enabled: true });
            setJourney({ generatedFor: planFingerprint(farm, demo, priority) });
            select(candidates[0].id);
            router.push('/plan');
          }}
        >
          {t('Build my calendar', 'আমার ক্যালেন্ডার তৈরি করুন')}
          <ArrowRight size={20} />
        </button>
      </section>
      {!demoSaved && (
        <p role="status">
          {t(
            'Crop choices could not be saved; continue in this tab.',
            'ফসলের পছন্দ রাখা যায়নি; এই ট্যাবে চালিয়ে যান।',
          )}
        </p>
      )}
      <CropCatalogue />
    </div>
  );
}
export function TrackingView() {
  const {
    t,
    language,
    journey,
    setJourney,
    journeySaved,
    farm,
    demo,
    priority,
    tourPreview,
    evaluations,
  } = usePlanner();
  const [replace, setReplace] = useState(false);
  const tourRotation = evaluations[0]?.rotation;
  const tracked =
    journey.tracked ??
    (tourPreview && tourRotation
      ? {
          rotation: tourRotation,
          fingerprint: '',
          year: 2027,
          records: Object.fromEntries(
            tourRotation.periods
              .filter((p) => p.crop !== 'fallow')
              .map((p) => [
                activityKey(p.crop, p.start, p.duration),
                { planted: false, harvested: false, note: '' },
              ]),
          ),
        }
      : null);
  if (!tracked)
    return (
      <div className="page-enter calm-page">
        <h1>{t('Save a calendar to begin tracking', 'কাজের হিসাবের আগে ক্যালেন্ডার রাখুন')}</h1>
        <p>
          {t(
            'Choose a generated plan first. No planting or harvest is marked automatically.',
            'আগে তৈরি পরিকল্পনা বাছুন। রোপণ বা কাটা নিজে থেকে চিহ্নিত হয় না।',
          )}
        </p>
        <Link className="button primary" href="/plan">
          {t('Review calendar options', 'ক্যালেন্ডারের বিকল্প দেখুন')}
        </Link>
      </div>
    );
  const periods = tracked.rotation.periods.filter((p) => p.crop !== 'fallow');
  const completed = Object.values(tracked.records).reduce(
    (n, r) => n + Number(r.planted) + Number(r.harvested),
    0,
  );
  const stale = tracked.fingerprint !== planFingerprint(farm, demo, priority);
  return (
    <div className="page-enter calm-page">
      <header className="planner-heading">
        <div>
          <span className="eyebrow">
            {t('STEP 4 OF 4 · KEEP TRACK', 'ধাপ ৪ / ৪ · কাজের হিসাব')}
          </span>
          <h1>{t('Your saved calendar', 'আপনার রাখা ক্যালেন্ডার')}</h1>
          <p>
            {t(
              'Record what you actually do. The planned dates stay locked.',
              'বাস্তবে করা কাজ লিখুন। পরিকল্পনার সময় বদলায় না।',
            )}
          </p>
        </div>
        <Link className="button secondary" href="/plan">
          {t('Review calendar options', 'ক্যালেন্ডারের বিকল্প দেখুন')}
        </Link>
      </header>
      <p className="evidence-banner">
        {t(
          'Demo plan, farmer-entered progress. Completed tasks are not verified observations.',
          'নমুনার পরিকল্পনা, নিজের কাজের হিসাব। কাজের চিহ্ন যাচাইকৃত পর্যবেক্ষণ নয়।',
        )}
      </p>
      {stale && !tourPreview && (
        <p role="status" className="evidence-banner">
          {t(
            'Your farm or crop choices changed. This is the saved snapshot; create and explicitly save a replacement to change its dates. Existing progress is retained.',
            'খামার বা ফসলের পছন্দ বদলেছে। এটি আগে রাখা ক্রম; সময় বদলাতে নতুন ক্রম তৈরি করে রাখুন। আগের কাজের তথ্য থাকে।',
          )}
        </p>
      )}
      <section className="form-card" data-tour="tracking-calendar">
        <h2>{tracked.rotation.subtitle[language]}</h2>
        <p>
          {t('March', 'মার্চ')} {tracked.year} → {t('February', 'ফেব্রুয়ারি')} {tracked.year + 1}
        </p>
        <CalendarScrollHint />
        <div className="calendar-scroll">
          <div className="calendar-inner">
            <MonthHeader />
            <Timeline periods={tracked.rotation.periods} name={tracked.rotation.name[language]} />
          </div>
        </div>
        <CalendarLegend />
      </section>
      <section className="tracking-progress" data-tour="tracking-progress">
        <h2>{t('Your recorded progress', 'আপনার কাজের হিসাব')}</h2>
        <p>
          {completed} / {periods.length * 2}{' '}
          {t('planting and harvest tasks marked', 'রোপণ ও কাটার কাজ চিহ্নিত')}
        </p>
        <progress
          value={completed}
          max={periods.length * 2}
          aria-label={t('Recorded task progress', 'চিহ্নিত কাজের অগ্রগতি')}
        />
      </section>
      <div className="tracking-crops" data-tour="tracking-crops">
        {periods.map((period) => {
          const key = activityKey(period.crop, period.start, period.duration);
          const record = tracked.records[key];
          const update = (change: Partial<typeof record>) =>
            setJourney({
              tracked: {
                ...tracked,
                records: { ...tracked.records, [key]: { ...record, ...change } },
              },
            });
          return (
            <section className="form-card" key={key}>
              <h2>{previewData.crops[period.crop].name[language]}</h2>
              <p>
                {periodLabel(period, language)} ·{' '}
                {t('Assigned demo dates', 'নমুনার নির্ধারিত সময়')}
              </p>
              <div className="tracking-actions">
                <label>
                  <input
                    type="checkbox"
                    checked={record.planted}
                    disabled={record.harvested}
                    onChange={(e) => update({ planted: e.target.checked })}
                  />
                  {t('Planted', 'রোপণ হয়েছে')}
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={record.harvested}
                    disabled={!record.planted}
                    onChange={(e) => update({ harvested: e.target.checked })}
                  />
                  {t('Harvested', 'কাটা হয়েছে')}
                </label>
              </div>
              <p className="field-help">
                {t(
                  'Mark planting first. Undo harvest before undoing planting.',
                  'আগে রোপণ চিহ্নিত করুন। রোপণ সরানোর আগে কাটা সরান।',
                )}
              </p>
              <label className="form-field">
                {t('Notes', 'নোট')}
                <textarea
                  maxLength={500}
                  value={record.note}
                  onChange={(e) => update({ note: e.target.value })}
                />
              </label>
            </section>
          );
        })}
      </div>
      {!journeySaved && (
        <p role="status">
          {t(
            'Tracking could not be saved; keep this tab open.',
            'কাজের তথ্য রাখা যায়নি; এই ট্যাব খোলা রাখুন।',
          )}
        </p>
      )}
      <button className="button secondary" onClick={() => setReplace(true)}>
        {t('Clear saved calendar & progress', 'রাখা ক্যালেন্ডার ও কাজের তথ্য মুছুন')}
      </button>
      {replace && (
        <div className="form-card">
          <p>
            {t(
              'Clear this saved calendar and every recorded task/note?',
              'এই ক্যালেন্ডার ও সব কাজের চিহ্ন/নোট মুছবেন?',
            )}
          </p>
          <button className="button secondary" onClick={() => setReplace(false)}>
            {t('Keep my records', 'তথ্য রাখুন')}
          </button>
          <button
            className="button primary"
            onClick={() => {
              setJourney({ tracked: null });
              setReplace(false);
            }}
          >
            {t('Clear records', 'তথ্য মুছুন')}
          </button>
        </div>
      )}
    </div>
  );
}
