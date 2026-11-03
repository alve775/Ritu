'use client';
import { useEffect, useId, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, ExternalLink, Search } from 'lucide-react';
import { usePlanner } from './planner-provider';
import { PlantPhoto } from './plant-photo';
import type { CropSuggestion, GlobalCrop } from '../domain/global-season';
import { commonPlantNames, plantDisplayName } from '../domain/plant-names';
import { verifiedCommonNames } from '../data/verified-common-names';
interface Results {
  total: number;
  matches: number;
  count: number;
  page: number;
  pages: number;
  items: { plant: GlobalCrop; suggestion: CropSuggestion | null; unavailable: string | null }[];
}
const categories = [
  ['food', 'Food plants'],
  ['all', 'All source uses (includes non-food)'],
  ['vegetables', 'Vegetables'],
  ['fruits & nuts', 'Fruits & nuts'],
  ['cereals & pseudocereals', 'Grains'],
  ['pulses (grain legumes)', 'Pulses / beans'],
  ['roots/tubers', 'Roots & tubers'],
  ['materials', 'Oil, fibre & other materials'],
  ['forage/pasture', 'Forage / pasture'],
  ['cover crop', 'Cover crops'],
  ['forest/wood', 'Trees / wood'],
  ['medicinals & aromatic', 'Medicinal & aromatic uses'],
  ['ornamentals/turf', 'Ornamentals / turf'],
  ['environmental', 'Environmental uses'],
  ['weed', 'Source-labelled weeds'],
  ['other', 'Other uses'],
];
export function PlantBrowser({
  from,
  selected,
  onPick,
}: {
  from: string;
  selected: string;
  onPick: (s: CropSuggestion) => void;
}) {
  const { farm, site, language, t } = usePlanner();
  const id = useId();
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState('food'),
    [cycle, setCycle] = useState('all'),
    [mode, setMode] = useState('matches'),
    [page, setPage] = useState(1),
    [retry, setRetry] = useState(0);
  const [response, setResponse] = useState<{ key: string; data: Results } | null>(null),
    [failure, setFailure] = useState<{ key: string; message: string } | null>(null);
  const params = new URLSearchParams({
    latitude: String(site?.latitude),
    longitude: String(site?.longitude),
    from,
    soil: farm.soil,
    drainage: farm.drainage,
    irrigation: farm.irrigation,
    area: String(farm.area),
    q: query,
    category,
    cycle,
    mode,
    page: String(page),
  });
  const key = params.toString();
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/plants?${key}`, { signal: controller.signal })
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) throw Error(data.error || 'Plant search is unavailable.');
          if (!controller.signal.aborted) {
            setResponse({ key, data });
            setFailure(null);
          }
        })
        .catch((e) => {
          if (!controller.signal.aborted) setFailure({ key, message: e.message });
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, retry]);
  const data = response?.key === key ? response.data : null,
    error = failure?.key === key ? failure.message : null;
  const change = (fn: () => void) => {
    fn();
    setPage(1);
  };
  const pagination = data && data.pages > 1 && (
    <nav className="plant-pagination" aria-label={t('Plant results pages', 'গাছের ফলাফলের পৃষ্ঠা')}>
      <button
        className="button secondary"
        disabled={data.page === 1}
        onClick={() => setPage(data.page - 1)}
      >
        <ChevronLeft size={17} />
        {t('Previous', 'আগের')}
      </button>
      <span>{t(`Page ${data.page} of ${data.pages}`, `পৃষ্ঠা ${data.page} / ${data.pages}`)}</span>
      <button
        className="button secondary"
        disabled={data.page === data.pages}
        onClick={() => setPage(data.page + 1)}
      >
        {t('Next', 'পরের')}
        <ChevronRight size={17} />
      </button>
    </nav>
  );
  return (
    <section
      data-tour="crop-suggestions"
      className="plant-browser"
      aria-label={t('Suggested crops', 'প্রস্তাবিত ফসল')}
    >
      <div className="card plant-search">
        <h2>{t('Find what you want to grow', 'কী চাষ করতে চান খুঁজুন')}</h2>
        <p>
          {t(
            'Source food-use categories appear first. Search a plant name, including peanut / groundnut. A category does not establish safe preparation or edibility of every plant part.',
            'প্রথমে উৎসে খাদ্য ব্যবহারের বিভাগ দেখায়। গাছের প্রচলিত নামে খুঁজুন। বিভাগ দিয়ে নিরাপদ প্রক্রিয়াকরণ বা গাছের সব অংশের খাদ্যযোগ্যতা নিশ্চিত হয় না।',
          )}
        </p>
        <div className="plant-filters">
          <label htmlFor={`${id}-search`}>
            <span>
              <Search size={16} /> {t('Search plants', 'গাছ খুঁজুন')}
            </span>
            <input
              id={`${id}-search`}
              type="search"
              maxLength={120}
              placeholder={t('e.g. tomato, mango, peanut', 'যেমন টমেটো, আম, চিনাবাদাম')}
              value={query}
              onChange={(e) => change(() => setQuery(e.target.value))}
            />
          </label>
          <label>
            {t('Plant use', 'গাছের ব্যবহার')}
            <select value={category} onChange={(e) => change(() => setCategory(e.target.value))}>
              {categories.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t('Life cycle / plan', 'জীবনচক্র / পরিকল্পনা')}
            <select value={cycle} onChange={(e) => change(() => setCycle(e.target.value))}>
              <option value="all">{t('All life cycles', 'সব জীবনচক্র')}</option>
              <option value="seasonal">{t('Seasonal planting', 'মৌসুমি চাষ')}</option>
              <option value="perennial-review">
                {t('Perennial care', 'বহুবর্ষজীবী পরিচর্যা')}
              </option>
              <option value="unknown">{t('Life cycle unrecorded', 'জীবনচক্রের তথ্য নেই')}</option>
            </select>
          </label>
          <label>
            {t('Evidence filter', 'প্রমাণের ফিল্টার')}
            <select value={mode} onChange={(e) => change(() => setMode(e.target.value))}>
              <option value="matches">
                {t('Passes the current screen', 'বর্তমান যাচাইয়ে মেলা')}
              </option>
              <option value="catalogue">
                {t('Entire source catalogue', 'উৎসের সম্পূর্ণ তালিকা')}
              </option>
            </select>
          </label>
        </div>
        <p className="plant-evidence-note">
          {t(
            'A climate match is a candidate to investigate, not confirmed field suitability. Fruit/nut trees and other perennials get a care calendar; first harvest and local fruiting season need cultivar and regional evidence.',
            'জলবায়ু মিললে যাচাইয়ের প্রার্থী, জমিতে উপযুক্ততার নিশ্চয়তা নয়। ফল/বাদামের গাছ ও বহুবর্ষজীবী উদ্ভিদ পরিচর্যার ক্যালেন্ডার পায়; প্রথম ফল ও ফলনের মৌসুমে জাত ও আঞ্চলিক প্রমাণ দরকার।',
          )}
        </p>
        {category !== 'food' && (
          <p className="notice-amber">
            {t(
              'Source use labels do not establish edibility, safety or local legal permission. Some catalogue plants are not food plants. Confirm the species and local restrictions.',
              'উৎসের ব্যবহার খাদ্যযোগ্যতা, নিরাপত্তা বা স্থানীয় অনুমতি নিশ্চিত করে না। তালিকায় অখাদ্য উদ্ভিদও আছে। প্রজাতি ও স্থানীয় নিয়ম যাচাই করুন।',
            )}
          </p>
        )}
      </div>
      <div aria-live="polite" className="plant-result-status">
        {data
          ? t(
              `${data.count} results · ${data.total.toLocaleString()} source plant records · no fixed result cap`,
              `${data.count} ফলাফল · উৎসের ${data.total} গাছ · ফলাফলের নির্দিষ্ট সীমা নেই`,
            )
          : error
            ? error
            : t(
                'Checking the source catalogue against your field…',
                'উৎসের তালিকা জমির সঙ্গে মেলানো হচ্ছে…',
              )}
      </div>
      {error && (
        <button className="button secondary" onClick={() => setRetry((n) => n + 1)}>
          {t('Retry plant search', 'আবার গাছ খুঁজুন')}
        </button>
      )}
      {pagination}
      {data?.count === 0 && (
        <div className="card">
          <h3>{t('No results for these filters', 'এই ফিল্টারে ফল নেই')}</h3>
          <p>
            {t(
              'Try another name or plant-use category. The entire source catalogue also shows plants with incomplete evidence or conditions that do not pass this screen.',
              'অন্য নাম বা বিভাগ দেখুন। সম্পূর্ণ উৎসের তালিকায় অসম্পূর্ণ প্রমাণ বা বর্তমান শর্তে না মেলা গাছও দেখা যায়।',
            )}
          </p>
          <button
            className="button secondary"
            onClick={() => {
              setQuery('');
              setCategory('all');
              setCycle('all');
              setMode('catalogue');
              setPage(1);
            }}
          >
            {t('Browse the full catalogue', 'সম্পূর্ণ তালিকা দেখুন')}
          </button>
        </div>
      )}
      <div className="season-crop-grid" aria-busy={!data && !error}>
        {data?.items.map(({ plant, suggestion: s, unavailable }) => {
          const names = commonPlantNames(plant);
          return (
            <article
              className={`season-crop-card ${selected === plant.id ? 'chosen' : ''}`}
              key={plant.id}
            >
              <PlantPhoto plant={plant} />
              <div className="season-crop-body">
                <label className="season-crop-choice">
                  <input
                    type="radio"
                    name="one-season-crop"
                    aria-label={plantDisplayName(plant, language)}
                    checked={selected === plant.id}
                    disabled={!s}
                    onChange={() => s && onPick(s)}
                  />
                  <span>
                    <strong>{plantDisplayName(plant, language)}</strong>
                    {language === 'en' && names.bn && <small lang="bn">{names.bn}</small>}
                    {language === 'bn' && names.bn && names.en && (
                      <small lang="en">{names.en}</small>
                    )}
                    {language === 'bn' && !names.bn && names.en && (
                      <small lang="bn">বাংলা নাম উৎসে নেই</small>
                    )}
                  </span>
                </label>
                <small>
                  {plant.categories.join(' · ') || t('Use not recorded', 'ব্যবহারের তথ্য নেই')}
                  <br />
                  {plant.lifespan || t('Life cycle unrecorded', 'জীবনচক্রের তথ্য নেই')}
                </small>
                {s ? (
                  <>
                    <span className="season-source-pill">
                      {s.basis === 'regional-calendar'
                        ? t('Historical regional option', 'আঞ্চলিক পুরোনো তথ্যের বিকল্প')
                        : t('Preliminary source match', 'উৎসের প্রাথমিক মিল')}
                    </span>
                    <p className="season-crop-caution">
                      {t(
                        'Water adequacy and local suitability still need checking.',
                        'পানির পর্যাপ্ততা ও স্থানীয় উপযুক্ততা এখনও যাচাই করতে হবে।',
                      )}
                    </p>
                    <p className="season-small-note">
                      {t('Source-supported factors', 'উৎসে মেলা বিষয়')}:{' '}
                      {s.checks
                        ?.filter((c) => c.state === 'supported')
                        .map((c) =>
                          t(
                            c.factor === 'temperature'
                              ? 'average temperature'
                              : c.factor === 'soil'
                                ? 'soil texture'
                                : 'drainage',
                            c.factor === 'temperature'
                              ? 'গড় তাপমাত্রা'
                              : c.factor === 'soil'
                                ? 'মাটির গঠন'
                                : 'নিষ্কাশন',
                          ),
                        )
                        .join(' · ') || t('Not established', 'প্রতিষ্ঠিত নয়')}
                    </p>
                    {s.planKind === 'perennial-review' ? (
                      <p className="season-crop-caution">
                        {t(
                          'Perennial care plan · first harvest not predicted · winter survival unverified',
                          'বহুবর্ষজীবী পরিচর্যা · প্রথম ফলের পূর্বাভাস নেই · শীত কাটানো অযাচাইকৃত',
                        )}
                      </p>
                    ) : (
                      <p>
                        {t('Planning reference interval', 'পরিকল্পনার তথ্যভিত্তিক সময়')}:{' '}
                        {s.durationMin}–{s.durationMax}{' '}
                        {t('days · not a harvest prediction', 'দিন · কাটার পূর্বাভাস নয়')}
                      </p>
                    )}
                    <p>
                      {s.planKind === 'perennial-review'
                        ? t('Care planning from', 'পরিচর্যা পরিকল্পনার শুরু')
                        : t('Next planning window', 'পরবর্তী পরিকল্পনার সময়')}
                      :{' '}
                      {new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-GB', {
                        dateStyle: 'medium',
                        timeZone: 'UTC',
                      }).format(new Date(s.start + 'T12:00:00Z'))}
                    </p>
                    <details>
                      <summary>
                        {t('Why this option & what to check', 'এই বিকল্পের কারণ ও কী যাচাই করবেন')}
                      </summary>
                      <ul>
                        {s.checks?.map((c) => (
                          <li key={c.factor}>
                            <strong>
                              {c.state === 'supported'
                                ? t('Source match', 'উৎসে মিল')
                                : t('Unverified', 'অযাচাইকৃত')}
                            </strong>{' '}
                            · {c.detail}
                          </li>
                        ))}
                        {s.reasons.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                      {s.sourceDurationMin !== undefined && s.sourceDurationMax !== undefined && (
                        <p>
                          {t(
                            'Original ECOCROP growing-period range',
                            'মূল ECOCROP বৃদ্ধির সময়সীমা',
                          )}
                          : {s.sourceDurationMin}–{s.sourceDurationMax}{' '}
                          {t(
                            'days; cultivar timing is not established.',
                            'দিন; জাতের সময় নির্ধারিত নয়।',
                          )}
                        </p>
                      )}
                      <h4>{t('Before planting', 'রোপণের আগে')}</h4>
                      <ul>
                        {s.cautions.map((c) => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                      {s.calendar && (
                        <a href={s.calendar.sourceUrl} target="_blank" rel="noreferrer">
                          Sacks et al. · {s.calendar.season}
                        </a>
                      )}
                    </details>
                    <button
                      className={`button ${selected === plant.id ? 'primary' : 'secondary'}`}
                      onClick={() => onPick(s)}
                    >
                      {selected === plant.id ? (
                        <>
                          <Check size={17} />
                          {t('Selected', 'বাছা হয়েছে')}
                        </>
                      ) : (
                        t('Choose this plant', 'এই গাছ বাছুন')
                      )}
                    </button>
                  </>
                ) : (
                  <p className="season-crop-caution">{unavailable}</p>
                )}
                <details className="plant-source-identity">
                  <summary>{t('Source record', 'উৎসের তথ্য')}</summary>
                  <p>
                    {t('Scientific identity', 'বৈজ্ঞানিক পরিচয়')}: {plant.scientific}
                  </p>
                  <a
                    href="https://www.fao.org/geospatial/data-and-tools/data-portals/ecocrop/en"
                    target="_blank"
                    rel="noreferrer"
                  >
                    FAO ECOCROP · {plant.ecocropId} <ExternalLink size={12} />
                  </a>
                  {verifiedCommonNames[plant.id] && (
                    <p>
                      <a
                        href={verifiedCommonNames[plant.id].source}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {t(
                          'Supplemental common-name source · FAO',
                          'প্রচলিত নামের অতিরিক্ত উৎস · FAO',
                        )}
                      </a>
                    </p>
                  )}
                </details>
              </div>
            </article>
          );
        })}
      </div>
      {pagination}
    </section>
  );
}
