'use client';
import type { CropAssessment, CropStage } from '../../domain/rotation';
import type { RotationText, Translate } from './rotation-text';

/** Small plant drawing for a growth stage, drawn around (0,0) = ground under the stem. */
export function PlantGlyph({ stage }: { stage: CropStage }) {
  const ground = <line className="rot-ground" x1={-11} x2={11} y1={0} y2={0} />;
  let body;
  if (stage === 'sow')
    body = (
      <>
        <ellipse className="rot-leaf" cx={-4} cy={-2} rx={2.4} ry={1.6} />
        <ellipse className="rot-leaf" cx={4} cy={-2} rx={2.4} ry={1.6} />
      </>
    );
  else if (stage === 'young')
    body = (
      <>
        <path className="rot-stem" d="M0 0 V-9" />
        <path className="rot-leaf" d="M0 -8 q-7 -1 -8 -7 q6 0 8 6Z M0 -8 q7 -1 8 -7 q-6 0 -8 6Z" />
      </>
    );
  else if (stage === 'grow')
    body = (
      <>
        <path className="rot-stem" d="M0 0 V-20" />
        <path
          className="rot-leaf"
          d="M0 -6 q-9 -1 -10 -8 q8 0 10 7Z M0 -12 q9 -1 10 -8 q-8 0 -10 7Z M0 -18 q-7 -1 -8 -6 q6 0 8 5Z"
        />
      </>
    );
  else if (stage === 'flower')
    body = (
      <>
        <path className="rot-stem" d="M0 0 V-21" />
        <path
          className="rot-leaf"
          d="M0 -6 q-9 -1 -10 -8 q8 0 10 7Z M0 -12 q9 -1 10 -8 q-8 0 -10 7Z"
        />
        <circle className="rot-flower" cx={0} cy={-24} r={4} />
        <circle className="rot-flower" cx={-6} cy={-19} r={2.6} />
        <circle className="rot-flower" cx={6} cy={-19} r={2.6} />
      </>
    );
  else
    body = (
      <>
        <path className="rot-stem" d="M-4 0 Q-4 -14 -8 -22 M0 0 V-24 M4 0 Q4 -14 8 -22" />
        <ellipse className="rot-flower" cx={-8} cy={-23} rx={2.5} ry={4.5} />
        <ellipse className="rot-flower" cx={0} cy={-26} rx={2.5} ry={4.5} />
        <ellipse className="rot-flower" cx={8} cy={-23} rx={2.5} ry={4.5} />
      </>
    );
  return (
    <svg viewBox="-16 -32 32 36" className="rot-plant" aria-hidden="true">
      {ground}
      {body}
    </svg>
  );
}

export function DetailChart({ c, tx, t }: { c: CropAssessment; tx: RotationText; t: Translate }) {
  const wk = c.weeks;
  const L = 96,
    n = wk.length,
    W = Math.max(44, Math.floor((990 - L) / n)),
    width = L + n * W + 10;
  const top = 10,
    wH = 130,
    tTop = top + wH + 30,
    tH = 70,
    height = tTop + tH + 26;
  const wMax = Math.max(60, ...wk.map((w) => Math.max(w.rain, w.use))) * 1.05;
  const X = (i: number) => L + i * W,
    wy = (v: number) => top + wH - (Math.min(v, wMax) / wMax) * wH,
    ty = (v: number) => tTop + tH - ((Math.max(15, Math.min(42, v)) - 15) / 27) * tH;
  const limit = c.item.crop.heat?.limitC;
  return (
    <div className="rot-detail-scroll">
      <svg
        className="rot-detail"
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        role="img"
        aria-label={t(
          'Rain, crop water need and heat by week',
          'সপ্তাহ ধরে বৃষ্টি, পানির চাহিদা ও গরম',
        )}
      >
        <text className="lane" x={6} y={top + 12}>
          {t('Water', 'পানি')}
        </text>
        <text x={6} y={top + 27}>
          {t('mm a week', 'মিমি/সপ্তাহ')}
        </text>
        <text className="lane" x={6} y={tTop + 12}>
          {t('Heat', 'গরম')}
        </text>
        <text x={6} y={tTop + 27}>
          {t('day max °C', 'দিনের °সে')}
        </text>
        {[0, 0.5, 1].map((f) => {
          const v = Math.round(wMax * f);
          return (
            <g key={f}>
              <line className="grid" x1={L} x2={width - 10} y1={wy(v)} y2={wy(v)} />
              <text x={L - 6} y={wy(v) + 3} textAnchor="end">
                {tx.n(v)}
              </text>
            </g>
          );
        })}
        {[20, 30, 40].map((v) => (
          <g key={v}>
            <line className="grid" x1={L} x2={width - 10} y1={ty(v)} y2={ty(v)} />
            <text x={L - 6} y={ty(v) + 3} textAnchor="end">
              {tx.n(v)}
            </text>
          </g>
        ))}
        {wk.map((w, i) => (
          <g key={w.start}>
            {w.sensitive && <rect className="hotzone" x={X(i)} y={tTop} width={W} height={tH} />}
            <rect
              className="rain"
              x={X(i) + 6}
              y={wy(w.rain)}
              width={W - 12}
              height={top + wH - wy(w.rain)}
              rx={2}
            />
            {w.use > w.rain * 0.8 && (
              <rect
                className="gap"
                x={X(i) + 6}
                y={wy(w.use)}
                width={W - 12}
                height={Math.max(0, wy(w.rain * 0.8) - wy(w.use))}
              />
            )}
            {w.irrigate > 0 && (
              <circle className="irr" cx={X(i) + W / 2} cy={top + wH + 10} r={5} />
            )}
            {(i % 2 === 0 || W > 60) && (
              <text x={X(i) + W / 2} y={height - 6} textAnchor="middle">
                {tx.dateShort(w.start)}
              </text>
            )}
          </g>
        ))}
        {c.presow > 0 && (
          <circle className="irr presow" cx={X(0) + 4} cy={top + wH + 10} r={5}>
            <title>{t('Irrigation before sowing', 'বোনার আগে সেচ')}</title>
          </circle>
        )}
        <polyline
          className="need"
          points={wk.map((w, i) => `${X(i) + W / 2},${wy(w.use)}`).join(' ')}
        />
        {limit && (
          <>
            <line className="limit" x1={L} x2={width - 10} y1={ty(limit)} y2={ty(limit)} />
            <text className="limit-label" x={width - 12} y={ty(limit) - 4} textAnchor="end">
              {t(
                `${tx.crop(c.item.crop)} copes up to ${limit}°C`,
                `${tx.crop(c.item.crop)} সহ্য করে ${tx.n(limit)}° পর্যন্ত`,
              )}
            </text>
          </>
        )}
        <polyline
          className="temp"
          points={wk.map((w, i) => `${X(i) + W / 2},${ty(w.maxC)}`).join(' ')}
        />
        {wk.map(
          (w, i) =>
            w.hot && (
              <circle key={w.start} className="hotdot" cx={X(i) + W / 2} cy={ty(w.maxC)} r={4.5} />
            ),
        )}
      </svg>
      <p className="rot-key">
        <span>
          <i className="rain" />
          {t('Rain', 'বৃষ্টি')}
        </span>
        <span>
          <i className="need" />
          {t('Water the crop needs', 'ফসলের যত পানি লাগে')}
        </span>
        <span>
          <i className="gap" />
          {t('Shortfall: irrigation needed', 'ঘাটতি: এখানে সেচ লাগে')}
        </span>
        <span>
          <i className="irr" />
          {t('Irrigation week', 'সেচের সপ্তাহ')}
        </span>
        <span>
          <i className="temp" />
          {t('Day temperature', 'দিনের গরম')}
        </span>
        <span>
          <i className="hotmonth" />
          {t('Weeks when heat harms the crop', 'যে সপ্তাহে গরম ক্ষতি করে')}
        </span>
      </p>
    </div>
  );
}
