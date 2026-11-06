import type { Farm } from './types';
import { cropIds } from './types';
import type { FarmSite } from './farm-site';
import { samePoint, validSite } from './farm-site';
import type { SeasonFarm } from './global-season';
import { validSoilEvidence } from './soil-evidence';
import { addDays } from './evidence-planner';

export interface RegisteredField {
  id: string;
  name: string;
  profile: Farm;
  site?: FarmSite;
}
export function validRegisteredField(raw: unknown): raw is RegisteredField {
  if (!raw || typeof raw !== 'object') return false;
  const f = raw as RegisteredField,
    p = f.profile;
  return (
    typeof f.id === 'string' &&
    f.id.length > 0 &&
    f.id.length <= 120 &&
    typeof f.name === 'string' &&
    f.name.trim().length > 0 &&
    f.name.length <= 80 &&
    !!p &&
    typeof p.name === 'string' &&
    p.name.length <= 80 &&
    Number.isFinite(p.area) &&
    p.area >= 0 &&
    p.area <= 1000 &&
    ['loam', 'clay', 'sandy', 'unknown'].includes(p.soil) &&
    ['good', 'poor', 'unknown'].includes(p.drainage) &&
    ['reliable', 'limited', 'severe', 'rainfed', 'unknown'].includes(p.irrigation) &&
    Array.isArray(p.required) &&
    p.required.length <= 3 &&
    new Set(p.required).size === p.required.length &&
    p.required.every((v) => ['rice', 'pulses', 'potato'].includes(v)) &&
    Array.isArray(p.unavailableMonths) &&
    p.unavailableMonths.length <= 12 &&
    new Set(p.unavailableMonths).size === p.unavailableMonths.length &&
    p.unavailableMonths.every((v) => Number.isInteger(v) && v >= 0 && v < 12) &&
    Array.isArray(p.current) &&
    p.current.length <= cropIds.length &&
    new Set(p.current.map((c) => c?.crop)).size === p.current.length &&
    p.current.every((c) => !!c && cropIds.includes(c.crop)) &&
    (p.soilEvidence === undefined || validSoilEvidence(p.soilEvidence)) &&
    (f.site === undefined || validSite(f.site))
  );
}
export function fieldReady(field: RegisteredField) {
  return !!field.site && field.profile.area > 0;
}

/** Completed seasons release their area; active plantings and perennial crops retain it. */
export function allocationInterval(farm: SeasonFarm) {
  return {
    start: farm.plantedDate || farm.selection.start,
    end:
      farm.selection.planKind === 'perennial-review' || (farm.plantedDate && !farm.harvestedDate)
        ? '9999-12-31'
        : farm.harvestedDate || addDays(farm.selection.endLate, -1),
  };
}
export function peakFieldArea(
  farms: SeasonFarm[],
  fieldId: string,
  start = '0001-01-01',
  end = '9999-12-31',
) {
  const events: [number, number][] = [];
  for (const farm of farms) {
    if (farm.fieldId !== fieldId) continue;
    const interval = allocationInterval(farm),
      a = interval.start > start ? interval.start : start,
      b = interval.end < end ? interval.end : end;
    if (a > b) continue;
    events.push(
      [Date.parse(a + 'T00:00:00Z'), farm.field.area],
      [Date.parse(b + 'T00:00:00Z') + 86400000, -farm.field.area],
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
export function validFieldLinks(fields: RegisteredField[], farms: SeasonFarm[]) {
  return farms.every((farm) => {
    const parent = fields.find((f) => f.id === farm.fieldId);
    return (
      !!parent?.site &&
      samePoint(parent.site, farm.site) &&
      farm.field.area <= parent.profile.area + 1e-8
    );
  });
}

/** Retain readable fields as well as farms when recovering a damaged file. */
export function recoverFieldRegistry(farms: SeasonFarm[], rawFields: unknown) {
  const readable = Array.isArray(rawFields)
    ? rawFields
        .filter(validRegisteredField)
        .filter((f, i, all) => all.findIndex((other) => other.id === f.id) === i)
    : [];
  const fields: RegisteredField[] = [],
    linked: SeasonFarm[] = [];
  for (const farm of farms.slice(0, 200)) {
    let parent = readable.find(
      (f) =>
        f.id === farm.fieldId &&
        !!f.site &&
        samePoint(f.site, farm.site) &&
        f.profile.area >= farm.field.area,
    );
    if (!parent) {
      const base = `field-${farm.id}`;
      let id = base,
        suffix = 0;
      while ([...fields, ...readable].some((f) => f.id === id)) id = `${base}-r${++suffix}`;
      parent = {
        id,
        name: (farm.field.name || farm.site.name).slice(0, 80),
        profile: { ...farm.field },
        site: { ...farm.site },
      };
    }
    if (!fields.some((f) => f.id === parent.id)) fields.push(parent);
    linked.push({ ...farm, fieldId: parent.id });
  }
  for (const field of readable)
    if (fields.length < 200 && !fields.some((f) => f.id === field.id)) fields.push(field);
  return { fields, farms: linked };
}

/** Old one-crop records become independent fields; no location or journal is guessed or merged. */
export function migrateFieldRegistry<T extends { farms: SeasonFarm[]; fields?: RegisteredField[] }>(
  state: T,
): T & { fields: RegisteredField[] } {
  if (state.fields) return { ...state, fields: state.fields };
  const fields = state.farms.map((farm) => ({
    id: `field-${farm.id}`,
    name: (farm.field.name || farm.site.name).slice(0, 80),
    profile: { ...farm.field },
    site: { ...farm.site },
  }));
  return {
    ...state,
    fields,
    farms: state.farms.map((farm, i) => ({ ...farm, fieldId: fields[i].id })),
  };
}
