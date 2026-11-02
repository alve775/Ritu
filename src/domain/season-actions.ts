import type { SeasonFarm } from './global-season';
import type { LiveWeather } from './live-weather';
import { weatherIsRecent } from './live-weather';
import { daysBetween } from './global-season';
export interface FarmAction {
  id: string;
  title: string;
  detail: string;
  source: string;
  kind: 'field' | 'weather' | 'planning';
}
const water = 'https://www.fao.org/4/s2022e/s2022e02.htm';
const ipm =
  'https://www.fao.org/agriculture/crops/thematic-sitemap/theme/spi/scpi-home/managing-ecosystems/integrated-pest-management/ipm-how/en/';
/** Field checks, never automatic claims that a farmer has planted or a sensor has measured soil. */
export function actionsForDay(
  farm: SeasonFarm,
  date: string,
  weather: LiveWeather | null,
): FarmAction[] {
  if (
    farm.selection.planKind !== 'perennial-review' &&
    farm.harvestedDate &&
    date >= farm.harvestedDate
  )
    return [
      {
        id: 'post-harvest',
        kind: 'field',
        title: 'Check stored produce and update your notes',
        detail:
          'Record storage conditions, damage and actual harvest details. Keep this completed season for your next crop decision.',
        source: ipm,
      },
    ];
  const perennial = farm.selection.planKind === 'perennial-review';
  const planning = !farm.plantedDate || date < farm.plantedDate;
  const age = farm.plantedDate ? daysBetween(farm.plantedDate, date) : 0;
  const result: FarmAction[] = planning
    ? [
        {
          id: 'field-ready',
          kind: 'planning',
          title: 'Check the field before planting',
          detail:
            'Confirm drainage, usable water, seed or planting material and the locally suitable variety. The climate screen cannot confirm these for you.',
          source: 'https://gaez.fao.org/pages/ecocrop',
        },
        {
          id: 'record-planting',
          kind: 'planning',
          title: 'Record the actual planting date when planted',
          detail: `Your planning date is ${farm.selection.start}. Actual sowing or transplanting is recorded separately; the app will then count days from that event.`,
          source: farm.selection.calendar?.sourceUrl ?? 'https://gaez.fao.org/pages/ecocrop',
        },
      ]
    : [
        {
          id: 'walk-field',
          kind: 'field',
          title: 'Walk the field and record what you see',
          detail: `Day ${age + 1} since recorded planting. Look for uneven establishment, weeds, damage and symptoms. Record the observed crop stage; age alone cannot determine flowering or harvest readiness.`,
          source: ipm,
        },
        {
          id: 'check-water',
          kind: 'field',
          title: 'Check water in the root zone',
          detail:
            'Inspect your soil and drainage before deciding whether to irrigate. Rainfall forecasts and reference evaporation are not a measurement of available root-zone water.',
          source: water,
        },
      ];
  if (perennial)
    result.push({
      id: 'perennial-review',
      kind: 'planning',
      title: 'Review perennial establishment and local fruiting guidance',
      detail:
        'Record survival and observed growth. First bearing and fruiting season depend on species, cultivar, rootstock, plant age and local conditions. This care calendar does not predict first harvest; a recorded harvest does not end a perennial planting.',
      source:
        'https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-apples',
    });
  const observed = farm.observations
    .filter((o) => o.date <= date)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!planning && observed?.stage === 'Establishing')
    result.push({
      id: 'establishment',
      kind: 'field',
      title: 'Check establishment and missing plants',
      detail:
        'Your last observed stage was establishing. Inspect emergence or transplant survival and weeds. Record uneven patches before deciding on any replanting or treatment.',
      source: ipm,
    });
  if (!planning && observed?.stage === 'Flowering')
    result.push({
      id: 'flowering-water',
      kind: 'field',
      title: 'Give the flowering crop a careful water check',
      detail:
        'You recorded flowering. A fully developed canopy can have high water demand; inspect actual root-zone water and the crop-specific local protocol. Do not turn reference evaporation into an irrigation dose.',
      source: water,
    });
  if (!planning && observed?.stage === 'Maturing')
    result.push({
      id: 'observed-maturity',
      kind: 'field',
      title: 'Inspect crop-specific harvest maturity',
      detail:
        'You recorded maturing. Check actual maturity, expected weather and local harvest/post-harvest guidance. Record harvesting only after it happens.',
      source: ipm,
    });
  if (
    weather &&
    weatherIsRecent(weather) &&
    Math.abs(weather.requested.latitude - farm.site.latitude) < 0.00001 &&
    Math.abs(weather.requested.longitude - farm.site.longitude) < 0.00001
  ) {
    const forecast = weather.days.find((d) => d.date === date);
    if (forecast?.rain !== null && forecast?.rain !== undefined && forecast.rain > 0)
      result.push({
        id: 'rain-check',
        kind: 'weather',
        title: 'Rain is in the forecast',
        detail: `${forecast.rain.toFixed(1)} mm is forecast for this date. Recheck before field work; inspect drains and update the watering decision using actual soil conditions. This is a forecast, not measured rain.`,
        source: weather!.sourceUrl,
      });
    if (forecast?.minimum !== null && forecast?.minimum !== undefined && forecast.minimum <= 0)
      result.push({
        id: 'freezing',
        kind: 'weather',
        title: 'Freezing temperatures are forecast',
        detail: `Forecast minimum ${forecast.minimum.toFixed(1)} °C. Check crop-specific local frost guidance and protection before the event.`,
        source: weather!.sourceUrl,
      });
  }
  if (
    !planning &&
    farm.selection.planKind !== 'perennial-review' &&
    age >= farm.selection.durationMin - 1
  )
    result.push({
      id: 'maturity-check',
      kind: 'field',
      title: 'Check actual maturity before harvest',
      detail:
        'The source’s indicative duration has been reached. Inspect cultivar-specific maturity and local harvest guidance. The calendar cannot confirm that this crop is ready.',
      source: farm.selection.calendar?.sourceUrl ?? 'https://gaez.fao.org/pages/ecocrop',
    });
  return result;
}
