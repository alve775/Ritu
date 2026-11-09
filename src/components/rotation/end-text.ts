import type { CancelReason, CropEnd, LossReason } from '../../domain/rotation';
import type { NoteTag } from '../../domain/field-log';
import type { RotationText, Translate } from './rotation-text';

export const cancelReasonText = (r: CancelReason, t: Translate) =>
  ({
    'no-seed': t('No seed', 'বীজ নেই'),
    'no-money': t('No money', 'টাকা নেই'),
    'field-not-ready': t('Field not ready', 'জমি তৈরি নয়'),
    other: t('Other reason', 'অন্য কারণ'),
  })[r];
export const lossReasonText = (r: LossReason, t: Translate) =>
  ({
    flood: t('Flood', 'বন্যা'),
    drought: t('Drought', 'খরা'),
    pests: t('Pests', 'পোকা'),
    disease: t('Disease', 'রোগ'),
    cold: t('Cold or fog', 'শীত বা কুয়াশা'),
    other: t('Other', 'অন্য কারণ'),
  })[r];
/** The note tag for a loss, so the note saved with it is found under the right topic. */
export const lossTag = (r: LossReason): NoteTag | undefined =>
  ({
    flood: 'weather',
    drought: 'water',
    pests: 'pest',
    disease: 'disease',
    cold: 'weather',
    other: undefined,
  })[r] as NoteTag | undefined;

/** Short label and one line for a crop that ended without a harvest. */
export function endLabel(end: CropEnd, tx: RotationText, t: Translate) {
  if (end.kind === 'lost')
    return {
      when: t('Lost', 'নষ্ট'),
      line: t(
        `Lost ${tx.date(end.date)} · ${lossReasonText(end.reason, t)}`,
        `নষ্ট ${tx.date(end.date)} · ${lossReasonText(end.reason, t)}`,
      ),
    };
  if (end.kind === 'closed')
    return {
      when: t('Closed', 'বন্ধ'),
      line: t('No harvest day entered', 'কাটার দিন লেখা হয়নি'),
    };
  return {
    when: t('Cancelled', 'বাতিল'),
    line: end.auto
      ? t('Not sown in time', 'সময়মতো বোনা হয়নি')
      : t(
          `Cancelled ${tx.date(end.date)} · ${cancelReasonText(end.reason, t)}`,
          `বাতিল ${tx.date(end.date)} · ${cancelReasonText(end.reason, t)}`,
        ),
  };
}
