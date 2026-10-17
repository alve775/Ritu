import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export interface StepItem {
  href: string;
  label: string;
  icon: LucideIcon;
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
          const state = index === current ? 'current' : index < current ? 'done' : 'upcoming';
          return (
            <li key={item.href} className={`step ${state}`}>
              <Link
                className="nav-item"
                href={item.href}
                aria-current={state === 'current' ? 'page' : undefined}
              >
                <span className="step-dot" aria-hidden="true" />
                <span className="nav-text">
                  <strong>{item.label}</strong>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
