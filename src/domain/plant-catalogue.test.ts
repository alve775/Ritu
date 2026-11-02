import { describe, expect, it } from 'vitest';
import contexts from '../../tests/fixtures/world-growing-contexts.json';
import { globalCrops, globalCrop } from './global-season';
import { requirements, screeningGap, suggestSeason } from './plant-screen';
import { searchPlantCatalogue } from './plant-search';
import { blankFarm } from '../lib/evidence-store';
import { actionsForDay } from './season-actions';
import { validSeasonState } from '../lib/season-store';
import type { SeasonContext, SeasonFarm } from './global-season';
const context = contexts[0].context as SeasonContext,
  farm = { ...blankFarm, soil: 'unknown' as const, drainage: 'unknown' as const, area: 1 };
describe('complete plant catalogue and honest evidence coverage', () => {
  it('treats NA source labels as missing, preserving the scientific identity instead of inventing a common name', () => {
    const plant = globalCrop('ecocrop-17648')!;
    expect(plant.name.en).toBe('Eucalyptus camaldulensis, northern provenances');
    expect(plant.lifespan).toBe('');
    expect(plant.lifeform).toBe('');
    expect(plant.planKind).toBe('unknown');
    expect(screeningGap(requirements.crops.find((c) => c.id === plant.id)!)).not.toBeNull();
  });
  it('imports every non-retired source record and retains stable existing crop identities', () => {
    expect(requirements.sourceCount).toBe(2568);
    expect(globalCrops.length + requirements.retired.length).toBe(requirements.sourceCount);
    expect(globalCrops).toHaveLength(2562);
    expect(new Set(globalCrops.map((c) => c.id)).size).toBe(globalCrops.length);
    expect(globalCrops.some((c) => /sorghum/i.test(c.scientific))).toBe(false);
    expect(globalCrop('groundnut')?.scientific).toBe('Arachis hypogaea');
    expect(globalCrops.find((c) => c.scientific === 'Mangifera indica')?.planKind).toBe(
      'perennial-review',
    );
    expect(globalCrops.find((c) => c.scientific === 'Cucumis melo')?.planKind).toBe('seasonal');
  });
  it('exposes the entire catalogue through pages without silently dropping incomplete records', () => {
    const first = searchPlantCatalogue(context, farm, '2026-11-01', {
      mode: 'catalogue',
      category: 'all',
    });
    const last = searchPlantCatalogue(context, farm, '2026-11-01', {
      mode: 'catalogue',
      category: 'all',
      page: 1000,
    });
    expect(first.count).toBe(2562);
    expect(first.items).toHaveLength(12);
    expect(last.page).toBe(214);
    expect(last.items).toHaveLength(6);
    expect(first.items.some((a) => last.items.some((b) => a.plant!.id === b.plant!.id))).toBe(
      false,
    );
  });
  it('finds peanut aliases and excludes non-food uses from the default food view', () => {
    const found = searchPlantCatalogue(context, farm, '2026-11-01', {
      text: 'peanut',
      mode: 'catalogue',
    });
    expect(found.items.some((c) => c.plant?.id === 'groundnut')).toBe(true);
    expect(
      searchPlantCatalogue(context, farm, '2026-11-01', { mode: 'catalogue', category: 'food' })
        .count,
    ).toBeLessThan(2562);
  });
  it('retains missing-duration plants for browsing without manufacturing dates or selectable suggestions', () => {
    const watermelon = requirements.crops.find((c) => c.scientific === 'Citrullus lanatus')!;
    expect(screeningGap(watermelon)).toContain('growing-period');
    const result = searchPlantCatalogue(context, farm, '2026-11-01', {
      text: watermelon.scientific,
      mode: 'catalogue',
    });
    expect(result.items[0].suggestion).toBeNull();
    expect(result.items[0].unavailable).toContain('no harvest date');
  });
  it('does not interpret perennial source growing periods as time to first harvest', () => {
    const mango = globalCrops.find((c) => c.scientific === 'Mangifera indica')!;
    const selection = suggestSeason(context, farm, '2026-11-01').find((s) => s.crop === mango.id)!;
    expect(selection.planKind).toBe('perennial-review');
    expect(selection.durationMin).toBe(365);
    expect(selection.cautions.join(' ')).toContain(
      'not a growing duration or first-harvest prediction',
    );
    const record: SeasonFarm = {
      id: 'mango-test',
      createdAt: '2026-11-01T10:00:00Z',
      field: farm,
      site: context.site,
      context,
      selection,
      plantedDate: '2026-01-01',
      harvestedDate: '2026-09-01',
      notes: '',
      done: [],
      observations: [],
    };
    expect(
      validSeasonState({ version: 1, farms: [record], activeId: record.id, confirmedKey: null }),
    ).toBe(true);
    const actions = actionsForDay(record, '2027-11-01', null).map((a) => a.id);
    expect(actions).toContain('walk-field');
    expect(actions).toContain('perennial-review');
    expect(actions).not.toContain('maturity-check');
    expect(actions).not.toContain('post-harvest');
    expect(
      validSeasonState({
        version: 1,
        farms: [{ ...record, selection: { ...selection, planKind: undefined } }],
        activeId: null,
        confirmedKey: null,
      }),
    ).toBe(false);
  });
});
