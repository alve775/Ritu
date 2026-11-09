'use client';
import { useEffect, useState } from 'react';
import type { SoilReference } from './soil-reference';

/** Topsoil depth used for the modeled pH; the same depth as the soil texture estimate. */
export const soilPhDepth = '5-15';

/** Modeled topsoil pH (ISRIC SoilGrids) at a pin, loaded through Ritu's soil-reference route. */
export function useSoilReference(site?: { latitude: number; longitude: number }) {
  const latitude = site?.latitude,
    longitude = site?.longitude,
    key = latitude === undefined || longitude === undefined ? '' : `${latitude},${longitude}`;
  const [state, setState] = useState<{ key: string; soil?: SoilReference; error?: boolean } | null>(
    null,
  );
  useEffect(() => {
    if (!key || latitude === undefined || longitude === undefined) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void fetch(
        `/api/soil-reference?${new URLSearchParams({ latitude: String(latitude), longitude: String(longitude), depth: soilPhDepth })}`,
        { signal: controller.signal },
      )
        .then(async (r) => {
          const body = await r.json();
          if (
            !r.ok ||
            !body.soil ||
            body.soil.latitude !== latitude ||
            body.soil.longitude !== longitude ||
            body.soil.depth !== soilPhDepth
          )
            throw Error();
          if (!controller.signal.aborted) setState({ key, soil: body.soil });
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
  return {
    key,
    soil: state?.key === key ? state.soil : undefined,
    error: !!key && state?.key === key && !!state.error,
  };
}
