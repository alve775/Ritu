'use client';
import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Plus } from 'lucide-react';
import { usePlanner } from './planner-provider';
import { seasonStore, useSeasonFarms } from '../lib/season-store';
import { blankFarm, evidenceStore } from '../lib/evidence-store';
import { fieldReady, peakFieldArea } from '../domain/field-registry';
import { localToday, type SeasonFarm } from '../domain/global-season';

export function prepareRegisteredField(id: string, editing: boolean) {
  const state = seasonStore.getSnapshot().state,
    field = state.fields?.find((f) => f.id === id);
  if (!field) return;
  const today = localToday(field.site?.timezone),
    used = peakFieldArea(state.farms, id, today);
  evidenceStore.update({
    farm: {
      ...field.profile,
      name: editing
        ? field.name
        : `${field.name} · Farm ${state.farms.filter((f) => f.fieldId === id).length + 1}`.slice(
            0,
            80,
          ),
      area: editing ? field.profile.area : Math.max(0, field.profile.area - used),
    },
    site: field.site,
    climate: undefined,
    from: '',
    district: '',
    preferred: [],
    unplanted: [],
    reviewed: null,
    selected: null,
  });
  seasonStore.selectField(id, editing);
  seasonStore.activate(null);
}

export function FieldRegistryDashboard({
  renderFarm,
}: {
  renderFarm: (farm: SeasonFarm) => ReactNode;
}) {
  const { t } = usePlanner(),
    { state } = useSeasonFarms(),
    router = useRouter();
  const fields = state.fields ?? [];
  const [count, setCount] = useState('1'),
    [message, setMessage] = useState('');
  return (
    <div className="field-registry">
      <form
        className="card field-count-form"
        onSubmit={(e) => {
          e.preventDefault();
          setMessage('');
          try {
            const n = Number(count);
            if (!Number.isInteger(n) || n < 1 || n > 200 - fields.length)
              throw Error(
                t(
                  'Enter a whole number from 1 to the remaining field limit.',
                  'অবশিষ্ট সীমার মধ্যে ১ বা বেশি পূর্ণ সংখ্যা দিন।',
                ),
              );
            const names = new Set(fields.map((f) => f.name));
            let serial = 1;
            seasonStore.addFields(
              Array.from({ length: n }, () => {
                let name = `${t('Field', 'জমি')} ${serial++}`;
                while (names.has(name)) name = `${t('Field', 'জমি')} ${serial++}`;
                names.add(name);
                return {
                  id: crypto.randomUUID(),
                  name,
                  profile: { ...blankFarm },
                };
              }),
            );
            setMessage(
              t(
                `${n} field${n === 1 ? '' : 's'} added. Set each location, then add farms inside it.`,
                `${n}টি জমি যোগ হয়েছে। প্রতিটির স্থান দিয়ে তার মধ্যে খামার যোগ করুন।`,
              ),
            );
          } catch (error) {
            setMessage(
              error instanceof Error ? error.message : t('Could not add fields.', 'জমি যোগ হয়নি।'),
            );
          }
        }}
      >
        <label>
          {fields.length
            ? t('More fields to add', 'আর কতটি জমি যোগ করবেন')
            : t('How many fields do you have?', 'আপনার কয়টি জমি আছে?')}
          <input
            type="number"
            min="1"
            max={Math.max(1, 200 - fields.length)}
            step="1"
            required
            value={count}
            onChange={(e) => setCount(e.target.value)}
          />
        </label>
        <button className="button primary" disabled={fields.length >= 200}>
          <Plus size={18} />
          {t('Add fields', 'জমি যোগ করুন')}
        </button>
        <p role="status">
          {message ||
            t(
              'Give each field its own location and area. Divide it into farms for different crops.',
              'প্রতি জমির আলাদা স্থান ও আয়তন দিন। বিভিন্ন ফসলের জন্য তার মধ্যে খামার ভাগ করুন।',
            )}
        </p>
      </form>
      {fields.map((field) => {
        const farms = state.farms.filter((f) => f.fieldId === field.id),
          today = localToday(field.site?.timezone),
          used = peakFieldArea(state.farms, field.id, today),
          ready = fieldReady(field);
        return (
          <section className="card registered-field" key={field.id} aria-label={field.name}>
            <header className="registered-field-heading">
              <div>
                <h2>{field.name}</h2>
                <p>
                  <MapPin size={16} />
                  {field.site?.name || t('Choose this field’s location', 'এই জমির স্থান বাছুন')}
                </p>
                {ready && (
                  <p>
                    {field.profile.area} ha · {t('Allocated', 'বরাদ্দ')} {Number(used.toFixed(6))}{' '}
                    ha · {t('Available', 'খালি')}{' '}
                    {Number(Math.max(0, field.profile.area - used).toFixed(6))} ha
                  </p>
                )}
              </div>
              <div className="button-row">
                <button
                  className="button secondary"
                  onClick={() => {
                    prepareRegisteredField(field.id, true);
                    router.push('/farm');
                  }}
                >
                  {ready ? t('Edit field', 'জমির তথ্য বদলান') : t('Set up field', 'জমির তথ্য দিন')}
                </button>
                {ready && (
                  <button
                    className="button primary"
                    aria-label={`${t('Add farm to', 'খামার যোগ করুন')}: ${field.name}`}
                    onClick={() => {
                      prepareRegisteredField(field.id, false);
                      router.push('/farm');
                    }}
                  >
                    <Plus size={17} />
                    {t('Add a farm', 'খামার যোগ করুন')}
                  </button>
                )}
                {!farms.length && (
                  <button className="text-button" onClick={() => seasonStore.removeField(field.id)}>
                    {t('Remove empty field', 'খালি জমি সরান')}
                  </button>
                )}
              </div>
            </header>
            {farms.length ? (
              <div className="season-farms-grid">{farms.map(renderFarm)}</div>
            ) : (
              <p className="field-empty-note">
                {ready
                  ? t(
                      'This field is ready. Add a farm and choose the area and crop.',
                      'জমি প্রস্তুত। খামার যোগ করে তার আয়তন ও ফসল বাছুন।',
                    )
                  : t(
                      'Set up this field before dividing it into farms.',
                      'খামারে ভাগ করার আগে এই জমির তথ্য দিন।',
                    )}
              </p>
            )}
          </section>
        );
      })}
    </div>
  );
}
