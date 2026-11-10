'use client';
import type { Season } from '../../domain/evidence-planner';
import type { RotationCrop } from '../../data/rotation-crops';
import {
  dayCount,
  isoOf,
  monthIndex,
  plusDays,
  yearOf,
  type CropAssessment,
  type CropWeek,
  type Level,
  type MonthlyClimate,
  type PlanAssessment,
  type Verdict,
} from '../../domain/rotation';
import type { RotationText, Translate } from './rotation-text';

export const seasonClass = (s: Season) =>
  s === 'winter' ? 'rabi' : s === 'pre-monsoon' ? 'k1' : 'k2';

export function VerdictPill({ verdict, label }: { verdict: Verdict; label: string }) {
  return <span className={`rot-verdict rot-verdict-${verdict}`}>{label}</span>;
}

export interface IntensityRow {
  key: string;
  label: string;
  value: string;
  level: Level;
  ends: [string, string];
}
/** Five segments, green to red. More filled segments means more of the problem, on every row. */
export function IntensityBars({
  rows,
  t,
  compact = false,
}: {
  rows: IntensityRow[];
  t: Translate;
  compact?: boolean;
}) {
  return (
    <div className={`rot-intensity ${compact ? 'compact' : ''}`}>
      {!compact && (
        <p className="rot-intensity-help">
          <span className="rot-mini" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((i) => (
              <i key={i} className={`l${i}`} />
            ))}
          </span>
          {t('More bars, and redder, means more trouble', 'দাগ যত বেশি আর যত লাল, সমস্যা তত বেশি')}
        </p>
      )}
      {rows.map((r) => (
        <div className="rot-irow" key={r.key} role="group" aria-label={`${r.label}: ${r.value}`}>
          <div className="rot-itop">
            <b>{r.label}</b>
            <span className={`rot-lvl-${r.level}`}>{r.value}</span>
          </div>
          <div className="rot-ibar" aria-hidden="true">
            {[1, 2, 3, 4, 5].map((i) => (
              <i key={i} className={`l${i} ${i <= r.level ? 'on' : ''}`} />
            ))}
          </div>
          <div className="rot-iends" aria-hidden="true">
            <span>{r.ends[0]}</span>
            <span>{r.ends[1]}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function planRows(a: PlanAssessment, tx: RotationText, t: Translate): IntensityRow[] {
  const hottest = [...a.crops].sort((x, y) => y.levels.heat - x.levels.heat)[0];
  const soilWorst = [...a.crops].sort((x, y) => y.levels.soil - x.levels.soil)[0];
  return [
    {
      key: 'water',
      label: t('Water needed', 'পানি কত লাগবে'),
      value: t(`${a.irrigations} irrigations a year`, `বছরে ${tx.irrigations(a.irrigations)}`),
      level: a.levels.water,
      ends: [t('Little', 'কম'), t('A lot', 'অনেক')],
    },
    {
      key: 'heat',
      label: t('Heat risk', 'গরমের ঝুঁকি'),
      value:
        a.levels.heat === 1 || !hottest?.hottest
          ? t('None', 'নেই')
          : t(
              `${tx.crop(hottest.item.crop)} in ${tx.month(hottest.hottest.start)}`,
              `${tx.crop(hottest.item.crop)}: ${tx.month(hottest.hottest.start)}-এ`,
            ),
      level: a.levels.heat,
      ends: [t('None', 'নেই'), t('High', 'বেশি')],
    },
    {
      key: 'soil',
      label: t('Soil trouble', 'মাটির সমস্যা'),
      value:
        a.levels.soil <= 2 || !soilWorst
          ? t('None', 'নেই')
          : t(
              `${tx.crop(soilWorst.item.crop)} struggles`,
              `${tx.crop(soilWorst.item.crop)} মাটিতে ভালো হবে না`,
            ),
      level: a.levels.soil,
      ends: [t('None', 'নেই'), t('High', 'বেশি')],
    },
    {
      key: 'wear',
      label: t('Wears out the soil', 'জমির উর্বরতা কমার ভয়'),
      value:
        a.levels.wear === 1
          ? t('Has a pulse crop', 'ডাল ফসল আছে')
          : a.levels.wear === 5
            ? t('Rice after rice', 'ধানের পর ধান')
            : a.levels.wear === 3
              ? t('Same crop again', 'একই ফসল আবার')
              : t('Normal', 'সাধারণ'),
      level: a.levels.wear,
      ends: [t('Low', 'কম'), t('High', 'বেশি')],
    },
  ];
}

export function cropRows(a: CropAssessment, tx: RotationText, t: Translate): IntensityRow[] {
  return [
    {
      key: 'water',
      label: t('Water needed', 'পানি কত লাগবে'),
      value: tx.irrigations(a.irrigations),
      level: a.levels.water,
      ends: [t('Little', 'কম'), t('A lot', 'অনেক')],
    },
    {
      key: 'heat',
      label: t('Heat risk', 'গরমের ঝুঁকি'),
      value: a.hottest
        ? t(`in ${tx.month(a.hottest.start)}`, `${tx.month(a.hottest.start)}-এ`)
        : t('None', 'নেই'),
      level: a.levels.heat,
      ends: [t('None', 'নেই'), t('High', 'বেশি')],
    },
    {
      key: 'soil',
      label: t('Soil trouble', 'মাটির সমস্যা'),
      value:
        a.levels.soil <= 1
          ? t('Suits it', 'মানানসই')
          : a.levels.soil <= 2
            ? t('Grows', 'চলে')
            : t('Struggles', 'ভালো হয় না'),
      level: a.levels.soil,
      ends: [t('None', 'নেই'), t('High', 'বেশি')],
    },
    {
      key: 'wear',
      label: t('Wears out the soil', 'জমির উর্বরতা কমার ভয়'),
      value:
        a.levels.wear === 1
          ? t('Pulse: feeds it', 'ডাল: উর্বরতা বাড়ায়')
          : a.levels.wear === 5
            ? t('Rice after rice', 'ধানের পর ধান')
            : a.levels.wear === 3
              ? t('Same crop again', 'একই ফসল আবার')
              : t('Normal', 'সাধারণ'),
      level: a.levels.wear,
      ends: [t('Low', 'কম'), t('High', 'বেশি')],
    },
  ];
}

export function IrrigationCompare({
  count,
  last,
  tx,
  t,
}: {
  count: number;
  last: number | null;
  tx: RotationText;
  t: Translate;
}) {
  const max = Math.max(count, last ?? 0, 1);
  const diff = last === null ? 0 : last - count;
  return (
    <div className="rot-compare">
      <p className="rot-compare-big">
        {tx.irrigations(count)} <small>{t('in the year', 'পুরো বছরে')}</small>
      </p>
      <div className="rot-cmpbar">
        <span>{t('This plan', 'এই পরিকল্পনা')}</span>
        <div>
          <i style={{ width: `${(count / max) * 100}%` }} />
        </div>
        <b>{tx.n(count)}</b>
        {last !== null && (
          <>
            <span>{t('Last year', 'গত বছর')}</span>
            <div>
              <i className="last" style={{ width: `${(last / max) * 100}%` }} />
            </div>
            <b>{tx.n(last)}</b>
          </>
        )}
      </div>
      {last !== null && (
        <p className={`rot-diff ${diff > 0 ? 'good' : diff < 0 ? 'bad' : ''}`}>
          {diff > 0
            ? t(`${diff} fewer irrigations than last year`, `গত বছরের চেয়ে ${tx.n(diff)}টি সেচ কম`)
            : diff < 0
              ? t(
                  `${-diff} more irrigations than last year`,
                  `গত বছরের চেয়ে ${tx.n(-diff)}টি সেচ বেশি`,
                )
              : t('Same irrigation as last year', 'গত বছরের সমান সেচ')}
        </p>
      )}
    </div>
  );
}

/** Month labels for an axis: English-calendar months (in Bangla script when the page is Bangla). */
export function axisMonths(start: string, days: number, tx: RotationText) {
  const end = plusDays(start, days);
  const out: { iso: string; label: string }[] = [];
  for (let i = 0; i <= 14; i++) {
    const y = yearOf(start) + Math.floor((monthIndex(start) + i) / 12),
      m = (monthIndex(start) + i) % 12,
      d = isoOf(y, m + 1, 1);
    if (d >= start && d < end) out.push({ iso: d, label: tx.monthShort(m) });
  }
  return out;
}

export interface ChartCrop {
  crop: RotationCrop;
  season: Season;
  sow: string;
  harvest: string;
  weeks: CropWeek[];
}
/** The year: average rain per month as bars, crops as blocks on top, red ticks for weeks too hot for the crop. */
export function YearChart({
  crops,
  climate,
  start,
  today,
  focus,
  tx,
  t,
  width = 640,
  height = 100,
}: {
  crops: ChartCrop[];
  climate: MonthlyClimate;
  start: string;
  today?: string;
  focus?: string;
  tx: RotationText;
  t: Translate;
  language?: 'en' | 'bn';
  width?: number;
  height?: number;
}) {
  const span = 396;
  const X = (iso: string) => Math.max(0, Math.min(width, (dayCount(start, iso) / span) * width));
  const top = 4,
    base = height - 18;
  const maxRain = Math.max(...climate.rain, 1);
  const bars = [];
  for (let i = 0; i < 14; i++) {
    const y = yearOf(start) + Math.floor((monthIndex(start) + i) / 12),
      m = (monthIndex(start) + i) % 12;
    const a = isoOf(y, m + 1, 1),
      b = isoOf(m === 11 ? y + 1 : y, m === 11 ? 1 : m + 2, 1);
    const x0 = X(a),
      x1 = X(b);
    if (x1 - x0 < 2) continue;
    const h = (climate.rain[m] / maxRain) * (base - top - 30);
    bars.push(
      <rect
        key={a}
        className="rot-rainbar"
        x={x0 + 1.5}
        y={base - h}
        width={x1 - x0 - 3}
        height={h}
        rx={2}
      />,
    );
  }
  const labels = axisMonths(start, span, tx);
  return (
    <svg
      className="rot-year"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      role="img"
      aria-label={t(
        'Crops through the year over average monthly rain',
        'বছরের ফসল আর মাসের গড় বৃষ্টি',
      )}
    >
      {bars}
      {labels.map((m, i) => {
        const next = labels[i + 1]?.iso ?? plusDays(start, span);
        const x = X(m.iso),
          nx = X(next);
        return (
          <g key={m.iso}>
            <line className="rot-tick" x1={x} x2={x} y1={base} y2={base + 4} />
            {nx - x > 30 && (
              <text x={(x + nx) / 2} y={height - 4} textAnchor="middle">
                {m.label}
              </text>
            )}
          </g>
        );
      })}
      {crops.map((c) => {
        const x = X(c.sow),
          w = Math.max(4, X(c.harvest) - x);
        return (
          <g key={c.crop.id + c.sow} className={focus && focus !== c.crop.id ? 'rot-dim' : ''}>
            <rect
              className={`rot-block ${seasonClass(c.season)}`}
              x={x}
              y={top}
              width={w}
              height={22}
              rx={6}
            />
            {w > 52 && (
              <text className={`rot-block-label ${seasonClass(c.season)}`} x={x + 7} y={top + 15}>
                {tx.crop(c.crop)}
              </text>
            )}
            {c.weeks
              .filter((wk) => wk.hot)
              .map((wk) => (
                <rect
                  key={wk.start}
                  className="rot-hot"
                  x={X(wk.start)}
                  y={top + 25}
                  width={Math.max(3, X(plusDays(wk.start, wk.days)) - X(wk.start) - 1)}
                  height={5}
                  rx={1}
                />
              ))}
          </g>
        );
      })}
      {today && <line className="rot-today" x1={X(today)} x2={X(today)} y1={0} y2={base} />}
    </svg>
  );
}

export function YearKey({ t }: { t: Translate }) {
  return (
    <p className="rot-key">
      <span>
        <i className="rain" />
        {t('Blue bars: rain each month', 'নীল দাগ: কোন মাসে কত বৃষ্টি')}
      </span>
      <span>
        <i className="hot" />
        {t('Red marks: too hot for the crop', 'লাল দাগ: ফসলের জন্য বেশি গরম')}
      </span>
    </p>
  );
}

export const chartCrops = (a: PlanAssessment): ChartCrop[] =>
  a.crops.map((c) => ({
    crop: c.item.crop,
    season: c.item.season,
    sow: c.item.sow,
    harvest: c.item.harvest,
    weeks: c.weeks,
  }));

/**
 * What NASA rain and soil data add to a plan: a likely dry spell at flowering (IMERG) and an
 * irrigation before sowing (SMAP), one line per crop. Nothing when neither applies.
 */
export function NasaNotes({
  crops,
  tx,
  t,
  areaHa,
  inline = false,
  tour,
}: {
  crops: CropAssessment[];
  tx: RotationText;
  t: Translate;
  areaHa: number;
  /** Spans only, for use inside a button. */
  inline?: boolean;
  tour?: string;
}) {
  const rows = crops.flatMap((c) => [
    ...(c.presow
      ? [
          {
            key: `${c.item.crop.id}-presow`,
            tag: t('Before sowing', 'বোনার আগে'),
            text: tx.presow(c, areaHa),
            high: false,
          },
        ]
      : []),
    ...(c.dry
      ? [
          {
            key: `${c.item.crop.id}-dry`,
            tag: c.dry.high ? t('Dry spell: high', 'খরা: বেশি') : t('Dry spell', 'খরা'),
            text: tx.dry(c, areaHa),
            high: c.dry.raisesWater,
          },
        ]
      : []),
  ]);
  if (!rows.length) return null;
  const List = inline ? 'span' : 'ul',
    Item = inline ? 'span' : 'li';
  return (
    <List
      className="rot-nasa"
      data-tour={tour}
      aria-label={t('From NASA rain and soil data', 'নাসার বৃষ্টি ও মাটির তথ্য থেকে')}
    >
      {rows.map((r) => (
        <Item key={r.key} className={r.high ? 'high' : ''}>
          <span className="rot-nasa-tag">{r.tag}</span>
          <span>{r.text}</span>
        </Item>
      ))}
    </List>
  );
}
