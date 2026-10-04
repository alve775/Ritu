'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Box, Check, SlidersHorizontal } from 'lucide-react';
import { usePlanner } from './planner-provider';
import { SeasonExplorer } from './season-explorer';
import { CalendarLegend, CalendarScrollHint, MonthHeader, RotationRow, Status } from './calendar';
import { ScenarioSimulator } from './demo-planning';
import { assessDemo, planFingerprint } from '../domain/demo-planner';
import { JourneyGate } from './journey-views';
import { activityKey } from '../lib/journey-store';
import { Dialog } from './dialog';
import { prefersReducedMotion } from '../lib/motion';

export function CompareView() {
  const {
    t,
    language,
    farm,
    evaluations,
    selected,
    select,
    demo,
    priority,
    setFieldOpen,
    reviewed,
    planReady,
    tourPreview,
    journey,
    setJourney,
  } = usePlanner();
  const router = useRouter();
  const [onlySelected, setOnlySelected] = useState(true);
  const [year, setYear] = useState(String(journey.tracked?.year ?? 2027));
  const [confirmSave, setConfirmSave] = useState(false);
  const validYear = Number.isInteger(Number(year)) && Number(year) >= 2000 && Number(year) <= 2100;
  const saveCalendar = () => {
    if (!validYear || !evaluations.length) return;
    const rotation = {
      ...selected.rotation,
      periods: selected.rotation.periods.map((p) => ({ ...p })),
    };
    setJourney({
      tracked: {
        rotation,
        fingerprint: planFingerprint(farm, demo, priority),
        year: Number(year),
        records: Object.fromEntries(
          rotation.periods
            .filter((p) => p.crop !== 'fallow')
            .map((p) => [
              activityKey(p.crop, p.start, p.duration),
              { planted: false, harvested: false, note: '' },
            ]),
        ),
      },
    });
    setConfirmSave(false);
    router.push('/track');
  };
  if ((!planReady || !evaluations.length) && !tourPreview)
    return <JourneyGate step={reviewed ? 'crops' : 'farm'} />;
  const options = onlySelected ? [selected] : evaluations;
  return (
    <div className="page-enter calm-page">
      <header className="planner-heading">
        <div>
          <span className="eyebrow">
            {t('STEP 3 OF 4 · YOUR CALENDAR', 'ধাপ ৩ / ৪ · আপনার ক্যালেন্ডার')}
          </span>
          <h1>{t('Choose your automatic calendar', 'স্বয়ংক্রিয় ক্যালেন্ডার বাছুন')}</h1>
          <p>
            {t(
              'These options use only your suggested crop choices. Dates are assigned and locked; crop periods never overlap.',
              'শুধু বাছা প্রস্তাবিত ফসলের ক্রম। সময় নির্ধারিত ও স্থির; ফসলের সময় মেলে না।',
            )}
          </p>
        </div>
        <div className="planner-actions">
          <button
            className="button secondary"
            onClick={() => {
              setFieldOpen(true);
              requestAnimationFrame(() =>
                document.getElementById('field')?.scrollIntoView({
                  behavior: prefersReducedMotion() ? 'instant' : 'smooth',
                  block: 'start',
                }),
              );
            }}
          >
            <Box size={20} />
            {t('Explore 3D crops', 'থ্রিডি ফসল দেখুন')}
          </button>
          <Link href="/farm" className="button secondary">
            <SlidersHorizontal size={20} />
            {t('Edit farm', 'খামার বদলান')}
          </Link>
        </div>
      </header>
      <p className="evidence-banner">
        {t(
          'Demo only. Climate numbers and planning rules are fictional. No NASA data API or verified local recommendation.',
          'শুধু নমুনা। জলবায়ুর সংখ্যা ও পরিকল্পনার নিয়ম কাল্পনিক। নাসার API বা যাচাইকৃত স্থানীয় সুপারিশ নেই।',
        )}
      </p>
      <section
        className="rotation-picker"
        aria-label={t('Choose a rotation example', 'ফসলক্রমের নমুনা বাছুন')}
      >
        {evaluations.map((evaluation) => (
          <section
            className={`option-card ${evaluation.rotation.id === selected.rotation.id ? 'selected' : ''}`}
            key={evaluation.rotation.id}
            aria-label={evaluation.rotation.name[language]}
          >
            <button
              className="option-card-select"
              aria-pressed={evaluation.rotation.id === selected.rotation.id}
              aria-label={`${t('Select', 'বাছুন')} ${evaluation.rotation.name[language]}`}
              onClick={() => select(evaluation.rotation.id)}
            >
              <span className="option-selection-mark" aria-hidden="true">
                {evaluation.rotation.id === selected.rotation.id && <Check size={20} />}
              </span>
              <strong>{evaluation.rotation.name[language]}</strong>
              <span>{evaluation.rotation.subtitle[language]}</span>
            </button>
            <Status status={evaluation.status} />
            {demo.enabled && !evaluation.rotation.isCurrent && (
              <p className="demo-card-result">
                {(() => {
                  const result = assessDemo(evaluation.rotation, farm, demo);
                  return t(
                    `Mock model: ${result.conflicts} conflicts · ${result.unknowns} unknowns`,
                    `কাল্পনিক মডেল: ${result.conflicts} সংঘাত · ${result.unknowns} অজানা`,
                  );
                })()}
              </p>
            )}
          </section>
        ))}
      </section>
      <div className="choice-panel choice-summary">
        <div>
          <span>{t('Your selection', 'আপনার পছন্দ')}</span>
          <h2>{selected.rotation.name[language]}</h2>
          <p>
            {t(
              'Selection is saved. This is not a farming recommendation.',
              'পছন্দ রাখা হয়েছে। এটি চাষের সুপারিশ নয়।',
            )}
          </p>
        </div>
        <Link href="/insights" className="button primary">
          {t('Understand this choice', 'পছন্দের ব্যাখ্যা দেখুন')}
          <ArrowRight size={20} />
        </Link>
      </div>
      <div className="demo-next-actions">
        <Link className="button secondary" href="/crops">
          {t('Change my crop choices', 'ফসলের পছন্দ বদলান')}
        </Link>
        <a
          className="text-button"
          href="#scenario-simulator"
          onClick={() => {
            const element = document.getElementById('scenario-simulator');
            if (element instanceof HTMLDetailsElement) element.open = true;
          }}
        >
          {t('Try a water-shortage scenario', 'পানির সংকটের পরিস্থিতি দেখুন')}
          <ArrowRight size={18} />
        </a>
      </div>
      <details className="disclosure" id="rotations" open>
        <summary>{t('See the planting months', 'রোপণের মাস দেখুন')}</summary>
        <section className="calendar-board" aria-label={t('Rotation comparison', 'ফসলক্রম তুলনা')}>
          <div className="board-heading">
            <h2>{t('Rotation calendars', 'ফসলের ক্যালেন্ডার')}</h2>
            <div className="view-toggle">
              <button aria-pressed={!onlySelected} onClick={() => setOnlySelected(false)}>
                {t('All options', 'সব বিকল্প')}
              </button>
              <button aria-pressed={onlySelected} onClick={() => setOnlySelected(true)}>
                {t('My selection', 'আমার পছন্দ')}
              </button>
            </div>
          </div>
          <CalendarScrollHint />
          <div className="calendar-scroll">
            <div className="calendar-inner">
              <MonthHeader />
              {options.map((evaluation) => (
                <RotationRow
                  key={evaluation.rotation.id}
                  evaluation={evaluation}
                  index={evaluations.findIndex((e) => e.rotation.id === evaluation.rotation.id)}
                  onExplain={() => router.push('/insights')}
                />
              ))}
            </div>
          </div>
          <CalendarLegend />
          <p className="calendar-footnote">
            {t(
              'Locked mock windows, March–February. Empty intervals are explicitly marked rest. Real dates need local review.',
              'মার্চ–ফেব্রুয়ারির স্থির নমুনা। খালি সময় বিরতি হিসেবে থাকে। বাস্তব সময় যাচাই দরকার।',
            )}
          </p>
        </section>
      </details>
      <section className="choice-panel" data-tour="save-calendar">
        <div>
          <h2>{t('Save this calendar & keep track', 'এই ক্যালেন্ডার রাখুন ও কাজের হিসাব করুন')}</h2>
          <label className="form-field">
            {t('Cycle starts in March of', 'চক্র শুরু হবে মার্চে, বছর')}
            <input
              type="number"
              min={2000}
              max={2100}
              value={year}
              aria-invalid={!validYear}
              onChange={(e) => setYear(e.target.value)}
            />
          </label>
          <p>
            {t(
              'The year labels the saved cycle; it does not change mock climate or assigned planting windows.',
              'বছর চক্রের নাম; নমুনার জলবায়ু বা সময় বদলায় না।',
            )}
          </p>
        </div>
        <button
          className="button primary"
          disabled={!validYear}
          onClick={() => {
            const existing = journey.tracked;
            if (
              existing?.rotation.id === selected.rotation.id &&
              existing.year === Number(year) &&
              existing.fingerprint === planFingerprint(farm, demo, priority)
            )
              router.push('/track');
            else if (existing) setConfirmSave(true);
            else saveCalendar();
          }}
        >
          {t('Save calendar & track', 'ক্যালেন্ডার রাখুন ও হিসাব করুন')}
          <ArrowRight size={20} />
        </button>
      </section>
      {confirmSave && (
        <Dialog
          title={t('Replace your saved calendar?', 'রাখা ক্যালেন্ডার বদলাবেন?')}
          onClose={() => setConfirmSave(false)}
        >
          <p>
            {t(
              'Replacing clears the previous calendar’s planting, harvest and notes. Keep your records if that cycle is still in progress.',
              'বদলালে আগের রোপণ, কাটা ও নোট মুছে যাবে। কাজ চললে আগের তথ্য রাখুন।',
            )}
          </p>
          <button className="button secondary" onClick={() => setConfirmSave(false)}>
            {t('Keep my records', 'তথ্য রাখুন')}
          </button>
          <button className="button primary" onClick={saveCalendar}>
            {t('Replace calendar', 'ক্যালেন্ডার বদলান')}
          </button>
        </Dialog>
      )}
      <ScenarioSimulator />
      <SeasonExplorer />
    </div>
  );
}
