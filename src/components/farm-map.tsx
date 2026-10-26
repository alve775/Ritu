'use client';
import { useEffect, useRef, useState } from 'react';
import type { FarmSite } from '../domain/farm-site';
import { canonicalPin } from '../domain/farm-site';
import { usePlanner } from './planner-provider';

type Point = { lat: number; lng: number };
interface Marker {
  addTo(map: MapInstance): Marker;
  setLatLng(point: [number, number]): Marker;
  getLatLng(): Point;
  on(event: string, handler: () => void): Marker;
}
interface MapInstance {
  setView(point: [number, number], zoom?: number): MapInstance;
  getCenter(): Point;
  getZoom(): number;
  on(event: string, handler: (event: { latlng: Point }) => void): MapInstance;
  remove(): void;
  invalidateSize(): void;
}
interface Leaflet {
  map(element: HTMLElement, options: Record<string, unknown>): MapInstance;
  tileLayer(url: string, options: Record<string, unknown>): { addTo(map: MapInstance): void };
  marker(point: [number, number], options: Record<string, unknown>): Marker;
}
let library: Promise<Leaflet> | null = null;
let stylesReady = false;
function loadLeaflet() {
  if (library) return library;
  library = (async () => {
    const known = (window as Window & { L?: Leaflet }).L;
    await Promise.all([
      stylesReady
        ? Promise.resolve()
        : new Promise<void>((resolve, reject) => {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/vendor/leaflet/leaflet.css';
            link.onload = () => {
              stylesReady = true;
              resolve();
            };
            link.onerror = () => {
              link.remove();
              reject(Error('Map styles unavailable'));
            };
            document.head.append(link);
          }),
      known
        ? Promise.resolve()
        : new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = '/vendor/leaflet/leaflet.js';
            script.onload = () => resolve();
            script.onerror = () => {
              script.remove();
              reject(Error('Map unavailable'));
            };
            document.head.append(script);
          }),
    ]);
    const L = (window as Window & { L?: Leaflet }).L;
    if (!L) throw Error('Map unavailable');
    return L;
  })().catch((error) => {
    library = null;
    throw error;
  });
  return library;
}
export function FarmMap({
  site,
  onChange,
}: {
  site: FarmSite;
  onChange: (site: FarmSite) => void;
}) {
  const { t } = usePlanner();
  const node = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const marker = useRef<Marker | null>(null);
  const latest = useRef({ site, onChange });
  useEffect(() => {
    latest.current = { site, onChange };
  }, [site, onChange]);
  const [failed, setFailed] = useState(false),
    [retry, setRetry] = useState(0),
    [tilesFailed, setTilesFailed] = useState(false);
  const pinTitle = t('Drag the farm pin', 'জমির পিন সরান'),
    pinAlt = t('Farm location pin', 'জমির স্থানের পিন');
  useEffect(() => {
    let stopped = false;
    let resize: ResizeObserver | undefined;
    void loadLeaflet()
      .then((L) => {
        if (stopped || !node.current) return;
        const initial = latest.current.site;
        const instance = L.map(node.current, {
          scrollWheelZoom: false,
          keyboard: true,
          touchZoom: true,
          zoomControl: true,
        }).setView([initial.latitude, initial.longitude], 13);
        map.current = instance;
        const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
        });
        // Tile failure never invents geographic detail; coordinate/center controls remain available.
        (tiles as typeof tiles & { on: (name: string, callback: () => void) => void }).on(
          'tileerror',
          () => {
            if (!stopped) setTilesFailed(true);
          },
        );
        tiles.addTo(instance);
        const pin = L.marker([initial.latitude, initial.longitude], {
          draggable: true,
          title: pinTitle,
          alt: pinAlt,
          keyboard: true,
        }).addTo(instance);
        marker.current = pin;
        const choose = (point: Point) => {
          latest.current.onChange({
            ...latest.current.site,
            ...canonicalPin(point.lat, point.lng),
          });
        };
        instance.on('click', (event) => choose(event.latlng));
        pin.on('dragend', () => choose(pin.getLatLng()));
        resize = new ResizeObserver(() => instance.invalidateSize());
        resize.observe(node.current);
      })
      .catch(() => {
        if (!stopped) setFailed(true);
      });
    return () => {
      stopped = true;
      resize?.disconnect();
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
  }, [retry, pinTitle, pinAlt]);
  useEffect(() => {
    const point: [number, number] = [site.latitude, site.longitude];
    marker.current?.setLatLng(point);
    map.current?.setView(point, map.current.getZoom());
  }, [site.latitude, site.longitude]);
  return (
    <div className="farm-map-wrap">
      <div
        ref={node}
        className="farm-map"
        role="region"
        aria-label={t(
          'Farm location map. Use arrow keys to move the map, then Use map center to place your pin.',
          'জমির মানচিত্র। তীরচিহ্নে মানচিত্র সরিয়ে কেন্দ্র বাছুন।',
        )}
      />
      {(failed || tilesFailed) && (
        <p role="status">
          {t(
            'The map background could not load. You can still use location search, GPS or coordinates.',
            'মানচিত্রের পটভূমি আনা যায়নি। স্থান খোঁজা, GPS বা স্থানাঙ্ক ব্যবহার করুন।',
          )}
        </p>
      )}
      <div className="button-row">
        <button
          className="button secondary"
          onClick={() => {
            const center = map.current?.getCenter();
            if (center)
              onChange({
                ...site,
                ...canonicalPin(center.lat, center.lng),
              });
          }}
        >
          {t('Use map center', 'মানচিত্রের কেন্দ্র বাছুন')}
        </button>
        {failed && (
          <button
            className="text-button"
            onClick={() => {
              setFailed(false);
              setRetry((n) => n + 1);
            }}
          >
            {t('Retry map', 'মানচিত্র আবার আনুন')}
          </button>
        )}
      </div>
      <p className="field-help">
        {t(
          'Tap the map or drag the pin onto your field. Pinch or use + / − to zoom. Weather remains a regional model estimate.',
          'মানচিত্রে ছুঁয়ে বা পিন টেনে জমি বাছুন। দুই আঙুলে বা + / − দিয়ে জুম করুন। আবহাওয়া আঞ্চলিক মডেলের হিসাব।',
        )}
      </p>
    </div>
  );
}
