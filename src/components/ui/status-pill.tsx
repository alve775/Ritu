import type { ReactNode } from 'react';
import { Check, CircleAlert, CircleHelp } from 'lucide-react';

export function StatusPill({
  state,
  children,
}: {
  state: 'checked' | 'unassessed' | 'conflict';
  children: ReactNode;
}) {
  const Icon = state === 'checked' ? Check : state === 'conflict' ? CircleAlert : CircleHelp;
  return (
    <span className={`status-pill ${state}`}>
      <Icon size={16} aria-hidden="true" />
      {children}
    </span>
  );
}
