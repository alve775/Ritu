'use client';
import { useCallback, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CircleAlert,
  Droplets,
  Info,
  Box,
  Eye,
} from 'lucide-react';
import { usePlanner } from './planner-provider';
import { activitiesForMonth } from '../domain/season';
import type { WindowPhase } from '../domain/season';
import { months, previewData } from '../data/preview';
import { FieldViewport } from './field-viewport';
import { CropGlyph } from './crop-glyph';
import { Dialog } from './dialog';
import { Status } from './calendar';
import type { FieldView } from './field-scene';
import { cropModelNotes } from '../data/crop-models';

export function SeasonExplorer() {
  const {
    t,
    language,
    selected,
    evaluations,
    select,
    month,
    setMonth,
    farm,
    fieldOpen: open,
    setFieldOpen: setOpen,
  } = usePlanner();
  const [inspect, setInspect] = useState(false);
  const [view, setView] = useState<FieldView>('field');
  const [mature, setMature] = useState(true);
  const [sources, setSources] = useState(false);
  const showDetails = useCallback(() => setInspect(true), []);
  const activities = activitiesForMonth(selected.rotation, month);
  const single = activities.length === 1 ? activities[0] : null;
  const note = single ? cropModelNotes[single.period.crop] : null;
  const phaseText: Record<WindowPhase, string> = {
    planting: t('Sample planting month', 'নমুনার রোপণের মাস'),
    harvest: t('Sample harvest month', 'নমুনার ফসল কাটার মাস'),
    'plant-and-harvest': t('Sample planting & harvest month', 'নমুনার রোপণ ও কাটার মাস'),
    'in-window': t('Within the sample crop window', 'নমুনার ফসলের সময়ের মধ্যে'),
    rest: t('Planned rest / fallow', 'পরিকল্পিত বিরতি / পতিত'),
  };
  const water = selected.checks.find((check) => check.id === 'water')!;
  const laborConflict =
    farm.unavailableMonths.includes(month) &&
    activities.some((activity) =>
      ['planting', 'harvest', 'plant-and-harvest'].includes(activity.phase),
    );
  return (
    <section
      id="field"
      className="season-explorer"
      aria-label={t('Seasonal field explorer', 'মৌসুমি জমির দৃশ্য')}
    >
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">
            <Box size={15} />
            {t('INTERACTIVE FIELD VIEW', 'জমির ইন্টারঅ্যাকটিভ দৃশ্য')}
          </span>
          <h2>{t('Explore one month at a time', 'একবারে এক মাস দেখুন')}</h2>
          <p>
            {t(
              'See the crop, its calendar window and the constraints for your selection.',
              'বাছা ক্রমের ফসল, সময় ও শর্ত দেখুন।',
            )}
          </p>
        </div>
        <button
          className="button secondary"
          aria-expanded={open}
          aria-controls="field-explorer-body"
          onClick={() => setOpen((value) => !value)}
        >
          {open
            ? t('Collapse field view', 'জমির দৃশ্য বন্ধ করুন')
            : t('Open field view', 'জমির দৃশ্য খুলুন')}
        </button>
      </div>
      {open && (
        <div id="field-explorer-body">
          <div className="explorer-selection">
            <label>
              {t('Rotation to explore', 'যে ক্রম দেখতে চান')}
              <select value={selected.rotation.id} onChange={(event) => select(event.target.value)}>
                {evaluations.map((e) => (
                  <option key={e.rotation.id} value={e.rotation.id}>
                    {e.rotation.name[language]}
                  </option>
                ))}
              </select>
            </label>
            <div className="month-navigation">
              <button
                className="icon-button"
                aria-label={t('Previous month', 'আগের মাস')}
                onClick={() => setMonth((month + 11) % 12)}
              >
                <ChevronLeft size={22} />
              </button>
              <span>
                <CalendarDays size={19} />
                <strong>{months[language][month]}</strong>
              </span>
              <button
                className="icon-button"
                aria-label={t('Next month', 'পরের মাস')}
                onClick={() => setMonth((month + 1) % 12)}
              >
                <ChevronRight size={22} />
              </button>
            </div>
            <Status status={selected.status} />
          </div>
          <div
            className="explorer-months"
            aria-label={t('Choose a sample month', 'নমুনার মাস বাছুন')}
          >
            {months[language].map((label, index) => (
              <button key={label} onClick={() => setMonth(index)} aria-pressed={month === index}>
                {label}
              </button>
            ))}
          </div>
          <div className="explorer-layout">
            <figure className="field-figure">
              <div className="field-model-title">
                <strong>
                  {single
                    ? previewData.crops[single.period.crop].name[language]
                    : t('No single crop specified', 'একটি ফসল নির্ধারিত নয়')}
                </strong>
                <span>{t('Structure study', 'গঠন শেখার দৃশ্য')}</span>
              </div>
              <div className="field-study-controls">
                <div
                  role="group"
                  aria-label={t('Field model view', 'জমির নমুনার দৃশ্য')}
                  className="field-view-tabs"
                >
                  {(
                    [
                      ['field', t('Field view', 'জমির দৃশ্য')],
                      ['crop', t('Crop close-up', 'ফসল কাছে দেখুন')],
                      ['soil', t('Soil cutaway', 'মাটির ভেতর')],
                    ] as const
                  ).map(([value, label]) => (
                    <button
                      key={value}
                      aria-pressed={view === value}
                      onClick={() => setView(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <label>
                  {t('Plant structure', 'গাছের গঠন')}
                  <select
                    disabled={!note || !single || single.period.crop === 'fallow'}
                    value={mature ? 'mature' : 'young'}
                    onChange={(event) => setMature(event.target.value === 'mature')}
                  >
                    <option value="young">{t('Young example', 'নতুন গাছের নমুনা')}</option>
                    <option value="mature">{t('Mature example', 'পূর্ণ গাছের নমুনা')}</option>
                  </select>
                </label>
              </div>
              <FieldViewport
                appearance={{
                  crop: single?.period.crop ?? null,
                  view,
                  mature,
                  water: farm.irrigation,
                  conflict: activities.length > 1,
                }}
                onInspect={showDetails}
              />
              <figcaption>
                <Info size={15} />
                {t(
                  'Plant structure study, independent of the selected month. Not measured growth, planting density or surveyed geometry.',
                  'গাছের গঠন শেখার দৃশ্য, বাছা মাসের বৃদ্ধি নয়। পরিমাপ করা বৃদ্ধি, রোপণের ঘনত্ব বা জরিপের জমি নয়।',
                )}
              </figcaption>
              <div className="field-model-note">
                <strong>
                  {view === 'soil'
                    ? t('What is below the surface', 'মাটির নিচে যা থাকে')
                    : t('What to look for', 'যা খেয়াল করবেন')}
                </strong>
                <p>
                  {note
                    ? view === 'soil'
                      ? note.belowGround[language]
                      : note.structure[language]
                    : single
                      ? t(
                          'An anatomy model is not available for this crop yet. The empty parcel is a placeholder; use the calendar and crop reference.',
                          'এই ফসলের গঠনের নমুনা এখনো নেই। খালি জমি একটি স্থানধারক; ক্যালেন্ডার ও ফসলের উৎস দেখুন।',
                        )
                      : t(
                          'The calendar does not identify one crop here. Review missing or overlapping periods before interpreting the field.',
                          'এখানে একটি ফসল নির্ধারিত নয়। জমি বোঝার আগে অজানা বা সংঘাতযুক্ত সময় দেখুন।',
                        )}
                </p>
                <button className="text-button" onClick={() => setSources(true)}>
                  {t('Model sources & limits', 'নমুনার উৎস ও সীমা')}
                  <ArrowRight size={16} />
                </button>
              </div>
            </figure>
            <div className="month-detail" aria-live="polite">
              <span className="eyebrow">{t('IN THIS MONTH', 'এই মাসে')}</span>
              <h3 key={`${selected.rotation.id}:${month}:${language}`}>
                {activities.length > 1
                  ? t('Overlapping periods', 'সময়ের সংঘাত')
                  : single
                    ? previewData.crops[single.period.crop].name[language]
                    : t('Month not specified', 'মাসের তথ্য নেই')}
              </h3>
              {activities.map((activity, index) => (
                <div className="month-activity" key={`${selected.rotation.id}:${month}:${index}`}>
                  <CropGlyph crop={activity.period.crop} size={22} />
                  <span>
                    <strong>{previewData.crops[activity.period.crop].name[language]}</strong>
                    <small>{phaseText[activity.phase]}</small>
                  </span>
                </div>
              ))}
              {!activities.length && (
                <p>
                  {t(
                    'Add a crop or rest period for this month in your current sequence.',
                    'বর্তমান ক্রমে এই মাসের ফসল বা বিরতি যোগ করুন।',
                  )}
                </p>
              )}
              {activities.length > 1 && (
                <p className="month-warning">
                  <CircleAlert size={18} />
                  {t(
                    'The field has conflicting calendar periods. Review the sequence before choosing.',
                    'জমির সময়গুলোতে সংঘাত আছে। বাছার আগে ক্রম দেখুন।',
                  )}
                </p>
              )}
              {laborConflict && (
                <p className="month-warning">
                  <CircleAlert size={18} />
                  {t(
                    'You marked this planting or harvest month as having no help.',
                    'এই রোপণ বা কাটার মাসে শ্রম নেই বলে দিয়েছেন।',
                  )}
                </p>
              )}
              <div className={`month-water ${water.state}`}>
                <Droplets size={19} />
                <div>
                  <strong>{t('Water access check', 'সেচের শর্ত')}</strong>
                  <p>{water.detail[language]}</p>
                </div>
              </div>
              <button className="button secondary full-width" onClick={showDetails}>
                <Eye size={18} />
                {t('Inspect this month', 'এই মাসের তথ্য দেখুন')}
              </button>
              <Link href="/insights" className="text-button">
                {t('Review all checks', 'সব শর্ত দেখুন')}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      )}
      {inspect && (
        <Dialog
          title={`${months[language][month]} · ${selected.rotation.name[language]}`}
          onClose={() => setInspect(false)}
        >
          <p>
            {t(
              'These activities come from the sample calendar, not a growth forecast.',
              'এই কাজগুলো নমুনার ক্যালেন্ডার থেকে এসেছে, বৃদ্ধির পূর্বাভাস নয়।',
            )}
          </p>
          {activities.map((activity, index) => (
            <div className="inspected-crop" key={index}>
              <h3>{previewData.crops[activity.period.crop].name[language]}</h3>
              <p>
                {phaseText[activity.phase]} · {months[language][activity.period.start]} —{' '}
                {months[language][(activity.period.start + activity.period.duration - 1) % 12]}
              </p>
              <p>{previewData.crops[activity.period.crop].description[language]}</p>
            </div>
          ))}
          {!activities.length && (
            <p>
              {t(
                'This month has no specified period. It remains unknown.',
                'এই মাসের সময় নির্ধারিত নয়। এটি অজানা থাকে।',
              )}
            </p>
          )}
        </Dialog>
      )}
      {sources && (
        <Dialog
          title={t('Model sources & limits', 'নমুনার উৎস ও সীমা')}
          onClose={() => setSources(false)}
        >
          <p>
            {t(
              'These sources guide plant anatomy, not the sample calendar or a local recommendation. The models are original schematic drawings; variety, geometry and proportions are simplified.',
              'উৎসগুলো গাছের গঠন জানায়, নমুনার ক্যালেন্ডার বা স্থানীয় পরামর্শ নয়। দৃশ্যগুলো নিজেদের প্রতীকী আঁকা; জাত, গঠন ও অনুপাত সরল করা হয়েছে।',
            )}
          </p>
          {note && (
            <>
              <h3>{previewData.crops[single!.period.crop].name[language]}</h3>
              <p>{note.structure[language]}</p>
              <p>{note.belowGround[language]}</p>
              <ul className="model-references">
                {note.references.map((reference) => (
                  <li key={reference.url}>
                    <a href={reference.url} target="_blank" rel="noopener noreferrer">
                      {reference.name}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          <div className="notice">
            <Info size={20} />
            <p>
              {t(
                'Young/mature examples are manual educational views, not predicted stages for this month. No cultivar, sowing date, soil profile, water depth, crop density or parcel boundary has been measured. A blue channel represents the reported irrigation category, not water available or a recommended irrigation design.',
                'নতুন/পূর্ণ গাছের নমুনা নিজে বেছে শেখার জন্য, এই মাসের পর্যায়ের পূর্বাভাস নয়। জাত, রোপণের দিন, মাটির স্তর, পানির গভীরতা, ফসলের ঘনত্ব বা জমির সীমানা মাপা হয়নি। নীল নালা দেওয়া সেচের বিভাগকে বোঝায়, পানির পরিমাণ বা সেচের নকশার পরামর্শ নয়।',
              )}
            </p>
          </div>
        </Dialog>
      )}
    </section>
  );
}
