'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Check, NotebookPen, Search } from 'lucide-react';
import { usePlanner } from '../planner-provider';
import { seasonStore, useSeasonFarms } from '../../lib/season-store';
import { fieldLogStore, useFieldLog } from '../../lib/field-log-store';
import { calendarDayHref, calendarFarmFor } from '../../lib/plot-calendar';
import {
  noteTags,
  reminderStatus,
  reminderMinutes,
  type FieldNote,
  type NoteTag,
} from '../../domain/field-log';
import { defaultSite } from '../../domain/farm-site';
import { useLiveWeather } from '../../lib/use-live-weather';
import { plusDays, schedulePlan } from '../../domain/rotation';
import { rotationText } from '../rotation/rotation-text';
import { seasonClass } from '../rotation/rotation-visuals';
import { NoteComposer, NoteList, noteTagLabel, reminderTimeLabel } from './note-parts';
import { useToday } from '../../lib/use-today';

type Filter = 'all' | 'reminders' | 'photos';
const urlPlot = () =>
  typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('plot');

/**
 * Your diary: a header band with the land and plot dropdowns (nothing chosen until the farmer picks,
 * except when opened from a plot's calendar), the upcoming reminders across all plots, then the chosen
 * plot's note box and field diary.
 */
export function NotesPage() {
  const { t, language } = usePlanner(),
    { state } = useSeasonFarms(),
    log = useFieldLog().state,
    router = useRouter();
  const tx = rotationText(t, language);
  const today = useToday(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const plots = useMemo(() => (state.plots ?? []).filter((p) => !p.endDate), [state.plots]);
  const fields = (state.fields ?? []).filter((f) => plots.some((p) => p.fieldId === f.id));
  // Opened from a plot's calendar (/notes?plot=ID): that plot is already chosen.
  const [plotId, setPlotId] = useState<string | null>(urlPlot),
    [landId, setLandId] = useState<string | null>(
      () => plots.find((p) => p.id === urlPlot())?.fieldId ?? null,
    ),
    [scope, setScope] = useState('all'),
    [filter, setFilter] = useState<Filter>('all'),
    [tag, setTag] = useState<NoteTag | null>(null),
    [query, setQuery] = useState(''),
    [notifyMessage, setNotifyMessage] = useState('');
  const land = fields.find((f) => f.id === landId) ?? null;
  const plot = plots.find((p) => p.id === plotId && p.fieldId === land?.id) ?? null;
  // The plot's forecast, so a new note keeps its day's weather.
  const weather = useLiveWeather(land?.site ?? defaultSite, !!land?.site && !!plot);
  if (!plots.length)
    return (
      <div className="page notes-page">
        <header className="page-header">
          <div>
            <h1>{t('Your diary', 'আপনার ডায়েরি')}</h1>
            <p>{t('Notes are kept for each plot.', 'প্রতিটি প্লটের নোট আলাদা থাকে।')}</p>
          </div>
        </header>
        <section className="card">
          <p>{t('Add a land and a plot first.', 'আগে একটি জমি ও প্লট যোগ করুন।')}</p>
          <Link className="button primary" href="/farms">
            {t('Open the dashboard', 'ড্যাশবোর্ড খুলুন')}
          </Link>
        </section>
      </div>
    );
  const plotsOf = (fieldId: string) => plots.filter((p) => p.fieldId === fieldId);
  const sequence = (id: string) => {
    const p = plots.find((x) => x.id === id);
    if (!p?.plan) return t('No year plan yet', 'এখনো বছরের পরিকল্পনা নেই');
    return schedulePlan(p.plan.seasons, p.plan.from)
      .items.map((i) => tx.crop(i.crop))
      .join(' → ');
  };
  const where = (id: string) => {
    const p = plots.find((x) => x.id === id),
      f = fields.find((x) => x.id === p?.fieldId);
    return p ? `${p.name} · ${f?.name ?? ''}` : '';
  };
  const openDay = (note: FieldNote) => {
    const farm = calendarFarmFor(state, note.plotId);
    if (!farm) return undefined;
    return () => {
      seasonStore.activate(farm.id);
      router.push(
        calendarDayHref(note.reminder && !note.reminder.done ? note.reminder.date : note.date),
      );
    };
  };
  // The crop of the plan in the field on a day, for the diary's day headings.
  const cropFor = (date: string) => {
    if (!plot?.plan) return undefined;
    const item = schedulePlan(plot.plan.seasons, plot.plan.from).items.find(
      (i) => i.sow <= date && date < i.harvest,
    );
    return item ? { label: tx.crop(item.crop), className: seasonClass(item.season) } : undefined;
  };
  const plotNotes = plot ? log.notes.filter((n) => n.plotId === plot.id) : [];
  const counts = {
    all: plotNotes.length,
    reminders: plotNotes.filter((n) => n.reminder).length,
    photos: plotNotes.filter((n) => n.photoId).length,
  };
  const due = plotNotes.filter(
    (n) => n.reminder && !n.reminder.done && n.reminder.date <= today,
  ).length;
  const usedTags = noteTags.filter((k) => plotNotes.some((n) => n.tags?.includes(k)));
  // Search reads the note and its topic names.
  const q = query.trim().toLowerCase();
  const words = (n: FieldNote) =>
    [n.text, ...(n.tags ?? []).map((k) => noteTagLabel(k, t))].join(' ').toLowerCase();
  const shown = plotNotes.filter(
    (n) =>
      (filter !== 'reminders' || n.reminder) &&
      (filter !== 'photos' || n.photoId) &&
      (!tag || n.tags?.includes(tag)) &&
      (!q || words(n).includes(q)),
  );
  // Reminders strip: all plots, one land, or one plot.
  const inScope = (n: FieldNote) => {
    if (scope === 'all') return true;
    if (scope.startsWith('land:'))
      return plots.find((p) => p.id === n.plotId)?.fieldId === scope.slice(5);
    return n.plotId === scope;
  };
  const upcoming = log.notes
    .filter((n) => n.reminder && !n.reminder.done && plots.some((p) => p.id === n.plotId))
    .filter(inScope)
    .sort(
      (a, b) =>
        a.reminder!.date.localeCompare(b.reminder!.date) ||
        reminderMinutes(a.reminder!.time) - reminderMinutes(b.reminder!.time),
    );
  const toggleNotify = async () => {
    setNotifyMessage('');
    if (log.notify) return fieldLogStore.setNotify(false);
    if (!('Notification' in window)) {
      setNotifyMessage(
        t(
          'This browser cannot show notifications. The popup in Ritu still works.',
          'এই ব্রাউজারে নোটিফিকেশন হয় না। ঋতুর ভেতরের পপআপ কাজ করবে।',
        ),
      );
      return;
    }
    const permission =
      Notification.permission === 'default'
        ? await Notification.requestPermission()
        : Notification.permission;
    if (permission === 'granted') fieldLogStore.setNotify(true);
    else
      setNotifyMessage(
        t(
          'Notifications are blocked in this browser’s settings. The popup in Ritu still works.',
          'ব্রাউজারের সেটিংসে নোটিফিকেশন বন্ধ আছে। ঋতুর ভেতরের পপআপ কাজ করবে।',
        ),
      );
  };
  const plural = (count: number, one: string, many: string, bn: string) =>
    t(`${count} ${count === 1 ? one : many}`, `${tx.n(count)} ${bn}`);
  return (
    <div className="page notes-page">
      <section className="notes-hero" aria-label={t('Your diary', 'আপনার ডায়েরি')}>
        <div className="notes-hero-top">
          <div>
            <span className="notes-hero-eyebrow">
              <NotebookPen size={16} aria-hidden="true" />
              {t('NOTES & REMINDERS', 'নোট ও রিমাইন্ডার')}
            </span>
            <h1>{t('Your diary', 'আপনার ডায়েরি')}</h1>
          </div>
          <button
            type="button"
            className="notes-notify-pill"
            aria-pressed={log.notify}
            onClick={toggleNotify}
            title={t(
              'Also tells your phone while Ritu is open or added to the home screen. A popup always shows when Ritu opens.',
              'ঋতু খোলা থাকলে বা হোম স্ক্রিনে রাখা থাকলে ফোনেও জানাবে। ঋতু খুললে সবসময় পপআপ আসবে।',
            )}
          >
            {t('Phone alerts', 'ফোনে জানানো')} · {log.notify ? t('On', 'চালু') : t('Off', 'বন্ধ')}
            <span className="sw" aria-hidden="true" />
          </button>
        </div>
        {notifyMessage && (
          <p className="notes-hero-message" role="status">
            {notifyMessage}
          </p>
        )}
        <div className="notes-pickers">
          <label className="notes-pick">
            <span>{t('Land', 'জমি')}</span>
            <select
              value={land?.id ?? ''}
              onChange={(e) => {
                const id = e.target.value || null;
                setLandId(id);
                // A land with one plot needs no second choice.
                const only = id ? plotsOf(id) : [];
                setPlotId(only.length === 1 ? only[0].id : null);
              }}
            >
              <option value="">{t('Choose a land', 'জমি বাছুন')}</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
            <small>
              {land
                ? `${land.site?.name ? `${land.site.name} · ` : ''}${plural(plotsOf(land.id).length, 'plot', 'plots', 'টি প্লট')}`
                : t(`${fields.length} lands`, `${tx.n(fields.length)}টি জমি`)}
            </small>
          </label>
          <label className="notes-pick">
            <span>{t('Plot', 'প্লট')}</span>
            <select
              value={plot?.id ?? ''}
              disabled={!land}
              onChange={(e) => setPlotId(e.target.value || null)}
            >
              <option value="">
                {land
                  ? t('Choose a plot', 'প্লট বাছুন')
                  : t('Choose a land first', 'আগে জমি বাছুন')}
              </option>
              {land &&
                plotsOf(land.id).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
            <small>{plot ? sequence(plot.id) : ' '}</small>
          </label>
        </div>
        {plot && (
          <div className="notes-stats">
            <span>
              <b>{tx.n(counts.all)}</b> {t(counts.all === 1 ? 'note' : 'notes', 'নোট')}
            </span>
            <span className={due ? 'alert' : ''}>
              <b>{tx.n(due)}</b>{' '}
              {t(due === 1 ? 'reminder due' : 'reminders due', 'রিমাইন্ডার আজ বা বাকি')}
            </span>
            <span>
              <b>{tx.n(counts.photos)}</b> {t(counts.photos === 1 ? 'photo' : 'photos', 'ছবি')}
            </span>
          </div>
        )}
      </section>

      <section className="notes-rems" aria-label={t('Upcoming reminders', 'সামনের রিমাইন্ডার')}>
        <div className="notes-rems-head">
          <h2>
            <Bell size={20} aria-hidden="true" /> {t('Upcoming reminders', 'সামনের রিমাইন্ডার')}
          </h2>
          <select
            className="notes-scope"
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            aria-label={t('Which land or plot', 'কোন জমি বা প্লট')}
          >
            <option value="all">{t('All lands and plots', 'সব জমি ও প্লট')}</option>
            {fields.map((f) => (
              <optgroup key={f.id} label={f.name}>
                <option value={`land:${f.id}`}>
                  {t(`${f.name}: all plots`, `${f.name}: সব প্লট`)}
                </option>
                {plotsOf(f.id).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        {upcoming.length ? (
          <div className="notes-rem-strip">
            {upcoming.map((n) => {
              const r = n.reminder!,
                status = reminderStatus(r, today),
                when =
                  r.date === today
                    ? t('Today', 'আজ')
                    : r.date === plusDays(today, 1)
                      ? t('Tomorrow', 'কাল')
                      : tx.dateMain(r.date);
              return (
                <article key={n.id} className={`notes-rem-card ${status}`}>
                  <div className="notes-rem-date" aria-hidden="true">
                    <b>{tx.n(Number(r.date.slice(8, 10)))}</b>
                    <span>{tx.monthShort(Number(r.date.slice(5, 7)) - 1)}</span>
                  </div>
                  <div className="notes-rem-body">
                    <span className="when">
                      {status === 'overdue' ? `${t('Overdue', 'সময় পেরিয়েছে')} · ` : ''}
                      {when} · {reminderTimeLabel(r.time, t)}
                    </span>
                    <b>{n.text || t('Photo note', 'ছবির নোট')}</b>
                    <small>{where(n.plotId)}</small>
                    <button
                      type="button"
                      className="note-tool done"
                      onClick={() => fieldLogStore.setReminderDone(n.id, true)}
                    >
                      <Check size={16} aria-hidden="true" />
                      {t('Done', 'হয়ে গেছে')}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="notes-rem-empty">{t('No reminders here.', 'এখানে কোনো রিমাইন্ডার নেই।')}</p>
        )}
      </section>

      {plot ? (
        <section className="card notes-diary" aria-label={where(plot.id)}>
          <div className="notes-head">
            <h2>{t(`${plot.name} · field diary`, `${plot.name}-এর খেতের ডায়েরি`)}</h2>
            <span>
              {land?.name} · {sequence(plot.id)}
            </span>
          </div>
          <NoteComposer
            key={plot.id + today}
            plotId={plot.id}
            date={today}
            pickDate
            weather={weather.data}
            placeholder={t(
              'What did you see or do in the field today?',
              'আজ খেতে কী দেখলেন বা করলেন?',
            )}
          />
          <div className="notes-filters">
            <label className="notes-search">
              <Search size={18} aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('Search notes', 'নোট খুঁজুন')}
                aria-label={t('Search notes', 'নোট খুঁজুন')}
              />
            </label>
            <div className="segmented" role="radiogroup" aria-label={t('Show', 'দেখান')}>
              {(
                [
                  ['all', t('All', 'সব')],
                  ['reminders', t('Reminders', 'রিমাইন্ডার')],
                  ['photos', t('With photo', 'ছবিসহ')],
                ] as const
              ).map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="note-filter"
                    checked={filter === value}
                    onChange={() => setFilter(value)}
                  />
                  {label}
                  <small className="count">{tx.n(counts[value])}</small>
                </label>
              ))}
            </div>
          </div>
          {usedTags.length > 0 && (
            <div className="note-tag-filter" role="group" aria-label={t('Topics', 'বিষয়')}>
              {usedTags.map((k) => (
                <button
                  key={k}
                  type="button"
                  className={`note-tag-option tag-${k}`}
                  aria-pressed={tag === k}
                  onClick={() => setTag(tag === k ? null : k)}
                >
                  <i aria-hidden="true" />
                  {noteTagLabel(k, t)}
                  {tag === k && <Check size={14} aria-hidden="true" />}
                </button>
              ))}
            </div>
          )}
          <NoteList
            notes={shown}
            today={today}
            byDay
            cropFor={cropFor}
            weather={weather.data}
            openDay={openDay}
            empty={
              plotNotes.length
                ? t('No matching notes.', 'মিলে যায় এমন নোট নেই।')
                : t(
                    'No notes for this plot yet. Write one above.',
                    'এই প্লটে এখনো নোট নেই। উপরে লিখে রাখুন।',
                  )
            }
          />
        </section>
      ) : (
        <section className="notes-choose">
          <NotebookPen size={28} aria-hidden="true" />
          <p>
            {land
              ? t(
                  'Choose a plot above to write notes and see its field diary.',
                  'নোট লিখতে ও খেতের ডায়েরি দেখতে উপরে একটি প্লট বাছুন।',
                )
              : t(
                  'Choose a land and a plot above to write notes and see the field diary.',
                  'নোট লিখতে ও খেতের ডায়েরি দেখতে উপরে জমি ও প্লট বাছুন।',
                )}
          </p>
        </section>
      )}
    </div>
  );
}
