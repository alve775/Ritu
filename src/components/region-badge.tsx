'use client';
import { usePlanner } from './planner-provider';
import type { RegionMatch } from '../domain/region';

export function RegionBadge({ match }: { match: RegionMatch | null }) {
  const { t, language } = usePlanner();
  return (
    <span className={`region-badge ${match ? 'inside' : 'outside'}`}>
      {match
        ? `${match.region.name[language]} · ${match.district.name[language]}`
        : t('Outside the pilot region', 'পাইলট অঞ্চলের বাইরে')}
    </span>
  );
}
