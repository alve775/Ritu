import type { Localized } from './types';
import type { LiveWeather } from './live-weather';
import { weatherIsRecent } from './live-weather';
import type { TrackedPlan } from '../lib/journey-store';
import { activityKey } from '../lib/journey-store';
import { previewData } from '../data/preview';
export interface FarmReminder {
  id: string;
  title: Localized;
  detail: Localized;
  source: string;
}
/** Operational checks, not crop diagnosis, yield prediction, spray advice or irrigation doses. */
export function farmReminders(
  weather: LiveWeather | null,
  tracked: TrackedPlan | null,
  now = Date.now(),
): FarmReminder[] {
  const reminders: FarmReminder[] = [];
  if (weather) {
    if (weatherIsRecent(weather, now)) {
      const freezing = weather.days.slice(0, 3).find((d) => d.minimum !== null && d.minimum <= 0);
      if (freezing)
        reminders.push({
          id: 'freezing-air',
          title: { en: 'Review a freezing-air forecast', bn: 'হিমাঙ্কের পূর্বাভাস দেখুন' },
          detail: {
            en: `${freezing.date}: forecast minimum ${freezing.minimum} °C at 2 m. Check locally appropriate protection for sensitive crops; this does not predict frost damage on your field.`,
            bn: `${freezing.date}: ২ মিটারে সর্বনিম্ন ${freezing.minimum} °C পূর্বাভাস। সংবেদনশীল ফসলের স্থানীয় সুরক্ষা দেখুন; জমির ক্ষতির পূর্বাভাস নয়।`,
          },
          source: 'Open-Meteo 7-day forecast',
        });
      const rain = weather.days.slice(0, 3).find((d) => d.rain !== null && d.rain > 0);
      if (rain)
        reminders.push({
          id: 'rain-check',
          title: { en: 'Check the field before watering', bn: 'সেচের আগে জমি দেখুন' },
          detail: {
            en: `${rain.date}: ${rain.rain} mm rain is forecast${rain.rainProbability === null ? '' : ` (${rain.rainProbability}% chance)`}. Inspect root-zone moisture and water access before deciding on irrigation. Forecast rain is not measured water on your field.`,
            bn: `${rain.date}: ${rain.rain} মিমি বৃষ্টির পূর্বাভাস${rain.rainProbability === null ? '' : ` (${rain.rainProbability}% সম্ভাবনা)`}। সেচের সিদ্ধান্তের আগে শিকড়ের মাটি ও পানির সুযোগ দেখুন। পূর্বাভাস জমিতে মাপা বৃষ্টি নয়।`,
          },
          source: 'Open-Meteo forecast + UMN Extension irrigation scheduling',
        });
      else if (weather.days.slice(0, 3).every((d) => d.rain !== null))
        reminders.push({
          id: 'moisture-check',
          title: { en: 'Inspect root-zone moisture', bn: 'শিকড়ের মাটির আর্দ্রতা দেখুন' },
          detail: {
            en: 'The forecast reports no rain in the next three local days. Check field moisture and irrigation access; the forecast alone cannot tell you how much water the crop needs.',
            bn: 'আগামী স্থানীয় তিন দিনের পূর্বাভাসে বৃষ্টি নেই। মাটির আর্দ্রতা ও সেচের সুযোগ দেখুন; শুধু পূর্বাভাসে ফসলের পানির পরিমাণ জানা যায় না।',
          },
          source: 'Open-Meteo forecast + UMN Extension irrigation scheduling',
        });
    }
  }
  if (!tracked) {
    reminders.push({
      id: 'save-plan',
      title: { en: 'Choose and save your crop calendar', bn: 'ফসলের ক্যালেন্ডার বেছে রাখুন' },
      detail: {
        en: 'Confirm your field conditions and locally reviewed crop dates. Once a calendar is saved, RITU can show your next planned crop task alongside weather.',
        bn: 'জমির শর্ত ও স্থানীয়ভাবে যাচাইকৃত সময় নিশ্চিত করুন। ক্যালেন্ডার রাখলে আবহাওয়ার পাশে পরের পরিকল্পিত কাজ দেখা যাবে।',
      },
      source: 'Your farm workflow',
    });
    return reminders;
  }
  const active = tracked.rotation.periods.find(
    (p) =>
      p.crop !== 'fallow' &&
      tracked.records[activityKey(p.crop, p.start, p.duration)]?.planted &&
      !tracked.records[activityKey(p.crop, p.start, p.duration)]?.harvested,
  );
  if (active) {
    const crop = previewData.crops[active.crop],
      record = tracked.records[activityKey(active.crop, active.start, active.duration)];
    reminders.push({
      id: 'field-observation',
      title: { en: `Inspect your ${crop.name.en} field`, bn: `${crop.name.bn} জমি দেখুন` },
      detail: {
        en: record.plantedDate
          ? `You recorded planting on ${record.plantedDate}. Inspect the crop and record what you observe. A date does not establish its growth stage or diagnose a problem.`
          : 'Record the actual planting date if known, then add field observations. RITU does not infer crop stage from a calendar or photograph.',
        bn: record.plantedDate
          ? `${record.plantedDate}-এ রোপণ লেখা আছে। ফসল দেখে বাস্তব পর্যবেক্ষণ লিখুন। শুধু দিনে গাছের পর্যায় বা রোগ জানা যায় না।`
          : 'জানা থাকলে আসল রোপণের দিন ও জমির পর্যবেক্ষণ লিখুন। ক্যালেন্ডার বা ছবিতে গাছের পর্যায় ধরে নেওয়া হয় না।',
      },
      source: 'Your recorded planting and field notes',
    });
  } else {
    const next = tracked.rotation.periods.find(
      (p) =>
        p.crop !== 'fallow' && !tracked.records[activityKey(p.crop, p.start, p.duration)]?.planted,
    );
    if (next) {
      const date = new Date(Date.UTC(tracked.year, 2 + next.start, 1)),
        crop = previewData.crops[next.crop];
      reminders.push({
        id: 'next-crop',
        title: {
          en: `Review the next ${crop.name.en} planting window`,
          bn: `পরের ${crop.name.bn} রোপণের সময় দেখুন`,
        },
        detail: {
          en: `Saved window begins in ${date.toISOString().slice(0, 7)}. Confirm cultivar, field readiness and local timing before planting; this calendar is an experimental template.`,
          bn: `রাখা সময়ের শুরু ${date.toISOString().slice(0, 7)}। রোপণের আগে জাত, জমির প্রস্তুতি ও স্থানীয় সময় নিশ্চিত করুন; ক্যালেন্ডার পরীক্ষামূলক।`,
        },
        source: 'Your saved calendar',
      });
    } else
      reminders.push({
        id: 'finish-cycle',
        title: { en: 'Review your completed cycle', bn: 'সম্পূর্ণ মৌসুমের হিসাব দেখুন' },
        detail: {
          en: 'Keep harvest observations and crop history before planning the next rotation.',
          bn: 'পরের ফসলক্রমের আগে কাটার পর্যবেক্ষণ ও আগের ফসলের তথ্য রাখুন।',
        },
        source: 'Your recorded tasks',
      });
  }
  return reminders;
}
