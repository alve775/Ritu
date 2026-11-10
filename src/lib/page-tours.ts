/** One independent acknowledgement per page; no farm data is stored here. */
export const PAGE_TOUR_KEY = 'ritu-page-tours-v1';
// Keep the original positions for acknowledgements saved in the fallback cookie.
export const tourPages = [
  '/farms',
  '/farm',
  '/crops',
  '/plan',
  '/plot',
  '/notes',
  '/sources',
] as const;
const prompted = new Set<string>();
export function canonicalTourPage(path: string) {
  if (path === '/track') return '/plan';
  if (path === '/insights' || path === '/sample') return '/sources';
  return path;
}
function cookieMask() {
  try {
    const value = document.cookie
      .split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith('ritu-page-tours='))
      ?.split('=')[1];
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 && number < 2 ** tourPages.length ? number : 0;
  } catch {
    return 0;
  }
}
export function pageTourSeen(path: string) {
  const page = canonicalTourPage(path);
  if (prompted.has(page)) return true;
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(PAGE_TOUR_KEY) ?? 'null');
    if (Array.isArray(saved) && saved.includes(page)) return true;
    // Legacy global flags do not acknowledge any of the new page guides.
  } catch {
    /* Continue with the session fallback. */
  }
  const index = tourPages.indexOf(page as (typeof tourPages)[number]);
  return index >= 0 && Boolean(cookieMask() & (1 << index));
}
export function pageTourPrompted(path: string) {
  prompted.add(canonicalTourPage(path));
}
export function markPageTourSeen(path: string) {
  const page = canonicalTourPage(path);
  prompted.add(page);
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(PAGE_TOUR_KEY) ?? '[]');
    const pages = Array.isArray(raw)
      ? raw.filter(
          (p) => typeof p === 'string' && tourPages.includes(p as (typeof tourPages)[number]),
        )
      : [];
    localStorage.setItem(PAGE_TOUR_KEY, JSON.stringify([...new Set([...pages, page])]));
  } catch {
    try {
      const index = tourPages.indexOf(page as (typeof tourPages)[number]);
      if (index >= 0)
        document.cookie = `ritu-page-tours=${cookieMask() | (1 << index)}; Path=/; SameSite=Lax`;
    } catch {
      /* Document memory still prevents repeated prompts. */
    }
  }
}
