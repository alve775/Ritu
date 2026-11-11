'use client';
import { useEffect, useState } from 'react';
import type { SurveyAt } from '../domain/soil-survey';

const cache = new Map<string, SurveyAt>();

/**
 * BARC soil survey at a land's pin. `undefined` while loading; null outside Rajshahi,
 * Chapainawabganj, Natore and Naogaon, or when the route fails (Ritu then uses SoilGrids as before).
 */
export function useSoilSurvey(site?: {
  latitude: number;
  longitude: number;
}): SurveyAt | undefined {
  const lat = site?.latitude,
    lon = site?.longitude;
  const key = lat === undefined || lon === undefined ? '' : `${lat},${lon}`;
  const [state, setState] = useState<{ key: string; survey: SurveyAt } | null>(null);
  useEffect(() => {
    if (!key || cache.has(key)) return;
    const controller = new AbortController();
    void fetch(
      // `v` changes when the answer's shape changes, so browsers don't reuse a day-old reply.
      `/api/soil-survey?${new URLSearchParams({ latitude: String(lat), longitude: String(lon), v: '2' })}`,
      { signal: controller.signal },
    )
      .then(async (r) => {
        if (!r.ok) throw Error();
        const body = (await r.json()) as { survey?: SurveyAt };
        const survey = body.survey ?? null;
        cache.set(key, survey);
        if (!controller.signal.aborted) setState({ key, survey });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ key, survey: null });
      });
    return () => controller.abort();
  }, [key, lat, lon]);
  if (!key) return null;
  if (cache.has(key)) return cache.get(key) ?? null;
  return state?.key === key ? state.survey : undefined;
}
