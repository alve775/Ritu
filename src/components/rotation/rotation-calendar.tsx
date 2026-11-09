'use client';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, ChevronLeft, ChevronRight, Cloud, CloudRain, Sun } from 'lucide-react';
import { usePlanner } from '../planner-provider';
import { useSoilReference } from '../../lib/use-soil-reference';
import { seasonStore, useSeasonFarms } from '../../lib/season-store';
import { fieldLogStore, useFieldLog } from '../../lib/field-log-store';
import type { SeasonFarm } from '../../domain/global-season';
import type { LiveWeather } from '../../domain/live-weather';
import {
  dueReminders,
  reminderMinutes,
  type FieldNote,
  type NoteReminder,
} from '../../domain/field-log';
import {
  assessPlan,
  bigEvents,
  cancelReasons,
  cropEnd,
  earlyHarvestDays,
  harvestGraceDays,
  harvestLead,
  lastChanceDays,
  lastHarvestDay,
  lastSowDay,
  lossReasons,
  type CancelReason,
  type LossReason,
  cropOn,
  cropWeeks,
  dayCount,
  dayItems,
  daysInMonth,
  isoOf,
  monthIndex,
  monthlyClimate,
  planCrops,
  plusDays,
  pumpHours,
  quietDay,
  weekOn,
  windowOn,
  yearOf,
  type CropAssessment,
  type MonthlyClimate,
  type PlanCrop,
} from '../../domain/rotation';
import { rotationText, type RotationText, type Translate } from './rotation-text';
import { seasonClass } from './rotation-visuals';
import { DetailChart, PlantGlyph } from './rotation-glyphs';
import {
  dayWeather,
  eventText,
  inDays,
  itemClass,
  itemTag,
  itemText,
  quietText,
  stageName,
  weatherWord,
  wetWord,
  type DayWeather,
  type WeatherIcon,
} from './day-text';
import { Dialog } from '../dialog';
import { NoteComposer, NoteList, reminderTimeLabel } from '../notes/note-parts';
import { farmForPlanCrop } from '../../lib/rotation-farm';
import { openPlotPlan } from '../plot-setup';
import { plotProfile } from '../../domain/plot';
import { cancelReasonText, lossReasonText, lossTag } from './end-text';

type Kind = 'yearDone' | 'empty' | 'prepare' | 'sow' | 'growing' | 'harvest';
/** `both` clears a crop's sowing and harvest together (a harvest cannot stay without its sowing). */
type RecordKind = 'plantedDate' | 'harvestedDate' | 'both';
interface Ctx {
  pcs: PlanCrop[];
  today: string;
  tx: RotationText;
  t: Translate;
  areaHa: number;
  climate: MonthlyClimate;
  weather: LiveWeather | null;
  plotId: string;
  notes: FieldNote[];
  /** Record or clear a crop's sowing or harvest day; returns an error message or ''. */
  recordCrop?: (c: PlanCrop, kind: RecordKind, value: string) => string;
  /** Days chosen ahead, by season: a planned sowing (not sown yet) and a planned harvest. */
  planned?: Record<string, { sow: string; harvest: string }>;
  /** End a crop without a harvest, or take that back; returns an error message or ''. */
  endCrop?: (c: PlanCrop, action: EndAction) => string;
  /** The saved record of each crop, by season. */
  recs?: Record<string, SeasonFarm | undefined>;
  /** Open the plan page to change the plan. */
  changePlan?: () => void;
  /** Open the Fix it box on one crop. */
  openFix?: (season: string) => void;
}
type EndAction =
  | { kind: 'cancel'; reason: CancelReason }
  | { kind: 'restore' }
  | { kind: 'lose'; date: string; reason: LossReason; note: string; saveNote: boolean }
  | { kind: 'unlose' }
  | { kind: 'early'; date: string }
  | { kind: 'again' };

const leadOf = (c: PlanCrop) => harvestLead(c.a.item.crop.days);
/** Last sowing day of crop `i` of the plan (see lastSowDay). */
const lastSow = (pcs: PlanCrop[], i: number) =>
  lastSowDay(
    pcs.map((p) => p.a.item),
    i,
  );
/**
 * The days a crop's sowing or harvest can be on: sowing from the start of its best time to its
 * last sowing day; harvest from most of the season after sowing to 45 days late or the next
 * crop's last sowing day. Recorded days of the crops around it narrow it; `today` caps it.
 */
function recordRange(
  pcs: PlanCrop[],
  c: PlanCrop,
  kind: 'plantedDate' | 'harvestedDate',
  today?: string,
) {
  const i = Math.max(
      0,
      pcs.findIndex((p) => p.a.item.season === c.a.item.season),
    ),
    prev = i > 0 ? pcs[i - 1] : undefined,
    next = pcs[i + 1];
  const { windowStart, sow, harvest, crop } = c.a.item;
  let min: string, max: string;
  if (kind === 'plantedDate') {
    min = windowStart;
    max = lastSow(pcs, i);
    if (prev?.harvested && prev.a.item.harvest > min) min = prev.a.item.harvest;
    if (c.harvested && plusDays(harvest, -leadOf(c)) < max) max = plusDays(harvest, -leadOf(c));
  } else {
    min = plusDays(sow, leadOf(c));
    max = plusDays(sow, crop.days + 45);
    if (next) {
      const nextLast = next.sown ? next.a.item.sow : lastSow(pcs, i + 1);
      if (nextLast < max) max = nextLast;
    }
  }
  if (today && today < max) max = today;
  return { min, max };
}
const inRange = (date: string, r: { min: string; max: string }) => r.min <= date && date <= r.max;

export function WeatherGlyph({ icon, size = 20 }: { icon: WeatherIcon; size?: number }) {
  const Icon = icon === 'rain' ? CloudRain : icon === 'cloud' ? Cloud : Sun;
  return <Icon className={`wx-${icon}`} size={size} aria-hidden="true" />;
}

function todayKind(c: PlanCrop | null, index: number, today: string): Kind {
  if (!c) return 'yearDone';
  const { windowStart, harvest } = c.a.item;
  if (!c.sown) {
    if (today < plusDays(windowStart, -10)) return index > 0 ? 'empty' : 'prepare';
    return today < windowStart ? 'prepare' : 'sow';
  }
  return today >= plusDays(harvest, -10) ? 'harvest' : 'growing';
}

/** A weather hint only when the weather changes today's job. */
function weatherHint(kind: Kind, due: boolean, w: DayWeather, rainSoon: number, ctx: Ctx) {
  const { t, tx } = ctx;
  const wet = w.kind === 'forecast' && ((w.chance ?? 0) >= 50 || (w.rain ?? 0) >= 5);
  if (due && (wet || rainSoon >= 10))
    return wet
      ? t('Rain is likely today: wait with irrigation.', 'আজ বৃষ্টি হতে পারে: সেচ একটু পরে দিন।')
      : t(
          `Rain is coming (about ${Math.round(rainSoon)} mm in 3 days): wait with irrigation.`,
          `বৃষ্টি আসছে (৩ দিনে প্রায় ${tx.n(Math.round(rainSoon))} মিমি): সেচ একটু পরে দিন।`,
        );
  if (wet && kind === 'harvest')
    return t(
      'Rain may come: bring the ripe crop in first.',
      'বৃষ্টি আসতে পারে: পাকা ফসল আগে কেটে ঘরে তুলুন।',
    );
  if (wet && kind === 'sow')
    return t('Sow once the soil is workable after the rain.', 'বৃষ্টির পরে মাটিতে জো এলে বুনুন।');
  if (w.kind === 'forecast' && (w.max ?? 0) >= 36)
    return t('Very hot: avoid field work at midday.', 'খুব গরম: দুপুরে মাঠের কাজ এড়িয়ে চলুন।');
  if (w.kind === 'forecast' && w.min !== null && w.min <= 11)
    return t('Cold night: expect fog in the morning.', 'ঠান্ডা রাত: সকালে কুয়াশা থাকতে পারে।');
  return '';
}

/** The plot's year at a glance: crops, rain, heat and every irrigation on one wheel, with today's hand. */
function GlanceCard({
  ctx,
  current,
  start,
  plotName,
  onPick,
}: {
  ctx: Ctx;
  current: PlanCrop | null;
  start: string;
  plotName: string;
  onPick: (date: string) => void;
}) {
  const { pcs, today, tx, t, climate, areaHa } = ctx;
  const C = 180;
  const polar = (r: number, iso: string): [number, number] => {
    const a = ((((dayCount(start, iso) % 365) + 365) % 365) / 365) * 2 * Math.PI - Math.PI / 2;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
  };
  const sector = (r1: number, r2: number, a: string, b: string) => {
    const large = dayCount(a, b) > 182 ? 1 : 0;
    const [x1, y1] = polar(r2, a),
      [x2, y2] = polar(r2, b),
      [x3, y3] = polar(r1, b),
      [x4, y4] = polar(r1, a);
    return `M${x1},${y1} A${r2},${r2} 0 ${large} 1 ${x2},${y2} L${x3},${y3} A${r1},${r1} 0 ${large} 0 ${x4},${y4}Z`;
  };
  const maxRain = Math.max(...climate.rain, 1);
  const months = Array.from({ length: 12 }, (_, i) => {
    const y = yearOf(start) + Math.floor((monthIndex(start) + i) / 12),
      m = (monthIndex(start) + i) % 12;
    const a = isoOf(y, m + 1, 1),
      b = isoOf(m === 11 ? y + 1 : y, m === 11 ? 1 : m + 2, 1);
    return { a, b, m };
  });
  // A cancelled crop keeps a faint outline on the wheel, but its irrigation and heat are gone.
  const live = pcs.filter((c) => c.end?.kind !== 'cancelled');
  const windows = live.flatMap((c) => c.windows).filter((w) => w.status !== 'past');
  const done = windows.filter((w) => w.status === 'done').length;
  const next = bigEvents(pcs, today, 1)[0];
  const hotCrop = live.find((c) => !c.harvested && c.a.weeks.some((w) => w.hot));
  const hotWeek = hotCrop?.a.weeks.find((w) => w.hot);
  const [hx, hy] = polar(176, today),
    [ix, iy] = polar(54, today);
  const inField =
    !!current && current.sown && current.a.item.sow <= today && today < current.a.item.harvest;
  const center: [string, string] = !current
    ? ['✓', t('Year done', 'বছর শেষ')]
    : inField
      ? [
          t(
            `Day ${dayCount(current.a.item.sow, today) + 1}`,
            `দিন ${tx.n(dayCount(current.a.item.sow, today) + 1)}`,
          ),
          t(
            `${tx.crop(current.a.item.crop)} · of ${current.a.item.crop.days}`,
            `${tx.crop(current.a.item.crop)} · মোট ${tx.n(current.a.item.crop.days)} দিন`,
          ),
        ]
      : [
          tx.n(Math.max(0, dayCount(today, current.a.item.sow))),
          t(
            `days to ${tx.crop(current.a.item.crop)} sowing`,
            `দিন পরে ${tx.crop(current.a.item.crop)} বোনা`,
          ),
        ];
  return (
    <section className="rot-glance" aria-label={t('This plot at a glance', 'এক নজরে এই প্লট')}>
      <div className="rot-glance-wheel">
        <svg
          viewBox="0 0 360 360"
          width="100%"
          role="img"
          aria-label={t('The whole year on this plot', 'এই প্লটের পুরো বছর')}
        >
          {months.map(({ a, b, m }) => {
            const [lx, ly] = polar(168, plusDays(a, Math.round(dayCount(a, b) / 2)));
            return (
              <g key={a}>
                <path
                  className="rain"
                  d={sector(
                    134,
                    134 + (climate.rain[m] / maxRain) * 24,
                    plusDays(a, 1),
                    plusDays(b, -1),
                  )}
                />
                <text className="month" x={lx} y={ly + 4} textAnchor="middle">
                  {tx.monthShort(m)}
                </text>
              </g>
            );
          })}
          <circle className="heat-track" cx={C} cy={C} r={66} />
          {live.flatMap((c) =>
            c.a.weeks
              .filter((w) => w.hot)
              .map((w) => (
                <path
                  key={c.a.item.crop.id + w.start}
                  className="heat"
                  d={sector(60, 70, w.start, plusDays(w.start, w.days))}
                />
              )),
          )}
          {pcs.map((c, i) => {
            const end =
              dayCount(c.a.item.sow, c.a.item.harvest) >= 364
                ? plusDays(c.a.item.sow, 364)
                : c.a.item.harvest;
            const [lx, ly] = polar(
              100,
              plusDays(c.a.item.sow, Math.round(dayCount(c.a.item.sow, end) / 2)),
            );
            return (
              <g key={c.a.item.crop.id + c.a.item.sow} className={seasonClass(c.a.item.season)}>
                <path
                  className={`crop ${c === current ? 'current' : ''} ${c.end?.kind === 'cancelled' ? 'cancelled' : ''}`}
                  style={{ animationDelay: `${i * 120}ms` }}
                  d={sector(76, 124, c.a.item.sow, end)}
                  role="button"
                  tabIndex={0}
                  aria-label={t(
                    `${tx.crop(c.a.item.crop)}: open the sowing day`,
                    `${tx.crop(c.a.item.crop)}: বোনার দিন খুলুন`,
                  )}
                  onClick={() => onPick(c.a.item.sow)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onPick(c.a.item.sow)}
                />
                <text
                  className={`crop-label ${c.end?.kind === 'cancelled' ? 'cancelled' : ''}`}
                  x={lx}
                  y={ly + 5}
                  textAnchor="middle"
                >
                  {tx.crop(c.a.item.crop).replace(/ (ধান|ডাল|rice|bean)$/, '')}
                </text>
              </g>
            );
          })}
          {windows.map((w) => {
            const [x, y] = polar(129, plusDays(w.start, 3));
            return <circle key={w.key} className={`drop ${w.status}`} cx={x} cy={y} r={4} />;
          })}
          <line className="hand" x1={ix} y1={iy} x2={hx} y2={hy} />
          <circle className="hub" cx={ix} cy={iy} r={5} />
          <text className="big" x={C} y={C + 4} textAnchor="middle">
            {center[0]}
          </text>
          <text className="small" x={C} y={C + 24} textAnchor="middle">
            {center[1]}
          </text>
        </svg>
        <p className="rot-glance-key">
          <span>
            <i className="rain" />
            {t('Rain', 'বৃষ্টি')}
          </span>
          <span>
            <i className="drop" />
            {t('Irrigation', 'সেচ')}
          </span>
          <span>
            <i className="drop done" />
            {t('Irrigated', 'সেচ দেওয়া')}
          </span>
          <span>
            <i className="heat" />
            {t('Heat', 'গরম')}
          </span>
          <span>
            <i className="hand" />
            {t('Hand: today', 'কাঁটা: আজ')}
          </span>
        </p>
      </div>
      <div className="rot-glance-stats">
        <span className="eyebrow">{t('AT A GLANCE', 'এক নজরে')}</span>
        <h2>{t(`${plotName}: this year’s plan`, `${plotName}-এর এ বছরের পরিকল্পনা`)}</h2>
        <p className="rot-glance-seq">
          {pcs.map((c, i) => (
            <span key={c.a.item.crop.id}>
              {i > 0 && (
                <span className="arrow" aria-hidden="true">
                  →
                </span>
              )}
              <span
                className={`pill ${seasonClass(c.a.item.season)} ${c.end && c.end.kind !== 'closed' ? 'ended' : ''}`}
              >
                {tx.crop(c.a.item.crop)}
              </span>
            </span>
          ))}
        </p>
        <div className="rot-glance-stat">
          <span>{t('Irrigation', 'সেচ')}</span>
          <b>
            {t(
              `${done} of ${windows.length} done`,
              `${tx.n(done)} / ${tx.n(windows.length)}টি দেওয়া হয়েছে`,
            )}
          </b>
          <span className="meter" aria-hidden="true">
            <i style={{ width: `${windows.length ? (done / windows.length) * 100 : 0}%` }} />
          </span>
        </div>
        <div className="rot-glance-stat">
          <span>{t('Next big job', 'পরের বড় কাজ')}</span>
          <b>
            {next
              ? `${eventText(next, tx, t, areaHa).title} · ${inDays(dayCount(today, next.date), tx, t)}`
              : t('None', 'নেই')}
          </b>
        </div>
        <div className="rot-glance-stat">
          <span>{t('Heat risk', 'গরমের ঝুঁকি')}</span>
          <b>
            {hotCrop && hotWeek
              ? t(
                  `${tx.crop(hotCrop.a.item.crop)} at ${tx.stage(hotCrop.a.item.crop.heat!.stage)}, ${tx.month(hotWeek.start)}`,
                  `${tx.crop(hotCrop.a.item.crop)}, ${tx.stage(hotCrop.a.item.crop.heat!.stage)} সময়, ${tx.month(hotWeek.start)}`,
                )
              : t('None this year', 'এ বছর নেই')}
          </b>
        </div>
      </div>
    </section>
  );
}

function Ring({ share, big, small }: { share: number; big: string; small: string }) {
  const r = 48,
    c = 2 * Math.PI * r;
  return (
    <svg className="rot-ring" viewBox="0 0 116 116" aria-hidden="true">
      <circle className="track" cx={58} cy={58} r={r} />
      <circle
        className="bar"
        cx={58}
        cy={58}
        r={r}
        strokeDasharray={c}
        strokeDashoffset={c * (1 - Math.max(0, Math.min(1, share)))}
        transform="rotate(-90 58 58)"
      />
      <text className="big" x={58} y={61} textAnchor="middle">
        {big}
      </text>
      <text className="small" x={58} y={80} textAnchor="middle">
        {small}
      </text>
    </svg>
  );
}

const journeyStages = ['sow', 'young', 'grow', 'flower', 'harvest'] as const;
const journeyCols = '10fr 20fr 30fr 25fr 15fr';
function Journey({ share, t, harvestAt }: { share: number; t: Translate; harvestAt?: number }) {
  const si = share < 0.1 ? 0 : share < 0.3 ? 1 : share < 0.6 ? 2 : share < 0.85 ? 3 : 4;
  return (
    <div className="rot-journey">
      <div className="bar" style={{ gridTemplateColumns: journeyCols }} aria-hidden="true">
        {journeyStages.map((s, i) => (
          <i key={s} className={i < si ? 'past' : i === si ? 'now' : ''} />
        ))}
        <span className="dot" style={{ left: `${Math.max(1, Math.min(99, share * 100))}%` }} />
        {harvestAt !== undefined && (
          <span
            className="harvest-mark"
            style={{ left: `${Math.max(1, Math.min(99, harvestAt * 100))}%` }}
          />
        )}
      </div>
      <div className="labels" style={{ gridTemplateColumns: journeyCols }}>
        {journeyStages.map((s, i) => (
          <span
            key={s}
            className={i === si ? 'now' : ''}
            aria-current={i === si ? 'step' : undefined}
          >
            {stageName(s, t)}
          </span>
        ))}
      </div>
    </div>
  );
}

function TodayCard({
  ctx,
  kind,
  current,
  ownSeason,
  currentFarm,
}: {
  ctx: Ctx;
  kind: Kind;
  current: PlanCrop | null;
  ownSeason: string | undefined;
  currentFarm: SeasonFarm | undefined;
}) {
  const { pcs, today, tx, t, areaHa, weather, climate, plotId, notes, recordCrop } = ctx;
  // Undo keeps the crop it was for: after a harvest the card moves on to the next crop.
  const [undo, setUndo] = useState<{
      kind: 'plantedDate' | 'harvestedDate' | 'irrigation';
      key?: string;
      season?: string;
    } | null>(null),
    [error, setError] = useState(''),
    [endSheet, setEndSheet] = useState<{ c: PlanCrop; mode: 'cancel' | 'lost' } | null>(null);
  const w = dayWeather(today, weather, climate);
  const nextDays = [1, 2, 3]
    .map((k) => plusDays(today, k))
    .filter((d) => weather?.days.some((x) => x.date === d));
  const rainSoon = (weather?.days ?? [])
    .filter((d) => d.date >= today && d.date < plusDays(today, 3))
    .reduce((s, d) => s + (d.rain ?? 0), 0);
  const win = current ? windowOn([current], today) : undefined;
  const hint = weatherHint(kind, win?.status === 'due', w, rainSoon, ctx);
  const reminders = dueReminders(notes, today);
  const record = (k: 'plantedDate' | 'harvestedDate') => {
    if (!current || !recordCrop) return;
    const message = recordCrop(current, k, today);
    setError(message);
    setUndo(message ? null : { kind: k, season: current.a.item.season });
  };
  // The crop before this one ended without a harvest: its card stays while the field waits.
  const at = current ? pcs.indexOf(current) : pcs.length,
    ended = at > 0 && pcs[at - 1].end ? pcs[at - 1] : null;
  const sheetView = endSheet && (
    <EndSheet ctx={ctx} c={endSheet.c} mode={endSheet.mode} onClose={() => setEndSheet(null)} />
  );
  if (ended && (!current || kind === 'empty'))
    return (
      <>
        <EndedCard
          ctx={ctx}
          c={ended}
          next={current}
          onLost={() => setEndSheet({ c: ended, mode: 'lost' })}
        />
        {sheetView}
      </>
    );
  if (!current)
    return (
      <section className="card rot-today2 empty">
        <h2>{t('All crops this year are harvested', 'এ বছরের সব ফসল কাটা হয়েছে')}</h2>
        <p>
          {t(
            'Choose next year’s plan from the dashboard.',
            'ড্যাশবোর্ড থেকে আগামী বছরের পরিকল্পনা বাছুন।',
          )}
        </p>
      </section>
    );
  const { crop, sow, harvest, windowStart, windowEnd } = current.a.item;
  const isOwn = current.a.item.season === ownSeason;
  const share = current.sown ? dayCount(sow, today) / crop.days : 0;
  const items = pcs.map((p) => p.a.item),
    nextCrop = pcs[at + 1];
  const lastSowOn = lastSow(pcs, at),
    lateSow = !current.sown && today > windowEnd,
    lastHarvestOn = current.sown
      ? lastHarvestDay(items, at, sow, nextCrop?.sown ? nextCrop.a.item.sow : undefined)
      : '';
  let tone = '',
    flag: ReactNode = null,
    extra: ReactNode = null;
  const week = weekOn(current, today);
  let big = '',
    small = '',
    head = '',
    sub = '',
    action: ReactNode = null;
  const openOther =
    !isOwn && currentFarm ? (
      <button
        className="button secondary"
        type="button"
        onClick={() => seasonStore.activate(currentFarm.id)}
      >
        {t(`Open ${tx.crop(crop)}’s calendar`, `${tx.crop(crop)} ক্যালেন্ডার খুলুন`)}
      </button>
    ) : null;
  const plan = ctx.planned?.[current.a.item.season];
  // "Not yet" on a planned day takes the plan away; the card goes back to its usual advice.
  const notYet = (k: 'plantedDate' | 'harvestedDate') => (
    <button
      className="button secondary"
      type="button"
      onClick={() => recordCrop && setError(recordCrop(current, k, ''))}
    >
      {t('Not yet', 'এখনো না')}
    </button>
  );
  if (!current.sown && plan?.sow) {
    big = tx.n(Math.max(0, dayCount(today, sow)));
    small = t('days to sowing', 'দিন পরে বোনা');
    head =
      today < sow
        ? t(`Sowing planned for ${tx.date(sow)}`, `${tx.date(sow)} বোনার পরিকল্পনা`)
        : t(`Did you sow ${tx.crop(crop)} today?`, `আজ কি ${tx.crop(crop)} বুনেছেন?`);
    sub =
      today < sow
        ? t('Prepare the field.', 'জমি তৈরি করুন।')
        : today > sow
          ? t(`It was planned for ${tx.date(sow)}.`, `${tx.date(sow)} বোনার কথা ছিল।`)
          : t('Today is the planned sowing day.', 'আজ বোনার ঠিক করা দিন।');
    action = (
      <>
        <button className="button primary" type="button" onClick={() => record('plantedDate')}>
          {today < sow
            ? t(`I sowed ${tx.crop(crop)} today`, `আজ ${tx.crop(crop)} বুনেছি`)
            : t('Yes, I sowed today', 'হ্যাঁ, আজ বুনেছি')}
        </button>
        {today >= sow && notYet('plantedDate')}
      </>
    );
  } else if (current.sown && plan?.harvest && kind === 'harvest') {
    big = tx.n(Math.max(0, dayCount(today, harvest)));
    small = t('days to harvest', 'দিন পরে কাটা');
    head =
      today < harvest
        ? t(`Harvest planned for ${tx.date(harvest)}`, `${tx.date(harvest)} কাটার পরিকল্পনা`)
        : t(`Did you harvest ${tx.crop(crop)} today?`, `আজ কি ${tx.crop(crop)} কেটেছেন?`);
    sub = t('Stop irrigating and let the crop ripen.', 'সেচ বন্ধ রাখুন, ফসল পাকতে দিন।');
    action = (
      <>
        <button className="button primary" type="button" onClick={() => record('harvestedDate')}>
          {today < harvest
            ? t(`I harvested ${tx.crop(crop)} today`, `আজ ${tx.crop(crop)} কেটেছি`)
            : t('Yes, I harvested today', 'হ্যাঁ, আজ কেটেছি')}
        </button>
        {today >= harvest && notYet('harvestedDate')}
      </>
    );
  } else if (kind === 'empty' || kind === 'prepare') {
    big = tx.n(Math.max(0, dayCount(today, sow)));
    small = t('days to sowing', 'দিন পরে বোনা');
    head =
      kind === 'empty'
        ? t(`The field is empty. Next: ${tx.crop(crop)}`, `জমি এখন খালি। পরের ফসল ${tx.crop(crop)}`)
        : t(`Plough the field for ${tx.crop(crop)}`, `${tx.crop(crop)} বোনার জন্য জমি চাষ দিন`);
    sub = t(
      `Best time to sow: ${tx.date(windowStart)} to ${tx.date(windowEnd)}`,
      `বোনার ভালো সময় ${tx.date(windowStart)} থেকে ${tx.date(windowEnd)}`,
    );
  } else if (kind === 'sow') {
    big = t('Now', 'এখন');
    small = t('sowing time', 'বোনার সময়');
    head = t(`Sow ${tx.crop(crop)} now`, `এখন ${tx.crop(crop)} বুনুন`);
    sub =
      today > windowEnd
        ? t(
            `The best time ended on ${tx.date(windowEnd)}: sow as soon as you can. Last possible day: ${tx.date(recordRange(ctx.pcs, current, 'plantedDate').max)}.`,
            `ভালো সময় শেষ হয়েছে ${tx.date(windowEnd)}: যত তাড়াতাড়ি পারেন বুনুন। শেষ সম্ভব দিন ${tx.date(recordRange(ctx.pcs, current, 'plantedDate').max)}।`,
          )
        : t(`Last good day: ${tx.date(windowEnd)}`, `শেষ ভালো দিন ${tx.date(windowEnd)}`);
    action = isOwn ? (
      <button className="button primary" type="button" onClick={() => record('plantedDate')}>
        {t(`I sowed ${tx.crop(crop)} today`, `আজ ${tx.crop(crop)} বুনেছি`)}
      </button>
    ) : (
      openOther
    );
    // After the best time: a countdown to the last sowing day, then the crop is cancelled.
    if (lateSow) {
      const left = dayCount(today, lastSowOn);
      tone = 'warn';
      big = left > 0 ? tx.n(left) : t('Today', 'আজ');
      small = left > 0 ? t('days left', 'দিন বাকি') : t('last day', 'শেষ দিন');
      head =
        left < lastChanceDays
          ? t(`Last chance to sow ${tx.crop(crop)}`, `${tx.crop(crop)} বোনার শেষ সুযোগ`)
          : t(`${tx.crop(crop)} is late`, `${tx.crop(crop)} বোনায় দেরি হয়েছে`);
      sub = t(
        `The best time ended on ${tx.date(windowEnd)}.`,
        `ভালো সময় শেষ হয়েছে ${tx.date(windowEnd)}।`,
      );
      flag = t(
        `Sowing this late gives a smaller crop. Sow by ${tx.date(lastSowOn)}, or change the plan. After that, ${tx.crop(crop)} is cancelled for this year.`,
        `এত দেরিতে বুনলে ফলন কম হয়। ${tx.date(lastSowOn)}-এর মধ্যে বুনুন, অথবা পরিকল্পনা বদলান। এরপর এ বছরের জন্য ${tx.crop(crop)} বাতিল হবে।`,
      );
      action = (
        <>
          {action}
          {ctx.changePlan && (
            <button className="button secondary" type="button" onClick={ctx.changePlan}>
              {t('Change plan', 'পরিকল্পনা বদলান')}
            </button>
          )}
        </>
      );
    }
  } else if (kind === 'harvest') {
    big = tx.n(Math.max(0, dayCount(today, harvest)));
    small = t('days to harvest', 'দিন পরে কাটা');
    head =
      today < harvest
        ? t(`${tx.crop(crop)} harvest is coming`, `${tx.crop(crop)} কাটার সময় আসছে`)
        : t(`Harvest ${tx.crop(crop)}`, `${tx.crop(crop)} কাটুন`);
    sub = t('Stop irrigating and let the crop ripen.', 'সেচ বন্ধ রাখুন, ফসল পাকতে দিন।');
    action = isOwn ? (
      <button className="button primary" type="button" onClick={() => record('harvestedDate')}>
        {t(`I harvested ${tx.crop(crop)} today`, `আজ ${tx.crop(crop)} কেটেছি`)}
      </button>
    ) : (
      openOther
    );
    // A week past the expected harvest: ask about it, up to the last harvest day.
    if (today > plusDays(harvest, harvestGraceDays)) {
      tone = 'warn';
      big = tx.n(dayCount(harvest, today));
      small = t('days late', 'দিন দেরি');
      head = t(`${tx.crop(crop)} harvest is late`, `${tx.crop(crop)} কাটায় দেরি হচ্ছে`);
      sub = t(`Expected on ${tx.date(harvest)}.`, `কাটার কথা ছিল ${tx.date(harvest)}।`);
      flag = nextCrop
        ? t(
            `Did you harvest it? Enter the day. If it is still in the field, harvest by ${tx.date(lastHarvestOn)}; after that it is closed so ${tx.crop(nextCrop.a.item.crop)} can start.`,
            `কেটে ফেলেছেন? দিনটি লিখুন। এখনো মাঠে থাকলে ${tx.date(lastHarvestOn)}-এর মধ্যে কাটুন; এরপর ফসলটি বন্ধ হবে যাতে ${tx.crop(nextCrop.a.item.crop)} শুরু করা যায়।`,
          )
        : t(
            `Did you harvest it? Enter the day. If it is still in the field, harvest by ${tx.date(lastHarvestOn)}.`,
            `কেটে ফেলেছেন? দিনটি লিখুন। এখনো মাঠে থাকলে ${tx.date(lastHarvestOn)}-এর মধ্যে কাটুন।`,
          );
      action = (
        <>
          <button className="button primary" type="button" onClick={() => record('harvestedDate')}>
            {t(`I harvested ${tx.crop(crop)} today`, `আজ ${tx.crop(crop)} কেটেছি`)}
          </button>
          {ctx.openFix && (
            <button
              className="button secondary"
              type="button"
              onClick={() => ctx.openFix?.(current.a.item.season)}
            >
              {t('I harvested on another day', 'অন্য দিনে কেটেছি')}
            </button>
          )}
        </>
      );
    }
  } else {
    big = tx.n(dayCount(sow, today) + 1);
    small = t(`day of ${crop.days}`, `দিন · মোট ${tx.n(crop.days)}`);
    const jobs = dayItems([current], today).filter((i) => i.kind === 'job');
    if (win && win.status === 'due') {
      head = t('Give 1 irrigation this week', 'এই সপ্তাহে ১টি সেচ দিন');
      sub = t(
        `About ${pumpHours(win.mm, areaHa)} hours of a shallow pump · by ${tx.date(win.end)}`,
        `শ্যালো পাম্পে প্রায় ${tx.n(pumpHours(win.mm, areaHa))} ঘণ্টা · ${tx.date(win.end)}-এর মধ্যে`,
      );
      action = (
        <button
          className="button primary water"
          type="button"
          onClick={() => {
            fieldLogStore.recordIrrigation(plotId, win.key, today);
            setUndo({ kind: 'irrigation', key: win.key });
          }}
        >
          {t('I irrigated today', 'আজ সেচ দিয়েছি')}
        </button>
      );
    } else if (week?.hot && crop.heat) {
      head = t('Too hot: give a light irrigation in the evening', 'বেশি গরম: বিকেলে হালকা সেচ দিন');
      sub = t(
        `About ${Math.round(week.maxC)}° by day; at ${tx.stage(crop.heat.stage)} it copes up to ${crop.heat.limitC}°`,
        `দিনে প্রায় ${tx.n(Math.round(week.maxC))}°, ${tx.stage(crop.heat.stage)} সময় সহ্য করে ${tx.n(crop.heat.limitC)}° পর্যন্ত`,
      );
    } else if (jobs.length) {
      head = itemText(jobs[0], tx, t, areaHa);
      sub = t('Today’s job', 'আজকের কাজ');
    } else {
      head = t('Nothing special today', 'আজ বিশেষ কাজ নেই');
      sub = t(
        'Walk the field: look for pests, disease or standing water.',
        'খেত ঘুরে দেখুন: পোকা, রোগ বা পানি জমেছে কি না।',
      );
    }
    if (plan?.harvest)
      extra = t(
        `Harvest planned for ${tx.date(harvest)} · in ${dayCount(today, harvest)} days`,
        `কাটার পরিকল্পনা ${tx.date(harvest)} · আর ${tx.n(dayCount(today, harvest))} দিন`,
      );
    if (win?.status === 'done' && win.doneOn)
      action = (
        <span className="rot-saved">
          ✓{' '}
          {t(
            `Irrigated this week (${tx.dateMain(win.doneOn)})`,
            `এই সপ্তাহের সেচ দেওয়া হয়েছে (${tx.dateMain(win.doneOn)})`,
          )}
        </span>
      );
  }
  const endLink = !current.sown ? (
    <button
      className="text-button rot-end-link"
      type="button"
      onClick={() => setEndSheet({ c: current, mode: 'cancel' })}
    >
      {t(`Not sowing ${tx.crop(crop)} this year?`, `এ বছর ${tx.crop(crop)} বুনবেন না?`)}
    </button>
  ) : !current.harvested ? (
    <button
      className="text-button rot-end-link"
      type="button"
      onClick={() => setEndSheet({ c: current, mode: 'lost' })}
    >
      {t('Crop damaged or lost?', 'ফসলের ক্ষতি হয়েছে বা নষ্ট হয়েছে?')}
    </button>
  ) : null;
  return (
    <>
      <section
        className={`card rot-today2 ${tone} ${kind === 'empty' ? 'empty' : seasonClass(current.a.item.season)}`}
        aria-label={t('What to do today', 'আজ কী করবেন')}
      >
        <div className="rot-today2-top">
          <span className="eyebrow">
            {t(`WHAT TO DO TODAY · ${tx.date(today)}`, `আজ কী করবেন · ${tx.date(today)}`)}
          </span>
          <span className="rot-crop-chip">{tx.crop(crop)}</span>
        </div>
        <div className="rot-wx-now">
          <WeatherGlyph icon={w.icon} size={30} />
          <span className="temp">
            <b>{w.max !== null ? `${tx.n(Math.round(w.max))}°` : '–'}</b>
            {w.min !== null && <span> / {tx.n(Math.round(w.min))}°</span>}
          </span>
          <span className="word">
            {w.kind === 'forecast'
              ? weatherWord(w, t)
              : t('Usual for this month', 'এই মাসে সাধারণত')}
          </span>
          {w.kind === 'forecast' ? (
            <>
              {w.chance !== null && (
                <span>{t(`Rain ${w.chance}%`, `বৃষ্টি ${tx.n(w.chance)}%`)}</span>
              )}
              {w.wind !== null && (
                <span>
                  {t(`Wind ${Math.round(w.wind)} km/h`, `বাতাস ${tx.n(Math.round(w.wind))} কিমি/ঘ`)}
                </span>
              )}
            </>
          ) : (
            <span>
              {t(
                `Rain ${Math.round(w.monthRain)} mm a month`,
                `মাসে বৃষ্টি ${tx.n(Math.round(w.monthRain))} মিমি`,
              )}
            </span>
          )}
          {nextDays.length > 0 && (
            <span className="next" aria-label={t('Next days', 'সামনের দিন')}>
              {nextDays.map((d) => {
                const v = dayWeather(d, weather, climate);
                return (
                  <span key={d}>
                    <small>{tx.weekday(d)}</small>
                    <WeatherGlyph icon={v.icon} size={18} />
                    <b>{v.max !== null ? `${tx.n(Math.round(v.max))}°` : '–'}</b>
                  </span>
                );
              })}
            </span>
          )}
          {hint && <p className="hint">{hint}</p>}
        </div>
        {reminders.length > 0 && (
          <div className="rot-today-reminder">
            <Bell size={18} aria-hidden="true" />
            <span>{reminders[0].text || t('Photo note', 'ছবির নোট')}</span>
            {reminders.length > 1 && <small>+{tx.n(reminders.length - 1)}</small>}
            <button
              className="text-button"
              type="button"
              onClick={() => fieldLogStore.setReminderDone(reminders[0].id, true)}
            >
              {t('Done', 'হয়ে গেছে')}
            </button>
          </div>
        )}
        <div className="rot-today2-main">
          <Ring share={share} big={big} small={small} />
          <div>
            <h2>{head}</h2>
            <p>{sub}</p>
            {extra && <p className="rot-plan-line">{extra}</p>}
          </div>
        </div>
        {flag && <p className={`rot-flag ${tone}`}>{flag}</p>}
        {(action || undo || error) && (
          <div className="rot-record">
            {action}
            {undo && (
              <button
                className="text-button"
                type="button"
                onClick={() => {
                  if (undo.kind === 'irrigation') fieldLogStore.removeIrrigation(plotId, undo.key!);
                  else {
                    const c = pcs.find((p) => p.a.item.season === undo.season);
                    // A sowing undone takes its harvest with it.
                    if (c && recordCrop)
                      setError(
                        recordCrop(
                          c,
                          undo.kind === 'plantedDate' && c.harvested ? 'both' : undo.kind,
                          '',
                        ),
                      );
                  }
                  setUndo(null);
                }}
              >
                {t('Made a mistake? Undo', 'ভুল হয়েছে? বাতিল করুন')}
              </button>
            )}
            {error && (
              <p className="notice-amber" role="alert">
                {error}
              </p>
            )}
          </div>
        )}
        {endLink}
        {current.sown && (
          <Journey
            share={share}
            t={t}
            harvestAt={plan?.harvest ? dayCount(sow, harvest) / crop.days : undefined}
          />
        )}
      </section>
      {sheetView}
    </>
  );
}

/** The card for a crop that ended without a harvest, while the field waits for the next crop. */
function EndedCard({
  ctx,
  c,
  next,
  onLost,
}: {
  ctx: Ctx;
  c: PlanCrop;
  next: PlanCrop | null;
  onLost: () => void;
}) {
  const { t, tx, today, pcs, endCrop, changePlan, openFix } = ctx;
  const [error, setError] = useState('');
  const end = c.end!,
    name = tx.crop(c.a.item.crop),
    lastSowOn = lastSow(pcs, pcs.indexOf(c));
  const run = (a: EndAction) => setError(endCrop?.(c, a) ?? '');
  const waits = next
    ? t(
        `The field is empty until ${tx.crop(next.a.item.crop)} (best time ${tx.date(next.a.item.windowStart)} – ${tx.date(next.a.item.windowEnd)}).`,
        `${tx.crop(next.a.item.crop)} পর্যন্ত জমি খালি (ভালো সময় ${tx.date(next.a.item.windowStart)} – ${tx.date(next.a.item.windowEnd)})।`,
      )
    : t('The field is empty until next year’s plan.', 'আগামী বছরের পরিকল্পনা পর্যন্ত জমি খালি।');
  const planButton = changePlan && (
    <button className="button secondary" type="button" onClick={changePlan}>
      {t('Change plan', 'পরিকল্পনা বদলান')}
    </button>
  );
  let big = '–',
    small = '',
    head = '',
    sub = '',
    flag = '',
    tone = 'stop',
    actions: ReactNode = null;
  if (end.kind === 'cancelled') {
    small = t('cancelled', 'বাতিল');
    head = t(`${name} is cancelled for this year`, `এ বছরের জন্য ${name} বাতিল`);
    sub = end.auto
      ? t(
          `It was not sown by ${tx.date(lastSowOn)}, the last sowing day.`,
          `শেষ বোনার দিন ${tx.date(lastSowOn)}-এর মধ্যে বোনা হয়নি।`,
        )
      : t(
          `Cancelled on ${tx.date(end.date)}: ${cancelReasonText(end.reason, t)}.`,
          `${tx.date(end.date)} বাতিল করা হয়েছে: ${cancelReasonText(end.reason, t)}।`,
        );
    flag = `${waits} ${t('Change the plan to grow a short crop in the gap.', 'ফাঁকা সময়ে ছোট মেয়াদের ফসল করতে পরিকল্পনা বদলান।')}`;
    actions = (
      <>
        {planButton}
        {!end.auto && today <= lastSowOn && (
          <button
            className="button secondary"
            type="button"
            onClick={() => run({ kind: 'restore' })}
          >
            {t(`Restore ${name}`, `${name} ফিরিয়ে আনুন`)}
          </button>
        )}
        {end.auto && openFix && (
          <button className="text-button" type="button" onClick={() => openFix(c.a.item.season)}>
            {t('I did sow it: enter the day', 'বুনেছিলাম: দিনটি লিখুন')}
          </button>
        )}
      </>
    );
  } else if (end.kind === 'lost') {
    const again = today <= lastSowOn;
    tone = again ? 'warn' : 'stop';
    big = again ? tx.n(dayCount(today, lastSowOn)) : '–';
    small = again ? t('days to sow again', 'দিন আবার বোনার') : t('lost', 'নষ্ট');
    head = t(
      `${name} was lost on ${tx.date(end.date)}`,
      `${tx.date(end.date)} ${name} নষ্ট হয়েছে`,
    );
    sub = `${lossReasonText(end.reason, t)}${t('. The field is free.', '। জমি এখন খালি।')}`;
    flag = again
      ? t(
          `There is still time to sow ${name} again: the last sowing day is ${tx.date(lastSowOn)}. It will be late, so the crop will be smaller.`,
          `আবার ${name} বোনার সময় আছে: শেষ বোনার দিন ${tx.date(lastSowOn)}। দেরি হওয়ায় ফলন কম হবে।`,
        )
      : `${t(`It is too late to sow ${name} again.`, `আবার ${name} বোনার সময় নেই।`)} ${waits}`;
    actions = (
      <>
        {again && (
          <button className="button primary" type="button" onClick={() => run({ kind: 'again' })}>
            {t(`I sowed ${name} again today`, `আজ আবার ${name} বুনেছি`)}
          </button>
        )}
        {planButton}
        <button className="text-button" type="button" onClick={() => run({ kind: 'unlose' })}>
          {t('Undo loss', 'নষ্ট বাতিল করুন')}
        </button>
      </>
    );
  } else {
    small = t('closed', 'বন্ধ');
    head = t(`${name} is closed`, `${name} বন্ধ হয়েছে`);
    sub = t(
      `No harvest day was entered by ${tx.date(plusDays(end.date, -1))}.`,
      `${tx.date(plusDays(end.date, -1))}-এর মধ্যে কাটার দিন লেখা হয়নি।`,
    );
    flag = next
      ? t(
          `The plan moves on to ${tx.crop(next.a.item.crop)}. If you did harvest, enter the day so the record is right. If the crop failed, say so.`,
          `পরিকল্পনা ${tx.crop(next.a.item.crop)}-এ এগিয়েছে। কেটে থাকলে দিনটি লিখুন, যাতে হিসাব ঠিক থাকে। ফসল নষ্ট হলে সেটি জানান।`,
        )
      : t(
          'If you did harvest, enter the day so the record is right. If the crop failed, say so.',
          'কেটে থাকলে দিনটি লিখুন, যাতে হিসাব ঠিক থাকে। ফসল নষ্ট হলে সেটি জানান।',
        );
    actions = (
      <>
        {openFix && (
          <button
            className="button secondary"
            type="button"
            onClick={() => openFix(c.a.item.season)}
          >
            {t('I harvested on…', 'কেটেছিলাম…')}
          </button>
        )}
        <button className="button secondary" type="button" onClick={onLost}>
          {t('The crop was lost', 'ফসল নষ্ট হয়েছে')}
        </button>
      </>
    );
  }
  return (
    <section
      className={`card rot-today2 ${tone} ${seasonClass(c.a.item.season)}`}
      aria-label={t('What to do today', 'আজ কী করবেন')}
    >
      <div className="rot-today2-top">
        <span className="eyebrow">
          {t(`WHAT TO DO TODAY · ${tx.date(today)}`, `আজ কী করবেন · ${tx.date(today)}`)}
        </span>
        <span className="rot-crop-chip x">{name}</span>
      </div>
      <div className="rot-today2-main">
        <Ring share={0} big={big} small={small} />
        <div>
          <h2>{head}</h2>
          <p>{sub}</p>
        </div>
      </div>
      <p className={`rot-flag ${tone}`}>{flag}</p>
      <div className="rot-record">{actions}</div>
      {error && (
        <p className="notice-amber" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}

/** Not sowing a crop this year, or a sown crop lost or harvested early. */
function EndSheet({
  ctx,
  c,
  mode,
  onClose,
}: {
  ctx: Ctx;
  c: PlanCrop;
  mode: 'cancel' | 'lost';
  onClose: () => void;
}) {
  const { t, tx, today, pcs, endCrop } = ctx;
  const name = tx.crop(c.a.item.crop),
    sow = c.a.item.sow,
    // An early harvest is possible from two weeks after sowing; before that there is no day to pick.
    earlyFrom = plusDays(sow, earlyHarvestDays);
  const [cancelReason, setCancelReason] = useState<CancelReason>('no-seed'),
    [lossReason, setLossReason] = useState<LossReason>('flood'),
    [what, setWhat] = useState<'lost' | 'early'>('lost'),
    [date, setDate] = useState(today),
    [text, setText] = useState(''),
    [saveNote, setSaveNote] = useState(true),
    [error, setError] = useState('');
  const submit = () => {
    const message =
      endCrop?.(
        c,
        mode === 'cancel'
          ? { kind: 'cancel', reason: cancelReason }
          : what === 'lost'
            ? { kind: 'lose', date, reason: lossReason, note: text.trim(), saveNote }
            : { kind: 'early', date },
      ) ?? '';
    if (message) setError(message);
    else onClose();
  };
  const choice = <T extends string>(
    values: readonly T[],
    value: T,
    set: (v: T) => void,
    label: (v: T) => string,
  ) => (
    <div className="rot-choice">
      {values.map((v) => (
        <button key={v} type="button" aria-pressed={v === value} onClick={() => set(v)}>
          {label(v)}
        </button>
      ))}
    </div>
  );
  return (
    <Dialog
      className="sheet"
      title={
        mode === 'cancel'
          ? t(`Not sowing ${name} this year?`, `এ বছর ${name} বুনবেন না?`)
          : t(`${name} damaged or lost?`, `${name}: ক্ষতি হয়েছে বা নষ্ট?`)
      }
      onClose={onClose}
    >
      <div className="rot-end-sheet">
        {mode === 'cancel' ? (
          <>
            <p>
              {t(
                `${name} will be cancelled for this year. The other crops of the plan stay as they are. You can restore it until ${tx.date(lastSow(pcs, pcs.indexOf(c)))}.`,
                `এ বছরের জন্য ${name} বাতিল হবে। পরিকল্পনার অন্য ফসল যেমন আছে থাকবে। ${tx.date(lastSow(pcs, pcs.indexOf(c)))} পর্যন্ত ফিরিয়ে আনা যাবে।`,
              )}
            </p>
            <p className="rot-end-label">{t('Why?', 'কেন?')}</p>
            {choice(cancelReasons, cancelReason, setCancelReason, (r) => cancelReasonText(r, t))}
          </>
        ) : (
          <>
            <div className="rot-seg" role="group" aria-label={t('What happened', 'কী হয়েছে')}>
              <button type="button" aria-pressed={what === 'lost'} onClick={() => setWhat('lost')}>
                {t('The crop was lost', 'ফসল নষ্ট হয়েছে')}
              </button>
              <button
                type="button"
                aria-pressed={what === 'early'}
                onClick={() => setWhat('early')}
              >
                {t('Harvested early', 'আগেই কেটেছি')}
              </button>
            </div>
            <p className="hint">
              {what === 'lost'
                ? t(
                    'If the crop survived the damage, write a note instead. Only a lost crop is ended.',
                    'ক্ষতির পরও ফসল টিকে থাকলে বরং একটি নোট লিখুন। শুধু নষ্ট ফসলই শেষ করা হয়।',
                  )
                : t(
                    'Cut green or for fodder, before the crop was ripe.',
                    'পাকার আগেই কাঁচা বা গো-খাদ্য হিসেবে কাটা।',
                  )}
            </p>
            {what === 'early' && earlyFrom > today ? (
              <p className="notice-amber">
                {t(
                  `${name} was sown on ${tx.date(sow)}. An early harvest can be entered from ${tx.date(earlyFrom)}, two weeks after sowing.`,
                  `${name} বোনা হয়েছে ${tx.date(sow)}। আগে কাটা লেখা যাবে ${tx.date(earlyFrom)} থেকে, বোনার দুই সপ্তাহ পরে।`,
                )}
              </p>
            ) : (
              <div className="form-field">
                <label htmlFor="end-date">
                  {what === 'lost' ? t('Lost on', 'নষ্ট হয়েছে') : t('Harvested on', 'কাটা হয়েছে')}
                </label>
                <input
                  id="end-date"
                  type="date"
                  value={date}
                  min={what === 'lost' ? sow : earlyFrom}
                  max={today}
                  onChange={(e) => e.target.value && setDate(e.target.value)}
                />
              </div>
            )}
            {what === 'lost' && (
              <>
                <p className="rot-end-label">{t('What happened', 'কী হয়েছিল')}</p>
                {choice(lossReasons, lossReason, setLossReason, (r) => lossReasonText(r, t))}
                <div className="form-field">
                  <label htmlFor="end-text">
                    {t('Details (optional)', 'বিস্তারিত (ইচ্ছা হলে)')}
                  </label>
                  <textarea
                    id="end-text"
                    rows={2}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                </div>
                <div className="rot-end-check">
                  <input
                    id="end-note"
                    type="checkbox"
                    checked={saveNote}
                    onChange={(e) => setSaveNote(e.target.checked)}
                  />
                  <label htmlFor="end-note">
                    {t('Also save it in Your diary', 'আপনার ডায়েরিতেও রাখুন')}
                  </label>
                </div>
              </>
            )}
          </>
        )}
        {error && (
          <p className="notice-amber" role="alert">
            {error}
          </p>
        )}
        <div className="button-row">
          <button
            className="button primary"
            type="button"
            onClick={submit}
            disabled={mode === 'lost' && what === 'early' && earlyFrom > today}
          >
            {mode === 'cancel'
              ? t(`Cancel ${name}`, `${name} বাতিল করুন`)
              : what === 'lost'
                ? t(`Mark ${name} as lost`, `${name} নষ্ট হিসেবে লিখুন`)
                : t('Save early harvest', 'আগে কাটা হিসেবে লিখুন')}
          </button>
          <button className="button secondary" type="button" onClick={onClose}>
            {t('Keep it', 'রেখে দিন')}
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function WeekDays({ ctx, onOpen }: { ctx: Ctx; onOpen: (d: string) => void }) {
  const { pcs, today, tx, t, areaHa, weather, climate } = ctx;
  return (
    <section className="rot-block" aria-label={t('Every day this week', 'এই সপ্তাহে প্রতিদিন')}>
      <div className="rot-block-head">
        <h2>{t('Every day this week', 'এই সপ্তাহে প্রতিদিন')}</h2>
        <span>{t('Tap a day for details', 'দিনে চাপ দিলে বিস্তারিত')}</span>
      </div>
      <div className="rot-days">
        {Array.from({ length: 7 }, (_, i) => plusDays(today, i)).map((d) => {
          const items = dayItems(pcs, d).slice(0, 2);
          const w = dayWeather(d, weather, climate);
          return (
            <button
              key={d}
              type="button"
              className={`rot-day-card ${d === today ? 'today' : ''}`}
              onClick={() => onOpen(d)}
            >
              <span className="when">
                <b>{d === today ? t('Today', 'আজ') : tx.weekday(d)}</b>
                <small>
                  {tx.dateMain(d)}
                  {tx.dateSub(d) ? ` · ${tx.dateSub(d)}` : ''}
                </small>
                <span className="wx">
                  <WeatherGlyph icon={w.icon} size={16} />
                  {w.max !== null ? `${tx.n(Math.round(w.max))}°` : ''}
                </span>
              </span>
              {items.length ? (
                items.map((it, k) => (
                  <span key={k} className={`rot-tip ${itemClass(it)}`}>
                    {itemText(it, tx, t, areaHa)}
                  </span>
                ))
              ) : (
                <span className="rot-tip quiet">{quietText(quietDay(pcs, d), tx, t)}</span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** A diary reminder or note shown on a calendar day. */
interface DayEvent {
  key: string;
  kind: 'reminder' | 'note';
  text: string;
  time?: NoteReminder['time'];
  done?: boolean;
  tagClass: string;
}
/**
 * The diary on one day: reminders due that day (by time), then notes written for that day. A note
 * whose reminder is on the same day shows once, as the reminder.
 */
function dayEvents(notes: FieldNote[], date: string, t: Translate): DayEvent[] {
  const text = (n: FieldNote) => n.text.trim() || t('Photo note', 'ছবির নোট');
  const reminders = notes
    .filter((n) => n.reminder?.date === date)
    .sort((a, b) => reminderMinutes(a.reminder!.time) - reminderMinutes(b.reminder!.time))
    .map((n): DayEvent => ({
      key: `r${n.id}`,
      kind: 'reminder',
      text: text(n),
      time: n.reminder!.time,
      done: n.reminder!.done,
      tagClass: n.tags?.[0] ? `tag-${n.tags[0]}` : '',
    }));
  const written = notes
    .filter((n) => n.date === date && n.reminder?.date !== date)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((n): DayEvent => ({
      key: `n${n.id}`,
      kind: 'note',
      text: text(n),
      tagClass: n.tags?.[0] ? `tag-${n.tags[0]}` : '',
    }));
  return [...reminders, ...written];
}
function EventChip({ e, t }: { e: DayEvent; t: Translate }) {
  return e.kind === 'reminder' ? (
    <span className={`rot-ev rem${e.done ? ' done' : ''}`}>
      <Bell size={11} aria-hidden="true" />
      <span>
        {reminderTimeLabel(e.time!, t)} {e.text}
      </span>
    </span>
  ) : (
    <span className={`rot-ev note ${e.tagClass}`}>
      <span>{e.text}</span>
    </span>
  );
}
/** On a phone the month shows dots; the chosen day (or today) is listed under it. */
function DayAgenda({ ctx, date, onOpen }: { ctx: Ctx; date: string; onOpen: (d: string) => void }) {
  const { pcs, notes, tx, t, areaHa } = ctx;
  const items = dayItems(pcs, date),
    evs = dayEvents(notes, date, t);
  return (
    <div className="rot-agenda">
      <div className="rot-agenda-head">
        <h3>{tx.dateMain(date)}</h3>
        <button className="text-button" type="button" onClick={() => onOpen(date)}>
          {t('Open the day · add a note', 'দিনটি খুলুন · নোট লিখুন')}
        </button>
      </div>
      {!items.length && !evs.length && (
        <p className="rot-note-small">{t('Nothing on this day.', 'এই দিনে কিছু নেই।')}</p>
      )}
      {evs
        .filter((e) => e.kind === 'reminder')
        .map((e) => (
          <button key={e.key} type="button" className="rot-ag" onClick={() => onOpen(date)}>
            <span className="when">{reminderTimeLabel(e.time!, t)}</span>
            <span className={`box rem${e.done ? ' done' : ''}`}>{e.text}</span>
          </button>
        ))}
      {items.map((it, i) => (
        <button key={`i${i}`} type="button" className="rot-ag" onClick={() => onOpen(date)}>
          <span className="when">{t('All day', 'সারাদিন')}</span>
          <span className={`box job ${itemClass(it)}`}>{itemText(it, tx, t, areaHa)}</span>
        </button>
      ))}
      {evs
        .filter((e) => e.kind === 'note')
        .map((e) => (
          <button key={e.key} type="button" className="rot-ag" onClick={() => onOpen(date)}>
            <span className="when">{t('Note', 'নোট')}</span>
            <span className={`box note ${e.tagClass}`}>{e.text}</span>
          </button>
        ))}
    </div>
  );
}

function MonthCalendar({
  ctx,
  month,
  setMonth,
  selected,
  onOpen,
}: {
  ctx: Ctx;
  month: string;
  setMonth: (m: string) => void;
  selected: string | null;
  onOpen: (d: string) => void;
}) {
  const { pcs, today, tx, t, notes, areaHa } = ctx;
  // On a phone a tap picks the day for the list under the month; elsewhere it opens the day.
  const [picked, setPicked] = useState<string | null>(null);
  const tap = (d: string) => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches)
      setPicked(d);
    else onOpen(d);
  };
  const first = `${month}-01`,
    count = daysInMonth(first);
  // Weeks start on Saturday, as on Bangladeshi wall calendars.
  const lead = (tx.weekdayIndex(first) + 1) % 7;
  const shift = (k: number) => {
    const m = monthIndex(first) + k;
    setMonth(isoOf(yearOf(first) + Math.floor(m / 12), (((m % 12) + 12) % 12) + 1, 1).slice(0, 7));
  };
  const windows = pcs
    .filter((c) => c.end?.kind !== 'cancelled')
    .flatMap((c) => c.windows)
    .filter((w) => w.status !== 'past');
  const done = windows.filter((w) => w.status === 'done').length,
    missed = windows.filter((w) => w.status === 'missed').length;
  const bStart = tx.dateSub(first)?.split(' ')[1],
    bEnd = tx.dateSub(plusDays(first, count - 1))?.split(' ')[1];
  return (
    <section className="rot-block" aria-label={t('Calendar', 'ক্যালেন্ডার')}>
      <div className="rot-block-head">
        <h2>{t('Calendar', 'ক্যালেন্ডার')}</h2>
        <span>
          {t('Tap a day for weather, jobs and notes', 'দিনে চাপ দিলে আবহাওয়া, কাজ ও নোট')}
        </span>
      </div>
      <div className="card rot-month">
        <div className="rot-irr-progress">
          <b>{t('Irrigation', 'সেচের হিসাব')}</b>
          <span className="meter" aria-hidden="true">
            <i style={{ width: `${windows.length ? (done / windows.length) * 100 : 0}%` }} />
          </span>
          <span>
            {t(`${done}/${windows.length} done`, `${tx.n(done)}/${tx.n(windows.length)} দেওয়া`)}
            {missed > 0 && t(` · ${missed} missed`, ` · ${tx.n(missed)}টি বাকি`)}
          </span>
        </div>
        <div className="rot-month-nav">
          <button
            className="icon-button"
            type="button"
            onClick={() => shift(-1)}
            aria-label={t('Previous month', 'আগের মাস')}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <b>
              {tx.month(first)} {tx.n(yearOf(first))}
            </b>
            {bStart && <span>{bStart === bEnd ? bStart : `${bStart}–${bEnd}`}</span>}
          </div>
          <button
            className="icon-button"
            type="button"
            onClick={() => shift(1)}
            aria-label={t('Next month', 'পরের মাস')}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        <div className="rot-grid7">
          {[6, 0, 1, 2, 3, 4, 5].map((d) => (
            <span key={d} className="wd">
              {tx.weekdayName(d)}
            </span>
          ))}
          {Array.from({ length: lead }, (_, i) => (
            <span key={`lead${i}`} aria-hidden="true" />
          ))}
          {Array.from({ length: count }, (_, i) => {
            const d = plusDays(first, i);
            const on = cropOn(pcs, d),
              items = dayItems(pcs, d),
              w = windowOn(pcs, d);
            const sowWindow =
              !on &&
              pcs.some(
                (c) => !c.sown && !c.end && c.a.item.windowStart <= d && d <= c.a.item.windowEnd,
              );
            const main =
              items.find(
                (x) =>
                  x.kind === 'sow' ||
                  x.kind === 'harvest' ||
                  x.kind === 'lost' ||
                  x.kind === 'irrigated' ||
                  (x.kind === 'job' && x.job.kind === 'fertiliser'),
              ) ??
              items.find(
                (x) =>
                  (x.kind === 'irrigate' && x.first) ||
                  (x.kind === 'missed' && x.window.start === d),
              );
            const evs = dayEvents(notes, d, t),
              shown = evs.slice(0, main ? 2 : 3);
            const sub = tx.dateSub(d);
            return (
              <button
                key={d}
                type="button"
                className={[
                  'rot-cell',
                  on ? `crop ${seasonClass(on.a.item.season)}` : '',
                  sowWindow ? 'window' : '',
                  items.some((x) => x.kind === 'heat') ? 'hot' : '',
                  d === today ? 'today' : '',
                  d === (selected ?? picked) ? 'sel' : '',
                ].join(' ')}
                aria-label={`${tx.date(d)}${items.length ? ': ' + items.map((x) => itemText(x, tx, t, areaHa)).join(', ') : ''}${evs.length ? ` · ${evs.map((e) => e.text).join(', ')}` : ''}`}
                onClick={() => tap(d)}
              >
                {w && (
                  <span
                    className={`band ${w.status === 'done' ? 'done' : w.status === 'missed' ? 'missed' : w.status === 'past' ? 'past' : 'due'}`}
                  />
                )}
                <span className="g">{tx.n(Number(d.slice(8, 10)))}</span>
                <span className="b">
                  {sub ? (sub.startsWith(`${tx.n(1)} `) ? sub : sub.split(' ')[0]) : ''}
                </span>
                {main && <span className={`tag ${itemClass(main)}`}>{itemTag(main, t)}</span>}
                {/* Diary reminders and notes, as events; on a phone they shrink to dots. */}
                {shown.map((e) => (
                  <EventChip key={e.key} e={e} t={t} />
                ))}
                {evs.length > shown.length && (
                  <span className="rot-ev-more">
                    {t(
                      `+${evs.length - shown.length} more`,
                      `আরও ${tx.n(evs.length - shown.length)}টি`,
                    )}
                  </span>
                )}
                {evs.length > 0 && (
                  <span className="rot-ev-dots" aria-hidden="true">
                    {evs.slice(0, 3).map((e) => (
                      <i
                        key={e.key}
                        className={e.kind === 'reminder' ? 'rem' : `note ${e.tagClass}`}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <p className="rot-cal-legend">
          <span>
            <i className="water" />
            {t('Irrigation week', 'সেচের সপ্তাহ')}
          </span>
          <span>
            <i className="done" />
            {t('Irrigated', 'সেচ দেওয়া হয়েছে')}
          </span>
          <span>
            <i className="risk" />
            {t('Missed / too hot (bottom)', 'সেচ বাকি / বেশি গরম (নিচে)')}
          </span>
          <span>
            <i className="fert" />
            {t('Fertiliser', 'সার')}
          </span>
          <span>
            <i className="window" />
            {t('Sowing window', 'বোনার সময়')}
          </span>
          {pcs.map((c) => (
            <span key={c.a.item.crop.id}>
              <i className={`tint ${seasonClass(c.a.item.season)}`} />
              {tx.crop(c.a.item.crop)}
            </span>
          ))}
          <span>
            <i className="rem" />
            {t('Reminder', 'রিমাইন্ডার')}
          </span>
          <span>
            <i className="note" />
            {t('Diary note (colour of its tag)', 'ডায়েরির নোট (ট্যাগের রঙে)')}
          </span>
          <span>
            <i className="today" />
            {t('Today', 'আজ')}
          </span>
        </p>
        <DayAgenda ctx={ctx} date={picked ?? today} onOpen={onOpen} />
      </div>
    </section>
  );
}

/** Sowing and harvest on one day of the calendar: any day up to today, with undo. */
function CropRecord({ ctx, date }: { ctx: Ctx; date: string }) {
  const { pcs, today, tx, t, recordCrop } = ctx;
  const [error, setError] = useState(''),
    [confirmUndo, setConfirmUndo] = useState(false);
  if (!recordCrop) return null;
  const plan = (c: PlanCrop) => ctx.planned?.[c.a.item.season];
  const plannedSowHere = pcs.find((c) => !c.sown && plan(c)?.sow === date),
    plannedHarvestHere = pcs.find((c) => (c.sown || !!plan(c)?.sow) && plan(c)?.harvest === date);
  const sownHere = pcs.find((c) => c.sown && c.a.item.sow === date),
    harvestedHere = pcs.find((c) => c.harvested && c.a.item.harvest === date),
    // Only days that can be this crop's harvest or sowing (see recordRange).
    // A planned sowing allows planning the harvest (days after today only).
    growing = pcs.find(
      (c) =>
        (c.sown || (!!plan(c)?.sow && date > today)) &&
        !c.harvested &&
        c.end?.kind !== 'lost' &&
        inRange(date, recordRange(pcs, c, 'harvestedDate')),
    ),
    sowable = pcs.find((c) => !c.sown && inRange(date, recordRange(pcs, c, 'plantedDate')));
  if (!sownHere && !harvestedHere && !growing && !sowable && !plannedSowHere && !plannedHarvestHere)
    return null;
  const run = (c: PlanCrop, kind: RecordKind, value: string) => {
    setConfirmUndo(false);
    setError(recordCrop(c, kind, value));
  };
  const name = (c: PlanCrop) => tx.crop(c.a.item.crop);
  return (
    <>
      <h3>{t('Sowing and harvest', 'বোনা ও কাটা')}</h3>
      <div className="rot-crop-record">
        {sownHere && (
          <p className="rot-record">
            <span className="rot-saved">
              ✓ {t(`${name(sownHere)} sown on this day`, `এই দিনে ${name(sownHere)} বোনা হয়েছে`)}
            </span>
            <button
              className="text-button"
              type="button"
              onClick={() =>
                sownHere.harvested ? setConfirmUndo(true) : run(sownHere, 'plantedDate', '')
              }
            >
              {t('Undo', 'বাতিল')}
            </button>
          </p>
        )}
        {sownHere && confirmUndo && (
          <div className="notice-amber rot-confirm-undo" role="alert">
            <p>
              {t(
                `${name(sownHere)} also has a harvest recorded on ${tx.dateMain(sownHere.a.item.harvest)}. Undoing the sowing removes that harvest too.`,
                `${name(sownHere)} কাটার দিনও লেখা আছে: ${tx.dateMain(sownHere.a.item.harvest)}। বোনা বাতিল করলে কাটার দিনও মুছে যাবে।`,
              )}
            </p>
            <div className="button-row">
              <button
                className="button primary"
                type="button"
                onClick={() => run(sownHere, 'both', '')}
              >
                {t('Remove both', 'দুটোই মুছুন')}
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() => setConfirmUndo(false)}
              >
                {t('Keep them', 'রেখে দিন')}
              </button>
            </div>
          </div>
        )}
        {harvestedHere && harvestedHere.end?.kind === 'lost' && (
          <p className="rot-record rot-lost-row">
            <span className="rot-lost">
              ✕{' '}
              {t(
                `${name(harvestedHere)} lost on this day · ${lossReasonText(harvestedHere.end.reason, t)}`,
                `এই দিনে ${name(harvestedHere)} নষ্ট হয়েছে · ${lossReasonText(harvestedHere.end.reason, t)}`,
              )}
            </span>
            <button
              className="text-button"
              type="button"
              onClick={() => setError(ctx.endCrop?.(harvestedHere, { kind: 'unlose' }) ?? '')}
            >
              {t('Undo', 'বাতিল')}
            </button>
          </p>
        )}
        {harvestedHere && harvestedHere.end?.kind !== 'lost' && (
          <p className="rot-record">
            <span className="rot-saved">
              ✓{' '}
              {ctx.recs?.[harvestedHere.a.item.season]?.earlyHarvest
                ? t(
                    `${name(harvestedHere)} harvested early on this day`,
                    `এই দিনে ${name(harvestedHere)} আগেই কাটা হয়েছে`,
                  )
                : t(
                    `${name(harvestedHere)} harvested on this day`,
                    `এই দিনে ${name(harvestedHere)} কাটা হয়েছে`,
                  )}
            </span>
            <button
              className="text-button"
              type="button"
              onClick={() => run(harvestedHere, 'harvestedDate', '')}
            >
              {t('Undo', 'বাতিল')}
            </button>
          </p>
        )}
        {date <= today && growing && !harvestedHere && (
          <button
            className="button primary"
            type="button"
            onClick={() => run(growing, 'harvestedDate', date)}
          >
            {t(`I harvested ${name(growing)} on this day`, `এই দিনে ${name(growing)} কেটেছি`)}
          </button>
        )}
        {date <= today && sowable && (
          <button
            className="button primary"
            type="button"
            onClick={() => run(sowable, 'plantedDate', date)}
          >
            {t(`I sowed ${name(sowable)} on this day`, `এই দিনে ${name(sowable)} বুনেছি`)}
          </button>
        )}
        {plannedSowHere && (
          <p className="rot-record">
            <span className="rot-planned">
              {t(
                `${name(plannedSowHere)} sowing planned for this day`,
                `এই দিনে ${name(plannedSowHere)} বোনার পরিকল্পনা`,
              )}
            </span>
            <button
              className="text-button"
              type="button"
              onClick={() => run(plannedSowHere, 'plantedDate', '')}
            >
              {t('Remove', 'মুছুন')}
            </button>
          </p>
        )}
        {plannedHarvestHere && (
          <p className="rot-record">
            <span className="rot-planned">
              {t(
                `${name(plannedHarvestHere)} harvest planned for this day`,
                `এই দিনে ${name(plannedHarvestHere)} কাটার পরিকল্পনা`,
              )}
            </span>
            <button
              className="text-button"
              type="button"
              onClick={() => run(plannedHarvestHere, 'harvestedDate', '')}
            >
              {t('Remove', 'মুছুন')}
            </button>
          </p>
        )}
        {date > today && sowable && !plannedSowHere && (
          <button
            className="button secondary"
            type="button"
            onClick={() => run(sowable, 'plantedDate', date)}
          >
            {t(
              `Plan to sow ${name(sowable)} on this day`,
              `এই দিনে ${name(sowable)} বোনার পরিকল্পনা করুন`,
            )}
          </button>
        )}
        {date > today && growing && !plannedHarvestHere && (
          <button
            className="button secondary"
            type="button"
            onClick={() => run(growing, 'harvestedDate', date)}
          >
            {t(
              `Plan to harvest ${name(growing)} on this day`,
              `এই দিনে ${name(growing)} কাটার পরিকল্পনা করুন`,
            )}
          </button>
        )}
        {error && (
          <p className="notice-amber" role="alert">
            {error}
          </p>
        )}
      </div>
    </>
  );
}

function DaySheet({ ctx, date, onClose }: { ctx: Ctx; date: string; onClose: () => void }) {
  const { pcs, today, tx, t, areaHa, weather, climate, plotId, notes } = ctx;
  const on = cropOn(pcs, date),
    items = dayItems(pcs, date),
    w = dayWeather(date, weather, climate),
    win = windowOn(pcs, date),
    week = on ? weekOn(on, date) : null;
  const dayNotes = notes.filter((n) => n.date === date || n.reminder?.date === date);
  const title = `${date === today ? `${t('Today', 'আজ')} · ` : ''}${tx.weekday(date)}, ${tx.date(date)}`;
  const tracked = win && win.status !== 'past';
  return (
    <Dialog title={title} onClose={onClose} className="sheet rot-sheet">
      <p className="rot-sheet-crop">
        {on ? (
          <>
            <span className={`rot-crop-chip ${seasonClass(on.a.item.season)}`}>
              {tx.crop(on.a.item.crop)}
            </span>
            {week && stageName(week.stage, t)}
          </>
        ) : (
          t('Field empty', 'জমি খালি')
        )}
      </p>
      <div className="rot-wx-card">
        <span className="src">
          {w.kind === 'forecast'
            ? date === today
              ? t('Today’s forecast', 'আজকের পূর্বাভাস')
              : t('Forecast', 'পূর্বাভাস')
            : t(
                'Usually like this · NASA 30-year average',
                'সাধারণত এমন থাকে · নাসার ৩০ বছরের গড়',
              )}
        </span>
        <WeatherGlyph icon={w.icon} size={52} />
        <div className="t">
          <b>
            {w.kind === 'usual' ? '~' : ''}
            {w.max !== null ? `${tx.n(Math.round(w.max))}°` : '–'}
          </b>
          {w.min !== null && <span> / {tx.n(Math.round(w.min))}°</span>}
          <div>{w.kind === 'forecast' ? weatherWord(w, t) : t('Day / night', 'দিনে / রাতে')}</div>
        </div>
        <div className="grid">
          {w.kind === 'forecast' ? (
            <>
              <div>
                {t('Rain chance', 'বৃষ্টির সম্ভাবনা')}
                <b>{w.chance !== null ? `${tx.n(w.chance)}%` : '–'}</b>
              </div>
              <div>
                {t('Rain', 'বৃষ্টি')}
                <b>
                  {w.rain !== null
                    ? t(`${Math.round(w.rain)} mm`, `${tx.n(Math.round(w.rain))} মিমি`)
                    : '–'}
                </b>
              </div>
              <div>
                {t('Wind', 'বাতাস')}
                <b>
                  {w.wind !== null
                    ? t(`${Math.round(w.wind)} km/h`, `${tx.n(Math.round(w.wind))} কিমি/ঘ`)
                    : '–'}
                </b>
              </div>
            </>
          ) : (
            <>
              <div>
                {t('Rain this month', 'মাসে বৃষ্টি')}
                <b>{t(`${Math.round(w.monthRain)} mm`, `${tx.n(Math.round(w.monthRain))} মিমি`)}</b>
              </div>
              <div>
                {t('Topsoil (NASA)', 'উপরের মাটি (নাসা)')}
                <b>{wetWord(w.wetness, t)}</b>
              </div>
            </>
          )}
        </div>
      </div>
      {date < today && w.kind === 'usual' && (
        <p className="rot-note-small">
          {t(
            'Ritu keeps no weather record for past days, so this is the usual weather.',
            'আগের দিনের আবহাওয়া ঋতু রাখে না, তাই এখানে সাধারণ আবহাওয়া দেখানো হলো।',
          )}
        </p>
      )}
      {on && week && (
        <p className="rot-note-small">
          {t(
            `${tx.crop(on.a.item.crop)} uses about ${(week.use / 7).toFixed(1)} mm of water a day at this stage.`,
            `এ সময় ${tx.crop(on.a.item.crop)} ফসলে দিনে প্রায় ${tx.n((week.use / 7).toFixed(1))} মিমি পানি লাগে।`,
          )}
        </p>
      )}
      <h3>{t('Jobs on this day', 'এই দিনের কাজ')}</h3>
      <div className="rot-tips">
        {items.length ? (
          items.map((it, k) => (
            <span key={k} className={`rot-tip ${itemClass(it)}`}>
              {itemText(it, tx, t, areaHa)}
            </span>
          ))
        ) : (
          <span className="rot-tip quiet">{quietText(quietDay(pcs, date), tx, t)}</span>
        )}
      </div>
      <CropRecord ctx={ctx} date={date} />
      {tracked && win.status !== 'done' && date <= today && (
        <button
          className="button primary water"
          type="button"
          onClick={() => fieldLogStore.recordIrrigation(plotId, win.key, date)}
        >
          {t('I irrigated on this day', 'এই দিনে সেচ দিয়েছি')}
        </button>
      )}
      {tracked && win.status === 'done' && win.doneOn && (
        <p className="rot-record">
          <span className="rot-saved">
            ✓{' '}
            {t(
              `Irrigated on ${tx.dateMain(win.doneOn)}`,
              `সেচ দেওয়া হয়েছে ${tx.dateMain(win.doneOn)}`,
            )}
          </span>
          <button
            className="text-button"
            type="button"
            onClick={() => fieldLogStore.removeIrrigation(plotId, win.key)}
          >
            {t('Undo', 'বাতিল')}
          </button>
        </p>
      )}
      {tracked && win.status !== 'done' && date > today && (
        <p className="rot-note-small">
          {t('Mark the irrigation here when the day comes.', 'দিনটি এলে এখানে সেচ লিখে রাখুন।')}
        </p>
      )}
      <h3>
        {t('Notes', 'নোট')}{' '}
        {dayNotes.length > 0 && <span className="rot-count">{tx.n(dayNotes.length)}</span>}
      </h3>
      <NoteList notes={dayNotes} today={today} />
      <NoteComposer
        key={date}
        plotId={plotId}
        date={date}
        weather={weather}
        placeholder={
          date === today
            ? t('What did you see or do in the field today?', 'আজ খেতে কী দেখলেন বা করলেন?')
            : t(
                'What did you see or do in the field on this day?',
                'এই দিনে খেতে কী দেখলেন বা করলেন?',
              )
        }
      />
    </Dialog>
  );
}

function BigEvents({ ctx, onOpen }: { ctx: Ctx; onOpen: (d: string) => void }) {
  const { pcs, today, tx, t, areaHa } = ctx;
  const events = bigEvents(pcs, today);
  if (!events.length) return null;
  return (
    <section className="rot-block" aria-label={t('Big events ahead', 'সামনের বড় ঘটনা')}>
      <div className="rot-block-head">
        <h2>{t('Big events ahead', 'সামনের বড় ঘটনা')}</h2>
        <span>{t(`Next ${events.length}`, `পরের ${tx.n(events.length)}টি`)}</span>
      </div>
      <ol className="rot-timeline">
        {events.map((e) => {
          const text = eventText(e, tx, t, areaHa);
          const cls = e.kind === 'job' ? (e.job.kind === 'fertiliser' ? 'fert' : 'stage') : e.kind;
          return (
            <li key={`${e.kind}${e.date}${e.c.a.item.crop.id}`} className={cls}>
              <span className="node" aria-hidden="true" />
              <button type="button" onClick={() => onOpen(e.date)}>
                <b>{text.title}</b>
                <span>
                  {tx.date(e.date)} · {text.note}
                </span>
              </button>
              <span className="in">{inDays(dayCount(today, e.date), tx, t)}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function dayParam() {
  if (typeof window === 'undefined') return null;
  const day = new URLSearchParams(window.location.search).get('day');
  return day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
}

/** The plot's year plan on the calendar page: at a glance, today, every day, the calendar, notes and big events. */
export function RotationCalendar({
  farm,
  today,
  weather,
}: {
  farm: SeasonFarm;
  today: string;
  weather: LiveWeather | null;
}) {
  const { t, language } = usePlanner(),
    { state } = useSeasonFarms(),
    log = useFieldLog().state;
  const tx = rotationText(t, language);
  const plot = state.plots?.find((p) => p.id === farm.plotId);
  const climate = useMemo(
    () => (farm.context.normal ? monthlyClimate(farm.context.normal) : null),
    [farm.context.normal],
  );
  const plan = plot?.plan;
  // Soil pH: the farmer's test when there is one, otherwise the soil-map estimate at the pin.
  const soilMap = useSoilReference(farm.site).soil;
  const phValue = farm.field.soilEvidence?.ph ?? soilMap?.median,
    phMeasured = farm.field.soilEvidence !== undefined;
  const assessment = useMemo(
    () =>
      plan && climate
        ? assessPlan(plan.seasons, plan.from, climate, {
            // The plot's own water and drainage where it has them (see plotProfile).
            soil: farm.field.soil,
            drainage: plot?.overrides?.drainage ?? farm.field.drainage,
            irrigation: plot?.overrides?.irrigation ?? farm.field.irrigation,
            areaHa: plot!.areaHa,
            lastYear: plot!.lastYear,
            ...(phValue !== undefined ? { ph: { value: phValue, measured: phMeasured } } : {}),
          })
        : null,
    [
      plan,
      climate,
      farm.field.soil,
      farm.field.drainage,
      farm.field.irrigation,
      plot,
      phValue,
      phMeasured,
    ],
  );
  // Opened from a reminder or a note: /plan?day=YYYY-MM-DD.
  const [sheet, setSheet] = useState<string | null>(() => dayParam()),
    [month, setMonth] = useState<string | null>(() => dayParam()?.slice(0, 7) ?? null),
    [detailId, setDetailId] = useState<string | null>(null),
    // The Fix it box opened on one crop from a card ("I harvested on another day").
    [fixFocus, setFixFocus] = useState<{ season: string; n: number } | null>(null);
  const router = useRouter();
  if (!plot || !plan || !climate || !assessment || !assessment.crops.length) return null;

  const plotFarms = state.farms.filter((f) => f.plotId === plot.id && f.rotationSeason);
  const farmOf = (c: CropAssessment) =>
    c.item.season === farm.rotationSeason && farm.selection.crop === c.item.crop.catalogueId
      ? farm
      : plotFarms
          .filter(
            (f) =>
              f.rotationSeason === c.item.season && f.selection.crop === c.item.crop.catalogueId,
          )
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
  // Once sowing is recorded, a crop's weeks follow the real date, not the plan.
  const crops: CropAssessment[] = assessment.crops.map((c) => {
    const f = farmOf(c);
    // A planned sowing or harvest day moves the crop's calendar like a recorded one.
    const sowDay = f?.plantedDate || f?.plannedSowDate;
    if (!f || !sowDay) return c;
    // A lost crop ends on the day it was lost.
    const lostOn = (f.plantedDate && f.lost?.date) || '';
    const weeks = cropWeeks(c.item.crop, sowDay, climate).filter(
      (w) => !lostOn || w.start < lostOn,
    );
    return {
      ...c,
      item: {
        ...c.item,
        sow: sowDay,
        harvest:
          f.harvestedDate || lostOn || f.plannedHarvestDate || plusDays(sowDay, c.item.crop.days),
      },
      weeks,
      irrigations: weeks.filter((w) => w.irrigate > 0).length,
    };
  });
  const irrigated = Object.fromEntries(
    log.irrigations.filter((r) => r.plotId === plot.id).map((r) => [r.key, r.date]),
  );
  const pcs: PlanCrop[] = planCrops(
    crops,
    {
      sown: crops.filter((c) => farmOf(c)?.plantedDate).map((c) => c.item.season),
      // A lost crop counts as harvested on the day it was lost: its season is over.
      harvested: crops
        .filter((c) => {
          const f = farmOf(c);
          return f?.harvestedDate || (f?.plantedDate && f.lost);
        })
        .map((c) => c.item.season),
      irrigated,
    },
    today,
  ).map((c, i) => ({
    ...c,
    end: cropEnd(
      crops.map((x) => x.item),
      i,
      farmOf(c.a),
      today,
      crops[i + 1] ? farmOf(crops[i + 1])?.plantedDate : undefined,
    ),
  }));
  // The crop in the field now, or the next to sow. A crop that ended without a harvest (cancelled,
  // lost, closed: see cropEnd) is passed over like a harvested one.
  const index = pcs.findIndex((c) => !c.harvested && !c.end);
  const current = index >= 0 ? pcs[index] : null;
  // Record sowing or harvest for any crop of the plan; a crop not started yet gets its calendar first.
  const recordCrop = (c: PlanCrop, kind: RecordKind, value: string) => {
    const name = tx.crop(c.a.item.crop),
      existing = farmOf(c.a);
    // A day after today is a plan: the card asks about it when the day comes.
    const planning = kind !== 'both' && !!value && value > today;
    if (planning && kind === 'plantedDate' && c.sown)
      return t(
        `${name} is already sown. Choose today or an earlier day.`,
        `${name} বোনা হয়ে গেছে। আজ বা আগের কোনো দিন বাছুন।`,
      );
    if (value && kind !== 'both') {
      // Without a recorded sowing, only a planned harvest after a planned sowing is possible.
      if (kind === 'harvestedDate' && !c.sown && !(planning && farmOf(c.a)?.plannedSowDate))
        return t('Record or plan the sowing day first.', 'আগে বোনার দিন লিখুন বা ঠিক করুন।');
      const r = recordRange(pcs, c, kind);
      if (r.min > r.max)
        return kind === 'plantedDate'
          ? t(`${name} cannot be sown any more this year.`, `এ বছর আর ${name} বোনা যায় না।`)
          : t(`${name} cannot be harvested on this day.`, `এই দিনে ${name} কাটা যায় না।`);
      if (!inRange(value, r))
        return kind === 'plantedDate'
          ? t(
              `${name} can only be sown between ${tx.dateMain(r.min)} and ${tx.dateMain(r.max)}.`,
              `${name} বোনার দিন ${tx.dateMain(r.min)} থেকে ${tx.dateMain(r.max)}-এর মধ্যে হতে হবে।`,
            )
          : t(
              `${name} can only be harvested between ${tx.dateMain(r.min)} and ${tx.dateMain(r.max)}.`,
              `${name} কাটার দিন ${tx.dateMain(r.min)} থেকে ${tx.dateMain(r.max)}-এর মধ্যে হতে হবে।`,
            );
    }
    type Patch = Parameters<typeof seasonStore.update>[1];
    const next: Patch =
      kind === 'both'
        ? {
            plantedDate: '',
            harvestedDate: '',
            plannedSowDate: '',
            plannedHarvestDate: '',
            lost: undefined,
            earlyHarvest: undefined,
            ...(existing?.harvestStartedDate ? { harvestStartedDate: '' } : {}),
          }
        : kind === 'plantedDate'
          ? planning
            ? // Sowing, or planning it, takes back a cancel.
              { plannedSowDate: value, cancelled: undefined }
            : value
              ? {
                  plantedDate: value,
                  plannedSowDate: '',
                  cancelled: undefined,
                  // A planned harvest stays only if it still fits the real sowing day.
                  ...(existing?.plannedHarvestDate &&
                  existing.plannedHarvestDate < plusDays(value, leadOf(c))
                    ? { plannedHarvestDate: '' }
                    : {}),
                }
              : {
                  plantedDate: '',
                  plannedSowDate: '',
                  plannedHarvestDate: '',
                  lost: undefined,
                  earlyHarvest: undefined,
                }
          : planning
            ? { plannedHarvestDate: value }
            : { harvestedDate: value, plannedHarvestDate: '', earlyHarvest: undefined };
    if (kind === 'both' && !existing) return '';
    const planted = next.plantedDate ?? existing?.plantedDate ?? '',
      harvested = next.harvestedDate ?? existing?.harvestedDate ?? '';
    if (harvested && !planted)
      return t(
        'This crop has a harvest recorded. Undo the harvest first, or undo both together.',
        'এই ফসলের কাটার দিন লেখা আছে। আগে কাটা বাতিল করুন, অথবা দুটো একসঙ্গে বাতিল করুন।',
      );
    if (harvested && harvested < planted)
      return t('Harvest cannot be before sowing.', 'কাটা বোনার আগে হতে পারে না।');
    return save(c, next);
  };
  // Save a change to a crop's record; a crop not started yet gets its calendar first.
  const save = (c: PlanCrop, patch: Parameters<typeof seasonStore.update>[1]) => {
    try {
      let id = farmOf(c.a)?.id;
      if (!id) {
        const field = state.fields?.find((f) => f.id === plot.fieldId);
        if (!field?.site)
          return t('This plot’s land has no location.', 'এই প্লটের জমির স্থান দেওয়া নেই।');
        id = seasonStore.create(
          farmForPlanCrop({
            item: c.a.item,
            plot,
            field,
            profile: { ...plotProfile(field.profile, plot), lastYear: plot.lastYear },
            site: field.site,
            context: farm.context,
          }),
        );
        // Starting a crop's calendar opens it; stay on the calendar being read.
        seasonStore.activate(farm.id);
      }
      seasonStore.update(id, patch);
      return '';
    } catch (e) {
      return e instanceof Error ? e.message : t('This could not be saved.', 'এটি রাখা যায়নি।');
    }
  };
  // Cancel, lose, harvest early, or take those back.
  const endCrop = (c: PlanCrop, a: EndAction): string => {
    const name = tx.crop(c.a.item.crop),
      f = farmOf(c.a),
      lastSowOn = lastSow(pcs, pcs.indexOf(c));
    const between = (min: string) =>
      t(
        `Choose a day from ${tx.dateMain(min)} to today.`,
        `${tx.dateMain(min)} থেকে আজের মধ্যে একটি দিন বাছুন।`,
      );
    switch (a.kind) {
      case 'cancel':
        if (f?.plantedDate)
          return t(
            `${name} is sown. If it was destroyed, mark it as lost.`,
            `${name} বোনা হয়ে গেছে। নষ্ট হলে সেটি জানান।`,
          );
        return save(c, { cancelled: { date: today, reason: a.reason }, plannedSowDate: '' });
      case 'restore':
        if (today > lastSowOn)
          return t(`It is too late to sow ${name} this year.`, `এ বছর আর ${name} বোনার সময় নেই।`);
        return save(c, { cancelled: undefined });
      case 'lose': {
        if (!f?.plantedDate) return t('Record the sowing day first.', 'আগে বোনার দিন লিখুন।');
        if (a.date < f.plantedDate || a.date > today) return between(f.plantedDate);
        const message = save(c, {
          lost: { date: a.date, reason: a.reason },
          plannedHarvestDate: '',
        });
        if (!message && a.saveNote) {
          const tag = lossTag(a.reason);
          fieldLogStore.addNote({
            plotId: plot.id,
            date: a.date,
            text: `${t(`${name} lost`, `${name} নষ্ট হয়েছে`)}: ${lossReasonText(a.reason, t)}${a.note ? `${t('.', '।')} ${a.note}` : ''}`,
            ...(tag ? { tags: [tag] } : {}),
          });
        }
        return message;
      }
      case 'unlose':
        return save(c, { lost: undefined });
      case 'early': {
        if (!f?.plantedDate) return t('Record the sowing day first.', 'আগে বোনার দিন লিখুন।');
        const min = plusDays(f.plantedDate, earlyHarvestDays);
        if (a.date < min || a.date > today) return between(min);
        return save(c, { harvestedDate: a.date, earlyHarvest: true, plannedHarvestDate: '' });
      }
      case 'again':
        // Sown again after a loss: the lost sowing is kept in the record.
        if (!f?.plantedDate || !f.lost) return '';
        if (today > lastSowOn)
          return t(`It is too late to sow ${name} again.`, `আবার ${name} বোনার সময় নেই।`);
        return save(c, {
          plantedDate: today,
          harvestedDate: '',
          plannedHarvestDate: '',
          lost: undefined,
          lostTries: [
            ...(f.lostTries ?? []),
            { plantedDate: f.plantedDate, date: f.lost.date, reason: f.lost.reason },
          ],
        });
    }
  };
  const planned = Object.fromEntries(
    pcs.map((c) => {
      const f = farmOf(c.a);
      return [
        c.a.item.season,
        {
          sow: (!f?.plantedDate && f?.plannedSowDate) || '',
          harvest:
            ((f?.plantedDate || f?.plannedSowDate) && !f?.harvestedDate && f?.plannedHarvestDate) ||
            '',
        },
      ];
    }),
  );
  const ctx: Ctx = {
    recordCrop,
    planned,
    endCrop,
    recs: Object.fromEntries(pcs.map((c) => [c.a.item.season, farmOf(c.a)])),
    changePlan: () => {
      const field = state.fields?.find((f) => f.id === plot.fieldId);
      if (field) openPlotPlan(field, plot, true, router);
    },
    openFix: (season) => setFixFocus((f) => ({ season, n: (f?.n ?? 0) + 1 })),
    pcs,
    today,
    tx,
    t,
    areaHa: plot.areaHa,
    climate,
    weather,
    plotId: plot.id,
    notes: log.notes.filter((n) => n.plotId === plot.id),
  };
  const start = isoOf(yearOf(plan.from), monthIndex(plan.from) + 1, 1);
  const open = (d: string) => {
    setSheet(d);
    setMonth(d.slice(0, 7));
  };
  const detail = pcs.find((c) => c.a.item.crop.id === detailId) ?? current ?? pcs[pcs.length - 1];
  return (
    <div className="rot-calendar">
      <GlanceCard ctx={ctx} current={current} start={start} plotName={plot.name} onPick={open} />
      <TodayCard
        ctx={ctx}
        kind={todayKind(current, index, today)}
        current={current}
        ownSeason={farm.rotationSeason}
        currentFarm={current ? farmOf(current.a) : undefined}
      />
      <WeekDays ctx={ctx} onOpen={open} />
      <MonthCalendar
        ctx={ctx}
        month={month ?? today.slice(0, 7)}
        setMonth={setMonth}
        selected={sheet}
        onOpen={open}
      />
      <BigEvents ctx={ctx} onOpen={open} />
      <details className="card rot-details">
        <summary>
          {t(
            `Details: ${tx.crop(detail.a.item.crop)} water and heat, week by week (NASA data)`,
            `বিস্তারিত (${tx.crop(detail.a.item.crop)}): সপ্তাহ ধরে পানি ও গরম (নাসার তথ্য)`,
          )}
        </summary>
        <div className="rot-tabs" role="tablist">
          {pcs.map((c) => (
            <button
              key={c.a.item.crop.id}
              role="tab"
              type="button"
              aria-selected={c === detail}
              className={seasonClass(c.a.item.season)}
              onClick={() => setDetailId(c.a.item.crop.id)}
            >
              {tx.crop(c.a.item.crop)}
            </button>
          ))}
        </div>
        <div className="rot-week-detail">
          <span className="rot-now-ico">
            <PlantGlyph stage={weekOn(detail, today)?.stage ?? 'sow'} />
          </span>
          <p>
            {tx.crop(detail.a.item.crop)} · {tx.date(detail.a.item.sow)} –{' '}
            {tx.date(detail.a.item.harvest)} · {tx.irrigations(detail.a.irrigations)}
          </p>
        </div>
        <DetailChart c={detail.a} tx={tx} t={t} />
        <p className="rot-source">
          {t(
            `NASA POWER 1991–2020 averages for this location. Crop water use: FAO-56 with Hargreaves ET0. Field jobs are typical days after sowing; check them with your local agriculture office${climate.estimated ? '. Day max/min estimated from the mean until the climate refreshes' : ''}.`,
            `এই জায়গার নাসা POWER ১৯৯১–২০২০ গড়। ফসলের পানির হিসাব: FAO-56, Hargreaves ET0। মাঠের কাজের দিনগুলো বোনার পরে সাধারণত যেদিন হয়; স্থানীয় কৃষি অফিসে মিলিয়ে নিন${climate.estimated ? '। জলবায়ু আবার আনার আগ পর্যন্ত দিনের সর্বোচ্চ/সর্বনিম্ন গড় থেকে আন্দাজ' : ''}।`,
          )}
        </p>
      </details>
      <FixDates
        ctx={ctx}
        focus={fixFocus}
        initial={
          pcs.find(
            (c) => (c.sown && c.a.item.sow > today) || (c.harvested && c.a.item.harvest > today),
          ) ?? current
        }
      />
      {sheet && (
        <DaySheet
          ctx={ctx}
          date={sheet}
          onClose={() => {
            setSheet(null);
            // The day from a reminder link is used once; closing the sheet clears it.
            if (dayParam()) window.history.replaceState(null, '', window.location.pathname);
          }}
        />
      )}
    </div>
  );
}

/** Fix a sowing or harvest day recorded wrongly, for any crop of the plan, within its possible days. */
function FixDates({
  ctx,
  initial,
  focus,
}: {
  ctx: Ctx;
  initial: PlanCrop | null;
  focus: { season: string; n: number } | null;
}) {
  const { pcs, today, tx, t, recordCrop } = ctx;
  const [season, setSeason] = useState(initial?.a.item.season ?? pcs[0]?.a.item.season),
    [error, setError] = useState(''),
    [confirmBoth, setConfirmBoth] = useState(false),
    // Opens by itself when a saved day is after today, so it can be cleared.
    [open, setOpen] = useState(() =>
      pcs.some(
        (p) => (p.sown && p.a.item.sow > today) || (p.harvested && p.a.item.harvest > today),
      ),
    );
  const box = useRef<HTMLDetailsElement>(null);
  // Opened from a card on one crop: show that crop (once per request) and bring the box into view.
  const [seen, setSeen] = useState(0);
  if (focus && focus.n !== seen) {
    setSeen(focus.n);
    setSeason(focus.season as typeof season);
    setError('');
    setConfirmBoth(false);
    setOpen(true);
  }
  useEffect(() => {
    if (focus)
      requestAnimationFrame(() =>
        box.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      );
  }, [focus]);
  const c = pcs.find((p) => p.a.item.season === season) ?? pcs[0];
  if (!c || !recordCrop) return null;
  const plan = ctx.planned?.[c.a.item.season],
    lost = c.end?.kind === 'lost' ? c.end : null;
  const name = tx.crop(c.a.item.crop),
    planted = c.sown ? c.a.item.sow : '',
    harvested = c.harvested && !lost ? c.a.item.harvest : '';
  const run = (kind: RecordKind, value: string) => {
    setConfirmBoth(false);
    setError(recordCrop(c, kind, value));
  };
  const field = (
    kind: 'plantedDate' | 'harvestedDate',
    label: string,
    recorded: string,
    plannedDay: string,
  ) => {
    // Days after today are allowed and saved as the planned day; a recorded day after today is a mistake.
    const value = recorded || plannedDay,
      wrongFuture = !!recorded && recorded > today;
    const r = recordRange(pcs, c, kind),
      needsSowing = kind === 'harvestedDate' && !planted && !plan?.sow,
      none = r.min > r.max;
    const hint = needsSowing
      ? t('Enter the sowing day first.', 'আগে বোনার দিন দিন।')
      : wrongFuture
        ? t(
            'This day has not come yet. Clear it or pick the real day.',
            'এই দিন এখনো আসেনি। মুছে দিন বা আসল দিন বাছুন।',
          )
        : none
          ? t('No day is possible any more.', 'আর কোনো দিন সম্ভব নয়।')
          : plannedDay
            ? kind === 'plantedDate'
              ? t(
                  `Planned. On ${tx.dateMain(plannedDay)} the card asks if you sowed.`,
                  `পরিকল্পনা। ${tx.dateMain(plannedDay)} তারিখে কার্ড জানতে চাইবে বুনেছেন কি না।`,
                )
              : t(
                  `Planned. On ${tx.dateMain(plannedDay)} the card asks if you harvested.`,
                  `পরিকল্পনা। ${tx.dateMain(plannedDay)} তারিখে কার্ড জানতে চাইবে কেটেছেন কি না।`,
                )
            : t(
                `Any day from ${tx.dateMain(r.min)} to ${tx.dateMain(r.max)}. A day after today is saved as planned.`,
                `${tx.dateMain(r.min)} থেকে ${tx.dateMain(r.max)}-এর মধ্যে যেকোনো দিন। আজের পরের দিন পরিকল্পনা হিসেবে থাকবে।`,
              );
    return (
      <div className="form-field">
        <label htmlFor={`fix-${kind}`}>{label}</label>
        <span className="rot-fix-row">
          <input
            id={`fix-${kind}`}
            type="date"
            value={value}
            min={r.min}
            max={r.max}
            disabled={needsSowing || (none && !value)}
            onClick={(e) => {
              try {
                e.currentTarget.showPicker?.();
              } catch {
                /* Typing the date still works. */
              }
            }}
            onChange={(e) => e.target.value && run(kind, e.target.value)}
          />
          {value && (
            <button
              className="text-button"
              type="button"
              onClick={() =>
                kind === 'plantedDate' && harvested ? setConfirmBoth(true) : run(kind, '')
              }
            >
              {t('Clear', 'মুছুন')}
            </button>
          )}
        </span>
        <small className={`rot-fix-hint${wrongFuture ? ' warn' : ''}`}>{hint}</small>
      </div>
    );
  };
  return (
    <details
      ref={box}
      className="card rot-details rot-fix-dates"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        {t('Wrong sowing or harvest date? Fix it', 'বোনা বা কাটার তারিখ ভুল? ঠিক করুন')}
      </summary>
      {pcs.length > 1 && (
        <div className="rot-tabs rot-fix-crops" role="group" aria-label={t('Crop', 'ফসল')}>
          {pcs.map((p) => (
            <button
              key={p.a.item.season}
              type="button"
              className={seasonClass(p.a.item.season)}
              aria-pressed={p === c}
              onClick={() => {
                setSeason(p.a.item.season);
                setError('');
                setConfirmBoth(false);
              }}
            >
              {tx.crop(p.a.item.crop)}
            </button>
          ))}
        </div>
      )}
      <div className="rot-fix-grid">
        {field('plantedDate', t(`${name} sown on`, `${name} বোনার দিন`), planted, plan?.sow ?? '')}
        {lost ? (
          <div className="form-field">
            <span className="rot-fix-label">{t(`${name} lost on`, `${name} নষ্ট হয়েছে`)}</span>
            <span className="rot-fix-row rot-lost-row">
              <span className="rot-lost">
                ✕ {tx.dateMain(lost.date)} · {lossReasonText(lost.reason, t)}
              </span>
              <button
                className="text-button"
                type="button"
                onClick={() => setError(ctx.endCrop?.(c, { kind: 'unlose' }) ?? '')}
              >
                {t('Undo loss', 'নষ্ট বাতিল করুন')}
              </button>
            </span>
            <small className="rot-fix-hint">
              {t(
                'No harvest: the crop was lost. Undo the loss to enter a harvest day.',
                'কাটা হয়নি: ফসল নষ্ট হয়েছে। কাটার দিন দিতে আগে নষ্ট বাতিল করুন।',
              )}
            </small>
          </div>
        ) : (
          field(
            'harvestedDate',
            t(`${name} harvested on`, `${name} কাটার দিন`),
            harvested,
            plan?.harvest ?? '',
          )
        )}
      </div>
      {confirmBoth && (
        <div className="notice-amber rot-confirm-undo" role="alert">
          <p>
            {t(
              `Clearing the sowing day also clears the harvest day (${tx.dateMain(harvested)}).`,
              `বোনার দিন মুছলে কাটার দিনও (${tx.dateMain(harvested)}) মুছে যাবে।`,
            )}
          </p>
          <div className="button-row">
            <button className="button primary" type="button" onClick={() => run('both', '')}>
              {t('Clear both', 'দুটোই মুছুন')}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => setConfirmBoth(false)}
            >
              {t('Keep them', 'রেখে দিন')}
            </button>
          </div>
        </div>
      )}
      {error && (
        <p className="notice-amber" role="alert">
          {error}
        </p>
      )}
    </details>
  );
}
