'use client';
import { useRef, useState, type FormEvent, type ReactNode } from 'react';
import { changePlanKey } from '../lib/change-plan';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Check, Plus } from 'lucide-react';
import { usePlanner } from './planner-provider';
import { seasonStore, useSeasonFarms } from '../lib/season-store';
import { useFieldLog } from '../lib/field-log-store';
import { crops } from '../data/crops';
import { cropIds, type CropId, type Farm, type Language } from '../domain/types';
import { fieldReady, type RegisteredField } from '../domain/field-registry';
import { localToday, type SeasonFarm } from '../domain/global-season';
import { addDays, validDate, type Season } from '../domain/evidence-planner';
import { fieldConfirmationKey } from '../domain/field-confirmation';
import { evidenceStore } from '../lib/evidence-store';
import { Dialog } from './dialog';
import {
  peakPlotArea,
  plotProfile,
  plotSeasons,
  type Plot,
  type PlotCrop,
  type PlotOverrides,
} from '../domain/plot';
import {
  areaFromHectares,
  areaToHectares,
  areaUnits,
  areaUnitOptionLabel,
  type AreaUnit,
} from '../domain/area-units';
import { pilotRegionFor } from '../data/regions';
import { localDigits } from '../domain/numerals';
import { PlotPlanSequence } from './rotation/plot-plan';
import { rotationText } from './rotation/rotation-text';
import type { RegionMatch } from '../domain/region';

type Translate = (en: string, bn: string) => string;

/** Crops shown as tiles per season outside a pilot region; every other crop stays in "Another crop". */
const commonCrops: Record<Season, PlotCrop[]> = {
  'pre-monsoon': ['fallow', 'mung', 'aus', 'jute', 'unknown'],
  monsoon: ['aman', 'fallow', 'unknown'],
  winter: ['boro', 'wheat', 'mustard', 'lentil', 'potato', 'fallow', 'unknown'],
};
const emptyYear: Plot['lastYear'] = {
  'pre-monsoon': 'unknown',
  monsoon: 'unknown',
  winter: 'unknown',
};
const hectares = (n: number) => Number(n.toFixed(4));

/** Inside a pilot region, the tiles are the crops with a sourced regional calendar. */
const seasonTiles = (season: Season, match: RegionMatch | null): PlotCrop[] =>
  match ? [...match.region.seasonCrops[season], 'fallow', 'unknown'] : commonCrops[season];

export function seasonLabel(season: Season, t: Translate) {
  if (season === 'pre-monsoon')
    return {
      name: t('Summer', 'গ্রীষ্ম'),
      detail: t('Kharif I · about Mar–Jun', 'খরিফ ১ · মোটামুটি মার্চ–জুন'),
    };
  if (season === 'monsoon')
    return {
      name: t('Rainy season', 'বর্ষা'),
      detail: t('Kharif II · about Jul–Oct', 'খরিফ ২ · মোটামুটি জুলাই–অক্টোবর'),
    };
  return {
    name: t('Winter', 'শীত'),
    detail: t('Rabi · about Nov–Feb', 'রবি · মোটামুটি নভেম্বর–ফেব্রুয়ারি'),
  };
}

export function plotCropName(crop: PlotCrop, language: Language, t: Translate) {
  if (crop === 'fallow') return t('Left empty', 'খালি ছিল');
  if (crop === 'unknown') return t('Not sure', 'নিশ্চিত নই');
  return crops[crop].name[language];
}

/** "Aman rice → Boro rice": the crops grown last year, in season order. */
export function rotationSummary(lastYear: Plot['lastYear'], language: Language, t: Translate) {
  const grown = plotSeasons
    .map((s) => lastYear[s])
    .filter((c): c is CropId => c !== 'fallow' && c !== 'unknown');
  if (grown.length) return grown.map((c) => crops[c].name[language]).join(' → ');
  return plotSeasons.some((s) => lastYear[s] === 'unknown')
    ? t('Not recorded yet', 'এখনো দেওয়া হয়নি')
    : t('Left empty all year', 'সারা বছর খালি ছিল');
}

/** Area taken by other plots that are still in use on this field, in hectares. */
function usedArea(plots: Plot[], fieldId: string, today: string, exceptId?: string) {
  return peakPlotArea(
    plots.filter((p) => p.id !== exceptId && (!p.endDate || p.endDate >= today)),
    fieldId,
  );
}

const plotHref = (fieldId: string, plotId?: string) =>
  `/plot?field=${encodeURIComponent(fieldId)}${plotId ? `&plot=${encodeURIComponent(plotId)}` : ''}`;

/** Open a plot's year plan page without the setup form; with `change`, it starts by asking to change the plan. */
export function openPlotPlan(
  field: RegisteredField,
  plot: Plot,
  change: boolean,
  router: ReturnType<typeof useRouter>,
) {
  if (!field.site || !plot.plan) return;
  const from = plot.plan.from;
  const farm = {
    ...plotProfile(field.profile, plot),
    name: plot.name,
    area: plot.areaHa,
    lastYear: plot.lastYear,
  };
  evidenceStore.update({
    farm,
    site: field.site,
    climate: undefined,
    from,
    district: '',
    preferred: [],
    unplanted: [],
    reviewed: null,
    selected: null,
  });
  // Also kept for the page itself: leaving the calendar can redirect to /crops without the query.
  try {
    if (change) sessionStorage.setItem(changePlanKey, plot.id);
    else sessionStorage.removeItem(changePlanKey);
  } catch {
    /* The query below still carries it. */
  }
  seasonStore.selectField(field.id, false, plot.id);
  seasonStore.confirm(fieldConfirmationKey(farm, field.site, from));
  router.push(change ? '/crops?change=1' : '/crops');
}

/** Area of a land covered by its current plots. */
export const plotAreaInUse = (plots: Plot[], fieldId: string, today: string) =>
  usedArea(plots, fieldId, today);

/** The plots inside one land on the dashboard: one tile per plot, then an "Add a plot" tile. */
export function FieldPlots({
  field,
  farms,
  renderCrop,
}: {
  field: RegisteredField;
  /** Current crops on this land that belong to a plot. */
  farms: SeasonFarm[];
  renderCrop: (farm: SeasonFarm) => ReactNode;
}) {
  const { t, language } = usePlanner(),
    { state } = useSeasonFarms(),
    router = useRouter();
  const today = localToday(field.site?.timezone),
    all = state.plots ?? [],
    plots = all.filter((p) => p.fieldId === field.id && (!p.endDate || p.endDate >= today)),
    stopped = all.filter((p) => p.fieldId === field.id && !!p.endDate && p.endDate < today),
    free = Math.max(0, field.profile.area - usedArea(all, field.id, today));
  return (
    <div
      className="field-plots"
      data-tour="dashboard-plots"
      aria-label={`${t('Plots in', 'প্লট')}: ${field.name}`}
    >
      <div className="field-plots-heading">
        <h3>
          {t('Plots', 'প্লট')} <small>({localDigits(plots.length, language)})</small>
        </h3>
        {!plots.length && (
          <p className="field-plots-empty">
            {t(
              'Divide this land into plots. For each plot you enter last year’s crops and get crop suggestions.',
              'জমিকে প্লটে ভাগ করুন। প্রতিটি প্লটে গত বছরের ফসল দিয়ে ফসলের পরামর্শ পাবেন।',
            )}
          </p>
        )}
      </div>
      <ul className="plot-tile-grid">
        {plots.map((p) => {
          const crops = farms.filter((f) => f.plotId === p.id && !f.rotationSeason);
          return (
            <li key={p.id} className="plot-tile-card">
              <div className="plot-tile-top">
                <strong>{p.name}</strong>
                <span className="plot-tile-size">
                  {localDigits(hectares(p.areaHa), language)} {t('ha', 'হেক্টর')}
                </span>
              </div>
              <p className="plot-tile-last">
                <span>{t('Last year', 'গত বছর')}</span>
                {rotationSummary(p.lastYear, language, t)}
              </p>
              {plotDifferenceText(p.overrides, t).length > 0 && (
                <p className="plot-tile-diff">
                  {plotDifferenceText(p.overrides, t).join(' · ')}{' '}
                  <span>{t('(this plot)', '(এই প্লট)')}</span>
                </p>
              )}
              {p.plan && <PlotPlanSequence plot={p} field={field} />}
              {crops.length ? (
                <div className="plot-tile-crops">{crops.map(renderCrop)}</div>
              ) : p.plan ? null : (
                <p className="plot-tile-nocrop">
                  {t('No crop chosen yet.', 'এখনো ফসল বাছা হয়নি।')}
                </p>
              )}
              {p.plan ? (
                <>
                  <button
                    className="button secondary plot-tile-open"
                    type="button"
                    onClick={() => openPlotPlan(field, p, true, router)}
                    aria-label={`${t('Change plan', 'পরিকল্পনা বদলান')}: ${p.name}`}
                  >
                    {t('Change plan', 'পরিকল্পনা বদলান')}
                    <ArrowRight size={17} />
                  </button>
                  <Link className="text-button plot-tile-edit" href={plotHref(field.id, p.id)}>
                    {t('Edit or remove plot', 'প্লট বদলান বা সরান')}
                  </Link>
                </>
              ) : (
                <Link
                  className={`button ${crops.length ? 'secondary' : 'primary'} plot-tile-open`}
                  href={plotHref(field.id, p.id)}
                  aria-label={`${t('Open plot', 'প্লট খুলুন')}: ${p.name}`}
                >
                  {crops.length ? t('Open plot', 'প্লট খুলুন') : t('Choose crops', 'ফসল বাছুন')}
                  <ArrowRight size={17} />
                </Link>
              )}
            </li>
          );
        })}
        {free > 1e-8 && (
          <li>
            <Link className="plot-add-tile" href={plotHref(field.id)}>
              <Plus size={26} />
              <strong>{t('Add a plot', 'প্লট যোগ করুন')}</strong>
              <span>
                {localDigits(hectares(free), language)} {t('ha free', 'হেক্টর খালি')}
              </span>
            </Link>
          </li>
        )}
      </ul>
      {stopped.length > 0 && <StoppedPlots plots={stopped} />}
    </div>
  );
}

const waterText = (w: Farm['irrigation'], t: Translate) =>
  ({
    reliable: t('Reliable irrigation', 'নির্ভরযোগ্য সেচ'),
    limited: t('Limited irrigation', 'সীমিত সেচ'),
    rainfed: t('Rain only', 'শুধু বৃষ্টি'),
    severe: t('Severe shortage', 'তীব্র সংকট'),
    unknown: t('Not sure', 'জানা নেই'),
  })[w];
const drainageText = (d: Farm['drainage'], t: Translate) =>
  ({
    good: t('Good: water drains within a day', 'ভালো: এক দিনের মধ্যে পানি নেমে যায়'),
    imperfect: t('Partly: stays wet for a while in the rains', 'মাঝারি: বর্ষায় কিছুদিন ভেজা থাকে'),
    poor: t('Poor: water stands after rain', 'খারাপ: বৃষ্টির পর পানি জমে থাকে'),
    unknown: t('Not sure', 'জানা নেই'),
  })[d];
/** Short words for a plot's own water and drainage, e.g. on its dashboard tile. */
export function plotDifferenceText(o: PlotOverrides | undefined, t: Translate) {
  const parts = [
    o?.irrigation &&
      {
        reliable: t('Reliable water', 'নির্ভরযোগ্য সেচ'),
        limited: t('Limited water', 'সীমিত সেচ'),
        rainfed: t('Rain only', 'শুধু বৃষ্টি'),
        severe: t('Severe water shortage', 'পানির তীব্র সংকট'),
      }[o.irrigation],
    o?.drainage &&
      {
        good: t('Good drainage', 'ভালো নিষ্কাশন'),
        imperfect: t('Partly wet in the rains', 'বর্ষায় কিছুদিন ভেজা'),
        poor: t('Poor drainage', 'খারাপ নিষ্কাশন'),
      }[o.drainage],
  ].filter(Boolean) as string[];
  return parts;
}

/** Water and drainage of a plot where it differs from its land; closed unless it already does. */
function PlotDifferences({
  land,
  value,
  onChange,
  open,
}: {
  land: Farm;
  value: PlotOverrides;
  onChange: (o: PlotOverrides) => void;
  open: boolean;
}) {
  const { t } = usePlanner();
  const chips = plotDifferenceText(value, t);
  return (
    <details className="plot-diff" open={open || undefined}>
      <summary data-tour="plot-differences">
        <span className="plot-diff-chev" aria-hidden="true">
          ›
        </span>
        <strong>
          {t('This plot is different from the land', 'এই প্লট জমির বাকি অংশ থেকে আলাদা')}
        </strong>
        {chips.length > 0 && (
          <span className="plot-diff-chips">
            {chips.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </span>
        )}
        <small>
          {chips.length
            ? t(
                'Plans for this plot use these answers; the rest is the land’s.',
                'এই প্লটের পরিকল্পনায় এগুলো ধরা হবে; বাকিটা জমির মতো।',
              )
            : t(
                'Water and drainage are the land’s unless you change them here.',
                'এখানে না বদলালে সেচ ও নিষ্কাশন জমির মতোই ধরা হবে।',
              )}
        </small>
      </summary>
      <div className="plot-diff-grid">
        <div className={`form-field${value.irrigation ? ' changed' : ''}`}>
          <label htmlFor="plot-water">{t('Water for this plot', 'এই প্লটে পানির সুযোগ')}</label>
          <select
            id="plot-water"
            value={value.irrigation ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                irrigation: (e.target.value || undefined) as PlotOverrides['irrigation'],
              })
            }
          >
            <option value="">
              {t(
                `Same as the land (${waterText(land.irrigation, t)})`,
                `জমির মতো (${waterText(land.irrigation, t)})`,
              )}
            </option>
            {(['reliable', 'limited', 'rainfed', 'severe'] as const).map((w) => (
              <option key={w} value={w}>
                {waterText(w, t)}
              </option>
            ))}
          </select>
          <small>
            {t(
              'Far from the pump, or higher ground that dries out? Choose what this plot really gets.',
              'পাম্প থেকে দূরে, বা উঁচু জায়গা যা শুকিয়ে যায়? এই প্লট আসলে যা পায় তা বাছুন।',
            )}
          </small>
        </div>
        <div className={`form-field${value.drainage ? ' changed' : ''}`}>
          <label htmlFor="plot-drainage">{t('Drainage', 'পানি নিষ্কাশন')}</label>
          <select
            id="plot-drainage"
            value={value.drainage ?? ''}
            onChange={(e) =>
              onChange({
                ...value,
                drainage: (e.target.value || undefined) as PlotOverrides['drainage'],
              })
            }
          >
            <option value="">
              {t(
                `Same as the land (${drainageText(land.drainage, t)})`,
                `জমির মতো (${drainageText(land.drainage, t)})`,
              )}
            </option>
            {(['good', 'imperfect', 'poor'] as const).map((d) => (
              <option key={d} value={d}>
                {drainageText(d, t)}
              </option>
            ))}
          </select>
          <small>
            {t(
              'A low corner that holds water drains worse than the rest of the land.',
              'নিচু কোণে পানি জমলে সেখানে জমির বাকি অংশের চেয়ে নিষ্কাশন খারাপ।',
            )}
          </small>
        </div>
      </div>
    </details>
  );
}

/** Plots no longer used on a land, with their records kept; one can be used again if it fits. */
function StoppedPlots({ plots }: { plots: Plot[] }) {
  const { t, language } = usePlanner();
  const tx = rotationText(t, language);
  const [error, setError] = useState('');
  return (
    <details className="plot-stopped">
      <summary>
        {t('Plots no longer used', 'আর ব্যবহার হচ্ছে না এমন প্লট')} (
        {localDigits(plots.length, language)})
      </summary>
      <ul>
        {plots.map((p) => (
          <li key={p.id}>
            <span>
              <strong>{p.name}</strong> · {localDigits(hectares(p.areaHa), language)}{' '}
              {t('ha', 'হেক্টর')} ·{' '}
              {t(
                `stopped ${tx.date(addDays(p.endDate!, 1))}`,
                `বন্ধ ${tx.date(addDays(p.endDate!, 1))}`,
              )}
            </span>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                try {
                  seasonStore.reopenPlot(p.id);
                  setError('');
                } catch (e) {
                  setError(e instanceof Error ? e.message : '');
                }
              }}
            >
              {t('Use again', 'আবার ব্যবহার করুন')}
            </button>
          </li>
        ))}
      </ul>
      {error && (
        <p className="notice-amber" role="alert">
          {error}
        </p>
      )}
    </details>
  );
}

export function PlotSetupView(props: { fieldId?: string; plotId?: string }) {
  const { t } = usePlanner(),
    { state, ready } = useSeasonFarms();
  // Read from the address bar too: a new plot replaces the address with its own (see savePlot),
  // and Back must then open that plot, not the empty form.
  const params = useSearchParams();
  const fieldId = params.get('field') ?? props.fieldId,
    plotId = params.get('plot') ?? props.plotId;
  const field = state.fields?.find((f) => f.id === fieldId),
    existing = state.plots?.find((p) => p.id === plotId && p.fieldId === fieldId);
  if (!ready)
    return (
      <div className="season-page evidence-page">
        <p role="status">{t('Loading your fields…', 'আপনার জমি আনা হচ্ছে…')}</p>
      </div>
    );
  if (!field || !fieldReady(field) || (plotId && !existing))
    return (
      <div className="season-page evidence-page">
        <p className="notice-amber" role="alert">
          {!field || (plotId && !existing)
            ? t('This field or plot no longer exists.', 'এই জমি বা প্লট আর নেই।')
            : t(
                'Set up this field’s location and area before adding plots.',
                'প্লট যোগ করার আগে এই জমির স্থান ও আয়তন দিন।',
              )}
        </p>
        <Link className="button primary" href="/farms">
          {t('Back to my fields', 'আমার জমিতে ফিরুন')}
        </Link>
      </div>
    );
  return <PlotForm key={existing?.id ?? `new-${field.id}`} field={field} existing={existing} />;
}

function PlotForm({ field, existing }: { field: RegisteredField; existing?: Plot }) {
  const created = useRef<Plot | null>(null);
  const { t, language } = usePlanner(),
    { state } = useSeasonFarms(),
    router = useRouter();
  const today = localToday(field.site?.timezone),
    plots = state.plots ?? [],
    free = Math.max(0, field.profile.area - usedArea(plots, field.id, today, existing?.id)),
    count = plots.filter((p) => p.fieldId === field.id).length,
    match = pilotRegionFor(field.site);
  const [name, setName] = useState(
      existing?.name ?? `${t('Plot', 'প্লট')} ${localDigits(count + 1, language)}`,
    ),
    [unit, setUnit] = useState<AreaUnit>('hectares'),
    // Prefilled with the exact free area: a rounded hectare figure shows as 19.99997 acres.
    [area, setArea] = useState(existing?.areaHa ?? free),
    [from, setFrom] = useState(today),
    [askLastYear, setAskLastYear] = useState<Partial<Plot['lastYear']> | null>(null),
    [error, setError] = useState(''),
    [removing, setRemoving] = useState(false),
    [overrides, setOverrides] = useState<PlotOverrides>(existing?.overrides ?? {});
  // Only the answers that differ from the land are kept.
  const ownOverrides = (): PlotOverrides | undefined => {
    const o: PlotOverrides = {};
    if (overrides.irrigation) o.irrigation = overrides.irrigation;
    if (overrides.drainage) o.drainage = overrides.drainage;
    return o.irrigation || o.drainage ? o : undefined;
  };
  const log = useFieldLog().state;
  // A plot with crop records, notes or irrigation can only be stopped, so they are kept.
  const records = existing
    ? {
        sown: state.farms.filter((f) => f.plotId === existing.id && f.plantedDate).length,
        notes: log.notes.filter((n) => n.plotId === existing.id).length,
        irrigations: log.irrigations.filter((r) => r.plotId === existing.id).length,
      }
    : null;
  const hasRecords = !!records && records.sown + records.notes + records.irrigations > 0;
  const remove = () => {
    if (!existing) return;
    try {
      if (hasRecords)
        seasonStore.endPlot(
          existing.id,
          addDays(today, -1) < existing.startDate ? today : addDays(today, -1),
        );
      else seasonStore.removePlot(existing.id);
      router.push('/farms');
    } catch (e) {
      setRemoving(false);
      setError(e instanceof Error ? e.message : t('This could not be saved.', 'এটি রাখা যায়নি।'));
    }
  };

  /** Checks name, size and date; returns an error message or ''. */
  function problem() {
    if (!name.trim()) return t('Give the plot a name.', 'প্লটের একটি নাম দিন।');
    if (!(area > 0)) return t('Enter the plot size.', 'প্লটের আয়তন দিন।');
    if (area > free + 1e-8)
      return t(
        `This land has ${hectares(free)} ha free. Make the plot smaller, or change the other plots first.`,
        `এই জমিতে ${localDigits(hectares(free), 'bn')} হেক্টর খালি আছে। প্লট ছোট করুন, অথবা আগে অন্য প্লট বদলান।`,
      );
    if (!validDate(from) || from < today || from > addDays(today, 730))
      return t(
        'Choose a ready-to-plant date within the next two years.',
        'আগামী দুই বছরের মধ্যে রোপণের প্রস্তুত দিন বাছুন।',
      );
    return '';
  }
  /** Saves the plot and returns it, or shows the error and returns null. */
  function savePlot(lastYear: Plot['lastYear']): Plot | null {
    try {
      // A plot this form already created (a second tap before the page moves on) is updated,
      // never added again.
      const current = existing ?? created.current;
      if (current) {
        const patch = { name: name.trim(), areaHa: area, lastYear, overrides: ownOverrides() };
        seasonStore.updatePlot(current.id, patch);
        return { ...current, ...patch };
      }
      const plot: Plot = {
        id: crypto.randomUUID(),
        fieldId: field.id,
        name: name.trim(),
        areaHa: area,
        startDate: today,
        madeFrom: [],
        lastYear,
        ...(ownOverrides() ? { overrides: ownOverrides() } : {}),
      };
      seasonStore.addPlot(plot);
      created.current = plot;
      // From now on this page is the new plot's page: going Back to it edits the plot instead of
      // showing an empty "Add a plot" form that would save a second copy.
      window.history.replaceState(window.history.state, '', plotHref(field.id, plot.id));
      return plot;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t('Could not save the plot.', 'প্লট সংরক্ষণ হয়নি।'),
      );
      return null;
    }
  }
  function showCrops(e: FormEvent) {
    e.preventDefault();
    const message = problem();
    setError(message);
    if (!message) setAskLastYear(existing?.lastYear ?? {});
  }
  function continueToCrops(lastYear: Plot['lastYear']) {
    const plot = savePlot(lastYear);
    if (!plot || !field.site) return;
    // The crops step reads the land's conditions with this plot's size, name and history.
    const farm = {
      ...plotProfile(field.profile, plot),
      name: plot.name,
      area: plot.areaHa,
      lastYear,
    };
    evidenceStore.update({
      farm,
      site: field.site,
      climate: undefined,
      from,
      district: '',
      preferred: [],
      unplanted: [],
      reviewed: null,
      selected: null,
    });
    seasonStore.selectField(field.id, false, plot.id);
    seasonStore.activate(null);
    seasonStore.confirm(fieldConfirmationKey(farm, field.site, from));
    router.push('/crops');
  }

  return (
    <div className="season-page evidence-page">
      <header className="season-page-heading">
        <div>
          <span className="eyebrow">
            {field.name}
            {field.site?.name ? ` · ${field.site.name}` : ''}
          </span>
          <h1>{existing ? existing.name : t('Add a plot', 'প্লট যোগ করুন')}</h1>
          <p>
            {t(
              'A plot is a part of this land that you farm as one piece.',
              'প্লট হলো এই জমির এমন একটি অংশ যা আপনি একসঙ্গে চাষ করেন।',
            )}
          </p>
        </div>
      </header>
      <form className="card plot-form" onSubmit={showCrops} noValidate>
        <div className="plot-form-basics" data-tour="plot-basics">
          <div className="form-field">
            <label htmlFor="plot-name">{t('Plot name', 'প্লটের নাম')}</label>
            <input
              id="plot-name"
              type="text"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-required="true"
            />
          </div>
          <div className="form-field">
            <label htmlFor="plot-area">{t('Plot size', 'প্লটের আয়তন')}</label>
            <div className="plot-area-inputs">
              <input
                id="plot-area"
                type="number"
                min="0"
                step="any"
                inputMode="decimal"
                value={area ? Number(areaFromHectares(area, unit).toFixed(4)) : ''}
                onChange={(e) =>
                  setArea(e.target.value === '' ? 0 : areaToHectares(Number(e.target.value), unit))
                }
                aria-describedby="plot-area-help"
                aria-required="true"
              />
              <select
                aria-label={t('Area unit', 'আয়তনের একক')}
                value={unit}
                onChange={(e) => setUnit(e.target.value as AreaUnit)}
              >
                {areaUnits.map((u) => (
                  <option key={u} value={u}>
                    {areaUnitOptionLabel(u, t)}
                  </option>
                ))}
              </select>
            </div>
            <small id="plot-area-help">
              {t(
                `${hectares(free)} ha of ${hectares(field.profile.area)} ha free on this land`,
                `এই জমির ${localDigits(hectares(field.profile.area), 'bn')} হেক্টরের মধ্যে ${localDigits(hectares(free), 'bn')} হেক্টর খালি`,
              )}
            </small>
          </div>
          <div className="form-field">
            <label htmlFor="plot-from">{t('Ready to plant from', 'রোপণের প্রস্তুত দিন')}</label>
            <input
              id="plot-from"
              type="date"
              min={today}
              max={addDays(today, 730)}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
            <small>
              {t(
                'Choose when this plot will be ready for planting.',
                'এই প্লটে কবে রোপণ শুরু করতে পারবেন বাছুন।',
              )}
            </small>
          </div>
        </div>
        <PlotDifferences
          land={field.profile}
          value={overrides}
          onChange={setOverrides}
          open={!!(existing?.overrides?.irrigation || existing?.overrides?.drainage)}
        />
        {error && (
          <p className="notice-amber" role="alert">
            {error}
          </p>
        )}
        <div className="plot-form-actions">
          <button className="button primary" type="submit" data-tour="plot-suggest">
            {t('Show suggested plans', 'পরামর্শ দেখুন')}
            <ArrowRight size={18} />
          </button>
          <button
            className="button secondary"
            type="button"
            onClick={() => {
              const message = problem();
              setError(message);
              if (!message && savePlot(existing?.lastYear ?? emptyYear)) router.push('/farms');
            }}
          >
            {existing
              ? t('Save changes', 'পরিবর্তন সংরক্ষণ করুন')
              : t('Save plot', 'প্লট সংরক্ষণ করুন')}
          </button>
          <Link className="text-button" href="/farms">
            {t('Cancel', 'বাতিল')}
          </Link>
        </div>
        {existing && (
          <div className="plot-remove">
            <h2>{t('Remove this plot', 'এই প্লট সরান')}</h2>
            <p>
              {hasRecords
                ? t(
                    `${existing.name} has records (${records!.sown} crops sown, ${records!.notes} notes). It can be stopped, not deleted, so they are kept.`,
                    `${existing.name}-এ হিসাব আছে (${localDigits(records!.sown, 'bn')}টি ফসল বোনা, ${localDigits(records!.notes, 'bn')}টি নোট)। তাই মুছে ফেলা যাবে না, বন্ধ করা যাবে; হিসাব থেকে যাবে।`,
                  )
                : t(
                    `No crops, notes or irrigation are recorded on ${existing.name}.`,
                    `${existing.name}-এ কোনো ফসল, নোট বা সেচ লেখা নেই।`,
                  )}
            </p>
            <button
              className="button danger-outline"
              type="button"
              onClick={() => setRemoving(true)}
            >
              {hasRecords
                ? t(`Stop using ${existing.name}`, `${existing.name} বন্ধ করুন`)
                : t(`Delete ${existing.name}`, `${existing.name} মুছুন`)}
            </button>
          </div>
        )}
      </form>
      {removing && existing && (
        <Dialog
          title={
            hasRecords
              ? t(`Stop using ${existing.name}?`, `${existing.name} বন্ধ করবেন?`)
              : t(`Delete ${existing.name}?`, `${existing.name} মুছবেন?`)
          }
          onClose={() => setRemoving(false)}
        >
          <div className="plot-remove-dialog">
            {hasRecords ? (
              <>
                <ul>
                  <li>
                    {t(
                      'From today it leaves the dashboard and the calendar.',
                      'আজ থেকে এটি ড্যাশবোর্ড ও ক্যালেন্ডারে আর থাকবে না।',
                    )}
                  </li>
                  <li>
                    {t(
                      `Its ${hectares(existing.areaHa)} ha go back to the land, free for another plot.`,
                      `এর ${localDigits(hectares(existing.areaHa), 'bn')} হেক্টর জমিতে ফিরে যাবে, অন্য প্লটের জন্য খালি।`,
                    )}
                  </li>
                  <li>{t('Reminders from its notes stop.', 'এর নোটের রিমাইন্ডার বন্ধ হবে।')}</li>
                </ul>
                <p className="plot-remove-keep">
                  {t(
                    'Its crop records and notes are kept: they stay in "Export all records", and the plot can be used again from the dashboard.',
                    'এর ফসলের হিসাব ও নোট থেকে যাবে: "সব হিসাব নামান"-এ পাবেন, আর ড্যাশবোর্ড থেকে প্লটটি আবার ব্যবহার করা যাবে।',
                  )}
                </p>
              </>
            ) : (
              <>
                <p>
                  {t(
                    `Its ${hectares(existing.areaHa)} ha go back to the land, free for another plot.`,
                    `এর ${localDigits(hectares(existing.areaHa), 'bn')} হেক্টর জমিতে ফিরে যাবে, অন্য প্লটের জন্য খালি।`,
                  )}
                </p>
                <p className="plot-remove-warn">
                  {t('This cannot be undone.', 'এটি ফেরানো যাবে না।')}
                </p>
              </>
            )}
            <div className="button-row">
              <button className="button danger" type="button" onClick={remove}>
                {hasRecords
                  ? t(`Stop using ${existing.name}`, `${existing.name} বন্ধ করুন`)
                  : t(`Delete ${existing.name}`, `${existing.name} মুছুন`)}
              </button>
              <button className="button secondary" type="button" onClick={() => setRemoving(false)}>
                {t('Keep it', 'রেখে দিন')}
              </button>
            </div>
          </div>
        </Dialog>
      )}
      {askLastYear && (
        <Dialog
          title={t('What did you grow here last year?', 'গত বছর এখানে কী চাষ করেছিলেন?')}
          onClose={() => setAskLastYear(null)}
        >
          <div className="last-year-dialog">
            <p>
              {t(
                'One answer per season. Choose Left empty or Not sure if that fits.',
                'প্রতি মৌসুমে একটি উত্তর দিন। দরকার হলে খালি ছিল বা নিশ্চিত নই বাছুন।',
              )}
            </p>
            <LastYearFields
              value={askLastYear}
              onChange={setAskLastYear}
              match={match}
              name="plot-last-year"
            />
            <div className="button-row">
              <button
                className="button primary"
                disabled={!plotSeasons.every((season) => askLastYear[season] !== undefined)}
                onClick={() => continueToCrops(askLastYear as Plot['lastYear'])}
              >
                {t('Show suggested plans', 'পরামর্শ দেখুন')}
                <ArrowRight size={18} />
              </button>
              <button className="button secondary" onClick={() => setAskLastYear(null)}>
                {t('Back', 'ফিরে যান')}
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}

/** The three season rows of crop tiles, shared by the plot page and the crop-suggestion popup. */
export function LastYearFields({
  value,
  onChange,
  match,
  name,
}: {
  value: Partial<Plot['lastYear']>;
  onChange: (next: Partial<Plot['lastYear']>) => void;
  match: RegionMatch | null;
  name: string;
}) {
  const { t, language } = usePlanner();
  const complete = plotSeasons.every((s) => value[s] !== undefined);
  return (
    <>
      <div className="plot-seasons">
        {plotSeasons.map((season) => {
          const label = seasonLabel(season, t),
            chosen = value[season],
            tiles = seasonTiles(season, match),
            others = cropIds
              .filter((c) => c !== 'fallow' && !tiles.includes(c))
              .sort((a, b) => crops[a].name[language].localeCompare(crops[b].name[language]));
          return (
            <div className={`plot-season-card plot-season-${season}`} key={season}>
              <fieldset className="plot-season">
                <legend>
                  <span className="plot-season-swatch" aria-hidden="true" />
                  <strong>{label.name}</strong>
                  <span>{label.detail}</span>
                </legend>
                <div className="plot-crop-tiles">
                  {tiles.map((crop) => (
                    <label
                      key={crop}
                      className={`plot-crop-tile${crop === 'unknown' ? ' unsure' : ''}`}
                    >
                      <input
                        type="radio"
                        name={`${name}-${season}`}
                        value={crop}
                        checked={chosen === crop}
                        onChange={() => onChange({ ...value, [season]: crop })}
                      />
                      <span>{plotCropName(crop, language, t)}</span>
                      <Check className="plot-crop-check" size={14} aria-hidden="true" />
                    </label>
                  ))}
                </div>
                <label className="plot-other-crop">
                  {t('Another crop', 'অন্য ফসল')}
                  <select
                    value={chosen && !tiles.includes(chosen) ? chosen : ''}
                    onChange={(e) =>
                      e.target.value && onChange({ ...value, [season]: e.target.value as CropId })
                    }
                  >
                    <option value="">{t('Choose…', 'বাছুন…')}</option>
                    {others.map((c) => (
                      <option key={c} value={c}>
                        {crops[c].name[language]}
                      </option>
                    ))}
                  </select>
                </label>
              </fieldset>
            </div>
          );
        })}
      </div>
      <div className="plot-rotation-summary" aria-live="polite">
        <span>{t('Your current rotation', 'আপনার বর্তমান ফসলচক্র')}</span>
        <strong>
          {complete
            ? rotationSummary(value as Plot['lastYear'], language, t)
            : t('Answer all three seasons', 'তিন মৌসুমেরই উত্তর দিন')}
        </strong>
      </div>
    </>
  );
}
