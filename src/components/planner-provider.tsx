'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from 'react';
import type { ReactNode } from 'react';
import { evaluate, preferredOption } from '../domain/evaluate';
import type { Farm, HouseholdCrop, Language, Priority } from '../domain/types';
import { initialState } from '../lib/storage';
import { plannerStore } from '../lib/planner-store';
import { tr } from '../lib/translate';
import { demoStore } from '../lib/demo-store';
import {
  generateDemoPlans,
  farmFingerprint,
  planFingerprint,
  settleHousehold,
} from '../domain/demo-planner';
import type { DemoSettings } from '../data/demo-environment';
import { journeyStore } from '../lib/journey-store';
import { defaultFarm } from '../data/preview';
import { defaultDemo } from '../data/demo-environment';
import type { Rotation } from '../domain/types';

function usePlannerState() {
  const [resetEpoch, setResetEpoch] = useState(0);
  const [month, setMonth] = useState(0);
  const [fieldOpen, setFieldOpen] = useState(false);
  const [tourPreview, setTourPreview] = useState(false);
  const { state, ready, saved } = useSyncExternalStore(
    plannerStore.subscribe,
    plannerStore.getSnapshot,
    plannerStore.getServerSnapshot,
  );
  const setState = plannerStore.update;
  const demo = useSyncExternalStore(
    demoStore.subscribe,
    demoStore.getSnapshot,
    demoStore.getServerSnapshot,
  );
  const journey = useSyncExternalStore(
    journeyStore.subscribe,
    journeyStore.getSnapshot,
    journeyStore.getServerSnapshot,
  );
  useEffect(() => {
    document.documentElement.lang = state.language;
  }, [state.language]);
  // Household groups unticked because a farm condition change made them impossible.
  const [householdDropped, setHouseholdDropped] = useState<HouseholdCrop[]>([]);
  const settle = (farm: Farm, settings: DemoSettings, priority: Priority) => {
    const settled = settleHousehold(farm, settings, priority);
    if (settled.dropped.length) setHouseholdDropped(settled.dropped);
    return settled.farm;
  };
  const conditions: (keyof Farm)[] = ['irrigation', 'soil', 'drainage', 'unavailableMonths'];
  const setFarm = (update: Partial<Farm>) => {
    if ('required' in update) setHouseholdDropped([]);
    setState((s) => {
      const farm = { ...s.farm, ...update };
      return {
        ...s,
        farm: conditions.some((key) => key in update)
          ? settle(farm, demo.settings, s.priority)
          : farm,
      };
    });
  };
  const setDemo = (change: Partial<DemoSettings>) => {
    demoStore.update(change);
    if ('location' in change || 'weather' in change)
      setState((s) => {
        const farm = settle(s.farm, demoStore.getSnapshot().settings, s.priority);
        return farm === s.farm ? s : { ...s, farm };
      });
  };
  const setLanguage = (language: Language) => setState((s) => ({ ...s, language }));
  const setPriority = (priority: Priority) => setState((s) => ({ ...s, priority }));
  const select = (selected: string) => setState((s) => ({ ...s, selected }));
  const reset = () => {
    setMonth(0);
    setFieldOpen(false);
    setResetEpoch((epoch) => epoch + 1);
    setHouseholdDropped([]);
    demoStore.reset();
    journeyStore.reset();
    setState((s) => ({ ...initialState, language: s.language }));
  };
  const reviewed =
    journey.state.reviewed === farmFingerprint(state.farm, demo.settings, state.priority);
  const planReady =
    reviewed &&
    demo.settings.enabled &&
    journey.state.generatedFor === planFingerprint(state.farm, demo.settings, state.priority);
  const generated = useMemo(
    () => (planReady ? generateDemoPlans(state.farm, demo.settings, state.priority) : []),
    [state.farm, demo.settings, state.priority, planReady],
  );
  const tourPlans = useMemo(() => generateDemoPlans(defaultFarm, defaultDemo, 'water'), []);
  const evaluations = (tourPreview ? tourPlans : generated).map((rotation) =>
    evaluate(rotation, tourPreview ? defaultFarm : state.farm),
  );
  const preferred = preferredOption(evaluations, state.priority);
  const selected =
    evaluations.find((e) => e.rotation.id === state.selected) ??
    evaluations[0] ??
    evaluate(
      {
        id: 'empty',
        name: { en: 'No generated plan', bn: 'পরিকল্পনা তৈরি হয়নি' },
        subtitle: { en: '', bn: '' },
        periods: [],
      } as Rotation,
      state.farm,
    );
  const t = (en: string, bn: string) => tr(state.language, en, bn);
  return {
    ...state,
    setFarm,
    setLanguage,
    setPriority,
    select,
    reset,
    resetEpoch,
    evaluations,
    reviewed,
    planReady,
    journey: journey.state,
    journeySaved: journey.saved,
    setJourney: journeyStore.update,
    tourPreview,
    setTourPreview,
    demo: demo.settings,
    demoSaved: demo.saved,
    setDemo,
    householdDropped,
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
