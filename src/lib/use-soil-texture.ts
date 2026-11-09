'use client';
import { useEffect, useState } from 'react';
import type { SoilTexture } from './soil-reference';

/** SoilGrids texture estimate for a pin; reloads when the pin moves. */
export function useSoilTexture(site?: { latitude: number; longitude: number }) {
  const latitude = site?.latitude,
    longitude = site?.longitude,
    key = latitude === undefined || longitude === undefined ? '' : `${latitude},${longitude}`;
  const [state, setState] = useState<{
    key: string;
    texture?: SoilTexture;
    error?: boolean;
  } | null>(null);
  useEffect(() => {
    if (!key || latitude === undefined || longitude === undefined) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetch(
        `/api/soil-texture?${new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), depth: '5-15' })}`,
        { signal: controller.signal },
      )
        .then(async (r) => {
          const body = await r.json();
          if (
            !r.ok ||
            !body.texture ||
            body.texture.latitude !== latitude ||
            body.texture.longitude !== longitude
          )
            throw Error();
          if (!controller.signal.aborted) setState({ key, texture: body.texture });
        })
        .catch(() => {
          if (!controller.signal.aborted) setState({ key, error: true });
        });
    }, 700);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, latitude, longitude]);
  const current = state?.key === key ? state : null;
  return {
    texture: current?.texture,
    error: !!current?.error,
    loading: !!key && !current,
  };
}
