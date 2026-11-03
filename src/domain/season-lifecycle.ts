import { addDays, validDate } from './evidence-planner';
import { observedStages, type DailyFieldCheckIn, type SeasonFarm } from './global-season';
import { mungCultivars, validCultivarReference } from '../data/cultivar-references';

export function referenceWindow(farm: SeasonFarm) {
  const start = farm.plantedDate || farm.selection.start;
  const cultivar =
    farm.selection.crop === 'mung' && validCultivarReference(farm.cultivarReference)
      ? mungCultivars.find((v) => v.id === farm.cultivarReference?.varietyId)
      : undefined;
  return {
    cultivar,
    start,
    early: addDays(start, (cultivar?.durationMin ?? farm.selection.durationMin) - 1),
    late: addDays(start, (cultivar?.durationMax ?? farm.selection.durationMax) - 1),
    originalEarly: addDays(farm.selection.endEarly, -1),
    originalLate: addDays(farm.selection.endLate, -1),
  };
}
export function cycleStatus(farm: SeasonFarm, date: string) {
  if (!farm.plantedDate || date < farm.plantedDate) return 'planned';
  const perennial = farm.selection.planKind === 'perennial-review';
  if (!perennial && farm.harvestedDate && date >= farm.harvestedDate) return 'completed';
  if (
    farm.harvestStartedDate &&
    farm.harvestStartedDate <= date &&
    (!farm.harvestedDate ||
      farm.harvestedDate < farm.harvestStartedDate ||
      farm.harvestedDate > date)
  )
    return 'harvesting';
  if (perennial) return 'perennial';
  return date > referenceWindow(farm).late ? 'extended' : 'growing';
}
export function latestFieldUpdate(farm: SeasonFarm, date: string) {
  // Last saved item wins ties on the same day. New check-ins supersede legacy
  // observations on that date; future observations never drive earlier advice.
  const updates = [
    ...farm.observations.map((o) => ({
      ...o,
      confidence: 'sure' as const,
      coverage: 'not-sure' as const,
      water: 'not-checked' as const,
      damage: 'not-checked' as const,
    })),
    ...(farm.checkIns ?? []),
  ]
    .filter((o) => o.date <= date && (!farm.plantedDate || o.date >= farm.plantedDate))
    .map((o, order) => ({ ...o, order }))
    .sort((a, b) => b.date.localeCompare(a.date) || b.order - a.order);
  const latest = updates[0];
  if (latest?.stage === 'No change') {
    const previous = updates.find(
      (o) => o.stage !== 'No change' && o.stage !== 'Not sure' && o.confidence === 'sure',
    );
    return { ...latest, stage: previous?.stage ?? 'Not sure' };
  }
  return latest;
}
export function validCheckIn(raw: unknown): raw is DailyFieldCheckIn {
  if (!raw || typeof raw !== 'object') return false;
  const c = raw as DailyFieldCheckIn;
  return (
    typeof c.id === 'string' &&
    c.id.length > 0 &&
    c.id.length <= 100 &&
    validDate(c.date) &&
    observedStages.includes(c.stage) &&
    ['sure', 'unsure'].includes(c.confidence) &&
    ['not-sure', 'few', 'half', 'most'].includes(c.coverage) &&
    ['not-checked', 'dry', 'moist', 'waterlogged'].includes(c.water) &&
    ['not-checked', 'none-seen', 'seen'].includes(c.damage) &&
    ['none', 'started', 'finished'].includes(c.harvest) &&
    ['none', 'maize-silking', 'maize-maturity'].includes(c.milestone) &&
    typeof c.note === 'string' &&
    c.note.length <= 2000 &&
    (c.stage !== 'Harvested' || c.harvest !== 'none') &&
    (c.milestone === 'none' ||
      (c.confidence === 'sure' &&
        ['half', 'most'].includes(c.coverage) &&
        (c.milestone === 'maize-silking'
          ? c.stage === 'Flowering'
          : ['Maturing', 'Harvested'].includes(c.stage))))
  );
}
export function recordFieldCheckIn(farm: SeasonFarm, checkIn: DailyFieldCheckIn, today: string) {
  if (
    (checkIn.milestone === 'maize-silking' && checkIn.stage !== 'Flowering') ||
    (checkIn.milestone === 'maize-maturity' && !['Maturing', 'Harvested'].includes(checkIn.stage))
  )
    throw Error(
      'The milestone must agree with the observed stage: silking with Flowering, black layer with Maturing or Harvested.',
    );
  if (
    checkIn.milestone !== 'none' &&
    (checkIn.confidence !== 'sure' || !['half', 'most'].includes(checkIn.coverage))
  )
    throw Error('A milestone needs a confident report covering at least half the plants.');
  if (
    !validCheckIn(checkIn) ||
    !farm.plantedDate ||
    checkIn.date < farm.plantedDate ||
    checkIn.date > today
  )
    throw Error('Record planting first and choose a day between planting and today.');
  if ((farm.checkIns?.length ?? 0) >= 2000)
    throw Error('Export the farm history before adding more check-ins.');
  if ((farm.checkIns ?? []).some((c) => c.id === checkIn.id))
    throw Error('This check-in is already saved.');
  if (checkIn.milestone !== 'none' && farm.selection.crop !== 'maize')
    throw Error('This milestone belongs to grain corn.');
  if (cycleStatus(farm, checkIn.date) === 'completed')
    throw Error('Correct the final harvest date before adding another growing-season update.');
  let harvestStartedDate = farm.harvestStartedDate;
  if (checkIn.harvest !== 'none') {
    const newPerennialRound =
      farm.selection.planKind === 'perennial-review' &&
      !!farm.harvestedDate &&
      checkIn.date > farm.harvestedDate &&
      (!harvestStartedDate || harvestStartedDate <= farm.harvestedDate);
    harvestStartedDate =
      newPerennialRound || !harvestStartedDate || checkIn.date < harvestStartedDate
        ? checkIn.date
        : harvestStartedDate;
  }
  return {
    checkIns: [...(farm.checkIns ?? []), checkIn],
    ...(harvestStartedDate ? { harvestStartedDate } : {}),
    ...(checkIn.harvest === 'finished' ? { harvestedDate: checkIn.date } : {}),
  };
}

/** Correct an erroneous journal entry without discarding the rest of the farm.
 * Only dates set by that entry are recalculated; unrelated manual dates remain.
 */
export function removeFieldCheckIn(farm: SeasonFarm, id: string) {
  const removed = farm.checkIns?.find((c) => c.id === id);
  if (!removed) throw Error('This field update no longer exists.');
  const checkIns = farm.checkIns!.filter((c) => c.id !== id);
  let harvestedDate = farm.harvestedDate;
  if (removed.harvest === 'finished' && removed.date === harvestedDate)
    harvestedDate =
      checkIns
        .filter((c) => c.harvest === 'finished')
        .map((c) => c.date)
        .sort()
        .at(-1) ?? '';
  let harvestStartedDate = farm.harvestStartedDate;
  if (removed.harvest !== 'none' && removed.date === harvestStartedDate) {
    const starts = checkIns.filter(
      (c) =>
        c.harvest !== 'none' &&
        (farm.selection.planKind !== 'perennial-review' ||
          !harvestedDate ||
          c.date > harvestedDate),
    );
    harvestStartedDate = starts.map((c) => c.date).sort()[0] ?? '';
  }
  return { checkIns, harvestedDate, harvestStartedDate };
}
