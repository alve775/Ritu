import type { Language } from '../../domain/types';
import type { Season } from '../../domain/evidence-planner';
import { rotationCrops, type HeatStage, type RotationCrop } from '../../data/rotation-crops';
import {
  banglaDate,
  banglaMonths,
  monthIndex,
  pumpHours,
  type CropAssessment,
  type Reason,
  type Verdict,
} from '../../domain/rotation';
import { localDigits } from '../../domain/numerals';

export type Translate = (en: string, bn: string) => string;
const enMonths = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];
const enMonthsLong = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const bnMonths = [
  'জানুয়ারি',
  'ফেব্রুয়ারি',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টেম্বর',
  'অক্টোবর',
  'নভেম্বর',
  'ডিসেম্বর',
];
const bnMonthsShort = [
  'জানু',
  'ফেব্রু',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টে',
  'অক্টো',
  'নভে',
  'ডিসে',
];

/**
 * Words and dates the farmer reads. In Bangla, dates show the English (Gregorian) date first, in
 * Bangla script, with the Bangla calendar date beside or under it; numbers use Bengali digits.
 */
export function rotationText(t: Translate, language: Language) {
  const n = (v: number | string) => localDigits(v, language);
  const day = (iso: string) => n(Number(iso.slice(8, 10)));
  /** The English-calendar date: "10 Nov" or "১০ নভেম্বর". */
  const dateMain = (iso: string) =>
    language === 'bn'
      ? `${day(iso)} ${bnMonths[monthIndex(iso)]}`
      : `${Number(iso.slice(8, 10))} ${enMonths[monthIndex(iso)]}`;
  /** The Bangla-calendar date, shown with the English one in Bangla: "২৫ কার্তিক". */
  const dateSub = (iso: string) => {
    if (language !== 'bn') return null;
    const b = banglaDate(iso);
    return `${n(b.day)} ${b.name.bn}`;
  };
  /** Both calendars on one line: "১০ নভেম্বর (২৫ কার্তিক)"; English mode: "10 Nov". */
  const date = (iso: string) =>
    language === 'bn' ? `${dateMain(iso)} (${dateSub(iso)})` : dateMain(iso);
  /** Compact date for chart axes: "১০ নভে" / "10 Nov". */
  const dateShort = (iso: string) =>
    language === 'bn' ? `${day(iso)} ${bnMonthsShort[monthIndex(iso)]}` : dateMain(iso);
  const weekdayIndex = (iso: string) => new Date(iso + 'T12:00:00Z').getUTCDay();
  /** Short weekday name, Sunday = 0. */
  const weekdayName = (d: number) =>
    language === 'bn'
      ? ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'][d]
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d];
  const weekday = (iso: string) => weekdayName(weekdayIndex(iso));
  const month = (iso: string) =>
    language === 'bn' ? bnMonths[monthIndex(iso)] : enMonthsLong[monthIndex(iso)];
  const monthShort = (m: number) => (language === 'bn' ? bnMonthsShort[m] : enMonths[m]);
  const crop = (c: RotationCrop) => c.name[language];
  const season = (s: Season) =>
    s === 'winter'
      ? {
          name: t('Winter (Rabi)', 'রবি'),
          span: t('about Nov–Feb', 'নভেম্বর–ফেব্রুয়ারি (অগ্রহায়ণ–ফাল্গুন)'),
        }
      : s === 'pre-monsoon'
        ? {
            name: t('Summer (Kharif I)', 'খরিফ-১'),
            span: t('about Mar–Jun', 'মার্চ–জুন (চৈত্র–আষাঢ়)'),
          }
        : {
            name: t('Rainy (Kharif II)', 'খরিফ-২'),
            span: t('about Jul–Oct', 'জুলাই–অক্টোবর (শ্রাবণ–কার্তিক)'),
          };
  const stage = (s: HeatStage) =>
    ({
      flowering: t('flowering', 'ফুল আসার'),
      grain: t('grain filling', 'দানা পুষ্ট হওয়ার'),
      pod: t('pod filling', 'শুঁটি ভরার'),
      tuber: t('tuber growth', 'আলু বড় হওয়ার'),
    })[s];
  const verdict = (v: Verdict) =>
    ({
      good: t('Good fit', 'ভালো হবে'),
      ok: t('OK', 'চলবে'),
      risky: t('Risky', 'ঝুঁকি আছে'),
      no: t("Doesn't fit", 'মিলবে না'),
    })[v];
  const soilName = (soil: string) =>
    ({ clay: t('clay', 'এঁটেল'), loam: t('loam', 'দোআঁশ'), sandy: t('sandy', 'বেলে') })[soil] ??
    soil;
  const irrigations = (count: number) =>
    t(`${count} irrigation${count === 1 ? '' : 's'}`, `${n(count)}টি সেচ`);

  function reason(r: Reason, a: CropAssessment, soil: string) {
    const c = a.item.crop;
    switch (r.kind) {
      case 'timing':
        return t(
          `${crop(r.problem.before)} is harvested about ${date(r.problem.harvest)}, after the last good day to sow ${crop(r.problem.after)} (${date(r.problem.latestSow)}).`,
          `${crop(r.problem.before)} কাটা হয় প্রায় ${date(r.problem.harvest)}, তখন ${crop(r.problem.after)} বোনার শেষ সময় (${date(r.problem.latestSow)}) পার হয়ে যায়।`,
        );
      case 'water':
        return t(
          `Needs about ${irrigations(a.irrigations)}, mostly in dry weeks.`,
          `প্রায় ${irrigations(a.irrigations)} লাগে, বেশির ভাগ শুকনো সময়ে।`,
        );
      case 'rainfed':
        return t(
          `Needs ${irrigations(a.irrigations)}, but this plot has little or no irrigation.`,
          `${irrigations(a.irrigations)} লাগে, কিন্তু এই প্লটে সেচের সুযোগ কম।`,
        );
      case 'heat': {
        const w = a.hottest!;
        return t(
          `${stage(c.heat!.stage)[0].toUpperCase() + stage(c.heat!.stage).slice(1)} falls in ${month(w.start)} heat (about ${Math.round(w.maxC)}°C; it copes up to ${c.heat!.limitC}°C).`,
          `${stage(c.heat!.stage)} সময় ${month(w.start)}-এর গরমে পড়ে (প্রায় ${n(Math.round(w.maxC))}°; সহ্য করে ${n(c.heat!.limitC)}° পর্যন্ত)।`,
        );
      }
      case 'soil':
        return t(
          `Grows poorly on ${soilName(soil)} soil.`,
          `${soilName(soil)} মাটিতে ভালো হয় না।`,
        );
      case 'ph': {
        const [lo, hi] = r.range,
          side = r.ph > hi ? t('above', 'বেশি') : t('below', 'কম');
        const tested = r.measured
          ? t(' (your soil test)', ' (আপনার মাটি পরীক্ষা)')
          : t(
              '. From the soil map; a soil test on your land would be more exact',
              '। মাটির মানচিত্র থেকে; জমির মাটি পরীক্ষা করলে আরও ঠিক হবে',
            );
        return r.ph > hi
          ? t(
              `Soil pH ${r.ph.toFixed(1)} is above what ${crop(c)} tolerates (${lo}–${hi})${tested}.`,
              `মাটির pH ${n(r.ph.toFixed(1))}, ${crop(c)} সহ্য করে ${n(lo)}–${n(hi)} পর্যন্ত; এটি ${side}${tested}।`,
            )
          : t(
              `Soil pH ${r.ph.toFixed(1)} is below what ${crop(c)} tolerates (${lo}–${hi})${tested}.`,
              `মাটির pH ${n(r.ph.toFixed(1))}, ${crop(c)} সহ্য করে ${n(lo)}–${n(hi)} পর্যন্ত; এটি ${side}${tested}।`,
            );
      }
      case 'drainage':
        return t(
          'Water stands on this plot, and this crop’s roots rot in wet soil.',
          'এই প্লটে পানি জমে, আর ভেজা মাটিতে এই ফসলের শিকড় পচে।',
        );
      case 'wear':
        return c.rice
          ? t(
              'Rice after rice keeps the same pests and diseases going.',
              'ধানের পর ধান করলে একই পোকা ও রোগ থেকে যায়।',
            )
          : a.sameFamilyAs
            ? t(
                a.item.crop.family === 'allium'
                  ? `Same plant family as last year's ${crop(rotationCrops[a.sameFamilyAs])}: they share soil diseases such as basal rot.`
                  : `Same plant family as last year's ${crop(rotationCrops[a.sameFamilyAs])}: they share soil diseases such as bacterial wilt.`,
                a.item.crop.family === 'allium'
                  ? `গত বছরের ${crop(rotationCrops[a.sameFamilyAs])}-এর একই গোত্রের ফসল: মাটির একই রোগ (যেমন গোড়া পচা রোগ) থেকে যায়।`
                  : `গত বছরের ${crop(rotationCrops[a.sameFamilyAs])}-এর একই গোত্রের ফসল: মাটির একই রোগ (যেমন ঢলে পড়া রোগ) থেকে যায়।`,
              )
            : t('Same crop as last year in this season.', 'গত বছরও এই মৌসুমে একই ফসল ছিল।');
      case 'pulse':
        return t(
          'A pulse: it leaves nitrogen in the soil for the next crop.',
          'ডাল ফসল: পরের ফসলের জন্য মাটিতে নাইট্রোজেন রেখে যায়।',
        );
      case 'rain':
        return t(
          `Rain and soil water cover most of it: only ${irrigations(a.irrigations)}.`,
          `বৃষ্টি আর মাটির পানিতেই বেশির ভাগ চলে: মাত্র ${irrigations(a.irrigations)}।`,
        );
      case 'cool':
        return t('Grows in the cool weeks, no heat risk.', 'ঠান্ডা সময়ে হয়, গরমের ঝুঁকি নেই।');
      default:
        return t('Suits this land’s soil.', 'এই জমির মাটিতে ভালো হয়।');
    }
  }
  /** NASA IMERG dry-spell risk in a crop's flowering weeks, with what to prepare. */
  function dry(a: CropAssessment, areaHa: number) {
    const d = a.dry;
    if (!d) return '';
    const c = a.item.crop,
      st = c.heat ? stage(c.heat.stage) : t('flowering', 'ফুল আসার'),
      hours = pumpHours(d.reliedMm, areaHa),
      count = t(
        `${d.extra} extra irrigation${d.extra === 1 ? '' : 's'}`,
        `বাড়তি ${n(d.extra)}টি সেচ`,
      );
    const base = t(
      `In ${d.years} of ${d.samples} years a 3-week dry spell hit ${crop(c)}'s ${st} weeks in this area (NASA IMERG). Keep ${count} ready (about ${hours} pump hours on this plot).`,
      `এই এলাকায় ${n(d.samples)} বছরের ${n(d.years)} বছরে ${crop(c)}-এর ${st} সময়ে টানা ৩ সপ্তাহ বৃষ্টি হয়নি (নাসা IMERG)। ${count}-এর প্রস্তুতি রাখুন (এই প্লটে পাম্পে প্রায় ${n(hours)} ঘণ্টা)।`,
    );
    return d.raisesWater
      ? base +
          t(
            ' This plot has little water to spare, so the risk is high.',
            ' এই প্লটে বাড়তি পানি কম, তাই ঝুঁকি বেশি।',
          )
      : d.high
        ? base +
          t(
            ' With a reliable pump this is only extra pumping.',
            ' নির্ভরযোগ্য পাম্প থাকলে শুধু বাড়তি সেচ লাগবে।',
          )
        : base;
  }
  /** The irrigation before sowing that NASA SMAP calls for. */
  function presow(a: CropAssessment, areaHa: number) {
    if (!a.presow) return '';
    const hours = pumpHours(a.presow, areaHa);
    return t(
      `Water the field once before sowing ${crop(a.item.crop)}: the soil here is usually dry in ${month(a.item.sow)} (NASA SMAP). About ${hours} pump hours.`,
      `${crop(a.item.crop)} বোনার আগে জমিতে একবার সেচ দিন: ${month(a.item.sow)}-এ এখানের মাটি সাধারণত শুকনো থাকে (নাসা SMAP)। পাম্পে প্রায় ${n(hours)} ঘণ্টা।`,
    );
  }
  return {
    dry,
    presow,
    n,
    date,
    dateMain,
    dateSub,
    dateShort,
    month,
    monthShort,
    weekday,
    weekdayName,
    weekdayIndex,
    crop,
    season,
    stage,
    verdict,
    soilName,
    irrigations,
    reason,
    banglaMonths,
  };
}
export type RotationText = ReturnType<typeof rotationText>;
