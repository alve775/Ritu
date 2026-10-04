import { coveredMonths } from './evaluate';
import type { CropPeriod, Rotation } from './types';

export type WindowPhase = 'planting' | 'in-window' | 'harvest' | 'plant-and-harvest' | 'rest';
export interface MonthActivity {
  period: CropPeriod;
  phase: WindowPhase;
  progress: number;
}
export function activitiesForMonth(rotation: Rotation, month: number): MonthActivity[] {
  return rotation.periods
    .filter((period) => coveredMonths(period).includes(month))
    .map((period) => {
      const elapsed = (month - period.start + 12) % 12;
      return {
        period,
        progress: period.duration === 1 ? 1 : elapsed / (period.duration - 1),
        phase:
          period.crop === 'fallow'
            ? 'rest'
            : period.duration === 1
              ? 'plant-and-harvest'
              : elapsed === 0
                ? 'planting'
                : elapsed === period.duration - 1
                  ? 'harvest'
                  : 'in-window',
      };
    });
}
