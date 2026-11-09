'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { usePlanner } from '../planner-provider';
import { seasonStore, useSeasonFarms } from '../../lib/season-store';
import { farmForPlanCrop } from '../../lib/rotation-farm';
import { plotProfile, type Plot } from '../../domain/plot';
import type { RegisteredField } from '../../domain/field-registry';
import { cropEnd, plusDays, schedulePlan } from '../../domain/rotation';
import { localToday } from '../../domain/global-season';
import { rotationText } from './rotation-text';
import { seasonClass } from './rotation-visuals';
import { endLabel } from './end-text';

/** Now / Next / Then for a plot with a year plan, with the calendar button for each crop. */
export function PlotPlanSequence({ plot, field }: { plot: Plot; field: RegisteredField }) {
  const { t, language } = usePlanner(),
    { state } = useSeasonFarms(),
    router = useRouter();
  const [error, setError] = useState('');
  const tx = rotationText(t, language);
  if (!plot.plan) return null;
  const { items } = schedulePlan(plot.plan.seasons, plot.plan.from);
  const farms = state.farms.filter((f) => f.plotId === plot.id && f.rotationSeason);
  const farmOf = (i: number) =>
    farms
      .filter(
        (f) =>
          f.rotationSeason === items[i].season && f.selection.crop === items[i].crop.catalogueId,
      )
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
  // A crop that ended without a harvest (cancelled, lost, closed) is passed over like a harvested one.
  const today = localToday(field.site?.timezone);
  const ends = items.map((_, i) =>
    cropEnd(items, i, farmOf(i), today, items[i + 1] ? farmOf(i + 1)?.plantedDate : undefined),
  );
  const current = items.findIndex((_, i) => !farmOf(i)?.harvestedDate && !ends[i]);
  const contextFrom = [...farms].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))[0];
  const open = (id: string) => {
    seasonStore.activate(id);
    router.push('/plan');
  };
  const start = (i: number) => {
    setError('');
    if (!contextFrom || !field.site) return;
    try {
      seasonStore.create(
        farmForPlanCrop({
          item: items[i],
          plot,
          field,
          profile: { ...plotProfile(field.profile, plot), lastYear: plot.lastYear },
          site: field.site,
          context: contextFrom.context,
        }),
      );
      router.push('/plan');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : t('Could not start this crop.', 'এই ফসল শুরু করা যায়নি।'),
      );
    }
  };
  return (
    <div className="rot-seq-wrap">
      <ol className="rot-seq">
        {items.map((item, i) => {
          const farm = farmOf(i),
            end = ends[i] ? endLabel(ends[i]!, tx, t) : null;
          const rel = current < 0 ? i - items.length : i - current;
          const when = end
            ? end.when
            : farm?.harvestedDate
              ? t('Done', 'শেষ')
              : rel === 0
                ? t('Now', 'এখন')
                : rel === 1
                  ? t('Next', 'এরপর')
                  : t('Then', 'তারপর');
          return (
            <li
              key={item.season}
              className={`${seasonClass(item.season)} ${rel === 0 ? 'now' : ''} ${farm?.harvestedDate ? 'done' : ''} ${end ? 'ended' : ''}`}
            >
              <span className="when">{when}</span>
              <span className="what">
                <strong>{tx.crop(item.crop)}</strong>
                <span>
                  {end
                    ? end.line
                    : rel === 0 && !farm?.plantedDate
                      ? t(
                          `Sow ${tx.date(item.windowStart)} – ${tx.date(item.windowEnd)}`,
                          `বুনুন ${tx.date(item.windowStart)} – ${tx.date(item.windowEnd)}`,
                        )
                      : farm?.plantedDate
                        ? // Recorded dates once the crop is sown: the real sowing, and the real or expected harvest.
                          `${tx.date(farm.plantedDate)} – ${tx.date(farm.harvestedDate || plusDays(farm.plantedDate, item.crop.days))}`
                        : `${tx.date(item.sow)} – ${tx.date(item.harvest)}`}
                </span>
              </span>
              {farm ? (
                <button
                  className="button primary"
                  onClick={() => open(farm.id)}
                  aria-label={`${t('Calendar', 'ক্যালেন্ডার')}: ${tx.crop(item.crop)}`}
                >
                  {t('Calendar', 'ক্যালেন্ডার')}
                  <ArrowRight size={16} />
                </button>
              ) : rel === 0 && contextFrom ? (
                <button className="button secondary" onClick={() => start(i)}>
                  {t('Start calendar', 'ক্যালেন্ডার শুরু')}
                </button>
              ) : (
                <span />
              )}
            </li>
          );
        })}
      </ol>
      {error && (
        <p className="notice-amber" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
