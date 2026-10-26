'use client';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { ArrowRight, RotateCcw, X } from 'lucide-react';
import { usePlanner } from './legacy-planner-provider';
import { HouseholdControl, WaterControl, PriorityControl } from './farm-controls';
import { months, previewData } from '../data/preview';
import type { CropId, Farm } from '../domain/types';
import { FarmLocation } from './farm-location';
import { climateMatchesSite, siteFor } from '../data/demo-environment';
import { inPilotRegion } from '../domain/farm-site';
import { Dialog } from './dialog';
import { ResetDataControl } from './reset-data-control';
import { ActionBar } from './ui/action-bar';

function AreaInput() {
  const { t, farm, setFarm } = usePlanner();
  const [draft, setDraft] = useState<string | null>(null);
  const value = draft ?? String(farm.area);
  const valid = Number.isFinite(Number(value)) && Number(value) > 0 && Number(value) <= 1000;
  return (
    <label className="form-field">
      {t('Field area (hectares)', 'জমির আয়তন (হেক্টর)')}
      <input
        type="number"
        min="0.01"
        max="1000"
        step="0.01"
        value={value}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (valid) {
            setFarm({ area: Number(value) });
            setDraft(null);
          }
        }}
        aria-invalid={!valid}
        aria-describedby={!valid ? 'area-error' : undefined}
      />
      {!valid && (
        <span id="area-error" className="field-error">
          {t(
            'Enter an area above 0 and up to 1,000 ha. Your previous area is kept until valid.',
            '০-এর বেশি ও ১,০০০ হেক্টর পর্যন্ত দিন। সঠিক না হওয়া পর্যন্ত আগের আয়তন থাকবে।',
          )}
        </span>
      )}
    </label>
  );
}
import { farmFingerprint } from '../domain/demo-planner';
export function FarmView() {
  const { resetEpoch } = usePlanner();
  return <FarmForm key={resetEpoch} />;
}

function FarmForm() {
  const { t, language, farm, setFarm, demo, setDemo, priority, setJourney, reviewed } =
    usePlanner();
  const router = useRouter();
  const locationUnsupported = !inPilotRegion(siteFor(demo));
  const locationPending = !locationUnsupported && !climateMatchesSite(demo);
  const missing =
    farm.irrigation === 'unknown' || farm.soil === 'unknown' || farm.drainage === 'unknown';
  const toggleMonth = (month: number) =>
    setFarm({
      unavailableMonths: farm.unavailableMonths.includes(month)
        ? farm.unavailableMonths.filter((m) => m !== month)
        : [...farm.unavailableMonths, month],
    });
  const previous = [...new Set(farm.current.filter((p) => p.crop !== 'fallow').map((p) => p.crop))];
  const [previousCrop, setPreviousCrop] = useState<CropId>('mung');
  const [clearHistory, setClearHistory] = useState(false);
  const addPreviousRef = useRef<HTMLButtonElement>(null);
  const changePrevious = (ids: CropId[]) =>
    setFarm({
      current: ids.length
        ? ids.map((crop, start) => ({ crop, start, duration: 1 }))
        : [{ crop: 'fallow', start: 0, duration: 12 }],
    });
  return (
    <div className="page farm-page">
      <header className="page-header planner-heading">
        <div>
          <h1>{t('Start with your farm', 'আপনার জমি দিয়ে শুরু করুন')}</h1>
          <p>
            {t(
              'Tell us about your soil and water. Edit the example values to describe your field before continuing.',
              'মাটি ও পানির তথ্য দিন। পরের ধাপে যাওয়ার আগে উদাহরণের তথ্য নিজের জমি অনুযায়ী বদলান।',
            )}
          </p>
        </div>
        <div className="page-header-actions">
          <ResetDataControl />
        </div>
      </header>
      <FarmLocation />
      <section className="card form-card" data-tour="farm-basics">
        <h2>{t('Your field', 'আপনার জমি')}</h2>
        <div className="form-grid">
          <label className="form-field">
            {t('Farm name', 'জমির নাম')}
            <input
              maxLength={80}
              value={farm.name}
              onChange={(e) => setFarm({ name: e.target.value })}
            />
          </label>
          <AreaInput />
        </div>
      </section>
      <section className="card visible-farm-section" data-tour="farm-history">
        <h2>{t('Previous crops · optional', 'আগের ফসল · ঐচ্ছিক')}</h2>
        <section>
          <p>
            {t(
              'Choose crops you have grown before. This records familiarity, not a planting calendar.',
              'আগে চাষ করা ফসল বাছুন। এটি পরিচিতির তথ্য; রোপণের ক্যালেন্ডার নয়।',
            )}
          </p>
          <ul className="demo-preferences">
            {previous.map((id) => (
              <li key={id}>
                <span>{previewData.crops[id].name[language]}</span>
                <button
                  type="button"
                  className="previous-crop-remove"
                  aria-label={`${t('Remove previous crop', 'আগের ফসল বাদ দিন')}: ${previewData.crops[id].name[language]}`}
                  title={`${t('Remove previous crop', 'আগের ফসল বাদ দিন')}: ${previewData.crops[id].name[language]}`}
                  onClick={() => changePrevious(previous.filter((p) => p !== id))}
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
          {!previous.length && (
            <p role="status">{t('No previous crops recorded.', 'আগের কোনো ফসল লেখা নেই।')}</p>
          )}
          <label>
            {t('Previous crop to add', 'আগের ফসল যোগ করুন')}
            <select
              value={previousCrop}
              onChange={(e) => setPreviousCrop(e.target.value as CropId)}
            >
              {Object.values(previewData.crops)
                .filter((c) => c.id !== 'fallow')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name[language]}
                  </option>
                ))}
            </select>
          </label>
          <div className="previous-crop-actions">
            <button
              ref={addPreviousRef}
              type="button"
              className="button secondary previous-crop-add"
              disabled={previous.includes(previousCrop) || previous.length >= 12}
              onClick={() => changePrevious([...previous, previousCrop])}
            >
              {t('Add previous crop', 'আগের ফসল যোগ করুন')}
            </button>
            <button
              type="button"
              className="button secondary"
              disabled={!previous.length}
              onClick={() => setClearHistory(true)}
            >
              <RotateCcw size={18} aria-hidden="true" />
              {t('Reset previous crops', 'আগের ফসল রিসেট করুন')}
            </button>
          </div>
        </section>
      </section>

      <section className="card form-card" data-tour="farm-water-soil">
        <h2>{t('Water & soil', 'পানি ও মাটি')}</h2>
        <div className="form-grid soil-fields" data-tour="farm-soil">
          <label className="form-field">
            {t('Soil texture', 'মাটির গঠন')}
            <select
              value={farm.soil}
              onChange={(e) => setFarm({ soil: e.target.value as Farm['soil'] })}
            >
              <option value="loam">{t('Loam', 'দোআঁশ')}</option>
              <option value="clay">{t('Clay', 'এঁটেল')}</option>
              <option value="sandy">{t('Sandy', 'বেলে')}</option>
              <option value="unknown">{t('Not sure', 'জানা নেই')}</option>
            </select>
          </label>
          <label className="form-field">
            {t('Drainage', 'পানি নিষ্কাশন')}
            <select
              value={farm.drainage}
              onChange={(e) => setFarm({ drainage: e.target.value as Farm['drainage'] })}
            >
              <option value="good">{t('Drains well', 'ভালো নিষ্কাশন')}</option>
              <option value="poor">{t('Water collects', 'পানি জমে থাকে')}</option>
              <option value="unknown">{t('Not sure', 'জানা নেই')}</option>
            </select>
          </label>
        </div>
        <WaterControl />
      </section>
      <div className="farm-optional">
        <section className="card visible-farm-section">
          <h2>{t('Your priorities, household & help', 'অগ্রাধিকার, পরিবার ও শ্রম')}</h2>
          <section className="form-card">
            <PriorityControl />
            <HouseholdControl />
            <fieldset className="labor-control">
              <legend>
                {t('Months without planting or harvest help', 'রোপণ বা কাটার শ্রম না থাকার মাস')}
              </legend>
              <p>
                {t(
                  'Optional. Leave empty when there is no restriction.',
                  'ঐচ্ছিক। শর্ত না থাকলে ফাঁকা রাখুন।',
                )}
              </p>
              <div className="labor-months">
                {months[language].map((m, i) => (
                  <label key={m} className={farm.unavailableMonths.includes(i) ? 'chosen' : ''}>
                    <input
                      type="checkbox"
                      checked={farm.unavailableMonths.includes(i)}
                      onChange={() => toggleMonth(i)}
                    />
                    <span>{m}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </section>
        </section>
      </div>
      <ActionBar
        sticky
        tour="farm-continue"
        className="farm-bottom-cta"
        status={
          locationUnsupported ? (
            <p role="status">
              {t(
                'Weather works worldwide. Local crop-calendar rules are not available for this region yet.',
                'বিশ্বের আবহাওয়া দেখা যায়। এই অঞ্চলের স্থানীয় ফসলের সময়ের নিয়ম এখনো নেই।',
              )}
            </p>
          ) : locationPending ? (
            <p role="status">
              {t(
                'Waiting for matching NASA seasonal context. Current weather alone cannot establish crop suitability.',
                'স্থান অনুযায়ী নাসার মৌসুমি তথ্যের অপেক্ষা। শুধু এখনকার আবহাওয়া দিয়ে ফসলের উপযোগিতা নিশ্চিত হয় না।',
              )}
            </p>
          ) : missing ? (
            <p>
              {t(
                'Confirm soil, drainage and irrigation to receive suggestions. Unknown values are never guessed.',
                'ফসলের প্রস্তাব পেতে মাটি, নিষ্কাশন ও সেচ নিশ্চিত করুন। অজানা তথ্য অনুমান করা হয় না।',
              )}
            </p>
          ) : (
            <p>
              {t(
                'Soil, drainage and water recorded. Next: choose crops.',
                'মাটি, নিষ্কাশন ও সেচ লেখা হয়েছে। এরপর ফসল বাছুন।',
              )}
            </p>
          )
        }
      >
        <button
          className="button primary"
          disabled={missing || locationUnsupported || locationPending}
          onClick={() => {
            const invalid = document.querySelector<HTMLElement>('main [aria-invalid="true"]');
            if (invalid) {
              invalid.focus();
              return;
            }
            if (!reviewed) setDemo({ preferred: [], enabled: false });
            setJourney({ reviewed: farmFingerprint(farm, demo, priority), generatedFor: null });
            router.push('/crops');
          }}
        >
          {t('See suggested crops', 'প্রস্তাবিত ফসল দেখুন')}
          <ArrowRight size={20} />
        </button>
      </ActionBar>
      {clearHistory && (
        <Dialog
          title={t('Clear all previous crops?', 'আগের সব ফসল মুছবেন?')}
          onClose={() => setClearHistory(false)}
        >
          <p>
            {t(
              'This clears the previous-crop list for this farm. Review your farm before generating new suggestions. Your saved calendar and tracking records are kept.',
              'এই জমির আগের ফসলের তালিকা মুছে যাবে। নতুন প্রস্তাব তৈরির আগে জমির তথ্য দেখুন। রাখা ক্যালেন্ডার ও কাজের হিসাব থাকবে।',
            )}
          </p>
          <div className="button-row previous-crop-actions">
            <button className="button secondary" onClick={() => setClearHistory(false)}>
              {t('Keep previous crops', 'আগের ফসল রাখুন')}
            </button>
            <button
              className="button primary"
              onClick={() => {
                changePrevious([]);
                setClearHistory(false);
                requestAnimationFrame(() => addPreviousRef.current?.focus());
              }}
            >
              {t('Clear previous crops', 'আগের ফসল মুছুন')}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
