'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, ChevronDown, MapPin, Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { usePlanner } from './planner-provider';
import { HouseholdControl, WaterControl } from './farm-controls';
import { CalendarLegend, CalendarScrollHint, MonthHeader, Status, Timeline } from './calendar';
import { months, previewData } from '../data/preview';
import type { CropId, Farm } from '../domain/types';

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
export function FarmView() {
  const { t, language, farm, setFarm, evaluations } = usePlanner();
  const [editCalendar, setEditCalendar] = useState(false);
  const current = evaluations[0];
  const toggleMonth = (month: number) =>
    setFarm({
      unavailableMonths: farm.unavailableMonths.includes(month)
        ? farm.unavailableMonths.filter((m) => m !== month)
        : [...farm.unavailableMonths, month],
    });
  const changePeriod = (index: number, update: Partial<Farm['current'][number]>) =>
    setFarm({ current: farm.current.map((p, i) => (i === index ? { ...p, ...update } : p)) });
  return (
    <div className="page-enter calm-page farm-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {t('01 / START WITH YOUR FIELD', '০১ / আপনার জমি থেকে শুরু')}
          </span>
          <h1>{t('Every farm has a story.', 'প্রতি খামারের একটা গল্প আছে।')}</h1>
          <p>
            {t(
              'Tell us what yours needs. It’s okay to say “not sure”.',
              'আপনার খামারের প্রয়োজন জানান। জানা না থাকলে সেটিও বলতে পারেন।',
            )}
          </p>
        </div>
        <Link href="/" className="button primary">
          {t('Compare my options', 'বিকল্প তুলনা করুন')}
          <ArrowRight size={16} />
        </Link>
      </div>
      <div className="farm-layout">
        <div className="farm-form">
          <section className="form-card" data-tour="farm-basics">
            <div className="card-title">
              <span className="step-dot">01</span>
              <div>
                <h2>{t('The basics', 'প্রাথমিক তথ্য')}</h2>
                <p>
                  {t(
                    'A fictional farm to explore. Make it yours.',
                    'দেখে শেখার জন্য কাল্পনিক খামার। নিজের মতো বদলান।',
                  )}
                </p>
              </div>
            </div>
            <div className="form-grid">
              <label className="form-field">
                {t('Farm name', 'খামারের নাম')}
                <input
                  maxLength={80}
                  value={farm.name}
                  placeholder={t('Give your farm a name', 'খামারের নাম দিন')}
                  onChange={(e) => setFarm({ name: e.target.value })}
                />
              </label>
              <AreaInput />
            </div>
            <div className="locality-note">
              <MapPin size={15} />
              {t('Rajshahi, Bangladesh · preview locality', 'রাজশাহী, বাংলাদেশ · নমুনার এলাকা')}
            </div>
          </section>
          <section className="form-card">
            <div className="card-title">
              <span className="step-dot">02</span>
              <div>
                <h2>{t('Water & soil', 'সেচ ও মাটি')}</h2>
                <p>
                  {t(
                    'A rotation should fit the field you have.',
                    'ফসলক্রম আপনার জমির সঙ্গে মানানসই হওয়া দরকার।',
                  )}
                </p>
              </div>
            </div>
            <WaterControl />
            <details className="disclosure nested-disclosure">
              <summary>{t('Soil & drainage information', 'মাটি ও নিষ্কাশনের তথ্য')}</summary>
              <div className="form-grid soil-fields">
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
              <p className="field-help">
                {t(
                  'Soil is recorded for future integration. Crop-specific soil suitability is not checked yet.',
                  'ভবিষ্যতের জন্য মাটির তথ্য রাখা হচ্ছে। ফসলভিত্তিক উপযোগিতা এখনো যাচাই হয়নি।',
                )}
              </p>
            </details>
          </section>
          <details className="disclosure">
            <summary>{t('Family crops & available help', 'পরিবারের ফসল ও শ্রমের সুযোগ')}</summary>
            <section className="form-card">
              <div className="card-title">
                <span className="step-dot">03</span>
                <div>
                  <h2>{t('People behind the field', 'জমির পেছনের মানুষ')}</h2>
                  <p>
                    {t(
                      'Family needs and available help matter, too.',
                      'পরিবারের প্রয়োজন ও শ্রমের সুযোগও জরুরি।',
                    )}
                  </p>
                </div>
              </div>
              <HouseholdControl />
              <div className="panel-divider" />
              <fieldset className="labor-control">
                <legend>
                  {t('Months without planting or harvest help', 'রোপণ বা কাটার শ্রম না থাকার মাস')}
                </legend>
                <p className="field-help">
                  {t(
                    'Tap months when labor is unavailable. Leave empty if you have no restriction.',
                    'যে মাসে শ্রম নেই তা বাছুন। শর্ত না থাকলে ফাঁকা রাখুন।',
                  )}
                </p>
                <div className="labor-months">
                  {months[language].map((m, index) => (
                    <label
                      key={m}
                      className={farm.unavailableMonths.includes(index) ? 'chosen' : ''}
                    >
                      <input
                        type="checkbox"
                        checked={farm.unavailableMonths.includes(index)}
                        onChange={() => toggleMonth(index)}
                      />
                      <span>{m}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
            </section>
          </details>
        </div>
      </div>
      <details className="disclosure">
        <summary>{t('Current crops & planting dates', 'বর্তমান ফসল ও রোপণের তারিখ')}</summary>
        <section className="form-card current-calendar">
          <div className="card-title">
            <span className="step-dot">04</span>
            <div>
              <h2>{t('What you grow today', 'এখন যা চাষ করেন')}</h2>
              <p>
                {t(
                  'Your starting rotation, shown on the same calendar as the alternatives.',
                  'বিকল্পগুলোর মতো একই ক্যালেন্ডারে আপনার বর্তমান ফসলক্রম।',
                )}
              </p>
            </div>
            <button
              className="button secondary small-button"
              onClick={() => setEditCalendar((v) => !v)}
              aria-expanded={editCalendar}
            >
              <SlidersHorizontal size={15} />
              {t('Edit sequence', 'ক্রম বদলান')}
              <ChevronDown size={14} className={editCalendar ? 'rotate' : ''} />
            </button>
          </div>
          <Status status={current.status} />
          <CalendarScrollHint />
          <div className="calendar-scroll">
            <div className="calendar-inner">
              <MonthHeader />
              <Timeline periods={farm.current} name={current.rotation.name[language]} />
            </div>
          </div>
          <CalendarLegend />
          {editCalendar && (
            <div className="sequence-editor">
              <p className="field-help">
                {t(
                  'Months are approximate. The calendar repeats Mar → Feb; a crop can continue into March. Editing may create conflicts, which Ritu will flag.',
                  'মাস আনুমানিক। ক্যালেন্ডার মার্চ → ফেব্রুয়ারি পুনরাবৃত্ত হয়; ফসল মার্চে চলতে পারে। বদলালে সংঘাত হলে ঋতু দেখাবে।',
                )}
              </p>
              {farm.current.map((period, index) => (
                <div className="sequence-row" key={index}>
                  <label>
                    {t('Crop / rest', 'ফসল / বিরতি')}
                    <select
                      aria-label={`${t('Crop', 'ফসল')} ${index + 1}`}
                      value={period.crop}
                      onChange={(e) => changePeriod(index, { crop: e.target.value as CropId })}
                    >
                      {Object.values(previewData.crops).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name[language]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t('Start month', 'শুরুর মাস')}
                    <select
                      aria-label={`${t('Start month', 'শুরুর মাস')} ${index + 1}`}
                      value={period.start}
                      onChange={(e) => changePeriod(index, { start: Number(e.target.value) })}
                    >
                      {months[language].map((m, i) => (
                        <option key={m} value={i}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    {t('Months', 'মাস')}
                    <select
                      aria-label={`${t('Duration', 'সময়কাল')} ${index + 1}`}
                      value={period.duration}
                      onChange={(e) => changePeriod(index, { duration: Number(e.target.value) })}
                    >
                      {Array.from({ length: 12 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="icon-button"
                    disabled={farm.current.length <= 1}
                    aria-label={`${t('Remove period', 'সময় বাদ দিন')} ${index + 1}`}
                    onClick={() => setFarm({ current: farm.current.filter((_, i) => i !== index) })}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                className="text-button"
                disabled={farm.current.length >= 12}
                onClick={() =>
                  setFarm({ current: [...farm.current, { crop: 'fallow', start: 0, duration: 1 }] })
                }
              >
                <Plus size={15} />
                {t('Add a crop or rest period', 'ফসল বা বিরতি যোগ করুন')}
              </button>
            </div>
          )}
          {current.checks
            .filter((c) => c.state !== 'pass')
            .map((c) => (
              <p key={c.id} className="calendar-conflict">
                {c.detail[language]}
              </p>
            ))}
        </section>
      </details>
      <div className="farm-bottom-cta">
        <p>
          {t(
            'Your inputs are saved on this device. You can change them at any time.',
            'আপনার তথ্য এই ডিভাইসে সংরক্ষিত থাকে। যেকোনো সময় বদলাতে পারেন।',
          )}
        </p>
        <Link href="/" className="button primary">
          {t('Explore my three options', 'তিনটি বিকল্প দেখুন')}
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
