'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  MapPin,
  Sprout,
  CalendarDays,
  Check,
  CloudSun,
  Download,
  Droplets,
  Leaf,
  ExternalLink,
  FlaskConical,
  Trash2,
} from 'lucide-react';
import { usePlanner } from './planner-provider';
import { FarmLocation } from './farm-location';
import { FarmAreaField } from './farm-area-field';
import { PlantBrowser } from './plant-browser';
import { plantDisplayName } from '../domain/plant-names';
import { DailyCheckInForm, stageLabel } from './season-check-in';
import { CycleStatus, SeasonProgress, ThermalModelSettings } from './season-progress';
import { referenceWindow } from '../domain/season-lifecycle';
import { estimateMaizeMaturity } from '../domain/crop-thermal';
import { useThermalWeather } from '../lib/use-thermal-weather';
import { WeatherContent } from './weather-panel';
import { Dialog } from './dialog';
import { ResetDataControl } from './reset-data-control';
import { useSeasonContext } from '../lib/use-season-context';
import { seasonStore, useSeasonFarms, validSeasonState } from '../lib/season-store';
import { blankFarm, evidenceStore } from '../lib/evidence-store';
import { exportRecords } from '../lib/export-records';
import { pilotRegionFor } from '../data/regions';
import { useLiveWeather } from '../lib/use-live-weather';
import { globalCrop, localToday, daysBetween } from '../domain/global-season';
import type { SeasonFarm, CropSuggestion } from '../domain/global-season';
import { actionsForDay } from '../domain/season-actions';
import { actionCopy } from '../lib/action-copy';
import { addDays, validDate } from '../domain/evidence-planner';
import { weatherIsRecent } from '../domain/live-weather';
import type { Farm, Irrigation } from '../domain/types';
import { fieldConfirmationKey } from '../domain/field-confirmation';
import { SoilEvidenceForm } from './soil-evidence-form';
import { WaterBudgetPanel } from './water-budget-panel';
import { SoilReferencePanel } from './soil-reference-panel';
import { useSoilTexture } from '../lib/use-soil-texture';
import { useSoilSurvey } from '../lib/use-soil-survey';
import { textureNames } from '../domain/soil-texture';
import { CultivarReferencePanel } from './cultivar-reference-panel';
import { FieldRegistryDashboard } from './field-registry-dashboard';
import { RotationPlansView } from './rotation/rotation-plans';
import { RotationCalendar } from './rotation/rotation-calendar';
import { farmCalendarDay } from '../domain/farm-calendar';
import { FarmRecordScope, type FarmRecordWriter } from './farm-record-scope';
import { defaultSite, type FarmSite } from '../domain/farm-site';
import { useToday } from '../lib/use-today';

export const seasonDraftKey = fieldConfirmationKey;
function newField() {
  seasonStore.selectField(null);
  evidenceStore.update({
    farm: { ...blankFarm },
    // Start at the default Rajshahi pin; the farmer can move it.
    site: defaultSite,
    climate: undefined,
    from: '',
    district: '',
    preferred: [],
    unplanted: [],
    reviewed: null,
    selected: null,
  });
  seasonStore.confirm('');
  seasonStore.activate(null);
}
function ShortDate({ value }: { value: string }) {
  const { language } = usePlanner();
  return (
    <time dateTime={value}>
      {new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${value}T12:00:00Z`))}
    </time>
  );
}
function FarmLandscape({ crop, small = false }: { crop: string; small?: boolean }) {
  const skyId = useId();
  return (
    <div className={`season-landscape ${small ? 'small' : ''}`} aria-hidden="true">
      <svg viewBox="0 0 700 270" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id={skyId} x2="0" y2="1">
            <stop stopColor="#e1eef0" />
            <stop offset="1" stopColor="#f7f5e8" />
          </linearGradient>
        </defs>
        <rect width="700" height="270" fill={`url(#${skyId})`} />
        <circle cx="568" cy="50" r="28" fill="#e5bf6f" />
        <path d="M0 121 Q90 80 190 121T390 112T700 110V270H0Z" fill="#b7c5a1" />
        <path d="M0 157 Q170 112 360 142T700 127V270H0Z" fill="#8ca37b" />
        <path d="M-20 217Q280 126 730 174L710 290H-20Z" fill="#ab8356" />
        {[0, 1, 2, 3, 4].map((row) => (
          <g key={row}>
            <path
              d={`M-30 ${201 + row * 22} Q310 ${130 + row * 24} 730 ${173 + row * 24}`}
              stroke="#d9b67b"
              strokeWidth="5"
              fill="none"
            />
            {Array.from({ length: 12 }, (_, i) => (
              <g
                key={i}
                transform={`translate(${12 + i * 62 + row * 9},${192 + row * 21 - Math.sin(i / 4) * 27})`}
              >
                <path d="M0 4V-15" stroke="#355f3c" strokeWidth="2" />
                <path
                  d="M0-6Q-17-22-16-8Q-6-4 0-2M0-10Q16-27 17-12Q8-7 0-7"
                  fill={row % 2 ? '#537c43' : '#6e914f'}
                />
              </g>
            ))}
          </g>
        ))}
        <path d="M53 158V85" stroke="#806b4c" strokeWidth="9" />
        <circle cx="53" cy="74" r="32" fill="#5d805d" />
        <circle cx="33" cy="85" r="21" fill="#4e7051" />
        <path d="M405 137V103H456V137" fill="#efe2ba" />
        <path d="M393 105L430 77L468 105Z" fill="#a86c4c" />
        <rect x="426" y="115" width="13" height="22" fill="#5b6650" />
        <path d="M0 166Q180 120 355 154" stroke="#a6c8c5" strokeWidth="12" fill="none" />
      </svg>
      {!small && (
        <span className="landscape-caption">
          {globalCrop(crop) && plantDisplayName(globalCrop(crop)!, 'en')}
        </span>
      )}
    </div>
  );
}

export function SeasonFarmView() {
  const p = usePlanner(),
    { t, farm, setFarm, site, setEnvironment } = p;
  const router = useRouter(),
    farms = useSeasonFarms();
  const context = useSeasonContext(site);
  const soilTexture = useSoilTexture(p.site);
  // BARC crop-zoning soil survey (SRDI) in Rajshahi, Chapainawabganj, Natore and Naogaon; null elsewhere.
  const survey = useSoilSurvey(p.site),
    surveyUnit = survey && survey !== 'none' ? survey : null,
    pinKey = p.site ? `${p.site.latitude},${p.site.longitude}` : '';
  // Fill soil texture once per pin, unless the farmer has chosen it themselves: from the BARC
  // survey where it has a soil unit, otherwise from SoilGrids.
  const autoSoil = useRef<{ key: string; soil: Farm['soil'] | null }>({ key: '', soil: null });
  useEffect(() => {
    if (survey === undefined) return;
    const found = surveyUnit?.soil
      ? { key: `barc:${pinKey}`, soil: surveyUnit.soil }
      : soilTexture.texture
        ? {
            key: `${soilTexture.texture.latitude},${soilTexture.texture.longitude}`,
            soil: soilTexture.texture.soil,
          }
        : null;
    if (!found) return;
    const key = found.key;
    if (autoSoil.current.key === key) return;
    const previous = autoSoil.current.soil;
    autoSoil.current = { key, soil: previous };
    if (farm.soil === 'unknown' || farm.soil === previous) {
      autoSoil.current = { key, soil: found.soil };
      if (farm.soil !== found.soil) setFarm({ soil: found.soil });
    }
  }, [survey, surveyUnit, pinKey, soilTexture.texture, farm.soil, setFarm]);
  // The survey's drainage fills "Does water drain away?" once per pin, unless answered.
  const autoDrainage = useRef<{ key: string; drainage: Farm['drainage'] | null }>({
    key: '',
    drainage: null,
  });
  useEffect(() => {
    if (!surveyUnit || autoDrainage.current.key === pinKey) return;
    const previous = autoDrainage.current.drainage,
      next = surveyUnit.drains;
    autoDrainage.current = { key: pinKey, drainage: previous };
    if (farm.drainage === 'unknown' || (previous !== null && farm.drainage === previous)) {
      autoDrainage.current = { key: pinKey, drainage: next };
      const value = next ?? 'unknown';
      if (farm.drainage !== value) setFarm({ drainage: value });
    }
  }, [surveyUnit, pinKey, farm.drainage, setFarm]);
  const parent = farms.state.fields?.find((f) => f.id === farms.state.draftFieldId);
  // This page only describes land; crops are chosen per plot.
  const editingField = !!parent;
  const fieldWeather = useLiveWeather(
    site ?? defaultSite,
    !!site && !!parent?.site && !editingField,
  );
  const today = localToday(
    (parent && !editingField && fieldWeather.data?.timezone) || site?.timezone,
  );
  const [attempted, setAttempted] = useState(false);
  useEffect(() => {
    if (
      parent &&
      !editingField &&
      site &&
      fieldWeather.data &&
      site.timezone !== fieldWeather.data.timezone
    )
      setEnvironment({ site: { ...site, timezone: fieldWeather.data.timezone } });
  }, [parent, editingField, site, fieldWeather.data, setEnvironment]);
  const [fieldError, setFieldError] = useState('');
  const issues = [
    !site && t('Choose your land’s location.', 'জমির স্থান বাছুন।'),
    !(farm.area > 0 && farm.area <= 1000) &&
      t(
        'Enter an area greater than zero, up to 1,000 hectares.',
        'শূন্যের বেশি, সর্বোচ্চ ১,০০০ হেক্টর আয়তন দিন।',
      ),
  ].filter(Boolean);
  /** Save the land; a land without plots goes straight to adding its first plot. */
  const saveLand = (current: Farm, chosen: FarmSite) => {
    let id = parent?.id;
    try {
      if (parent) {
        seasonStore.saveField({
          ...parent,
          name: current.name.trim() || parent.name,
          profile: { ...current },
          site: { ...chosen },
        });
      } else {
        id = crypto.randomUUID();
        seasonStore.addFields([
          {
            id,
            name: current.name.trim() || chosen.name.slice(0, 80),
            profile: { ...current },
            site: { ...chosen },
          },
        ]);
      }
      seasonStore.selectField(null);
    } catch (error) {
      setFieldError(
        error instanceof Error ? error.message : t('Check the land details.', 'জমির তথ্য দেখুন।'),
      );
      return;
    }
    const hasPlots = farms.state.plots?.some((plot) => plot.fieldId === id);
    router.push(hasPlots || !id ? '/farms' : `/plot?field=${encodeURIComponent(id)}`);
  };
  return (
    <div className="season-page evidence-page">
      <header className="season-page-heading">
        <div>
          <span className="eyebrow">{t('YOUR LAND', 'আপনার জমি')}</span>
          <h1>{parent ? parent.name : t('Add a land', 'জমি যোগ করুন')}</h1>
          <p>
            {t(
              'Find your land and describe it. Weather, climate and soil data load automatically. Next, you add plots.',
              'জমি খুঁজে তার তথ্য দিন। আবহাওয়া, জলবায়ু ও মাটির তথ্য নিজে থেকে আসবে। এরপর প্লট যোগ করবেন।',
            )}
          </p>
        </div>
        <div className="season-header-actions">
          <Link className="button secondary" href="/farms">
            <ArrowLeft size={17} />
            {t('Dashboard', 'ড্যাশবোর্ড')}
          </Link>
          <ResetDataControl />
        </div>
      </header>
      <FarmLocation worldwide />
      <section className="card season-fields" data-tour="farm-basics">
        <h2>
          <MapPin size={21} />
          {t('Your land', 'আপনার জমি')}
        </h2>
        <div className="season-form-grid">
          <label>
            {t('Land name', 'জমির নাম')}
            <input
              maxLength={80}
              value={farm.name}
              placeholder={t('e.g. River-side field', 'যেমন নদীর পাশের জমি')}
              onChange={(e) => setFarm({ name: e.target.value })}
            />
          </label>
          <FarmAreaField />
        </div>
      </section>
      <section className="card" data-tour="farm-soil">
        <h2>
          <Leaf size={21} />
          {t('Soil & drainage', 'মাটি ও পানি নিষ্কাশন')}
        </h2>
        <div className="season-form-grid">
          <label>
            {t('Soil texture', 'মাটির গঠন')}
            <select
              value={farm.soil}
              aria-label={t('Soil texture', 'মাটির গঠন')}
              onChange={(e) => setFarm({ soil: e.target.value as Farm['soil'] })}
            >
              <option value="unknown">{t('Not sure', 'জানা নেই')}</option>
              <option value="loam">{t('Loam', 'দোআঁশ')}</option>
              <option value="clay">{t('Clay', 'এঁটেল')}</option>
              <option value="sandy">{t('Sandy', 'বেলে')}</option>
            </select>
          </label>
          <label>
            {t('Does water drain away?', 'পানি কি সরে যায়?')}
            <select
              value={farm.drainage}
              aria-label={t('Does water drain away?', 'পানি কি সরে যায়?')}
              onChange={(e) => setFarm({ drainage: e.target.value as Farm['drainage'] })}
            >
              <option value="unknown">{t('Not sure', 'জানা নেই')}</option>
              <option value="good">{t('Yes · drains well', 'হ্যাঁ · ভালো নিষ্কাশন')}</option>
              <option value="imperfect">
                {t(
                  'Partly · stays wet for a while in the rains',
                  'মাঝারি · বর্ষায় কিছুদিন ভেজা থাকে',
                )}
              </option>
              <option value="poor">
                {t('Poorly drained · prolonged saturation', 'দুর্বল নিষ্কাশন · দীর্ঘ জলসম্পৃক্ততা')}
              </option>
            </select>
          </label>
        </div>
        {surveyUnit && (surveyUnit.soil || surveyUnit.drains) && (
          <p className="soil-texture-source" aria-live="polite">
            {`${t('From the BARC crop zoning soil survey (SRDI)', 'BARC ফসল জোনিং মাটি জরিপ (SRDI) থেকে')}: ${[
              surveyUnit.soil &&
                { loam: t('Loam', 'দোআঁশ'), clay: t('Clay', 'এঁটেল'), sandy: t('Sandy', 'বেলে') }[
                  surveyUnit.soil
                ],
              surveyUnit.drains &&
                (surveyUnit.drains === 'good'
                  ? t('Yes · drains well', 'হ্যাঁ · ভালো নিষ্কাশন')
                  : surveyUnit.drains === 'imperfect'
                    ? t(
                        'Partly · stays wet for a while in the rains',
                        'মাঝারি · বর্ষায় কিছুদিন ভেজা থাকে',
                      )
                    : t(
                        'Poorly drained · prolonged saturation',
                        'দুর্বল নিষ্কাশন · দীর্ঘ জলসম্পৃক্ততা',
                      )),
            ]
              .filter(Boolean)
              .join(
                ' · ',
              )}${t('.', '।')} ${t('Survey point within about 400 m of your pin.', 'আপনার পিন থেকে প্রায় ৪০০ মিটারের মধ্যের জরিপ বিন্দু।')} ${t('Change it if your field is different.', 'আপনার জমি আলাদা হলে বদলে দিন।')}`}
          </p>
        )}
        <p className="soil-texture-source" aria-live="polite">
          {soilTexture.texture
            ? `${t('From SoilGrids', 'SoilGrids থেকে')}: ${textureNames[soilTexture.texture.texture][p.language]} (${t('clay', 'এঁটেল')} ${soilTexture.texture.clayPct}%, ${t('sand', 'বালু')} ${soilTexture.texture.sandPct}%, ${t('silt', 'পলি')} ${soilTexture.texture.siltPct}%) · 5–15 cm${soilTexture.texture.distanceM > 0 ? ` · ${t('nearest data', 'নিকটতম তথ্য')} ${(soilTexture.texture.distanceM / 1000).toFixed(1)} km ${t('away', 'দূরে')}` : ''}. ${t('Change it if your field is different.', 'আপনার জমি আলাদা হলে বদলে দিন।')}`
            : soilTexture.loading
              ? t('Loading soil texture from SoilGrids…', 'SoilGrids থেকে মাটির গঠন আনা হচ্ছে…')
              : soilTexture.error
                ? t(
                    'Soil texture isn’t available from SoilGrids here. Choose it yourself, or leave Not sure.',
                    'এখানে SoilGrids থেকে মাটির গঠন পাওয়া যায়নি। নিজে বাছুন, অথবা জানা নেই রাখুন।',
                  )
                : t(
                    'Choose the soil texture and usual drainage for this field. Select Not sure if you do not know.',
                    'জমির মাটির গঠন ও সাধারণ নিষ্কাশন বাছুন। জানা না থাকলে নিশ্চিত নই বাছুন।',
                  )}
        </p>
      </section>
      <section className="card">
        <h2>
          <FlaskConical size={21} />
          {t('Soil pH', 'মাটির pH')}
        </h2>
        <SoilReferencePanel site={p.site} />
        <SoilEvidenceForm
          key={JSON.stringify(farm.soilEvidence)}
          value={farm.soilEvidence}
          today={today}
          onSave={(soilEvidence) => setFarm({ soilEvidence })}
        />
      </section>
      <section className="card" data-tour="farm-water">
        <h2>
          <Droplets size={21} />
          {t('Water available to this field', 'জমিতে পানির সুযোগ')}
        </h2>
        <div className="season-water-options">
          {(
            [
              ['reliable', 'Reliable irrigation', 'নির্ভরযোগ্য সেচ'],
              ['limited', 'Limited irrigation', 'সীমিত সেচ'],
              ['rainfed', 'Rain only', 'শুধু বৃষ্টি'],
              ['severe', 'Severe shortage', 'তীব্র সংকট'],
              ['unknown', 'Not sure', 'জানা নেই'],
            ] as const
          ).map(([id, en, bn]) => (
            <label key={id} className={farm.irrigation === id ? 'selected' : ''}>
              <input
                type="radio"
                name="season-water"
                value={id}
                checked={farm.irrigation === id}
                onChange={() => setFarm({ irrigation: id as Irrigation })}
              />
              {t(en, bn)}
            </label>
          ))}
        </div>
        <p className="season-small-note">
          {t(
            'Choose the water supply you can use on this field.',
            'এই জমিতে যে পানির সরবরাহ ব্যবহার করতে পারবেন তা বাছুন।',
          )}
        </p>
      </section>
      <section className="season-data-status" aria-live="polite" data-tour="season-context">
        <CloudSun size={23} />
        <div>
          <strong>
            {context.loading
              ? t(
                  'Loading this location’s growing conditions…',
                  'এই স্থানের চাষের পরিবেশ আনা হচ্ছে…',
                )
              : context.error
                ? t('Crop data could not load', 'ফসলের তথ্য আসেনি')
                : context.data
                  ? t('Your location’s climate is ready', 'আপনার স্থানের জলবায়ুর তথ্য প্রস্তুত')
                  : t(
                      'Choose a location to load its growing conditions',
                      'চাষের পরিবেশ জানতে স্থান বাছুন',
                    )}
          </strong>
          <p>
            {context.data
              ? t(
                  '1991–2020 NASA climate + published crop requirements. Current forecasts load separately.',
                  '১৯৯১–২০২০ নাসার জলবায়ু ও প্রকাশিত ফসলের চাহিদা। বর্তমান পূর্বাভাস আলাদা আসে।',
                )
              : context.error}
          </p>
        </div>
        {context.error && (
          <button className="button secondary" onClick={context.retry}>
            {t('Retry', 'আবার চেষ্টা')}
          </button>
        )}
      </section>
      {attempted && issues.length > 0 && (
        <div className="notice-amber" role="alert">
          <ul>
            {issues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="season-next" data-tour="farm-continue">
        <p>
          {t(
            'Next: add the plots on this land and the crops each one grew last year.',
            'পরের ধাপ: এই জমির প্লট ও প্রতিটিতে গত বছরের ফসল যোগ করুন।',
          )}
        </p>
        <button
          className="button primary"
          onClick={() => {
            setAttempted(true);
            if (issues.length || !site) return;
            setFieldError('');
            saveLand(farm, site);
          }}
        >
          {t('Save land', 'জমি সংরক্ষণ করুন')}
          <ArrowRight size={18} />
        </button>
      </div>
      {fieldError && (
        <p role="alert" className="notice-amber">
          {fieldError}
        </p>
      )}
    </div>
  );
}

export function SeasonCropsView() {
  const p = usePlanner(),
    { t, language } = p,
    { state, saved } = useSeasonFarms();
  const context = useSeasonContext(p.site),
    from = p.from || localToday(p.site?.timezone),
    router = useRouter();
  const [picked, setPicked] = useState<{ key: string; value: CropSuggestion } | null>(null),
    [error, setError] = useState('');
  const [single, setSingle] = useState(false);
  const confirmed = !!p.site && state.confirmedKey === seasonDraftKey(p.farm, p.site, from);
  const draftKey = seasonDraftKey(p.farm, p.site, from);
  const suggestion = picked?.key === draftKey ? picked.value : undefined;
  const creationKey = suggestion
    ? JSON.stringify([
        state.draftOperationId ?? null,
        state.draftFieldId ?? null,
        draftKey,
        suggestion.crop,
        suggestion.start,
      ])
    : null;
  const created = creationKey
    ? state.farms.find((farm) => farm.creationKey === creationKey)
    : undefined;
  const create = () => {
    if (!confirmed || !suggestion || !p.site || !context.data || !creationKey) return;
    setError('');
    try {
      seasonStore.create({
        id: crypto.randomUUID(),
        creationKey,
        createdAt: new Date().toISOString(),
        field: { ...p.farm },
        fieldId: state.draftFieldId || undefined,
        plotId: state.draftPlotId || undefined,
        site: { ...p.site },
        selection: suggestion,
        context: { ...context.data, site: { ...p.site } },
        plantedDate: '',
        harvestedDate: '',
        notes: '',
        done: [],
        observations: [],
      });
      router.push('/plan');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the crop calendar.');
    }
  };
  const draftPlot = state.plots?.find((x) => x.id === state.draftPlotId),
    draftField = state.fields?.find((f) => f.id === state.draftFieldId);
  // Year plans use the Rajshahi region's crop calendars and NASA rain and soil data, so they are
  // offered only for land inside it; elsewhere the plot gets one crop for one season.
  const inPilot = !!p.site && !!pilotRegionFor(p.site);
  if (confirmed && !single && inPilot && draftPlot && draftField && p.site && context.data?.normal)
    return (
      <RotationPlansView
        site={p.site}
        profile={p.farm}
        from={from}
        context={context.data}
        plot={draftPlot}
        field={draftField}
        onSingle={() => setSingle(true)}
      />
    );
  return (
    <div className="season-page evidence-page">
      <header className="season-page-heading">
        <div>
          <span className="eyebrow">
            {t('CHOOSE ONE PLANTING PLAN', 'এক মৌসুমের একটি ফসল বাছুন')}
          </span>
          <h1>{t('What would you like to grow?', 'কোন ফসল চাষ করতে চান?')}</h1>
          <p>
            {t(
              'Choose a crop for this plot and planting season.',
              'এই প্লট ও রোপণের মৌসুমের জন্য একটি ফসল বাছুন।',
            )}
          </p>
        </div>
        <Link
          className="button secondary"
          href={
            state.draftFieldId && state.draftPlotId
              ? `/plot?field=${encodeURIComponent(state.draftFieldId)}&plot=${encodeURIComponent(state.draftPlotId)}`
              : '/farms'
          }
        >
          <ArrowLeft size={17} />
          {state.draftPlotId ? t('Back to plot', 'প্লটে ফিরুন') : t('My lands', 'আমার জমি')}
        </Link>
      </header>
      {confirmed && draftPlot && p.site && !inPilot && (
        <p className="notice-amber" role="note">
          {t(
            'Whole-year plans are made for the Rajshahi region pilot (Rajshahi, Chapainawabganj, Natore and Naogaon), from its crop calendars and NASA rain and soil data. This land is outside it, so choose one crop for one season here.',
            'পুরো বছরের পরিকল্পনা রাজশাহী অঞ্চলের পাইলটের (রাজশাহী, চাঁপাইনবাবগঞ্জ, নাটোর ও নওগাঁ) ফসল পঞ্জিকা এবং নাসার বৃষ্টি ও মাটির তথ্য দিয়ে বানানো। এই জমি তার বাইরে, তাই এখানে এক মৌসুমের জন্য একটি ফসল বাছুন।',
          )}
        </p>
      )}
      {!confirmed ? (
        <section className="card evidence-gate" data-tour="crop-suggestions">
          <h2>{t('Open a plot first', 'আগে একটি প্লট খুলুন')}</h2>
          <p>
            {t(
              'On the dashboard, open a plot (or add one) and press Show suggested plans.',
              'ড্যাশবোর্ডে একটি প্লট খুলুন (বা যোগ করুন), তারপর পরামর্শ দেখুন চাপুন।',
            )}
          </p>
          <Link className="button primary" href="/farms">
            {t('Go to my lands', 'আমার জমিতে যান')}
          </Link>
        </section>
      ) : context.loading ? (
        <section className="card" role="status" data-tour="crop-suggestions">
          <h2>{t('Matching crops to your field…', 'জমির সঙ্গে ফসল মেলানো হচ্ছে…')}</h2>
        </section>
      ) : context.error ? (
        <section className="card" role="alert" data-tour="crop-suggestions">
          <h2>{t('Growing conditions are unavailable', 'চাষের পরিবেশের তথ্য নেই')}</h2>
          <p>{context.error}</p>
          <button className="button primary" onClick={context.retry}>
            {t('Retry crop matching', 'আবার মেলান')}
          </button>
        </section>
      ) : (
        <>
          <div className="season-match-summary">
            <MapPin size={20} />
            <span>
              {p.site?.name} · {p.farm.area} ha
            </span>
            <span>
              <Check size={16} />
              {t('One crop only', 'শুধু একটি ফসল')}
            </span>
          </div>
          <div className="season-next season-pick-bar" data-tour="crop-continue">
            <div>
              <strong>
                {suggestion
                  ? `${plantDisplayName(globalCrop(suggestion.crop)!, language)} · ${suggestion.planKind === 'perennial-review' ? t('perennial care', 'বহুবর্ষজীবী পরিচর্যা') : t('one season', 'এক মৌসুম')}`
                  : t('Choose one crop for this plot', 'এই প্লটের জন্য একটি ফসল বাছুন')}
              </strong>
              <p>
                {created
                  ? t(
                      'Crop calendar created. Open it to begin.',
                      'ফসলের ক্যালেন্ডার তৈরি হয়েছে। শুরু করতে খুলুন।',
                    )
                  : t(
                      'Create this crop’s calendar, daily work and weather forecast.',
                      'এই ফসলের ক্যালেন্ডার, দৈনিক কাজ ও আবহাওয়ার পূর্বাভাস তৈরি করুন।',
                    )}
              </p>
            </div>
            {created ? (
              <a
                className="button primary"
                href="/plan"
                onClick={(event) => {
                  seasonStore.activate(created.id);
                  // A document navigation also recovers a stalled client transition.
                  // Keep in-memory records alive when browser storage is unavailable.
                  if (!saved) {
                    event.preventDefault();
                    router.push('/plan');
                  }
                }}
              >
                {t('Open crop calendar', 'ফসলের ক্যালেন্ডার খুলুন')}
                <ArrowRight size={18} />
              </a>
            ) : (
              <button className="button primary" disabled={!suggestion} onClick={create}>
                {t('Create crop calendar', 'ফসলের ক্যালেন্ডার তৈরি করুন')}
                <ArrowRight size={18} />
              </button>
            )}
          </div>
          <PlantBrowser
            key={draftKey}
            from={from}
            selected={suggestion?.crop ?? ''}
            onPick={(value) => setPicked({ key: draftKey, value })}
          />
          {error && (
            <p role="alert" className="notice-amber">
              {error}
            </p>
          )}
          <details className="card season-method" data-tour="crop-tools">
            <summary>{t('How suggestions are made', 'প্রস্তাব যেভাবে তৈরি হয়')}</summary>
            <p>
              {t(
                'NASA POWER 1991–2020 monthly climate is compared with FAO ECOCROP species requirements. Known incompatible soil and drainage categories are excluded in both directions. Annual rainfall and irrigation labels cannot establish seasonal water adequacy or drought resilience. Average-temperature matches, historical calendars and nearer planning dates determine ordering, not yield or profit.',
                'নাসা পাওয়ারের ১৯৯১–২০২০ মাসিক জলবায়ু FAO ECOCROP-এর চাহিদার সঙ্গে মেলানো হয়। জানা অমিল মাটি ও নিষ্কাশন দুই দিকেই বাদ যায়। বার্ষিক বৃষ্টি ও সেচের নাম দিয়ে মৌসুমের পানির পর্যাপ্ততা বা খরা সহনশীলতা নিশ্চিত হয় না। গড় তাপমাত্রার মিল, পুরোনো পঞ্জিকা ও পরের তারিখে ক্রম হয়; ফলন বা লাভে নয়।',
              )}
            </p>
            <p>
              {t(
                'Calendar records are historical regional observations at 0.5°, not a cultivar-specific optimum. Climate-only seasonal options retain the source range and show only a reference interval that fits monthly-normal temperatures. Daily extremes, frost and actual cultivar duration remain unverified.',
                'পঞ্জিকা ০.৫°-এর আঞ্চলিক পুরোনো তথ্য, জাতভিত্তিক সেরা দিন নয়। শুধু জলবায়ুভিত্তিক মৌসুমি বিকল্পে উৎসের সময়সীমা থাকে এবং মাসিক স্বাভাবিক তাপের মধ্যে মেলা পরিকল্পনার সময় দেখায়। দিনের চরম তাপ, তুষারপাত ও জাতের আসল সময় অযাচাইকৃত।',
              )}
            </p>
            <p>
              {t(
                'Annual rainfall is a warning check, not crop-season available water. Root-zone water, cultivar, pests, salinity, nutrients and economics need separate local checks.',
                'বার্ষিক বৃষ্টি সতর্কতার যাচাই, মৌসুমের ব্যবহারযোগ্য পানি নয়। শিকড়ের পানি, জাত, রোগ, লবণাক্ততা, পুষ্টি ও অর্থনীতি আলাদা যাচাই দরকার।',
              )}
            </p>
            {context.data?.normal && (
              <a href={context.data.normal.sourceUrl} target="_blank" rel="noreferrer">
                {t('Open original NASA climate data', 'নাসার মূল জলবায়ু তথ্য খুলুন')}
                <ExternalLink size={13} />
              </a>
            )}
          </details>
        </>
      )}
    </div>
  );
}

export function FarmsView() {
  const { t, language, tracked } = usePlanner(),
    { state, ready, saved, recovery } = useSeasonFarms(),
    router = useRouter();
  const [remove, setRemove] = useState<string | null>(null);
  const [resizing, setResizing] = useState<SeasonFarm | null>(null),
    [newArea, setNewArea] = useState(''),
    [resizeError, setResizeError] = useState('');
  const addLand = () => {
    newField();
    router.push('/farm');
  };
  const openCalendar = (farm: SeasonFarm) => {
    seasonStore.activate(farm.id);
    router.push('/plan');
  };
  return (
    <div className="season-page evidence-page">
      <header className="season-page-heading">
        <div>
          <span className="eyebrow">{t('DASHBOARD', 'ড্যাশবোর্ড')}</span>
          <h1>
            {t('My lands', 'আমার জমি')}{' '}
            <small>({state.fields?.filter((f) => !f.endDate).length ?? 0})</small>
          </h1>
          <p>
            {t(
              'Each land is divided into plots. Open a plot to enter last year’s crops, get suggestions and follow its crop calendar.',
              'প্রতিটি জমি প্লটে ভাগ করা। প্লট খুলে গত বছরের ফসল দিন, পরামর্শ নিন ও ফসলের ক্যালেন্ডার দেখুন।',
            )}
          </p>
        </div>
        {!!state.fields?.some((f) => !f.endDate) && (
          <button className="button primary" onClick={addLand} data-tour="dashboard-add-land">
            <Plus size={19} />
            {t('Add land', 'জমি যোগ করুন')}
          </button>
        )}
      </header>
      {(!saved || recovery) && (
        <p className="notice-amber" role="alert">
          {!saved
            ? t(
                'Browser storage is unavailable. Export your records before closing this tab.',
                'ব্রাউজারে সংরক্ষণ সম্ভব নয়। ট্যাব বন্ধের আগে হিসাব ডাউনলোড করুন।',
              )
            : t(
                'Some saved records could not be read. Export includes the original recovery copy; existing valid records are not replaced.',
                'কিছু হিসাব পড়া যায়নি। নামানো ফাইলে মূল ব্যাকআপ থাকবে; সঠিক আগের হিসাব বদলানো হয় না।',
              )}
        </p>
      )}
      <div data-tour="my-farms">
        {!ready ? (
          <p role="status">{t('Loading your lands…', 'আপনার জমি আনা হচ্ছে…')}</p>
        ) : (
          <FieldRegistryDashboard
            onAddLand={addLand}
            renderCrop={(farm) => {
              const crop = globalCrop(farm.selection.crop)!,
                today = localToday(farm.site.timezone),
                name = plantDisplayName(crop, language);
              return (
                <div className="plot-crop-row" key={farm.id}>
                  <Sprout size={18} aria-hidden="true" />
                  <div>
                    <strong>{name}</strong>
                    <span>
                      <CycleStatus farm={farm} today={today} />
                    </span>
                  </div>
                  <button
                    className="button primary"
                    aria-label={`${t('Open calendar', 'ক্যালেন্ডার খুলুন')}: ${name}`}
                    onClick={() => openCalendar(farm)}
                  >
                    {t('Calendar', 'ক্যালেন্ডার')}
                    <ArrowRight size={16} />
                  </button>
                  <button
                    className="icon-button season-delete"
                    aria-label={`${t('Delete crop', 'ফসল মুছুন')}: ${name}`}
                    onClick={() => setRemove(farm.id)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              );
            }}
            renderFarm={(farm) => {
              const crop = globalCrop(farm.selection.crop)!,
                today = localToday(farm.site.timezone),
                finished =
                  farm.selection.planKind !== 'perennial-review' &&
                  !!farm.harvestedDate &&
                  farm.harvestedDate <= today,
                age = farm.plantedDate
                  ? daysBetween(farm.plantedDate, finished ? farm.harvestedDate : today) + 1
                  : null;
              return (
                <article className="season-farm-tile card" key={farm.id}>
                  <FarmLandscape crop={crop.id} small />
                  <div className="season-tile-body">
                    <span className="season-source-pill">
                      <CycleStatus farm={farm} today={today} />
                    </span>
                    <h2>
                      {farm.field.name || plantDisplayName(crop, language) + t(' crop', ' ফসল')}
                    </h2>
                    <p>
                      <Sprout size={16} />
                      {plantDisplayName(crop, language)} · {farm.field.area} ha
                    </p>
                    <p>
                      <MapPin size={16} />
                      {farm.site.name}
                    </p>
                    <p>
                      {age === null ? (
                        <>
                          {t('Planned planting', 'রোপণের পরিকল্পনা')}:{' '}
                          <ShortDate value={farm.selection.start} />
                        </>
                      ) : age > 0 ? (
                        finished ? (
                          `${t('Season length', 'মৌসুমের সময়')}: ${age} ${t('days', 'দিন')}`
                        ) : (
                          `${t('Day', 'দিন')} ${age}`
                        )
                      ) : (
                        t('Planting date is ahead', 'রোপণের দিন সামনে')
                      )}
                    </p>
                    <div className="season-tile-actions">
                      <button className="button primary" onClick={() => openCalendar(farm)}>
                        {t('Open calendar', 'ক্যালেন্ডার খুলুন')}
                        <ArrowRight size={17} />
                      </button>
                      <button
                        className="icon-button season-delete"
                        aria-label={`${t('Delete crop', 'ফসল মুছুন')}: ${farm.field.name || plantDisplayName(crop, language)}`}
                        onClick={() => setRemove(farm.id)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => {
                        setResizing(farm);
                        setNewArea(String(farm.field.area));
                        setResizeError('');
                      }}
                    >
                      {t('Change crop area', 'ফসলের আয়তন বদলান')}
                    </button>
                  </div>
                </article>
              );
            }}
          />
        )}
      </div>
      <section className="card season-record-tools" data-tour="farm-export">
        <div>
          <h2>{t('Your records stay yours', 'হিসাব আপনারই থাকে')}</h2>
          <p>
            {t(
              'Saved in this browser. Download a backup to keep a copy; records do not sync between devices.',
              'এই ব্রাউজারে সংরক্ষিত। কপি রাখতে ডাউনলোড করুন; ডিভাইসের মধ্যে নিজে থেকে যায় না।',
            )}
          </p>
        </div>
        <button className="button secondary" onClick={exportRecords}>
          <Download size={17} />
          {t('Export all records', 'সব হিসাব নামান')}
        </button>
        {tracked && (
          <Link href="/records">
            {t('Open previous rotation records', 'আগের ফসলক্রমের হিসাব খুলুন')}
          </Link>
        )}
      </section>
      {remove && (
        <Dialog title={t('Delete this crop?', 'এই ফসল মুছবেন?')} onClose={() => setRemove(null)}>
          <p>
            {t(
              'This deletes only this crop’s season and notes. Your land and plots stay. Download a backup first if needed.',
              'শুধু এই ফসলের মৌসুম ও নোট মুছবে। জমি ও প্লট থাকবে। দরকার হলে আগে ডাউনলোড করুন।',
            )}
          </p>
          <div className="button-row">
            <button className="button secondary" onClick={exportRecords}>
              <Download size={17} />
              {t('Export first', 'আগে নামান')}
            </button>
            <button className="button secondary" onClick={() => setRemove(null)}>
              {t('Keep it', 'রাখুন')}
            </button>
            <button
              className="button primary"
              onClick={() => {
                seasonStore.remove(remove);
                setRemove(null);
              }}
            >
              {t('Delete this crop', 'এই ফসল মুছুন')}
            </button>
          </div>
        </Dialog>
      )}
      {resizing && (
        <Dialog
          title={t('Change crop area', 'ফসলের আয়তন বদলান')}
          onClose={() => setResizing(null)}
        >
          <form
            className="season-page"
            onSubmit={(e) => {
              e.preventDefault();
              try {
                seasonStore.resizeFarm(resizing.id, Number(newArea));
                setResizing(null);
              } catch (error) {
                setResizeError(
                  error instanceof Error ? error.message : t('Check the area.', 'আয়তন দেখুন।'),
                );
              }
            }}
          >
            <p>
              {resizing.field.name} ·{' '}
              {t('Crop dates and records stay the same.', 'ফসলের তারিখ ও হিসাব একই থাকবে।')}
            </p>
            <label>
              {t('Crop area (hectares)', 'ফসলের আয়তন (হেক্টর)')}
              <input
                type="number"
                min="0.000001"
                max="1000"
                step="any"
                value={newArea}
                required
                onChange={(e) => setNewArea(e.target.value)}
              />
            </label>
            {resizeError && <p role="alert">{resizeError}</p>}
            <div className="button-row">
              <button type="button" className="button secondary" onClick={() => setResizing(null)}>
                {t('Cancel', 'বাতিল')}
              </button>
              <button className="button primary">{t('Save crop area', 'ফসলের আয়তন রাখুন')}</button>
            </div>
          </form>
        </Dialog>
      )}
    </div>
  );
}

export function SeasonDashboard() {
  const { t, language } = usePlanner(),
    { state, ready, saved } = useSeasonFarms();
  const farm = state.farms.find((f) => f.id === state.activeId);
  if (!ready) return <p role="status">{t('Loading calendar…', 'ক্যালেন্ডার আনা হচ্ছে…')}</p>;
  if (!farm)
    return (
      <div className="season-page evidence-page" data-tour="calendar-main">
        <header className="page-header">
          <h1>{t('Crop calendar', 'ফসলের ক্যালেন্ডার')}</h1>
        </header>
        <section className="card evidence-gate">
          <h2>
            {t(
              'Choose a crop for a plot to see its calendar',
              'ক্যালেন্ডার দেখতে কোনো প্লটের জন্য ফসল বাছুন',
            )}
          </h2>
          <p>
            {t(
              'Open a plot on the dashboard and choose one crop. Its calendar, daily field checks and forecast will appear here.',
              'ড্যাশবোর্ডে একটি প্লট খুলে একটি ফসল বাছুন। ক্যালেন্ডার, প্রতিদিনের যাচাই ও পূর্বাভাস এখানে আসবে।',
            )}
          </p>
          <Link className="button primary" href="/farms">
            {t('Go to my lands', 'আমার জমিতে যান')}
            <ArrowRight size={17} />
          </Link>
        </section>
      </div>
    );
  return (
    <FarmWorkspace
      key={farm.id}
      farm={farm}
      farms={state.farms}
      saved={saved}
      language={language}
    />
  );
}
function FarmWorkspace({
  farm: storedFarm,
  farms,
  saved,
  language,
}: {
  farm: SeasonFarm;
  farms: SeasonFarm[];
  saved: boolean;
  language: 'en' | 'bn';
}) {
  const [preview, setPreview] = useState<{ farm: SeasonFarm; date: string } | null>(null);
  const farm = preview?.farm ?? storedFarm;
  const { t } = usePlanner(),
    crop = globalCrop(farm.selection.crop)!;
  const weather = useLiveWeather(farm.site),
    timezone = weather.data?.timezone || farm.site.timezone;
  const actualToday = useToday(timezone);
  const today = preview?.date ?? actualToday;
  const [selectedDay, setDay] = useState<string | null>(null),
    [selectedMonth, setMonth] = useState<string | null>(null),
    [activityError, setActivityError] = useState('');
  const day = selectedDay ?? today,
    month = selectedMonth ?? today.slice(0, 7);
  const actualStart = farm.plantedDate || farm.selection.start;
  const age = farm.plantedDate ? daysBetween(farm.plantedDate, today) + 1 : null;
  const thermal = useThermalWeather(storedFarm, actualToday);
  const estimate = estimateMaizeMaturity(
    farm,
    today,
    preview && farm.plantedDate !== storedFarm.plantedDate ? null : thermal.series,
  );
  const writeFarm: FarmRecordWriter = (id, patch) => {
    if (!preview) {
      seasonStore.update(id, patch);
      return;
    }
    if (id !== farm.id) throw Error('Choose the previewed farm.');
    const next = { ...farm, ...patch };
    if (!validSeasonState({ version: 1, farms: [next], activeId: id, confirmedKey: null }))
      throw Error('Check the activity dates and values.');
    setPreview({ ...preview, farm: next });
  };
  const chooseDay = (date: string) => {
    if (!validDate(date) || date < '1900-01-01' || date > addDays(actualToday, 730)) return;
    setDay(date);
    setMonth(date.slice(0, 7));
    if (preview) setPreview({ ...preview, date });
  };
  const actions = actionsForDay(
    farm,
    day,
    weather.error ? null : weather.data,
    day >= today ? estimate : undefined,
  );
  const timing = referenceWindow(farm);
  const first = `${month}-01`,
    weekday = (new Date(first + 'T12:00:00Z').getUTCDay() + 6) % 7;
  const count = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const changeMonth = (amount: number) => {
    const d = new Date(first + 'T12:00:00Z');
    d.setUTCMonth(d.getUTCMonth() + amount);
    setMonth(d.toISOString().slice(0, 7));
  };
  const setActivity = (kind: 'plantedDate' | 'harvestedDate', value: string) => {
    setActivityError('');
    if (value && (!validDate(value) || value > today)) {
      setActivityError(
        t(
          'Actual dates must be valid dates on or before today.',
          'আসল তারিখ আজ বা আগের সঠিক দিন হতে হবে।',
        ),
      );
      return;
    }
    const next = {
      plantedDate: farm.plantedDate,
      harvestedDate: farm.harvestedDate,
      [kind]: value,
    };
    if (next.harvestedDate && (!next.plantedDate || next.harvestedDate < next.plantedDate)) {
      setActivityError(
        t(
          'Record planting before harvest, and harvest cannot be earlier.',
          'আগে রোপণ লিখুন; কাটা তার আগে হতে পারে না।',
        ),
      );
      return;
    }
    try {
      writeFarm(farm.id, next);
    } catch {
      setActivityError(
        t(
          'This date conflicts with saved check-ins or harvest events. Correct the recorded events before changing planting.',
          'এই দিন সংরক্ষিত খবর বা তোলার ঘটনার সঙ্গে মেলেনি। রোপণ বদলানোর আগে ঘটনাগুলোর দিন ঠিক করুন।',
        ),
      );
    }
  };
  const { state: seasonState } = useSeasonFarms();
  const plotPlan =
    !!farm.rotationSeason && !!seasonState.plots?.find((p) => p.id === farm.plotId)?.plan;
  const switchLabel = plotPlan
    ? t('Switch plot', 'অন্য প্লট খুলুন')
    : t('Switch crop', 'অন্য ফসল খুলুন');
  const previewBlock = (
    <>
      <section
        className={`card calendar-preview-controls ${preview ? 'preview-active' : ''}`}
        aria-label={t('Calendar date preview', 'ক্যালেন্ডারের দিনের প্রিভিউ')}
      >
        {preview ? (
          <>
            <strong>
              {t('Preview mode', 'প্রিভিউ চলছে')} · <ShortDate value={today} />
            </strong>
            <p>
              {t(
                'Changes here are temporary. Your saved crops are unchanged.',
                'এখানকার পরিবর্তন সাময়িক। সংরক্ষিত ফসল বদলাবে না।',
              )}
            </p>
            <label>
              {t('Preview date', 'প্রিভিউর দিন')}
              <input
                type="date"
                aria-label={t('Preview date', 'প্রিভিউর দিন')}
                min="1900-01-01"
                max={addDays(actualToday, 730)}
                value={today}
                onChange={(e) => chooseDay(e.target.value)}
              />
            </label>
            <button
              className="button secondary"
              disabled={today <= '1900-01-01'}
              onClick={() => chooseDay(addDays(today, -1))}
            >
              {t('Previous preview day', 'আগের প্রিভিউ দিন')}
            </button>
            <button
              className="button primary"
              disabled={today >= addDays(actualToday, 730)}
              onClick={() => chooseDay(addDays(today, 1))}
            >
              {t('Next preview day', 'পরের প্রিভিউ দিন')}
            </button>
            <button
              className="button secondary"
              onClick={() => {
                setPreview(null);
                setDay(null);
                setMonth(null);
              }}
            >
              {t('Finish preview', 'প্রিভিউ শেষ করুন')}
            </button>
          </>
        ) : (
          <>
            <p>
              {t(
                'Move through the calendar to review the growing period and daily work.',
                'ক্যালেন্ডারে এগিয়ে চাষের সময় ও প্রতিদিনের কাজ দেখুন।',
              )}
            </p>
            <button
              className="button secondary"
              onClick={() => {
                const date = day;
                setPreview({ farm: structuredClone(storedFarm), date });
                setDay(date);
                setMonth(date.slice(0, 7));
              }}
            >
              {t('Preview another day', 'অন্য দিনের প্রিভিউ')}
            </button>
          </>
        )}
      </section>
    </>
  );
  const savedNotice = (
    <>
      {!saved && (
        <p className="notice-amber" role="alert">
          {t(
            'Not saved to browser storage. Export before closing.',
            'ব্রাউজারে রাখা যায়নি। বন্ধের আগে হিসাব নামান।',
          )}
        </p>
      )}
    </>
  );
  const heroBlock = (
    <>
      <section className="season-farm-hero" data-tour="calendar-main">
        <FarmLandscape crop={crop.id} />
        <div className="season-hero-info">
          <span className="eyebrow">
            {farm.selection.planKind === 'perennial-review'
              ? t('YOUR PERENNIAL CARE PLAN', 'আপনার বহুবর্ষজীবী পরিচর্যা')
              : t('YOUR SINGLE-SEASON FARM', 'আপনার এক মৌসুমের খামার')}
          </span>
          <h2>{plantDisplayName(crop, language)}</h2>
          <p>
            <CycleStatus farm={farm} today={today} />
          </p>
          {age !== null &&
            age > 0 &&
            (!farm.harvestedDate || farm.selection.planKind === 'perennial-review') && (
              <p>{`${t('Day', 'দিন')} ${age} ${t('since planting', 'রোপণের পরে')}`}</p>
            )}
          <div className="season-hero-facts">
            <span>
              <CalendarDays size={18} />
              {t('Planned start', 'শুরুর পরিকল্পনা')}
              <strong>
                <ShortDate value={farm.selection.start} />
              </strong>
            </span>
            <span>
              <Leaf size={18} />
              {farm.selection.planKind === 'perennial-review'
                ? t('Care review horizon', 'পরিচর্যা পর্যালোচনার সময়')
                : t('Indicative duration', 'আনুমানিক সময়')}
              <strong>
                {timing.cultivar
                  ? `${timing.cultivar.durationMin}–${timing.cultivar.durationMax}`
                  : farm.selection.durationMin === farm.selection.durationMax
                    ? farm.selection.durationMax
                    : `${farm.selection.durationMin}–${farm.selection.durationMax}`}{' '}
                {t('days', 'দিন')}
              </strong>
            </span>
          </div>
          {farm.selection.planKind === 'perennial-review' && (
            <p className="season-crop-caution">
              {t(
                'Keep this perennial planting active through repeated harvests. Review its care after one year.',
                'বারবার ফল তোলার পরেও বহুবর্ষজীবী চাষ চালু থাকবে। এক বছর পরে পরিচর্যা পর্যালোচনা করুন।',
              )}
            </p>
          )}
        </div>
      </section>
    </>
  );
  const progressBlock = (
    <>
      <SeasonProgress
        farm={farm}
        today={today}
        estimate={estimate}
        onCheckIn={() => {
          setDay(null);
          setMonth(null);
        }}
      />
    </>
  );
  const workBlock = (
    <>
      <div className="season-work-grid">
        <section className="card season-calendar" data-tour="calendar-dates">
          <div className="season-section-heading">
            <h2>
              <CalendarDays size={21} />
              {t('Crop calendar', 'ফসলের ক্যালেন্ডার')}
            </h2>
            <div className="season-month-nav">
              <button aria-label={t('Previous month', 'আগের মাস')} onClick={() => changeMonth(-1)}>
                <ArrowLeft size={18} />
              </button>
              <strong>
                {new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en-GB', {
                  month: 'long',
                  year: 'numeric',
                  timeZone: 'UTC',
                }).format(new Date(first + 'T12:00:00Z'))}
              </strong>
              <button aria-label={t('Next month', 'পরের মাস')} onClick={() => changeMonth(1)}>
                <ArrowRight size={18} />
              </button>
            </div>
          </div>
          <div
            className="season-calendar-grid"
            data-tour="one-season-dates"
            role="group"
            aria-label={t('Choose a calendar day', 'ক্যালেন্ডারের দিন বাছুন')}
          >
            {(language === 'bn'
              ? ['সোম', 'মঙ্গল', 'বুধ', 'বৃহ', 'শুক্র', 'শনি', 'রবি']
              : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            ).map((d) => (
              <span className="calendar-weekday" key={d}>
                {d}
              </span>
            ))}
            {Array.from({ length: weekday }, (_, i) => (
              <span key={`empty-${i}`} />
            ))}
            {Array.from({ length: count }, (_, i) => {
              const date = `${month}-${String(i + 1).padStart(2, '0')}`,
                forecast =
                  weather.error || !weather.data || !weatherIsRecent(weather.data)
                    ? undefined
                    : weather.data?.days.find((d) => d.date === date);
              const planted = date === farm.plantedDate,
                planned = !farm.plantedDate && date === farm.selection.start;
              const { growing, scheduled, extended } = farmCalendarDay(farm, date, today);
              const reference = date >= timing.early && date <= timing.late;
              const harvested = date === farm.harvestedDate;
              const projected = date === estimate.projectedDate;
              return (
                <button
                  key={date}
                  className={`${day === date ? 'selected' : ''} ${date === today ? 'today' : ''} ${planted || planned ? 'planting' : ''} ${growing ? 'growing-day' : ''} ${scheduled ? 'scheduled-day' : ''} ${extended ? 'extended-day' : ''} ${reference ? 'reference-day' : ''} ${harvested ? 'harvested-day' : ''} ${projected ? 'projected-day' : ''}`}
                  data-growing-period={scheduled || growing}
                  aria-pressed={day === date}
                  aria-label={`${date}${date === today ? t(' · Today', ' · আজ') : ''}${planted ? t(' · Actual planting', ' · আসল রোপণ') : planned ? t(' · Planned planting', ' · পরিকল্পিত রোপণ') : ''}${reference ? t(' · Reference window, not confirmed maturity', ' · উৎসের সময়, পরিপক্বতা নিশ্চিত নয়') : ''}${extended ? t(' · Continuing beyond reference', ' · উৎসের সময়ের পরেও চলছে') : ''}${harvested ? t(' · Actual harvest recorded', ' · আসল তোলা লেখা আছে') : ''}${projected ? t(' · Forecast heat-threshold projection', ' · পূর্বাভাসে তাপের সীমার হিসাব') : ''}`}
                  onClick={() => chooseDay(date)}
                >
                  <span>{i + 1}</span>
                  {(planted || planned) && <Sprout size={13} />}
                  {(harvested || projected) && (
                    <span className="season-calendar-event" aria-hidden="true">
                      {harvested ? '✓' : '≈'}
                    </span>
                  )}
                  <small>
                    {forecast?.rain === null || forecast?.rain === undefined
                      ? ''
                      : `${forecast.rain.toFixed(1)} mm`}
                  </small>
                </button>
              );
            })}
          </div>
          <div className="season-calendar-legend">
            <span>
              <i className="scheduled-key" />
              {t('Growing period', 'চাষের সময়')}
            </span>
            <span>
              <i />
              {t('Selected day', 'বাছা দিন')}
            </span>
            <span>
              <Sprout size={14} />
              {t('Planting', 'রোপণ')}
            </span>
            <span>{t('Rain figures = forecast', 'বৃষ্টির সংখ্যা = পূর্বাভাস')}</span>
            <span>
              <i className="reference-key" />
              {t('Dotted outline = reference window', 'বিন্দুর রেখা = উৎসের সময়')}
            </span>
            <span>
              <i className="extended-key" />
              {t('Amber = continuing beyond reference', 'হলুদ = উৎসের সময় পেরিয়েও চলছে')}
            </span>
            <span>
              {t('✓ Actual harvest · ≈ heat projection', '✓ আসল তোলা · ≈ তাপের পূর্বানুমান')}
            </span>
          </div>
          <div className="button-row calendar-day-nav">
            <button className="button secondary" onClick={() => chooseDay(addDays(day, -1))}>
              {t('Previous day', 'আগের দিন')}
            </button>
            <ShortDate value={day} />
            <button className="button secondary" onClick={() => chooseDay(addDays(day, 1))}>
              {t('Next day', 'পরের দিন')}
            </button>
            <button className="text-button" onClick={() => chooseDay(actualStart)}>
              {t('Go to planting', 'রোপণের দিনে যান')}
            </button>
            <button className="text-button" onClick={() => chooseDay(timing.late)}>
              {t('Go to estimated end', 'আনুমানিক শেষ দিনে যান')}
            </button>
          </div>
          <button
            className="text-button"
            onClick={() => {
              if (preview) chooseDay(actualToday);
              else {
                setDay(null);
                setMonth(null);
              }
            }}
          >
            {t('Back to today', 'আজকে ফিরুন')}
          </button>
        </section>
        <section className="card season-daily" data-tour="daily-actions">
          <div className="season-section-heading">
            <h2>
              {day === today
                ? t('Today’s farm guidance', 'আজকের চাষের নির্দেশনা')
                : t('Farm guidance for this day', 'এই দিনের চাষের নির্দেশনা')}
            </h2>
            <ShortDate value={day} />
          </div>
          {(!weather.data ||
            weather.error ||
            !weatherIsRecent(weather.data) ||
            !weather.data.days.some((d) => d.date === day)) && (
            <p className="season-small-note">
              {t(
                'No current forecast is available for this date.',
                'এই তারিখের বর্তমান পূর্বাভাস নেই।',
              )}
            </p>
          )}
          <ul className="season-task-list">
            {actions.map((action) => {
              const copy = actionCopy(action, language);
              return (
                <li key={action.id}>
                  <div className="season-guidance-copy">
                    <strong>{copy.title}</strong>
                    <p>{copy.detail}</p>
                  </div>
                  {action.id === 'record-planting' && (
                    <button
                      className="button secondary"
                      disabled={day > today}
                      onClick={() => setActivity('plantedDate', day)}
                    >
                      {t('I planted on this day', 'এই দিনে রোপণ করেছি')}
                    </button>
                  )}
                  <a href={action.source} target="_blank" rel="noreferrer">
                    {t('Source', 'উৎস')}
                    <ExternalLink size={12} />
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
  const weatherBlock = (
    <>
      <section className="card" data-tour="track-weather">
        <WeatherContent site={farm.site} result={weather} />
      </section>
    </>
  );
  const waterBlock = (
    <>
      <WaterBudgetPanel
        key={`${farm.id}:${day}`}
        farm={farm}
        date={day}
        today={today}
        weather={weather.error ? null : weather.data}
      />
    </>
  );
  const cultivarBlock = (
    <>
      <CultivarReferencePanel key={`cultivar:${farm.id}`} farm={farm} />
    </>
  );
  const soilBlock = (
    <>
      <section className="card">
        <h2>
          <FlaskConical size={21} />
          {t('Soil pH', 'মাটির pH')}
        </h2>
        <SoilReferencePanel site={farm.site} />
        <SoilEvidenceForm
          key={`${farm.id}:${JSON.stringify(farm.field.soilEvidence)}`}
          value={farm.field.soilEvidence}
          today={today}
          onSave={(soilEvidence) => writeFarm(farm.id, { field: { ...farm.field, soilEvidence } })}
        />
      </section>
    </>
  );
  const notesBlock = (
    <>
      <section
        id="farm-daily-update"
        className="card season-observations"
        data-tour="track-records"
      >
        <div className="season-section-heading">
          <h2>{t('What actually happened?', 'বাস্তবে কী হয়েছে?')}</h2>
          <span className="season-source-pill">
            {t('Saved automatically', 'নিজে থেকে সংরক্ষিত')}
          </span>
        </div>
        <div className="season-form-grid">
          <label>
            {t('Actual planting date', 'আসল রোপণের দিন')}
            <input
              type="date"
              aria-label={t('Actual planting date', 'আসল রোপণের দিন')}
              max={today}
              value={farm.plantedDate}
              onChange={(e) => setActivity('plantedDate', e.target.value)}
            />
            <small>
              {t(
                'For transplanted crops, record the main-field transplanting date.',
                'চারা রোপণের ফসলে মূল জমিতে রোপণের দিন লিখুন।',
              )}
            </small>
          </label>
          <label>
            {t('Actual harvest date', 'আসল ফসল কাটার দিন')}
            <input
              type="date"
              aria-label={t('Actual harvest date', 'আসল ফসল কাটার দিন')}
              min={farm.plantedDate || undefined}
              max={today}
              value={farm.harvestedDate}
              onChange={(e) => setActivity('harvestedDate', e.target.value)}
            />
            <small>
              {farm.selection.planKind === 'perennial-review'
                ? t(
                    'Records this harvest; perennial care continues.',
                    'এই দফার তোলা রাখে; বহুবর্ষজীবী পরিচর্যা চলবে।',
                  )
                : t(
                    'Final harvest only: this completes the season. Record partial pickings in the daily field update. Clear an accidental final date to resume tracking.',
                    'শুধু শেষ তোলা: এতে মৌসুম শেষ হয়। আংশিক তোলা দিনের খবরে লিখুন। ভুল শেষ তারিখ মুছলে আবার হিসাব চলবে।',
                  )}
            </small>
          </label>
        </div>
        {activityError && (
          <p role="alert" className="notice-amber">
            {activityError}
          </p>
        )}
        <label>
          {t('Field notes', 'জমির নোট')}
          <textarea
            aria-label={t('Field notes', 'জমির নোট')}
            maxLength={10000}
            value={farm.notes}
            rows={3}
            onChange={(e) => writeFarm(farm.id, { notes: e.target.value })}
            placeholder={t(
              'Describe the crop, soil, water or work you observed.',
              'ফসল, মাটি, পানি বা দেখা কাজ লিখুন।',
            )}
          />
        </label>
        <DailyCheckInForm
          key={`${farm.id}-${day}`}
          farm={farm}
          day={day}
          today={today}
          onNextDay={() => {
            const next = addDays(day, 1);
            chooseDay(next);
            document.querySelector('[data-tour="daily-actions"]')?.scrollIntoView({
              behavior:
                window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
                document.documentElement.dataset.motion === 'off'
                  ? 'instant'
                  : 'smooth',
              block: 'start',
            });
          }}
        />
        {!!farm.observations.length && (
          <details>
            <summary>{t('Earlier stage observations', 'আগের পর্যায়ের পর্যবেক্ষণ')}</summary>
            <p>
              {t(
                'Use the daily field update above. Earlier observations remain below; a legacy “Harvested” note alone does not confirm final harvest.',
                'উপরের দিনের খবর ব্যবহার করুন। আগের পর্যবেক্ষণ নিচে আছে; পুরোনো “তোলা হয়েছে” নোট একা শেষ তোলা নিশ্চিত করে না।',
              )}
            </p>
            {farm.observations
              .slice(-5)
              .reverse()
              .map((o, i) => (
                <p key={`${o.date}-${i}`}>
                  <ShortDate value={o.date} /> · {stageLabel(o.stage, language)} · {o.note}
                </p>
              ))}
          </details>
        )}
      </section>
    </>
  );
  const thermalBlock = (
    <>
      <ThermalModelSettings
        key={farm.id}
        farm={farm}
        series={thermal.series}
        error={thermal.error}
      />
    </>
  );
  const methodBlock = (
    <>
      <details className="card season-method" data-tour="nasa-seasonal">
        <summary>
          {t('This land’s climate, source dates & methods', 'এই জমির জলবায়ু, উৎসের দিন ও পদ্ধতি')}
        </summary>
        <p>
          {t(
            'Planned dates are references. Actual planting starts the day counter; it does not turn a broad source growing-period range into a cultivar-specific harvest forecast.',
            'পরিকল্পিত দিন তথ্যসূত্র। আসল রোপণ থেকে দিনের গণনা শুরু; উৎসের সময়সীমা নির্দিষ্ট জাতের কাটার পূর্বাভাস হয়ে যায় না।',
          )}
        </p>
        <p>
          {farm.selection.planKind === 'perennial-review'
            ? t('Care review date', 'পরিচর্যা পর্যালোচনার দিন')
            : t('Indicative planning end', 'পরিকল্পনার আনুমানিক শেষ')}
          : <ShortDate value={addDays(actualStart, farm.selection.durationMin - 1)} />
          {farm.selection.durationMax !== farm.selection.durationMin && (
            <>
              {' '}
              — <ShortDate value={addDays(actualStart, farm.selection.durationMax - 1)} />
            </>
          )}
        </p>
        <p>
          {t(
            'NASA 1991–2020 climate baseline · annual rain',
            'নাসার ১৯৯১–২০২০ জলবায়ু · বার্ষিক বৃষ্টি',
          )}
          : {farm.context.normal?.annualRain.toFixed(0)} mm
        </p>
        <ul>
          {farm.selection.reasons.map((r) => (
            <li key={r}>{r}</li>
          ))}
          {farm.selection.cautions.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
        {farm.context.normal && (
          <a href={farm.context.normal.sourceUrl} target="_blank" rel="noreferrer">
            NASA POWER original data <ExternalLink size={12} />
          </a>
        )}
        <p>
          <a href="https://gaez.fao.org/pages/ecocrop" target="_blank" rel="noreferrer">
            FAO ECOCROP
          </a>{' '}
          ·{' '}
          <a
            href="https://sage.nelson.wisc.edu/data-and-models/datasets/crop-calendar-dataset/"
            target="_blank"
            rel="noreferrer"
          >
            Sacks et al. (2010) calendar methods
          </a>
        </p>
      </details>
    </>
  );
  const toolsBlock = (
    <>
      <div className="season-record-tools">
        <Link className="button secondary" href="/farms">
          <Plus size={17} />
          {t('Back to my lands & plots', 'আমার জমি ও প্লটে ফিরুন')}
        </Link>
        <button className="button secondary" onClick={exportRecords}>
          <Download size={17} />
          {t('Export all records', 'সব হিসাব নামান')}
        </button>
      </div>
    </>
  );
  return (
    <FarmRecordScope key={preview ? 'preview' : 'recorded'} write={writeFarm}>
      <div className="season-page season-workspace" data-preview={preview !== null}>
        <header className="season-page-heading">
          <div>
            <Link href="/farms" className="season-back">
              <ArrowLeft size={15} />
              {t('All my lands', 'আমার সব জমি')}
            </Link>
            <h1>{farm.field.name || plantDisplayName(crop, language) + t(' crop', ' ফসল')}</h1>
            <p>
              <MapPin size={16} />
              {farm.site.name} · {farm.field.area} ha
            </p>
          </div>
          <label className="season-farm-switch">
            {switchLabel}
            <select
              aria-label={switchLabel}
              value={farm.id}
              onChange={(e) => seasonStore.activate(e.target.value)}
            >
              {farms.map((f) => (
                <option value={f.id} key={f.id}>
                  {f.field.name || plantDisplayName(globalCrop(f.selection.crop)!, language)}
                </option>
              ))}
            </select>
          </label>
        </header>
        {plotPlan ? (
          <>
            {savedNotice}
            <RotationCalendar
              farm={farm}
              today={today}
              weather={weather.error ? null : (weather.data ?? null)}
            />
          </>
        ) : (
          <>
            {previewBlock}
            {savedNotice}
            {heroBlock}
            {progressBlock}
            {workBlock}
            {weatherBlock}
            {waterBlock}
            {cultivarBlock}
            {soilBlock}
            {notesBlock}
            {thermalBlock}
            {methodBlock}
          </>
        )}
        {toolsBlock}
      </div>
    </FarmRecordScope>
  );
}
