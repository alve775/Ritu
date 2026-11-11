'use client';
import Link from 'next/link';
import { rajshahiRegion } from '../data/regions/rajshahi';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  ExternalLink,
  Download,
  X,
  MapPin,
  CalendarDays,
} from 'lucide-react';
import { usePlanner } from './planner-provider';
import { FarmLocation } from './farm-location';
import { WeatherContent } from './weather-panel';
import { useLiveWeather } from '../lib/use-live-weather';
import { weatherIsRecent } from '../domain/live-weather';
import { CropPhoto } from './crop-photo';
import { FarmAreaField } from './farm-area-field';
import { planningIssues } from '../domain/planning-issues';
import { crops } from '../data/crops';
import { regionalCalendars, calendarByCrop } from '../data/regional-calendars';
import {
  evidencePlans,
  referencePeriods,
  addDays,
  validDate,
  upcomingSeasons,
} from '../domain/evidence-planner';
import type { Season } from '../domain/evidence-planner';
import type { EvidencePlan, DatedPeriod } from '../domain/evidence-planner';
import { profileKey } from '../lib/evidence-store';
import type { RealActivity, SavedEvidencePlan } from '../lib/evidence-store';
import { inPilotRegion } from '../domain/farm-site';
import type { Farm, HouseholdCrop, CropId, Irrigation, Priority } from '../domain/types';
import { ResetDataControl } from './reset-data-control';
import { Dialog } from './dialog';
import { ActionBar } from './ui/action-bar';
import { climateFor, climateMatchesSite } from '../data/region-environment';
import { cropFieldChecks } from '../data/crop-practices';
import { MungPracticeTools } from './crop-practice-tools';
import { SeasonHistoryPanel } from './season-history';
import { cropTaxonomy } from '../data/crop-taxonomy';

const districts = [
  ['rajshahi', 'Rajshahi', 'রাজশাহী'],
  ['chapainawabganj', 'Chapainawabganj', 'চাঁপাইনবাবগঞ্জ'],
  ['naogaon', 'Naogaon', 'নওগাঁ'],
  ['natore', 'Natore', 'নাটোর'],
];
const monthNames = {
  en: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
  bn: [
    'মার্চ',
    'এপ্রিল',
    'মে',
    'জুন',
    'জুলাই',
    'আগস্ট',
    'সেপ্টেম্বর',
    'অক্টোবর',
    'নভেম্বর',
    'ডিসেম্বর',
    'জানুয়ারি',
    'ফেব্রুয়ারি',
  ],
};
const periodKey = (p: DatedPeriod) => `${p.crop}:${p.start}`;
const today = () => new Date().toLocaleDateString('en-CA');
function exportRecords() {
  const data: Record<string, unknown> = {};
  for (const key of [
    'ritu-evidence-v2',
    'ritu-evidence-v2-recovery',
    'ritu-preview-v1',
    'ritu-demo-v1',
    'ritu-journey-v1',
  ]) {
    try {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data[key] = JSON.parse(value);
        } catch {
          data[key] = { unparsedOriginal: value };
        }
      }
    } catch {
      /* Only export locally available records. */
    }
  }
  const blob = new Blob(
    [JSON.stringify({ exportedAt: new Date().toISOString(), records: data }, null, 2)],
    { type: 'application/json' },
  );
  const url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = 'ritu-farm-records.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children} <ExternalLink size={15} aria-hidden="true" />
    </a>
  );
}
function EvidenceNotice() {
  const { t } = usePlanner();
  return (
    <p className="notice evidence-boundary">
      {t(
        'Dates below use published regional crop-weather references. Confirm the variety, field readiness and local advice before planting. Weather history does not establish crop suitability.',
        'নিচের সময় প্রকাশিত আঞ্চলিক ফসল-আবহাওয়ার তথ্য থেকে। রোপণের আগে জাত, জমির প্রস্তুতি ও স্থানীয় পরামর্শ নিশ্চিত করুন। আবহাওয়ার ইতিহাস ফসলের উপযোগিতা নিশ্চিত করে না।',
      )}
    </p>
  );
}
export function EvidenceFarmView() {
  const { resetEpoch } = usePlanner();
  return <EvidenceFarmForm key={resetEpoch} />;
}
function EvidenceFarmForm() {
  const s = usePlanner(),
    { t, language, farm, setFarm, site, district, from, priority, update } = s;
  const router = useRouter();
  const [previous, setPrevious] = useState<CropId>('wheat'),
    [error, setError] = useState('');
  const supported =
    !!site &&
    inPilotRegion(site) &&
    (!site.countryCode || site.countryCode === 'BD') &&
    districts.some((d) => d[0] === district);
  const confirmed =
    !!site &&
    Number.isFinite(farm.area) &&
    farm.area > 0 &&
    farm.area <= 1000 &&
    farm.irrigation !== 'unknown' &&
    validDate(from) &&
    from >= '2000-01-01' &&
    from <= '2098-12-31' &&
    !!district;
  const missing = [
    ...(!site
      ? [
          {
            id: 'place-search',
            label: t('Select your farm pin on the map', 'মানচিত্রে নিজের জমির পিন বাছুন'),
          },
        ]
      : []),
    ...(!(farm.area > 0 && farm.area <= 1000)
      ? [
          {
            id: 'farm-area',
            label: t(
              'Enter a field area greater than zero, up to 1,000 hectares',
              'শূন্যের বেশি, সর্বোচ্চ ১,০০০ হেক্টর আয়তন দিন',
            ),
          },
        ]
      : []),
    ...(!district
      ? [{ id: 'farm-district', label: t('Confirm your district', 'জেলা নিশ্চিত করুন') }]
      : []),
    ...(!validDate(from) || from < '2000-01-01' || from > '2098-12-31'
      ? [
          {
            id: 'planning-from',
            label: t('Choose the planning start date', 'পরিকল্পনার শুরুর দিন বাছুন'),
          },
        ]
      : []),
    ...(farm.irrigation === 'unknown'
      ? [{ id: 'farm-water', label: t('Choose your actual water access', 'আসল সেচের সুযোগ বাছুন') }]
      : []),
  ];
  const review = () => {
    if (!confirmed) {
      setError(
        t(
          'Choose your farm pin, district, field area, water access and planning start date. Unknown soil stays unknown.',
          'জমির পিন, জেলা, আয়তন, সেচ ও শুরুর দিন দিন। অজানা মাটি অজানাই থাকবে।',
        ),
      );
      requestAnimationFrame(() => document.getElementById('farm-errors')?.focus());
      return;
    }
    update({ reviewed: profileKey(s), selected: null });
    router.push('/crops');
  };
  return (
    <div className="page evidence-page farm-page">
      <header className="page-header planner-heading">
        <div>
          <h1>{t('Start with your farm', 'আপনার জমি দিয়ে শুরু করুন')}</h1>
          <p>
            {t(
              'Pin your field, enter its area, then tell us about soil and water. Previous crops and preferences are optional.',
              'জমির পিন ও আয়তন দিন, তারপর মাটি ও সেচের তথ্য দিন। আগের ফসল ও পছন্দ ঐচ্ছিক।',
            )}
          </p>
        </div>
        <ResetDataControl />
      </header>
      <FarmLocation />
      <section className="card form-card" data-tour="farm-basics">
        <h2>{t('Your field', 'আপনার জমি')}</h2>
        <div className="form-grid">
          <label className="form-field">
            {t('Farm name · optional', 'জমির নাম · ঐচ্ছিক')}
            <input
              maxLength={80}
              value={farm.name}
              onChange={(e) => setFarm({ name: e.target.value })}
            />
          </label>
          <FarmAreaField />

          <label className="form-field">
            {t('Confirm your district', 'আপনার জেলা নিশ্চিত করুন')}
            <select
              id="farm-district"
              aria-required="true"
              aria-invalid={!!error && !district}
              value={district}
              onChange={(e) => update({ district: e.target.value })}
            >
              <option value="">{t('Choose district', 'জেলা বাছুন')}</option>
              {districts.map((d) => (
                <option key={d[0]} value={d[0]}>
                  {d[language === 'en' ? 1 : 2]}
                </option>
              ))}
              <option value="other">
                {t('Another district / outside Bangladesh', 'অন্য জেলা / বাংলাদেশের বাইরে')}
              </option>
            </select>
          </label>
          <div className="form-field">
            <label htmlFor="planning-from">{t('Plan from', 'পরিকল্পনার শুরু')}</label>
            <input
              id="planning-from"
              aria-required="true"
              type="date"
              min="2000-01-01"
              max="2098-12-31"
              value={from}
              onChange={(e) => update({ from: e.target.value })}
            />
            <button type="button" className="text-button" onClick={() => update({ from: today() })}>
              {t('Use today', 'আজকের দিন নিন')}
            </button>
          </div>
        </div>
      </section>

      <section className="card form-card" data-tour="farm-soil">
        <h2>{t('Soil & drainage', 'মাটি ও নিষ্কাশন')}</h2>
        <div className="form-grid">
          <label>
            {t('Soil texture', 'মাটির গঠন')}
            <select
              value={farm.soil}
              onChange={(e) => setFarm({ soil: e.target.value as Farm['soil'] })}
            >
              <option value="unknown">{t('Not sure', 'জানা নেই')}</option>
              <option value="loam">{t('Loam', 'দোআঁশ')}</option>
              <option value="clay">{t('Clay', 'এঁটেল')}</option>
              <option value="sandy">{t('Sandy', 'বেলে')}</option>
            </select>
          </label>
          <label>
            {t('Drainage', 'পানি নিষ্কাশন')}
            <select
              value={farm.drainage}
              onChange={(e) => setFarm({ drainage: e.target.value as Farm['drainage'] })}
            >
              <option value="unknown">{t('Not sure', 'জানা নেই')}</option>
              <option value="good">{t('Drains well', 'ভালো নিষ্কাশন')}</option>
              <option value="poor">{t('Water collects', 'পানি জমে থাকে')}</option>
            </select>
          </label>
        </div>
        <p className="field-help">
          {t(
            'Choose Not sure when needed. Soil texture and drainage are different; these answers do not replace a soil test.',
            'না জানলে জানা নেই বাছুন। মাটির গঠন ও নিষ্কাশন আলাদা; এই তথ্য মাটির পরীক্ষার বিকল্প নয়।',
          )}
        </p>
      </section>
      <section className="card form-card" data-tour="farm-water">
        <h2>{t('Water access', 'সেচের সুযোগ')}</h2>
        <fieldset className="water-control" id="farm-water" tabIndex={-1}>
          <legend className="sr-only">{t('Irrigation access', 'সেচের সুযোগ')}</legend>
          <div className="water-options">
            {(
              [
                ['reliable', t('Reliable', 'নিয়মিত')],
                ['limited', t('Limited', 'সীমিত')],
                ['rainfed', t('Rainfed', 'বৃষ্টিনির্ভর')],
                ['severe', t('Severe shortage', 'তীব্র সংকট')],
                ['unknown', t('Not sure', 'জানা নেই')],
              ] as [Irrigation, string][]
            ).map(([value, label]) => (
              <label key={value} className={farm.irrigation === value ? 'chosen' : ''}>
                <input
                  type="radio"
                  name="real-water"
                  value={value}
                  checked={farm.irrigation === value}
                  onChange={() => setFarm({ irrigation: value })}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <p>
          {t(
            'Choose the water supply you can actually use. Check crop-specific irrigation needs with the official advisory service.',
            'বাস্তবে ব্যবহারযোগ্য সেচের সুযোগ বাছুন। ফসলের সেচের চাহিদা সরকারি পরামর্শে মিলিয়ে নিন।',
          )}{' '}
          <SourceLink href="https://iras.bamis.gov.bd/">
            {t('DAE irrigation advisory', 'ডিএই সেচ পরামর্শ')}
          </SourceLink>
        </p>
      </section>
      <details className="card optional-intake">
        <summary>{t('Previous crops · optional', 'আগের ফসল · ঐচ্ছিক')}</summary>{' '}
        <section className="form-card" data-tour="farm-history">
          <p>
            {t(
              'Record crops you actually grew. This records familiarity, without inventing past dates.',
              'বাস্তবে চাষ করা ফসল লিখুন। এটি পরিচিতির তথ্য, আগের দিন বানিয়ে নেওয়া হয় না।',
            )}
          </p>
          <div className="recorded-crops">
            {farm.current.map((p) => (
              <span key={p.crop}>
                {crops[p.crop].name[language]}
                <button
                  type="button"
                  className="previous-crop-remove"
                  aria-label={`${t('Remove previous crop', 'আগের ফসল বাদ দিন')}: ${crops[p.crop].name[language]}`}
                  onClick={() =>
                    setFarm({ current: farm.current.filter((x) => x.crop !== p.crop) })
                  }
                >
                  <X size={19} />
                </button>
              </span>
            ))}
          </div>
          <div className="previous-crop-form">
            <label>
              {t('Previous crop to add', 'আগের ফসল যোগ করুন')}
              <select value={previous} onChange={(e) => setPrevious(e.target.value as CropId)}>
                {Object.values(crops)
                  .filter((c) => c.id !== 'fallow')
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name[language]}
                    </option>
                  ))}
              </select>
            </label>
            <button
              className="button secondary"
              disabled={farm.current.some((p) => p.crop === previous)}
              onClick={() =>
                setFarm({ current: [...farm.current, { crop: previous, start: 0, duration: 1 }] })
              }
            >
              {t('Add previous crop', 'আগের ফসল যোগ করুন')}
            </button>
          </div>
        </section>
      </details>
      <details className="card optional-intake">
        <summary>
          {t('Preferences & available help · optional', 'পছন্দ ও শ্রমের সুযোগ · ঐচ্ছিক')}
        </summary>{' '}
        <section className="form-card" data-tour="farm-priorities">
          <label>
            {t('Planning priority', 'পরিকল্পনার অগ্রাধিকার')}
            <select
              value={priority}
              onChange={(e) => update({ priority: e.target.value as Priority })}
            >
              <option value="familiar">{t('Prefer crops I know', 'পরিচিত ফসল আগে')}</option>
              <option value="diversity">
                {t('More botanical families', 'ফসলের পরিবার বাড়ান')}
              </option>
              <option value="soil">{t('Include a pulse crop', 'ডাল রাখুন')}</option>
              {(priority === 'water' || priority === 'resilience') && (
                <option value={priority} disabled>
                  {priority === 'water'
                    ? t('Saved water preference · not ranked', 'আগের পানির পছন্দ · ক্রম বদলায় না')
                    : t(
                        'Saved drought preference · not ranked',
                        'আগের খরার পছন্দ · ক্রম বদলায় না',
                      )}
                </option>
              )}
            </select>
          </label>
          {(priority === 'water' || priority === 'resilience') && (
            <p role="status">
              {t(
                'Your saved preference is preserved. Choose familiarity, crop diversity or pulse inclusion to change calendar ranking. Water and drought preferences have no validated ranking method yet.',
                'আগের পছন্দ রাখা আছে। ক্রম বদলাতে পরিচিতি, বৈচিত্র্য বা ডাল বাছুন। পানি ও খরার অগ্রাধিকারের যাচাইকৃত ক্রম-পদ্ধতি এখনো নেই।',
              )}
            </p>
          )}
          <p>
            {t(
              'Familiarity and family/pulse counts can rank compatible calendars. Water savings, drought tolerance and soil-health gains require evidence and are not scored.',
              'পরিচিতি, পরিবার ও ডালের সংখ্যা দিয়ে মেলা ক্যালেন্ডার সাজানো যায়। পানি সাশ্রয়, খরা সহনশীলতা বা মাটির উন্নতির নম্বর দেওয়া হয় না।',
            )}
          </p>
          <fieldset>
            <legend>{t('Household crops to keep', 'পরিবারের জন্য রাখতে হবে')}</legend>
            <div className="check-row">
              {(
                [
                  ['rice', t('Rice', 'ধান')],
                  ['pulses', t('Pulses', 'ডাল')],
                  ['potato', t('Potato', 'আলু')],
                ] as [HouseholdCrop, string][]
              ).map(([id, label]) => (
                <label key={id}>
                  <input
                    type="checkbox"
                    checked={farm.required.includes(id)}
                    onChange={(e) =>
                      setFarm({
                        required: e.target.checked
                          ? [...farm.required, id]
                          : farm.required.filter((x) => x !== id),
                      })
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>
              {t(
                'Months without planting or harvest help · optional',
                'রোপণ বা কাটার শ্রম না থাকার মাস · ঐচ্ছিক',
              )}
            </legend>
            <div className="labor-months">
              {monthNames[language].map((m, i) => (
                <label key={m}>
                  <input
                    type="checkbox"
                    checked={farm.unavailableMonths.includes(i)}
                    onChange={(e) =>
                      setFarm({
                        unavailableMonths: e.target.checked
                          ? [...farm.unavailableMonths, i]
                          : farm.unavailableMonths.filter((x) => x !== i),
                      })
                    }
                  />
                  {m}
                </label>
              ))}
            </div>
          </fieldset>
        </section>
      </details>
      {error && missing.length > 0 && (
        <div className="notice-amber error-summary" id="farm-errors" role="alert" tabIndex={-1}>
          <h2>{t('Complete these details', 'এই তথ্যগুলো দিন')}</h2>
          <p>{error}</p>
          <ul>
            {missing.map((item) => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const field = document.getElementById(item.id);
                    field?.scrollIntoView({ block: 'center', behavior: 'instant' });
                    field?.focus({ preventScroll: true });
                  }}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
      <ActionBar
        tour="farm-continue"
        status={
          <p>
            {supported
              ? t(
                  'Next, explore official regional crop references.',
                  'এরপর সরকারি আঞ্চলিক ফসলের তথ্য দেখুন।',
                )
              : t(
                  'Weather works worldwide; planting references currently cover four Rajshahi-region districts.',
                  'বিশ্বের আবহাওয়া দেখা যায়; রোপণের তথ্য এখন রাজশাহী অঞ্চলের চার জেলার।',
                )}
          </p>
        }
      >
        <button className="button primary" onClick={review}>
          {t('See crop references', 'ফসলের তথ্য দেখুন')}
          <ArrowRight size={19} />
        </button>
      </ActionBar>
      <details className="card records-archive">
        <summary>{t('Your existing records & export', 'আগের হিসাব ও ডাউনলোড')}</summary>
        <p>
          {t(
            'Previous-version records stay on this device and are not treated as validated crop advice. Export your actual observations before a full reset. No old sample calendar is automatically reused.',
            'আগের সংস্করণের হিসাব এই ডিভাইসে থাকে; যাচাইকৃত চাষের পরামর্শ ধরে নেওয়া হয় না। সব রিসেটের আগে বাস্তব পর্যবেক্ষণ ডাউনলোড করুন। আগের উদাহরণ ক্যালেন্ডার নিজে থেকে ব্যবহার হয় না।',
          )}
        </p>
        <button className="button secondary" onClick={exportRecords}>
          <Download size={18} />
          {t('Export all local records', 'স্থানীয় সব হিসাব ডাউনলোড')}
        </button>
      </details>
    </div>
  );
}

function SetupGate() {
  const { t } = usePlanner();
  return (
    <section className="card evidence-gate">
      <h1>{t('First, confirm your farm', 'আগে জমির তথ্য নিশ্চিত করুন')}</h1>
      <p>
        {t(
          'Enter the real field location, water access, area and planning start date. RITU does not fill these with sample values.',
          'আসল জমির স্থান, সেচ, আয়তন ও শুরুর দিন দিন। ঋতু উদাহরণের মান বসায় না।',
        )}
      </p>
      <Link href="/farm" className="button primary">
        {t('Go to your farm', 'জমির পাতায় যান')}
        <ArrowRight size={19} />
      </Link>
    </section>
  );
}

export function EvidenceCropsView() {
  const s = usePlanner(),
    { t, language, reviewed, from, preferred, farm, priority, update, site, district, unplanted } =
      s;
  const [seasonFilter, setSeasonFilter] = useState<Season | 'all'>(
    () => (upcomingSeasons(from)[0]?.split(':')[0] as Season) || 'all',
  );
  const candidates = useMemo(
    () => evidencePlans(from, preferred, farm, priority, unplanted),
    [from, preferred, farm, priority, unplanted],
  );
  const supported =
    !!site &&
    inPilotRegion(site) &&
    (!site.countryCode || site.countryCode === 'BD') &&
    districts.some((d) => d[0] === district);
  const periods = referencePeriods(from),
    keys = [
      ...new Set(periods.map((p) => `${calendarByCrop(p.crop)!.group}:${p.start.slice(0, 4)}`)),
    ].slice(0, 3);
  const available = new Set(
    periods
      .filter((p) => keys.includes(`${calendarByCrop(p.crop)!.group}:${p.start.slice(0, 4)}`))
      .map((p) => p.crop),
  );
  if (!reviewed) return <SetupGate />;
  return (
    <div className="page evidence-page crops-page">
      <header className="page-header">
        <div>
          <h1>{t('Choose from published crop calendars', 'প্রকাশিত পঞ্জিকা থেকে ফসল বাছুন')}</h1>
          <p>
            {t(
              'Start with one season. Compare the published dates and choose crops you want to explore.',
              'এক মৌসুম দিয়ে শুরু করুন। প্রকাশিত সময় মিলিয়ে পছন্দের ফসল বাছুন।',
            )}
          </p>
        </div>
        <Link href="/farm" className="button secondary">
          <ArrowLeft size={18} />
          {t('Edit farm', 'জমির তথ্য বদলান')}
        </Link>
      </header>
      <EvidenceNotice />
      {!supported ? (
        <section className="card" data-tour="crop-suggestions">
          <h2>
            {t(
              'Local calendar evidence is not integrated for this location',
              'এই স্থানের স্থানীয় পঞ্জিকা যুক্ত নেই',
            )}
          </h2>
          <p>
            {t(
              'Worldwide weather remains available. RITU will not apply Rajshahi calendars to another region. Use the official crop-zoning portal or local extension service to establish a local calendar.',
              'বিশ্বের আবহাওয়া দেখা যাবে। অন্য অঞ্চলে রাজশাহীর পঞ্জিকা বসানো হবে না। স্থানীয় পঞ্জিকার জন্য সরকারি ক্রপ জোনিং বা কৃষি কর্মকর্তার পরামর্শ নিন।',
            )}
          </p>
          <SourceLink href="https://portal.cropzoning.gov.bd/">
            {t('BARC crop zoning', 'বিএআরসি ক্রপ জোনিং')}
          </SourceLink>
        </section>
      ) : (
        <>
          <section className="card" data-tour="unplanted-seasons">
            <h2>
              {t('Choose crops or leave a season unplanted', 'ফসল বাছুন বা মৌসুম খালি রাখুন')}
            </h2>
            <p>
              {t(
                'Choose at least one crop in each reference season, or explicitly leave that season unplanted. Gaps do not imply managed fallow or guaranteed soil benefits.',
                'প্রতি মৌসুমে অন্তত একটি ফসল বাছুন, অথবা নিজে মৌসুম খালি রাখুন। বিরতি মানেই পরিকল্পিত পতিত বা নিশ্চিত মাটির উন্নতি নয়।',
              )}
            </p>
            <div className="check-row">
              {upcomingSeasons(from).map((key) => {
                const group = key.split(':')[0] as Season;
                return (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={unplanted.includes(group)}
                      onChange={(e) =>
                        update({
                          unplanted: e.target.checked
                            ? [...unplanted, group]
                            : unplanted.filter((x) => x !== group),
                          selected: null,
                        })
                      }
                    />
                    {t('Leave unplanted', 'খালি রাখুন')}:{' '}
                    {group === 'winter'
                      ? t('Winter', 'শীত')
                      : group === 'monsoon'
                        ? t('Monsoon', 'বর্ষা')
                        : t('Pre-monsoon', 'প্রাক-বর্ষা')}{' '}
                    · {key.split(':')[1]}
                  </label>
                );
              })}
            </div>
          </section>
          <section
            className="crop-season-picker"
            aria-label={t('Choose which season to explore', 'দেখার মৌসুম বাছুন')}
          >
            <h2>{t('Explore one season at a time', 'একবারে এক মৌসুমের ফসল দেখুন')}</h2>
            <div className="season-filter-buttons">
              {[
                ...upcomingSeasons(from).map((key) => key.split(':')[0] as Season),
                'all' as const,
              ].map((group) => (
                <button
                  key={group}
                  className="button secondary"
                  aria-pressed={seasonFilter === group}
                  onClick={() => setSeasonFilter(group)}
                >
                  {group === 'all'
                    ? t('All seasons', 'সব মৌসুম')
                    : group === 'winter'
                      ? t('Winter', 'শীত')
                      : group === 'monsoon'
                        ? t('Monsoon', 'বর্ষা')
                        : t('Pre-monsoon', 'প্রাক-বর্ষা')}
                  {group !== 'all' && (
                    <span className="selection-count">
                      {unplanted.includes(group)
                        ? t('unplanted', 'খালি')
                        : regionalCalendars.filter(
                            (c) => c.group === group && preferred.includes(c.id),
                          ).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <p>
              {t(
                'Choose alternatives for each season. Your choices stay saved when you switch seasons.',
                'প্রতি মৌসুমের বিকল্প বাছুন। মৌসুম বদলালেও পছন্দ রাখা থাকে।',
              )}
            </p>
          </section>
          <div className="source-crop-grid" data-tour="crop-suggestions">
            {regionalCalendars
              .filter((c) => seasonFilter === 'all' || c.group === seasonFilter)
              .sort((a, b) => Number(available.has(b.id)) - Number(available.has(a.id)))
              .map((c) => {
                const next = periods.find((p) => p.crop === c.id),
                  enabled =
                    available.has(c.id) &&
                    !cropFieldChecks(c.id, farm).blocked &&
                    !unplanted.includes(c.group);
                return (
                  <article
                    key={c.id}
                    className={`card source-crop-card ${preferred.includes(c.id) ? 'selected' : ''}`}
                  >
                    <CropPhoto crop={c.id} compact />
                    <label className="source-crop-choice">
                      <input
                        type="checkbox"
                        disabled={!enabled && !preferred.includes(c.id)}
                        checked={preferred.includes(c.id)}
                        onChange={(e) =>
                          update({
                            preferred: e.target.checked
                              ? [...preferred, c.id]
                              : preferred.filter((x) => x !== c.id),
                            selected: null,
                          })
                        }
                      />
                      <strong>{c.name[language]}</strong>
                    </label>
                    <p>
                      {c.duration.min === c.duration.max
                        ? c.duration.max
                        : `${c.duration.min}–${c.duration.max}`}{' '}
                      {t('days in the regional reference', 'দিন আঞ্চলিক তথ্যে')}
                    </p>
                    {next && (
                      <p>
                        {t('Next computed reference interval', 'পরের গণনা করা আঞ্চলিক সময়')}:{' '}
                        <time>{next.start}</time> → <time>{addDays(next.end, -1)}</time>
                      </p>
                    )}
                    {!available.has(c.id) && (
                      <p>
                        {t(
                          'Outside the next three reference seasons.',
                          'পরের তিনটি আঞ্চলিক মৌসুমের বাইরে।',
                        )}
                      </p>
                    )}
                    {unplanted.includes(c.group) && (
                      <p className="field-help">
                        {t(
                          'This season is marked unplanted. Clear that choice above to select crops.',
                          'এই মৌসুম খালি রাখা হয়েছে। ফসল বাছতে ওপরের টিক সরান।',
                        )}
                      </p>
                    )}
                    {cropFieldChecks(c.id, farm).blocked && (
                      <p className="notice-amber">
                        {cropFieldChecks(c.id, farm).notes[0]?.[language]}
                      </p>
                    )}
                    <details>
                      <summary>{t('Why offered, source & timing', 'কারণ, উৎস ও সময়')}</summary>
                      {cropTaxonomy[c.id] && (
                        <SourceLink href={cropTaxonomy[c.id]!.source}>
                          {cropTaxonomy[c.id]!.family} ·{' '}
                          {t('botanical reference', 'উদ্ভিদ পরিবারের উৎস')}
                        </SourceLink>
                      )}
                      {cropFieldChecks(c.id, farm).notes.map((note, i) => (
                        <p
                          key={i}
                          className={
                            cropFieldChecks(c.id, farm).blocked ? 'notice-amber' : 'field-help'
                          }
                        >
                          {note[language]}
                        </p>
                      ))}
                      {cropFieldChecks(c.id, farm).source && (
                        <SourceLink href={cropFieldChecks(c.id, farm).source!}>
                          {c.id === 'boro'
                            ? 'FAO / WFP · Bangladesh · 2008'
                            : 'CIMMYT / CSISA · 2016'}
                        </SourceLink>
                      )}
                      <p>{c.basis[language]}</p>
                      <p>{c.scope[language]}</p>
                      <p>
                        {t('Document upload date', 'নথি আপলোডের তারিখ')}: {c.source.date} ·{' '}
                        {t('Reference weeks', 'পঞ্জিকার সপ্তাহ')} {c.weeks.first}–{c.weeks.last}
                      </p>
                      <SourceLink href={c.source.document}>
                        {t('Open original DAE/BAMIS PDF', 'ডিএই/বামিসের মূল পিডিএফ খুলুন')}
                      </SourceLink>
                    </details>
                  </article>
                );
              })}
          </div>
          <section className="card" data-tour="crop-continue">
            <h2>{t('Your next three seasonal references', 'পরের তিন মৌসুমের আঞ্চলিক তথ্য')}</h2>
            <p>
              {candidates.length
                ? t(
                    `${candidates.length} non-overlapping calendar${candidates.length === 1 ? '' : 's'} match your crop choices and entered household/help constraints.`,
                    `${candidates.length}টি ক্যালেন্ডারে সময়ের সংঘাত নেই এবং বাছা ফসল, পরিবার ও শ্রমের শর্ত মেলে।`,
                  )
                : t(
                    'Choose crops in the next three reference seasons, or explicitly leave a season unplanted. Overlaps, missing choices, household requirements and unavailable help can prevent a calendar. No duration is shortened.',
                    'পরের তিন মৌসুমের ফসল বাছুন বা নিজে মৌসুম খালি রাখুন। সময়ের সংঘাত, অসম্পূর্ণ পছন্দ, পরিবারের শর্ত বা শ্রমের অভাবে ক্যালেন্ডার হবে না। সময় ছোট করা হয় না।',
                  )}
            </p>
            {!candidates.length && (
              <ul className="planning-issues">
                {planningIssues(from, preferred, farm, unplanted).map((issue, i) => (
                  <li key={i}>{issue[language]}</li>
                ))}
              </ul>
            )}
            {farm.unavailableMonths.length > 0 && (
              <p>
                {t(
                  'Your unavailable-help months are enforced at each reference interval’s start and end.',
                  'প্রতিটি সময়ের শুরু ও শেষে শ্রম না থাকার মাস মানা হয়।',
                )}
              </p>
            )}
            <Link
              className={`button primary ${!candidates.length ? 'disabled-link' : ''}`}
              href={candidates.length ? '/plan' : '#'}
              aria-disabled={!candidates.length}
              onClick={(e) => {
                if (!candidates.length) e.preventDefault();
              }}
            >
              {t('Compare calendars', 'ক্যালেন্ডার তুলনা করুন')}
              <ArrowRight size={19} />
            </Link>
          </section>
        </>
      )}
      <MungPracticeTools />
      <details className="card source-method" data-tour="crop-method">
        <summary>{t('How these dates are calculated', 'সময় যেভাবে গণনা হয়')}</summary>
        <p>
          {t(
            'The original weekly calendars are regional weather references, not optimal sowing-day prescriptions. For a readable date display, reference week 1 starts January 1 and each block spans seven days; this is not ISO-week numbering. The source’s maximum duration is reserved in full, and every transition is checked by actual date, across leap days and year boundaries. Confirm actual sowing, transplanting and harvest timing for your cultivar.',
            'মূল সাপ্তাহিক পঞ্জিকা আঞ্চলিক আবহাওয়ার তথ্য, সেরা বোনার দিন নয়। দিন দেখাতে ১ জানুয়ারি থেকে সাত দিনের ব্লক নেওয়া হয়; এটি ISO সপ্তাহ নয়। উৎসের সর্বোচ্চ সময় পুরো রাখা হয়, অধিবর্ষ ও বছর পেরিয়েও প্রকৃত দিনে সংঘাত দেখা হয়। নিজের জাতের বোনা, রোপণ ও কাটার দিন নিশ্চিত করুন।',
          )}
        </p>
        <SourceLink href="https://www.bamis.gov.bd/en/calendar/">
          {t('Official calendar catalogue', 'সরকারি পঞ্জিকার তালিকা')}
        </SourceLink>
      </details>
    </div>
  );
}

function HistoricalContext({
  plan,
  site,
}: {
  plan: EvidencePlan;
  site: import('../domain/farm-site').FarmSite;
}) {
  const { t } = usePlanner();
  return (
    <section data-tour="nasa-seasonal">
      <h2>{t('NASA context for the same seasonal intervals', 'একই মৌসুমি সময়ের নাসার তথ্য')}</h2>
      <p>
        {t(
          'Each card uses the latest fully completed historical reference interval, with actual daily NASA POWER records. These are continuous dated periods, not future forecasts, irrigation requirements or proof that a crop fits this field.',
          'প্রতিটি কার্ডে সর্বশেষ পুরো শেষ হওয়া আঞ্চলিক সময়ের নাসা পাওয়ারের আসল দৈনিক তথ্য। এগুলো তারিখসহ একটানা পুরোনো সময়; ভবিষ্যৎ পূর্বাভাস, সেচের চাহিদা বা জমিতে ফসলের উপযোগিতার প্রমাণ নয়।',
        )}
      </p>
      <div className="source-crop-grid">
        {plan.periods.map((p) => (
          <SeasonHistoryPanel key={p.crop} crop={p.crop} site={site} />
        ))}
      </div>
    </section>
  );
}
function DatedTimeline({ plan }: { plan: EvidencePlan }) {
  const { language, t } = usePlanner();
  const start = Date.parse(plan.periods[0].start),
    finish = Date.parse(plan.periods.at(-1)!.end),
    length = finish - start;
  return (
    <div
      className="dated-timeline-scroll"
      tabIndex={0}
      role="region"
      aria-label={t('Calendar with actual dates', 'আসল দিনের ক্যালেন্ডার')}
    >
      <div className="dated-timeline">
        {plan.periods.map((p) => (
          <div
            key={periodKey(p)}
            className={`dated-crop dated-${p.crop}`}
            style={{
              marginLeft: `${((Date.parse(p.start) - start) / length) * 100}%`,
              width: `${((Date.parse(p.end) - Date.parse(p.start)) / length) * 100}%`,
            }}
          >
            <strong>{calendarByCrop(p.crop)!.name[language]}</strong>
            <span>
              {p.start} → {addDays(p.end, -1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
function PlanReasons({ plan }: { plan: EvidencePlan }) {
  const { t, language, farm, environment } = usePlanner();
  return (
    <details className="plan-source-reasons">
      <summary>{t('Why this calendar?', 'এই ক্যালেন্ডার কেন?')}</summary>
      <ul>
        <li>
          {t(
            'Every interval comes from the linked official Rajshahi-region calendars. Full source durations are retained and do not overlap.',
            'প্রতিটি সময় সরকারি রাজশাহী অঞ্চলের পঞ্জিকা থেকে। পুরো সময় রাখা আছে ও সংঘাত নেই।',
          )}
        </li>
        <li>
          {t(
            'Entered household requirements and unavailable-help months are checked. No silent removal of requirements.',
            'পরিবারের শর্ত ও শ্রম না থাকার মাস যাচাই হয়। শর্ত নিজে থেকে বাদ যায় না।',
          )}
        </li>
        <li>
          {plan.familyCount}{' '}
          {t(
            'botanical families. Pulse presence and familiarity are counts, not predictions of soil improvement or yield.',
            'ফসলের পরিবার। ডাল ও পরিচিতি সংখ্যা মাত্র; মাটি বা ফলনের পূর্বাভাস নয়।',
          )}
        </li>
        <li>
          {t(
            `Recorded soil: ${farm.soil}; drainage: ${farm.drainage}; water access: ${farm.irrigation}. Field suitability, exact irrigation requirements and cultivar response remain unverified.`,
            `লেখা মাটি: ${farm.soil}; নিষ্কাশন: ${farm.drainage}; সেচ: ${farm.irrigation}। জমির উপযোগিতা, সেচের সঠিক চাহিদা ও জাতের প্রতিক্রিয়া যাচাই বাকি।`,
          )}
        </li>
      </ul>
      {plan.periods.map((p) => (
        <p key={periodKey(p)}>
          <SourceLink href={p.source}>
            {calendarByCrop(p.crop)!.name[language]} · DAE/BAMIS
          </SourceLink>
        </p>
      ))}
      {climateMatchesSite(environment) && (
        <p>
          {t('Separate historical NASA context', 'নাসার আলাদা ঐতিহাসিক তথ্য')}:{' '}
          <SourceLink href={climateFor(environment).requestUrl}>
            NASA POWER {climateFor(environment).year}
          </SourceLink>
          .{' '}
          {t(
            'This history is not a forecast or crop-suitability rule.',
            'এই ইতিহাস পূর্বাভাস বা ফসলের উপযোগিতার নিয়ম নয়।',
          )}
        </p>
      )}
    </details>
  );
}

export function EvidenceCalendarView() {
  const s = usePlanner(),
    {
      t,
      language,
      from,
      preferred,
      farm,
      priority,
      reviewed,
      selected,
      tracked,
      site,
      update,
      unplanted,
    } = s;
  const plans = useMemo(
    () => evidencePlans(from, preferred, farm, priority, unplanted),
    [from, preferred, farm, priority, unplanted],
  );
  const plan = plans.find((p) => p.id === selected) ?? plans[0];
  const [replace, setReplace] = useState(false),
    [confirmed, setConfirmed] = useState(false);
  const router = useRouter();
  const save = () => {
    if (!plan || !site || !confirmed) return;
    update({
      selected: plan.id,
      tracked: {
        plan: structuredClone(plan),
        site: { ...site },
        profileKey: profileKey(s),
        savedAt: new Date().toISOString(),
        records: Object.fromEntries(plan.periods.map((p) => [periodKey(p), { note: '' }])),
      },
    });
    setReplace(false);
    router.push('/track');
  };
  if (!reviewed) return <SetupGate />;
  if (
    !site ||
    !inPilotRegion(site) ||
    (site.countryCode && site.countryCode !== 'BD') ||
    !districts.some((d) => d[0] === s.district)
  )
    return (
      <section className="card evidence-gate" data-tour="calendar-main">
        <h1>{t('Local crop-calendar evidence is needed', 'স্থানীয় ফসল পঞ্জিকার প্রমাণ দরকার')}</h1>
        <p>
          {t(
            'This planner does not apply Rajshahi references to another region.',
            'এই পরিকল্পনায় অন্য অঞ্চলে রাজশাহীর তথ্য বসানো হয় না।',
          )}
        </p>
        <Link className="button primary" href="/crops">
          {t('Review regional coverage', 'অঞ্চলের প্রযোজ্যতা দেখুন')}
        </Link>
      </section>
    );
  if (!plan)
    return (
      <section className="card evidence-gate" data-tour="calendar-main">
        <h1>{t('Choose compatible crop references first', 'আগে মেলা ফসলের তথ্য বাছুন')}</h1>
        <p>
          {t(
            'No compatible source-based calendar can be built from these choices. Missing evidence or overlap never produces a fabricated plan.',
            'এই পছন্দে উৎসভিত্তিক ক্যালেন্ডার হয়নি। তথ্য না থাকা বা সংঘাতে বানানো পরিকল্পনা দেওয়া হয় না।',
          )}
        </p>
        <Link href="/crops" className="button primary">
          {t('Review crops', 'ফসলের পছন্দ দেখুন')}
        </Link>
      </section>
    );
  return (
    <div className="page evidence-page calendar-page">
      <header className="page-header">
        <div>
          <h1>{t('Compare your regional calendars', 'আঞ্চলিক ক্যালেন্ডার তুলনা করুন')}</h1>
          <p>
            {t(
              'Actual dates, full published duration ranges and clearly shown gaps.',
              'আসল দিন, প্রকাশিত সময়ের পুরো সীমা ও স্পষ্ট বিরতি।',
            )}
          </p>
        </div>
        <Link className="button secondary" href="/crops">
          {t('Change crop choices', 'ফসলের পছন্দ বদলান')}
        </Link>
      </header>
      <EvidenceNotice />
      <div className="reference-plan-options" data-tour="calendar-main">
        {plans.map((p, i) => (
          <label
            key={p.id}
            className={`card reference-plan-option ${plan.id === p.id ? 'selected' : ''}`}
          >
            <input
              type="radio"
              name="source-plan"
              checked={plan.id === p.id}
              onChange={() => {
                update({ selected: p.id });
                setConfirmed(false);
              }}
            />
            <span>
              <strong>{t(`Calendar ${i + 1}`, `ক্যালেন্ডার ${i + 1}`)}</strong>
              <span>
                {p.periods.map((p) => calendarByCrop(p.crop)!.name[language]).join(' → ')}
              </span>
            </span>
          </label>
        ))}
      </div>
      <section className="card" data-tour="calendar-dates">
        <h2>
          <CalendarDays size={22} />
          {t('Your planned reference sequence', 'আপনার আঞ্চলিক পরিকল্পনার ক্রম')}
        </h2>
        <DatedTimeline plan={plan} />
        <ol className="dated-period-list">
          {plan.periods.map((p) => (
            <li key={periodKey(p)}>
              <strong>{calendarByCrop(p.crop)!.name[language]}</strong>
              <span>
                <time>{p.start}</time> → <time>{addDays(p.end, -1)}</time> · {p.durationDays}{' '}
                {t('days reserved', 'দিন রাখা')}
              </span>
              <p>{calendarByCrop(p.crop)!.basis[language]}</p>
            </li>
          ))}
        </ol>
        {plan.gaps.length > 0 && (
          <p>
            {t('Unallocated intervals between crops', 'ফসলের মধ্যে খালি সময়')}:{' '}
            {plan.gaps.map((g) => `${g.start} → ${addDays(g.end, -1)}`).join(' · ')}.{' '}
            {t(
              'These are gaps, not a claim about soil cover or managed fallow.',
              'এগুলো বিরতি; মাটির আচ্ছাদন বা পতিতের ব্যবস্থাপনার দাবি নয়।',
            )}
          </p>
        )}
      </section>
      {site && <HistoricalContext plan={plan} site={site} />}
      <section className="card" data-tour="plan-reasons">
        <PlanReasons plan={plan} />
      </section>
      <section className="card confirm-plan" data-tour="calendar-save">
        <label>
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />
          <span>
            {t(
              'I understand these are regional reference dates. I will confirm the cultivar, nursery/field dates, irrigation and actual field readiness before planting.',
              'আমি বুঝি এগুলো আঞ্চলিক সময়ের তথ্য। রোপণের আগে জাত, বীজতলা/মূল জমির দিন, সেচ ও জমির প্রস্তুতি নিশ্চিত করব।',
            )}
          </span>
        </label>
        <button
          className="button primary"
          disabled={!confirmed}
          onClick={() => {
            if (tracked?.plan.id === plan.id && tracked.profileKey === profileKey(s))
              router.push('/track');
            else if (tracked) setReplace(true);
            else save();
          }}
        >
          {t('Save calendar & track', 'ক্যালেন্ডার রাখুন ও হিসাব করুন')}
          <ArrowRight size={19} />
        </button>
      </section>
      {replace && (
        <Dialog
          title={t('Replace the saved calendar?', 'রাখা ক্যালেন্ডার বদলাবেন?')}
          onClose={() => setReplace(false)}
        >
          <p>
            {t(
              'This replaces the saved calendar and its activity records. Export records first if you need to keep them.',
              'এতে রাখা ক্যালেন্ডার ও কাজের হিসাব বদলে যাবে। রাখতে চাইলে আগে ডাউনলোড করুন।',
            )}
          </p>
          <div className="button-row">
            <button className="button secondary" onClick={exportRecords}>
              {t('Export records', 'হিসাব ডাউনলোড')}
            </button>
            <button className="button secondary" onClick={() => setReplace(false)}>
              {t('Keep my records', 'আমার হিসাব রাখুন')}
            </button>
            <button className="button primary" onClick={save}>
              {t('Replace calendar', 'ক্যালেন্ডার বদলান')}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

function FieldMonitor({ tracked }: { tracked: SavedEvidencePlan }) {
  const { t, language } = usePlanner(),
    weather = useLiveWeather(tracked.site);
  const fresh = weather.data && !weather.error && weatherIsRecent(weather.data);
  const rain = fresh
    ? weather.data!.days.slice(0, 3).find((d) => d.rain !== null && d.rain > 0)
    : undefined;
  const active = tracked.plan.periods.find((p) => {
      const r = tracked.records[periodKey(p)];
      return r?.plantedDate && !r.harvestedDate;
    }),
    next = tracked.plan.periods.find((p) => !tracked.records[periodKey(p)]?.plantedDate);
  return (
    <section className="farm-monitor" data-tour="track-weather">
      <h2>{t('Your field today & next checks', 'আজকের জমি ও পরের করণীয়')}</h2>
      <WeatherContent site={tracked.site} result={weather} />
      <section className="next-checks">
        <h3>{t('What to check next', 'এরপর যা দেখবেন')}</h3>
        <ul>
          {rain && (
            <li>
              <h4>
                {t(
                  'Check moisture before deciding on irrigation',
                  'সেচের সিদ্ধান্তের আগে মাটির আর্দ্রতা দেখুন',
                )}
              </h4>
              <p>
                {rain.date}: {rain.rain} mm ·{' '}
                {rain.rainProbability === null ? '' : `${rain.rainProbability}%`}.{' '}
                {t(
                  'Check root-zone moisture and the water supply before watering.',
                  'সেচের আগে শিকড়ের আর্দ্রতা ও পানির সরবরাহ দেখুন।',
                )}
              </p>
            </li>
          )}
          {active ? (
            <li>
              <h4>
                {t('Inspect your recorded crop', 'লেখা ফসল জমিতে দেখুন')}:{' '}
                {calendarByCrop(active.crop)!.name[language]}
              </h4>
              <p>
                {t('Recorded planting', 'লেখা রোপণ')}:{' '}
                {tracked.records[periodKey(active)].plantedDate}.{' '}
                {t(
                  'Record the crop stage and any damage you observe.',
                  'ফসলের পর্যায় ও দেখা ক্ষতি লিখুন।',
                )}
              </p>
            </li>
          ) : next ? (
            <li>
              <h4>{t('Review the next calendar interval', 'পরের ক্যালেন্ডারের সময় দেখুন')}</h4>
              <p>
                {calendarByCrop(next.crop)!.name[language]}: {next.start}.{' '}
                {t(
                  'Check the variety and field readiness before planting.',
                  'রোপণের আগে জাত ও জমির প্রস্তুতি দেখুন।',
                )}
              </p>
            </li>
          ) : (
            <li>
              <h4>{t('Keep your harvest observations', 'ফসল কাটার পর্যবেক্ষণ রাখুন')}</h4>
              <p>
                {t(
                  'Review actual crop history before planning the next rotation.',
                  'পরের ফসলক্রমের আগে আসল আগের ফসলের হিসাব দেখুন।',
                )}
              </p>
            </li>
          )}
        </ul>
        <p>
          {t(
            'No precise watering volume, fertilizer dose, pesticide treatment, yield or soil-health gain is inferred.',
            'সেচের সঠিক পরিমাণ, সার, কীটনাশক, ফলন বা মাটির উন্নতি ধরে নেওয়া হয় না।',
          )}
        </p>
        <div className="advisory-links">
          <SourceLink href="https://iras.bamis.gov.bd/">
            {t('Official DAE rice irrigation advisory', 'ডিএই ধানের সরকারি সেচ পরামর্শ')}
          </SourceLink>
          <SourceLink href="https://www.bamis.gov.bd/en/bulletin/">
            {t('Latest official crop bulletins', 'সরকারি ফসলের বুলেটিন')}
          </SourceLink>
        </div>
      </section>
    </section>
  );
}
export function EvidenceTrackingView() {
  const s = usePlanner(),
    { t, language, tracked, update } = s;
  const [clear, setClear] = useState(false),
    [error, setError] = useState('');
  if (!tracked)
    return (
      <section className="card evidence-gate" data-tour="track-records">
        <h1>{t('Save your calendar to start tracking', 'হিসাব করতে ক্যালেন্ডার রাখুন')}</h1>
        <p>
          {t(
            'Open a saved farm to see its calendar and recorded activities.',
            'রাখা খামার খুলে ক্যালেন্ডার ও কাজের হিসাব দেখুন।',
          )}
        </p>
        <Link href="/plan" className="button primary">
          {t('Choose a calendar', 'ক্যালেন্ডার বাছুন')}
        </Link>
        <button className="button secondary" onClick={exportRecords}>
          {t('Export earlier local records', 'আগের স্থানীয় হিসাব ডাউনলোড')}
        </button>
      </section>
    );
  const change = (p: DatedPeriod, record: RealActivity) => {
    if (
      record.harvestedDate &&
      (!record.plantedDate || record.harvestedDate < record.plantedDate)
    ) {
      setError(
        t(
          'Harvest must be on or after the actual planting date.',
          'ফসল কাটার দিন রোপণের দিন বা পরে হতে হবে।',
        ),
      );
      return;
    }
    if (
      (record.plantedDate && record.plantedDate > today()) ||
      (record.harvestedDate && record.harvestedDate > today())
    ) {
      setError(
        t(
          'An actual completed activity cannot be dated in the future.',
          'সম্পূর্ণ কাজের আসল দিন ভবিষ্যতে হতে পারে না।',
        ),
      );
      return;
    }
    setError('');
    update({ tracked: { ...tracked, records: { ...tracked.records, [periodKey(p)]: record } } });
  };
  return (
    <div className="page evidence-page track-page">
      <header className="page-header">
        <div>
          <h1>{t('Your field records', 'জমির কাজের হিসাব')}</h1>
          <p>
            <MapPin size={18} />
            {tracked.site.name} · {tracked.site.latitude.toFixed(5)},{' '}
            {tracked.site.longitude.toFixed(5)}
          </p>
        </div>
        <Link href="/plan" className="button secondary">
          {t('Review calendars', 'ক্যালেন্ডার দেখুন')}
        </Link>
      </header>
      {tracked.profileKey !== profileKey(s) && (
        <p className="notice-amber">
          {t(
            'Your setup has changed. This saved calendar, farm location and records remain unchanged until you explicitly replace them.',
            'জমির সেটিং বদলেছে। নিজে বদলানো পর্যন্ত রাখা ক্যালেন্ডার, স্থান ও হিসাব একই থাকবে।',
          )}
        </p>
      )}
      <FieldMonitor tracked={tracked} />
      <section className="card" data-tour="track-calendar">
        <h2>{t('Saved reference calendar', 'রাখা আঞ্চলিক ক্যালেন্ডার')}</h2>
        <DatedTimeline plan={tracked.plan} />
      </section>
      {error && (
        <p className="notice-amber" role="alert">
          {error}
        </p>
      )}
      <div className="tracking-crops" data-tour="track-records">
        {tracked.plan.periods.map((p) => {
          const record = tracked.records[periodKey(p)] ?? { note: '' };
          return (
            <section className="card form-card" key={periodKey(p)}>
              <h2>{calendarByCrop(p.crop)!.name[language]}</h2>
              <p>
                {t('Reference interval', 'আঞ্চলিক সময়')}: {p.start} → {addDays(p.end, -1)}
              </p>
              <div className="form-grid">
                <label>
                  {t('Actual planting date', 'আসল রোপণের দিন')}
                  <input
                    type="date"
                    max={today()}
                    value={record.plantedDate ?? ''}
                    disabled={!!record.harvestedDate}
                    onChange={(e) =>
                      change(p, { ...record, plantedDate: e.target.value || undefined })
                    }
                  />
                </label>
                <label>
                  {t('Actual harvest date', 'আসল ফসল কাটার দিন')}
                  <input
                    type="date"
                    min={record.plantedDate}
                    max={today()}
                    value={record.harvestedDate ?? ''}
                    disabled={!record.plantedDate}
                    onChange={(e) =>
                      change(p, { ...record, harvestedDate: e.target.value || undefined })
                    }
                  />
                </label>
              </div>
              <div className="form-field">
                <label htmlFor={`activity-note-${p.crop}-${p.start}`}>
                  {t('Field observations & notes', 'জমির পর্যবেক্ষণ ও নোট')}
                </label>
                <textarea
                  id={`activity-note-${p.crop}-${p.start}`}
                  maxLength={2000}
                  value={record.note}
                  onChange={(e) => change(p, { ...record, note: e.target.value })}
                />
              </div>
              <SourceLink href={p.source}>
                {t('Crop calendar source', 'ফসল পঞ্জিকার উৎস')}
              </SourceLink>
            </section>
          );
        })}
      </div>
      <div className="button-row">
        <button className="button secondary" onClick={exportRecords}>
          <Download size={18} />
          {t('Export all records', 'সব হিসাব ডাউনলোড')}
        </button>
        <button className="text-button danger" onClick={() => setClear(true)}>
          {t('Clear saved calendar & records', 'রাখা ক্যালেন্ডার ও হিসাব মুছুন')}
        </button>
      </div>
      {clear && (
        <Dialog
          title={t('Clear saved records?', 'রাখা হিসাব মুছবেন?')}
          onClose={() => setClear(false)}
        >
          <p>
            {t(
              'This clears this calendar and its activity notes. Your farm profile stays.',
              'এই ক্যালেন্ডার ও কাজের নোট মুছবে। জমির তথ্য থাকবে।',
            )}
          </p>
          <div className="button-row">
            <button className="button secondary" onClick={() => setClear(false)}>
              {t('Keep records', 'হিসাব রাখুন')}
            </button>
            <button
              className="button primary"
              onClick={() => {
                update({ tracked: null });
                setClear(false);
              }}
            >
              {t('Clear records', 'হিসাব মুছুন')}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}

export function EvidenceSourcesView({
  onNavigate,
  embedded = false,
}: { onNavigate?: () => void; embedded?: boolean } = {}) {
  const { t, language } = usePlanner();
  return (
    <div className="page evidence-page sources-page">
      {!embedded && (
        <header className="page-header">
          <h1 data-tour="sources-heading">{t('Data sources & methods', 'তথ্যের উৎস ও পদ্ধতি')}</h1>
        </header>
      )}
      <section className="card">
        <h2>{t('Worldwide, one-season crop matching', 'বিশ্বজুড়ে এক মৌসুমের ফসল মেলানো')}</h2>
        <p>
          {t(
            'NASA POWER monthly climate normals (1991–2020) are matched to FAO ECOCROP temperature, soil and drainage requirements. Results show source matches for species. Seasonal water supply, local cultivar performance and field suitability remain separate checks.',
            'নাসা পাওয়ারের ১৯৯১–২০২০ মাসিক জলবায়ু FAO ECOCROP-এর তাপ, মাটি ও নিষ্কাশনের চাহিদায় মেলে। ফলাফলে প্রজাতির উৎসভিত্তিক মিল দেখায়। মৌসুমি পানি, স্থানীয় জাতের ফলন ও জমির উপযুক্ততা আলাদা যাচাইয়ের বিষয়।',
          )}
        </p>
        <p className="field-help">
          {t(
            'FAO dates ECOCROP to 1999, with updates discontinued around 2015. Crop requirements retain those historical source dates.',
            'FAO অনুযায়ী ECOCROP ১৯৯৯ সালে তৈরি; প্রায় ২০১৫ সালে হালনাগাদ বন্ধ হয়। ফসলের চাহিদায় সেই উৎসের তারিখ রাখা আছে।',
          )}
        </p>
        <p>
          <SourceLink href="https://power.larc.nasa.gov/docs/services/api/temporal/climatology/">
            NASA POWER climatology
          </SourceLink>{' '}
          ·{' '}
          <SourceLink href="https://www.fao.org/geospatial/data-and-tools/data-portals/ecocrop/en">
            FAO ECOCROP · source history
          </SourceLink>{' '}
          ·{' '}
          <SourceLink href="https://github.com/OpenCLIM/ecocrop/blob/f13577f4237604b15d85d8e43741714a2d1eb2d4/EcoCrop_DB.csv">
            ECOCROP numeric data distributed by OpenCLIM
          </SourceLink>{' '}
          ·{' '}
          <SourceLink href="https://zenodo.org/records/10843625">
            Distribution / OGL-UK-3.0
          </SourceLink>
        </p>
      </section>
      <section className="card">
        <h2>{t('What water advice requires', 'পানির পরামর্শে যা দরকার')}</h2>
        <p>
          {t(
            'The optional FAO-56 daily calculation uses crop-stage coefficients, root depth, soil capacity, starting moisture and daily water inputs. It covers non-ponded soil at fixed root depth, using beginning-of-day stress and daily totals. Forecast ET₀ is labelled as a planning scenario.',
            'ঐচ্ছিক FAO-56 দৈনিক হিসাবে ফসলের সহগ, শিকড়ের গভীরতা, মাটির ধারণক্ষমতা, শুরুর আর্দ্রতা ও দিনের পানির তথ্য লাগে। স্থির শিকড়ের গভীরতা ও জমা পানি নেই এমন মাটিতে শুরুর চাপ ও দিনের মোট পানি ব্যবহৃত হয়। পূর্বাভাসের ET₀ পরিকল্পনার হিসাব হিসেবে থাকে।',
          )}
        </p>
        <SourceLink href="https://www.fao.org/4/x0490e/x0490e0b.htm">
          FAO-56 · crop coefficients and local growth stages
        </SourceLink>{' '}
        ·{' '}
        <SourceLink href="https://www.fao.org/4/x0490e/x0490e0e.htm">
          FAO-56 · root-zone water balance
        </SourceLink>
      </section>
      <section className="card">
        <h2>
          {t('What would validate a local recommendation?', 'স্থানীয় পরামর্শ যাচাই হবে কীভাবে?')}
        </h2>
        <p>
          {t(
            'Local model evaluation compares weather, soil and management inputs with observed flowering, maturity and harvest outcomes. The optional grain-corn heat model requires a documented hybrid heat target; local calibration is not established.',
            'স্থানীয় মডেল যাচাইয়ে আবহাওয়া, মাটি ও ব্যবস্থাপনার তথ্যের সঙ্গে দেখা ফুল, পরিপক্বতা ও তোলার ফল মিলিয়ে দেখা হয়। ঐচ্ছিক দানার ভুট্টার তাপের মডেলে হাইব্রিডের নথির তাপের চাহিদা লাগে; স্থানীয় ক্যালিব্রেশন প্রতিষ্ঠিত নয়।',
          )}
        </p>
        <SourceLink href="https://dssat.net/data/minimum-data/">
          DSSAT · calibration and evaluation data
        </SourceLink>{' '}
        ·{' '}
        <SourceLink href="https://cfaes.osu.edu/fact-sheet/corn-growing-degree-days-method-maturity-rating-hybrids">
          Ohio State · grain-corn heat method and limitations
        </SourceLink>
      </section>
      <section className="card">
        <h2>{t('Global historical crop calendars', 'বিশ্বের পুরোনো ফসল পঞ্জিকা')}</h2>
        <p>
          {t(
            'Sacks et al. (2010), SAGE, supplies fourteen original 0.5° crop/season grids, mainly based on 1990s and early-2000s observations. Regional planting windows are displayed with their source dates. Climate-only options use ECOCROP duration ranges and monthly-normal temperature windows. Local varieties and winter survival need regional evidence.',
            'Sacks ও সহকর্মীদের (২০১০) SAGE-এর ০.৫°-এর ১৪টি ফসল/মৌসুমের মূল গ্রিড ব্যবহার হয়; বেশিরভাগ পর্যবেক্ষণ ১৯৯০-এর দশক ও ২০০০-এর শুরুর। আঞ্চলিক রোপণের সময়ে উৎসের দিন থাকে। শুধু জলবায়ুর বিকল্পে ECOCROP-এর সময়সীমা ও মাসিক স্বাভাবিক তাপের সময় ব্যবহৃত হয়। স্থানীয় জাত ও শীতে বাঁচার তথ্য আঞ্চলিকভাবে যাচাই দরকার।',
          )}
        </p>
        <SourceLink href="https://sage.nelson.wisc.edu/data-and-models/datasets/crop-calendar-dataset/">
          Original SAGE dataset and paper
        </SourceLink>{' '}
        ·{' '}
        <SourceLink href="https://sage-public-files.s3.amazonaws.com/crop-calendar-dataset/crop-readme.txt">
          Original data documentation
        </SourceLink>
      </section>
      <section className="card">
        <h2>{t('Daily guidance & automation', 'দৈনিক সহায়তা ও স্বয়ংক্রিয় কাজ')}</h2>
        <p>
          {t(
            'Weather refreshes while the app is open and reconnects automatically. Reading & sound controls automatic updates; manual refresh and source timestamps remain available. Daily guidance uses planting dates, observed crop stages and dated forecasts. Records are stored in this browser; export them for backup.',
            'অ্যাপ খোলা থাকলে আবহাওয়া আপডেট হয় ও সংযোগ ফিরলে নিজে চেষ্টা করে। Reading & sound থেকে স্বয়ংক্রিয় আপডেট নিয়ন্ত্রণ করা যায়; নিজে আপডেট ও উৎসের সময় দেখা যায়। রোপণ, দেখা পর্যায় ও তারিখের পূর্বাভাসে দৈনিক নির্দেশনা আসে। হিসাব এই ব্রাউজারে থাকে; ব্যাকআপে নামান।',
          )}
        </p>
        <SourceLink href="https://www.fao.org/4/s2022e/s2022e02.htm">
          FAO crop water needs
        </SourceLink>{' '}
        ·{' '}
        <SourceLink href="https://www.fao.org/agriculture/crops/thematic-sitemap/theme/spi/scpi-home/managing-ecosystems/integrated-pest-management/ipm-how/en/">
          FAO integrated pest management
        </SourceLink>
      </section>
      <section className="card">
        <h2>
          {t(
            'Previous rotation records: NASA daily history',
            'আগের ফসলক্রমের হিসাব: নাসার দৈনিক ইতিহাস',
          )}
        </h2>
        <p>
          {t(
            'NASA POWER daily history includes air temperature, corrected precipitation and modeled surface wetness. Source coverage, dates and units are retained in the saved records.',
            'নাসা পাওয়ারের দৈনিক ইতিহাসে তাপ, সংশোধিত বৃষ্টি ও মডেলের পৃষ্ঠের ভেজাভাব থাকে। রাখা হিসাবে উৎসের পূর্ণতা, দিন ও একক থাকে।',
          )}
        </p>
        <SourceLink href="https://power.larc.nasa.gov/docs/faqs/data/">NASA POWER</SourceLink>
      </section>
      <section className="card">
        <h2>
          {t(
            'Rain and soil water in the Rajshahi region: NASA GPM IMERG and SMAP',
            'রাজশাহী অঞ্চলে বৃষ্টি ও মাটির পানি: নাসা GPM IMERG ও SMAP',
          )}
        </h2>
        <p>
          {t(
            'For lands inside 87.9–89.45° E, 24.0–25.3° N, Ritu uses weekly summaries it built once from two NASA products and ships with the app; no login is needed to use it. GPM IMERG Final Run daily rain (V07, 0.1°, 1 Jan 2001 to 30 Sep 2025): mean rain per ISO week and the share of years in which a run of 21 or more days below 1 mm touched that week. SMAP L4 root-zone soil moisture (V8, 9 km, 1 Apr 2015 to 31 Dec 2025, the 3-hour value nearest 12:00 Bangladesh time): mean per ISO week, scaled from the driest to the wettest week anywhere in the region. Both were retrieved on 10 Nov 2026. They are values for a grid square of about 10 km, not for one field.',
            'রাজশাহী অঞ্চলের (৮৭.৯–৮৯.৪৫° পূর্ব, ২৪.০–২৫.৩° উত্তর) জমির জন্য ঋতু নাসার দুটি তথ্যভান্ডার থেকে একবার বানানো সাপ্তাহিক সারাংশ অ্যাপের সঙ্গেই রাখে; ব্যবহারে কোনো লগইন লাগে না। GPM IMERG ফাইনাল দৈনিক বৃষ্টি (V07, ০.১°, ১ জানুয়ারি ২০০১ থেকে ৩০ সেপ্টেম্বর ২০২৫): প্রতি সপ্তাহের গড় বৃষ্টি, আর কত বছরে টানা ২১ দিন বা বেশি ১ মিমির কম বৃষ্টি সেই সপ্তাহ ছুঁয়েছে। SMAP L4 শিকড়ের স্তরের মাটির আর্দ্রতা (V8, ৯ কিমি, ১ এপ্রিল ২০১৫ থেকে ৩১ ডিসেম্বর ২০২৫, বাংলাদেশ সময় দুপুর ১২টার কাছের ৩ ঘণ্টার মান): প্রতি সপ্তাহের গড়, অঞ্চলের সবচেয়ে শুকনো থেকে সবচেয়ে ভেজা সপ্তাহের মাপে। দুটিই ১০ নভেম্বর ২০২৬-এ নেওয়া। এগুলো প্রায় ১০ কিমির একটি ঘরের মান, একটি জমির নয়।',
          )}
        </p>
        <p>
          {t(
            'How Ritu uses them. Dry spells: the rain a crop’s water plan counts on in its flowering and grain weeks becomes extra irrigation in a dry year; the plan’s score drops by that many irrigations times the share of years with a dry spell (from 20% of years; from 40% the crop’s water bar also goes up one step on plots with limited water or rain only). Soil water at sowing: non-rice crops start with the root-zone water usual in their sowing week; below half, Ritu adds one irrigation before sowing. The calendar shows the usual weekly rain, root-zone wetness and dry-spell chance for days beyond the forecast.',
            'ঋতু যেভাবে ব্যবহার করে। খরা: ফুল ও দানা আসার সপ্তাহে ফসলের পানির হিসাব যে বৃষ্টির ওপর ভরসা করে, শুকনো বছরে তা বাড়তি সেচ হয়ে যায়; খরার বছরের ভাগ দিয়ে গুণ করে সেই সংখ্যক সেচ পরিকল্পনার নম্বর থেকে কমে (২০% বছর থেকে; ৪০% থেকে কম পানি বা শুধু বৃষ্টির প্লটে ফসলের পানির দাগও এক ধাপ বাড়ে)। বোনার সময় মাটির পানি: ধান ছাড়া অন্য ফসল বোনার সপ্তাহের সাধারণ শিকড়ের স্তরের পানি নিয়ে শুরু করে; অর্ধেকের কম হলে ঋতু বোনার আগে একটি সেচ যোগ করে। পূর্বাভাসের বাইরের দিনে ক্যালেন্ডার সাপ্তাহিক সাধারণ বৃষ্টি, শিকড়ের মাটির ভেজাভাব ও খরার সম্ভাবনা দেখায়।',
          )}
        </p>
        <SourceLink href="https://doi.org/10.5067/GPM/IMERGDF/DAY/07">
          GPM IMERG Final Precipitation L3 1 day 0.1° V07 (GES DISC)
        </SourceLink>{' '}
        ·{' '}
        <SourceLink href="https://doi.org/10.5067/T5RUATAQREF8">
          SMAP L4 Global 3-hourly 9 km Surface and Root Zone Soil Moisture V8 (NSIDC DAAC)
        </SourceLink>
      </section>
      <section className="card">
        <h2>
          {t(
            'Soil texture and drainage in Rajshahi, Chapainawabganj, Natore and Naogaon: BARC crop zoning',
            'রাজশাহী, চাঁপাইনবাবগঞ্জ, নাটোর ও নওগাঁয় মাটির গঠন ও নিষ্কাশন: BARC ফসল জোনিং',
          )}
        </h2>
        <p>
          {t(
            'For lands in Rajshahi, Chapainawabganj, Natore and Naogaon, Ritu fills in soil texture and drainage from the soil units of the Bangladesh Agricultural Research Council’s Crop Zoning Information System, built from Soil Resource Development Institute (SRDI) soil surveys; the same data is behind the government’s Khamari app. Ritu sampled the units once, every 0.005° (about 500 m), and ships the result with the app, so a land takes the survey point within about 400 m of its pin. Sand and sandy loam count as sandy soil, loam and clay loam as loam, and clay as clay; well and moderately well drained units fill in “drains well”, poorly and very poorly drained units “poorly drained”, and imperfectly drained units leave the answer to the farmer. The farmer’s own choice always wins. Where there is no soil unit (towns, rivers) and outside the four districts, Ritu uses SoilGrids. Reproduced under the portal’s copyright policy, with this acknowledgement.',
            'রাজশাহী, চাঁপাইনবাবগঞ্জ, নাটোর ও নওগাঁর জমির জন্য ঋতু মাটির গঠন ও নিষ্কাশন বসায় বাংলাদেশ কৃষি গবেষণা কাউন্সিলের ফসল জোনিং তথ্যব্যবস্থার মাটির একক থেকে, যা মৃত্তিকা সম্পদ উন্নয়ন ইনস্টিটিউটের (SRDI) মাটি জরিপে তৈরি; সরকারের খামারী অ্যাপের পেছনেও এই তথ্য। ঋতু এককগুলো একবার প্রতি ০.০০৫° (প্রায় ৫০০ মিটার) পরপর নিয়ে অ্যাপের সঙ্গে রেখেছে, তাই জমি তার পিনের প্রায় ৪০০ মিটারের মধ্যের জরিপ বিন্দু পায়। বালু ও বেলে দোআঁশ বেলে মাটি, দোআঁশ ও এঁটেল দোআঁশ দোআঁশ, আর এঁটেল এঁটেল ধরা হয়; ভালো ও মোটামুটি ভালো নিষ্কাশনের একক “ভালো নিষ্কাশন”, দুর্বল ও খুব দুর্বল নিষ্কাশনের একক “দুর্বল নিষ্কাশন” বসায়, আর অপূর্ণ নিষ্কাশনের এককে উত্তর কৃষকের ওপর থাকে। কৃষকের নিজের বাছাই সবসময় আগে। যেখানে মাটির একক নেই (শহর, নদী) আর চার জেলার বাইরে ঋতু SoilGrids ব্যবহার করে। পোর্টালের কপিরাইট নীতি অনুযায়ী, এই স্বীকৃতিসহ।',
          )}
        </p>
        <SourceLink href="https://czis.cropzoning.gov.bd">
          BARC Crop Zoning Information System (CZIS)
        </SourceLink>{' '}
        ·{' '}
        <SourceLink href="https://portal.cropzoning.gov.bd/copyrightPolicy">
          {t('Copyright policy', 'কপিরাইট নীতি')}
        </SourceLink>
      </section>
      <section className="card">
        <h2>
          {t(
            'Additional soil data and research candidates',
            'মাটির বাড়তি তথ্য ও গবেষণার সম্ভাবনা',
          )}
        </h2>
        <p>
          {t(
            'SoilGrids 2.0 supplies modeled pH-in-water and 5th/95th quantiles through ISRIC WCS for three topsoil depths at 250 m resolution. Predictions are kept separate from farmer-reported soil tests. GAEZ is a research reference and is not integrated into farm calculations.',
            'SoilGrids 2.0 থেকে ISRIC WCS দিয়ে ২৫০ মিটার রেজোলিউশনে তিন গভীরতার পানিতে pH-এর মডেল ও ৫ম/৯৫তম কোয়ান্টাইল আসে। কৃষকের মাটি পরীক্ষার তথ্য আলাদা থাকে। GAEZ গবেষণার উৎস; খামারের হিসাবে যুক্ত নয়।',
          )}
        </p>
        <SourceLink href="https://www.fao.org/gaez/en">FAO GAEZ</SourceLink> ·{' '}
        <SourceLink href="https://isric.org/explore/soilgrids">
          ISRIC SoilGrids · service status
        </SourceLink>
        <p className="field-help">
          {t(
            'Service status checked 3 November 2026; it can change.',
            'সেবার অবস্থা ৩ নভেম্বর ২০২৬-এ দেখা; বদলাতে পারে।',
          )}
        </p>
      </section>
      <section className="card">
        <h2>Open-Meteo / GeoNames / OpenStreetMap</h2>
        <p>
          {t(
            'Open-Meteo supplies current model estimates and seven-day forecasts with timestamps. GeoNames supports place search; OpenStreetMap supplies map tiles. Licences: Open-Meteo/GeoNames CC BY 4.0; OpenStreetMap attribution is shown on the map.',
            'Open-Meteo সময়সহ বর্তমান মডেলের মান ও সাত দিনের পূর্বাভাস দেয়। GeoNames স্থান খোঁজা ও OpenStreetMap মানচিত্র দেয়। Open-Meteo/GeoNames CC BY 4.0; মানচিত্রে OpenStreetMap-এর কৃতিত্ব দেখা যায়।',
          )}
        </p>
        <SourceLink href="https://open-meteo.com/en/docs">Open-Meteo</SourceLink> ·{' '}
        <SourceLink href="https://www.openstreetmap.org/copyright">OpenStreetMap</SourceLink>
      </section>
      <section className="card">
        <h2>{t('Previous rotation records: DAE / BAMIS', 'আগের ফসলক্রমের হিসাব: DAE / BAMIS')}</h2>
        <p>
          {t(
            'DAE/BAMIS regional calendars supply published growing-duration ranges and reference weeks for earlier saved rotation plans.',
            'আগের রাখা ফসলক্রমের জন্য DAE/BAMIS আঞ্চলিক পঞ্জিকা থেকে প্রকাশিত বৃদ্ধির সময়সীমা ও সপ্তাহ নেওয়া হয়েছে।',
          )}
        </p>
        <ul>
          {regionalCalendars.map((c) => (
            <li key={c.id}>
              <SourceLink href={c.source.document}>{c.name[language]}</SourceLink> ·{' '}
              {c.duration.min === c.duration.max
                ? c.duration.max
                : `${c.duration.min}–${c.duration.max}`}{' '}
              {t('days', 'দিন')} · {c.source.date}
            </li>
          ))}
        </ul>
      </section>
      <section className="card">
        <h2>{t('Pilot region for rotation comparison', 'ফসলচক্র তুলনার পাইলট অঞ্চল')}</h2>
        <p>
          {t(
            'Rotations are compared for the DAE/BAMIS Rajshahi region: Rajshahi, Chapainawabganj, Naogaon and Natore districts, where the regional crop calendars on this page apply. A field belongs to the region when its map pin falls inside one of these district boundaries.',
            'ফসলচক্রের তুলনা করা হয় DAE/BAMIS-এর রাজশাহী অঞ্চলের জন্য: রাজশাহী, চাঁপাইনবাবগঞ্জ, নওগাঁ ও নাটোর জেলা, যেখানে এই পাতার আঞ্চলিক ফসল পঞ্জিকা প্রযোজ্য। জমির ম্যাপ-পিন এই জেলাগুলোর সীমানার ভেতরে পড়লে জমিটি অঞ্চলের অংশ ধরা হয়।',
          )}
        </p>
        <SourceLink href={rajshahiRegion.boundary.url}>geoBoundaries</SourceLink> ·{' '}
        <SourceLink href={rajshahiRegion.boundary.sourceUrl}>
          BBS · OCHA ROAP ({rajshahiRegion.boundary.license})
        </SourceLink>
      </section>
      <section className="card">
        <h2>{t('Field-area units', 'জমির আয়তনের একক')}</h2>
        <p>
          {t(
            'One hectare is 10,000 square metres. Decimal/shotok entry uses the Ministry of Land convention of 435.6 square feet, converted with the international foot (0.3048 metres). Switching units preserves the underlying area.',
            '১ হেক্টর = ১০,০০০ বর্গমিটার। শতকের জন্য ভূমি মন্ত্রণালয়ের ৪৩৫.৬ বর্গফুট ও আন্তর্জাতিক ফুট (০.৩০৪৮ মিটার) দিয়ে রূপান্তর হয়। একক বদলালেও মাপ একই থাকে।',
          )}
        </p>
        <SourceLink href="https://minland.gov.bd/pages/static-pages/694032ae35ce18e1c0560717">
          {t('Ministry of Land', 'ভূমি মন্ত্রণালয়')}
        </SourceLink>{' '}
        ·{' '}
        <SourceLink href="https://www.nist.gov/pml/us-surveyfoot/revised-unit-conversion-factors">
          NIST
        </SourceLink>
      </section>
      <section className="card">
        <h2>{t('What still needs local evidence', 'যেখানে স্থানীয় তথ্য দরকার')}</h2>
        <p>
          {t(
            'Before planting, confirm the local variety, soil test, usable irrigation supply and field conditions. Record crop observations and harvest outcomes for the next season.',
            'রোপণের আগে স্থানীয় জাত, মাটি পরীক্ষা, ব্যবহারযোগ্য সেচ ও জমির অবস্থা নিশ্চিত করুন। পরের মৌসুমের জন্য ফসলের পর্যবেক্ষণ ও তোলার ফল লিখে রাখুন।',
          )}
        </p>
        <SourceLink href="https://portal.cropzoning.gov.bd/">BARC</SourceLink> ·{' '}
        <SourceLink href="https://iras.bamis.gov.bd/">DAE IRAS</SourceLink>
      </section>
      <Link href="/farm" className="button primary" onClick={onNavigate}>
        {t('Start with your farm', 'আপনার জমি দিয়ে শুরু করুন')}
        <ArrowRight size={19} />
      </Link>
    </div>
  );
}
