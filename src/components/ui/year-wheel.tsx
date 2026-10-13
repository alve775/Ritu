'use client';
import { useId } from 'react';
import type { KeyboardEvent } from 'react';
import { months, previewData } from '../../data/preview';
import {
  cropAtMonth,
  fullWheel,
  miniWheel,
  monthHitPath,
  monthLabelPoint,
  progressSector,
  wheelSegments,
} from '../../domain/year-wheel';
import type { CropPeriod } from '../../domain/types';
import { activityKey } from '../../lib/journey-store';
import { periodLabel } from '../../lib/period-label';
import { usePlanner } from '../planner-provider';

export interface YearWheelProps {
  periods: CropPeriod[];
  label: string;
  size?: 'full' | 'mini';
  month?: number;
  onSelectMonth?: (month: number) => void;
  progress?: Record<string, number>;
}

export function YearWheel({
  periods,
  label,
  size = 'full',
  month,
  onSelectMonth,
  progress,
}: YearWheelProps) {
  const { t, language } = usePlanner();
  const id = useId();
  const g = size === 'mini' ? miniWheel : fullWheel;
  const segments = wheelSegments(periods, g);
  const name = (crop: CropPeriod['crop']) => previewData.crops[crop].name[language];
  const range = (s: { start: number; duration: number }) => periodLabel(s, language);
  const summary = segments
    .filter((s) => s.kind === 'crop')
    .map((s) => `${name(s.crop)} ${range(s)}`)
    .join('; ');

  if (size === 'mini')
    return (
      <svg className="year-wheel mini" viewBox={`0 0 ${g.size} ${g.size}`} aria-hidden="true">
        <circle
          className="track"
          cx={g.center}
          cy={g.center}
          r={(g.inner + g.outer) / 2}
          strokeWidth={g.outer - g.inner}
        />
        {segments
          .filter((s) => s.kind === 'crop')
          .map((s) => (
            <path key={s.start} className={`arc season-${s.season}`} d={s.path} />
          ))}
      </svg>
    );

  const selected = month ?? null;
  const focus = selected === null ? null : cropAtMonth(periods, selected);
  const marker =
    selected === null
      ? null
      : monthLabelPoint({ ...g, monthRadius: (g.inner + g.outer) / 2 }, selected);
  const keyed = (m: number) => (event: KeyboardEvent<SVGPathElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectMonth?.(m);
    }
  };

  return (
    <figure className="year-wheel full">
      <svg viewBox={`0 0 ${g.size} ${g.size}`} role="group" aria-label={`${label}: ${summary}`}>
        <defs>
          <pattern
            id={`rest-${id}`}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect className="rest-stripe" width="3" height="6" />
          </pattern>
        </defs>
        <circle
          className="track"
          cx={g.center}
          cy={g.center}
          r={(g.inner + g.outer) / 2}
          strokeWidth={g.outer - g.inner}
        />
        {segments.map((s) => {
          const fraction =
            progress && s.kind === 'crop'
              ? (progress[activityKey(s.crop, s.start, s.duration)] ?? 0)
              : null;
          const filled =
            fraction === null ? null : progressSector(g, s.start, s.duration, fraction);
          return (
            <g key={s.start} className={`segment ${s.kind}`}>
              <path
                className={
                  s.kind === 'rest'
                    ? 'arc rest'
                    : `arc season-${s.season} ${fraction !== null ? 'pending' : ''}`
                }
                d={s.path}
                style={s.kind === 'rest' ? { fill: `url(#rest-${id})` } : undefined}
              />
              {filled && <path className={`arc season-${s.season}`} d={filled} />}
              {s.kind === 'crop' && (
                <>
                  <path id={`label-${id}-${s.start}`} d={s.labelPath} fill="none" />
                  <text className={`arc-label season-${s.season}`} aria-hidden="true">
                    <textPath
                      href={`#label-${id}-${s.start}`}
                      startOffset="50%"
                      textAnchor="middle"
                    >
                      {name(s.crop)}
                    </textPath>
                  </text>
                </>
              )}
            </g>
          );
        })}
        {months[language].map((m, index) => {
          const p = monthLabelPoint(g, index);
          return (
            <text
              key={m}
              className={`month-label ${selected === index ? 'selected' : ''}`}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              aria-hidden="true"
            >
              {m}
            </text>
          );
        })}
        {onSelectMonth &&
          months[language].map((m, index) => (
            <g key={`hit-${m}`}>
              <path className="month-hit-halo" d={monthHitPath(g, index)} aria-hidden="true" />
              <path
                className="month-hit"
                d={monthHitPath(g, index)}
                role="button"
                tabIndex={0}
                aria-label={`${t('Year wheel', 'বছরের চক্র')}: ${m}`}
                aria-pressed={selected === index}
                onClick={() => onSelectMonth(index)}
                onKeyDown={keyed(index)}
              />
            </g>
          ))}
        {marker && <circle className="month-marker" cx={marker.x} cy={marker.y} r="8" />}
      </svg>
      {selected !== null && (
        <figcaption className="wheel-center" aria-live="polite">
          <span className="wheel-month">{months[language][selected]}</span>
          <strong>
            {focus && focus.crop !== 'fallow'
              ? name(focus.crop)
              : t('Planned rest / fallow', 'পরিকল্পিত বিরতি / পতিত')}
          </strong>
          {focus && <span className="wheel-range">{range(focus)}</span>}
        </figcaption>
      )}
    </figure>
  );
}
