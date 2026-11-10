import type { LiveWeather } from '../../domain/live-weather';
import {
  daysInMonth,
  monthIndex,
  pumpHours,
  type BigEvent,
  type CropStage,
  type DayItem,
  type MonthlyClimate,
  type QuietDay,
} from '../../domain/rotation';
import { nasaWeekOn, type NasaWeek } from '../../domain/nasa-local';
import type { RotationText, Translate } from './rotation-text';

export type WeatherIcon = 'sun' | 'cloud' | 'rain';
/** One day's weather: the Open-Meteo forecast when the day is in it, else NASA's usual for the month. */
export type DayWeather =
  | {
      kind: 'forecast';
      max: number | null;
      min: number | null;
      rain: number | null;
      chance: number | null;
      wind: number | null;
      icon: WeatherIcon;
    }
  | {
      kind: 'usual';
      max: number;
      min: number;
      monthRain: number;
      wetness: number | null;
      /** NASA IMERG and SMAP for the date's week, when the land is in the Rajshahi box. */
      nasa: NasaWeek | null;
      icon: WeatherIcon;
    };
export function dayWeather(
  date: string,
  weather: LiveWeather | null,
  climate: MonthlyClimate,
): DayWeather {
  const f = weather?.days.find((d) => d.date === date);
  if (f) {
    const wet = (f.rain ?? 0) >= 1 || (f.rainProbability ?? 0) >= 50;
    return {
      kind: 'forecast',
      max: f.maximum,
      min: f.minimum,
      rain: f.rain,
      chance: f.rainProbability,
      wind: f.wind,
      icon: wet ? 'rain' : (f.rainProbability ?? 0) >= 25 ? 'cloud' : 'sun',
    };
  }
  const m = monthIndex(date),
    perDay = climate.rain[m] / daysInMonth(date);
  return {
    kind: 'usual',
    max: climate.max[m],
    min: climate.min[m],
    monthRain: climate.rain[m],
    wetness: climate.wetness[m],
    nasa: nasaWeekOn(climate.nasa, date),
    icon: perDay >= 4 ? 'rain' : perDay >= 1 ? 'cloud' : 'sun',
  };
}
export const weatherWord = (w: DayWeather, t: Translate) =>
  w.icon === 'rain'
    ? t('Rain', 'বৃষ্টি')
    : w.icon === 'cloud'
      ? t('Cloudy', 'মেঘলা')
      : t('Sunny', 'রোদ');
export const wetWord = (v: number | null, t: Translate) =>
  v === null
    ? t('Not available', 'তথ্য নেই')
    : v < 0.35
      ? t('Dry', 'শুকনো')
      : v < 0.6
        ? t('Slightly moist', 'মাঝারি ভেজা')
        : t('Wet', 'ভেজা');

/** SMAP root-zone wetness (0 driest to 1 wettest in the Rajshahi region) in words. */
export const rootWord = (v: number | null, t: Translate) =>
  v === null
    ? t('Not available', 'তথ্য নেই')
    : v < 0.35
      ? t('Usually dry', 'সাধারণত শুকনো')
      : v < 0.6
        ? t('Usually slightly moist', 'সাধারণত একটু ভেজা')
        : t('Usually moist', 'সাধারণত ভেজা');
/** Usual IMERG rain for a week in words. */
export const weekRainText = (mm: number, tx: RotationText, t: Translate) =>
  mm < 0.5
    ? t('Usually none', 'সাধারণত হয় না')
    : t(`Usually ${Math.round(mm)} mm`, `সাধারণত ${tx.n(Math.round(mm))} মিমি`);

export const stageName = (s: CropStage, t: Translate) =>
  ({
    sow: t('Sowing', 'বোনা'),
    young: t('Seedling', 'চারা'),
    grow: t('Growing', 'বাড়ছে'),
    flower: t('Flower / grain', 'ফুল/দানা'),
    harvest: t('Ripening', 'পাকছে'),
  })[s];

/** Colour class of a day item: water, done, missed, heat, sow, fertiliser or care. */
export const itemClass = (i: DayItem) =>
  i.kind === 'irrigate'
    ? 'water'
    : i.kind === 'irrigated'
      ? 'done'
      : i.kind === 'missed' || i.kind === 'heat' || i.kind === 'lost'
        ? 'risk'
        : i.kind === 'job'
          ? i.job.kind === 'fertiliser'
            ? 'fert'
            : 'care'
          : 'sow';

export function itemText(i: DayItem, tx: RotationText, t: Translate, areaHa: number) {
  switch (i.kind) {
    case 'sow':
      return i.recorded
        ? t(`${tx.crop(i.crop)} sown`, `${tx.crop(i.crop)} বোনা হয়েছে`)
        : t(`Sow ${tx.crop(i.crop)}`, `${tx.crop(i.crop)} বোনার দিন`);
    case 'harvest':
      return t(`Harvest ${tx.crop(i.crop)}`, `${tx.crop(i.crop)} কাটা`);
    case 'lost':
      return t(`${tx.crop(i.crop)} lost`, `${tx.crop(i.crop)} নষ্ট হয়েছে`);
    case 'irrigate':
      if (i.window.presow)
        return t(
          `Water before sowing · about ${pumpHours(i.window.mm, areaHa)} pump hours`,
          `বোনার আগে সেচ · পাম্পে প্রায় ${tx.n(pumpHours(i.window.mm, areaHa))} ঘণ্টা`,
        );
      return i.first
        ? t(
            `Irrigate · about ${pumpHours(i.window.mm, areaHa)} pump hours`,
            `সেচ দিন · পাম্পে প্রায় ${tx.n(pumpHours(i.window.mm, areaHa))} ঘণ্টা`,
          )
        : t('Irrigate this week', 'এই সপ্তাহে সেচ দিন');
    case 'irrigated':
      return i.window.presow
        ? t('Watered before sowing', 'বোনার আগে সেচ দেওয়া হয়েছে')
        : t('Irrigated', 'সেচ দেওয়া হয়েছে');
    case 'missed':
      return t('Irrigation missed', 'সেচ বাকি রয়ে গেছে');
    case 'heat':
      return t(
        `Too hot (about ${Math.round(i.maxC)}°)`,
        `বেশি গরম (প্রায় ${tx.n(Math.round(i.maxC))}°)`,
      );
    case 'job':
      return t(i.job.en, i.job.bn);
  }
}
/** Short calendar tag for a day's main item. */
export function itemTag(i: DayItem, t: Translate) {
  return {
    sow: t('Sow', 'বোনা'),
    harvest: t('Harvest', 'কাটা'),
    lost: t('Lost', 'নষ্ট'),
    irrigate:
      i.kind === 'irrigate' && i.window.presow ? t('Pre-sow', 'আগে সেচ') : t('Irrigate', 'সেচ'),
    irrigated: t('✓ Irrigated', '✓ সেচ'),
    missed: t('Missed', 'বাকি'),
    heat: t('Hot', 'গরম'),
    job: i.kind === 'job' && i.job.kind === 'fertiliser' ? t('Fertiliser', 'সার') : t('Job', 'কাজ'),
  }[i.kind];
}
export function quietText(q: QuietDay, tx: RotationText, t: Translate) {
  switch (q.kind) {
    case 'ripening':
      return t('Ripening: no irrigation', 'ফসল পাকছে: সেচ দেবেন না');
    case 'walk':
      return t('Walk the field', 'খেত ঘুরে দেখুন');
    case 'can-sow':
      return t(`${tx.crop(q.crop)} can be sown`, `${tx.crop(q.crop)} বোনা যায়`);
    case 'plough':
      return t(`Plough for ${tx.crop(q.crop)}`, `জমি চাষ দিন (${tx.crop(q.crop)} বোনার জন্য)`);
    default:
      return t('Field empty', 'জমি খালি');
  }
}
export function eventText(e: BigEvent, tx: RotationText, t: Translate, areaHa: number) {
  const crop = tx.crop(e.c.a.item.crop);
  switch (e.kind) {
    case 'sow':
      return {
        title: t(`Sow ${crop}`, `${crop} বোনা`),
        note: t(
          `Good window ${tx.dateMain(e.c.a.item.windowStart)} – ${tx.dateMain(e.c.a.item.windowEnd)}`,
          `ভালো সময় ${tx.dateMain(e.c.a.item.windowStart)} – ${tx.dateMain(e.c.a.item.windowEnd)}`,
        ),
      };
    case 'irrigate':
      if (e.window.presow)
        return {
          title: t(`${crop}: water before sowing`, `${crop}: বোনার আগে সেচ`),
          note: t(
            `The soil is usually dry then (NASA SMAP) · about ${pumpHours(e.window.mm, areaHa)} pump hours`,
            `তখন মাটি সাধারণত শুকনো থাকে (নাসা SMAP) · পাম্পে প্রায় ${tx.n(pumpHours(e.window.mm, areaHa))} ঘণ্টা`,
          ),
        };
      return {
        title: t(`${crop}: next irrigation`, `${crop}: পরের সেচ`),
        note: t(
          `${e.c.windows.length} irrigations this crop · about ${pumpHours(e.window.mm, areaHa)} pump hours`,
          `এই ফসলে মোট ${tx.n(e.c.windows.length)}টি সেচ · পাম্পে প্রায় ${tx.n(pumpHours(e.window.mm, areaHa))} ঘণ্টা`,
        ),
      };
    case 'job':
      return {
        title: `${crop}: ${t(e.job.en, e.job.bn)}`,
        note:
          e.job.kind === 'fertiliser'
            ? t('Fertiliser', 'সার')
            : t('Key stage', 'গুরুত্বপূর্ণ সময়'),
      };
    case 'heat':
      return {
        title: t(`${crop}: heat risk`, `${crop}: গরমের ঝুঁকি`),
        note: t(
          `About ${Math.round(e.week.maxC)}°, copes up to ${e.c.a.item.crop.heat?.limitC}°`,
          `প্রায় ${tx.n(Math.round(e.week.maxC))}°, সহ্য করে ${tx.n(e.c.a.item.crop.heat?.limitC ?? 0)}° পর্যন্ত`,
        ),
      };
    case 'harvest':
      return {
        title: t(`Harvest ${crop}`, `${crop} কাটা`),
        note: t('Around this day', 'প্রায় এই দিনে'),
      };
  }
}
export const inDays = (k: number, tx: RotationText, t: Translate) =>
  k <= 0
    ? t('Today', 'আজ')
    : k === 1
      ? t('Tomorrow', 'কাল')
      : t(`In ${k} days`, `${tx.n(k)} দিন পরে`);
