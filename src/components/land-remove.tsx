'use client';
import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { usePlanner } from './planner-provider';
import { Dialog } from './dialog';
import { seasonStore, useSeasonFarms } from '../lib/season-store';
import { fieldLogStore, useFieldLog } from '../lib/field-log-store';
import { deletePhoto } from '../lib/note-photos';
import { exportRecords } from '../lib/export-records';
import { localDigits } from '../domain/numerals';
import { localToday } from '../domain/global-season';
import { addDays } from '../domain/evidence-planner';
import type { RegisteredField } from '../domain/field-registry';

type Step = 'delete' | 'choose' | 'stop' | 'purge';

/**
 * "Remove land" on a land card. With nothing recorded the land is deleted after one question.
 * With crops, notes or irrigation recorded the farmer chooses: stop using it (records kept, usable
 * again) or delete everything after an export offer.
 */
export function RemoveLand({ field }: { field: RegisteredField }) {
  const { t, language } = usePlanner(),
    { state } = useSeasonFarms(),
    log = useFieldLog().state;
  const [step, setStep] = useState<Step | null>(null),
    [error, setError] = useState(''),
    // Nothing is deleted while the backup copy is still being made.
    [saving, setSaving] = useState(false);
  const backup = () => {
    setSaving(true);
    exportRecords()
      .catch(() => setError(t('The copy could not be made.', 'কপি করা যায়নি।')))
      .finally(() => setSaving(false));
  };
  const plots = (state.plots ?? []).filter((p) => p.fieldId === field.id),
    plotIds = new Set(plots.map((p) => p.id)),
    farms = state.farms.filter(
      (f) => f.fieldId === field.id || (!!f.plotId && plotIds.has(f.plotId)),
    );
  const sown = farms.filter((f) => f.plantedDate || f.harvestedDate).length,
    notes = log.notes.filter((n) => plotIds.has(n.plotId)).length,
    irrigations = log.irrigations.filter((r) => plotIds.has(r.plotId)).length,
    unstarted = farms.length - sown;
  const hasRecords = sown + notes + irrigations > 0;
  const n = (v: number) => localDigits(v, language);
  const name = field.name,
    plotList = plots.map((p) => p.name).join(', ');
  // Only what is there: "1 note", "2 crops sown, 3 irrigations".
  const counts = [
    sown > 0 && t(`${sown} crop${sown === 1 ? '' : 's'} sown`, `${n(sown)}টি ফসল বোনা`),
    notes > 0 && t(`${notes} note${notes === 1 ? '' : 's'}`, `${n(notes)}টি নোট`),
    irrigations > 0 &&
      t(`${irrigations} irrigation${irrigations === 1 ? '' : 's'}`, `${n(irrigations)}টি সেচ`),
  ]
    .filter(Boolean)
    .join(', ');
  const plotsLine =
    plots.length === 0
      ? t('It has no plots.', 'এতে কোনো প্লট নেই।')
      : plots.length === 1
        ? t(
            `Its plot (${plotList}) and its year plan are deleted.`,
            `এর প্লট (${plotList}) ও এর বছরের পরিকল্পনা মুছে যাবে।`,
          )
        : t(
            `Its ${plots.length} plots (${plotList}) and their year plans are deleted.`,
            `এর ${n(plots.length)}টি প্লট (${plotList}) ও তাদের বছরের পরিকল্পনা মুছে যাবে।`,
          );
  const close = () => {
    if (!saving) setStep(null);
  };
  const act = () => {
    try {
      if (step === 'stop')
        seasonStore.endField(field.id, addDays(localToday(field.site?.timezone), -1));
      else {
        const ids = seasonStore.removeField(field.id, step === 'purge');
        for (const note of fieldLogStore.removePlots(ids))
          if (note.photoId) deletePhoto(note.photoId).catch(() => undefined);
      }
      setError('');
      close();
    } catch (e) {
      close();
      setError(e instanceof Error ? e.message : t('This could not be saved.', 'এটি রাখা যায়নি।'));
    }
  };
  const title =
    step === 'choose'
      ? t(`Remove ${name}?`, `${name} সরাবেন?`)
      : step === 'stop'
        ? t(`Stop using ${name}?`, `${name} বন্ধ করবেন?`)
        : step === 'purge'
          ? t(`Delete ${name} and its records?`, `${name} ও এর হিসাব মুছবেন?`)
          : t(`Delete ${name}?`, `${name} মুছবেন?`);
  return (
    <>
      <button
        className="button secondary land-remove-button"
        type="button"
        aria-label={`${t('Remove land', 'জমি সরান')}: ${name}`}
        onClick={() => setStep(hasRecords ? 'choose' : 'delete')}
      >
        <Trash2 size={16} />
        {t('Remove land', 'জমি সরান')}
      </button>
      {error && (
        <p className="notice-amber" role="alert">
          {error}
        </p>
      )}
      {step && (
        <Dialog title={title} onClose={close}>
          <div className="plot-remove-dialog">
            {step === 'choose' && (
              <>
                <p>
                  {t(
                    `Crops, notes or irrigation are saved on this land: ${counts}.`,
                    `এই জমিতে ফসল, নোট বা সেচের হিসাব আছে: ${counts}।`,
                  )}
                </p>
                <div className="land-remove-choices">
                  <button
                    type="button"
                    className="land-remove-choice"
                    onClick={() => setStep('stop')}
                  >
                    <strong>{t('Stop using it', 'বন্ধ করুন')}</strong>
                    <span>
                      {t(
                        'Its records are kept. You can use the land again later.',
                        'হিসাব থেকে যাবে। পরে আবার জমিটি ব্যবহার করা যাবে।',
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    className="land-remove-choice danger"
                    onClick={() => setStep('purge')}
                  >
                    <strong>{t('Delete everything', 'সব মুছে ফেলুন')}</strong>
                    <span>
                      {t(
                        'The land, its plots and all its records are deleted.',
                        'জমি, এর প্লট ও সব হিসাব মুছে যাবে।',
                      )}
                    </span>
                  </button>
                </div>
                <div className="button-row">
                  <button className="button secondary" type="button" onClick={close}>
                    {t('Keep it', 'রেখে দিন')}
                  </button>
                </div>
              </>
            )}
            {step === 'stop' && (
              <>
                <ul>
                  <li>
                    {t(
                      'From today it and its plots leave the dashboard and the calendar.',
                      'আজ থেকে এটি ও এর প্লটগুলো ড্যাশবোর্ড ও ক্যালেন্ডারে আর থাকবে না।',
                    )}
                  </li>
                  <li>{t('Reminders from its notes stop.', 'এর নোটের রিমাইন্ডার বন্ধ হবে।')}</li>
                </ul>
                <p className="plot-remove-keep">
                  {t(
                    'Its crop records and notes are kept: they stay in "Export all records", and the land can be used again from "Lands no longer used" on the dashboard.',
                    'এর ফসলের হিসাব ও নোট থেকে যাবে: "সব হিসাব নামান"-এ পাবেন, আর ড্যাশবোর্ডের "আর ব্যবহার হচ্ছে না এমন জমি" থেকে জমিটি আবার ব্যবহার করা যাবে।',
                  )}
                </p>
              </>
            )}
            {(step === 'delete' || step === 'purge') && (
              <>
                <ul>
                  <li>{plotsLine}</li>
                  {step === 'purge' ? (
                    <li>
                      {t(`Its records are deleted: ${counts}.`, `এর হিসাব মুছে যাবে: ${counts}।`)}
                    </li>
                  ) : (
                    unstarted > 0 && (
                      <li>
                        {t(
                          `${unstarted} crop calendar${unstarted === 1 ? '' : 's'} not started yet ${unstarted === 1 ? 'is' : 'are'} deleted.`,
                          `শুরু না হওয়া ${n(unstarted)}টি ফসলের ক্যালেন্ডার মুছে যাবে।`,
                        )}
                      </li>
                    )
                  )}
                </ul>
                {step === 'purge' && (
                  <p className="plot-remove-keep">
                    {t(
                      'Want a copy first? The file includes the notes and their photos.',
                      'আগে একটি কপি রাখবেন? ফাইলে নোট ও তার ছবিও থাকবে।',
                    )}{' '}
                    <button
                      className="text-button"
                      type="button"
                      onClick={backup}
                      disabled={saving}
                    >
                      {saving
                        ? t('Making the copy…', 'কপি তৈরি হচ্ছে…')
                        : t('Export all records', 'সব হিসাব নামান')}
                    </button>
                  </p>
                )}
                <p className="plot-remove-warn">
                  {t('This cannot be undone.', 'এটি ফেরানো যাবে না।')}
                </p>
              </>
            )}
            {step !== 'choose' && (
              <div className="button-row">
                <button className="button danger" type="button" onClick={act} disabled={saving}>
                  {step === 'stop'
                    ? t('Stop using it', 'বন্ধ করুন')
                    : step === 'purge'
                      ? t('Delete everything', 'সব মুছে ফেলুন')
                      : t(`Delete ${name}`, `${name} মুছুন`)}
                </button>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => (step === 'delete' ? close() : setStep('choose'))}
                >
                  {step === 'delete' ? t('Keep it', 'রেখে দিন') : t('Back', 'পেছনে')}
                </button>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}
