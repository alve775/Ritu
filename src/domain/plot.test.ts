import { describe, expect, it } from 'vitest';
import {
  peakPlotArea,
  recoverPlots,
  validLastYear,
  validPlot,
  validPlotLinks,
  type Plot,
} from './plot';
import { validRegisteredField } from './field-registry';
import type { RegisteredField } from './field-registry';
import { blankFarm } from '../lib/evidence-store';
import { trackingFarm } from '../../tests/fixtures/tracking-farm';

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
const land = (id = 'land-1', area = 1.2): RegisteredField => ({
  id,
  name: 'Land',
  profile: { ...blankFarm, area },
});

describe('plots', () => {
  it('accepts a plot with one crop, empty or unknown per season', () => {
    expect(validPlot(plot())).toBe(true);
    expect(
      validPlot(
        plot({ lastYear: { 'pre-monsoon': 'unknown', monsoon: 'aman', winter: 'lentil' } }),
      ),
    ).toBe(true);
  });
  it('rejects malformed plots', () => {
    const bad: unknown[] = [
      null,
      plot({ id: '' }),
      plot({ name: '  ' }),
      plot({ areaHa: 0 }),
      plot({ areaHa: Number.NaN }),
      plot({ startDate: '2025-13-01' }),
      plot({ endDate: '2024-12-31' }),
      plot({ madeFrom: ['plot-a'] }),
      plot({ madeFrom: ['x', 'x'] }),
      { ...plot(), lastYear: { monsoon: 'aman', winter: 'boro' } },
      {
        ...plot(),
        lastYear: { 'pre-monsoon': 'fallow', monsoon: 'aman', winter: 'boro', extra: 'mung' },
      },
      { ...plot(), lastYear: { 'pre-monsoon': 'fallow', monsoon: 'not-a-crop', winter: 'boro' } },
      { ...plot(), lastYear: ['fallow', 'aman', 'boro'] },
      plot({ chosenRotationId: '' }),
    ];
    for (const p of bad) expect(validPlot(p)).toBe(false);
  });
  it('counts only plots in use at the same time towards the field area', () => {
    const a = plot({ id: 'a', endDate: '2026-06-30' }),
      b = plot({ id: 'b', endDate: '2026-06-30' }),
      merged = plot({ id: 'c', areaHa: 1.2, startDate: '2026-07-01', madeFrom: ['a', 'b'] });
    expect(peakPlotArea([a, b, merged], 'land-1')).toBeCloseTo(1.2);
    expect(validPlotLinks([land()], [a, b, merged])).toBe(true);
    const overlapping = plot({
      id: 'c',
      areaHa: 1.2,
      startDate: '2026-06-30',
      madeFrom: ['a', 'b'],
    });
    expect(validPlotLinks([land()], [a, b, overlapping])).toBe(false);
  });
  it('requires an existing field and parents on the same field', () => {
    expect(validPlotLinks([land()], [plot({ fieldId: 'missing' })])).toBe(false);
    expect(validPlotLinks([land()], [plot({ madeFrom: ['ghost'] })])).toBe(false);
    expect(
      validPlotLinks(
        [land(), land('land-2')],
        [plot({ id: 'other', fieldId: 'land-2' }), plot({ madeFrom: ['other'] })],
      ),
    ).toBe(false);
  });
  it('recovers readable plots and unlinks farms whose plot was dropped', () => {
    const fields = [land()];
    const raw = [
      plot({ id: 'keep' }),
      plot({ id: 'keep' }),
      { broken: true },
      plot({ id: 'elsewhere', fieldId: 'missing' }),
      plot({ id: 'orphan', madeFrom: ['elsewhere'] }),
    ];
    const farms = [
      trackingFarm({ id: 'f1', fieldId: 'land-1', plotId: 'keep' }),
      trackingFarm({ id: 'f2', fieldId: 'land-1', plotId: 'orphan' }),
      trackingFarm({ id: 'f3', fieldId: 'land-1' }),
    ];
    const out = recoverPlots(raw, fields, farms);
    expect(out.plots.map((p) => p.id)).toEqual(['keep']);
    expect(out.farms.map((f) => f.plotId)).toEqual(['keep', undefined, undefined]);
    expect('plotId' in out.farms[1]).toBe(false);
    const tooBig = recoverPlots(
      [plot({ id: 'x' }), plot({ id: 'y' }), plot({ id: 'z' })],
      fields,
      [],
    );
    expect(tooBig.plots).toEqual([]);
    expect(recoverPlots(undefined, fields, farms).plots).toEqual([]);
  });
  it('accepts last year only as one valid answer for each of the three seasons', () => {
    expect(validLastYear({ 'pre-monsoon': 'fallow', monsoon: 'aman', winter: 'unknown' })).toBe(
      true,
    );
    expect(validLastYear({ monsoon: 'aman', winter: 'boro' })).toBe(false);
    expect(validLastYear({ 'pre-monsoon': 'x', monsoon: 'aman', winter: 'boro' })).toBe(false);
    const field = land();
    expect(validRegisteredField(field)).toBe(true);
    expect(
      validRegisteredField({ ...field, profile: { ...field.profile, lastYear: plot().lastYear } }),
    ).toBe(true);
    expect(
      validRegisteredField({
        ...field,
        profile: { ...field.profile, lastYear: { monsoon: 'aman' } },
      }),
    ).toBe(false);
  });
});
