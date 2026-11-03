import { describe, it, expect } from 'vitest';
import contexts from '../../tests/fixtures/world-growing-contexts.json';
import {
  suggestSeason,
  requirements,
  screeningGap,
  sourceFieldCompatibility,
} from './plant-screen';
import { searchPlantCatalogue } from './plant-search';
import { commonPlantNames } from './plant-names';
import { globalCrop, type SeasonContext } from './global-season';
import { blankFarm } from '../lib/evidence-store';
import { fieldConfirmationKey } from './field-confirmation';
const context = contexts[0].context as SeasonContext;
const field = {
  ...blankFarm,
  area: 1,
  soil: 'unknown' as const,
  drainage: 'unknown' as const,
  irrigation: 'reliable' as const,
};
const from = '2026-11-03';
describe('recommendation evidence and first-section input contract', () => {
  it('does not lose a confirmed field when weather resolves its timezone or its place label changes', () => {
    const key = fieldConfirmationKey(field, context.site, from);
    expect(
      fieldConfirmationKey(
        field,
        { ...context.site, timezone: 'Asia/Dhaka', name: 'GPS-selected field' },
        from,
      ),
    ).toBe(key);
    expect(fieldConfirmationKey(field, { ...context.site, latitude: 0 }, from)).not.toBe(key);
    expect(fieldConfirmationKey({ ...field, drainage: 'poor' }, context.site, from)).not.toBe(key);
    expect(fieldConfirmationKey(field, context.site, '2027-06-01')).not.toBe(key);
  });
  it('checks source drainage in both directions instead of treating drained and saturated land alike', () => {
    const rice = requirements.crops.find((c) => c.id === 'rice')!;
    expect(rice.drainage).toMatch(/^poorly/);
    expect(sourceFieldCompatibility(rice, { ...field, drainage: 'good' }).drainageMismatch).toBe(
      true,
    );
    expect(sourceFieldCompatibility(rice, { ...field, drainage: 'poor' }).drainageMismatch).toBe(
      false,
    );
    expect(
      suggestSeason(context, { ...field, drainage: 'good' }, from).some((s) => s.crop === 'rice'),
    ).toBe(false);
    const selected = suggestSeason(context, { ...field, drainage: 'poor' }, from).find(
      (s) => s.crop === 'rice',
    );
    expect(selected?.checks?.find((c) => c.factor === 'drainage')?.state).toBe('supported');
  });
  it('does not turn missing texture/drainage metadata into a supported field match', () => {
    const maize = requirements.crops.find((c) => c.id === 'maize')!;
    expect(maize.drainage).toBe('');
    const selected = suggestSeason(
      context,
      { ...field, soil: 'loam', drainage: 'good' },
      from,
    ).find((s) => s.crop === 'maize')!;
    expect(selected.checks?.find((c) => c.factor === 'drainage')?.state).toBe('unknown');
  });
  it('retains source durations but permits a shorter compatible variety in a warm window', () => {
    const us = contexts.find((c) => c.name === 'Washington')!.context as SeasonContext;
    const selected = suggestSeason({ ...us, calendars: [] }, field, '2027-06-01').find(
      (s) => s.crop === 'maize',
    )!;
    expect(selected).toBeTruthy();
    expect(selected.sourceDurationMax).toBe(365);
    expect(selected.durationMin).toBe(65);
    expect(selected.durationMax).toBeGreaterThanOrEqual(65);
    expect(selected.durationMax).toBeLessThan(365);
    expect(selected.temperatureWindowDays).toBe(selected.durationMax);
    expect(selected.cautions.join(' ')).toContain(
      'Confirm a local variety with a compatible duration',
    );
  });
  it('does not certify water adequacy or fabricate drought rankings from five qualitative labels', () => {
    let first: string[] | undefined;
    for (const irrigation of ['reliable', 'limited', 'rainfed', 'severe', 'unknown'] as const) {
      const result = suggestSeason(context, { ...field, irrigation }, from);
      if (first) expect(result.map((s) => s.crop)).toEqual(first);
      else first = result.map((s) => s.crop);
      for (const s of result) {
        const check = s.checks!.find((c) => c.factor === 'water')!;
        expect(check.state).toBe('unknown');
        expect(check.detail).toContain(irrigation);
      }
    }
    // Annual wet-season rain must not exclude a winter-crop reference.
    expect(
      suggestSeason(context, { ...field, irrigation: 'rainfed' }, from).some(
        (s) => s.crop === 'wheat',
      ),
    ).toBe(true);
  });
  it('keeps field size and name as scale/record data rather than invented crop-suitability multipliers', () => {
    const baseline = suggestSeason(context, field, from).map((s) => s.crop);
    for (const area of [0.000001, 0.40468564224, 30, 1000])
      expect(
        suggestSeason(context, { ...field, name: 'Assumed QA field', area }, from).map(
          (s) => s.crop,
        ),
      ).toEqual(baseline);
  });
  it('resolves the reported plant 10308 from a real supplemental FAO common-name source', () => {
    const plant = globalCrop('ecocrop-10308')!;
    expect(plant.scientific).toBe('Telfairia pedata');
    expect(plant.name.en).toBe('Telfairia pedata'); // Original CSV remains unchanged.
    expect(commonPlantNames(plant)).toEqual({ en: 'Oyster nut', bn: null });
    const result = searchPlantCatalogue(context, field, from, {
      text: 'oyster nut',
      mode: 'catalogue',
    });
    expect(result.items[0].plant?.id).toBe(plant.id);
  });
  it('does not offer unidentified source-label placeholders as selectable matches', () => {
    const missing = requirements.crops.find(
      (c) =>
        c.id !== 'ecocrop-10308' &&
        c.name.en === c.scientific &&
        c.planKind !== 'unknown' &&
        c.GMIN &&
        c.GMAX &&
        c.GMAX <= 365 &&
        c.TMIN !== null &&
        c.TMAX !== null,
    )!;
    expect(screeningGap(missing)).toContain('No sourced common name');
    expect(
      suggestSeason(context, field, from).some((s) => !commonPlantNames(globalCrop(s.crop)!).en),
    ).toBe(false);
    const record = searchPlantCatalogue(context, field, from, {
      text: missing.scientific,
      mode: 'catalogue',
      category: 'all',
    }).items.find((s) => s.plant?.id === missing.id)!;
    expect(record.suggestion).toBeNull();
    expect(record.unavailable).toContain('reference record');
  });
  it('retains historical winter-crop records without claiming that a growth-temperature mean validates dormancy', () => {
    // Deliberately counterfactual cold weather: this is a logic test, not NASA data.
    const cold = structuredClone(context);
    cold.normal!.months.forEach((m) => (m.temperature = -10));
    const calendar = context.calendars.find((c) => c.crop === 'wheat')!;
    cold.calendars = [calendar];
    const selected = suggestSeason(cold, field, from).find((s) => s.crop === 'wheat')!;
    expect(selected.basis).toBe('regional-calendar');
    expect(selected.checks?.find((c) => c.factor === 'temperature')?.state).toBe('unknown');
    expect(selected.cautions.join(' ')).toContain(
      'Dormancy, local variety and current field suitability are unverified',
    );
  });
  it('rejects malformed climate, mismatched location, forged provenance and unsupported field values', () => {
    const cases: SeasonContext[] = [];
    const change = (run: (c: SeasonContext) => void) => {
      const c = structuredClone(context);
      run(c);
      cases.push(c);
    };
    change((c) => {
      c.normal!.annualRain = NaN;
    });
    change((c) => {
      c.normal!.annualRain += 1;
    });
    change((c) => {
      c.normal!.months[0].temperature = NaN;
    });
    change((c) => {
      c.normal!.months.reverse();
    });
    change((c) => {
      c.normal!.months[0].rain = -1;
    });
    change((c) => {
      c.site.latitude = 0;
    });
    change((c) => {
      c.normal!.sourceUrl =
        'https://power.larc.nasa.gov.evil.invalid/api/temporal/climatology/point';
    });
    for (const c of cases) expect(suggestSeason(c, field, from)).toEqual([]);
    for (const patch of [
      { soil: 'made-up' },
      { drainage: 'invented' },
      { irrigation: 'guaranteed' },
      { area: Infinity },
    ])
      expect(suggestSeason(context, { ...field, ...patch } as typeof field, from)).toEqual([]);
  });
});
