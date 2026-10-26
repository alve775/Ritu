'use client';
import { usePlanner } from './legacy-planner-provider';
import { siteFor } from '../data/demo-environment';
import { useLiveWeather } from '../lib/use-live-weather';
import { WeatherContent } from './weather-panel';
import { farmReminders } from '../domain/farm-reminders';
import type { TrackedPlan } from '../lib/journey-store';
export function FarmMonitor({ tracked }: { tracked: TrackedPlan | null }) {
  const { t, demo, language } = usePlanner();
  const site = tracked?.site ?? siteFor(demo);
  const weather = useLiveWeather(site);
  const reminders = farmReminders(weather.error ? null : weather.data, tracked);
  return (
    <section className="farm-monitor" aria-labelledby="monitor-heading">
      <h2 id="monitor-heading">
        {t('Your field today & what to check next', 'আজকের জমি ও পরের করণীয়')}
      </h2>
      <p>
        {t(
          tracked && !tracked.site
            ? 'This older calendar has no saved location. Weather uses your current setup pin; resave the calendar to attach its farm location. Updates do not mark tasks completed.'
            : 'Weather follows the location saved with this calendar. Updates do not change your dates or mark tasks completed.',
          tracked && !tracked.site
            ? 'পুরোনো ক্যালেন্ডারে স্থান রাখা নেই। এখনকার পিনের আবহাওয়া দেখায়; স্থান যুক্ত করতে ক্যালেন্ডার আবার রাখুন। আপডেটে কাজ সম্পূর্ণ হয় না।'
            : 'আবহাওয়া এই ক্যালেন্ডারের সঙ্গে রাখা স্থানের। আপডেটে সময় বদলায় না বা কাজ নিজে থেকে সম্পূর্ণ হয় না।',
        )}
      </p>
      <WeatherContent site={site} result={weather} />
      <section className="next-checks" aria-labelledby="next-check-heading">
        <h3 id="next-check-heading">{t('Your next checks', 'পরের যাচাই')}</h3>
        <ul>
          {reminders.map((reminder) => (
            <li key={reminder.id}>
              <h4>{reminder.title[language]}</h4>
              <p>{reminder.detail[language]}</p>
              <small>
                {t('Based on', 'ভিত্তি')}: {reminder.source}
              </small>
            </li>
          ))}
        </ul>
        <p className="weather-source">
          {t(
            'These are planning and observation reminders. Precise watering, fertilizer, pest treatment and crop-stage advice require field measurements and locally reviewed agronomy.',
            'এগুলো পরিকল্পনা ও পর্যবেক্ষণের স্মরণ। সঠিক সেচ, সার, রোগের চিকিৎসা ও পর্যায়ের পরামর্শে জমির মাপ ও স্থানীয় কৃষি যাচাই দরকার।',
          )}
        </p>
        <a
          className="text-button"
          href="https://extension.umn.edu/natural-resources/conservation/agricultural-soil-and-water/basics-of-irrigation-scheduling"
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('Why field moisture must be checked', 'কেন জমির আর্দ্রতা দেখা দরকার')}
        </a>
      </section>
    </section>
  );
}
