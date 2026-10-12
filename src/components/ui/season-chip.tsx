import type { SeasonIndex } from '../../domain/year-wheel';

export function SeasonChip({
  season,
  label,
  range,
}: {
  season: SeasonIndex;
  label: string;
  range: string;
}) {
  return (
    <span className={`season-chip season-${season}`}>
      <span>{label}</span>
      <strong>{range}</strong>
    </span>
  );
}
