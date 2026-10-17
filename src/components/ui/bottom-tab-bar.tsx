import Link from 'next/link';
import type { StepItem } from './step-progress';

export function BottomTabBar({
  items,
  path,
  label,
}: {
  items: StepItem[];
  path: string;
  label: string;
}) {
  return (
    <nav className="tab-bar" aria-label={label}>
      {items.map(({ href, label: text, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`tab ${path === href ? 'current' : ''}`}
          aria-current={path === href ? 'page' : undefined}
        >
          <Icon size={22} aria-hidden="true" />
          <span className="nav-text">
            <strong>{text}</strong>
          </span>
        </Link>
      ))}
    </nav>
  );
}
