'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleAlert, CircleHelp } from 'lucide-react';
import { usePlanner } from './planner-provider';
import { JourneyGate } from './journey-views';
import { CalendarLegend, CalendarScrollHint, MonthHeader, Status, Timeline } from './calendar';
import { PriorityControl } from './farm-controls';
import { evidenceSources } from '../data/evidence';
import { DemoPlanReasons } from './demo-planning';

export function InsightsView() {
  const { t, language, selected, evaluations, select, reviewed, planReady, tourPreview } =
    usePlanner();
  const [acknowledged, setAcknowledged] = useState(false);
  if ((!planReady || !evaluations.length) && !tourPreview)
    return <JourneyGate step={reviewed ? 'crops' : 'farm'} />;
  const blockers = selected.checks.filter((check) => check.state === 'block');
  return (
    <div className="page-enter calm-page">
      <header className="page-heading">
        <div>
          <span className="eyebrow">{t('3 · REVIEW THE REASONS', '৩ · কারণগুলো দেখুন')}</span>
          <h1>{t('Know the why.', 'কেন, তা বুঝুন।')}</h1>
          <p>
            {t(
              'See what your entries tell us—and what still needs evidence.',
              'আপনার তথ্য থেকে যা জানা যায় এবং যেখানে প্রমাণ দরকার তা দেখুন।',
            )}
          </p>
        </div>
        <Link href="/plan" className="button secondary">
          <ArrowLeft size={20} />
          {t('Back to comparison', 'তুলনায় ফিরে যান')}
        </Link>
      </header>
      <div
        className="option-tabs"
        aria-label={t('Choose an option to explain', 'ব্যাখ্যার জন্য বিকল্প বাছুন')}
      >
        {evaluations.map((e) => (
          <button
            key={e.rotation.id}
            className={e.rotation.id === selected.rotation.id ? 'active' : ''}
            aria-pressed={e.rotation.id === selected.rotation.id}
            onClick={() => {
              select(e.rotation.id);
              setAcknowledged(false);
            }}
          >
            {e.rotation.name[language]}
          </button>
        ))}
      </div>
      <section className="insight-summary">
        <div className="insight-summary-copy">
          <h2>{selected.rotation.name[language]}</h2>
          <p>{selected.rotation.subtitle[language]}</p>
          <Status status={selected.status} />
        </div>
      </section>
      <DemoPlanReasons rotation={selected.rotation} />
      <div className="next-step-card simple-next-step">
        <div>
          <h2>
            {blockers.length
              ? t('Review these conflicts first', 'আগে এই সংঘাতগুলো দেখুন')
              : t('Ask a local agricultural adviser', 'স্থানীয় কৃষি পরামর্শকের সঙ্গে কথা বলুন')}
          </h2>
          <p>
            {t(
              'No rotation is verified for your field yet. Use this saved calendar for discussion.',
              'আপনার জমির জন্য কোনো ফসলক্রম এখনো যাচাই হয়নি। রাখা ক্যালেন্ডার নিয়ে আলোচনা করুন।',
            )}
          </p>
        </div>
        <Link href="/farm" className="button primary">
          {t('Review my farm inputs', 'জমির তথ্য দেখুন')}
          <ArrowRight size={20} />
        </Link>
      </div>
      <section className="checks-card">
        <h2>{t('Check this selection', 'এই পছন্দ যাচাই করুন')}</h2>
        <p>
          {t(
            'Open a row for its reason. Water, drainage and soil suitability remain unassessed.',
            'কারণ জানতে একটি সারি খুলুন। পানি, নিষ্কাশন ও মাটির উপযোগিতা যাচাই বাকি।',
          )}
        </p>
        {selected.checks.map((check) => {
          const Icon =
            check.state === 'pass' ? Check : check.state === 'block' ? CircleAlert : CircleHelp;
          return (
            <details className={`check-row check-disclosure ${check.state}`} key={check.id}>
              <summary>
                <Icon size={20} />
                <strong>{check.label[language]}</strong>
                <span>
                  {check.state === 'pass'
                    ? t('Entry checked', 'তথ্য মিলেছে')
                    : check.state === 'block'
                      ? t('Conflict', 'সংঘাত')
                      : t('Not assessed', 'যাচাই বাকি')}
                </span>
              </summary>
              <p>{check.detail[language]}</p>
            </details>
          );
        })}
      </section>
      <details className="disclosure">
        <summary>{t('Sequence details', 'ফসলক্রমের বিস্তারিত')}</summary>
        <section className="tradeoffs-card">
          <h2>{t('What is in this example?', 'এখানে কী আছে?')}</h2>
          <div className="tradeoff-grid">
            <div>
              <small>{t('Reviewed botanical families', 'যাচাইকৃত উদ্ভিদ পরিবার')}</small>
              <strong>{selected.familyCount}</strong>
              <span>
                {t(
                  'Only sourced families counted; extra crop taxonomy awaits review',
                  'শুধু যাচাইকৃত পরিবার গণনা; বাড়তি ফসলের পরিবার যাচাই বাকি',
                )}
              </span>
            </div>
            <div>
              <small>{t('Reviewed legume anatomy', 'যাচাইকৃত ডালজাতীয় গঠন')}</small>
              <strong>
                {selected.legumeMonths ? t('Included', 'আছে') : t('Not recorded', 'নথিভুক্ত নয়')}
              </strong>
              <span>{t('No soil benefit estimated', 'মাটির উপকার হিসাব হয়নি')}</span>
            </div>
            <div>
              <small>{t('Water demand', 'পানির চাহিদা')}</small>
              <strong>{t('Not assessed', 'যাচাই বাকি')}</strong>
              <span>
                {t('No water saving or yield estimate', 'পানি সাশ্রয় বা ফলনের হিসাব নেই')}
              </span>
            </div>
          </div>
        </section>
      </details>
      <details className="disclosure">
        <summary>{t('Evidence & sources', 'প্রমাণ ও উৎস')}</summary>
        <section className="checks-card missing-card">
          <h2>{t('What remains to be verified', 'যা যাচাই করা বাকি')}</h2>
          <ul className="evidence-list">
            <li>
              <strong>{t('Rainfall & dry spells', 'বৃষ্টি ও বৃষ্টিহীন সময়')}</strong>
              <p>
                {t(
                  'NASA precipitation data is not connected. No dry-spell result is shown.',
                  'নাসার বৃষ্টির তথ্য যুক্ত হয়নি। বৃষ্টিহীন সময়ের ফলাফল দেখানো হচ্ছে না।',
                )}
              </p>
            </li>
            <li>
              <strong>{t('Crop-stage heat exposure', 'ফসলের পর্যায়ে তাপের প্রভাব')}</strong>
              <p>
                {t(
                  'Temperature histories, crop stages and thresholds need reviewed evidence.',
                  'তাপমাত্রার ইতিহাস, ফসলের পর্যায় ও সীমার জন্য যাচাইকৃত প্রমাণ দরকার।',
                )}
              </p>
            </li>
            <li>
              <strong>{t('Local crop & soil suitability', 'স্থানীয় ফসল ও মাটির উপযোগিতা')}</strong>
              <p>
                {t(
                  'These locked dates are not local recommendations. No soil-health outcome has been estimated.',
                  'এই স্থির সময় স্থানীয় সুপারিশ নয়। মাটির স্বাস্থ্যের ফলাফল হিসাব হয়নি।',
                )}
              </p>
            </li>
          </ul>
          <p>
            {t(
              'The concept follows the published Field Shift summary; NASA-data integration and local validation are still required.',
              'ধারণাটি প্রকাশিত Field Shift সারাংশ অনুসরণ করে; নাসার তথ্য যোগ করা ও স্থানীয় যাচাই বাকি।',
            )}
          </p>
          <ul className="model-references">
            {evidenceSources.map((source) => (
              <li key={source.url}>
                <a href={source.url} target="_blank" rel="noopener noreferrer">
                  {source.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      </details>
      <details className="disclosure">
        <summary>{t('Saved priorities', 'রাখা অগ্রাধিকার')}</summary>
        <PriorityControl />
      </details>
      <details className="disclosure">
        <summary>{t('See the full year', 'পুরো বছর দেখুন')}</summary>
        <section className="form-card insight-calendar">
          <h2>{t('The year behind this choice', 'এই পছন্দের বছরের চিত্র')}</h2>
          <CalendarScrollHint />
          <div className="calendar-scroll">
            <div className="calendar-inner">
              <MonthHeader />
              <Timeline
                periods={selected.rotation.periods}
                name={selected.rotation.name[language]}
              />
            </div>
          </div>
          <CalendarLegend />
        </section>
      </details>
      <button className="button secondary" onClick={() => setAcknowledged(true)}>
        <Check size={20} />
        {t('Keep this preview choice', 'এই পছন্দ রাখুন')}
      </button>
      {acknowledged && (
        <p className="choice-confirmation" role="status">
          {t(
            'Saved on this device for discussion. This is not a verified recommendation.',
            'আলোচনার জন্য এই ডিভাইসে রাখা হয়েছে। এটি যাচাইকৃত সুপারিশ নয়।',
          )}
        </p>
      )}
    </div>
  );
}
