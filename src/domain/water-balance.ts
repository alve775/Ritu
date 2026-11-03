import { validDate } from './evidence-planner';

export const waterBalanceSource = 'https://www.fao.org/4/x0490e/x0490e0e.htm';
export const cropCoefficientSource = 'https://www.fao.org/4/x0490e/x0490e0b.htm';
export interface WaterDayInput {
  date: string;
  system: 'upland' | 'ponded';
  fieldCapacity: number;
  wiltingPoint: number;
  initialWater: number;
  rootDepth: number;
  depletionFraction: number;
  cropCoefficient: number;
  et0: number;
  rain: number;
  runoff: number;
  netIrrigation: number;
  capillaryRise: number;
  evidence: string;
  et0Source: string;
  coefficientSource: string;
  /** The mode prevents a forecast scenario becoming a measured-water record. */
  mode: 'scenario' | 'reported';
}
export interface WaterDayRecord extends WaterDayInput {
  id: string;
  savedAt: string;
}
export function validWaterDayInput(value: unknown): value is WaterDayInput {
  if (!value || typeof value !== 'object') return false;
  const d = value as WaterDayInput;
  return (
    validDate(d.date) &&
    ['upland', 'ponded'].includes(d.system) &&
    ['scenario', 'reported'].includes(d.mode) &&
    [
      d.fieldCapacity,
      d.wiltingPoint,
      d.initialWater,
      d.rootDepth,
      d.depletionFraction,
      d.cropCoefficient,
      d.et0,
      d.rain,
      d.runoff,
      d.netIrrigation,
      d.capillaryRise,
    ].every(Number.isFinite) &&
    d.wiltingPoint >= 0 &&
    d.fieldCapacity <= 1 &&
    d.fieldCapacity > d.wiltingPoint &&
    d.initialWater >= d.wiltingPoint &&
    d.initialWater <= d.fieldCapacity &&
    d.rootDepth > 0 &&
    d.rootDepth <= 10 &&
    d.depletionFraction > 0 &&
    d.depletionFraction < 1 &&
    d.cropCoefficient >= 0 &&
    d.cropCoefficient <= 3 &&
    d.et0 >= 0 &&
    d.et0 <= 50 &&
    [d.rain, d.runoff, d.netIrrigation, d.capillaryRise].every((v) => v >= 0 && v <= 2000) &&
    d.runoff <= d.rain &&
    [d.evidence, d.et0Source, d.coefficientSource].every(
      (s) => typeof s === 'string' && s.trim().length > 0 && s.length <= 2000,
    )
  );
}
export function validWaterDayRecord(value: unknown): value is WaterDayRecord {
  if (!validWaterDayInput(value) || !value || typeof value !== 'object') return false;
  const d = value as WaterDayRecord;
  return (
    d.system === 'upland' &&
    typeof d.id === 'string' &&
    d.id.length > 0 &&
    d.id.length <= 120 &&
    typeof d.savedAt === 'string' &&
    Number.isFinite(Date.parse(d.savedAt)) &&
    calculateWaterDay(d).status === 'calculated'
  );
}
export type WaterDayResult =
  | { status: 'invalid' | 'unsupported' | 'smaller-step-needed' }
  | {
      status: 'calculated';
      taw: number;
      raw: number;
      initialDepletion: number;
      ks: number;
      potentialEt: number;
      adjustedEt: number;
      drainage: number;
      finalDepletion: number;
      finalWater: number;
      storageDeficitM3PerHa: number;
      thresholdExceeded: boolean;
    };
/** FAO-56 equations 81–85, a single-Kc daily approximation.
 * Ks uses beginning-of-day water. Rain/irrigation are daily totals. This does
 * not resolve within-day timing, root growth, salinity or flooded-paddy storage.
 * Above-field-capacity surplus drains at day end. Never silently clamp an
 * impossible below-wilting balance or prescribe gross irrigation from deficit.
 */
export function calculateWaterDay(d: WaterDayInput): WaterDayResult {
  if (!validWaterDayInput(d)) return { status: 'invalid' };
  if (d.system !== 'upland') return { status: 'unsupported' };
  const taw = 1000 * (d.fieldCapacity - d.wiltingPoint) * d.rootDepth;
  const raw = d.depletionFraction * taw;
  const initialDepletion = 1000 * (d.fieldCapacity - d.initialWater) * d.rootDepth;
  const ks = initialDepletion <= raw ? 1 : Math.max(0, (taw - initialDepletion) / (taw - raw));
  const potentialEt = d.et0 * d.cropCoefficient;
  const adjustedEt = ks * potentialEt;
  const balance =
    initialDepletion - (d.rain - d.runoff) - d.netIrrigation - d.capillaryRise + adjustedEt;
  if (balance > taw + 1e-7) return { status: 'smaller-step-needed' };
  const drainage = Math.max(0, -balance),
    finalDepletion = Math.max(0, balance);
  return {
    status: 'calculated',
    taw,
    raw,
    initialDepletion,
    ks,
    potentialEt,
    adjustedEt,
    drainage,
    finalDepletion,
    finalWater: d.fieldCapacity - finalDepletion / (1000 * d.rootDepth),
    storageDeficitM3PerHa: finalDepletion * 10,
    thresholdExceeded: finalDepletion > raw,
  };
}
