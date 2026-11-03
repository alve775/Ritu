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

export interface SeasonState {
  version: 1;
  farms: SeasonFarm[];
  activeId: string | null;
  /** Granted only by crop creation or explicitly opening a saved farm. */
  calendarAccessId?: string | null;
  confirmedKey: string | null;
}
export const seasonStorageKey = 'ritu-season-farms-v1';
const blank: SeasonState = {
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
    Array.isArray(s.farms) &&
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
    )
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
        if (event.key !== seasonStorageKey || event.newValue === null) return;
        try {
          const state: unknown = JSON.parse(event.newValue);
          if (validSeasonState(state)) {
            snapshot = { state, ready: true, saved: true, recovery: false };
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
          if (validSeasonState(parsed)) state = parsed;
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
                    farms: [farm],
                    activeId: null,
                    confirmedKey: null,
                  }),
              );
              state = { ...blank, farms, activeId: farms[0]?.id ?? null };
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
    save({ ...snapshot.state, confirmedKey: key });
  },
  create(farm: SeasonFarm) {
    if (snapshot.state.farms.length >= 200)
      throw Error('Export and archive farms before adding more.');
    const state = {
      ...snapshot.state,
      farms: [...snapshot.state.farms, farm],
      activeId: farm.id,
      calendarAccessId: farm.id,
    };
    if (!validSeasonState(state)) throw Error('The farm record could not be validated.');
    save(state);
  },
  activate(id: string | null) {
    if (id === null || snapshot.state.farms.some((f) => f.id === id))
      save({ ...snapshot.state, activeId: id, calendarAccessId: id });
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
