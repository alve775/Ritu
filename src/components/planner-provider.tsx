'use client';
import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import type { Farm, Language, Priority } from '../domain/types';
import { displayStore } from '../lib/display-store';
import { evidenceStore, useEvidence, profileKey } from '../lib/evidence-store';
import type { RegionEnvironment } from '../data/region-environment';
import { tr } from '../lib/translate';
import { seasonStore } from '../lib/season-store';
import { fieldLogStore } from '../lib/field-log-store';
import { clearPhotos } from '../lib/note-photos';
function usePlannerState() {
  useSyncExternalStore(
    displayStore.subscribe,
    displayStore.getSnapshot,
    displayStore.getServerSnapshot,
  );
  const { state, ready, saved } = useEvidence();
  const [resetEpoch, setResetEpoch] = useState(0),
    [tourPreview, setTourPreview] = useState(false),
    [month, setMonth] = useState(0),
    [fieldOpen, setFieldOpen] = useState(false);
  useEffect(() => {
    document.documentElement.lang = state.language;
  }, [state.language]);
  // Merge into the stored farm, not this render's copy: two changes in a row (soil, then drainage
  // from the soil survey) must not undo each other.
  const setFarm = (change: Partial<Farm>) =>
    evidenceStore.update({ farm: { ...evidenceStore.getSnapshot().state.farm, ...change } });
  const setEnvironment = (change: Partial<RegionEnvironment>) => evidenceStore.update(change);
  const reset = () => {
    evidenceStore.reset();
    seasonStore.reset();
    fieldLogStore.reset();
    void clearPhotos();
    setResetEpoch((n) => n + 1);
    setMonth(0);
    setFieldOpen(false);
  };
  return {
    ...state,
    t: (en: string, bn: string) => tr(state.language, en, bn),
    ready,
    saved,
    demoSaved: saved,
    journeySaved: saved,
    resetEpoch,
    reset,
    setFarm,
    setEnvironment,
    environment: { site: state.site, climate: state.climate } as RegionEnvironment,
    setLanguage: (language: Language) => evidenceStore.update({ language }),
    setPriority: (priority: Priority) => evidenceStore.update({ priority }),
    reviewed: state.reviewed === profileKey(state),
    tourPreview,
    setTourPreview,
    month,
    setMonth,
    fieldOpen,
    setFieldOpen,
    update: evidenceStore.update,
  };
}
const Context = createContext<ReturnType<typeof usePlannerState> | null>(null);
export function PlannerProvider({ children }: { children: ReactNode }) {
  const state = usePlannerState();
  return <Context.Provider value={state}>{children}</Context.Provider>;
}
export function usePlanner() {
  const state = useContext(Context);
  if (!state) throw Error('PlannerProvider is required');
  return state;
}
