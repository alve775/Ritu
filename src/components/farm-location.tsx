'use client';
import { useEffect, useRef, useState } from 'react';
import { LocateFixed, MapPin, Search } from 'lucide-react';
import { usePlanner } from './planner-provider';
import { climateFor, climateMatchesSite, siteFor } from '../data/region-environment';
import { inPilotRegion, validSite } from '../domain/farm-site';
import type { FarmSite } from '../domain/farm-site';
import { validPowerClimate } from '../domain/nasa-power';
import { FarmMap } from './farm-map';
import { WeatherContent } from './weather-panel';
import { useLiveWeather } from '../lib/use-live-weather';

interface Place extends FarmSite {
  id: number;
}
export function FarmLocation() {
  const { t, language, environment, setEnvironment } = usePlanner();
  const site = siteFor(environment),
    climate = climateFor(environment);
  const weather = useLiveWeather(site);
  const [query, setQuery] = useState(''),
    [places, setPlaces] = useState<Place[]>([]),
    [searchState, setSearchState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle'),
    [expanded, setExpanded] = useState(false),
    [active, setActive] = useState(-1);
  const [gps, setGps] = useState(''),
    [historyError, setHistoryError] = useState<string | null>(null);
  const historyKey = `${site.latitude.toFixed(2)},${site.longitude.toFixed(2)}`;
  const [contextRetry, setContextRetry] = useState(0);
  const queryRef = useRef<HTMLInputElement>(null);
  const update = useRef(setEnvironment);
  useEffect(() => {
    update.current = setEnvironment;
  }, [setEnvironment]);
  const [coordinates, setCoordinates] = useState({
    latitude: String(site.latitude),
    longitude: String(site.longitude),
  });
  const chooseSite = (next: FarmSite) => {
    setEnvironment({ site: next });
    setCoordinates({ latitude: String(next.latitude), longitude: String(next.longitude) });
    setExpanded(false);
    setActive(-1);
  };
  useEffect(() => {
    if (query.trim().length < 3 || !expanded) return;
    const abort = new AbortController();
    let stopped = false;
    const timer = setTimeout(async () => {
      setSearchState('loading');
      try {
        const response = await fetch(
          `/api/places?q=${encodeURIComponent(query.trim())}&language=${language}`,
          { signal: abort.signal },
        );
        const body = await response.json();
        if (!response.ok || !Array.isArray(body.places)) throw Error();
        if (!stopped) {
          setPlaces(body.places.filter(validSite));
          setSearchState('ready');
        }
      } catch (error) {
        if (!stopped && !(error instanceof DOMException && error.name === 'AbortError')) {
          setPlaces([]);
          setSearchState('error');
        }
      }
    }, 350);
    return () => {
      stopped = true;
      abort.abort();
      clearTimeout(timer);
    };
  }, [query, language, expanded]);
  // Seasonal context follows the pin automatically. The year is a source detail, never a required choice.
  useEffect(() => {
    const retry = () => {
      if (!document.hidden) setContextRetry((n) => n + 1);
    };
    window.addEventListener('online', retry);
    const timer = setInterval(retry, 300000);
    return () => {
      window.removeEventListener('online', retry);
      clearInterval(timer);
    };
  }, []);
  useEffect(() => {
    const abort = new AbortController();
    let stopped = false;
    if (
      climate.latitude === Number(site.latitude.toFixed(2)) &&
      climate.longitude === Number(site.longitude.toFixed(2)) &&
      climate.year === new Date().getUTCFullYear() - 1
    )
      return;
    const timer = setTimeout(async () => {
      const year = new Date().getUTCFullYear() - 1;
      const latitude = Number(site.latitude.toFixed(2)),
        longitude = Number(site.longitude.toFixed(2));
      try {
        const response = await fetch(
          `/api/climate?latitude=${latitude}&longitude=${longitude}&year=${year}`,
          { signal: abort.signal },
        );
        const body = await response.json();
        if (
          !response.ok ||
          !validPowerClimate(body.climate) ||
          body.climate.latitude !== latitude ||
          body.climate.longitude !== longitude ||
          body.climate.year !== year
        )
          throw Error();
        if (!stopped) {
          update.current({ climate: body.climate });
          setHistoryError(null);
        }
      } catch (error) {
        if (!stopped && !(error instanceof DOMException && error.name === 'AbortError'))
          setHistoryError(`${latitude.toFixed(2)},${longitude.toFixed(2)}`);
      }
    }, 800);
    return () => {
      stopped = true;
      abort.abort();
      clearTimeout(timer);
    };
  }, [site.latitude, site.longitude, climate, contextRetry]);
  const pick = (place: Place) => {
    chooseSite(place);
    setQuery(place.name);
    setExpanded(false);
    queryRef.current?.focus();
  };
  const coordValid =
    coordinates.latitude.trim() !== '' &&
    coordinates.longitude.trim() !== '' &&
    Number.isFinite(Number(coordinates.latitude)) &&
    Math.abs(Number(coordinates.latitude)) <= 85 &&
    Number.isFinite(Number(coordinates.longitude)) &&
    Math.abs(Number(coordinates.longitude)) <= 180;
  return (
    <section className="card farm-location" id="farm-location" aria-labelledby="location-heading">
      <header>
        <h2 id="location-heading">{t('Where is your farm?', 'আপনার জমি কোথায়?')}</h2>
        <p>
          {t(
            'Type a town, city or postal code, choose the right place, then move the pin onto your field.',
            'শহর, এলাকা বা পোস্টকোড লিখে সঠিক স্থান বাছুন। তারপর নিজের জমিতে পিন সরান।',
          )}
        </p>
      </header>
      <div className="location-map-grid environment-controls">
        <div className="location-search-panel">
          <label htmlFor="place-search">
            <Search size={20} />
            {t('Find your location', 'আপনার স্থান খুঁজুন')}
          </label>
          <div className="place-combobox">
            <input
              id="place-search"
              ref={queryRef}
              type="text"
              role="combobox"
              autoComplete="off"
              placeholder={t('e.g. Rajshahi, Washington, 20001', 'যেমন রাজশাহী, Washington, 20001')}
              value={query}
              aria-autocomplete="list"
              aria-expanded={expanded && query.trim().length >= 3}
              aria-controls="place-options"
              aria-activedescendant={
                active >= 0 && places[active] ? `place-${places[active].id}` : undefined
              }
              onChange={(e) => {
                setQuery(e.target.value);
                setExpanded(true);
                setActive(-1);
                setPlaces([]);
                setSearchState('idle');
              }}
              onFocus={() => setExpanded(true)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setExpanded(true);
                  setActive((i) => Math.min(i + 1, places.length - 1));
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActive((i) => Math.max(0, i - 1));
                }
                if (e.key === 'Enter' && active >= 0 && places[active]) {
                  e.preventDefault();
                  pick(places[active]);
                }
                if (e.key === 'Escape') setExpanded(false);
              }}
            />
            <ul
              role="listbox"
              id="place-options"
              aria-label={t('Matching locations', 'মিলে যাওয়া স্থান')}
              hidden={!expanded || query.trim().length < 3}
            >
              {places.map((p, i) => (
                <li
                  key={p.id}
                  id={`place-${p.id}`}
                  role="option"
                  aria-selected={active === i}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(p)}
                >
                  <MapPin size={18} />
                  {p.name}
                </li>
              ))}
            </ul>
          </div>
          <p role="status">
            {expanded && query.trim().length >= 3
              ? searchState === 'loading'
                ? t('Searching places…', 'স্থান খোঁজা হচ্ছে…')
                : searchState === 'error'
                  ? t(
                      'Search is unavailable. Use the map or coordinates below.',
                      'স্থান খোঁজা যাচ্ছে না। মানচিত্র বা নিচের স্থানাঙ্ক ব্যবহার করুন।',
                    )
                  : searchState === 'ready' && !places.length
                    ? t(
                        'No matching place. Try a nearby town or use the map.',
                        'স্থান মেলেনি। পাশের শহর বা মানচিত্র ব্যবহার করুন।',
                      )
                    : ''
              : t(
                  'Choose the correct country and region from the results.',
                  'ফলাফল থেকে সঠিক দেশ ও অঞ্চল বাছুন।',
                )}
          </p>
          <button
            className="button secondary"
            onClick={() => {
              if (!navigator.geolocation) {
                setGps(
                  t(
                    'Location access is unavailable. Use search or the map.',
                    'স্থানের অনুমতি পাওয়া যাচ্ছে না। খোঁজা বা মানচিত্র ব্যবহার করুন।',
                  ),
                );
                return;
              }
              setGps(t('Waiting for location permission…', 'স্থানের অনুমতির অপেক্ষা…'));
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  chooseSite({
                    latitude: Number(position.coords.latitude.toFixed(5)),
                    longitude: Number(position.coords.longitude.toFixed(5)),
                    name: t('My GPS-selected field', 'GPS-এ বাছা জমি'),
                  });
                  setGps(
                    t(
                      `Device accuracy: about ${Math.round(position.coords.accuracy)} m. Adjust the pin if needed.`,
                      `ডিভাইসের নির্ভুলতা প্রায় ${Math.round(position.coords.accuracy)} মিটার। প্রয়োজনে পিন সরান।`,
                    ),
                  );
                },
                () =>
                  setGps(
                    t(
                      'Location was unavailable or permission was denied. Search or place the pin instead.',
                      'স্থান পাওয়া যায়নি বা অনুমতি নেই। খুঁজুন বা পিন বসান।',
                    ),
                  ),
                { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
              );
            }}
          >
            <LocateFixed size={20} />
            {t('Use my location', 'আমার বর্তমান স্থান')}
          </button>
          {gps && <p role="status">{gps}</p>}
          <div className="selected-location" aria-live="polite">
            <strong>
              {environment.site
                ? t('Selected field', 'বাছা জমি')
                : t('Map center · choose your field', 'মানচিত্রের কেন্দ্র · জমি বাছুন')}
            </strong>
            <p>{site.name}</p>
            <span>
              {site.latitude.toFixed(5)}°, {site.longitude.toFixed(5)}°
            </span>
          </div>
          <details>
            <summary>{t('Enter exact coordinates instead', 'সরাসরি স্থানাঙ্ক দিন')}</summary>
            <div className="coordinate-fields">
              <label>
                {t('Latitude', 'অক্ষাংশ')}
                <input
                  type="number"
                  min="-85"
                  max="85"
                  step="0.00001"
                  value={coordinates.latitude}
                  onChange={(e) => setCoordinates({ ...coordinates, latitude: e.target.value })}
                />
              </label>
              <label>
                {t('Longitude', 'দ্রাঘিমাংশ')}
                <input
                  type="number"
                  min="-180"
                  max="180"
                  step="0.00001"
                  value={coordinates.longitude}
                  onChange={(e) => setCoordinates({ ...coordinates, longitude: e.target.value })}
                />
              </label>
              <button
                className="button secondary"
                disabled={!coordValid}
                onClick={() =>
                  chooseSite({
                    latitude: Number(coordinates.latitude),
                    longitude: Number(coordinates.longitude),
                    name: t('My pinned field', 'পিনে বাছা জমি'),
                  })
                }
              >
                {t('Use these coordinates', 'এই স্থানাঙ্ক বাছুন')}
              </button>
            </div>
          </details>
          <p className="weather-source">
            <a
              href="https://open-meteo.com/en/docs/geocoding-api"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open-Meteo
            </a>{' '}
            /{' '}
            <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">
              GeoNames
            </a>{' '}
            · CC BY 4.0
          </p>
        </div>
        <FarmMap site={site} onChange={chooseSite} />
      </div>
      <details className="location-weather">
        <summary>
          {weather.data
            ? `${weather.data.current.temperature === null ? '—' : weather.data.current.temperature.toFixed(1) + ' °C'} · `
            : ''}
          {weather.error && !weather.data
            ? t('Weather unavailable · retry & forecast', 'আবহাওয়া নেই · আবার চেষ্টা ও পূর্বাভাস')
            : t(
                'Weather for this location · details & forecast',
                'এই স্থানের আবহাওয়া · বিস্তারিত ও পূর্বাভাস',
              )}
        </summary>
        <WeatherContent site={site} result={weather} compact />
      </details>
      {!inPilotRegion(site) && (
        <p className="notice-amber">
          {t(
            'Worldwide location and weather work here. The verified regional crop calendars cover Rajshahi, Chapainawabganj, Naogaon and Natore; RITU does not apply these calendars elsewhere.',
            'বিশ্বের স্থান ও আবহাওয়া দেখা যায়। যাচাইকৃত পঞ্জিকা রাজশাহী, চাঁপাইনবাবগঞ্জ, নওগাঁ ও নাটোরের; অন্য স্থানে এগুলো বসানো হয় না।',
          )}
        </p>
      )}
      <details className="nasa-background">
        <summary>{t('NASA seasonal context & sources', 'নাসার মৌসুমি তথ্য ও উৎস')}</summary>
        {climateMatchesSite(environment) ? (
          <p>
            {t('NASA POWER historical year', 'নাসা POWER-এর ইতিহাসের বছর')} {climate.year} ·{' '}
            {climate.latitude.toFixed(2)}°, {climate.longitude.toFixed(2)}°.{' '}
            <a href={climate.requestUrl} target="_blank" rel="noopener noreferrer">
              {t('Original NASA record', 'নাসার মূল তথ্য')}
            </a>
          </p>
        ) : (
          <p role="status">
            {!environment.site
              ? t(
                  'Select your farm pin to load its NASA context.',
                  'জমির নাসার তথ্য আনতে নিজের পিন বাছুন।',
                )
              : historyError === historyKey
                ? t(
                    'NASA context is unavailable for this pin. Weather remains available, but no other location’s NASA data is used for crop matching.',
                    'এই পিনের নাসার তথ্য পাওয়া যায়নি। আবহাওয়া দেখা যাবে, কিন্তু অন্য স্থানের নাসার তথ্য দিয়ে ফসল মেলানো হবে না।',
                  )
                : t(
                    'NASA context is updating automatically for this pin…',
                    'এই পিনের নাসার তথ্য নিজে থেকে আনা হচ্ছে…',
                  )}
          </p>
        )}
        <p>
          {t(
            'NASA history provides seasonal context and has a publication delay. Current weather and forecasts above come separately from Open-Meteo. Neither source measures your field’s soil texture or irrigation supply.',
            'নাসার ইতিহাস মৌসুম বোঝায় এবং প্রকাশে দেরি থাকে। ওপরের বর্তমান আবহাওয়া ও পূর্বাভাস আলাদা Open-Meteo থেকে আসে। কোনো উৎসই জমির মাটির গঠন বা সেচের সরবরাহ মাপে না।',
          )}
        </p>
      </details>
    </section>
  );
}
