import { mungGuide, mungBroadcastRates } from './crop-practices';
/** CIMMYT/CSISA July 2016, Bangladesh, Table 1 p.6 and broadcast rates p.12.
 * These historical references are not seed certification or field calibration.
 */
export const mungCultivars = mungBroadcastRates.map((rate) => ({
  ...rate,
  durationMin: rate.id === 'bari-mung-5' || rate.id === 'bari-mung-6' ? 55 : 60,
  durationMax:
    rate.id === 'bari-mung-2'
      ? 65
      : rate.id === 'bari-mung-5' || rate.id === 'bari-mung-6'
        ? 60
        : 62,
  source: mungGuide.url,
  country: 'BD' as const,
  year: 2016,
}));
export interface CultivarReference {
  registry: 'csisa-bd-mung-2016';
  varietyId: string;
  countryConfirmed: 'BD';
  selectedAt: string;
}
export function validCultivarReference(value: unknown): value is CultivarReference {
  if (!value || typeof value !== 'object') return false;
  const c = value as CultivarReference;
  return (
    c.registry === 'csisa-bd-mung-2016' &&
    c.countryConfirmed === 'BD' &&
    mungCultivars.some((v) => v.id === c.varietyId) &&
    typeof c.selectedAt === 'string' &&
    Number.isFinite(Date.parse(c.selectedAt))
  );
}
