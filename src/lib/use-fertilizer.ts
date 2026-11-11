'use client';
import { useEffect, useState } from 'react';
import type { RotationCropId } from '../data/rotation-crops';
import type { FertilizerResult } from './barc-fertilizer';

export type FertilizerState =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'error'; pageUrl: string | null }
  | { status: 'ok'; result: FertilizerResult };

// One request per crop and pin for the whole page session; every card using it is told when it ends.
const cache = new Map<string, FertilizerState>();
const asked = new Set<string>();
const listeners = new Set<() => void>();

function ask(key: string, crop: string, lat: number, lon: number) {
  if (asked.has(key)) return;
  asked.add(key);
  void fetch(
    `/api/fertilizer?${new URLSearchParams({ crop, latitude: String(lat), longitude: String(lon) })}`,
  )
    .then(async (r) => {
      const body = (await r.json()) as {
        fertilizer?: FertilizerResult | null;
        pageUrl?: string | null;
        error?: string;
      };
      cache.set(
        key,
        body.fertilizer
          ? body.fertilizer.items.length
            ? { status: 'ok', result: body.fertilizer }
            : { status: 'none' }
          : body.error
            ? { status: 'error', pageUrl: body.pageUrl ?? null }
            : { status: 'none' },
      );
    })
    .catch(() => cache.set(key, { status: 'error', pageUrl: null }))
    .finally(() => listeners.forEach((l) => l()));
}

/** BARC fertiliser recommendations for a plot's crops at its land's pin. */
export function useFertilizer(
  crops: RotationCropId[],
  site?: { latitude: number; longitude: number },
): Record<string, FertilizerState> {
  const lat = site?.latitude,
    lon = site?.longitude;
  const keys = lat === undefined || lon === undefined ? [] : crops.map((c) => `${c}@${lat},${lon}`);
  const joined = keys.join('|');
  const [, bump] = useState(0);
  useEffect(() => {
    const listener = () => bump((n) => n + 1);
    listeners.add(listener);
    if (joined && lat !== undefined && lon !== undefined)
      for (const key of joined.split('|')) ask(key, key.split('@')[0], lat, lon);
    return () => {
      listeners.delete(listener);
    };
  }, [joined, lat, lon]);
  return Object.fromEntries(
    crops.map((c, i) => [
      c,
      keys[i] ? (cache.get(keys[i]) ?? { status: 'loading' }) : { status: 'none' },
    ]),
  );
}
