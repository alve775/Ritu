import { validDate } from './evidence-planner';

/** Farmer-reported laboratory/field evidence, never a satellite measurement. */
export interface SoilEvidence {
  ph: number;
  method: 'water' | 'cacl2' | 'other';
  depthCm: number;
  sampledOn: string;
  source: string;
}
export function validSoilEvidence(value: unknown): value is SoilEvidence {
  if (!value || typeof value !== 'object') return false;
  const s = value as SoilEvidence;
  return (
    Number.isFinite(s.ph) &&
    s.ph >= 0 &&
    s.ph <= 14 &&
    ['water', 'cacl2', 'other'].includes(s.method) &&
    Number.isFinite(s.depthCm) &&
    s.depthCm > 0 &&
    s.depthCm <= 1000 &&
    validDate(s.sampledOn) &&
    typeof s.source === 'string' &&
    s.source.trim().length > 0 &&
    s.source.length <= 1000
  );
}
