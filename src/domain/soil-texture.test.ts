import { describe, expect, it } from 'vitest';
import { appSoil, usdaTexture } from './soil-texture';

describe('USDA soil texture triangle', () => {
  it('classifies textbook sand / silt / clay percentages', () => {
    const cases: [number, number, number, string][] = [
      [92, 5, 3, 'sand'],
      [85, 10, 5, 'loamy sand'],
      [65, 20, 15, 'sandy loam'],
      [40, 40, 20, 'loam'],
      [10, 70, 20, 'silt loam'],
      [5, 88, 7, 'silt'],
      [55, 15, 30, 'sandy clay loam'],
      [30, 35, 35, 'clay loam'],
      [10, 55, 35, 'silty clay loam'],
      [50, 5, 45, 'sandy clay'],
      [5, 50, 45, 'silty clay'],
      [20, 30, 50, 'clay'],
    ];
    for (const [sand, silt, clay, expected] of cases)
      expect(usdaTexture(sand, silt, clay), `${sand}/${silt}/${clay}`).toBe(expected);
  });
  it('works from g/kg values that do not add up to exactly 1000', () => {
    expect(usdaTexture(410, 390, 205)).toBe('loam');
  });
  it('maps the twelve classes onto the app choices', () => {
    expect(appSoil('loamy sand')).toBe('sandy');
    expect(appSoil('silt loam')).toBe('loam');
    expect(appSoil('clay loam')).toBe('loam');
    expect(appSoil('silty clay')).toBe('clay');
  });
});
