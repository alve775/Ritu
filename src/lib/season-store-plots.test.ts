import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { seasonStore, seasonStorageKey, validSeasonState } from './season-store';
import type { Plot } from '../domain/plot';
import type { RegisteredField } from '../domain/field-registry';
import { trackingFarm } from '../../tests/fixtures/tracking-farm';

const site = trackingFarm().site;
const land = (area = 1.2): RegisteredField => ({
  id: 'land-1',
  name: 'Land 1',
  profile: { ...trackingFarm().field, name: 'Land 1', area },
  site,
});
const plot = (patch: Partial<Plot> = {}): Plot => ({
  id: 'plot-a',
  fieldId: 'land-1',
  name: 'Plot A',
  areaHa: 0.6,
  startDate: '2025-01-01',
  madeFrom: [],
  lastYear: { 'pre-monsoon': 'fallow', monsoon: 'aman', winter: 'boro' },
  ...patch,
});
let entries: Map<string, string>;
const saved = () => JSON.parse(entries.get(seasonStorageKey)!);
beforeEach(() => {
  entries = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  });
  seasonStore.reset();
  seasonStore.addFields([land()]);
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('plot store', () => {
  it('keeps older saved states without plots valid', () => {
    const state = seasonStore.getSnapshot().state;
    expect(state.plots).toBeUndefined();
    expect(validSeasonState(state)).toBe(true);
  });
  it('saves a plot and its last-year crops across save and reload', () => {
    expect(seasonStore.addPlot(plot())).toBe('plot-a');
    seasonStore.updatePlotLastYear('plot-a', {
      'pre-monsoon': 'mung',
      monsoon: 'aman',
      winter: 'mustard',
    });
    const stored = saved();
    expect(validSeasonState(stored)).toBe(true);
    expect(stored.plots[0].lastYear).toEqual({
      'pre-monsoon': 'mung',
      monsoon: 'aman',
      winter: 'mustard',
    });
    expect(stored).toEqual(seasonStore.getSnapshot().state);
  });
  it('rejects plots larger than their field and leaves the state unchanged', () => {
    expect(() => seasonStore.addPlot(plot({ areaHa: 1.5 }))).toThrow();
    seasonStore.addPlot(plot());
    expect(() => seasonStore.addPlot(plot({ id: 'plot-b', areaHa: 0.7 }))).toThrow();
    expect(seasonStore.getSnapshot().state.plots?.map((p) => p.id)).toEqual(['plot-a']);
  });
  it('rejects invalid plots, unknown fields, duplicates and bad crop answers', () => {
    expect(() => seasonStore.addPlot(plot({ fieldId: 'nowhere' }))).toThrow();
    expect(() => seasonStore.addPlot(plot({ name: '' }))).toThrow();
    seasonStore.addPlot(plot());
    expect(() => seasonStore.addPlot(plot())).toThrow();
    expect(() =>
      seasonStore.updatePlotLastYear('plot-a', {
        'pre-monsoon': 'fallow',
        monsoon: 'not-a-crop',
        winter: 'boro',
      } as unknown as Plot['lastYear']),
    ).toThrow();
    expect(() => seasonStore.updatePlotLastYear('missing', plot().lastYear)).toThrow();
    expect(seasonStore.getSnapshot().state.plots?.[0].lastYear).toEqual(plot().lastYear);
  });
  it('ends two plots and starts a merged plot that remembers both', () => {
    seasonStore.addPlot(plot({ id: 'a' }));
    seasonStore.addPlot(
      plot({ id: 'b', lastYear: { 'pre-monsoon': 'fallow', monsoon: 'aman', winter: 'lentil' } }),
    );
    expect(() =>
      seasonStore.addPlot(
        plot({ id: 'c', areaHa: 1.2, startDate: '2026-07-01', madeFrom: ['a', 'b'] }),
      ),
    ).toThrow();
    seasonStore.endPlot('a', '2026-06-30');
    seasonStore.endPlot('b', '2026-06-30');
    expect(() => seasonStore.endPlot('a', '2026-07-30')).toThrow();
    seasonStore.addPlot(
      plot({ id: 'c', areaHa: 1.2, startDate: '2026-07-01', madeFrom: ['a', 'b'] }),
    );
    expect(saved().plots.find((p: Plot) => p.id === 'c').madeFrom).toEqual(['a', 'b']);
  });
  it('edits a plot name, size and crops, and refuses a size that no longer fits', () => {
    seasonStore.addPlot(plot());
    seasonStore.addPlot(plot({ id: 'plot-b', areaHa: 0.4 }));
    const lastYear: Plot['lastYear'] = {
      'pre-monsoon': 'mung',
      monsoon: 'aman',
      winter: 'mustard',
    };
    seasonStore.updatePlot('plot-a', { name: 'North plot', areaHa: 0.8, lastYear });
    expect(saved().plots[0]).toMatchObject({ name: 'North plot', areaHa: 0.8, lastYear });
    expect(() =>
      seasonStore.updatePlot('plot-a', { name: 'North plot', areaHa: 0.9, lastYear }),
    ).toThrow();
    expect(() => seasonStore.updatePlot('plot-a', { name: ' ', areaHa: 0.8, lastYear })).toThrow();
    expect(() => seasonStore.updatePlot('missing', { name: 'x', areaHa: 0.1, lastYear })).toThrow();
    expect(seasonStore.getSnapshot().state.plots?.[0]).toMatchObject({
      name: 'North plot',
      areaHa: 0.8,
    });
  });
  it('rejects an end date before the plot started', () => {
    seasonStore.addPlot(plot());
    expect(() => seasonStore.endPlot('plot-a', '2024-12-31')).toThrow();
    expect(seasonStore.getSnapshot().state.plots?.[0].endDate).toBeUndefined();
  });
  it('keeps the field from shrinking below its plots and removes plots with their field', () => {
    seasonStore.addPlot(plot());
    expect(() => seasonStore.saveField(land(0.5))).toThrow(/farms or plots/);
    seasonStore.removeField('land-1');
    expect(seasonStore.getSnapshot().state.plots).toEqual([]);
  });
  it('only accepts farm links to an existing plot on the same field', () => {
    seasonStore.addPlot(plot());
    const state = seasonStore.getSnapshot().state;
    const farm = trackingFarm({ id: 'f1', fieldId: 'land-1', plotId: 'plot-a' });
    expect(validSeasonState({ ...state, farms: [farm] })).toBe(true);
    expect(validSeasonState({ ...state, farms: [{ ...farm, plotId: 'ghost' }] })).toBe(false);
    expect(validSeasonState({ ...state, plots: undefined, farms: [farm] })).toBe(false);
    expect(validSeasonState({ ...state, farms: [{ ...farm, plotId: '' }] })).toBe(false);
  });
});

describe('removing a land', () => {
  const onPlot = (id: string, plantedDate: string) =>
    trackingFarm({ id, fieldId: 'land-1', plotId: 'plot-a', plantedDate, harvestedDate: '' });
  beforeEach(() => {
    seasonStore.addPlot(plot());
    seasonStore.addPlot(plot({ id: 'plot-b', name: 'Plot B', areaHa: 0.4 }));
  });
  it('deletes a land with nothing sown, with its plots and calendars not started', () => {
    seasonStore.create(onPlot('calendar', ''));
    expect(seasonStore.getSnapshot().state.calendarAccessId).toBe('calendar');
    expect(seasonStore.removeField('land-1').sort()).toEqual(['plot-a', 'plot-b']);
    const s = seasonStore.getSnapshot().state;
    expect(s.fields).toEqual([]);
    expect(s.plots).toEqual([]);
    expect(s.farms).toEqual([]);
    expect(s.activeId).toBeNull();
    expect(s.calendarAccessId).toBeNull();
    expect(validSeasonState(saved())).toBe(true);
  });
  it('refuses to delete a land with a sown crop unless the records go too', () => {
    seasonStore.create(onPlot('sown', '2026-01-01'));
    expect(() => seasonStore.removeField('land-1')).toThrow(/Stop using it instead/);
    expect(seasonStore.getSnapshot().state.fields).toHaveLength(1);
    seasonStore.removeField('land-1', true);
    expect(seasonStore.getSnapshot().state.farms).toEqual([]);
    expect(() => seasonStore.removeField('land-1')).toThrow(/no longer exists/);
  });
  it('stops a land and its plots, closes its calendar, keeps every record, and reopens', () => {
    seasonStore.create(onPlot('sown', '2026-01-01'));
    seasonStore.endField('land-1', '2026-11-09');
    let s = seasonStore.getSnapshot().state;
    expect(s.fields?.[0].endDate).toBe('2026-11-09');
    expect(s.plots?.map((p) => p.endDate)).toEqual(['2026-11-09', '2026-11-09']);
    expect(s.farms.map((f) => f.id)).toEqual(['sown']);
    expect(s.activeId).toBeNull();
    expect(s.calendarAccessId).toBeNull();
    expect(validSeasonState(saved())).toBe(true);
    expect(() => seasonStore.endField('land-1', '2026-11-10')).toThrow(/already stopped/);
    seasonStore.reopenField('land-1');
    s = seasonStore.getSnapshot().state;
    expect(s.fields?.[0].endDate).toBeUndefined();
    // Its plots stay stopped until each is used again.
    expect(s.plots?.every((p) => p.endDate === '2026-11-09')).toBe(true);
  });
  it('ends a plot that starts after the stop day on its own start day', () => {
    seasonStore.endPlot('plot-b', '2026-01-01');
    seasonStore.addPlot(
      plot({ id: 'plot-c', name: 'Plot C', areaHa: 0.4, startDate: '2026-12-01' }),
    );
    seasonStore.endField('land-1', '2026-11-09');
    const ends = Object.fromEntries(
      seasonStore.getSnapshot().state.plots!.map((p) => [p.id, p.endDate]),
    );
    expect(ends).toEqual({
      'plot-a': '2026-11-09',
      'plot-b': '2026-01-01',
      'plot-c': '2026-12-01',
    });
  });
  it('rejects a malformed stop date on a saved land', () => {
    const state = seasonStore.getSnapshot().state;
    expect(validSeasonState({ ...state, fields: [{ ...state.fields![0], endDate: 'soon' }] })).toBe(
      false,
    );
  });
});

describe('changing a plan', () => {
  it('drops crops of the old plan not started, and closes the calendar that showed one', () => {
    seasonStore.addPlot(plot());
    const plan = (winter: 'mustard' | 'wheat') => ({
      from: '2026-11-10',
      seasons: { winter, 'pre-monsoon': null, monsoon: 'aman' as const },
      chosenAt: '2026-11-10T00:00:00Z',
      source: 'suggested' as const,
    });
    seasonStore.choosePlan('plot-a', plan('mustard') as never);
    seasonStore.create(
      trackingFarm({
        id: 'unsown',
        fieldId: 'land-1',
        plotId: 'plot-a',
        rotationSeason: 'winter',
        plantedDate: '',
        harvestedDate: '',
      }),
    );
    expect(seasonStore.getSnapshot().state.calendarAccessId).toBe('unsown');
    seasonStore.choosePlan('plot-a', plan('wheat') as never);
    const s = seasonStore.getSnapshot().state;
    expect(s.farms).toEqual([]);
    expect(s.activeId).toBeNull();
    expect(s.calendarAccessId).toBeNull();
    expect(s.plots?.[0].plan?.seasons.winter).toBe('wheat');
    expect(validSeasonState(saved())).toBe(true);
  });
  it('refuses to delete a plot with a sown crop unless withRecords is true', () => {
    seasonStore.addPlot(plot());
    seasonStore.create(
      trackingFarm({
        id: 'sown-plot-crop',
        fieldId: 'land-1',
        plotId: 'plot-a',
        plantedDate: '2026-01-01',
        harvestedDate: '',
      }),
    );
    expect(() => seasonStore.removePlot('plot-a')).toThrow(/Stop using it instead/);
    expect(seasonStore.getSnapshot().state.plots).toHaveLength(1);
    seasonStore.removePlot('plot-a', true);
    const s = seasonStore.getSnapshot().state;
    expect(s.plots).toEqual([]);
    expect(s.farms).toEqual([]);
    expect(s.activeId).toBeNull();
    expect(s.calendarAccessId).toBeNull();
    expect(validSeasonState(saved())).toBe(true);
  });
});
