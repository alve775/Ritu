import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export interface StepItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  completed?: boolean;
  lockedReason?: string;
}

export function StepProgress({
  items,
  path,
  label,
}: {
  items: StepItem[];
  path: string;
  label: string;
}) {
  const current = items.findIndex((item) => item.href === path);
  return (
    <nav className="step-progress" aria-label={label}>
      <ol>
        {items.map((item, index) => {
          const state = index === current ? 'current' : item.completed ? 'done' : 'upcoming';
          const content = (
            <>
              <span className="step-number" aria-hidden="true">
                {index + 1}
              </span>
              <item.icon size={24} aria-hidden="true" />
              <span className="nav-text">
                <strong>{item.label}</strong>
                {(item.lockedReason || item.description) && (
                  <span>{item.lockedReason || item.description}</span>
                )}
              </span>
            </>
          );
          return (
            <li key={item.href} className={`step ${state}`}>
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
