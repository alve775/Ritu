import { requirements, suggestSeason, screeningGap } from './plant-screen';
import { globalCrop } from './global-season';
import type { SeasonContext } from './global-season';
import type { Farm } from './types';
import { commonPlantNames } from './plant-names';
const food = [
  'vegetables',
  'fruits & nuts',
  'cereals & pseudocereals',
  'pulses (grain legumes)',
  'roots/tubers',
];
export function searchPlantCatalogue(
  context: SeasonContext,
  farm: Farm,
  from: string,
  options: { page?: number; text?: string; category?: string; cycle?: string; mode?: string } = {},
) {
  const { page = 1, category = 'food', cycle = 'all', mode = 'matches' } = options;
  const text = (options.text ?? '').trim().toLocaleLowerCase();
  const suggestions = suggestSeason(context, farm, from);
  const index = new Map(suggestions.map((s) => [s.crop, s]));
  const browse = mode === 'catalogue';
  const found = requirements.crops.filter(
    (c) =>
      (browse || index.has(c.id)) &&
      (category === 'all' ||
        (category === 'food'
          ? c.categories.some((k) => food.includes(k))
          : (c.categories as string[]).includes(category))) &&
      (cycle === 'all' || c.planKind === cycle) &&
      (!text ||
        `${commonPlantNames(c).en ?? ''} ${commonPlantNames(c).bn ?? ''} ${c.name.en} ${c.name.bn} ${c.scientific} ${c.aliases}`
          .toLocaleLowerCase()
          .includes(text)),
  );
  const rank = new Map(suggestions.map((s, i) => [s.crop, i]));
  found.sort(
    (a, b) =>
      (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity) ||
      a.name.en.localeCompare(b.name.en),
  );
  const pages = Math.max(1, Math.ceil(found.length / 12)),
    current = Math.min(page, pages);
  return {
    total: requirements.crops.length,
    matches: suggestions.length,
    count: found.length,
    page: current,
    pages,
    source: { url: requirements.sourceUrl, sha256: requirements.sha256 },
    items: found.slice((current - 1) * 12, current * 12).map((c) => ({
      plant: globalCrop(c.id),
      suggestion: index.get(c.id) ?? null,
      unavailable: index.has(c.id)
        ? null
        : (screeningGap(c) ??
          'Does not pass the available source temperature, texture or drainage checks. Water adequacy is unverified. This is not proof that the plant cannot grow here.'),
    })),
  };
}
