'use client';
import { useEffect, useRef, useState } from 'react';
import { useAutomaticWeather } from './use-automatic-weather';
import type { SeasonFarm } from '../domain/global-season';
import type { ThermalWeather } from '../domain/crop-thermal';

export function useThermalWeather(farm: SeasonFarm, today: string) {
  const automatic = useAutomaticWeather(),
    lastRequest = useRef('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    const refresh = () => setRetry((v) => v + 1);
    window.addEventListener('ritu-weather-refresh', refresh);
    return () => window.removeEventListener('ritu-weather-refresh', refresh);
  }, []);
  const enabled = farm.selection.crop === 'maize' && !!farm.thermalProfile && !!farm.plantedDate;
  const key = enabled
    ? new URLSearchParams({
        latitude: String(farm.site.latitude),
        longitude: String(farm.site.longitude),
        from: farm.plantedDate,
      }).toString()
    : '';
  const [result, setResult] = useState<{
    key: string;
    series: ThermalWeather | null;
    error: string | null;
  } | null>(null);
  useEffect(() => {
    if (!key) return;
    const controller = new AbortController();
    const load = async () => {
      if (document.visibilityState === 'hidden') return;
      try {
        const response = await fetch(`/api/crop-thermal?${key}`, { signal: controller.signal });
        const data = await response.json();
        if (!response.ok) throw Error(data.error || 'Temperature evidence unavailable');
        if (!controller.signal.aborted) {
          lastRequest.current = requestKey;
          setResult({ key, series: data.series, error: null });
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          lastRequest.current = requestKey;
          setResult({
            key,
            series: null,
            error: e instanceof Error ? e.message : 'Temperature evidence unavailable',
          });
        }
      }
    };
    const requestKey = `${key}:${retry}`;
    if (automatic || lastRequest.current !== requestKey) {
      void load();
    }
    const automaticLoad = () => {
      if (automatic) void load();
    };
    const interval = setInterval(automaticLoad, 900000);
    document.addEventListener('visibilitychange', automaticLoad);
    return () => {
      controller.abort();
      clearInterval(interval);
      document.removeEventListener('visibilitychange', automaticLoad);
    };
  }, [key, today, automatic, retry]);
  return result?.key === key ? result : { series: null, error: null };
}
