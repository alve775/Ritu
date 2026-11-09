'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { usePlanner } from '../planner-provider';
import { seasonStore, useSeasonFarms } from '../../lib/season-store';
import { calendarFarmFor } from '../../lib/plot-calendar';
import { farmForPlanCrop } from '../../lib/rotation-farm';
import type { Farm } from '../../domain/types';
import type { FarmSite } from '../../domain/farm-site';
import type { SeasonContext } from '../../domain/global-season';
import type { Plot } from '../../domain/plot';
import type { RegisteredField } from '../../domain/field-registry';
import type { Season } from '../../domain/evidence-planner';
import { rotationCrops, rotationCropIds, type RotationCropId } from '../../data/rotation-crops';
import {
  assessPlan,
  keepSown,
  lastYearPlan,
  planKey,
  monthlyClimate,
  seasonOrder,
  suggestPlans,
  type PlanAssessment,
  type PlotConditions,
  type SownSeasons,
  type YearPlan,
} from '../../domain/rotation';
import { CropPhoto } from '../crop-photo';
import { Dialog } from '../dialog';
import { PlotPlanSequence } from './plot-plan';
import { rotationText } from './rotation-text';
import {
  IntensityBars,
  IrrigationCompare,
  VerdictPill,
  YearChart,
  YearKey,
  chartCrops,
  cropRows,
  planRows,
  seasonClass,
} from './rotation-visuals';

const letters = { en: ['A', 'B', 'C', 'D'], bn: ['ক', 'খ', 'গ', 'ঘ'] };
const verdictRank = { good: 0, ok: 1, risky: 2, no: 3 };

export function RotationPlansView({
  site,
  profile,
  from: plannedFrom,
  context,
  plot,
  field,
  onSingle,
}: {
  site: FarmSite;
  profile: Farm;
  from: string;
  context: SeasonContext;
  plot: Plot;
  field: RegisteredField;
  onSingle: () => void;
}) {
  const { t, language } = usePlanner(),
    router = useRouter();
  const tx = rotationText(t, language);
  const climate = useMemo(() => monthlyClimate(context.normal!), [context.normal]);
  const conditions: PlotConditions = useMemo(
    () => ({
      soil: profile.soil,
      drainage: profile.drainage,
      irrigation: profile.irrigation,
      areaHa: plot.areaHa,
      lastYear: plot.lastYear,
    }),
    [profile.soil, profile.drainage, profile.irrigation, plot.areaHa, plot.lastYear],
  );
  const { state } = useSeasonFarms();
  // Seasons already sown on this plot keep their crop in every plan offered.
  const sown = useMemo(() => {
    const out: SownSeasons = {};
    for (const f of state.farms) {
      // A lost crop no longer holds its season, so the plan can change around it.
      if (f.plotId !== plot.id || !f.rotationSeason || !f.plantedDate || f.lost) continue;
      const k = rotationCropIds.find(
        (id) =>
          rotationCrops[id].season === f.rotationSeason &&
          rotationCrops[id].catalogueId === f.selection.crop,
      );
      if (k) out[f.rotationSeason] = k;
    }
    return out;
  }, [state.farms, plot.id]);
  const locked = Object.keys(sown).length > 0;
  // The recorded sowing day of each sown season, shown instead of the planned one.
  const sownOn = (season: Season) =>
    state.farms.find(
      (f) => f.plotId === plot.id && f.rotationSeason === season && f.plantedDate && !f.lost,
    )?.plantedDate;
  // While a crop of the current plan is in the ground, a new plan covers the same year.
  const from = locked && plot.plan ? plot.plan.from : plannedFrom;
  const raw = useMemo(() => suggestPlans(from, climate, conditions), [from, climate, conditions]);
  const suggestions = useMemo(() => {
    if (!locked) return raw;
    const seen = new Set<string>();
    return raw.flatMap((s) => {
      const plan = keepSown(s.assessment.plan, sown);
      if (seen.has(planKey(plan))) return [];
      seen.add(planKey(plan));
      const assessment = assessPlan(plan, from, climate, conditions);
      return assessment.problems.length ? [] : [{ ...s, lastYear: false, assessment }];
    });
  }, [raw, locked, sown, from, climate, conditions]);
  const last = useMemo(() => lastYearPlan(plot.lastYear), [plot.lastYear]);
  const lastIrrigations = raw.find((s) => s.lastYear)?.assessment.irrigations ?? null;
  const order = seasonOrder(from);
  const [mode, setMode] = useState<'plans' | 'builder'>('plans');
  const [custom, setCustom] = useState<YearPlan>(() =>
    // Changing a plan starts from the current plan; a new plot starts from last year's crops.
    keepSown(
      plot.plan?.seasons ?? last ?? { winter: null, 'pre-monsoon': null, monsoon: null },
      sown,
    ),
  );
  const [customSaved, setCustomSaved] = useState(false);
  const [picking, setPicking] = useState<Season | null>(null);
  const [error, setError] = useState('');
  // Once a plan is chosen this page shows it; the suggestions come back only after "Change plan" is confirmed.
  const [changing, setChanging] = useState(false);
  // From the dashboard's "Change plan": /crops?change=1 opens the change question straight away.
  const [askChange, setAskChange] = useState(
    () =>
      !!plot.plan &&
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('change') === '1',
  );
  const [asking, setAsking] = useState<{
    id: string;
    title: string;
    a: PlanAssessment;
    source: 'suggested' | 'custom';
  } | null>(null);
  const chosen = plot.plan;
  const chosenAssessment = useMemo(
    () => (chosen ? assessPlan(chosen.seasons, chosen.from, climate, conditions) : null),
    [chosen, climate, conditions],
  );
  const customAssessment = useMemo(
    () => assessPlan(keepSown(custom, sown), from, climate, conditions),
    [custom, sown, from, climate, conditions],
  );
  const plans: { id: string; title: string; a: PlanAssessment; source: 'suggested' | 'custom' }[] =
    [
      ...suggestions.map((s) => ({
        id: s.id,
        title: s.lastYear
          ? t('Same as last year', 'গত বছরের মতো')
          : s.assessment.crops.map((c) => tx.crop(c.item.crop)).join(' → '),
        a: s.assessment,
        source: 'suggested' as const,
      })),
      ...(customSaved && !customAssessment.problems.length && customAssessment.crops.length
        ? [
            {
              id: 'custom',
              title: t('Your own plan', 'আপনার নিজের পরিকল্পনা'),
              a: customAssessment,
              source: 'custom' as const,
            },
          ]
        : []),
    ];
  const best = Math.max(...plans.map((p) => p.a.score));

  function choose(a: PlanAssessment, source: 'suggested' | 'custom', patternId?: string) {
    setError('');
    try {
      seasonStore.choosePlan(plot.id, {
        seasons: a.plan,
        from,
        source,
        ...(patternId && patternId !== 'custom' ? { patternId } : {}),
        chosenAt: new Date().toISOString(),
      });
      // A season already sown keeps its crop, so the calendar starts at the first season not started.
      const started = new Set(
        state.farms
          .filter((f) => f.plotId === plot.id && f.rotationSeason && f.plantedDate && !f.lost)
          .map((f) => f.rotationSeason),
      );
      const first = a.crops.find((c) => !started.has(c.item.season));
      if (first)
        seasonStore.create(
          farmForPlanCrop({ item: first.item, plot, field, profile, site, context }),
        );
      else {
        const open = calendarFarmFor(seasonStore.getSnapshot().state, plot.id);
        if (open) seasonStore.activate(open.id);
      }
      setAsking(null);
      setChanging(false);
      router.push('/plan');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : t('This plan could not be saved.', 'পরিকল্পনাটি রাখা যায়নি।'),
      );
    }
  }

  const lastYearLine = (
    <p className="rot-lastyear">
      <b>{t('Last year on this plot', 'গত বছর এই প্লটে')}</b>
      {(['winter', 'pre-monsoon', 'monsoon'] as Season[]).map((s) => {
        const v = plot.lastYear[s];
        const name =
          v === 'fallow'
            ? t('empty', 'খালি')
            : v === 'unknown'
              ? t('not sure', 'জানা নেই')
              : v in rotationCrops
                ? tx.crop(rotationCrops[v as RotationCropId])
                : v;
        return (
          <span key={s} className={`rot-season-tag ${seasonClass(s)}`}>
            {tx.season(s).name}: {name}
          </span>
        );
      })}
    </p>
  );

  const sownNames = Object.values(sown)
    .map((k) => tx.crop(rotationCrops[k]))
    .join(language === 'bn' ? ' ও ' : ' and ');
  const planBody = (a: PlanAssessment, last: number | null) => (
    <>
      <YearChart
        crops={chartCrops(a)}
        climate={climate}
        start={a === chosenAssessment && chosen ? chosen.from : from}
        tx={tx}
        t={t}
        language={language}
      />
      <YearKey t={t} />
      <div className="rot-plan-body">
        <div className="rot-plan-left">
          <div className="rot-verdicts">
            {a.crops.map((c) => (
              <VerdictPill
                key={c.item.crop.id}
                verdict={c.verdict}
                label={`${tx.crop(c.item.crop)}: ${tx.verdict(c.verdict)}`}
              />
            ))}
          </div>
          <IrrigationCompare count={a.irrigations} last={last} tx={tx} t={t} />
        </div>
        <IntensityBars rows={planRows(a, tx, t)} t={t} />
      </div>
    </>
  );

  const confirmDialog = asking && (
    <Dialog title={t('Choose this plan?', 'এই পরিকল্পনা নেবেন?')} onClose={() => setAsking(null)}>
      <ol className="rot-confirm-list">
        {asking.a.crops.map((c) => (
          <li key={c.item.crop.id} className={seasonClass(c.item.season)}>
            <b>
              {tx.crop(c.item.crop)}
              {sown[c.item.season] === c.item.crop.id &&
                ` · ${t('already sown', 'বোনা হয়ে গেছে')}`}
            </b>
            <span>
              {sown[c.item.season] === c.item.crop.id && sownOn(c.item.season)
                ? t(
                    `Sown on ${tx.date(sownOn(c.item.season)!)}`,
                    `বোনা হয়েছে ${tx.date(sownOn(c.item.season)!)}`,
                  )
                : t(`Sow around ${tx.date(c.item.sow)}`, `বোনা প্রায় ${tx.date(c.item.sow)}`)}{' '}
              · {tx.irrigations(c.irrigations)}
            </span>
          </li>
        ))}
      </ol>
      <p>
        {chosen
          ? t(
              'Crops you have already sown stay as they are. Crops not started yet are replaced by this plan.',
              'যে ফসল বোনা হয়ে গেছে তা যেমন আছে থাকবে। যা এখনো শুরু হয়নি, সেগুলো এই পরিকল্পনা দিয়ে বদলাবে।',
            )
          : t(
              'Ritu will build this plot’s calendar for the whole year from this plan. You can change it later from Your plan.',
              'এই পরিকল্পনা থেকে ঋতু এই প্লটের পুরো বছরের ক্যালেন্ডার বানাবে। পরে “আপনার পরিকল্পনা” থেকে বদলানো যাবে।',
            )}
      </p>
      <div className="button-row">
        <button
          className="button primary"
          onClick={() => choose(asking.a, asking.source, asking.id)}
        >
          {t('Yes, choose this plan', 'হ্যাঁ, এটি নিন')}
        </button>
        <button className="button secondary" onClick={() => setAsking(null)}>
          {t('Not yet', 'আবার দেখি')}
        </button>
      </div>
    </Dialog>
  );

  if (chosen && chosenAssessment && !changing && mode === 'plans') {
    const a = chosenAssessment;
    return (
      <div className="season-page evidence-page rot-page">
        <header className="season-page-heading">
          <div>
            <span className="eyebrow">{t('YOUR PLAN', 'আপনার পরিকল্পনা')}</span>
            <h1>{t(`${plot.name}’s plan for this year`, `${plot.name}-এর এ বছরের পরিকল্পনা`)}</h1>
            <p>
              {t(
                `Chosen on ${tx.date(chosen.chosenAt.slice(0, 10))}. Here is the whole year at a glance and why it fits this plot, from NASA rain, heat and soil data.`,
                `${tx.date(chosen.chosenAt.slice(0, 10))} তারিখে বাছা। পুরো বছর এক নজরে, আর কেন এটি এই প্লটে মানায়: নাসার বৃষ্টি, গরম ও মাটির তথ্য থেকে।`,
              )}
            </p>
          </div>
          <button
            className="button secondary"
            onClick={() =>
              router.push(
                `/plot?field=${encodeURIComponent(field.id)}&plot=${encodeURIComponent(plot.id)}`,
              )
            }
          >
            <ArrowLeft size={17} />
            {t('Back to plot', 'প্লটে ফিরুন')}
          </button>
        </header>
        {lastYearLine}
        <article className="card rot-plan best rot-chosen">
          <div className="rot-plan-head">
            <h2>{a.crops.map((c) => tx.crop(c.item.crop)).join(' → ')}</h2>
            <span className="rot-badge">
              {chosen.source === 'custom'
                ? t('Your own plan', 'আপনার নিজের পরিকল্পনা')
                : t('Suggested by Ritu', 'ঋতুর পরামর্শ')}
            </span>
          </div>
          {planBody(a, chosen.patternId === 'last-year' ? null : lastIrrigations)}
          <PlotPlanSequence plot={plot} field={field} />
        </article>
        <div className="rot-more">
          <span>{t('Want a different plan?', 'অন্য পরিকল্পনা চান?')}</span>
          <button className="button secondary" onClick={() => setAskChange(true)}>
            {t('Change plan', 'পরিকল্পনা বদলান')}
          </button>
        </div>
        {askChange && (
          <Dialog
            title={t('Change this plot’s plan?', 'এই প্লটের পরিকল্পনা বদলাবেন?')}
            onClose={() => {
              setAskChange(false);
              if (window.location.search) window.history.replaceState(null, '', '/crops');
            }}
          >
            <p>
              {t(
                'You will see the suggested plans again. Crops you have already sown stay as they are; only crops not started yet will change.',
                'আবার পরামর্শগুলো দেখবেন। যে ফসল বোনা হয়ে গেছে তা যেমন আছে থাকবে; শুধু যেগুলো এখনো শুরু হয়নি সেগুলো বদলাবে।',
              )}
            </p>
            <div className="button-row">
              <button
                className="button primary"
                onClick={() => {
                  setAskChange(false);
                  setChanging(true);
                  if (window.location.search) window.history.replaceState(null, '', '/crops');
                  window.scrollTo({ top: 0 });
                }}
              >
                {t('Yes, show the plans', 'হ্যাঁ, পরিকল্পনাগুলো দেখান')}
              </button>
              <button
                className="button secondary"
                onClick={() => {
                  setAskChange(false);
                  if (window.location.search) window.history.replaceState(null, '', '/crops');
                }}
              >
                {t('Keep my plan', 'আমার পরিকল্পনাই থাক')}
              </button>
            </div>
          </Dialog>
        )}
      </div>
    );
  }

  if (mode === 'builder') {
    const has = customAssessment.crops.length > 0;
    return (
      <div className="season-page evidence-page rot-page">
        <header className="season-page-heading">
          <div>
            <span className="eyebrow">{t('CHOOSE CROPS MYSELF', 'নিজে ফসল বাছুন')}</span>
            <h1>{t(`Your own plan for ${plot.name}`, `${plot.name}-এর জন্য নিজের পরিকল্পনা`)}</h1>
            <p>
              {t(
                'One crop per season, up to three in the year, or leave a season empty. Each crop is rated for this plot.',
                'প্রতি মৌসুমে একটি ফসল, বছরে সর্বোচ্চ তিনটি। চাইলে কোনো মৌসুম খালি রাখুন। প্রতিটি ফসল এই প্লটের জন্য যাচাই করা।',
              )}
            </p>
          </div>
          <button className="button secondary" onClick={() => setMode('plans')}>
            <ArrowLeft size={17} />
            {t('Back to plans', 'পরামর্শে ফিরুন')}
          </button>
        </header>
        <div className="rot-builder">
          {order.map((s) => {
            const id = custom[s];
            const mine = id ? customAssessment.crops.find((c) => c.item.crop.id === id) : undefined;
            const open = picking === s;
            const options = rotationCropIds
              .filter((k) => rotationCrops[k].season === s)
              .map((k) => {
                const trial = assessPlan({ ...custom, [s]: k }, from, climate, conditions);
                return { k, a: trial.crops.find((c) => c.item.crop.id === k)!, trial };
              })
              .filter((o) => o.a)
              .sort(
                (x, y) =>
                  verdictRank[x.a.verdict] - verdictRank[y.a.verdict] ||
                  x.a.levels.water +
                    x.a.levels.heat +
                    x.a.levels.soil +
                    x.a.levels.wear -
                    (y.a.levels.water + y.a.levels.heat + y.a.levels.soil + y.a.levels.wear),
              );
            return (
              <section key={s} className={`rot-slot ${seasonClass(s)}`}>
                <div className="rot-slot-head">
                  <div>
                    <span className={`rot-season-tag ${seasonClass(s)}`}>{tx.season(s).name}</span>
                    <small>{tx.season(s).span}</small>
                  </div>
                  <div className="rot-slot-choice">
                    {mine ? (
                      <>
                        <strong>{tx.crop(mine.item.crop)}</strong>{' '}
                        <VerdictPill verdict={mine.verdict} label={tx.verdict(mine.verdict)} />
                        <small>
                          {t(
                            `Sow ${tx.date(mine.item.sow)} · harvest about ${tx.date(mine.item.harvest)}`,
                            `বোনা ${tx.date(mine.item.sow)} · কাটা প্রায় ${tx.date(mine.item.harvest)}`,
                          )}
                        </small>
                      </>
                    ) : (
                      <span className="rot-muted">{t('Left empty', 'খালি থাকবে')}</span>
                    )}
                  </div>
                  <div className="rot-slot-actions">
                    {sown[s] ? (
                      <span className="rot-muted">
                        {t('Already sown: it stays', 'বোনা হয়ে গেছে, এটিই থাকবে')}
                      </span>
                    ) : (
                      <>
                        <button
                          className="button secondary"
                          aria-expanded={open}
                          onClick={() => setPicking(open ? null : s)}
                        >
                          {open
                            ? t('Close', 'বন্ধ করুন')
                            : id
                              ? t('Change crop', 'ফসল বদলান')
                              : t('Choose crop', 'ফসল বাছুন')}
                        </button>
                        {id && (
                          <button
                            className="text-button"
                            onClick={() => setCustom({ ...custom, [s]: null })}
                          >
                            {t('Leave empty', 'খালি রাখুন')}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {open && !sown[s] && (
                  <div className="rot-options" role="listbox" aria-label={tx.season(s).name}>
                    {options.map(({ k, a, trial }) => (
                      <button
                        key={k}
                        role="option"
                        aria-selected={id === k}
                        className={`rot-option ${a.verdict === 'no' ? 'blocked' : ''}`}
                        onClick={() => {
                          setCustom({ ...custom, [s]: k });
                          setPicking(null);
                        }}
                      >
                        <span className="rot-option-photo">
                          <CropPhoto crop={k} />
                        </span>
                        <span className="rot-option-top">
                          <strong>{tx.crop(rotationCrops[k])}</strong>
                          <VerdictPill verdict={a.verdict} label={tx.verdict(a.verdict)} />
                        </span>
                        <YearChart
                          crops={chartCrops(trial)}
                          climate={climate}
                          start={from}
                          focus={k}
                          tx={tx}
                          t={t}
                          language={language}
                          width={320}
                          height={70}
                        />
                        <IntensityBars rows={cropRows(a, tx, t)} t={t} compact />
                        <span className="rot-why">
                          <b>
                            {a.reason.kind === 'timing'
                              ? t("Doesn't fit:", 'মিলবে না:')
                              : 'watch' in a.reason && a.reason.watch
                                ? t('Watch out:', 'সাবধান:')
                                : t('Good point:', 'ভালো দিক:')}
                          </b>{' '}
                          {tx.reason(a.reason, a, profile.soil)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
        {has && (
          <section className="card rot-summary">
            <YearChart
              crops={chartCrops(customAssessment)}
              climate={climate}
              start={from}
              tx={tx}
              t={t}
              language={language}
            />
            <YearKey t={t} />
            {customAssessment.problems.length ? (
              <div className="rot-check bad" role="alert">
                <strong>
                  {t("These crops don't fit in one year", 'এই ফসলগুলো এক বছরে মিলছে না')}
                </strong>
                {customAssessment.crops
                  .filter((c) => c.reason.kind === 'timing')
                  .slice(0, 1)
                  .map((c) => (
                    <span key={c.item.crop.id}>{tx.reason(c.reason, c, profile.soil)}</span>
                  ))}
              </div>
            ) : (
              <>
                <div className="rot-check good">
                  {t(
                    'The timing works: each crop is out before the next goes in.',
                    'সময় মিলছে: প্রতিটি ফসল কাটার পরে পরেরটা বোনা যাবে।',
                  )}
                </div>
                <div className="rot-plan-body">
                  <IrrigationCompare
                    count={customAssessment.irrigations}
                    last={lastIrrigations}
                    tx={tx}
                    t={t}
                  />
                  <IntensityBars rows={planRows(customAssessment, tx, t)} t={t} />
                </div>
              </>
            )}
          </section>
        )}
        <div className="button-row">
          <button
            className="button primary"
            disabled={!has || customAssessment.problems.length > 0}
            onClick={() =>
              setAsking({
                id: 'custom',
                title: t('Your own plan', 'আপনার নিজের পরিকল্পনা'),
                a: customAssessment,
                source: 'custom',
              })
            }
          >
            {t('Choose this plan', 'এই পরিকল্পনা নিন')}
            <ArrowRight size={18} />
          </button>
          <button
            className="button secondary"
            disabled={!has || customAssessment.problems.length > 0}
            onClick={() => {
              setCustomSaved(true);
              setMode('plans');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            {t('Compare with the suggested plans', 'পরামর্শের সঙ্গে মিলিয়ে দেখুন')}
          </button>
        </div>
        {confirmDialog}
      </div>
    );
  }

  return (
    <div className="season-page evidence-page rot-page">
      <header className="season-page-heading">
        <div>
          <span className="eyebrow">{t('SUGGESTED PLANS', 'পরামর্শ')}</span>
          <h1>
            {t(`What should ${plot.name} grow this year?`, `এ বছর ${plot.name}-এ কী চাষ করবেন?`)}
          </h1>
          <p>
            {t(
              'Each plan is a full year on this plot, worked out from NASA rain, heat and soil data for this place. Choosing a plan chooses all three seasons at once.',
              'প্রতিটি পরিকল্পনা এই প্লটের পুরো এক বছরের, এই জায়গার নাসার বৃষ্টি, গরম ও মাটির তথ্য থেকে তৈরি। একটি বাছলে তিন মৌসুমের ফসল একসঙ্গে বাছা হয়।',
            )}
          </p>
        </div>
        <button
          className="button secondary"
          onClick={() =>
            router.push(
              `/plot?field=${encodeURIComponent(field.id)}&plot=${encodeURIComponent(plot.id)}`,
            )
          }
        >
          <ArrowLeft size={17} />
          {t('Back to plot', 'প্লটে ফিরুন')}
        </button>
      </header>
      {lastYearLine}
      {chosen && (
        <p className="notice-amber rot-changing">
          {locked
            ? t(
                `You are changing this plot’s plan. ${sownNames} is already sown, so every plan below keeps it.`,
                `আপনি এই প্লটের পরিকল্পনা বদলাচ্ছেন। ${sownNames} বোনা হয়ে গেছে, তাই নিচের প্রতিটি পরিকল্পনায় এটি থাকবে।`,
              )
            : t(
                'You are changing this plot’s plan. Nothing is sown yet, so all three seasons can change.',
                'আপনি এই প্লটের পরিকল্পনা বদলাচ্ছেন। এখনো কিছু বোনা হয়নি, তাই তিন মৌসুমই বদলানো যাবে।',
              )}{' '}
          <button className="text-button" onClick={() => setChanging(false)}>
            {t('Keep my current plan', 'বর্তমান পরিকল্পনাই রাখুন')}
          </button>
        </p>
      )}
      {error && (
        <p className="notice-amber" role="alert">
          {error}
        </p>
      )}
      {locked && !plans.length && (
        <p className="notice-amber">
          {t(
            `No suggested plan fits around the ${sownNames} already sown. Choose the other seasons yourself below.`,
            `ইতিমধ্যে বোনা ${sownNames} রেখে মেলে এমন কোনো পরামর্শ নেই। নিচে বাকি মৌসুমের ফসল নিজে বাছুন।`,
          )}
        </p>
      )}
      <div className="rot-plans">
        {plans.map((p, i) => (
          <article key={p.id} className={`card rot-plan ${p.a.score === best ? 'best' : ''}`}>
            <div className="rot-plan-head">
              <h2>
                {p.source === 'custom'
                  ? ''
                  : `${t('Plan', 'পরিকল্পনা')} ${letters[language][i]} · `}
                {p.title}
              </h2>
              {p.a.score === best && (
                <span className="rot-badge">
                  {t('Best fit for this plot', 'এই জমির জন্য সবচেয়ে ভালো')}
                </span>
              )}
            </div>
            {planBody(p.a, p.id === 'last-year' ? null : lastIrrigations)}
            <div className="button-row">
              <button
                className="button primary"
                onClick={() => setAsking({ id: p.id, title: p.title, a: p.a, source: p.source })}
              >
                {t('Choose this plan', 'এই পরিকল্পনা নিন')}
                <ArrowRight size={18} />
              </button>
              <button
                className="text-button"
                onClick={() => {
                  setCustom({ ...p.a.plan });
                  setPicking(null);
                  setMode('builder');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                {p.source === 'custom'
                  ? t('Edit my plan', 'আমার পরিকল্পনা বদলান')
                  : t('Change a crop', 'একটি ফসল বদলান')}
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="rot-more">
        <span>{t('None of these fit?', 'এগুলোর কোনোটা পছন্দ না?')}</span>
        <button
          className="button secondary"
          onClick={() => {
            setPicking(order[0]);
            setMode('builder');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        >
          {t('Choose crops myself', 'নিজে ফসল বাছুন')}
        </button>
        <button className="text-button" onClick={onSingle}>
          {t('Pick one crop from the full list instead', 'পুরো তালিকা থেকে একটি ফসল বাছুন')}
        </button>
      </div>
      {confirmDialog}
    </div>
  );
}
