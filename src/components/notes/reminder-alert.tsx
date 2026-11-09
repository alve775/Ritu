'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BellRing } from 'lucide-react';
import { usePlanner } from '../planner-provider';
import { Dialog } from '../dialog';
import { seasonStore, useSeasonFarms } from '../../lib/season-store';
import { fieldLogStore, useFieldLog } from '../../lib/field-log-store';
import { calendarDayHref, calendarFarmFor } from '../../lib/plot-calendar';
import { dueReminders, reminderMinutes, type FieldNote } from '../../domain/field-log';
import { plusDays } from '../../domain/rotation';
import { rotationText } from '../rotation/rotation-text';
import { reminderTimeLabel } from './note-parts';
import { useToday } from '../../lib/use-today';

const seenKey = 'ritu-reminders-seen',
  notifiedKey = 'ritu-reminders-notified';

/**
 * Due reminders pop up when Ritu opens (once a day per tab). With notifications allowed, the phone
 * is also told once per reminder while Ritu is open or installed; Ritu has no server to wake it.
 */
export function ReminderAlert() {
  const { t, language } = usePlanner(),
    { state, ready } = useSeasonFarms(),
    log = useFieldLog(),
    router = useRouter();
  const tx = rotationText(t, language);
  const today = useToday(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [dismissed, setDismissed] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(seenKey);
    } catch {
      return null; // Shows every time when storage is blocked.
    }
  });
  // Notes of a plot no longer used do not remind.
  const stoppedPlot = (n: FieldNote) =>
    state.plots?.some((p) => p.id === n.plotId && !!p.endDate && p.endDate < today);
  const due = log.ready
    ? dueReminders(
        log.state.notes.filter((n) => !stoppedPlot(n)),
        today,
      )
    : [];
  // Pop up only what was due when Ritu opened or the day changed; a reminder set for today while
  // working shows in the Today card and the menu count instead of interrupting.
  const [opened, setOpened] = useState<{ day: string; ids: string[] } | null>(null);
  if (log.ready && opened?.day !== today) setOpened({ day: today, ids: due.map((n) => n.id) });
  const popup = due.filter((n) => opened?.ids.includes(n.id));
  const plotName = (n: FieldNote) => {
    const p = state.plots?.find((x) => x.id === n.plotId),
      f = state.fields?.find((x) => x.id === p?.fieldId);
    return p ? `${p.name}${f ? ` · ${f.name}` : ''}` : '';
  };
  // Checked again every minute, so a reminder set for a clock time is sent at that minute.
  const [, setTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 60000);
    return () => clearInterval(timer);
  }, []);
  // Phone notifications, at most once a day per reminder, from its time of day.
  useEffect(() => {
    if (
      !log.state.notify ||
      typeof Notification === 'undefined' ||
      Notification.permission !== 'granted'
    )
      return;
    const now = new Date(),
      minutes = now.getHours() * 60 + now.getMinutes();
    let sent: Record<string, string> = {};
    try {
      sent = JSON.parse(localStorage.getItem(notifiedKey) ?? '{}');
    } catch {
      /* Start fresh. */
    }
    let changed = false;
    for (const n of due) {
      if (
        sent[n.id] === today ||
        (n.reminder!.date === today && minutes < reminderMinutes(n.reminder!.time))
      )
        continue;
      try {
        new Notification(t('Ritu reminder', 'ঋতু রিমাইন্ডার'), {
          body: `${n.text || t('Photo note', 'ছবির নোট')} · ${plotName(n)}`,
          tag: n.id,
        });
        sent[n.id] = today;
        changed = true;
      } catch {
        /* Some phones only allow notifications from an installed app. */
      }
    }
    if (changed)
      try {
        localStorage.setItem(notifiedKey, JSON.stringify(sent));
      } catch {
        /* Not critical. */
      }
  });
  if (!ready || !popup.length || dismissed === today) return null;
  const close = () => {
    setDismissed(today);
    try {
      sessionStorage.setItem(seenKey, today);
    } catch {
      /* Closed for this view only. */
    }
  };
  const openDay = (n: FieldNote) => {
    const farm = calendarFarmFor(state, n.plotId);
    close();
    if (farm) {
      seasonStore.activate(farm.id);
      router.push(calendarDayHref(n.reminder!.date));
    } else router.push(`/notes?plot=${n.plotId}`);
  };
  return (
    <Dialog title={t('Reminder', 'মনে করিয়ে দেওয়া')} onClose={close} className="reminder-dialog">
      <p className="reminder-lead">
        <span className="reminder-bell" aria-hidden="true">
          <BellRing size={24} />
        </span>
        {t(
          `${popup.length} job${popup.length === 1 ? ' is' : 's are'} due`,
          `${tx.n(popup.length)}টি কাজের সময় হয়েছে`,
        )}
      </p>
      {popup.map((n) => (
        <div key={n.id} className="reminder-item">
          <b>{n.text || t('Photo note', 'ছবির নোট')}</b>
          <small>
            {plotName(n)} ·{' '}
            {n.reminder!.date < today
              ? t(
                  `was due ${tx.dateMain(n.reminder!.date)}`,
                  `ছিল ${tx.dateMain(n.reminder!.date)}`,
                )
              : `${t('Today', 'আজ')} ${reminderTimeLabel(n.reminder!.time, t)}`}
          </small>
          <div className="reminder-actions">
            <button
              className="button primary"
              type="button"
              onClick={() => fieldLogStore.setReminderDone(n.id, true)}
            >
              {t('Done', 'হয়ে গেছে')}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => fieldLogStore.moveReminder(n.id, plusDays(today, 1))}
            >
              {t('Remind me tomorrow', 'কাল আবার মনে করান')}
            </button>
            <button className="text-button" type="button" onClick={() => openDay(n)}>
              {t('Open the day', 'দিনটি খুলুন')}
            </button>
          </div>
        </div>
      ))}
      <button className="text-button" type="button" onClick={close}>
        {t('Later', 'পরে দেখব')}
      </button>
    </Dialog>
  );
}
