'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { usePlanner } from './planner-provider';
import {
  suggestDemoWindows,
  generateDemoPlans,
  planFingerprint,
  farmFingerprint,
  blockingHousehold,
  repairSelection,
  selectionStatus,
  viableCropSets,
} from '../domain/demo-planner';
import { previewData, months } from '../data/preview';
import { defaultFarm } from '../data/preview';
import { defaultDemo } from '../data/demo-environment';
import type { CropId, CropPeriod } from '../domain/types';
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
        {t('FOLLOW YOUR FARM PLAN', 'চাষের পরিকল্পনার ধাপ অনুসরণ করুন')}
      </span>
      <h1>
        {step === 'farm'
          ? t('Start with your farm', 'আপনার জমি দিয়ে শুরু করুন')
          : t('Choose suggested crops first', 'আগে প্রস্তাবিত ফসল বাছুন')}
      </h1>
      <p>
        {t(
          'Farm details → suggested crops → an automatic calendar → tracking. Your dates are checked before any plan can be saved.',
          'জমির তথ্য → প্রস্তাবিত ফসল → স্বয়ংক্রিয় ক্যালেন্ডার → কাজের হিসাব। রাখার আগে সময়ের মিল যাচাই হয়।',
        )}
      </p>
      <Link className="button primary" href={step === 'farm' ? '/farm' : '/crops'}>
        {step === 'farm'
          ? t('Review farm details', 'জমির তথ্য দেখুন')
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
    setFarm,
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
  const { sets, offered, preferred, candidates, unfit } = useMemo(() => {
    const sets = viableCropSets(sourceFarm, settings, priority);
    // Only offer crops that can appear in a complete calendar. When no mix can pass, show every
    // suggestion so the panel below can explain the blocker.
    const offered = sets.length
      ? suggestions.filter((s) => sets.some((set) => set.includes(s.period.crop)))
      : suggestions;
    // Stale choices (e.g. household needs changed on the farm page) gain the fewest crops needed.
    const preferred = repairSelection(settings.preferred, offered, sets);
    const candidates = generateDemoPlans(sourceFarm, { ...settings, preferred }, priority);
    // Household groups no suggested crop can satisfy; no crop choice could fix these.
    const unfit = sets.length ? [] : blockingHousehold(sourceFarm, settings, priority);
    return { sets, offered, preferred, candidates, unfit };
  }, [sourceFarm, settings, priority, suggestions]);
  const added = preferred.filter((crop) => !settings.preferred.includes(crop));
  const choices = [...new Set(offered.map((s) => s.period.crop))];
  if (!reviewed && !tourPreview) return <JourneyGate />;
  const seasons = [t('Pre-monsoon', 'প্রাক্‌বর্ষা'), t('Monsoon', 'বর্ষা'), t('Winter', 'শীত')];
  const unavailable = [0, 1, 2].filter((season) => !suggestions.some((s) => s.season === season));
  const unselected = [0, 1, 2].filter(
    (season) =>
      !unavailable.includes(season) &&
      !offered.some((s) => s.season === season && preferred.includes(s.period.crop)),
  );
  const groupNames = {
    rice: t('rice', 'ধান'),
    pulses: t('pulses', 'ডাল'),
    potato: t('potato', 'আলু'),
  };
  const unfitNames = unfit.map((group) => groupNames[group]).join(', ');
  const cropNames = (ids: CropId[]) =>
    ids.map((id) => previewData.crops[id].name[language]).join(', ');
  // Why a toggle is blocked: it would leave every season chosen but no calendar possible.
  const blockedReason = (id: CropId) => {
    const chosen = preferred.includes(id);
    const next = chosen ? preferred.filter((c) => c !== id) : [...preferred, id];
    if (!sets.length || selectionStatus(next, offered, sets) !== 'conflict') return null;
    const missing = sourceFarm.required
      .filter(
        (group) =>
          !offered.some(
            (s) =>
              next.includes(s.period.crop) && previewData.crops[s.period.crop].household === group,
          ),
      )
      .map((group) => groupNames[group])
      .join(', ');
    if (chosen)
      return missing
        ? t(`Keeps ${missing} in your calendar.`, `ক্যালেন্ডারে ${missing} রাখতে দরকার।`)
        : t(
            'Needed so your other choices still make a calendar.',
            'অন্য পছন্দগুলো দিয়ে ক্যালেন্ডার হতে এটি দরকার।',
          );
    return missing
      ? t(`Choose a ${missing} crop first.`, `আগে একটি ${missing} ফসল বাছুন।`)
      : t(
          'Does not fit a calendar with your other choices.',
          'আপনার অন্য পছন্দের সঙ্গে ক্যালেন্ডারে মেলে না।',
        );
  };
  return (
    <div className="page-enter calm-page">
      <header className="planner-heading">
        <div>
          <span className="eyebrow">
            {t('STEP 2 OF 4 · SUGGESTED CROPS', 'ধাপ ২ / ৪ · প্রস্তাবিত ফসল')}
          </span>
          <h1>{t('Choose from your farm’s matches', 'জমির সঙ্গে মেলা ফসল বাছুন')}</h1>
          <p>
            {t(
              'Select the crops you want to consider. RITU chooses compatible planting windows and builds the calendar.',
              'যেসব ফসল চান বাছুন। ঋতু উপযুক্ত সময় মিলিয়ে ক্যালেন্ডার তৈরি করবে।',
            )}
          </p>
        </div>
        <Link className="button secondary" href="/farm">
          {t('Edit farm', 'জমির তথ্য বদলান')}
        </Link>
      </header>
      <p className="evidence-banner">
        {t(
          'No real data API or verified farming recommendation.',
          'বাস্তব API বা চাষের যাচাইকৃত পরামর্শ নয়।',
        )}
      </p>
      <section className="suggestion-intro" data-tour="suggestion-summary">
        <h2>{t('Matched to your conditions', 'আপনার শর্তের সঙ্গে মেলে')}</h2>
        <p>
          {t(
            'Every selectable window passes the soil, water, drainage, climate and available-help checks. Missing or conflicting windows are excluded.',
            'বাছার প্রতিটি সময় মাটি, পানি, নিষ্কাশন, জলবায়ু ও শ্রমের শর্তে মেলে। অজানা বা সংঘাতের সময় বাদ যায়।',
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
          const reason = blockedReason(id);
          return (
            <section
              className={`suggested-crop ${preferred.includes(id) ? 'chosen' : ''}`}
              key={id}
            >
              <label className="suggested-crop-choice">
                <input
                  type="checkbox"
                  aria-label={`${t('Consider', 'বিবেচনা করুন')} ${previewData.crops[id].name[language]}`}
                  aria-describedby={reason ? `crop-lock-${id}` : undefined}
                  checked={preferred.includes(id)}
                  disabled={!!reason}
                  onChange={() =>
                    setDemo({
                      preferred: preferred.includes(id)
                        ? preferred.filter((crop) => crop !== id)
                        : [...preferred, id],
                      enabled: false,
                    })
                  }
                />
                <strong>{previewData.crops[id].name[language]}</strong>
              </label>
              {reason && (
                <p className="suggested-crop-lock" id={`crop-lock-${id}`}>
                  {reason}
                </p>
              )}
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
                    'The displayed window passed every environmental and help check. Alternative passing windows may be used to find the best compatible sequence.',
                    'দেখানো সময় পরিবেশ ও শ্রমের সব শর্তে মেলে। সেরা মিলযুক্ত ক্রমে অন্য মেলা সময় ব্যবহার হতে পারে।',
                  )}
                </p>
                <p>
                  {t('Water demand index', 'পানির চাহিদা সূচক')}:{' '}
                  {best[0].assessment.demand?.toFixed(1)} / 3
                </p>
              </details>
            </section>
          );
        })}
      </div>
      {!!added.length && (
        <p role="status" className="suggested-crop-added">
          {t(
            `Added ${cropNames(added)} so your choices can make a full calendar with your household crops.`,
            `${cropNames(added)} যোগ করা হয়েছে, যাতে পরিবারের ফসলসহ পূর্ণ ক্যালেন্ডার তৈরি হয়।`,
          )}
        </p>
      )}
      {!choices.length && (
        <p role="status">
          {t(
            'No crops pass these conditions. Review soil, water, drainage, climate or unavailable-help months; nothing is substituted.',
            'শর্তে কোনো ফসল মেলেনি। মাটি, পানি, নিষ্কাশন, জলবায়ু বা শ্রমের মাস দেখুন; বিকল্প ধরে নেওয়া হয় না।',
          )}
        </p>
      )}
      <section className="choice-panel" data-tour="build-calendar">
        <div>
          <h2>
            {unavailable.length
              ? t('A full calendar is not available yet', 'এখনো পূর্ণ ক্যালেন্ডার পাওয়া যাচ্ছে না')
              : t('Ready for your calendar?', 'ক্যালেন্ডারের জন্য প্রস্তুত?')}
          </h2>
          <p role="status">
            {unavailable.length
              ? t(
                  `No matching crop windows for: ${unavailable.map((i) => seasons[i]).join(', ')}.`,
                  `এই মৌসুমে শর্তে কোনো ফসলের সময় মেলেনি: ${unavailable.map((i) => seasons[i]).join(', ')}।`,
                )
              : unfit.length
                ? t(
                    `No crop suggested for this farm can include ${unfitNames} in a full calendar. Remove it from your household crops to continue.`,
                    `এই জমির প্রস্তাবিত কোনো ফসলে পূর্ণ ক্যালেন্ডারে ${unfitNames} রাখা যায় না। এগোতে পরিবারের ফসল থেকে এটি বাদ দিন।`,
                  )
                : unselected.length
                  ? t(
                      `Choose a suggested crop for: ${unselected.map((i) => seasons[i]).join(', ')}.`,
                      `প্রস্তাবিত ফসল বাছুন: ${unselected.map((i) => seasons[i]).join(', ')}।`,
                    )
                  : !candidates.length
                    ? t(
                        'No mix of the suggested crops can include every crop your household wants to keep. Review your household crops on the farm page.',
                        'প্রস্তাবিত ফসলের কোনো মিশ্রণে পরিবারের চাওয়া সব ফসল রাখা যায় না। জমির পাতায় পরিবারের ফসল দেখুন।',
                      )
                    : t(
                        `${candidates.length} compatible calendar options available. All dates are assigned automatically; no overlaps.`,
                        `${candidates.length}টি মিলযুক্ত ক্যালেন্ডার আছে। সময় স্বয়ংক্রিয়; একটির সঙ্গে অন্যটি মেলে না।`,
                      )}
          </p>
          {!!unavailable.length && (
            <p>
              {t(
                'These seasons have no selectable suggestions under your current conditions. This planner requires one crop in each of the three seasons. Review soil, drainage, water, climate and help availability; a conflicting calendar is never forced.',
                'বর্তমান শর্তে এই মৌসুমে বাছার মতো ফসল নেই। এখানে তিনটি মৌসুমের প্রতিটিতে একটি ফসল লাগে। মাটি, নিষ্কাশন, পানি, জলবায়ু ও শ্রমের তথ্য দেখুন; শর্ত না মিললে জোর করে ক্যালেন্ডার তৈরি হয় না।',
              )}
            </p>
          )}
          {!!unavailable.length && !!unselected.length && (
            <p>
              {t(
                `Also choose from the available suggestions for: ${unselected.map((i) => seasons[i]).join(', ')}.`,
                `এছাড়া মেলা প্রস্তাব থেকে ফসল বাছুন: ${unselected.map((i) => seasons[i]).join(', ')}।`,
              )}
            </p>
          )}
        </div>
        <div className="calendar-actions">
          {!!unfit.length && !tourPreview && (
            <button
              className="button primary"
              onClick={() => {
                const next = { ...farm, required: farm.required.filter((g) => !unfit.includes(g)) };
                setFarm({ required: next.required });
                // Keep the farm review valid so the crop list stays open after the fix.
                setJourney({ reviewed: farmFingerprint(next, demo, priority), generatedFor: null });
              }}
            >
              {t(
                `Remove ${unfitNames} from household crops`,
                `পরিবারের ফসল থেকে ${unfitNames} বাদ দিন`,
              )}
            </button>
          )}
          {!candidates.length && (
            <Link className="button secondary" href="/farm">
              {t('Review farm conditions', 'জমির শর্ত দেখুন')}
            </Link>
          )}
          <button
            className="button primary"
            disabled={!candidates.length}
            onClick={() => {
              setDemo({ enabled: true, preferred });
              setJourney({ generatedFor: planFingerprint(farm, { ...demo, preferred }, priority) });
              select(candidates[0].id);
              router.push('/plan');
            }}
          >
            {t('Build my calendar', 'আমার ক্যালেন্ডার তৈরি করুন')}
            <ArrowRight size={20} />
          </button>
        </div>
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
          'Generated plan, farmer-entered progress. Completed tasks are not verified observations.',
          'পরিকল্পনা, নিজের কাজের হিসাব। কাজের চিহ্ন যাচাইকৃত পর্যবেক্ষণ নয়।',
        )}
      </p>
      {stale && !tourPreview && (
        <p role="status" className="evidence-banner">
          {t(
            'Your farm or crop choices changed. This is the saved snapshot; create and explicitly save a replacement to change its dates. Existing progress is retained.',
            'জমির তথ্য বা ফসলের পছন্দ বদলেছে। এটি আগে রাখা ক্রম; সময় বদলাতে নতুন ক্রম তৈরি করে রাখুন। আগের কাজের তথ্য থাকে।',
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
                {periodLabel(period, language)} · {t('Assigned dates', 'নির্ধারিত সময়')}
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
