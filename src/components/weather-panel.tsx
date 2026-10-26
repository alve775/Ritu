'use client';
import { CloudRain, Droplets, Thermometer, Wind } from 'lucide-react';
import type { FarmSite } from '../domain/farm-site';
import { useLiveWeather } from '../lib/use-live-weather';
import { usePlanner } from './planner-provider';
import type { LiveWeather } from '../domain/live-weather';
import { weatherIsRecent } from '../domain/live-weather';

export const formatWeatherValue = (value: number | null | undefined, unit: string) =>
  value === null || value === undefined ? '—' : `${value.toFixed(1)} ${unit}`;
export function WeatherPanel({
  site,
  onWeather,
  compact = false,
}: {
  site: FarmSite;
  onWeather?: (weather: LiveWeather | null) => void;
  compact?: boolean;
}) {
  const result = useLiveWeather(site);
  return <WeatherContent site={site} result={result} onWeather={onWeather} compact={compact} />;
}
import { useEffect } from 'react';
export function WeatherContent({
  site,
  result,
  onWeather,
  compact = false,
}: {
  site: FarmSite;
  result: ReturnType<typeof useLiveWeather>;
  onWeather?: (weather: LiveWeather | null) => void;
  compact?: boolean;
}) {
  const { t, language } = usePlanner();
  const { data, error, loading, retry } = result;
  useEffect(() => {
    onWeather?.(error ? null : data);
  }, [data, error, onWeather]);
  if (loading)
    return (
      <section className="weather-panel" aria-busy="true">
        <h3>{t('Current weather & next seven days', 'এখনকার আবহাওয়া ও আগামী সাত দিন')}</h3>
        <p role="status">
          {t('Getting weather for your farm automatically…', 'জমির আবহাওয়া নিজে থেকে আনা হচ্ছে…')}
        </p>
      </section>
    );
  if (!data)
    return (
      <section className="weather-panel">
        <h3>{t('Weather is temporarily unavailable', 'আবহাওয়া আপাতত পাওয়া যাচ্ছে না')}</h3>
        <p role="status">
          {t(
            'No sample weather is substituted. Check your connection; the app retries when you return online.',
            'উদাহরণের আবহাওয়া বসানো হয় না। সংযোগ দেখুন; অনলাইনে ফিরলে আবার চেষ্টা হবে।',
          )}
        </p>
        <button className="button secondary" onClick={retry}>
          {t('Retry weather', 'আবার আবহাওয়া আনুন')}
        </button>
      </section>
    );
  const metrics = [
    {
      icon: Thermometer,
      label: t('Air temperature', 'বাতাসের তাপ'),
      value: formatWeatherValue(data.current.temperature, '°C'),
    },
    {
      icon: CloudRain,
      label: t('Rain in current interval', 'এই সময়ের বৃষ্টি'),
      value: formatWeatherValue(data.current.rain, 'mm'),
    },
    {
      icon: Droplets,
      label: t('Air humidity', 'বাতাসের আর্দ্রতা'),
      value: formatWeatherValue(data.current.humidity, '%'),
    },
    {
      icon: Wind,
      label: t('Wind at 10 m', '১০ মিটারে বাতাস'),
      value: formatWeatherValue(data.current.wind, 'km/h'),
    },
  ];
  return (
    <section
      className="weather-panel"
      aria-label={t('Current weather and forecast', 'বর্তমান আবহাওয়া ও পূর্বাভাস')}
    >
      <div className="live-weather-heading">
        <div>
          <span className="eyebrow">
            {t('AUTOMATIC WEATHER UPDATES', 'আবহাওয়া নিজে থেকে আপডেট')}
          </span>
          <h3>{t('Current weather & next seven days', 'এখনকার আবহাওয়া ও আগামী সাত দিন')}</h3>
        </div>
        <span className="source-badge">Open-Meteo</span>
      </div>
      <p>
        {site.name} · {t('Model time', 'মডেলের সময়')}: {data.current.time.replace('T', ' ')} ·{' '}
        {data.timezone}
      </p>
      {error && (
        <p role="status" className="notice-amber">
          {t(
            'The latest update failed. These are the previously retrieved values; automated weather reminders are paused until data returns.',
            'সর্বশেষ তথ্য আনা যায়নি। এগুলো আগে আনা মান; নতুন তথ্য না আসা পর্যন্ত আবহাওয়ার পরামর্শ বন্ধ।',
          )}
        </p>
      )}
      {!error && !weatherIsRecent(data) && (
        <p role="status" className="notice-amber">
          {t(
            'The provider’s current timestamp is over three hours old or outside the accepted time range. Weather reminders are paused; review the source time.',
            'উৎসের বর্তমান সময় তিন ঘণ্টার বেশি পুরোনো বা গ্রহণযোগ্য সীমার বাইরে। আবহাওয়ার পরামর্শ বন্ধ; উৎসের সময় দেখুন।',
          )}
        </p>
      )}
      <dl className="live-weather-metrics">
        {metrics.map(({ icon: Icon, label, value }) => (
          <div key={label}>
            <dt>
              <Icon size={20} />
              {label}
            </dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      {compact && (
        <div className="forecast-preview">
          {data.days.slice(0, 2).map((day) => (
            <div key={day.date}>
              <strong>{day.date}</strong>
              <span>
                {formatWeatherValue(day.minimum, '°C')} → {formatWeatherValue(day.maximum, '°C')}
              </span>
              <span>
                {t('Forecast rain', 'বৃষ্টির পূর্বাভাস')}: {formatWeatherValue(day.rain, 'mm')}
              </span>
            </div>
          ))}
        </div>
      )}
      <details className="forecast-details" open={!compact}>
        <summary>{t('See the seven-day forecast', 'সাত দিনের পূর্বাভাস দেখুন')}</summary>
        <div
          className="forecast-scroll"
          role="region"
          aria-label={t('Seven-day forecast', 'সাত দিনের পূর্বাভাস')}
          tabIndex={0}
        >
          <table>
            <caption>
              {t(
                'Forecast for the farm’s local dates. Amounts and probabilities are estimates, not guarantees.',
                'জমির স্থানীয় দিনের পূর্বাভাস। পরিমাণ ও সম্ভাবনা আনুমানিক, নিশ্চয়তা নয়।',
              )}
            </caption>
            <thead>
              <tr>
                <th scope="col">{t('Date', 'দিন')}</th>
                <th scope="col">{t('Low → high', 'কম → বেশি')}</th>
                <th scope="col">{t('Rain', 'বৃষ্টি')}</th>
                <th scope="col">{t('Rain chance', 'বৃষ্টির সম্ভাবনা')}</th>
              </tr>
            </thead>
            <tbody>
              {data.days.map((day) => (
                <tr key={day.date}>
                  <th scope="row">
                    {new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      timeZone: 'UTC',
                    }).format(new Date(`${day.date}T12:00:00Z`))}
                  </th>
                  <td>
                    {formatWeatherValue(day.minimum, '°C')} →{' '}
                    {formatWeatherValue(day.maximum, '°C')}
                  </td>
                  <td>{formatWeatherValue(day.rain, 'mm')}</td>
                  <td>{formatWeatherValue(day.rainProbability, '%')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
      <p className="weather-source">
        {t(
          'Current values are gridded model estimates, not a sensor on your field. Rain is for the displayed',
          'এখনকার মান গ্রিড মডেলের হিসাব, জমির সেন্সর নয়। বৃষ্টি দেখানো',
        )}{' '}
        {data.current.interval / 60}
        {t(
          '-minute interval. Refreshes every 10 minutes while this page is visible.',
          ' মিনিটের জন্য। পাতা দেখা অবস্থায় প্রতি ১০ মিনিটে আপডেট হয়।',
        )}{' '}
        {t('Checked', 'দেখা হয়েছে')}:{' '}
        {new Intl.DateTimeFormat(language === 'bn' ? 'bn-BD' : 'en', {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: data.timezone,
        }).format(new Date(data.fetchedAt))}
        .
      </p>
      <p className="weather-source">
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
          {t('Weather data by Open-Meteo', 'আবহাওয়ার তথ্য Open-Meteo')}
        </a>{' '}
        ·{' '}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY 4.0
        </a>{' '}
        ·{' '}
        <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer">
          {t('Original forecast record', 'মূল পূর্বাভাসের তথ্য')}
        </a>
      </p>
    </section>
  );
}
