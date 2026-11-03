'use client';
import { useSyncExternalStore } from 'react';
import { displayStore } from './display-store';
export function useAutomaticWeather() {
  return (
    useSyncExternalStore(
      displayStore.subscribe,
      displayStore.getSnapshot,
      displayStore.getServerSnapshot,
    ).preferences.autoWeather !== false
  );
}
