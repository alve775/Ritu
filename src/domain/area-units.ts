/** Decimal convention: Bangladesh Ministry of Land 435.6 ft²; international-foot conversion from NIST. */
export type AreaUnit = 'hectares' | 'square-metres' | 'decimal';
export const hectaresPerUnit: Record<AreaUnit, number> = {
  hectares: 1,
  'square-metres': 0.0001,
  decimal: 0.0040468564224,
};
export const areaToHectares = (area: number, unit: AreaUnit) => area * hectaresPerUnit[unit];
export const areaFromHectares = (area: number, unit: AreaUnit) =>
  Number((area / hectaresPerUnit[unit]).toPrecision(12));
