'use client';

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { evaluate, preferredOption, rotationsFor } from '../domain/evaluate';
import type { Farm, Language, Priority } from '../domain/types';
import { initialState } from '../lib/storage';
import { plannerStore } from '../lib/planner-store';
import { tr } from '../lib/translate';

function usePlannerState() {
  const [month, setMonth] = useState(0);
  const [fieldOpen, setFieldOpen] = useState(false);
  const { state, ready, saved } = useSyncExternalStore(
    plannerStore.subscribe,
    plannerStore.getSnapshot,
    plannerStore.getServerSnapshot,
  );
  const setState = plannerStore.update;
  useEffect(() => {
    document.documentElement.lang = state.language;
  }, [state.language]);
  const setFarm = (update: Partial<Farm>) =>
    setState((s) => ({ ...s, farm: { ...s.farm, ...update } }));
  const setLanguage = (language: Language) => setState((s) => ({ ...s, language }));
  const setPriority = (priority: Priority) => setState((s) => ({ ...s, priority }));
  const select = (selected: string) => setState((s) => ({ ...s, selected }));
  const reset = () => {
    setMonth(0);
    setState((s) => ({ ...initialState, language: s.language }));
  };
  const evaluations = rotationsFor(state.farm).map((rotation) => evaluate(rotation, state.farm));
  const preferred = preferredOption(evaluations, state.priority);
  const selected = evaluations.find((e) => e.rotation.id === state.selected) ?? evaluations[1];
  const t = (en: string, bn: string) => tr(state.language, en, bn);
  return {
    ...state,
    setFarm,
    setLanguage,
    setPriority,
    select,
    reset,
    evaluations,
    preferred,
    selected,
    saved,
    ready,
    t,
    month,
    setMonth,
    fieldOpen,
    setFieldOpen,
  };
}
const PlannerContext = createContext<ReturnType<typeof usePlannerState> | null>(null);
export function PlannerProvider({ children }: { children: ReactNode }) {
  const value = usePlannerState();
  return <PlannerContext.Provider value={value}>{children}</PlannerContext.Provider>;
}
export function usePlanner() {
  const context = useContext(PlannerContext);
  if (!context) throw new Error('Planner components require PlannerProvider');
  return context;
}
