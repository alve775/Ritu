import { describe, it, expect, vi, afterEach } from 'vitest';
import raw from '../../tests/fixtures/power-rajshahi-2025.json';
import { historyRange, parseSeasonHistory, seasonHistoryUrl } from './season-history';
import { GET } from '../app/api/season-history/route';
const start = '2025-03-19',
  end = '2025-05-27';
const record = () => {
  const r = structuredClone(raw);
  r.header.start = start.replaceAll('-', '');
  r.header.end = end.replaceAll('-', '');
  return r;
};
const parse = (r: unknown = record()) =>
  parseSeasonHistory(r, 'mung', 24.37, 88.6, start, end, '2026-10-26T00:00:00Z');
afterEach(() => vi.unstubAllGlobals());
describe('contiguous actual NASA seasonal history', () => {
  it('selects complete prior intervals including cross-year wheat', () => {
    expect(historyRange('wheat', new Date('2026-10-26T00:00:00Z'))).toEqual({
      start: '2025-11-12',
      end: '2026-03-10',
    });
    expect(historyRange('mung', new Date('2026-10-26T00:00:00Z'))).toEqual({
      start: '2026-03-19',
      end: '2026-05-27',
    });
  });
  it('keeps real daily values and sums rain without prorating months', () => {
    const h = parse();
    const original = Object.entries(raw.properties.parameter.PRECTOTCORR)
      .filter(([date]) => date >= '20250319' && date <= '20250527')
      .reduce((s, [, v]) => s + v, 0);
    expect(h.rain).toBeCloseTo(original, 10);
    expect(h.days).toBe(70);
    expect(h.wetness).toBeGreaterThanOrEqual(0);
    expect(h.wetness).toBeLessThanOrEqual(1);
  });
  it.each(['missing', 'units', 'location', 'range', 'temperature', 'wetness'])(
    'rejects incomplete or inconsistent %s',
    (kind) => {
      const r = record();
      if (kind === 'missing') r.properties.parameter.PRECTOTCORR['20250320'] = -999;
      if (kind === 'units') r.parameters.PRECTOTCORR.units = 'in/day';
      if (kind === 'location') r.geometry.coordinates[1] = 45;
      if (kind === 'range') r.header.end = '20250526';
      if (kind === 'temperature') r.properties.parameter.T2M_MIN['20250320'] = 99;
      if (kind === 'wetness') r.properties.parameter.GWETTOP['20250320'] = 2;
      expect(() => parse(r)).toThrow();
    },
  );
  it('accepts only a bounded fixed NASA host request', () => {
    const u = new URL(seasonHistoryUrl(24.37, 88.6, start, end));
    expect(u.hostname).toBe('power.larc.nasa.gov');
    expect(u.searchParams.get('start')).toBe('20250319');
    expect(() => seasonHistoryUrl(999, 0, start, end)).toThrow();
  });
  it('does not fetch for invalid coordinates or crop', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    for (const q of [
      'crop=fallow&latitude=24&longitude=88',
      'crop=mung&latitude=&longitude=88',
      'crop=mung&latitude=100&longitude=88',
    ])
      expect((await GET(new Request(`http://localhost/api/season-history?${q}`))).status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });
  it('reports provider failure without synthetic replacement', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    const r = await GET(
      new Request('http://localhost/api/season-history?crop=mung&latitude=24.38&longitude=88.61'),
    );
    expect(r.status).toBe(502);
    expect(await r.json()).not.toHaveProperty('history');
  });
});
