'use client';
import { useEffect, useState } from 'react';
import type { FarmSite } from '../domain/farm-site';
import type { LiveWeather } from '../domain/live-weather';

interface WeatherState {
  key: string;
  data: LiveWeather | null;
  error: boolean;
}
export function useLiveWeather(site: FarmSite, enabled = true) {
  const key = `${site.latitude.toFixed(5)},${site.longitude.toFixed(5)}`;
  const [state, setState] = useState<WeatherState | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let request: AbortController | null = null;
    const load = async () => {
      request?.abort();
      request = new AbortController();
      try {
        const response = await fetch(
          `/api/weather?latitude=${site.latitude}&longitude=${site.longitude}`,
          { signal: request.signal },
        );
        const body = await response.json();
        if (
          !response.ok ||
          !body.weather ||
          body.weather.requested.latitude !== site.latitude ||
          body.weather.requested.longitude !== site.longitude
        )
          throw Error('Weather unavailable');
        if (!stopped) setState({ key, data: body.weather, error: false });
      } catch (error) {
        if (!stopped && !(error instanceof DOMException && error.name === 'AbortError'))
          setState((previous) => ({
            key,
            data: previous?.key === key ? previous.data : null,
            error: true,
          }));
      }
    };
    void load();
    const timer = setInterval(() => {
      if (!document.hidden) void load();
    }, 600000);
    const resume = () => {
      if (!document.hidden) void load();
    };
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      stopped = true;
      request?.abort();
      clearInterval(timer);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [key, site.latitude, site.longitude, enabled, retry]);
  return {
    data: state?.key === key ? state.data : null,
    error: state?.key === key && state.error,
    loading: enabled && state?.key !== key,
    retry: () => setRetry((n) => n + 1),
  };
}
