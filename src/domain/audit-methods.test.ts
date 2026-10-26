import { describe, it, expect } from 'vitest';
import { areaToHectares, areaFromHectares } from './area-units';
import { planningIssues } from './planning-issues';
import { blankFarm, emptyEvidenceState, validEvidenceState } from '../lib/evidence-store';
import { evidencePlans } from './evidence-planner';
import { cropFieldChecks } from '../data/crop-practices';
describe('measured area conversion', () => {
  it('uses exact international-foot arithmetic for the stated decimal convention', () => {
    expect(areaToHectares(100, 'decimal')).toBeCloseTo(0.40468564224, 12);
    expect(areaToHectares(10000, 'square-metres')).toBe(1);
    expect(areaFromHectares(1, 'square-metres')).toBe(10000);
    expect(areaFromHectares(areaToHectares(12.5, 'decimal'), 'decimal')).toBe(12.5);
  });
});
it('preserves invalid draft edits rather than resetting the whole stored farm', () => {
  expect(
    validEvidenceState({
      ...emptyEvidenceState,
      farm: { ...blankFarm, area: -1 },
      from: '2100-01-01',
    }),
  ).toBe(true);
  expect(evidencePlans('2100-01-01', ['aman'], { ...blankFarm, area: -1 }, 'water')).toEqual([]);
});
describe('transparent planning limitations', () => {
  const farm = {
    ...blankFarm,
    area: 1.2,
    drainage: 'good' as const,
    irrigation: 'limited' as const,
  };
  it('names the missing seasons instead of giving only a disabled button', () => {
    const issues = planningIssues('2026-10-26', ['aman'], farm, []);
    expect(issues.map((i) => i.en).join(' ')).toContain('Winter 2026');
    expect(issues.map((i) => i.en).join(' ')).toContain('Pre-monsoon 2027');
  });
  it('identifies the actual Boro–mung overlap with source dates', () => {
    expect(
      planningIssues('2026-10-26', ['boro', 'mung', 'aman'], farm, []).some((i) =>
        i.en.includes('Boro rice (2026-12-03–2027-05-06) overlaps Mung bean'),
      ),
    ).toBe(true);
  });
  it('blocks Boro on rainfed-only fields with an identified source, and does not invent an irrigation dose', () => {
    const rainfed = { ...farm, irrigation: 'rainfed' as const };
    expect(cropFieldChecks('boro', rainfed).blocked).toBe(true);
    expect(cropFieldChecks('boro', rainfed).source).toContain('fao.org');
    expect(
      evidencePlans('2026-10-26', ['boro', 'aman'], rainfed, 'water', ['pre-monsoon']),
    ).toEqual([]);
    expect(cropFieldChecks('boro', farm).blocked).toBe(false);
  });
  it('retains household requirements and distinguishes every-season-unplanted', () => {
    expect(
      planningIssues('2026-10-26', ['aman'], { ...farm, required: ['potato'] }, []).some((i) =>
        i.en.includes('household requires potato'),
      ),
    ).toBe(true);
    expect(
      planningIssues('2026-10-26', [], farm, ['winter', 'pre-monsoon', 'monsoon']).some((i) =>
        i.en.includes('All seasons are unplanted'),
      ),
    ).toBe(true);
  });
});
