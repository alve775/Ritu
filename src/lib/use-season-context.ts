'use client';
import { useEffect, useState } from 'react';
import type { FarmSite } from '../domain/farm-site';
import type { SeasonContext } from '../domain/global-season';
const cache = new Map<string, SeasonContext>();
export function useSeasonContext(site?: FarmSite) {
  const key = site ? `${site.latitude.toFixed(5)},${site.longitude.toFixed(5)}` : '';
  const [result, setResult] = useState<{
    key: string;
    data?: SeasonContext;
    error?: string;
  } | null>(null);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!site || !key) return;
    const cached = cache.get(key);
    const abort = new AbortController();
    let stopped = false;
    const load = async () => {
      try {
        const response = await fetch(
          `/api/season-context?latitude=${site.latitude}&longitude=${site.longitude}`,
          { signal: abort.signal },
        );
        const body = await response.json();
        if (
          !response.ok ||
          !body.context?.normal ||
          !Array.isArray(body.context.calendars) ||
          body.context.site.latitude !== site.latitude ||
          body.context.site.longitude !== site.longitude
        )
          throw Error(body.error || 'Crop data could not be verified.');
        const data: SeasonContext = { ...body.context, site };
        if (!stopped) {
          cache.set(key, data);
          setResult({ key, data });
        }
      } catch (error) {
        if (!stopped)
          setResult({
            key,
            error: error instanceof Error ? error.message : 'Crop data unavailable.',
          });
      }
    };
    const timer = setTimeout(() => {
      if (cached) setResult({ key, data: { ...cached, site } });
      else void load();
    }, 400);
    const resume = () => {
      if (!document.hidden) void load();
    };
    window.addEventListener('online', resume);
    return () => {
      stopped = true;
      clearTimeout(timer);
      abort.abort();
      window.removeEventListener('online', resume);
    };
  }, [key, site, retry]); // key binds the returned data to its exact selected pin.
  return {
    data: result?.key === key ? result.data : undefined,
    error: result?.key === key ? result.error : undefined,
    loading: !!key && result?.key !== key,
    retry: () => {
      cache.delete(key);
      setResult(null);
      setRetry((n) => n + 1);
    },
  };
}
