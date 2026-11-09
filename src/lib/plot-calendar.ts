import type { SeasonState } from './season-store';

/** The crop calendar to open for a plot: the open one, else the plot's unfinished crop, else its latest. */
export function calendarFarmFor(state: SeasonState, plotId: string) {
  const farms = state.farms.filter((f) => f.plotId === plotId && f.rotationSeason);
  if (!farms.length) return null;
  const active = farms.find((f) => f.id === state.activeId);
  if (active) return active;
  const byDate = [...farms].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return (
    byDate.find((f) => !f.harvestedDate && !f.lost && !f.cancelled) ?? byDate[byDate.length - 1]
  );
}
/** Address of the calendar page opened on one day. */
export const calendarDayHref = (date: string) => `/plan?day=${date}`;
