import { describe, expect, it } from 'vitest';
import {
  blankFieldLog,
  dueReminders,
  reminderStatus,
  validFieldLog,
  validNote,
  type FieldNote,
} from './field-log';

const note = (patch: Partial<FieldNote> = {}): FieldNote => ({
  id: 'n1',
  plotId: 'p1',
  date: '2026-11-08',
  text: 'Pump is making a noise',
  createdAt: '2026-11-08T05:00:00Z',
  ...patch,
});

describe('field log', () => {
  it('accepts a text note, a photo-only note and a note with a reminder', () => {
    expect(validNote(note())).toBe(true);
    expect(validNote(note({ text: '', photoId: 'ph1' }))).toBe(true);
    expect(
      validNote(note({ reminder: { date: '2026-11-09', time: 'morning', done: false } })),
    ).toBe(true);
  });
  it('rejects an empty note, a bad date and a bad reminder time', () => {
    expect(validNote(note({ text: '  ' }))).toBe(false);
    expect(validNote(note({ date: '2026-13-01' }))).toBe(false);
    expect(
      validNote(
        note({ reminder: { date: '2026-11-09', time: 'night' as 'morning', done: false } }),
      ),
    ).toBe(false);
  });
  it('rejects duplicate notes and duplicate irrigation records', () => {
    expect(validFieldLog({ ...blankFieldLog, notes: [note(), note()] })).toBe(false);
    const r = {
      plotId: 'p1',
      key: 'winter:2027-01-01',
      date: '2027-01-02',
      savedAt: '2027-01-02T03:00:00Z',
    };
    expect(validFieldLog({ ...blankFieldLog, irrigations: [r] })).toBe(true);
    expect(validFieldLog({ ...blankFieldLog, irrigations: [r, r] })).toBe(false);
  });
  it('finds due reminders, oldest first, and skips done ones', () => {
    const notes = [
      note({ id: 'a', reminder: { date: '2026-11-08', time: 'evening', done: false } }),
      note({ id: 'b', reminder: { date: '2026-11-05', time: 'morning', done: false } }),
      note({ id: 'c', reminder: { date: '2026-11-04', time: 'morning', done: true } }),
      note({ id: 'd', reminder: { date: '2026-11-09', time: 'morning', done: false } }),
    ];
    expect(dueReminders(notes, '2026-11-08').map((n) => n.id)).toEqual(['b', 'a']);
    expect(reminderStatus(notes[1].reminder!, '2026-11-08')).toBe('overdue');
    expect(reminderStatus(notes[0].reminder!, '2026-11-08')).toBe('today');
    expect(reminderStatus(notes[3].reminder!, '2026-11-08')).toBe('later');
  });
  it('keeps tags and the day weather, and rejects unknown tags or impossible readings', () => {
    const weather = { icon: 'sun' as const, maxC: 29, minC: 17, rain: 10, wind: 8, humidity: 64 };
    expect(validNote(note({ tags: ['pest', 'water'], weather }))).toBe(true);
    expect(validNote(note({ weather: { ...weather, maxC: null, rain: null } }))).toBe(true);
    expect(validNote(note({ tags: ['pest', 'pest'] }))).toBe(false);
    expect(validNote(note({ tags: ['gossip' as 'pest'] }))).toBe(false);
    expect(validNote(note({ weather: { ...weather, rain: 140 } }))).toBe(false);
  });
});
