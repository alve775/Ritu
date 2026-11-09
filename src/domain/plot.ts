import { cropIds, type CropId, type Farm } from './types';
import { validDate, type Season } from './evidence-planner';
import type { RegisteredField } from './field-registry';
import type { SeasonFarm } from './global-season';
import { isRotationCrop, type RotationCropId } from '../data/rotation-crops';

/** The three Bangladesh growing seasons a plot's rotation is recorded in. */
export const plotSeasons: readonly Season[] = ['pre-monsoon', 'monsoon', 'winter'];
/** A crop grown in one season; 'fallow' means the plot was left empty, 'unknown' that the farmer is not sure. */
export type PlotCrop = CropId | 'unknown';

/**
 * A persistent part of a registered field. Unlike a farm (one planting), a plot keeps its
 * identity across seasons, so its crop history can be compared with rotation options.
 */
export interface Plot {
  id: string;
  fieldId: string;
  name: string;
  /** Hectares, the same unit as RegisteredField.profile.area. */
  areaHa: number;
  startDate: string;
  /** Set when the plot stops being used, e.g. merged into another plot. */
  endDate?: string;
  /** Parent plot ids when plots are merged or split; empty for a new plot. */
  madeFrom: string[];
  /** Last year's crop in each season: the plot's existing rotation. */
  lastYear: Record<Season, PlotCrop>;
  chosenRotationId?: string;
  /** The year plan the farmer chose: one crop (or nothing) per season, starting at `from`. */
  plan?: PlotPlan;
  /** Water and drainage of this plot where they differ from its land; the land's answer otherwise. */
  overrides?: PlotOverrides;
}
export interface PlotOverrides {
  irrigation?: Exclude<Farm['irrigation'], 'unknown'>;
  drainage?: Exclude<Farm['drainage'], 'unknown'>;
}
const plotWater = ['reliable', 'limited', 'severe', 'rainfed'] as const,
  plotDrainage = ['good', 'poor'] as const;
const validOverrides = (o: unknown) =>
  o === undefined ||
  (!!o &&
    typeof o === 'object' &&
    Object.keys(o).every((k) => k === 'irrigation' || k === 'drainage') &&
    ((o as PlotOverrides).irrigation === undefined ||
      (plotWater as readonly string[]).includes((o as PlotOverrides).irrigation!)) &&
    ((o as PlotOverrides).drainage === undefined ||
      (plotDrainage as readonly string[]).includes((o as PlotOverrides).drainage!)));
/** The land's conditions for one plot: its own water and drainage where it has them. */
export const plotProfile = <T extends Pick<Farm, 'irrigation' | 'drainage'>>(
  profile: T,
  plot: Pick<Plot, 'overrides'>,
): T => ({
  ...profile,
  irrigation: plot.overrides?.irrigation ?? profile.irrigation,
  drainage: plot.overrides?.drainage ?? profile.drainage,
});
export interface PlotPlan {
  seasons: Record<Season, RotationCropId | null>;
  /** Ready-to-plant date the plan was scheduled from. */
  from: string;
  source: 'suggested' | 'custom';
  patternId?: string;
  chosenAt: string;
}
export function validPlotPlan(value: unknown): value is PlotPlan {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const p = value as PlotPlan;
  return (
    !!p.seasons &&
    typeof p.seasons === 'object' &&
    plotSeasons.every((s) => p.seasons[s] === null || isRotationCrop(p.seasons[s])) &&
    plotSeasons.some((s) => p.seasons[s] !== null) &&
    validDate(p.from) &&
    (p.source === 'suggested' || p.source === 'custom') &&
    (p.patternId === undefined || validId(p.patternId)) &&
    typeof p.chosenAt === 'string' &&
    Number.isFinite(Date.parse(p.chosenAt))
  );
}

const validId = (v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= 120;
const validCrop = (v: unknown) => v === 'unknown' || (cropIds as readonly unknown[]).includes(v);

/** One crop, 'fallow' or 'unknown' for each of the three seasons, and nothing else. */
export function validLastYear(value: unknown): value is Plot['lastYear'] {
  return (
    !!value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === plotSeasons.length &&
    plotSeasons.every((s) => validCrop((value as Record<string, unknown>)[s]))
  );
}
export function validPlot(raw: unknown): raw is Plot {
  if (!raw || typeof raw !== 'object') return false;
  const p = raw as Plot;
  const lastYear = p.lastYear as unknown;
  return (
    validId(p.id) &&
    validId(p.fieldId) &&
    typeof p.name === 'string' &&
    p.name.trim().length > 0 &&
    p.name.length <= 80 &&
    Number.isFinite(p.areaHa) &&
    p.areaHa > 0 &&
    p.areaHa <= 1000 &&
    validDate(p.startDate) &&
    (p.endDate === undefined || (validDate(p.endDate) && p.endDate >= p.startDate)) &&
    Array.isArray(p.madeFrom) &&
    p.madeFrom.length <= 20 &&
    p.madeFrom.every(validId) &&
    new Set(p.madeFrom).size === p.madeFrom.length &&
    !p.madeFrom.includes(p.id) &&
    validLastYear(lastYear) &&
    (p.chosenRotationId === undefined || validId(p.chosenRotationId)) &&
    (p.plan === undefined || validPlotPlan(p.plan)) &&
    validOverrides(p.overrides)
  );
}

/** Largest total plot area in use at the same time on one field, in hectares. */
export function peakPlotArea(plots: Plot[], fieldId: string) {
  const events: [number, number][] = [];
  for (const plot of plots) {
    if (plot.fieldId !== fieldId) continue;
    events.push(
      [Date.parse(plot.startDate + 'T00:00:00Z'), plot.areaHa],
      [Date.parse((plot.endDate ?? '9999-12-31') + 'T00:00:00Z') + 86400000, -plot.areaHa],
    );
  }
  events.sort((a, b) => a[0] - b[0]);
  let used = 0,
    peak = 0;
  for (let i = 0; i < events.length;) {
    const time = events[i][0];
    while (i < events.length && events[i][0] === time) used += events[i++][1];
    peak = Math.max(peak, used);
  }
  return peak;
}

/** Plots point at existing fields and parent plots on the same field, and fit inside the field. */
export function validPlotLinks(fields: RegisteredField[], plots: Plot[]) {
  return plots.every((plot) => {
    const field = fields.find((f) => f.id === plot.fieldId);
    return (
      !!field &&
      plot.madeFrom.every((id) =>
        plots.some((other) => other.id === id && other.fieldId === plot.fieldId),
      ) &&
      peakPlotArea(plots, field.id) <= field.profile.area + 1e-8
    );
  });
}

/** A farm (planting) may name its plot; that plot must exist on the farm's field. */
export function validFarmPlotLinks(plots: Plot[] | undefined, farms: SeasonFarm[]) {
  return farms.every(
    (farm) =>
      farm.plotId === undefined ||
      !!plots?.some((p) => p.id === farm.plotId && p.fieldId === farm.fieldId),
  );
}

/**
 * Keep the readable plots of a damaged file: valid, unique, on a recovered field, with parents
 * that were also kept, and within the field's area. Farms lose links to plots that were dropped.
 */
export function recoverPlots(rawPlots: unknown, fields: RegisteredField[], farms: SeasonFarm[]) {
  let plots: Plot[] = Array.isArray(rawPlots)
    ? rawPlots
        .filter(validPlot)
        .filter((p, i, all) => all.findIndex((other) => other.id === p.id) === i)
        .filter((p) => fields.some((f) => f.id === p.fieldId))
    : [];
  for (let changed = true; changed;) {
    const kept = plots.filter((p) =>
      p.madeFrom.every((id) => plots.some((o) => o.id === id && o.fieldId === p.fieldId)),
    );
    changed = kept.length !== plots.length;
    plots = kept;
  }
  plots = plots.filter((p) => {
    const field = fields.find((f) => f.id === p.fieldId)!;
    return peakPlotArea(plots, field.id) <= field.profile.area + 1e-8;
  });
  const linked: SeasonFarm[] = farms.map((farm) => {
    if (farm.plotId === undefined) return farm;
    if (plots.some((p) => p.id === farm.plotId && p.fieldId === farm.fieldId)) return farm;
    const unlinked = { ...farm };
    delete unlinked.plotId;
    return unlinked;
  });
  return { plots, farms: linked };
}
