import type { Farm } from '../domain/types';
import type { FarmSite } from '../domain/farm-site';
import type { SeasonContext, SeasonFarm } from '../domain/global-season';
import type { Plot } from '../domain/plot';
import type { RegisteredField } from '../domain/field-registry';
import { monthIndex, plusDays, type ScheduledCrop } from '../domain/rotation';

/** The crop calendar record for one crop of a plot's year plan. */
export function farmForPlanCrop({
  item,
  plot,
  field,
  profile,
  site,
  context,
}: {
  item: ScheduledCrop;
  plot: Plot;
  field: RegisteredField;
  profile: Farm;
  site: FarmSite;
  context: SeasonContext;
}): SeasonFarm {
  const months = new Set<number>();
  for (let d = 0; d < item.crop.days; d += 15) months.add(monthIndex(plusDays(item.sow, d)));
  const normal = context.normal!;
  const temps = [...months].map((m) => normal.months[m].temperature);
  return {
    id: crypto.randomUUID(),
    creationKey: `plan:${plot.id}:${item.season}:${item.sow}`,
    createdAt: new Date().toISOString(),
    field: { ...profile, name: plot.name, area: plot.areaHa },
    fieldId: field.id,
    plotId: plot.id,
    rotationSeason: item.season,
    site: { ...site },
    selection: {
      crop: item.crop.catalogueId,
      planKind: 'seasonal',
      start: item.sow,
      endEarly: plusDays(item.sow, item.crop.days),
      endLate: plusDays(item.sow, item.crop.days),
      durationMin: item.crop.days,
      durationMax: item.crop.days,
      basis: 'climate-screen',
      temperature: Math.round((temps.reduce((a, b) => a + b, 0) / temps.length) * 10) / 10,
      optimalTemperature: true,
      annualRainFit: null,
      cautions: [],
      reasons: ['Part of the year plan chosen for this plot.'],
    },
    context: { ...context, site: { ...site } },
    plantedDate: '',
    harvestedDate: '',
    notes: '',
    done: [],
    observations: [],
  };
}
