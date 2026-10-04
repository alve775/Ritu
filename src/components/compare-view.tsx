'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Check, SlidersHorizontal } from 'lucide-react';
import { usePlanner } from './planner-provider';
import { SeasonExplorer } from './season-explorer';
import { CalendarLegend, CalendarScrollHint, MonthHeader, RotationRow, Status } from './calendar';
import { PriorityControl, WaterControl } from './farm-controls';
import { CropCatalogue } from './crop-catalogue';

export function CompareView() {
  const { t, language, farm, evaluations, selected, select } = usePlanner();
  const router = useRouter();
  const [onlySelected, setOnlySelected] = useState(true);
  const options = onlySelected ? [selected] : evaluations;
  return (
    <div className="page-enter calm-page">
      <header className="planner-heading">
        <div>
          <span className="eyebrow">{t('2 · EXPLORE YOUR OPTIONS', '২ · বিকল্পগুলো দেখুন')}</span>
          <h1>{t('Compare crop rotations', 'ফসলক্রম তুলনা করুন')}</h1>
          <p>
            {t(
              'Choose one example. Open its calendar when you need the dates.',
              'একটি নমুনা বাছুন। সময় দেখতে ক্যালেন্ডার খুলুন।',
            )}
          </p>
        </div>
        <Link href="/farm" className="button secondary">
          <SlidersHorizontal size={20} />
          {t('Edit farm', 'খামার বদলান')}
        </Link>
      </header>
      <p className="evidence-banner">
        {t(
          'Example calendars only. NASA climate data and local crop suitability are not assessed.',
          'শুধু নমুনা ক্যালেন্ডার। নাসার জলবায়ুর তথ্য ও স্থানীয় ফসলের উপযোগিতা যাচাই বাকি।',
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
      <details className="disclosure" id="rotations">
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
              'Editable examples, March–February. Dates need local review.',
              'মার্চ–ফেব্রুয়ারির সম্পাদনযোগ্য নমুনা। তারিখ স্থানীয়ভাবে যাচাই দরকার।',
            )}
          </p>
        </section>
      </details>
      <details className="disclosure">
        <summary>{t('Water access & priorities', 'সেচের সুযোগ ও অগ্রাধিকার')}</summary>
        <div className="simple-controls">
          <WaterControl />
          <PriorityControl />
        </div>
        <p>
          {t(
            `Farm: ${farm.name}. These inputs are saved; water suitability remains unassessed.`,
            `খামার: ${farm.name}। তথ্য রাখা হয়েছে; পানির উপযোগিতা যাচাই বাকি।`,
          )}
        </p>
      </details>
      <SeasonExplorer />
      <CropCatalogue />
    </div>
  );
}
