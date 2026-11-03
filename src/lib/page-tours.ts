/** One independent acknowledgement per page; no farm data is stored here. */
export const PAGE_TOUR_KEY = 'ritu-page-tours-v1';
export const tourPages = ['/farms', '/farm', '/crops', '/plan'] as const;
const prompted = new Set<string>();
const canonical = (path: string) => (path === '/track' ? '/plan' : path);
function cookieMask() {
  try {
    const value = document.cookie
      .split(';')
      .map((s) => s.trim())
      .find((s) => s.startsWith('ritu-page-tours='))
      ?.split('=')[1];
    const number = Number(value);
    return Number.isInteger(number) && number >= 0 && number < 16 ? number : 0;
  } catch {
    return 0;
  }
}
export function pageTourSeen(path: string) {
  const page = canonical(path);
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
  prompted.add(canonical(path));
}
export function markPageTourSeen(path: string) {
  const page = canonical(path);
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
