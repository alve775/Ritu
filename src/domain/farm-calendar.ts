import type { SeasonFarm } from './global-season';
import { referenceWindow } from './season-lifecycle';
export function farmCalendarDay(farm: SeasonFarm, date: string, today: string) {
  const timing = referenceWindow(farm),
    perennial = farm.selection.planKind === 'perennial-review';
  const end = !perennial && farm.harvestedDate ? farm.harvestedDate : timing.late;
  const scheduled = date >= timing.start && date <= end;
  const growing =
    !!farm.plantedDate &&
    date >= farm.plantedDate &&
    date <= today &&
    (perennial || !farm.harvestedDate || date <= farm.harvestedDate);
  return {
    scheduled,
    growing,
    extended: !perennial && growing && date > timing.late,
    completedTasks: farm.done.filter((id) => id.startsWith(date + ':')).length,
  };
}
