'use client';
import { useEffect, useState } from 'react';
import { inRajshahiBox, type NasaClimate } from '../domain/nasa-local';

const cache = new Map<string, NasaClimate | null>();

/**
 * NASA IMERG rain and SMAP soil weeks at a land's pin. `undefined` while loading, `null` outside the
 * Rajshahi box or when the route fails (Ritu then plans as before, from NASA POWER alone).
 */
export function useNasaClimate(site?: { latitude: number; longitude: number }) {
  const lat = site?.latitude,
    lon = site?.longitude;
  const inside = lat !== undefined && lon !== undefined && inRajshahiBox(lat, lon);
  const key = inside ? `${lat},${lon}` : '';
  const [state, setState] = useState<{ key: string; nasa: NasaClimate | null } | null>(null);
  useEffect(() => {
    if (!key || cache.has(key)) return;
    const controller = new AbortController();
    void fetch(
      `/api/nasa-local?${new URLSearchParams({ latitude: String(lat), longitude: String(lon) })}`,
      { signal: controller.signal },
    )
      .then(async (r) => {
        if (!r.ok) throw Error();
        const body = (await r.json()) as { nasa: NasaClimate | null };
        cache.set(key, body.nasa ?? null);
        if (!controller.signal.aborted) setState({ key, nasa: body.nasa ?? null });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ key, nasa: null });
      });
    return () => controller.abort();
  }, [key, lat, lon]);
  if (!inside) return null;
  if (cache.has(key)) return cache.get(key) ?? null;
  return state?.key === key ? state.nasa : undefined;
}
