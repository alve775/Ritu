import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export interface StepItem {
  href: string;
  label: string;
  icon: LucideIcon;
  description?: string;
  completed?: boolean;
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
          return (
            <li key={item.href} className={`step ${state}`}>
              <Link
                className="nav-item"
                href={item.href}
                aria-current={state === 'current' ? 'page' : undefined}
              >
                <span className="step-number" aria-hidden="true">
                  {index + 1}
                </span>
                <item.icon size={24} aria-hidden="true" />
                <span className="nav-text">
                  <strong>{item.label}</strong>
                  {item.description && <span>{item.description}</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
