import type { CSSProperties } from 'react';

export type SeasonKind = 'k1' | 'k2' | 'rabi' | 'rest';

export type RibbonSegment = {
  kind: SeasonKind;
  /** Number of months this segment covers. Segments should add up to 12 (March to February). */
  months: number;
  /** Shown only at size md / lg. */
  label?: string;
};

type Props = {
  segments: RibbonSegment[];
  size?: 'sm' | 'md' | 'lg';
  /** Full description for screen readers, e.g. "Mung bean March to April, rest, Aman rice July to October ...". */
  label: string;
};

export function SeasonRibbon({ segments, size = 'sm', label }: Props) {
  return (
    <div className={`season-ribbon season-ribbon--${size}`} role="img" aria-label={label}>
      {segments.map((s, i) => (
        <span
          key={i}
          className={`season-ribbon__seg season-ribbon__seg--${s.kind}`}
          style={{ gridColumn: `span ${s.months}` } as CSSProperties}
        >
          {size !== 'sm' && s.label ? s.label : null}
        </span>
      ))}
    </div>
  );
}

/** The sample plan used on the landing page: mung bean, rest, Aman rice, mustard, rest. */
export const SAMPLE_PLAN: RibbonSegment[] = [
  { kind: 'k1', months: 2 },
  { kind: 'rest', months: 2 },
  { kind: 'k2', months: 4 },
  { kind: 'rabi', months: 3 },
  { kind: 'rest', months: 1 },
];
