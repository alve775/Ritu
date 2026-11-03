import type { SeasonFarm } from './global-season';
import type { LiveWeather } from './live-weather';
import { weatherIsRecent } from './live-weather';
import { calculateWaterDay, waterBalanceSource } from './water-balance';
import { daysBetween } from './global-season';
import { cycleStatus, latestFieldUpdate, referenceWindow } from './season-lifecycle';
import { addDays } from './evidence-planner';
import { thermalMethodSource, type ThermalEstimate } from './crop-thermal';
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
  thermal?: ThermalEstimate,
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
  const observed = latestFieldUpdate(farm, date);
  if (!planning && farm.selection.crop === 'maize' && thermal) {
    if (
      (thermal.status === 'projected' && thermal.projectedDate === date) ||
      thermal.status === 'threshold-reached' ||
      thermal.status === 'observed-maturity'
    )
      result.push({
        id: 'thermal-maturity-check',
        kind: 'field',
        title: 'Check physical grain maturity and moisture',
        detail:
          'The documented heat target or a reported black-layer milestone calls for a field check. Inspect physical maturity and grain moisture using the hybrid and local harvest/storage protocol. A heat projection is not a harvest order.',
        source: thermalMethodSource,
      });
    if (thermal.status === 'stage-conflict')
      result.push({
        id: 'thermal-conflict',
        kind: 'planning',
        title: 'Resolve the heat-model and field-stage disagreement',
        detail:
          'Review the recorded stage, exact grain hybrid, planting date and documented heat convention. Do not harvest from a model that conflicts with the field.',
        source: thermalMethodSource,
      });
  }
  const stage = observed?.confidence === 'sure' ? observed.stage : null;
  const waterRecord = farm.waterRecords?.find((r) => r.date === date && r.mode === 'reported');
  const waterResult = waterRecord ? calculateWaterDay(waterRecord) : null;
  if (!planning && waterResult?.status === 'calculated' && waterResult.thresholdExceeded)
    result.push({
      id: 'water-budget-check',
      kind: 'field',
      title: 'Recheck the root-zone water calculation',
      detail:
        'Your reported-input water calculation exceeds its supplied RAW threshold. Check actual root-zone water, coefficient evidence and the local irrigation protocol. A calculated deficit is not a gross irrigation dose.',
      source: waterBalanceSource,
    });
  if (!planning && stage === 'Establishing')
    result.push({
      id: 'establishment',
      kind: 'field',
      title: 'Check establishment and missing plants',
      detail:
        'Your last observed stage was establishing. Inspect emergence or transplant survival and weeds. Record uneven patches before deciding on any replanting or treatment.',
      source: ipm,
    });
  if (!planning && stage === 'Flowering')
    result.push({
      id: 'flowering-water',
      kind: 'field',
      title: 'Give the flowering crop a careful water check',
      detail:
        'You recorded flowering. A fully developed canopy can have high water demand; inspect actual root-zone water and the crop-specific local protocol. Do not turn reference evaporation into an irrigation dose.',
      source: water,
    });
  if (!planning && stage === 'Maturing')
    result.push({
      id: 'observed-maturity',
      kind: 'field',
      title: 'Inspect crop-specific harvest maturity',
      detail:
        'You recorded maturing. Check actual maturity, expected weather and local harvest/post-harvest guidance. Record harvesting only after it happens.',
      source: ipm,
    });
  if (!planning && stage === 'Leaf growth')
    result.push({
      id: 'leaf-growth',
      kind: 'field',
      title: 'Inspect leaf growth and weeds',
      detail:
        'You recorded leaf growth. Compare several plants, look for uneven growth and record weeds or visible damage. Follow crop-specific local management guidance.',
      source: ipm,
    });
  if (!planning && stage === 'Fruit / grain filling')
    result.push({
      id: 'filling',
      kind: 'field',
      title: 'Inspect developing fruit or grain',
      detail:
        'You recorded fruit or grain filling. Check actual crop condition and root-zone water; this observation does not establish a harvest date or an irrigation dose.',
      source: water,
    });
  if (!planning && observed && observed.date >= addDays(date, -1)) {
    if (observed.water === 'dry')
      result.push({
        id: 'reported-dry',
        kind: 'field',
        title: 'Recheck the reported dry soil',
        detail:
          'Your field update reported dry soil. Inspect moisture in the active root zone and confirm usable water before deciding on crop-specific irrigation. No quantity is inferred from this answer.',
        source: water,
      });
    if (observed.water === 'waterlogged')
      result.push({
        id: 'reported-waterlogging',
        kind: 'field',
        title: 'Inspect the reported standing water',
        detail:
          'Check whether standing water is intended for this crop and field. Inspect drainage and crop condition; do not apply a universal drainage rule to flooded rice or other water-adapted crops.',
        source: water,
      });
    if (observed.damage === 'seen')
      result.push({
        id: 'reported-damage',
        kind: 'field',
        title: 'Inspect and document the reported damage',
        detail:
          'Record where damage or symptoms occur and inspect affected plants. Seek crop-specific diagnosis before treatment; a check-in is not a pest diagnosis or pesticide prescription.',
        source: ipm,
      });
  }
  if (!planning && cycleStatus(farm, date) === 'harvesting')
    result.push({
      id: 'harvest-underway',
      kind: 'field',
      title: 'Record each picking; finish only after the final harvest',
      detail:
        'Partial harvesting does not finish this planting. Record actual pickings and confirm final harvest only when this crop cycle is over. Perennial plantings continue after harvest.',
      source: ipm,
    });
  if (!planning && cycleStatus(farm, date) === 'extended')
    result.push({
      id: 'extended-growth',
      kind: 'planning',
      title: 'Keep tracking beyond the reference window',
      detail:
        'The original reference window has passed but final harvest is not recorded. Check the actual stage, variety and field conditions. No replacement maturity date is invented.',
      source: farm.selection.calendar?.sourceUrl ?? 'https://gaez.fao.org/pages/ecocrop',
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
    date >= referenceWindow(farm).early
  )
    result.push({
      id: 'maturity-check',
      kind: 'field',
      title: 'Check actual maturity before harvest',
      detail:
        'The source’s indicative duration has been reached. Inspect cultivar-specific maturity and local harvest guidance. The calendar cannot confirm that this crop is ready.',
      source:
        referenceWindow(farm).cultivar?.source ??
        farm.selection.calendar?.sourceUrl ??
        'https://gaez.fao.org/pages/ecocrop',
    });
  return result;
}
