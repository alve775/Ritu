/** Short area name from an OpenStreetMap Nominatim reverse result: place, district, country. */
export function placeName(raw: unknown): string | null {
  if (!raw || typeof raw !== 'object') return null;
  const result = raw as { name?: unknown; address?: unknown };
  const address = (
    result.address && typeof result.address === 'object' ? result.address : {}
  ) as Record<string, unknown>;
  const text = (value: unknown) =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined;
  const place =
    text(result.name) ??
    text(address.city) ??
    text(address.town) ??
    text(address.village) ??
    text(address.county);
  const district = text(address.state_district);
  const parts = [
    place,
    district,
    district ? undefined : text(address.state),
    text(address.country),
  ];
  const unique = parts.filter((part, i): part is string => !!part && parts.indexOf(part) === i);
  return unique.length ? unique.join(', ').slice(0, 200) : null;
}
