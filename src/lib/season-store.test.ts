import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { seasonStore, seasonStorageKey, validSeasonState } from './season-store';
import { trackingFarm } from '../../tests/fixtures/tracking-farm';

const farm = (id = 'created', creationKey = 'confirmed-choice') => ({
  ...trackingFarm(),
  id,
  creationKey,
});
let entries: Map<string, string>;
beforeEach(() => {
  entries = new Map();
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  });
  seasonStore.reset();
});
afterEach(() => {
  vi.unstubAllGlobals();
});

describe('farm creation recovery', () => {
  it('keeps retry identity stable but assigns a new operation for another planting', () => {
    seasonStore.selectField(null);
    const first = seasonStore.getSnapshot().state.draftOperationId;
    expect(first).toBeTruthy();
    seasonStore.confirm('same-land-and-date');
    expect(seasonStore.getSnapshot().state.draftOperationId).toBe(first);
    seasonStore.confirm('same-land-and-date');
    expect(seasonStore.getSnapshot().state.draftOperationId).toBe(first);
    seasonStore.selectField(null);
    expect(seasonStore.getSnapshot().state.draftOperationId).not.toBe(first);
    seasonStore.reset();
    expect(seasonStore.getSnapshot().state.draftOperationId).toBeNull();
  });
  it('adds an operation on confirmation of an older draft without changing its land key', () => {
    seasonStore.confirm('legacy-land-key');
    const state = seasonStore.getSnapshot().state;
    expect(state.confirmedKey).toBe('legacy-land-key');
    expect(state.draftOperationId).toMatch(/^[\da-f-]{36}$/);
  });
  it('validates operation ids without rejecting older saved states', () => {
    const state = seasonStore.getSnapshot().state;
    for (const draftOperationId of ['', 12, {}, 'a'.repeat(101)])
      expect(validSeasonState({ ...state, draftOperationId })).toBe(false);
    expect(validSeasonState({ ...state, draftOperationId: undefined })).toBe(true);
  });
  it('retries the same confirmed choice without duplicating farms, fields or journals', () => {
    const first = seasonStore.create(farm());
    seasonStore.update(first, { notes: 'Keep this field observation' });
    seasonStore.revokeCalendar();
    for (let i = 0; i < 50; i++) expect(seasonStore.create(farm(`retry-${i}`))).toBe(first);
    const snapshot = seasonStore.getSnapshot();
    expect(snapshot.state.farms).toHaveLength(1);
    expect(snapshot.state.fields).toHaveLength(1);
    expect(snapshot.state.farms[0].notes).toBe('Keep this field observation');
    expect(snapshot.state.calendarAccessId).toBe(first);
    expect(JSON.parse(entries.get(seasonStorageKey)!)).toEqual(snapshot.state);
  });
  it('treats a repeated farm id as an idempotent operation for older callers', () => {
    const legacy = { ...farm(), creationKey: undefined };
    seasonStore.create(legacy);
    seasonStore.create(legacy);
    expect(seasonStore.getSnapshot().state.farms).toHaveLength(1);
  });
  it('keeps different confirmed plantings separate', () => {
    seasonStore.create(farm('one', 'choice-one'));
    seasonStore.create(farm('two', 'choice-two'));
    expect(seasonStore.getSnapshot().state.farms.map((f) => f.id)).toEqual(['one', 'two']);
  });
  it('allows a fresh creation after reset with no stale receipt or field', () => {
    seasonStore.create(farm('old'));
    seasonStore.reset();
    expect(seasonStore.getSnapshot().state.farms).toEqual([]);
    expect(seasonStore.getSnapshot().state.calendarAccessId).toBeNull();
    expect(seasonStore.create(farm('new'))).toBe('new');
    expect(seasonStore.getSnapshot().state.farms.map((f) => f.id)).toEqual(['new']);
    expect(seasonStore.getSnapshot().state.fields?.map((f) => f.id)).toEqual(['field-new']);
  });
  it('does not leave a partial parent field or receipt after invalid creation', () => {
    const before = seasonStore.getSnapshot();
    expect(() => seasonStore.create({ ...farm(), field: { ...farm().field, area: -1 } })).toThrow();
    expect(seasonStore.getSnapshot()).toBe(before);
    expect(seasonStore.create(farm())).toBe('created');
  });
  it('retains in-memory creation and retry protection when browser storage is full', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new DOMException('Quota exceeded', 'QuotaExceededError');
      },
    });
    expect(seasonStore.create(farm())).toBe('created');
    expect(seasonStore.getSnapshot().saved).toBe(false);
    expect(seasonStore.create(farm('retry'))).toBe('created');
    expect(seasonStore.getSnapshot().state.farms).toHaveLength(1);
  });
  it('rejects malformed creation receipts while accepting older saved farms', () => {
    const base = farm();
    for (const creationKey of ['', null, 12, {}, 'x'.repeat(20001)]) {
      expect(
        validSeasonState({
          version: 1,
          farms: [{ ...base, creationKey }],
          activeId: base.id,
          confirmedKey: null,
        }),
      ).toBe(false);
    }
    const legacy = { ...base, creationKey: undefined };
    expect(
      validSeasonState({ version: 1, farms: [legacy], activeId: base.id, confirmedKey: null }),
    ).toBe(true);
  });
});
