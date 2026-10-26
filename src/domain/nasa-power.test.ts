import { describe, expect, it } from 'vitest';
import raw from '../../tests/fixtures/power-rajshahi-2025.json';
import snapshot from '../data/nasa/rajshahi-2025.json';
import { parsePower, powerParameters, powerUrl, validPowerClimate } from './nasa-power';
import {
  baselineClimate,
  climateFor,
  defaultDemo,
  demoEnvironment,
} from '../data/demo-environment';
import { defaultFarm } from '../data/preview';
import { farmFingerprint } from './demo-planner';

const parse = (data: unknown = raw) =>
  parsePower(data, 24.37, 88.6, 2025, snapshot.retrievedAt, snapshot.requestUrl);
describe('authentic NASA POWER records', () => {
  it('reproduces the pinned snapshot from the original NASA daily response, without rounding the stored values', () => {
    expect(parse()).toEqual(snapshot);
    expect(snapshot.months.reduce((sum, m) => sum + m.days, 0)).toBe(365);
    expect(snapshot.months.reduce((sum, m) => sum + m.rain, 0)).toBeCloseTo(1826.92, 8);
    expect(snapshot.months[0].temperature).toBeCloseTo(17.190645161290327, 10);
    expect(snapshot.months[2].rain).toBe(6.05);
    expect(validPowerClimate(snapshot)).toBe(true);
  });
  it.each([undefined, null, -999, NaN, Infinity])(
    'rejects missing or invalid daily rain %s instead of turning it into zero',
    (value) => {
      const data = structuredClone(raw);
      (data.properties.parameter.PRECTOTCORR as Record<string, unknown>)['20250301'] = value;
      expect(() => parse(data)).toThrow(/Incomplete NASA record/);
    },
  );
  it('accepts zero rainfall and rejects invalid wetness, units, dates, locations and temperature order', () => {
    expect(() => parse()).not.toThrow();
    const invalid = [
      (d: typeof raw) => {
        d.parameters.PRECTOTCORR.units = 'in/day';
      },
      (d: typeof raw) => {
        d.header.start = '20240101';
      },
      (d: typeof raw) => {
        d.geometry.coordinates[0] = 90;
      },
      (d: typeof raw) => {
        d.properties.parameter.GWETTOP['20250101'] = 1.2;
      },
      (d: typeof raw) => {
        d.properties.parameter.T2M_MIN['20250101'] = 99;
      },
    ];
    for (const mutate of invalid) {
      const data = structuredClone(raw);
      mutate(data);
      expect(() => parse(data)).toThrow();
    }
  });
  it('accounts for leap-day coverage', () => {
    const data = structuredClone(raw);
    data.header.start = '20240101';
    data.header.end = '20241231';
    for (const key of powerParameters) {
      const values = data.properties.parameter[key] as Record<string, number>;
      const shifted = Object.fromEntries(
        Object.entries(values).map(([date, value]) => [date.replace(/^2025/, '2024'), value]),
      );
      shifted['20240229'] = shifted['20240228'];
      (data.properties.parameter as Record<string, Record<string, number>>)[key] = shifted;
    }
    const climate = parsePower(data, 24.37, 88.6, 2024, snapshot.retrievedAt);
    expect(climate.months[1].days).toBe(29);
    expect(climate.months.reduce((n, m) => n + m.days, 0)).toBe(366);
  });
  it('keeps historical data intact under explicit what-if changes and never invents a second location', () => {
    const original = demoEnvironment(defaultDemo);
    expect(original[0].rain).toBe(snapshot.months[2].rain);
    expect(original[10].rain).toBe(snapshot.months[0].rain);
    expect(demoEnvironment({ ...defaultDemo, weather: 'dry' })[0].rain).toBeCloseTo(
      original[0].rain * 0.45,
    );
    expect(demoEnvironment({ ...defaultDemo, weather: 'hot' })[0].temperature).toBe(
      original[0].temperature + 5,
    );
    expect(demoEnvironment({ ...defaultDemo, weather: 'dry' })[0].wetness).toBe(
      original[0].wetness,
    );
    expect(demoEnvironment({ ...defaultDemo, location: 'other' })).toEqual(original);
    expect(climateFor(defaultDemo)).toEqual(baselineClimate);
  });
  it('changes the plan provenance when the environmental record changes', () => {
    expect(farmFingerprint(defaultFarm, defaultDemo, 'water')).not.toBe(
      farmFingerprint(
        defaultFarm,
        { ...defaultDemo, climate: { ...baselineClimate, id: 'a different validated retrieval' } },
        'water',
      ),
    );
  });
  it('rejects tampered saved climate and invalid outgoing queries', () => {
    expect(validPowerClimate({ ...snapshot, requestUrl: 'https://example.com/fake' })).toBe(false);
    expect(validPowerClimate({ ...snapshot, months: snapshot.months.slice(1) })).toBe(false);
    expect(
      validPowerClimate({
        ...snapshot,
        months: snapshot.months.map((m) => ({ ...m, wetness: NaN })),
      }),
    ).toBe(false);
    for (const args of [
      [NaN, 88.6, 2025],
      [91, 88.6, 2025],
      [24, -181, 2025],
      [24, 88, 1980],
      [24, 88, 2025.5],
      [24, 88, new Date().getUTCFullYear()],
    ])
      expect(() => powerUrl(...(args as [number, number, number]))).toThrow();
    expect(new URL(powerUrl(24.37, 88.6, 2025)).hostname).toBe('power.larc.nasa.gov');
  });
});
