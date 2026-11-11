import { describe, expect, it } from 'vitest';
import { GET } from './route';

const call = (q: string) => GET(new Request(`http://localhost/api/soil-survey?${q}`));

describe('Soil survey route', () => {
  it('rejects missing or invalid coordinates', async () => {
    expect((await call('latitude=24.47')).status).toBe(400);
    expect((await call('latitude=abc&longitude=88.33')).status).toBe(400);
    expect((await call('latitude=95&longitude=88.33')).status).toBe(400);
  });
  it('returns null outside Rajshahi, Chapainawabganj, Natore and Naogaon', async () => {
    expect((await (await call('latitude=23.81&longitude=90.41')).json()).survey).toBeNull();
  });
  it('returns the BARC soil unit at Godagari and Naogaon, from the shipped grid', async () => {
    expect((await (await call('latitude=24.47&longitude=88.33')).json()).survey).toMatchObject({
      landType: 'High Land',
      texture: 'Loam',
      drainage: 'Imperfectly Drained',
      series: 'Amnura',
      soil: 'loam',
    });
    // The grid point 140 m away falls in the next unit (Gangachara); the exact point is Manda.
    expect((await (await call('latitude=24.8&longitude=88.93')).json()).survey).toMatchObject({
      series: 'Gangachara',
      reaction: 'Moderately Acidic',
    });
  });
  it('says none where BARC has no soil unit or an empty one (towns, rivers)', async () => {
    expect((await (await call('latitude=24.4&longitude=88.62')).json()).survey).toBe('none');
    expect((await (await call('latitude=24.42&longitude=88.99')).json()).survey).toBe('none');
  });
});
