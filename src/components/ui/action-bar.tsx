import type { ReactNode } from 'react';

export function ActionBar({
  sticky = false,
  status,
  className = '',
  tour,
  children,
}: {
  sticky?: boolean;
  status?: ReactNode;
  className?: string;
  tour?: string;
  children: ReactNode;
}) {
  return (
    <div className={`action-bar ${sticky ? 'sticky' : ''} ${className}`} data-tour={tour}>
      {status && <div className="action-bar-status">{status}</div>}
      <div className="action-bar-actions">{children}</div>
    </div>
  );
}
