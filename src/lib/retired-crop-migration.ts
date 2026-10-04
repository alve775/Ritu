// Compatibility only: this identity is not part of the active crop catalogue.
// Keep valid farm fields/preferences when reading saves made before its removal.
const retiredCrop = 'sorghum';

export function migrateRetiredCrop(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const saved = value as Record<string, unknown>;
  if (Array.isArray(saved.preferred) && saved.preferred.includes(retiredCrop)) {
    return { ...saved, preferred: saved.preferred.filter((crop) => crop !== retiredCrop) };
  }
  if (!saved.farm || typeof saved.farm !== 'object') return value;
  const farm = saved.farm as Record<string, unknown>;
  if (!Array.isArray(farm.current)) return value;
  const current = farm.current.filter((period) => period?.crop !== retiredCrop);
  const retiredSelection =
    typeof saved.selected === 'string' && saved.selected.split('-').includes(retiredCrop);
  if (current.length === farm.current.length && !retiredSelection) return value;
  return {
    ...saved,
    ...(retiredSelection ? { selected: 'balanced' } : {}),
    farm: {
      ...farm,
      current: current.length ? current : [{ crop: 'fallow', start: 0, duration: 12 }],
    },
  };
}
