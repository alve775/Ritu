'use client';
import Link from 'next/link';
import { useLayoutEffect, useRef } from 'react';
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
  const nav = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const element = nav.current;
    if (!element) return;
    const root = document.documentElement;
    const previous = root.style.getPropertyValue('--tabbar-h');
    const measure = () => {
      root.style.setProperty(
        '--tabbar-h',
        `${Math.ceil(element.getBoundingClientRect().height)}px`,
      );
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (previous) root.style.setProperty('--tabbar-h', previous);
      else root.style.removeProperty('--tabbar-h');
    };
  }, []);
  return (
    <nav ref={nav} className="tab-bar" aria-label={label}>
      {items.map(({ href, label: text, icon: Icon, lockedReason, badge }) =>
        lockedReason ? (
          <button
            key={href}
            className="tab locked"
            type="button"
            disabled
            aria-label={`${text}: ${lockedReason}`}
            title={lockedReason}
          >
            <Icon size={22} aria-hidden="true" />
            <span className="nav-text">
              <strong>{text}</strong>
            </span>
          </button>
        ) : (
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
            {!!badge && <span className="nav-badge">{badge}</span>}
          </Link>
        ),
      )}
    </nav>
  );
}
