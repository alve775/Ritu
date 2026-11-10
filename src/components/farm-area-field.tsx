'use client';
import { useState } from 'react';
import { usePlanner } from './planner-provider';
import {
  areaToHectares,
  areaFromHectares,
  areaUnits,
  areaUnitOptionLabel,
} from '../domain/area-units';
import type { AreaUnit } from '../domain/area-units';
export function FarmAreaField() {
  const { farm, setFarm, t } = usePlanner(),
    [unit, setUnit] = useState<AreaUnit>('hectares');
  // At most four decimals in any unit, as in the plot form; the stored area stays exact.
  const shown = farm.area ? Number(areaFromHectares(farm.area, unit).toFixed(4)) : '';
  return (
    <div className="form-field area-entry">
      <label htmlFor="farm-area">
        {unit === 'bigha'
          ? t('Land area (Bigha, 33 decimal)', 'জমির আয়তন (বিঘা, ৩৩ শতক)')
          : unit === 'katha'
            ? t('Land area (Katha, 720 sq ft)', 'জমির আয়তন (কাঠা, ৭২০ বর্গফুট)')
            : unit === 'hectares'
              ? t('Land area (hectares)', 'জমির আয়তন (হেক্টর)')
              : unit === 'acres'
                ? t('Land area (acres)', 'জমির আয়তন (একর)')
                : unit === 'decimal'
                  ? t('Land area (decimal / shotok)', 'জমির আয়তন (শতক)')
                  : t('Land area (square metres)', 'জমির আয়তন (বর্গমিটার)')}
      </label>
      <div className="area-entry-inputs">
        <input
          id="farm-area"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={shown}
          aria-required="true"
          aria-describedby="area-help"
          placeholder={t('Enter measured area', 'মাপা আয়তন দিন')}
          onChange={(e) =>
            setFarm({
              area: e.target.value === '' ? 0 : areaToHectares(Number(e.target.value), unit),
            })
          }
          aria-invalid={farm.area < 0 || farm.area > 1000}
        />
        <select
          aria-label={t('Area unit', 'আয়তনের একক')}
          value={unit}
          onChange={(e) => setUnit(e.target.value as AreaUnit)}
        >
          {areaUnits.map((u) => (
            <option key={u} value={u}>
              {areaUnitOptionLabel(u, t)}
            </option>
          ))}
        </select>
      </div>
      <small id="area-help">
        {farm.area > 0
          ? `${Number(farm.area.toPrecision(8))} ha · ${Number((farm.area * 10000).toPrecision(8))} m²`
          : t('Choose the unit used in your field measurement.', 'নিজের জমির মাপের একক বাছুন।')}
      </small>
    </div>
  );
}
