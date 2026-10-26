'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Earth } from 'lucide-react';
import { usePlanner } from './legacy-planner-provider';
import { activitiesForMonth } from '../domain/season';
import { climateFor, demoEnvironment } from '../data/demo-environment';
import { months, previewData } from '../data/preview';
import { CropPhoto, photoFor } from './crop-photo';
import type { CropId } from '../domain/types';
import { CropGlyph } from './crop-glyph';

export function NasaExplorer() {
  const {
    t,
    language,
    selected,
    evaluations,
    select,
    month,
    setMonth,
    demo,
    fieldOpen: open,
    setFieldOpen: setOpen,
  } = usePlanner();
  const climate = climateFor(demo);
  const historical = climate.months[(month + 2) % 12];
  const scenario = demoEnvironment(demo)[month];
  const activities = activitiesForMonth(selected.rotation, month);
  const [studyCrop, setStudyCrop] = useState<CropId | null>(null);
  const activeCrop = studyCrop ?? (activities.length === 1 ? activities[0].period.crop : null);
  const photoCrops = Object.values(previewData.crops).filter((c) => photoFor(c.id));
  return (
    <section
      id="field"
      className="season-explorer nasa-explorer"
      aria-label={t('Seasonal field explorer', 'মৌসুমি জমির দৃশ্য')}
    >
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">
            <Earth size={18} />
            {t('CROP PHOTOS & NASA HISTORY', 'ফসলের ছবি ও নাসার ইতিহাস')}
          </span>
          <h2>
            {t('See the conditions behind your calendar', 'ক্যালেন্ডারের পেছনের পরিবেশ দেখুন')}
          </h2>
          <p>
            {t(
              'Explore monthly weather history alongside your planned activities.',
              'পরিকল্পিত কাজের পাশে মাসের আবহাওয়ার ইতিহাস দেখুন।',
            )}
          </p>
        </div>
        <button
          className="button secondary"
          aria-expanded={open}
          aria-controls="field-explorer-body"
          onClick={() => setOpen(!open)}
        >
          {open
            ? t('Collapse crop explorer', 'ফসলের দৃশ্য বন্ধ করুন')
            : t('Open crop explorer', 'ফসলের দৃশ্য খুলুন')}
        </button>
      </div>
      {open && (
        <div id="field-explorer-body" className="nasa-explorer-content">
          <div data-tour="field-months" className="explorer-month-controls">
            <label>
              {t('Rotation to explore', 'যে ক্রম দেখতে চান')}
              <select value={selected.rotation.id} onChange={(e) => select(e.target.value)}>
                {evaluations.map((e) => (
                  <option key={e.rotation.id} value={e.rotation.id}>
                    {e.rotation.name[language]} · {e.rotation.subtitle[language]}
                  </option>
                ))}
              </select>
            </label>
            <div className="month-stepper">
              <button
                className="icon-button"
                aria-label={t('Previous month', 'আগের মাস')}
                onClick={() => setMonth((month + 11) % 12)}
              >
                <ChevronLeft />
              </button>
              <label>
                {t('Calendar month', 'ক্যালেন্ডারের মাস')}
                <select
                  aria-label={t('Calendar month', 'ক্যালেন্ডারের মাস')}
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                >
                  {months[language].map((m, i) => (
                    <option value={i} key={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </label>
              <button
                className="icon-button"
                aria-label={t('Next month', 'পরের মাস')}
                onClick={() => setMonth((month + 1) % 12)}
              >
                <ChevronRight />
              </button>
            </div>
          </div>
          <div className="nasa-explorer-grid">
            <section className="nasa-month-evidence" data-tour="nasa-month">
              <span className="eyebrow">
                NASA POWER · {historical.month}/{climate.year}
              </span>
              <h3>
                {months[language][month]} · {t('historical conditions', 'অতীতের পরিবেশ')}
              </h3>
              <dl className="demo-metrics">
                <div>
                  <dt>{t('Rainfall', 'বৃষ্টি')}</dt>
                  <dd>{historical.rain.toFixed(1)} mm</dd>
                </div>
                <div>
                  <dt>{t('Mean temperature', 'গড় তাপ')}</dt>
                  <dd>{historical.temperature.toFixed(1)} °C</dd>
                </div>
                <div>
                  <dt>{t('Surface wetness', 'ভেজাভাব')}</dt>
                  <dd>{historical.wetness.toFixed(2)} / 1</dd>
                </div>
              </dl>
              {demo.weather !== 'seasonal' && (
                <p className="notice">
                  {t(
                    `What-if inputs: ${scenario.rain.toFixed(1)} mm rain, ${scenario.temperature.toFixed(1)} °C. These changes are hypothetical; soil wetness is not simulated.`,
                    `কাল্পনিক তথ্য: ${scenario.rain.toFixed(1)} মিমি বৃষ্টি, ${scenario.temperature.toFixed(1)} °C। ভেজাভাব অনুকরণ করা হয়নি।`,
                  )}
                </p>
              )}
              <h3>{t('Your planned activity', 'আপনার পরিকল্পিত কাজ')}</h3>
              {activities.map((a, i) => (
                <div className="month-activity" key={i}>
                  <CropGlyph crop={a.period.crop} size={24} />
                  <span>
                    <strong>{previewData.crops[a.period.crop].name[language]}</strong>
                    <span>
                      {a.phase === 'planting'
                        ? t('Planting window', 'রোপণের সময়')
                        : a.phase === 'harvest'
                          ? t('Harvest window', 'কাটার সময়')
                          : a.phase === 'rest'
                            ? t('Planned rest', 'পরিকল্পিত বিরতি')
                            : t('Within the planned window', 'পরিকল্পিত সময়ের মধ্যে')}
                    </span>
                  </span>
                </div>
              ))}
              <p>
                {t(
                  'The calendar is a planning template. This historical year provides seasonal context, not a forecast for your planting year or a crop growth prediction.',
                  'ক্যালেন্ডার পরিকল্পনার নমুনা। এই বছরের ইতিহাস মৌসুম বোঝায়; রোপণের বছরের বা গাছের বৃদ্ধির পূর্বাভাস নয়।',
                )}
              </p>
            </section>
            <section className="crop-reference-panel" data-tour="nasa-image">
              <label className="crop-study-selector">
                {t('Crop to explore', 'যে ফসল দেখবেন')}
                <select
                  value={studyCrop ?? 'calendar'}
                  onChange={(e) =>
                    setStudyCrop(e.target.value === 'calendar' ? null : (e.target.value as CropId))
                  }
                >
                  <option value="calendar">
                    {t('Follow selected calendar month', 'ক্যালেন্ডারের বাছা মাস অনুসরণ')}
                  </option>
                  {photoCrops.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name[language]}
                    </option>
                  ))}
                </select>
              </label>
              <h3 className="field-model-title">
                {activeCrop && activeCrop !== 'fallow'
                  ? previewData.crops[activeCrop].name[language]
                  : t('Planned rest / fallow', 'পরিকল্পিত বিরতি / পতিত')}
              </h3>
              {activeCrop && photoFor(activeCrop) ? (
                <CropPhoto crop={activeCrop} />
              ) : (
                <p>
                  {t(
                    'No crop is assigned to this month. Choose a crop above to see a clear reference photograph; the calendar will stay unchanged.',
                    'এই মাসে কোনো ফসল নেই। ওপরে ফসল বেছে উদাহরণ ছবি দেখুন; ক্যালেন্ডার বদলাবে না।',
                  )}
                </p>
              )}
              <p data-tour="nasa-image-limits">
                {t(
                  'These are public-domain or CC0 reference photographs with source credits, not NASA observations. A photograph cannot establish local suitability, sowing spacing or how your crop will look in a particular month.',
                  'এগুলো উৎসসহ পাবলিক ডোমেইন বা CC0 উদাহরণ ছবি, নাসার পর্যবেক্ষণ নয়। ছবি দিয়ে স্থানীয় উপযোগিতা, বোনার দূরত্ব বা নির্দিষ্ট মাসে গাছের চেহারা বলা যায় না।',
                )}
              </p>
            </section>
          </div>
        </div>
      )}
    </section>
  );
}
