'use client';
import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Droplets, Layers, LandPlot, MapPin, Pencil, Plus, Ruler } from 'lucide-react';
import { usePlanner } from './planner-provider';
import { seasonStore, useSeasonFarms } from '../lib/season-store';
import { evidenceStore } from '../lib/evidence-store';
import { fieldReady, type RegisteredField } from '../domain/field-registry';
import type { SeasonFarm } from '../domain/global-season';
import { defaultSite } from '../domain/farm-site';
import type { Farm } from '../domain/types';
import { pilotRegionFor } from '../data/regions';
import { RegionBadge } from './region-badge';
import { localDigits } from '../domain/numerals';
import { FieldPlots, plotAreaInUse } from './plot-setup';
import { useToday } from '../lib/use-today';
import { RemoveLand } from './land-remove';

type Translate = (en: string, bn: string) => string;

/** Loads a land into the land page for editing. */
export function prepareRegisteredField(id: string) {
  const field = seasonStore.getSnapshot().state.fields?.find((f) => f.id === id);
  if (!field) return;
  evidenceStore.update({
    farm: { ...field.profile, name: field.name },
    // A land without a location starts at the default Rajshahi pin; the farmer can move it.
    site: field.site ?? defaultSite,
    climate: undefined,
    from: '',
    district: '',
    preferred: [],
    unplanted: [],
    reviewed: null,
    selected: null,
  });
  seasonStore.selectField(id, true);
  seasonStore.activate(null);
}

/** A crop planting whose season is over (perennials stay open for review). */
export const farmFinished = (farm: SeasonFarm, today: string) =>
  farm.selection.planKind !== 'perennial-review' &&
  !!farm.harvestedDate &&
  farm.harvestedDate <= today;

const soilName = (soil: Farm['soil'], t: Translate) =>
  ({
    loam: t('Loam', 'দোআঁশ'),
    clay: t('Clay', 'এঁটেল'),
    sandy: t('Sandy', 'বেলে'),
    unknown: t('Soil not sure', 'মাটি জানা নেই'),
  })[soil];
const waterName = (water: Farm['irrigation'], t: Translate) =>
  ({
    reliable: t('Reliable irrigation', 'নির্ভরযোগ্য সেচ'),
    limited: t('Limited irrigation', 'সীমিত সেচ'),
    rainfed: t('Rain only', 'শুধু বৃষ্টি'),
    severe: t('Severe water shortage', 'পানির তীব্র সংকট'),
    unknown: t('Water not sure', 'পানি জানা নেই'),
  })[water];
const ha = (n: number) => Number(n.toFixed(4));

export function FieldRegistryDashboard({
  onAddLand,
  renderCrop,
  renderFarm,
}: {
  onAddLand: () => void;
  /** A crop shown inside its plot. */
  renderCrop: (farm: SeasonFarm) => ReactNode;
  /** A crop that is not inside a current plot (older records, finished seasons). */
  renderFarm: (farm: SeasonFarm) => ReactNode;
}) {
  const { t } = usePlanner(),
    { state } = useSeasonFarms();
  // A stopped land leaves the dashboard; it waits under "Lands no longer used".
  const all = state.fields ?? [],
    fields = all.filter((f) => !f.endDate),
    stopped = all.filter((f) => !!f.endDate);
  const stoppedList = stopped.length > 0 && <StoppedLands fields={stopped} />;
  if (!fields.length)
    return (
      <>
        <section className="land-empty card">
          <span className="land-empty-mark" aria-hidden="true">
            <LandPlot size={34} />
          </span>
          <h2>{t('Add your first land', 'আপনার প্রথম জমি যোগ করুন')}</h2>
          <p>
            {t(
              'Mark where the land is and how big it is. Then divide it into plots and get crop suggestions for each plot.',
              'জমি কোথায় ও কত বড় তা দিন। তারপর জমিকে প্লটে ভাগ করে প্রতিটি প্লটের জন্য ফসলের পরামর্শ নিন।',
            )}
          </p>
          <button className="button primary" onClick={onAddLand} data-tour="dashboard-add-land">
            <Plus size={19} />
            {t('Add land', 'জমি যোগ করুন')}
          </button>
        </section>
        {stoppedList}
      </>
    );
  return (
    <>
      <div className="field-registry land-grid">
        {fields.map((field) => (
          <LandCard key={field.id} field={field} renderCrop={renderCrop} renderFarm={renderFarm} />
        ))}
      </div>
      {stoppedList}
    </>
  );
}

/** Lands stopped from Edit land, with their records kept; each can be used again. */
function StoppedLands({ fields }: { fields: RegisteredField[] }) {
  const { t, language } = usePlanner();
  const [error, setError] = useState('');
  return (
    <details className="plot-stopped land-stopped card">
      <summary>
        {t('Lands no longer used', 'আর ব্যবহার হচ্ছে না এমন জমি')} (
        {localDigits(fields.length, language)})
      </summary>
      <ul>
        {fields.map((f) => (
          <li key={f.id}>
            <span>
              <strong>{f.name}</strong>
              {f.site?.name ? ` · ${f.site.name}` : ''}
            </span>
            <button
              className="text-button"
              type="button"
              onClick={() => {
                try {
                  seasonStore.reopenField(f.id);
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
      <p className="field-help">
        {t(
          'Its plots stay stopped; use each again from the land’s "Plots no longer used".',
          'এর প্লটগুলো বন্ধই থাকবে; জমির "আর ব্যবহার হচ্ছে না এমন প্লট" থেকে প্রতিটি আবার চালু করুন।',
        )}
      </p>
      {error && (
        <p className="notice-amber" role="alert">
          {error}
        </p>
      )}
    </details>
  );
}

function LandCard({
  field,
  renderCrop,
  renderFarm,
}: {
  field: RegisteredField;
  renderCrop: (farm: SeasonFarm) => ReactNode;
  renderFarm: (farm: SeasonFarm) => ReactNode;
}) {
  const { t, language } = usePlanner(),
    { state } = useSeasonFarms(),
    router = useRouter();
  const n = (value: number) => localDigits(ha(value), language);
  const today = useToday(field.site?.timezone),
    ready = fieldReady(field),
    plots = (state.plots ?? []).filter(
      (p) => p.fieldId === field.id && (!p.endDate || p.endDate >= today),
    ),
    plotIds = new Set(plots.map((p) => p.id)),
    farms = state.farms.filter((f) => f.fieldId === field.id),
    inPlots = farms.filter((f) => f.plotId && plotIds.has(f.plotId) && !farmFinished(f, today)),
    // A plot with a year plan shows its own done, now and next crops, so its calendars are not repeated here.
    planned = new Set(plots.filter((p) => p.plan).map((p) => p.id)),
    // A stopped plot's calendars that were never started are not crops on this land any more.
    stoppedPlot = (id?: string) =>
      !!id && !plotIds.has(id) && (state.plots ?? []).some((p) => p.id === id),
    other = farms.filter(
      (f) =>
        !inPlots.includes(f) &&
        !(f.plotId && planned.has(f.plotId)) &&
        !(stoppedPlot(f.plotId) && !f.plantedDate && !f.harvestedDate),
    ),
    used = plotAreaInUse(state.plots ?? [], field.id, today),
    area = field.profile.area,
    share = area > 0 ? Math.min(100, (used / area) * 100) : 0,
    edit = () => {
      prepareRegisteredField(field.id);
      router.push('/farm');
    };
  return (
    <section className="land-card registered-field" aria-label={field.name}>
      <header className="land-card-head registered-field-heading">
        <span className="land-card-mark" aria-hidden="true">
          <LandPlot size={26} />
        </span>
        <div className="land-card-title">
          <span className="eyebrow">{t('LAND', 'জমি')}</span>
          <h2>{field.name}</h2>
          <p>
            <MapPin size={16} />
            {field.site?.name || t('Location not set yet', 'স্থান এখনো দেওয়া হয়নি')}
          </p>
        </div>
        <div className="land-card-actions">
          <button
            className="button secondary"
            aria-label={`${t('Edit land', 'জমির তথ্য বদলান')}: ${field.name}`}
            onClick={edit}
          >
            <Pencil size={16} />
            {ready ? t('Edit land', 'জমির তথ্য বদলান') : t('Finish setup', 'তথ্য সম্পূর্ণ করুন')}
          </button>
          <RemoveLand field={field} />
        </div>
      </header>
      {ready ? (
        <>
          <ul className="land-facts" aria-label={t('About this land', 'এই জমির তথ্য')}>
            <li>
              <Ruler size={16} />
              {n(area)} {t('ha', 'হেক্টর')}
            </li>
            <li>
              <Layers size={16} />
              {soilName(field.profile.soil, t)}
            </li>
            <li>
              <Droplets size={16} />
              {waterName(field.profile.irrigation, t)}
            </li>
            <li className="land-facts-region">
              <RegionBadge match={pilotRegionFor(field.site)} />
            </li>
          </ul>
          <div className="land-usage">
            <div className="land-usage-bar" aria-hidden="true">
              <span style={{ width: `${share}%` }} />
            </div>
            <p>
              <strong>
                {n(used)} {t('ha in plots', 'হেক্টর প্লটে')}
              </strong>{' '}
              · {n(Math.max(0, area - used))} {t('ha free', 'হেক্টর খালি')}
            </p>
          </div>
          <FieldPlots field={field} farms={inPlots} renderCrop={renderCrop} />
        </>
      ) : (
        <p className="field-empty-note">
          {t(
            'Add this land’s location and size to start adding plots.',
            'প্লট যোগ করতে আগে এই জমির স্থান ও আয়তন দিন।',
          )}
        </p>
      )}
      {other.length > 0 && (
        <div className="land-other-crops">
          <h3>{t('Other crops on this land', 'এই জমির অন্যান্য ফসল')}</h3>
          <div className="season-farms-grid">{other.map(renderFarm)}</div>
        </div>
      )}
    </section>
  );
}
