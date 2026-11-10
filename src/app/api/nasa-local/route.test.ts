import { describe, expect, it } from 'vitest';
import { GET } from './route';

const call = (q: string) => GET(new Request(`http://localhost/api/nasa-local?${q}`));

describe('NASA local route', () => {
  it('rejects missing or invalid coordinates', async () => {
    expect((await call('latitude=24.37')).status).toBe(400);
    expect((await call('latitude=abc&longitude=88.6')).status).toBe(400);
    expect((await call('latitude=95&longitude=88.6')).status).toBe(400);
  });
  it('returns null outside the Rajshahi box', async () => {
    const r = await call('latitude=23.81&longitude=90.41');
    expect(r.status).toBe(200);
    expect((await r.json()).nasa).toBeNull();
  });
  it('returns the shipped IMERG and SMAP weeks for Rajshahi city', async () => {
    const { nasa } = await (await call('latitude=24.37&longitude=88.6')).json();
    expect(nasa.weeks).toHaveLength(52);
    expect(nasa.rainCell).toEqual({ lat: 24.35, lon: 88.55 });
    expect(nasa.rainPeriod).toEqual(['2001-01-01', '2025-09-30']);
    // Mid-November: almost no rain, a 3-week dry spell in 23 of 24 years, root zone still moist.
    expect(nasa.weeks[45]).toMatchObject({ dry: 0.96, dryYears: 23, drySamples: 24 });
    expect(nasa.weeks[45].root).toBeGreaterThan(0.6);
    // The monsoon is wetter than April in both products.
    expect(nasa.weeks[29].rain).toBeGreaterThan(nasa.weeks[15].rain);
    expect(nasa.weeks[33].root).toBeGreaterThan(nasa.weeks[15].root);
  });
});
