'use client';
import { useSyncExternalStore } from 'react';
import { displayStore } from '../../lib/display-store';
import type { Theme } from '../../lib/display-store';
import { usePlanner } from '../planner-provider';

export function ThemeSwitch() {
  const { t } = usePlanner();
  const { preferences } = useSyncExternalStore(
    displayStore.subscribe,
    displayStore.getSnapshot,
    displayStore.getServerSnapshot,
  );
  const options: { value: Theme; label: string }[] = [
    { value: 'auto', label: t('Auto', 'স্বয়ংক্রিয়') },
    { value: 'light', label: t('Light', 'হালকা') },
    { value: 'dark', label: t('Dark', 'গাঢ়') },
  ];
  return (
    <fieldset className="theme-switch">
      <legend>{t('Theme', 'রং')}</legend>
      <div className="segmented">
        {options.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name="theme"
              checked={preferences.theme === option.value}
              onChange={() => displayStore.update({ theme: option.value })}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
