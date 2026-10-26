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
        {compact ? t('Reset', 'রিসেট') : t('Reset all data', 'সব তথ্য রিসেট করুন')}
      </button>
      {open && (
        <Dialog
          title={t('Reset all saved data?', 'সব তথ্য রিসেট করবেন?')}
          onClose={() => setOpen(false)}
        >
          <p>
            {t(
              'This clears your farm fields, location, crop choices, saved calendar, observations and notes, including previous-version records on this device. The form will be empty. Language and reading/sound settings stay. Export your records first if you need them.',
              'এতে এই ডিভাইসের জমির তথ্য, স্থান, ফসল, ক্যালেন্ডার, পর্যবেক্ষণ, নোট ও আগের সংস্করণের হিসাব মুছবে। ফরম ফাঁকা হবে। ভাষা, পড়া ও শব্দের পছন্দ থাকবে। দরকার হলে আগে হিসাব ডাউনলোড করুন।',
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
