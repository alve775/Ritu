'use client';
import { createContext, useContext, type ReactNode } from 'react';
import { seasonStore } from '../lib/season-store';
export type FarmRecordWriter = typeof seasonStore.update;
const Context = createContext<FarmRecordWriter>(seasonStore.update);
export function FarmRecordScope({
  write,
  children,
}: {
  write: FarmRecordWriter;
  children: ReactNode;
}) {
  return <Context.Provider value={write}>{children}</Context.Provider>;
}
export const useFarmRecordWriter = () => useContext(Context);
