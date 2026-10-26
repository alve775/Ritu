'use client';
import { useState } from 'react';
import { usePlanner } from './planner-provider';
import { areaToHectares, areaFromHectares } from '../domain/area-units';
import type { AreaUnit } from '../domain/area-units';
export function FarmAreaField() {
  const { farm, setFarm, t } = usePlanner(),
    [unit, setUnit] = useState<AreaUnit>('hectares');
  return (
    <div className="form-field area-entry">
      <label htmlFor="farm-area">
        {unit === 'hectares'
          ? t('Field area (hectares)', 'জমির আয়তন (হেক্টর)')
          : unit === 'decimal'
            ? t('Field area (decimal / shotok)', 'জমির আয়তন (শতক)')
            : t('Field area (square metres)', 'জমির আয়তন (বর্গমিটার)')}
      </label>
      <div className="area-entry-inputs">
        <input
          id="farm-area"
          type="number"
          min="0"
          step="any"
          inputMode="decimal"
          value={farm.area ? areaFromHectares(farm.area, unit) : ''}
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
          <option value="hectares">{t('Hectares', 'হেক্টর')}</option>
          <option value="decimal">{t('Decimal / shotok', 'শতক')}</option>
          <option value="square-metres">{t('Square metres', 'বর্গমিটার')}</option>
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
