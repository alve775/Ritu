import { validDate } from './evidence-planner';
import type { LiveWeather } from './live-weather';

/** Quick choices for when in the day a reminder is due. */
export const reminderTimes = ['morning', 'noon', 'evening'] as const;
export type ReminderPreset = (typeof reminderTimes)[number];
/** A quick choice, or a clock time the farmer picked, 'HH:MM' on a 24-hour clock. */
export type ReminderTime = ReminderPreset | `${number}:${number}`;
export const isClockTime = (time: string): time is `${number}:${number}` =>
  /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
/** Minutes after midnight when a reminder is due: 7 am, 12 noon, 6 pm or the picked time. */
export function reminderMinutes(time: ReminderTime) {
  if (time === 'morning') return 7 * 60;
  if (time === 'noon') return 12 * 60;
  if (time === 'evening') return 18 * 60;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}
export interface NoteReminder {
  date: string;
  time: ReminderTime;
  done: boolean;
}
/** What a note is about; the farmer picks any number when writing it. */
export const noteTags = [
  'pest',
  'disease',
  'water',
  'fertiliser',
  'weeds',
  'weather',
  'buying',
] as const;
export type NoteTag = (typeof noteTags)[number];
export const weatherIcons = ['sun', 'cloud', 'rain'] as const;
/** The forecast for the note's day, kept with the note: Ritu stores no past weather otherwise. */
export interface NoteWeather {
  icon: (typeof weatherIcons)[number];
  maxC: number | null;
  minC: number | null;
  /** Chance of rain, %. */
  rain: number | null;
  /** km/h. */
  wind: number | null;
  /** Relative humidity, %. */
  humidity: number | null;
}
/** A farmer's note about one plot on one day, with an optional photo and reminder. */
export interface FieldNote {
  id: string;
  plotId: string;
  /** The day the note is about. */
  date: string;
  text: string;
  /** Key of the photo in the on-device photo store. */
  photoId?: string;
  reminder?: NoteReminder;
  tags?: NoteTag[];
  weather?: NoteWeather;
  createdAt: string;
  updatedAt?: string;
}
/** One irrigation the farmer recorded for a planned irrigation week of a plot's crop. */
export interface IrrigationRecord {
  plotId: string;
  /** `${season}:${weekStart}` of the planned irrigation week. */
  key: string;
  date: string;
  savedAt: string;
}
export interface FieldLogState {
  version: 1;
  notes: FieldNote[];
  irrigations: IrrigationRecord[];
  /** The farmer allowed phone notifications for due reminders. */
  notify: boolean;
}
export const blankFieldLog: FieldLogState = {
  version: 1,
  notes: [],
  irrigations: [],
  notify: false,
};
export const noteTextLimit = 2000;

const id = (v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= 120;
const time = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v));

export function validReminder(value: unknown): value is NoteReminder {
  if (!value || typeof value !== 'object') return false;
  const r = value as NoteReminder;
  return (
    validDate(r.date) &&
    typeof r.time === 'string' &&
    ((reminderTimes as readonly string[]).includes(r.time) || isClockTime(r.time)) &&
    typeof r.done === 'boolean'
  );
}
const reading = (v: unknown, lo: number, hi: number) =>
  v === null || (typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi);
export function validNoteWeather(value: unknown): value is NoteWeather {
  if (!value || typeof value !== 'object') return false;
  const w = value as NoteWeather;
  return (
    weatherIcons.includes(w.icon) &&
    reading(w.maxC, -60, 70) &&
    reading(w.minC, -60, 70) &&
    reading(w.rain, 0, 100) &&
    reading(w.wind, 0, 400) &&
    reading(w.humidity, 0, 100)
  );
}
export function validNote(value: unknown): value is FieldNote {
  if (!value || typeof value !== 'object') return false;
  const n = value as FieldNote;
  return (
    id(n.id) &&
    id(n.plotId) &&
    validDate(n.date) &&
    typeof n.text === 'string' &&
    n.text.length <= noteTextLimit &&
    (n.photoId === undefined || id(n.photoId)) &&
    (n.text.trim().length > 0 || n.photoId !== undefined) &&
    (n.reminder === undefined || validReminder(n.reminder)) &&
    (n.tags === undefined ||
      (Array.isArray(n.tags) &&
        n.tags.every((t) => noteTags.includes(t)) &&
        new Set(n.tags).size === n.tags.length)) &&
    (n.weather === undefined || validNoteWeather(n.weather)) &&
    time(n.createdAt) &&
    (n.updatedAt === undefined || time(n.updatedAt))
  );
}
export function validIrrigation(value: unknown): value is IrrigationRecord {
  if (!value || typeof value !== 'object') return false;
  const r = value as IrrigationRecord;
  return (
    id(r.plotId) &&
    typeof r.key === 'string' &&
    // A week's irrigation, or the one before sowing (season:presow:window start).
    /^(winter|pre-monsoon|monsoon):(presow:)?\d{4}-\d{2}-\d{2}$/.test(r.key) &&
    validDate(r.date) &&
    time(r.savedAt)
  );
}
export function validFieldLog(raw: unknown): raw is FieldLogState {
  if (!raw || typeof raw !== 'object') return false;
  const s = raw as FieldLogState;
  return (
    s.version === 1 &&
    Array.isArray(s.notes) &&
    s.notes.length <= 5000 &&
    s.notes.every(validNote) &&
    new Set(s.notes.map((n) => n.id)).size === s.notes.length &&
    Array.isArray(s.irrigations) &&
    s.irrigations.length <= 5000 &&
    s.irrigations.every(validIrrigation) &&
    new Set(s.irrigations.map((r) => `${r.plotId}|${r.key}`)).size === s.irrigations.length &&
    typeof s.notify === 'boolean'
  );
}

/** Reminders that are not done and due on or before `today`, oldest first. */
export function dueReminders(notes: FieldNote[], today: string) {
  return notes
    .filter((n) => n.reminder && !n.reminder.done && n.reminder.date <= today)
    .sort((a, b) => a.reminder!.date.localeCompare(b.reminder!.date));
}
export type ReminderStatus = 'done' | 'overdue' | 'today' | 'later';
export function reminderStatus(r: NoteReminder, today: string): ReminderStatus {
  return r.done ? 'done' : r.date < today ? 'overdue' : r.date === today ? 'today' : 'later';
}

/** The forecast for a note's day, to keep with the note; undefined when the forecast does not cover it. */
export function noteWeatherFor(date: string, weather: LiveWeather | null | undefined) {
  const f = weather?.days.find((d) => d.date === date);
  if (!f || !weather) return undefined;
  const wet = (f.rain ?? 0) >= 1 || (f.rainProbability ?? 0) >= 50;
  const round = (v: number | null) => (v === null ? null : Math.round(v));
  const out: NoteWeather = {
    icon: wet ? 'rain' : (f.rainProbability ?? 0) >= 25 ? 'cloud' : 'sun',
    maxC: round(f.maximum),
    minC: round(f.minimum),
    rain: round(f.rainProbability),
    wind: round(f.wind),
    // Humidity is only known for now, so it is kept for today's notes.
    humidity: weather.current.time.slice(0, 10) === date ? round(weather.current.humidity) : null,
  };
  return validNoteWeather(out) ? out : undefined;
}
