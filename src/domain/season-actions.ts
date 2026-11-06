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
            'Check drainage, usable water, seed or planting material and the variety you will plant.',
          source: 'https://gaez.fao.org/pages/ecocrop',
        },
        {
          id: 'record-planting',
          kind: 'planning',
          title: 'Record the actual planting date when planted',
          detail: `Planned planting: ${farm.selection.start}. Record the day you sow or transplant to start the crop calendar.`,
          source: farm.selection.calendar?.sourceUrl ?? 'https://gaez.fao.org/pages/ecocrop',
        },
      ]
    : [
        {
          id: 'walk-field',
          kind: 'field',
          title: 'Walk the field and record what you see',
          detail: `Day ${age + 1} since planting. Check several parts of the field for missing plants, weeds or damage, and record the crop stage.`,
          source: ipm,
        },
        {
          id: 'check-water',
          kind: 'field',
          title: 'Check water in the root zone',
          detail:
            'Inspect moisture around the active roots and check drainage before deciding whether to water.',
          source: water,
        },
      ];
  if (perennial)
    result.push({
      id: 'perennial-review',
      kind: 'planning',
      title: 'Review perennial establishment and local fruiting guidance',
      detail:
        'Check plant survival and new growth. Record flowering, fruiting and each harvest; keep caring for the planting after picking.',
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
          'The heat target or a recorded black-layer milestone has been reached. Inspect physical maturity and grain moisture using the hybrid’s harvest and storage guidance.',
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
        'The recorded water calculation exceeds its RAW threshold. Check root-zone moisture, crop coefficients and the irrigation schedule.',
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
        'You recorded flowering. Check moisture around the active roots and follow the crop’s irrigation schedule.',
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
        'You recorded fruit or grain filling. Inspect developing fruit or grain and moisture around the active roots.',
      source: water,
    });
  if (!planning && observed && observed.date >= addDays(date, -1)) {
    if (observed.water === 'dry')
      result.push({
        id: 'reported-dry',
        kind: 'field',
        title: 'Recheck the reported dry soil',
        detail:
          'You reported dry soil. Recheck moisture around the active roots and the water supply before watering.',
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
          'Note where damage occurs, inspect affected plants and identify the cause before choosing treatment.',
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
        'The reference growing period has passed. Check the crop’s stage and maturity, and continue recording progress until final harvest.',
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
        detail: `${forecast.rain.toFixed(1)} mm is forecast for this date. Check the forecast before field work, inspect drains and check soil moisture before watering.`,
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
        'The reference growing period has been reached. Inspect maturity using the variety’s harvest guidance.',
      source:
        referenceWindow(farm).cultivar?.source ??
        farm.selection.calendar?.sourceUrl ??
        'https://gaez.fao.org/pages/ecocrop',
    });
  return result;
}
