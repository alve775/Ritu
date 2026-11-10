/**
 * Area unit conversions:
 * - Decimal/shotok: Bangladesh Ministry of Land 435.6 ft² (1/100 acre); international foot = 0.3048 m (NIST).
 * - Rajshahi standard bigha = 14,400 ft² (20 katha, ~33 decimals); katha = 720 ft².
 */
export type AreaUnit = 'bigha' | 'katha' | 'decimal' | 'acres' | 'hectares' | 'square-metres';

const sqFtHectares = (0.3048 * 0.3048) / 10_000;

export const areaUnits: readonly AreaUnit[] = [
  'bigha',
  'katha',
  'decimal',
  'acres',
  'hectares',
  'square-metres',
];

export const hectaresPerUnit: Record<AreaUnit, number> = {
  bigha: 14_400 * sqFtHectares,
  katha: 720 * sqFtHectares,
  decimal: 435.6 * sqFtHectares,
  acres: 43_560 * sqFtHectares,
  hectares: 1,
  'square-metres': 0.0001,
};

export function areaUnitOptionLabel(unit: AreaUnit, t: (en: string, bn: string) => string): string {
  switch (unit) {
    case 'bigha':
      return t('Bigha (33 decimal)', 'বিঘা (৩৩ শতক)');
    case 'katha':
      return t('Katha (720 sq ft)', 'কাঠা (৭২০ বর্গফুট)');
    case 'decimal':
      return t('Decimal / shotok', 'শতক');
    case 'acres':
      return t('Acres', 'একর');
    case 'hectares':
      return t('Hectares', 'হেক্টর');
    case 'square-metres':
      return t('Square metres', 'বর্গমিটার');
  }
}

export const areaToHectares = (area: number, unit: AreaUnit) => area * hectaresPerUnit[unit];
export const areaFromHectares = (area: number, unit: AreaUnit) =>
  Number((area / hectaresPerUnit[unit]).toPrecision(12));
