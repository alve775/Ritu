import { plusDays } from './dates';
import type { ScheduledCrop } from './schedule';

/** Why a farmer cancels a crop before sowing it. */
export const cancelReasons = ['no-seed', 'no-money', 'field-not-ready', 'other'] as const;
export type CancelReason = (typeof cancelReasons)[number];
/** What destroyed a sown crop. */
export const lossReasons = ['flood', 'drought', 'pests', 'disease', 'cold', 'other'] as const;
export type LossReason = (typeof lossReasons)[number];

/** Days after the best sowing time (or the expected harvest) that the crop is still allowed. */
export const lateDays = 45;
/** Days of warning before the last sowing day. */
export const lastChanceDays = 7;
/** Days after the expected harvest before the card says the harvest is late. */
export const harvestGraceDays = 7;
/** Earliest harvest: most of the crop's season after sowing. */
export const harvestLead = (days: number) => Math.round(days * 0.7);
/** Earliest early harvest (cut green, for fodder): two weeks after sowing. */
export const earlyHarvestDays = 14;

/**
 * Last sowing day of crop `i`: the earlier of `lateDays` after its best sowing time, or the last
 * day that still leaves its whole season before the next crop's best sowing time ends.
 */
export function lastSowDay(items: ScheduledCrop[], i: number) {
  const { windowEnd, crop } = items[i],
    next = items[i + 1];
  const late = plusDays(windowEnd, lateDays);
  if (!next) return late;
  const fit = plusDays(next.windowEnd, -crop.days);
  return fit < late ? fit : late;
}

/**
 * Last harvest day of crop `i` sown on `sow`: the earlier of `lateDays` after the expected harvest,
 * or the next crop's sowing (recorded `nextSow`, else its last sowing day).
 */
export function lastHarvestDay(items: ScheduledCrop[], i: number, sow: string, nextSow?: string) {
  const late = plusDays(sow, items[i].crop.days + lateDays);
  const next = nextSow || (items[i + 1] ? lastSowDay(items, i + 1) : '');
  return next && next < late ? next : late;
}

/** What is recorded for a crop of the plan. */
export interface CropRecord {
  plantedDate: string;
  harvestedDate: string;
  cancelled?: { date: string; reason: CancelReason };
  lost?: { date: string; reason: LossReason };
}
/** How a crop ended without a harvest. `auto` ends follow from the dates; the others were recorded. */
export type CropEnd =
  | { kind: 'cancelled'; date: string; auto: true }
  | { kind: 'cancelled'; date: string; auto: false; reason: CancelReason }
  | { kind: 'lost'; date: string; auto: false; reason: LossReason }
  | { kind: 'closed'; date: string; auto: true };

/**
 * A crop ends without a harvest when it is lost, cancelled by the farmer, not sown by its last
 * sowing day (cancelled), or sown but with no harvest by its last harvest day (closed).
 */
export function cropEnd(
  items: ScheduledCrop[],
  i: number,
  rec: CropRecord | undefined,
  today: string,
  nextSow?: string,
): CropEnd | null {
  if (rec?.harvestedDate) return null;
  if (rec?.plantedDate) {
    if (rec.lost)
      return { kind: 'lost', date: rec.lost.date, auto: false, reason: rec.lost.reason };
    const last = lastHarvestDay(items, i, rec.plantedDate, nextSow);
    return today > last ? { kind: 'closed', date: plusDays(last, 1), auto: true } : null;
  }
  if (rec?.cancelled)
    return {
      kind: 'cancelled',
      date: rec.cancelled.date,
      auto: false,
      reason: rec.cancelled.reason,
    };
  const last = lastSowDay(items, i);
  return today > last ? { kind: 'cancelled', date: plusDays(last, 1), auto: true } : null;
}
