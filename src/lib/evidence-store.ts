import { useSyncExternalStore } from 'react';
import type { CropId, Farm, Language, Priority } from '../domain/types';
import { cropIds } from '../domain/types';
import { validSite } from '../domain/farm-site';
import type { FarmSite } from '../domain/farm-site';
import { validPowerClimate } from '../domain/nasa-power';
import type { PowerClimate } from '../domain/nasa-power';
import { validDate, noOverlap, addDays, referenceWeekStart } from '../domain/evidence-planner';
import type { Season } from '../domain/evidence-planner';
import { calendarByCrop } from '../data/regional-calendars';
import type { EvidencePlan } from '../domain/evidence-planner';
export interface RealActivity {
  plantedDate?: string;
  harvestedDate?: string;
  note: string;
}
export interface SavedEvidencePlan {
  plan: EvidencePlan;
  site: FarmSite;
  profileKey: string;
  savedAt: string;
  records: Record<string, RealActivity>;
}
export interface EvidenceState {
  version: 2;
  language: Language;
  farm: Farm;
  site?: FarmSite;
  climate?: PowerClimate;
  district: string;
  priority: Priority;
  from: string;
  preferred: CropId[];
  unplanted: Season[];
  reviewed: string | null;
  selected: string | null;
  tracked: SavedEvidencePlan | null;
}
export const blankFarm: Farm = {
  name: '',
  area: 0,
  soil: 'unknown',
  drainage: 'unknown',
  irrigation: 'unknown',
  required: [],
  unavailableMonths: [],
  current: [],
};
export const emptyEvidenceState: EvidenceState = {
  version: 2,
  language: 'en',
  farm: blankFarm,
  district: '',
  priority: 'familiar',
  from: '',
  preferred: [],
  unplanted: [],
  reviewed: null,
  selected: null,
  tracked: null,
};
export function profileKey(
  state: Pick<EvidenceState, 'farm' | 'site' | 'district' | 'from' | 'priority'>,
) {
  return JSON.stringify([
    state.farm,
    state.site ?? null,
    state.district,
    state.from,
    state.priority,
  ]);
}
const key = 'ritu-evidence-v2',
  server = { state: emptyEvidenceState, ready: false, saved: true };
let snapshot = server,
  loaded = false;
const listeners = new Set<() => void>();
function validateEvidenceState(value: unknown): value is EvidenceState {
  // Draft input errors must not discard saved activity records. The farm review
  // gate separately enforces the supported planning date and field-area limits.
  if (!value || typeof value !== 'object') return false;
  const v = value as EvidenceState,
    f = v.farm;
  if (
    v.version !== 2 ||
    !['en', 'bn'].includes(v.language) ||
    !f ||
    typeof f.name !== 'string' ||
    f.name.length > 80 ||
    typeof f.area !== 'number' ||
    !Number.isFinite(f.area) ||
    !['loam', 'clay', 'sandy', 'unknown'].includes(f.soil) ||
    !['good', 'poor', 'unknown'].includes(f.drainage) ||
    !['reliable', 'limited', 'severe', 'rainfed', 'unknown'].includes(f.irrigation) ||
    !Array.isArray(f.required) ||
    f.required.length > 3 ||
    new Set(f.required).size !== f.required.length ||
    f.required.some((x) => !['rice', 'pulses', 'potato'].includes(x)) ||
    !Array.isArray(f.unavailableMonths) ||
    f.unavailableMonths.length > 12 ||
    new Set(f.unavailableMonths).size !== f.unavailableMonths.length ||
    f.unavailableMonths.some((x) => !Number.isInteger(x) || x < 0 || x > 11) ||
    !Array.isArray(f.current) ||
    f.current.length > cropIds.length ||
    new Set(f.current.map((x) => x?.crop)).size !== f.current.length ||
    f.current.some((p) => !p || !cropIds.includes(p.crop)) ||
    !['water', 'diversity', 'familiar', 'resilience', 'soil'].includes(v.priority) ||
    typeof v.district !== 'string' ||
    v.district.length > 80 ||
    (v.site !== undefined && !validSite(v.site)) ||
    (v.climate !== undefined && !validPowerClimate(v.climate)) ||
    (v.from !== '' && !validDate(v.from)) ||
    !Array.isArray(v.preferred) ||
    v.preferred.length > cropIds.length ||
    v.preferred.some((c) => !cropIds.includes(c)) ||
    new Set(v.preferred).size !== v.preferred.length ||
    !Array.isArray(v.unplanted) ||
    v.unplanted.length > 3 ||
    new Set(v.unplanted).size !== v.unplanted.length ||
    v.unplanted.some((x) => !['winter', 'pre-monsoon', 'monsoon'].includes(x)) ||
    (v.reviewed !== null && typeof v.reviewed !== 'string') ||
    (v.selected !== null && typeof v.selected !== 'string')
  )
    return false;
  if (v.tracked === null) return true;
  const p = v.tracked;
  return (
    !!p &&
    validSite(p.site) &&
    typeof p.profileKey === 'string' &&
    typeof p.savedAt === 'string' &&
    Number.isFinite(Date.parse(p.savedAt)) &&
    !!p.plan &&
    typeof p.plan.id === 'string' &&
    p.plan.id.startsWith('regional-') &&
    Array.isArray(p.plan.periods) &&
    p.plan.periods.length >= 1 &&
    p.plan.periods.length <= 3 &&
    p.plan.periods.every(
      (x) =>
        x &&
        cropIds.includes(x.crop) &&
        typeof x.source === 'string' &&
        x.source === calendarByCrop(x.crop)?.source.document &&
        validDate(x.start) &&
        validDate(x.end) &&
        x.durationDays === calendarByCrop(x.crop)?.duration.max &&
        x.end === addDays(x.start, x.durationDays) &&
        x.start ===
          referenceWeekStart(Number(x.start.slice(0, 4)), calendarByCrop(x.crop)!.weeks.first),
    ) &&
    noOverlap(p.plan.periods) &&
    p.plan.periods.every((x, i) => !i || p.plan.periods[i - 1].start < x.start) &&
    p.plan.id === `regional-${p.plan.periods.map((x) => `${x.crop}-${x.start}`).join('_')}` &&
    Array.isArray(p.plan.gaps) &&
    JSON.stringify(p.plan.gaps) ===
      JSON.stringify(
        p.plan.periods
          .slice(1)
          .flatMap((x, i) =>
            p.plan.periods[i].end < x.start ? [{ start: p.plan.periods[i].end, end: x.start }] : [],
          ),
      ) &&
    Number.isInteger(p.plan.familyCount) &&
    p.plan.familyCount >= 1 &&
    p.plan.familyCount <= 3 &&
    typeof p.plan.includesPulse === 'boolean' &&
    Number.isInteger(p.plan.familiarCount) &&
    p.plan.familiarCount >= 0 &&
    p.plan.familiarCount <= p.plan.periods.length &&
    !!p.records &&
    typeof p.records === 'object' &&
    !Array.isArray(p.records) &&
    Object.keys(p.records).length === p.plan.periods.length &&
    p.plan.periods.every((x) => Object.hasOwn(p.records, `${x.crop}:${x.start}`)) &&
    Object.values(p.records).every(
      (r) =>
        r &&
        typeof r.note === 'string' &&
        r.note.length <= 2000 &&
        (r.plantedDate === undefined || validDate(r.plantedDate)) &&
        (r.harvestedDate === undefined || validDate(r.harvestedDate)) &&
        (!r.harvestedDate || (!!r.plantedDate && r.harvestedDate >= r.plantedDate)),
    )
  );
}
export function validEvidenceState(value: unknown): value is EvidenceState {
  try {
    return validateEvidenceState(value);
  } catch {
    return false;
  }
}
let recoveryBlocked = false;
function persist(state: EvidenceState) {
  let saved = true;
  try {
    if (recoveryBlocked)
      throw Error('Previous records could not be backed up. Export before resetting.');
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
    saved = false;
  }
  snapshot = { state, ready: true, saved };
  listeners.forEach((l) => l());
}
export const evidenceStore = {
  getSnapshot: () => snapshot,
  getServerSnapshot: () => server,
  subscribe(listener: () => void) {
    listeners.add(listener);
    if (!loaded) {
      loaded = true;
      let state = emptyEvidenceState;
      try {
        const raw = localStorage.getItem(key);
        let value: unknown = null;
        try {
          value = JSON.parse(raw ?? 'null');
        } catch {
          /* Invalid original is preserved below. */
        }
        if (validEvidenceState(value)) state = value;
        else {
          if (raw) {
            try {
              localStorage.setItem('ritu-evidence-v2-recovery', raw);
            } catch {
              recoveryBlocked = true;
            }
          }
          const legacy = JSON.parse(localStorage.getItem('ritu-preview-v1') ?? 'null');
          if (legacy?.language === 'bn') state = { ...state, language: 'bn' };
        }
      } catch {
        /* Never substitute sample farm data. */
      }
      persist(state);
    }
    return () => {
      listeners.delete(listener);
    };
  },
  update(change: Partial<EvidenceState>) {
    persist({ ...snapshot.state, ...change });
  },
  reset() {
    recoveryBlocked = false;
    try {
      for (const previous of [
        'ritu-preview-v1',
        'ritu-demo-v1',
        'ritu-journey-v1',
        'ritu-evidence-v2-recovery',
      ])
        localStorage.removeItem(previous);
    } catch {
      /* The visible in-tab state still resets when browser storage is unavailable. */
    }
    persist({ ...emptyEvidenceState, language: snapshot.state.language });
  },
};
export function useEvidence() {
  return useSyncExternalStore(
    evidenceStore.subscribe,
    evidenceStore.getSnapshot,
    evidenceStore.getServerSnapshot,
  );
}
