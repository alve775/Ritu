'use client';
import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Dialog } from './dialog';
import { usePlanner } from './planner-provider';

export function ResetDataControl({ compact = false }: { compact?: boolean }) {
  const { t, reset } = usePlanner();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={compact ? 'text-button' : 'button secondary'}
        data-full-reset
        onClick={() => setOpen(true)}
      >
        <RotateCcw size={compact ? 12 : 18} aria-hidden="true" />
        {compact ? t('Reset demo', 'নমুনা রিসেট') : t('Reset all data', 'সব তথ্য রিসেট করুন')}
      </button>
      {open && (
        <Dialog
          title={t('Reset all saved data?', 'সব তথ্য রিসেট করবেন?')}
          onClose={() => setOpen(false)}
        >
          <p>
            {t(
              'All farm fields, including name, area, soil, water and location, will return to the demo defaults. Crop choices, saved calendar, progress and notes on this device will be cleared. Language and reading/sound settings will stay.',
              'খামারের সব তথ্য নমুনার মূল মানে ফিরবে। এই ডিভাইসের বাছা ফসল, ক্যালেন্ডার, অগ্রগতি ও নোট মুছে যাবে। ভাষা, পড়া ও শব্দের পছন্দ থাকবে।',
            )}
          </p>
          <div className="button-row previous-crop-actions">
            <button className="button secondary" onClick={() => setOpen(false)}>
              {t('Keep my data', 'আমার তথ্য রাখুন')}
            </button>
            <button
              className="button primary"
              onClick={() => {
                reset();
                setOpen(false);
                requestAnimationFrame(() => {
                  document.querySelector<HTMLButtonElement>('[data-full-reset]')?.focus();
                });
              }}
            >
              {t('Reset all data', 'সব তথ্য রিসেট করুন')}
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
