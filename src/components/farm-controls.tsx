'use client';
import { Droplets, Check, Sprout, Leaf, Wheat, CircleDot } from 'lucide-react';
import { useMemo } from 'react';
import { usePlanner } from './planner-provider';
import { blockingHousehold, householdBlockers, viableCropSets } from '../domain/demo-planner';
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
        description: t('Lower water-demand index', 'পানির সূচক কম লাগুক'),
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
          'A priority for comparison; real resilience is unverified',
          'তুলনার অগ্রাধিকার; বাস্তব সহনশীলতা যাচাই বাকি',
        ),
        icon: Droplets,
      },
      {
        id: 'soil',
        label: t('Soil health', 'মাটির স্বাস্থ্য'),
        description: t(
          'Uses pulse inclusion; no soil benefit is predicted',
          'ডাল অন্তর্ভুক্তি দেখা হয়; মাটির উপকারের পূর্বাভাস নয়',
        ),
        icon: Sprout,
      },
    ];
  return (
    <fieldset className="priority-control">
      <legend>{t('What matters most?', 'আপনার অগ্রাধিকার কী?')}</legend>
      <p>
        {t(
          'This ranks passing calendars; it never overrides a failed check.',
          'এটি মেলা ক্রম তুলনা করে; না-মেলা শর্ত এড়ায় না।',
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
  const { t, farm, setFarm, demo, priority, householdDropped } = usePlanner();
  // A group is offered only if some calendar can still include it on this farm.
  const { blocked, unfit } = useMemo(() => {
    const possible = viableCropSets(farm, demo, priority).length > 0;
    return {
      blocked: (['rice', 'pulses', 'potato'] as const).filter(
        (id) =>
          possible &&
          !farm.required.includes(id) &&
          !viableCropSets({ ...farm, required: [...farm.required, id] }, demo, priority).length,
      ) as HouseholdCrop[],
      unfit: blockingHousehold(farm, demo, priority),
    };
  }, [farm, demo, priority]);
  const groups: { id: HouseholdCrop; label: string; icon: typeof Wheat }[] = [
    { id: 'rice', label: t('Rice', 'ধান'), icon: Wheat },
    { id: 'pulses', label: t('Pulses', 'ডাল'), icon: Sprout },
    { id: 'potato', label: t('Potato', 'আলু'), icon: CircleDot },
  ];
  const label = (id: HouseholdCrop) => groups.find((g) => g.id === id)!.label;
  const reasons: Record<string, string> = {
    water: t(
      'it needs more water than your water supply',
      'আপনার পানির সরবরাহের চেয়ে বেশি পানি লাগে',
    ),
    soil: t('it does not suit your soil', 'আপনার মাটিতে মেলে না'),
    drainage: t('it does not suit your drainage', 'আপনার নিষ্কাশনে মেলে না'),
    climate: t('it does not suit the weather', 'আবহাওয়ায় মেলে না'),
    labor: t('its planting or harvest falls in months without help', 'রোপণ বা কাটার মাসে শ্রম নেই'),
  };
  const reason = (id: HouseholdCrop) => {
    const failed = householdBlockers(id, farm, demo);
    return failed.length
      ? failed.map((check) => reasons[check]).join(t(' and ', ' ও '))
      : t(
          'it cannot fit in one calendar with your other household crops',
          'পরিবারের অন্য ফসলের সঙ্গে একই ক্যালেন্ডারে মেলে না',
        );
  };
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
          <label
            key={id}
            className={`${farm.required.includes(id) ? 'chosen' : ''} ${unfit.includes(id) ? 'unfit' : ''}`}
          >
            <input
              type="checkbox"
              checked={farm.required.includes(id)}
              disabled={blocked.includes(id)}
              aria-describedby={
                blocked.includes(id) || unfit.includes(id) ? `household-why-${id}` : undefined
              }
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
      {[...blocked, ...unfit].map((id) => (
        <p
          key={id}
          id={`household-why-${id}`}
          className={`field-help ${unfit.includes(id) || householdDropped.includes(id) ? 'household-warning' : ''}`}
          role={unfit.includes(id) || householdDropped.includes(id) ? 'status' : undefined}
        >
          {unfit.includes(id)
            ? t(
                `Untick ${label(id)} to get a calendar: ${reason(id)}.`,
                `ক্যালেন্ডার পেতে ${label(id)} বাদ দিন: ${reason(id)}।`,
              )
            : householdDropped.includes(id)
              ? t(
                  `${label(id)} was unticked: ${reason(id)}. Change the farm details back to add it again.`,
                  `${label(id)} বাদ দেওয়া হয়েছে: ${reason(id)}। আবার যোগ করতে জমির তথ্য আগের মতো করুন।`,
                )
              : t(
                  `${label(id)} is not available on this farm: ${reason(id)}. Change the farm details to add it.`,
                  `এই জমিতে ${label(id)} পাওয়া যাচ্ছে না: ${reason(id)}। যোগ করতে জমির তথ্য বদলান।`,
                )}
        </p>
      ))}
    </fieldset>
  );
}
