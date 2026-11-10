import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export interface StepItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  completed?: boolean;
  lockedReason?: string;
  /** A page that belongs under the step before it (not a numbered step). */
  sub?: boolean;
  /** Count shown on the item, e.g. reminders that are due. */
  badge?: string | number;
}

export function StepProgress({
  items,
  path,
  label,
  numbered = true,
}: {
  items: StepItem[];
  path: string;
  label: string;
  /** Show 1, 2, 3 on the icons; off when the items are places rather than steps in order. */
  numbered?: boolean;
}) {
  const current = items.findIndex((item) => item.href === path);
  const number = (index: number) => items.slice(0, index + 1).filter((item) => !item.sub).length;
  return (
    <nav className="step-progress" aria-label={label}>
      <ol>
        {items.map((item, index) => {
          const state = index === current ? 'current' : item.completed ? 'done' : 'upcoming';
          const content = (
            <>
              <span className="step-icon" aria-hidden="true">
                <item.icon size={22} />
                {numbered && !item.sub && <span className="step-number">{number(index)}</span>}
              </span>
              <span className="nav-text">
                <strong>{item.label}</strong>
                {(item.lockedReason || item.description) && (
                  <span>{item.lockedReason || item.description}</span>
                )}
              </span>
              {!!item.badge && <span className="nav-badge">{item.badge}</span>}
            </>
          );
          return (
            <li key={item.href} className={`step ${state} ${item.sub ? 'sub' : ''}`}>
              {item.lockedReason ? (
                <button className="nav-item" type="button" disabled title={item.lockedReason}>
                  {content}
                </button>
              ) : (
                <Link
                  className="nav-item"
                  href={item.href}
                  aria-current={state === 'current' ? 'page' : undefined}
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
