'use client';
import { useSyncExternalStore } from 'react';
import { globalCrop } from '../domain/global-season';
import type { SeasonFarm } from '../domain/global-season';
import { samePoint, validSite } from '../domain/farm-site';
import type { ClimateNormal } from '../domain/global-season';
import type { FarmSite } from '../domain/farm-site';
import { validDate, addDays } from '../domain/evidence-planner';
import { validCheckIn } from '../domain/season-lifecycle';
import { validThermalProfile } from '../domain/crop-thermal';
import { validSoilEvidence } from '../domain/soil-evidence';
import { validWaterDayRecord } from '../domain/water-balance';
import { validCultivarReference } from '../data/cultivar-references';
import { cancelReasons, lossReasons } from '../domain/rotation/crop-end';
import {
  migrateFieldRegistry,
  recoverFieldRegistry,
  validRegisteredField,
  validFieldLinks,
  peakFieldArea,
  type RegisteredField,
} from '../domain/field-registry';
import {
  recoverPlots,
  validFarmPlotLinks,
  validPlot,
  validPlotLinks,
  type Plot,
  type PlotPlan,
} from '../domain/plot';

export interface SeasonState {
  fields?: RegisteredField[];
  /** Persistent parts of fields that keep their crop history; absent in older records. */
  plots?: Plot[];
  draftFieldId?: string | null;
  /** The plot whose crop is being chosen; the created crop is linked to it. */
  draftPlotId?: string | null;
  editingFieldId?: string | null;
  /** A fresh operation when the farmer starts another planting, even with identical inputs. */
  draftOperationId?: string | null;
  version: 1;
  farms: SeasonFarm[];
  activeId: string | null;
  /** Granted only by crop creation or explicitly opening a saved farm. */
  calendarAccessId?: string | null;
  confirmedKey: string | null;
}
export const seasonStorageKey = 'ritu-season-farms-v1';
const blank: SeasonState = {
  fields: [],
  draftFieldId: null,
  editingFieldId: null,
  draftOperationId: null,
  version: 1,
  farms: [],
  activeId: null,
  calendarAccessId: null,
  confirmedKey: null,
};
const server = { state: blank, ready: false, saved: true, recovery: false };
let snapshot = server,
  loaded = false,
  blocked = false,
  recovered = false;
const listeners = new Set<() => void>();
function normalBelongsToSite(normal: ClimateNormal | null, site: FarmSite) {
  if (!normal || !Number.isFinite(normal.latitude) || !Number.isFinite(normal.longitude))
    return false;
  if (
    Math.abs(normal.latitude - Number(site.latitude.toFixed(2))) > 0.006 ||
    Math.abs(normal.longitude - Number(site.longitude.toFixed(2))) > 0.006
  )
    return false;
  try {
    const url = new URL(normal.sourceUrl);
    return (
      url.origin === 'https://power.larc.nasa.gov' &&
      url.pathname === '/api/temporal/climatology/point' &&
      Math.abs(Number(url.searchParams.get('latitude')) - normal.latitude) < 0.006 &&
      Math.abs(Number(url.searchParams.get('longitude')) - normal.longitude) < 0.006 &&
      url.searchParams.get('start') === '1991' &&
      url.searchParams.get('end') === '2020'
    );
  } catch {
    return false;
  }
}
export function validSeasonState(raw: unknown): raw is SeasonState {
  if (!raw || typeof raw !== 'object') return false;
  const s = raw as SeasonState;
  return (
    s.version === 1 &&
    (s.draftOperationId === undefined ||
      s.draftOperationId === null ||
      (typeof s.draftOperationId === 'string' &&
        s.draftOperationId.length > 0 &&
        s.draftOperationId.length <= 100)) &&
    (s.fields === undefined ||
      (Array.isArray(s.fields) &&
        s.fields.length <= 200 &&
        s.fields.every(validRegisteredField) &&
        new Set(s.fields.map((f) => f.id)).size === s.fields.length)) &&
    [s.draftFieldId, s.editingFieldId].every(
      (id) => id === undefined || id === null || s.fields?.some((f) => f.id === id),
    ) &&
    (s.draftPlotId === undefined ||
      s.draftPlotId === null ||
      !!s.plots?.some((p) => p.id === s.draftPlotId && p.fieldId === s.draftFieldId)) &&
    Array.isArray(s.farms) &&
    s.farms.every((f) => !!f && typeof f === 'object') &&
    s.farms.length <= 200 &&
    new Set(s.farms.map((f) => f?.id)).size === s.farms.length &&
    (s.activeId === null ||
      (typeof s.activeId === 'string' && s.farms.some((f) => f.id === s.activeId))) &&
    (s.calendarAccessId === undefined ||
      s.calendarAccessId === null ||
      (s.calendarAccessId === s.activeId && s.farms.some((f) => f.id === s.calendarAccessId))) &&
    (s.confirmedKey === null || typeof s.confirmedKey === 'string') &&
    s.farms.every(
      (f) =>
        f &&
        typeof f.id === 'string' &&
        (f.creationKey === undefined ||
          (typeof f.creationKey === 'string' &&
            f.creationKey.length > 0 &&
            f.creationKey.length <= 20000)) &&
        (f.fieldId === undefined ||
          (typeof f.fieldId === 'string' && f.fieldId.length > 0 && f.fieldId.length <= 120)) &&
        (f.plotId === undefined ||
          (typeof f.plotId === 'string' && f.plotId.length > 0 && f.plotId.length <= 120)) &&
        (f.rotationSeason === undefined ||
          (!!f.plotId && ['winter', 'pre-monsoon', 'monsoon'].includes(f.rotationSeason))) &&
        f.id.length <= 100 &&
        validSite(f.site) &&
        f.field &&
        Number.isFinite(f.field.area) &&
        f.field.area > 0 &&
        f.field.area <= 1000 &&
        typeof f.field.name === 'string' &&
        f.field.name.length <= 80 &&
        ['loam', 'clay', 'sandy', 'unknown'].includes(f.field.soil) &&
        ['good', 'poor', 'unknown'].includes(f.field.drainage) &&
        ['reliable', 'limited', 'severe', 'rainfed', 'unknown'].includes(f.field.irrigation) &&
        f.selection &&
        !!globalCrop(f.selection.crop) &&
        ((globalCrop(f.selection.crop)?.planKind === 'seasonal' &&
          (f.selection.planKind === undefined || f.selection.planKind === 'seasonal')) ||
          (f.selection.planKind === 'perennial-review' &&
            globalCrop(f.selection.crop)?.planKind === 'perennial-review' &&
            f.selection.durationMin === 365 &&
            f.selection.durationMax === 365)) &&
        validDate(f.selection.start) &&
        validDate(f.selection.endEarly) &&
        validDate(f.selection.endLate) &&
        f.selection.endEarly > f.selection.start &&
        f.selection.endLate >= f.selection.endEarly &&
        Number.isInteger(f.selection.durationMin) &&
        f.selection.durationMin > 0 &&
        Number.isInteger(f.selection.durationMax) &&
        f.selection.durationMax >= f.selection.durationMin &&
        f.selection.durationMax <= 365 &&
        f.selection.endEarly === addDays(f.selection.start, f.selection.durationMin) &&
        f.selection.endLate === addDays(f.selection.start, f.selection.durationMax) &&
        ['regional-calendar', 'climate-screen'].includes(f.selection.basis) &&
        Array.isArray(f.selection.reasons) &&
        f.selection.reasons.every((r) => typeof r === 'string') &&
        Array.isArray(f.selection.cautions) &&
        f.selection.cautions.every((r) => typeof r === 'string') &&
        f.context &&
        validSite(f.context.site) &&
        samePoint(f.site, f.context.site) &&
        Array.isArray(f.context.calendars) &&
        !!f.context.normal &&
        normalBelongsToSite(f.context.normal, f.site) &&
        Number.isFinite(f.context.normal.annualRain) &&
        f.context.normal.annualRain >= 0 &&
        typeof f.context.normal.sourceUrl === 'string' &&
        f.context.normal.sourceUrl.startsWith('https://power.larc.nasa.gov/') &&
        Array.isArray(f.context.normal.months) &&
        f.context.normal.months.length === 12 &&
        f.context.normal.months.every(
          (m, i) =>
            m &&
            m.month === i + 1 &&
            Number.isFinite(m.temperature) &&
            m.temperature >= -100 &&
            m.temperature <= 70 &&
            Number.isFinite(m.rain) &&
            m.rain >= 0,
        ) &&
        (f.plantedDate === '' || validDate(f.plantedDate)) &&
        (f.harvestedDate === '' ||
          (validDate(f.harvestedDate) && !!f.plantedDate && f.harvestedDate >= f.plantedDate)) &&
        (f.plannedSowDate === undefined ||
          f.plannedSowDate === '' ||
          validDate(f.plannedSowDate)) &&
        (f.plannedHarvestDate === undefined ||
          f.plannedHarvestDate === '' ||
          validDate(f.plannedHarvestDate)) &&
        (f.cancelled === undefined ||
          (!f.plantedDate &&
            validDate(f.cancelled.date) &&
            (cancelReasons as readonly string[]).includes(f.cancelled.reason))) &&
        (f.lost === undefined ||
          (!!f.plantedDate &&
            !f.harvestedDate &&
            validDate(f.lost.date) &&
            f.lost.date >= f.plantedDate &&
            (lossReasons as readonly string[]).includes(f.lost.reason))) &&
        (f.earlyHarvest === undefined || typeof f.earlyHarvest === 'boolean') &&
        (f.lostTries === undefined ||
          (Array.isArray(f.lostTries) &&
            f.lostTries.length <= 20 &&
            f.lostTries.every(
              (x) =>
                validDate(x?.plantedDate) &&
                validDate(x.date) &&
                x.date >= x.plantedDate &&
                (lossReasons as readonly string[]).includes(x.reason),
            ))) &&
        (f.harvestStartedDate === undefined ||
          f.harvestStartedDate === '' ||
          (validDate(f.harvestStartedDate) &&
            !!f.plantedDate &&
            f.harvestStartedDate >= f.plantedDate &&
            (f.selection.planKind === 'perennial-review' ||
              !f.harvestedDate ||
              f.harvestedDate >= f.harvestStartedDate))) &&
        (f.thermalProfile === undefined ||
          f.thermalProfile === null ||
          (f.selection.crop === 'maize' && validThermalProfile(f.thermalProfile))) &&
        (f.checkIns === undefined ||
          (Array.isArray(f.checkIns) &&
            f.checkIns.length <= 2000 &&
            new Set(f.checkIns.map((c) => c?.id)).size === f.checkIns.length &&
            f.checkIns.every(
              (c) =>
                validCheckIn(c) &&
                !!f.plantedDate &&
                c.date >= f.plantedDate &&
                (c.milestone === 'none' || f.selection.crop === 'maize'),
            ))) &&
        (f.field.soilEvidence === undefined || validSoilEvidence(f.field.soilEvidence)) &&
        (f.waterRecords === undefined ||
          (Array.isArray(f.waterRecords) &&
            f.waterRecords.length <= 2000 &&
            new Set(f.waterRecords.map((r) => r?.id)).size === f.waterRecords.length &&
            new Set(f.waterRecords.map((r) => r?.date)).size === f.waterRecords.length &&
            f.waterRecords.every(validWaterDayRecord))) &&
        (f.cultivarReference === undefined ||
          (f.selection.crop === 'mung' &&
            (!f.site.countryCode || f.site.countryCode === 'BD') &&
            validCultivarReference(f.cultivarReference))) &&
        typeof f.notes === 'string' &&
        f.notes.length <= 10000 &&
        Array.isArray(f.done) &&
        f.done.length <= 5000 &&
        new Set(f.done).size === f.done.length &&
        f.done.every((v) => typeof v === 'string') &&
        Array.isArray(f.observations) &&
        f.observations.length <= 1000 &&
        f.observations.every(
          (o) =>
            o &&
            validDate(o.date) &&
            typeof o.stage === 'string' &&
            typeof o.note === 'string' &&
            o.note.length <= 2000,
        ),
    ) &&
    (s.fields === undefined || validFieldLinks(s.fields, s.farms)) &&
    (s.plots === undefined ||
      (Array.isArray(s.plots) &&
        s.plots.length <= 500 &&
        s.plots.every(validPlot) &&
        new Set(s.plots.map((p) => p.id)).size === s.plots.length &&
        s.fields !== undefined &&
        validPlotLinks(s.fields, s.plots))) &&
    validFarmPlotLinks(s.plots, s.farms)
  );
}
function notify() {
  listeners.forEach((l) => l());
}
function save(state: SeasonState) {
  let saved = true;
  try {
    if (blocked) throw Error('Recovery copy required');
    localStorage.setItem(seasonStorageKey, JSON.stringify(state));
  } catch {
    saved = false;
  }
  snapshot = { state, ready: true, saved, recovery: blocked || recovered };
  notify();
}
export const seasonStore = {
  getSnapshot: () => snapshot,
  getServerSnapshot: () => server,
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (!loaded) {
      loaded = true;
      window.addEventListener('storage', (event) => {
        if (event.key !== seasonStorageKey && event.key !== null) return;
        if (event.newValue === null) {
          blocked = false;
          recovered = false;
          snapshot = { state: blank, ready: true, saved: true, recovery: false };
          notify();
          return;
        }
        try {
          const state: unknown = JSON.parse(event.newValue);
          if (validSeasonState(state)) {
            snapshot = {
              state: migrateFieldRegistry(state),
              ready: true,
              saved: true,
              recovery: false,
            };
            notify();
          }
        } catch {
          /* Keep this tab's valid in-memory records. */
        }
      });
      let state = blank;
      try {
        const raw = localStorage.getItem(seasonStorageKey);
        if (raw) {
          let parsed: unknown;
          try {
            parsed = JSON.parse(raw);
          } catch {
            /* Preserve original below. */
          }
          if (validSeasonState(parsed)) state = migrateFieldRegistry(parsed);
          else {
            localStorage.setItem(`${seasonStorageKey}-recovery`, raw);
            recovered = true;
            // Preserve readable farms from a partly damaged file, while the
            // exact original remains available in the recovery export.
            const candidate = parsed as Partial<SeasonState> | null;
            if (candidate?.version === 1 && Array.isArray(candidate.farms)) {
              const farms = candidate.farms.filter(
                (farm, index, all) =>
                  all.findIndex((other) => other?.id === farm?.id) === index &&
                  validSeasonState({
                    version: 1,
                    // Plot links are checked after plots are recovered below.
                    farms: [
                      farm && typeof farm === 'object' ? { ...farm, plotId: undefined } : farm,
                    ],
                    activeId: null,
                    confirmedKey: null,
                  }),
              );
              const registry = recoverFieldRegistry(farms, candidate.fields);
              state = {
                version: 1,
                ...registry,
                ...recoverPlots(candidate.plots, registry.fields, registry.farms),
                activeId: farms[0]?.id ?? null,
                calendarAccessId: null,
                confirmedKey: null,
              };
            }
          }
        }
      } catch {
        blocked = true;
      }
      // Reading does not overwrite invalid originals, older records or another tab.
      snapshot = { state, ready: true, saved: !blocked, recovery: blocked || recovered };
      notify();
    }
    return () => {
      listeners.delete(listener);
    };
  },
  confirm(key: string) {
    save({
      ...snapshot.state,
      confirmedKey: key,
      draftOperationId: snapshot.state.draftOperationId ?? crypto.randomUUID(),
    });
  },
  addFields(fields: RegisteredField[]) {
    const state = { ...snapshot.state, fields: [...(snapshot.state.fields ?? []), ...fields] };
    if (!validSeasonState(state))
      throw Error('Check the field names and number of fields (up to 200).');
    save(state);
  },
  selectField(id: string | null, editing = false, plotId: string | null = null) {
    if (id !== null && !snapshot.state.fields?.some((f) => f.id === id))
      throw Error('Choose an existing field.');
    if (plotId !== null && !snapshot.state.plots?.some((p) => p.id === plotId && p.fieldId === id))
      throw Error('Choose an existing plot.');
    save({
      ...snapshot.state,
      draftFieldId: id,
      draftPlotId: plotId,
      draftOperationId: crypto.randomUUID(),
      editingFieldId: editing ? id : null,
      confirmedKey: null,
      calendarAccessId: null,
    });
  },
  saveField(field: RegisteredField) {
    const old = snapshot.state.fields?.find((f) => f.id === field.id);
    if (!old) throw Error('This field no longer exists.');
    if (
      snapshot.state.farms.some((f) => f.fieldId === field.id) &&
      old.site &&
      field.site &&
      !samePoint(old.site, field.site)
    )
      throw Error(
        'Add another field for a different location. Existing farms keep their field location.',
      );
    const state = {
      ...snapshot.state,
      fields: snapshot.state.fields!.map((f) => (f.id === field.id ? field : f)),
      editingFieldId: null,
    };
    if (
      !validSeasonState(state) ||
      peakFieldArea(state.farms, field.id) > field.profile.area + 1e-8
    )
      throw Error('The field area cannot be smaller than its allocated farms or plots.');
    save(state);
  },
  removeField(id: string) {
    if (snapshot.state.farms.some((f) => f.fieldId === id))
      throw Error('Remove or archive the farms in this field first.');
    save({
      ...snapshot.state,
      fields: snapshot.state.fields?.filter((f) => f.id !== id),
      plots: snapshot.state.plots?.filter((p) => p.fieldId !== id),
      draftFieldId: snapshot.state.draftFieldId === id ? null : snapshot.state.draftFieldId,
      draftPlotId: snapshot.state.draftFieldId === id ? null : snapshot.state.draftPlotId,
      editingFieldId: snapshot.state.editingFieldId === id ? null : snapshot.state.editingFieldId,
    });
  },
  addPlot(plot: Plot) {
    const plots = snapshot.state.plots ?? [];
    if (plots.some((p) => p.id === plot.id)) throw Error('This plot already exists.');
    if (!snapshot.state.fields?.some((f) => f.id === plot.fieldId))
      throw Error('Choose an existing field for this plot.');
    const state = { ...snapshot.state, plots: [...plots, plot] };
    if (!validSeasonState(state))
      throw Error(
        'Check the plot name, size and crops. Plots in use at the same time must fit inside their field.',
      );
    save(state);
    return plot.id;
  },
  updatePlot(id: string, patch: Pick<Plot, 'name' | 'areaHa' | 'lastYear' | 'overrides'>) {
    const plots = snapshot.state.plots ?? [];
    if (!plots.some((p) => p.id === id)) throw Error('This plot no longer exists.');
    const state = {
      ...snapshot.state,
      plots: plots.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    };
    if (!validSeasonState(state))
      throw Error(
        'Check the plot name, size and crops. Plots in use at the same time must fit inside their field.',
      );
    save(state);
  },
  updatePlotLastYear(id: string, lastYear: Plot['lastYear']) {
    const plots = snapshot.state.plots ?? [];
    if (!plots.some((p) => p.id === id)) throw Error('This plot no longer exists.');
    const state = {
      ...snapshot.state,
      plots: plots.map((p) => (p.id === id ? { ...p, lastYear } : p)),
    };
    if (!validSeasonState(state))
      throw Error('Choose a crop, empty or not sure for each of the three seasons.');
    save(state);
  },
  /** Save the year plan chosen for a plot; crops of the old plan that have not started are dropped. */
  choosePlan(id: string, plan: PlotPlan) {
    const plots = snapshot.state.plots ?? [];
    if (!plots.some((p) => p.id === id)) throw Error('This plot no longer exists.');
    const farms = snapshot.state.farms.filter(
      (f) => !(f.plotId === id && f.rotationSeason && !f.plantedDate),
    );
    const state = {
      ...snapshot.state,
      farms,
      activeId: farms.some((f) => f.id === snapshot.state.activeId)
        ? snapshot.state.activeId
        : null,
      plots: plots.map((p) => (p.id === id ? { ...p, plan } : p)),
    };
    if (!validSeasonState(state)) throw Error('This plan could not be saved.');
    save(state);
  },
  /** Stop using a plot from a day on; its records stay. Its open calendar closes. */
  endPlot(id: string, endDate: string) {
    const plots = snapshot.state.plots ?? [];
    const plot = plots.find((p) => p.id === id);
    if (!plot) throw Error('This plot no longer exists.');
    if (plot.endDate !== undefined) throw Error('This plot has already ended.');
    const onPlot = (farmId: string | null | undefined) =>
      !!farmId && snapshot.state.farms.some((f) => f.id === farmId && f.plotId === id);
    const state = {
      ...snapshot.state,
      plots: plots.map((p) => (p.id === id ? { ...p, endDate } : p)),
      activeId: onPlot(snapshot.state.activeId) ? null : snapshot.state.activeId,
      calendarAccessId: onPlot(snapshot.state.calendarAccessId)
        ? null
        : snapshot.state.calendarAccessId,
      draftPlotId: snapshot.state.draftPlotId === id ? null : snapshot.state.draftPlotId,
    };
    if (!validSeasonState(state)) throw Error('The end date cannot be before the plot started.');
    save(state);
  },
  /** Use a stopped plot again, if its land still has room for it. */
  reopenPlot(id: string) {
    const plots = snapshot.state.plots ?? [];
    if (!plots.some((p) => p.id === id)) throw Error('This plot no longer exists.');
    const state = {
      ...snapshot.state,
      plots: plots.map((p) => (p.id === id ? { ...p, endDate: undefined } : p)),
    };
    if (!validSeasonState(state))
      throw Error('This land does not have room for the plot. Make another plot smaller first.');
    save(state);
  },
  /** Delete a plot with nothing recorded on it, with any crop calendars not started. */
  removePlot(id: string) {
    const plots = snapshot.state.plots ?? [];
    if (!plots.some((p) => p.id === id)) throw Error('This plot no longer exists.');
    const own = snapshot.state.farms.filter((f) => f.plotId === id);
    if (own.some((f) => f.plantedDate || f.harvestedDate))
      throw Error('This plot has crop records. Stop using it instead, so they are kept.');
    const gone = new Set(own.map((f) => f.id));
    const farms = snapshot.state.farms.filter((f) => !gone.has(f.id));
    save({
      ...snapshot.state,
      farms,
      plots: plots.filter((p) => p.id !== id),
      activeId: gone.has(snapshot.state.activeId ?? '') ? null : snapshot.state.activeId,
      calendarAccessId: gone.has(snapshot.state.calendarAccessId ?? '')
        ? null
        : snapshot.state.calendarAccessId,
      draftPlotId: snapshot.state.draftPlotId === id ? null : snapshot.state.draftPlotId,
    });
  },
  create(farm: SeasonFarm) {
    const existing = snapshot.state.farms.find(
      (f) => f.id === farm.id || (farm.creationKey && f.creationKey === farm.creationKey),
    );
    if (existing) {
      save({ ...snapshot.state, activeId: existing.id, calendarAccessId: existing.id });
      return existing.id;
    }
    if (snapshot.state.farms.length >= 200)
      throw Error('Export and archive farms before adding more.');
    const parent = !farm.fieldId
      ? {
          id: `field-${farm.id}`,
          name: (farm.field.name || farm.site.name).slice(0, 80),
          profile: { ...farm.field },
          site: { ...farm.site },
        }
      : undefined;
    const linked = parent ? { ...farm, fieldId: parent.id } : farm;
    const state = {
      ...snapshot.state,
      fields: parent ? [...(snapshot.state.fields ?? []), parent] : snapshot.state.fields,
      farms: [...snapshot.state.farms, linked],
      activeId: farm.id,
      calendarAccessId: farm.id,
    };
    if (
      !validSeasonState(state) ||
      state.fields?.some((f) => peakFieldArea(state.farms, f.id) > f.profile.area + 1e-8)
    )
      throw Error(
        'Check the farm location and area. Farms growing at the same time must fit within their field.',
      );
    save(state);
    return farm.id;
  },
  activate(id: string | null) {
    if (id === null || snapshot.state.farms.some((f) => f.id === id))
      save({ ...snapshot.state, activeId: id, calendarAccessId: id });
  },
  resizeFarm(id: string, area: number) {
    if (!Number.isFinite(area) || area <= 0 || area > 1000)
      throw Error('Enter a farm area greater than zero.');
    const state = {
      ...snapshot.state,
      farms: snapshot.state.farms.map((f) =>
        f.id === id ? { ...f, field: { ...f.field, area } } : f,
      ),
    };
    if (
      !state.farms.some((f) => f.id === id) ||
      !validSeasonState(state) ||
      state.fields?.some((f) => peakFieldArea(state.farms, f.id) > f.profile.area + 1e-8)
    )
      throw Error('The farm areas must fit inside their field.');
    save(state);
  },
  revokeCalendar() {
    if (snapshot.state.calendarAccessId !== null)
      save({ ...snapshot.state, calendarAccessId: null });
  },
  update(
    id: string,
    patch: Pick<
      Partial<SeasonFarm>,
      | 'plantedDate'
      | 'harvestedDate'
      | 'notes'
      | 'done'
      | 'observations'
      | 'harvestStartedDate'
      | 'plannedSowDate'
      | 'plannedHarvestDate'
      | 'cancelled'
      | 'lost'
      | 'earlyHarvest'
      | 'lostTries'
      | 'checkIns'
      | 'thermalProfile'
      | 'waterRecords'
      | 'cultivarReference'
      | 'field'
    >,
  ) {
    if (patch.field) {
      const original = snapshot.state.farms.find((f) => f.id === id)?.field;
      if (
        !original ||
        JSON.stringify({ ...original, soilEvidence: undefined }) !==
          JSON.stringify({ ...patch.field, soilEvidence: undefined })
      )
        throw Error('Change land conditions through the crop-selection workflow.');
    }
    const state = {
      ...snapshot.state,
      farms: snapshot.state.farms.map((f) => (f.id === id ? { ...f, ...patch } : f)),
    };
    if (!validSeasonState(state)) throw Error('Invalid farm activity record.');
    save(state);
  },
  remove(id: string) {
    const farms = snapshot.state.farms.filter((f) => f.id !== id);
    save({
      ...snapshot.state,
      farms,
      activeId: snapshot.state.activeId === id ? (farms[0]?.id ?? null) : snapshot.state.activeId,
      calendarAccessId:
        snapshot.state.calendarAccessId === id ? null : snapshot.state.calendarAccessId,
    });
  },
  reset() {
    blocked = false;
    recovered = false;
    try {
      localStorage.removeItem(`${seasonStorageKey}-recovery`);
    } catch {
      /* In-tab reset remains available. */
    }
    save(blank);
  },
};
export function useSeasonFarms() {
  return useSyncExternalStore(
    seasonStore.subscribe,
    seasonStore.getSnapshot,
    seasonStore.getServerSnapshot,
  );
}
