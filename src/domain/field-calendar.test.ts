import { describe, it, expect } from 'vitest';
import { trackingFarm } from '../../tests/fixtures/tracking-farm';
import type { SeasonContext } from './global-season';
import contexts from '../../tests/fixtures/world-growing-contexts.json';
import { addDays } from './evidence-planner';
import {
  allocationInterval,
  peakFieldArea,
  validRegisteredField,
  validFieldLinks,
  migrateFieldRegistry,
  recoverFieldRegistry,
} from './field-registry';
import { farmCalendarDay } from './farm-calendar';
import { validSeasonState } from '../lib/season-store';

describe('fields and calendar', () => {
  it('recovers pending fields and matching parents while preserving each readable farm', () => {
    const farm = { ...trackingFarm(), fieldId: 'original' };
    const parent = {
      id: 'original',
      name: 'Original parent',
      profile: farm.field,
      site: farm.site,
    };
    const pending = {
      id: 'pending',
      name: 'Second field',
      profile: { ...farm.field, area: 0 },
      site: undefined,
    };
    const recovered = recoverFieldRegistry([farm], [parent, null, pending]);
    expect(recovered.fields).toEqual([parent, pending]);
    expect(recovered.farms[0]).toEqual(farm);
    expect(
      validSeasonState({ version: 1, ...recovered, activeId: farm.id, confirmedKey: null }),
    ).toBe(true);
  });
  it('matches 20,000 allocation schedules to a day-by-day independent calculation', () => {
    let seed = 912735;
    const random = () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2 ** 32;
    };
    const base = trackingFarm(),
      origin = '2026-01-01';
    for (let n = 0; n < 20000; n++) {
      const farms = Array.from({ length: 1 + Math.floor(random() * 8) }, (_, i) => {
        const start = Math.floor(random() * 25),
          length = 1 + Math.floor(random() * 20);
        return {
          ...base,
          id: `${n}-${i}`,
          fieldId: i % 3 === 0 ? 'another-field' : 'target',
          field: { ...base.field, area: 1 + Math.floor(random() * 20) / 10 },
          plantedDate: '',
          selection: {
            ...base.selection,
            start: addDays(origin, start),
            endLate: addDays(origin, start + length),
          },
        };
      });
      const a = Math.floor(random() * 25),
        b = a + Math.floor(random() * 25);
      let expected = 0;
      for (let d = a; d <= b; d++) {
        const date = addDays(origin, d);
        expected = Math.max(
          expected,
          farms
            .filter(
              (f) =>
                f.fieldId === 'target' && f.selection.start <= date && f.selection.endLate > date,
            )
            .reduce((sum, f) => sum + f.field.area, 0),
        );
      }
      expect(
        Math.abs(peakFieldArea(farms, 'target', addDays(origin, a), addDays(origin, b)) - expected),
      ).toBeLessThan(1e-8);
    }
  }, 30000);
  it('shades the full season, early harvest and continued seasons across 21,900 day/location/state combinations', () => {
    const base = trackingFarm();
    for (const row of contexts.slice(0, 6))
      for (let offset = -365; offset < 365; offset++) {
        const date = addDays(base.selection.start, offset);
        for (const mode of ['planned', 'growing', 'early', 'late', 'perennial']) {
          const farm = {
            ...base,
            site: row.context.site,
            plantedDate: mode === 'planned' ? '' : base.selection.start,
            harvestedDate:
              mode === 'early'
                ? addDays(base.selection.start, 30)
                : mode === 'late'
                  ? addDays(base.selection.start, 150)
                  : '',
            selection: {
              ...base.selection,
              planKind:
                mode === 'perennial' ? ('perennial-review' as const) : ('seasonal' as const),
            },
          };
          const today = addDays(base.selection.start, 130),
            day = farmCalendarDay(farm, date, today);
          const last =
            farm.harvestedDate || addDays(base.selection.start, base.selection.durationMax - 1);
          expect(day.scheduled).toBe(date >= base.selection.start && date <= last);
          expect(day.growing).toBe(
            mode !== 'planned' &&
              date >= base.selection.start &&
              date <= today &&
              (!farm.harvestedDate || date <= farm.harvestedDate),
          );
        }
      }
  });
  it('retains active and perennial area until final seasonal harvest; adjacent seasons reuse land', () => {
    const f = { ...trackingFarm(), fieldId: 'f', field: { ...trackingFarm().field, area: 2 } };
    expect(allocationInterval(f).end).toBe('9999-12-31');
    expect(peakFieldArea([f], 'f', '2030-01-01')).toBe(2);
    const ended = { ...f, harvestedDate: '2026-05-05' };
    expect(peakFieldArea([ended], 'f', '2026-05-06')).toBe(0);
    expect(
      allocationInterval({
        ...ended,
        selection: { ...ended.selection, planKind: 'perennial-review' },
      }).end,
    ).toBe('9999-12-31');
  });
  it('migrates records without merging fields, changing coordinates or discarding observations', () => {
    const farms = contexts.map((row, i) => ({
      ...trackingFarm(),
      id: `${i}`,
      site: row.context.site,
      context: row.context as SeasonContext,
    }));
    const migrated = migrateFieldRegistry({ farms });
    expect(migrated.fields).toHaveLength(farms.length);
    expect(validFieldLinks(migrated.fields, migrated.farms)).toBe(true);
    expect(migrated.farms.map((f) => ({ ...f, fieldId: undefined }))).toEqual(
      farms.map((f) => ({ ...f, fieldId: undefined })),
    );
    expect(migrateFieldRegistry(migrated)).toEqual(migrated);
    expect(new Set(migrated.fields.map((f) => f.id)).size).toBe(farms.length);
  });
  it('rejects broken fields, links and hostile record shapes without throwing', () => {
    const farm = trackingFarm(),
      field = { id: 'field', name: 'North', profile: farm.field, site: farm.site };
    expect(validRegisteredField(field)).toBe(true);
    for (const bad of [
      null,
      {},
      { ...field, profile: null },
      { ...field, profile: { ...farm.field, area: NaN } },
      { ...field, profile: { ...farm.field, area: -1 } },
    ])
      expect(validRegisteredField(bad)).toBe(false);
    const state = {
      version: 1 as const,
      farms: [{ ...farm, fieldId: 'field' }],
      activeId: farm.id,
      confirmedKey: null,
      fields: [field],
    };
    expect(validSeasonState(state)).toBe(true);
    expect(validSeasonState({ ...state, farms: null })).toBe(false);
    expect(validSeasonState({ ...state, farms: [null] })).toBe(false);
    expect(validSeasonState({ ...state, fields: [field, field] })).toBe(false);
    expect(
      validSeasonState({
        ...state,
        fields: [{ ...field, profile: { ...field.profile, area: 0.5 } }],
      }),
    ).toBe(false);
    expect(
      validSeasonState({ ...state, fields: [{ ...field, site: contexts[1].context.site }] }),
    ).toBe(false);
  });
});
