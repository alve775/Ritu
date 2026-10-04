'use client';
import { Droplets, Check, Sprout, Leaf, Wheat, CircleDot } from 'lucide-react';
import { usePlanner } from './planner-provider';
import type { HouseholdCrop, Irrigation, Priority } from '../domain/types';

export function WaterControl({ compact = false }: { compact?: boolean }) {
  const { t, farm, setFarm } = usePlanner();
  const options: { value: Irrigation; label: string; detail: string }[] = [
    {
      value: 'reliable',
      label: t('Reliable', 'নিয়মিত'),
      detail: t('Water when needed', 'প্রয়োজনে পানি মেলে'),
    },
    {
      value: 'limited',
      label: t('Limited', 'সীমিত'),
      detail: t('Some irrigation', 'কিছু সেচের সুযোগ'),
    },
    {
      value: 'rainfed',
      label: t('Rainfed', 'বৃষ্টিনির্ভর'),
      detail: t('Rainfall only', 'শুধু বৃষ্টির পানি'),
    },
    {
      value: 'severe',
      label: t('Severe shortage', 'তীব্র পানির সংকট'),
      detail: t('Very little irrigation', 'খুব অল্প সেচ'),
    },
    {
      value: 'unknown',
      label: t('Not sure', 'জানা নেই'),
      detail: t('Confirm later', 'পরে নিশ্চিত করুন'),
    },
  ];
  return (
    <fieldset className={`water-control ${compact ? 'compact' : ''}`}>
      <legend>
        <Droplets size={17} />
        {t('Irrigation access', 'সেচের সুযোগ')}
      </legend>
      {!compact && (
        <p className="field-help">
          {t('What water can this field count on?', 'এই জমিতে কী ধরনের পানি পাওয়া যায়?')}
        </p>
      )}
      <div className="water-options">
        {options.map((o) => (
          <label key={o.value} className={farm.irrigation === o.value ? 'chosen' : ''}>
            <input
              type="radio"
              aria-label={o.label}
              aria-describedby={!compact ? `water-detail-${o.value}` : undefined}
              name={compact ? 'water-compact' : 'water'}
              value={o.value}
              checked={farm.irrigation === o.value}
              onChange={() => setFarm({ irrigation: o.value })}
            />
            <span>
              <strong>{o.label}</strong>
              {!compact && <small id={`water-detail-${o.value}`}>{o.detail}</small>}
            </span>
            {farm.irrigation === o.value && <Check size={13} />}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
export function PriorityControl() {
  const { t, priority, setPriority } = usePlanner();
  const priorities: { id: Priority; label: string; description: string; icon: typeof Droplets }[] =
    [
      {
        id: 'water',
        label: t('Use less irrigation', 'সেচ কম লাগুক'),
        description: t('Lower invented water-demand index', 'কাল্পনিক পানির সূচক কম লাগুক'),
        icon: Droplets,
      },
      {
        id: 'diversity',
        label: t('More crop diversity', 'ফসলের বৈচিত্র্য'),
        description: t('Bring more families into the field', 'জমিতে আরও ফসলের পরিবার'),
        icon: Sprout,
      },
      {
        id: 'familiar',
        label: t('Keep it familiar', 'পরিচিত ক্রম রাখুন'),
        description: t('Prefer crops you have grown before', 'আগে চাষ করা ফসলের অগ্রাধিকার'),
        icon: Leaf,
      },
      {
        id: 'resilience',
        label: t('Drought resilience', 'খরা সহনশীলতা'),
        description: t(
          'A priority for demo comparison; real resilience is unverified',
          'নমুনার তুলনার অগ্রাধিকার; বাস্তব সহনশীলতা যাচাই বাকি',
        ),
        icon: Droplets,
      },
      {
        id: 'soil',
        label: t('Soil health', 'মাটির স্বাস্থ্য'),
        description: t(
          'Demo uses pulse inclusion; no soil benefit is predicted',
          'নমুনায় ডাল অন্তর্ভুক্তি দেখা হয়; মাটির উপকারের পূর্বাভাস নয়',
        ),
        icon: Sprout,
      },
    ];
  return (
    <fieldset className="priority-control">
      <legend>{t('What matters most?', 'আপনার অগ্রাধিকার কী?')}</legend>
      <p>
        {t(
          'This ranks passing mock calendars; it never overrides a failed check.',
          'এটি মেলা নমুনার ক্রম তুলনা করে; না-মেলা শর্ত এড়ায় না।',
        )}
      </p>
      {priorities.map(({ id, label, description, icon: Icon }) => (
        <label key={id} className={priority === id ? 'chosen' : ''}>
          <input
            type="radio"
            name="priority"
            checked={priority === id}
            onChange={() => setPriority(id)}
          />
          <span className="priority-icon">
            <Icon size={18} />
          </span>
          <span>
            <strong>{label}</strong>
            <small>{description}</small>
          </span>
          <span className="priority-radio">{priority === id && <span />}</span>
        </label>
      ))}
    </fieldset>
  );
}
export function HouseholdControl() {
  const { t, farm, setFarm } = usePlanner();
  const groups: { id: HouseholdCrop; label: string; icon: typeof Wheat }[] = [
    { id: 'rice', label: t('Rice', 'ধান'), icon: Wheat },
    { id: 'pulses', label: t('Pulses', 'ডাল'), icon: Sprout },
    { id: 'potato', label: t('Potato', 'আলু'), icon: CircleDot },
  ];
  return (
    <fieldset className="household-control">
      <legend>{t('Crops your household wants to keep', 'পরিবার যে ফসল রাখতে চায়')}</legend>
      <p className="field-help">
        {t(
          'Choose crop groups that every option must include.',
          'প্রতিটি বিকল্পে রাখতে হবে এমন ফসল বাছুন।',
        )}
      </p>
      <div>
        {groups.map(({ id, label, icon: Icon }) => (
          <label key={id} className={farm.required.includes(id) ? 'chosen' : ''}>
            <input
              type="checkbox"
              checked={farm.required.includes(id)}
              onChange={(e) =>
                setFarm({
                  required: e.target.checked
                    ? [...farm.required, id]
                    : farm.required.filter((c) => c !== id),
                })
              }
            />
            <Icon size={17} />
            <strong>{label}</strong>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
