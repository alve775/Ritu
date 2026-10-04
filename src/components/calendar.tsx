'use client';
import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, CircleAlert, CircleHelp } from 'lucide-react';
import { months, previewData } from '../data/preview';
import { coveredMonths, segments } from '../domain/evaluate';
import type { CropPeriod, Evaluation } from '../domain/types';
import { usePlanner } from './planner-provider';
import { CropGlyph } from './crop-glyph';
import { Dialog } from './dialog';

export function Status({ status }: { status: Evaluation['status'] }) {
  const { t } = usePlanner();
  const Icon = status === 'blocked' ? CircleAlert : status === 'confirm' ? CircleHelp : Check;
  return (
    <span className={`status ${status}`}>
      <Icon size={12} />
      {status === 'blocked'
        ? t('Has a conflict', 'শর্তে সংঘাত')
        : status === 'confirm'
          ? t('Needs confirmation', 'নিশ্চিত করা দরকার')
          : t('Passes preview checks', 'নমুনার শর্ত পূরণ')}
    </span>
  );
}
export function MonthHeader() {
  const { language, t, month, setMonth } = usePlanner();
  return (
    <div className="calendar-axis">
      <div className="season-axis" aria-hidden="true">
        <span>{t('KHARIF I · MAR–JUN', 'খরিফ ১ · মার্চ–জুন')}</span>
        <span>{t('KHARIF II · JUL–OCT', 'খরিফ ২ · জুলাই–অক্টোবর')}</span>
        <span>{t('RABI · NOV–FEB', 'রবি · নভেম্বর–ফেব্রুয়ারি')}</span>
      </div>
      <div className="month-axis">
        {months[language].map((m, index) => (
          <button
            key={m}
            aria-label={`${t('Inspect month', 'মাস দেখুন')}: ${m}`}
            aria-pressed={month === index}
            onClick={() => setMonth(index)}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  );
}
export function CalendarScrollHint() {
  const { t } = usePlanner();
  return (
    <p className="calendar-scroll-hint">
      <ArrowRight size={13} />
      {t('Swipe the calendar to see all 12 months', '১২ মাস দেখতে ক্যালেন্ডার পাশে সরান')}
    </p>
  );
}
export function Timeline({ periods, name }: { periods: CropPeriod[]; name: string }) {
  const { language, t, farm, month } = usePlanner();
  const [active, setActive] = useState<CropPeriod | null>(null);
  const lanes: Set<number>[] = [];
  const positions = periods.map((p) => {
    const occupied = coveredMonths(p);
    let lane = lanes.findIndex((existing) => occupied.every((m) => !existing.has(m)));
    if (lane < 0) {
      lane = lanes.length;
      lanes.push(new Set());
    }
    occupied.forEach((m) => lanes[lane].add(m));
    return lane + 1;
  });
  return (
    <>
      <div
        className="timeline"
        style={{ gridTemplateRows: `repeat(${lanes.length}, minmax(48px, auto))` }}
        role="group"
        aria-label={`${name}: ${t('seasonal calendar', 'মৌসুমি ক্যালেন্ডার')}`}
      >
        <div className="timeline-lines" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <span
              key={i}
              className={`${farm.unavailableMonths.includes(i) ? 'labor-unavailable' : ''} ${month === i ? 'inspected-month' : ''}`}
            />
          ))}
        </div>
        {periods.flatMap((p, index) =>
          segments(p).map((segment, part) => (
            <button
              key={`${index}-${part}`}
              className={`crop-bar crop-${previewData.crops[p.crop].color}`}
              style={{
                gridColumn: `${segment.start + 1} / span ${segment.length}`,
                gridRow: positions[index],
              }}
              onClick={() => setActive(p)}
              aria-label={`${previewData.crops[p.crop].name[language]}, ${months[language][p.start]} — ${months[language][(p.start + p.duration - 1) % 12]}, ${t('view crop details', 'ফসলের তথ্য দেখুন')}`}
            >
              <CropGlyph crop={p.crop} />
              <span>{previewData.crops[p.crop].name[language]}</span>
              {p.duration > segment.length && (
                <span
                  className="wrap-dot"
                  title={t(
                    'Continues across the calendar boundary',
                    'ক্যালেন্ডারের সীমানা পেরিয়ে চলবে',
                  )}
                >
                  ↔
                </span>
              )}
            </button>
          )),
        )}
      </div>
      {active && (
        <Dialog
          title={previewData.crops[active.crop].name[language]}
          onClose={() => setActive(null)}
        >
          <div className={`crop-detail-icon crop-${previewData.crops[active.crop].color}`}>
            <CropGlyph crop={active.crop} size={38} />
          </div>
          <div className="detail-grid">
            <div>
              <small>{t('Sample window', 'নমুনার সময়')}</small>
              <strong>
                {months[language][active.start]} —{' '}
                {months[language][(active.start + active.duration - 1) % 12]}
              </strong>
            </div>
            <div>
              <small>{t('Duration', 'সময়কাল')}</small>
              <strong>
                {active.duration} {t('months', 'মাস')}
              </strong>
            </div>
            <div>
              <small>{t('Crop family', 'ফসলের পরিবার')}</small>
              <strong>{previewData.crops[active.crop].family[language]}</strong>
            </div>
          </div>
          <p>{previewData.crops[active.crop].description[language]}</p>
          {previewData.crops[active.crop].reference && (
            <p>
              <a
                href={previewData.crops[active.crop].reference!.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {previewData.crops[active.crop].reference!.name}
              </a>
            </p>
          )}
          <div className="notice small">
            {t(
              'These are locked monthly mock windows for the March–February cycle, not verified local planting dates.',
              'এগুলো মার্চ–ফেব্রুয়ারি চক্রের নির্ধারিত মাসভিত্তিক নমুনা সময়; যাচাইকৃত স্থানীয় রোপণের তারিখ নয়।',
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}
export function RotationRow({
  evaluation,
  index,
  onExplain,
}: {
  evaluation: Evaluation;
  index: number;
  onExplain: () => void;
}) {
  const { language, t, selected, select, preferred } = usePlanner();
  const { rotation, checks } = evaluation;
  const isSelected = selected.rotation.id === rotation.id;
  const problem =
    checks.find((c) => c.state === 'block') ?? checks.find((c) => c.state === 'unknown');
  return (
    <section
      className={`rotation-row ${isSelected ? 'selected' : ''}`}
      aria-label={rotation.name[language]}
    >
      <div className="rotation-top">
        <div className="rotation-identity">
          <button
            className={`selection-radio ${isSelected ? 'checked' : ''}`}
            onClick={() => select(rotation.id)}
            aria-label={`${t('Select', 'বাছুন')} ${rotation.name[language]}`}
            aria-pressed={isSelected}
          >
            {isSelected && <Check size={12} />}
          </button>
          <div>
            <div className="rotation-label">
              <span>
                {rotation.isCurrent
                  ? t('BASELINE', 'বর্তমান')
                  : `${t('OPTION', 'বিকল্প')} 0${index + 1}`}
              </span>
              {preferred === rotation.id && (
                <span className="preference-tag">
                  {t('Matches your priority', 'অগ্রাধিকারে এগিয়ে')}
                </span>
              )}
            </div>
            <h3>
              <button onClick={() => select(rotation.id)}>{rotation.name[language]}</button>
            </h3>
          </div>
        </div>
        <Status status={evaluation.status} />
      </div>
      <Timeline periods={rotation.periods} name={rotation.name[language]} />
      <div className="rotation-bottom">
        <span className={problem ? 'problem-note' : ''}>
          {problem ? <CircleAlert size={13} /> : <Check size={13} />}
          <span>
            {problem
              ? problem.id === 'water'
                ? t('Water access needs attention', 'সেচের শর্ত দেখুন')
                : problem.label[language]
              : t(
                  `${evaluation.familyCount} reviewed botanical families; additional crop taxonomy may be unreviewed`,
                  `${evaluation.familyCount}টি যাচাইকৃত উদ্ভিদ পরিবার; বাড়তি ফসলের পরিবার যাচাই বাকি থাকতে পারে`,
                )}
          </span>
        </span>
        <button
          className="text-button"
          onClick={() => {
            select(rotation.id);
            onExplain();
          }}
        >
          {t('Why this option?', 'কেন এই বিকল্প?')}
          <ArrowUpRight size={14} />
        </button>
      </div>
    </section>
  );
}
export function CalendarLegend() {
  const { t } = usePlanner();
  return (
    <div className="calendar-legend">
      <span>{t('Read the crop name on each bar.', 'প্রতিটি বারে ফসলের নাম পড়ুন।')}</span>
      <span className="legend-hint">
        {t('Tap a crop to explore', 'ফসলের ওপর চাপুন')}
        <ArrowRight size={12} />
      </span>
    </div>
  );
}
