'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Bell,
  CalendarDays,
  Camera,
  Check,
  Cloud,
  CloudRain,
  MoreHorizontal,
  Pencil,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { usePlanner } from '../planner-provider';
import { Dialog } from '../dialog';
import { fieldLogStore } from '../../lib/field-log-store';
import { deletePhoto, putPhoto, shrinkPhoto, useNotePhoto } from '../../lib/note-photos';
import type { LiveWeather } from '../../domain/live-weather';
import type { Language } from '../../domain/types';
import {
  noteTags,
  noteTextLimit,
  noteWeatherFor,
  reminderStatus,
  reminderTimes,
  type FieldNote,
  type NoteReminder,
  type NoteTag,
  type NoteWeather,
  type ReminderTime,
} from '../../domain/field-log';
import { plusDays } from '../../domain/rotation';
import { rotationText } from '../rotation/rotation-text';

type Translate = (en: string, bn: string) => string;
export const reminderTimeLabel = (time: ReminderTime, t: Translate) =>
  ({
    morning: t('7 am', 'সকাল ৭টা'),
    noon: t('12 noon', 'দুপুর ১২টা'),
    evening: t('6 pm', 'সন্ধ্যা ৬টা'),
  })[time];
export const noteTagLabel = (tag: NoteTag, t: Translate) =>
  ({
    pest: t('Pests', 'পোকা'),
    disease: t('Disease', 'রোগ'),
    water: t('Water', 'সেচ'),
    fertiliser: t('Fertiliser', 'সার'),
    weeds: t('Weeds', 'আগাছা'),
    weather: t('Weather', 'আবহাওয়া'),
    buying: t('Buying', 'কেনাকাটা'),
  })[tag];
/** Add or remove one tag; an updater, so quick taps never lose a tag. */
const toggled = (tag: NoteTag) => (tags: NoteTag[]) =>
  tags.includes(tag) ? tags.filter((x) => x !== tag) : [...tags, tag];
const weatherWord = (w: NoteWeather, t: Translate) =>
  w.icon === 'rain'
    ? t('Rain', 'বৃষ্টি')
    : w.icon === 'cloud'
      ? t('Cloudy', 'মেঘলা')
      : t('Sunny', 'রোদ');
function WeatherIcon({ icon, size = 20 }: { icon: NoteWeather['icon']; size?: number }) {
  const Icon = icon === 'rain' ? CloudRain : icon === 'cloud' ? Cloud : Sun;
  return <Icon className={`wx-${icon}`} size={size} aria-hidden="true" />;
}
/** Time a note was written, e.g. "সকাল ১০:২০" or "10:20 am". */
function writtenAt(iso: string, language: Language, n: (v: number | string) => string) {
  const d = new Date(iso);
  const h = d.getHours(),
    m = String(d.getMinutes()).padStart(2, '0'),
    h12 = ((h + 11) % 12) + 1;
  if (language === 'en') return `${h12}:${m} ${h < 12 ? 'am' : 'pm'}`;
  const part =
    h < 5
      ? 'রাত'
      : h < 12
        ? 'সকাল'
        : h < 16
          ? 'দুপুর'
          : h < 18
            ? 'বিকেল'
            : h < 20
              ? 'সন্ধ্যা'
              : 'রাত';
  return `${part} ${n(h12)}:${n(m)}`;
}

/** Topic tags as pills with a coloured dot; chosen ones fill with their colour. */
function TagPicker({
  value,
  onToggle,
  label,
}: {
  value: NoteTag[];
  onToggle: (tag: NoteTag) => void;
  label: string;
}) {
  const { t } = usePlanner();
  return (
    <div className="note-tag-pick" role="group" aria-label={label}>
      {noteTags.map((tag) => {
        const on = value.includes(tag);
        return (
          <button
            key={tag}
            type="button"
            className={`note-tag-option tag-${tag}`}
            aria-pressed={on}
            onClick={() => onToggle(tag)}
          >
            <i aria-hidden="true" />
            {noteTagLabel(tag, t)}
            {on && <Check size={14} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
export function NoteTags({ tags }: { tags: NoteTag[] }) {
  const { t } = usePlanner();
  return (
    <span className="note-tags">
      {tags.map((tag) => (
        <span key={tag} className={`note-tag tag-${tag}`}>
          <i aria-hidden="true" />
          {noteTagLabel(tag, t)}
        </span>
      ))}
    </span>
  );
}

type QuickDay = 1 | 3 | 7 | 'pick';
/** Write a note for a plot: text and/or a photo, topic tags, and an optional reminder. */
export function NoteComposer({
  plotId,
  date,
  pickDate = false,
  weather,
  label,
  placeholder,
}: {
  plotId: string;
  date: string;
  /** Let the farmer change the note's day (the notes page); otherwise the note is for `date`. */
  pickDate?: boolean;
  /** The plot's forecast: the note keeps its day's weather. */
  weather?: LiveWeather | null;
  label?: string;
  placeholder?: string;
}) {
  const { t, language } = usePlanner();
  const tx = rotationText(t, language);
  const [text, setText] = useState(''),
    [noteDate, setNoteDate] = useState(date),
    [tags, setTags] = useState<NoteTag[]>([]),
    [photo, setPhoto] = useState<Blob | null>(null),
    [remind, setRemind] = useState(false),
    [quick, setQuick] = useState<QuickDay>(1),
    [remDate, setRemDate] = useState(plusDays(date, 1)),
    [remTime, setRemTime] = useState<ReminderTime>('morning'),
    [message, setMessage] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null),
    [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  // Parents give the composer a `key` per day, so the dates reset when the day changes.
  const preview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => () => (preview ? URL.revokeObjectURL(preview) : undefined), [preview]);
  const reminderDay = quick === 'pick' ? remDate : plusDays(noteDate, quick);
  const choosePhoto = async (file: File | undefined) => {
    if (!file) return;
    setMessage(null);
    try {
      setPhoto(await shrinkPhoto(file));
    } catch {
      setMessage({ kind: 'error', text: t('This photo could not be read.', 'ছবিটি পড়া যায়নি।') });
    }
  };
  const save = async () => {
    if (!text.trim() && !photo) {
      setMessage({
        kind: 'error',
        text: t('Write something or add a photo.', 'কিছু লিখুন বা একটি ছবি দিন।'),
      });
      return;
    }
    setBusy(true);
    setMessage(null);
    let photoId: string | undefined;
    try {
      if (photo) {
        photoId = crypto.randomUUID();
        await putPhoto(photoId, photo);
      }
      const reminder: NoteReminder | undefined = remind
        ? { date: reminderDay, time: remTime, done: false }
        : undefined;
      const dayWeather = noteWeatherFor(noteDate, weather);
      fieldLogStore.addNote({
        plotId,
        date: noteDate,
        text: text.trim(),
        photoId,
        reminder,
        ...(tags.length ? { tags } : {}),
        ...(dayWeather ? { weather: dayWeather } : {}),
      });
      setText('');
      setTags([]);
      setPhoto(null);
      setRemind(false);
      if (fileRef.current) fileRef.current.value = '';
      setMessage({
        kind: 'ok',
        text: reminder
          ? t('Note and reminder saved.', 'নোট ও রিমাইন্ডার রাখা হয়েছে।')
          : t('Note saved.', 'নোট রাখা হয়েছে।'),
      });
    } catch {
      if (photoId) deletePhoto(photoId).catch(() => undefined);
      setMessage({
        kind: 'error',
        text: t(
          'Could not save on this phone. Free some space and try again.',
          'এই ফোনে রাখা গেল না। কিছু জায়গা খালি করে আবার চেষ্টা করুন।',
        ),
      });
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="note-composer">
      <textarea
        value={text}
        maxLength={noteTextLimit}
        rows={3}
        onChange={(e) => setText(e.target.value)}
        aria-label={label ?? t('Note', 'নোট')}
        placeholder={
          placeholder ?? t('What did you see or do in the field?', 'খেতে কী দেখলেন বা করলেন?')
        }
      />
      <div className="note-tag-zone">
        <span className="note-tag-label">
          {t('About what? (pick any)', 'কী নিয়ে? (একাধিক বাছতে পারেন)')}
        </span>
        <TagPicker
          value={tags}
          onToggle={(tag) => setTags(toggled(tag))}
          label={t('Note topics', 'নোটের বিষয়')}
        />
      </div>
      {preview && (
        <div className="note-composer-photo">
          {/* eslint-disable-next-line @next/next/no-img-element -- a local photo, not a page image */}
          <img src={preview} alt={t('Photo to save', 'যে ছবি রাখা হবে')} />
          <button className="text-button danger" type="button" onClick={() => setPhoto(null)}>
            <X size={16} aria-hidden="true" />
            {t('Remove photo', 'ছবি বাদ দিন')}
          </button>
        </div>
      )}
      <div className="note-actions">
        <label className="note-action photo">
          <Camera size={20} aria-hidden="true" />
          {photo ? t('Change photo', 'ছবি বদলান') : t('Add photo', 'ছবি তুলুন')}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => choosePhoto(e.target.files?.[0])}
          />
        </label>
        <button
          type="button"
          className="note-action remind"
          aria-pressed={remind}
          onClick={() => setRemind(!remind)}
        >
          <Bell size={20} aria-hidden="true" />
          {t('Remind me', 'মনে করিয়ে দিন')}
        </button>
        {pickDate && (
          <label className="note-action date">
            <CalendarDays size={20} aria-hidden="true" />
            <span className="sr-only">{t('Day of the note', 'নোটের দিন')}</span>
            <input
              type="date"
              value={noteDate}
              onChange={(e) => e.target.value && setNoteDate(e.target.value)}
            />
          </label>
        )}
      </div>
      {remind && (
        <div
          className="note-reminder-fields"
          role="group"
          aria-label={t('Remind me on', 'কবে মনে করাবে?')}
        >
          <span>{t('When?', 'কবে?')}</span>
          {(
            [
              [1, t('Tomorrow', 'কাল')],
              [3, t('In 3 days', '৩ দিন পরে')],
              [7, t('In a week', '১ সপ্তাহ পরে')],
              ['pick', t('Pick a day', 'অন্য দিন')],
            ] as const
          ).map(([value, text]) => (
            <button
              key={value}
              type="button"
              className="note-option"
              aria-pressed={quick === value}
              onClick={() => setQuick(value)}
            >
              {text}
            </button>
          ))}
          {quick === 'pick' && (
            <input
              type="date"
              value={remDate}
              min={noteDate}
              aria-label={t('Reminder day', 'রিমাইন্ডারের দিন')}
              onChange={(e) => e.target.value && setRemDate(e.target.value)}
            />
          )}
          <span aria-hidden="true">·</span>
          {reminderTimes.map((time) => (
            <button
              key={time}
              type="button"
              className="note-option"
              aria-pressed={remTime === time}
              onClick={() => setRemTime(time)}
            >
              {reminderTimeLabel(time, t)}
            </button>
          ))}
          <small>{tx.date(reminderDay)}</small>
        </div>
      )}
      <div className="note-save-row">
        {message && (
          <p className={message.kind === 'error' ? 'field-error' : 'note-saved'} role="status">
            {message.text}
          </p>
        )}
        <button className="button primary note-save" type="button" disabled={busy} onClick={save}>
          {t('Save note', 'নোট রাখুন')}
        </button>
      </div>
    </div>
  );
}

export function ReminderChip({ reminder, today }: { reminder: NoteReminder; today: string }) {
  const { t, language } = usePlanner();
  const tx = rotationText(t, language);
  const status = reminderStatus(reminder, today);
  const when =
    reminder.date === plusDays(today, 1) ? t('tomorrow', 'কাল') : tx.dateMain(reminder.date);
  const label = {
    done: t('Done', 'হয়ে গেছে'),
    today: `${t('Today', 'আজ')} · ${reminderTimeLabel(reminder.time, t)}`,
    overdue: `${t('Overdue', 'সময় পেরিয়েছে')} · ${tx.dateMain(reminder.date)}`,
    later: t(
      `Reminder: ${when} ${reminderTimeLabel(reminder.time, t)}`,
      `মনে করাবে: ${when} ${reminderTimeLabel(reminder.time, t)}`,
    ),
  }[status];
  return (
    <span className={`reminder-chip ${status}`}>
      {status === 'done' ? (
        <Check size={14} aria-hidden="true" />
      ) : (
        <Bell size={14} aria-hidden="true" />
      )}
      {label}
    </span>
  );
}

function NotePhoto({ id, className = 'note-photo' }: { id: string; className?: string }) {
  const { t } = usePlanner();
  const url = useNotePhoto(id);
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element -- a photo from this phone's store
    <img className={className} src={url} alt={t('Note photo', 'নোটের ছবি')} />
  ) : (
    <span className={`${className} missing`}>
      {t('Photo on the phone it was taken on', 'ছবি যে ফোনে তোলা সেখানে আছে')}
    </span>
  );
}

/** The day's weather saved with its notes, in one line. */
export function DayWeatherLine({ weather }: { weather?: NoteWeather }) {
  const { t, language } = usePlanner();
  const tx = rotationText(t, language);
  if (!weather)
    return (
      <p className="note-day-weather none">
        {t('No weather saved for this day', 'এই দিনের আবহাওয়া রাখা হয়নি')}
      </p>
    );
  const deg = (v: number | null) => (v === null ? '–' : `${tx.n(v)}°`);
  return (
    <p className="note-day-weather" aria-label={t('Weather on this day', 'এই দিনের আবহাওয়া')}>
      <span className="temp">
        <WeatherIcon icon={weather.icon} size={22} />
        <b>{deg(weather.maxC)}</b> / {deg(weather.minC)} · {weatherWord(weather, t)}
      </span>
      {weather.rain !== null && (
        <span>
          {t('Rain', 'বৃষ্টি')} <b>{tx.n(weather.rain)}%</b>
        </span>
      )}
      {weather.wind !== null && (
        <span>
          {t('Wind', 'বাতাস')}{' '}
          <b>
            {tx.n(weather.wind)} {t('km/h', 'কিমি/ঘ')}
          </b>
        </span>
      )}
      {weather.humidity !== null && (
        <span>
          {t('Humidity', 'আর্দ্রতা')} <b>{tx.n(weather.humidity)}%</b>
        </span>
      )}
    </p>
  );
}

export interface CropLabel {
  label: string;
  className: string;
}
function NoteCard({
  note,
  today,
  menuOpen,
  setMenu,
  onOpenDay,
  onDelete,
  onPhoto,
}: {
  note: FieldNote;
  today: string;
  menuOpen: boolean;
  setMenu: (open: boolean) => void;
  onOpenDay?: () => void;
  onDelete: () => void;
  onPhoto: () => void;
}) {
  const { t, language } = usePlanner();
  const tx = rotationText(t, language);
  const [editing, setEditing] = useState(false),
    [draft, setDraft] = useState(note.text),
    [draftTags, setDraftTags] = useState<NoteTag[]>(note.tags ?? []);
  const due = note.reminder && !note.reminder.done && note.reminder.date <= today;
  if (editing)
    return (
      <article className="note-card editing">
        <div className="note-main">
          <textarea
            value={draft}
            maxLength={noteTextLimit}
            rows={3}
            onChange={(e) => setDraft(e.target.value)}
            aria-label={t('Edit note', 'নোট বদলান')}
          />
          <TagPicker
            value={draftTags}
            onToggle={(tag) => setDraftTags(toggled(tag))}
            label={t('Note topics', 'নোটের বিষয়')}
          />
          <div className="button-row">
            <button
              className="button primary"
              type="button"
              disabled={!draft.trim() && !note.photoId}
              onClick={() => {
                fieldLogStore.updateNote(note.id, { text: draft.trim(), tags: draftTags });
                setEditing(false);
              }}
            >
              {t('Save', 'রাখুন')}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                setDraft(note.text);
                setDraftTags(note.tags ?? []);
                setEditing(false);
              }}
            >
              {t('Cancel', 'বাতিল')}
            </button>
          </div>
        </div>
      </article>
    );
  return (
    <article className={`note-card ${due ? 'due' : ''}`}>
      <div className="note-main">
        <span className="sr-only">{tx.date(note.date)}</span>
        {note.text && <p className="note-text">{note.text}</p>}
        {!!note.tags?.length && <NoteTags tags={note.tags} />}
        <div className="note-meta">
          <span>{writtenAt(note.createdAt, language, tx.n)}</span>
          {note.reminder && <ReminderChip reminder={note.reminder} today={today} />}
          <span className="note-tools">
            {note.reminder && !note.reminder.done && (
              <button
                className="note-tool done"
                type="button"
                onClick={() => fieldLogStore.setReminderDone(note.id, true)}
              >
                <Check size={16} aria-hidden="true" />
                {t('Mark done', 'হয়ে গেছে')}
              </button>
            )}
            <span className="note-menu-wrap">
              <button
                className="note-tool"
                type="button"
                aria-label={t('More', 'আরও')}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                onClick={(e) => {
                  e.stopPropagation();
                  setMenu(!menuOpen);
                }}
              >
                <MoreHorizontal size={18} aria-hidden="true" />
              </button>
              {menuOpen && (
                <span className="note-menu" role="menu">
                  {onOpenDay && (
                    <button role="menuitem" type="button" onClick={onOpenDay}>
                      <CalendarDays size={17} aria-hidden="true" />
                      {t('Open in calendar', 'ক্যালেন্ডারে দেখুন')}
                    </button>
                  )}
                  <button
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setMenu(false);
                      setEditing(true);
                    }}
                  >
                    <Pencil size={17} aria-hidden="true" />
                    {t('Edit', 'বদলান')}
                  </button>
                  <button role="menuitem" type="button" className="danger" onClick={onDelete}>
                    <Trash2 size={17} aria-hidden="true" />
                    {t('Delete', 'মুছুন')}
                  </button>
                </span>
              )}
            </span>
          </span>
        </div>
      </div>
      {note.photoId && (
        <button
          className="note-thumb"
          type="button"
          onClick={onPhoto}
          aria-label={t('Open photo', 'ছবি বড় করে দেখুন')}
        >
          <NotePhoto id={note.photoId} className="note-thumb-img" />
        </button>
      )}
    </article>
  );
}

/**
 * Notes as a field diary: grouped by day with the crop and the saved weather, or a plain list for one
 * day. Delete has a short undo; the photo is removed only once the undo has passed.
 */
export function NoteList({
  notes,
  today,
  cropFor,
  openDay,
  byDay = false,
  weather,
  empty,
}: {
  notes: FieldNote[];
  today: string;
  /** The plot's forecast: a day with no weather saved in its notes shows the forecast when it covers the day. */
  weather?: LiveWeather | null;
  /** The plan's crop in the field on a day, shown in the day heading. */
  cropFor?: (date: string) => CropLabel | undefined;
  openDay?: (note: FieldNote) => (() => void) | undefined;
  byDay?: boolean;
  empty?: string;
}) {
  const { t, language } = usePlanner();
  const tx = rotationText(t, language);
  const [removed, setRemoved] = useState<FieldNote | null>(null),
    [menu, setMenu] = useState<string | null>(null),
    [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    if (!removed) return;
    const timer = setTimeout(() => {
      if (removed.photoId) deletePhoto(removed.photoId).catch(() => undefined);
      setRemoved(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [removed]);
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [menu]);
  const sorted = [...notes].sort(
    (a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
  );
  const days = byDay ? [...new Set(sorted.map((n) => n.date))] : [];
  const card = (note: FieldNote) => (
    <NoteCard
      key={note.id}
      note={note}
      today={today}
      menuOpen={menu === note.id}
      setMenu={(open) => setMenu(open ? note.id : null)}
      onOpenDay={openDay?.(note)}
      onPhoto={() => setPhoto(note.photoId ?? null)}
      onDelete={() => {
        setMenu(null);
        if (removed?.photoId) deletePhoto(removed.photoId).catch(() => undefined);
        setRemoved(fieldLogStore.removeNote(note.id) ?? null);
      }}
    />
  );
  const dayTitle = (d: string) =>
    d === today
      ? t('Today', 'আজ')
      : d === plusDays(today, -1)
        ? t('Yesterday', 'গতকাল')
        : tx.dateMain(d);
  return (
    <div className="note-list">
      {removed && (
        <p className="note-undo" role="status">
          {t('Note deleted.', 'নোট মুছে ফেলা হয়েছে।')}
          <button
            className="text-button"
            type="button"
            onClick={() => {
              fieldLogStore.restoreNote(removed);
              setRemoved(null);
            }}
          >
            {t('Undo', 'ফিরিয়ে আনুন')}
          </button>
        </p>
      )}
      {!sorted.length && empty && <p className="note-empty">{empty}</p>}
      {byDay
        ? days.map((d) => {
            const dayNotes = sorted.filter((n) => n.date === d),
              crop = cropFor?.(d),
              sub = [d === today || d === plusDays(today, -1) ? tx.dateMain(d) : '', tx.dateSub(d)]
                .filter(Boolean)
                .join(' · ');
            return (
              <section key={d} className="note-day" aria-label={tx.date(d)}>
                <div className="note-day-head">
                  <div className="note-day-title">
                    <h3>{dayTitle(d)}</h3>
                    {sub && <span>{sub}</span>}
                    {crop && <span className={`note-crop ${crop.className}`}>{crop.label}</span>}
                  </div>
                  <DayWeatherLine
                    weather={dayNotes.find((n) => n.weather)?.weather ?? noteWeatherFor(d, weather)}
                  />
                </div>
                <div className="note-day-notes">{dayNotes.map(card)}</div>
              </section>
            );
          })
        : sorted.map(card)}
      {photo && (
        <Dialog title={t('Note photo', 'নোটের ছবি')} onClose={() => setPhoto(null)}>
          <NotePhoto id={photo} className="note-photo-large" />
        </Dialog>
      )}
    </div>
  );
}
