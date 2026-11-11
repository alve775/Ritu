import { describe, expect, it } from 'vitest';
import { GET } from './route';
import fertilizerCrops from '../../../data/barc/fertilizer-crops.json' with { type: 'json' };

const call = (q: string) => GET(new Request(`http://localhost/api/fertilizer?${q}`));

describe('Fertiliser route', () => {
  it('rejects unknown crops and invalid coordinates', async () => {
    expect((await call('crop=rice&latitude=24.384&longitude=88.584')).status).toBe(400);
    expect((await call('crop=mustard&latitude=24.384')).status).toBe(400);
    expect((await call('crop=mustard&latitude=abc&longitude=88.584')).status).toBe(400);
  });
  it('returns null outside Bangladesh without asking BARC', async () => {
    expect(
      (await (await call('crop=mustard&latitude=51.5&longitude=-0.1')).json()).fertilizer,
    ).toBeNull();
  });
  it('serves every crop at the app’s starting pin and at Godagari from the saved set', async () => {
    for (const [lat, lon] of [
      [24.384, 88.584],
      [24.468, 88.329],
    ])
      for (const crop of Object.keys(fertilizerCrops.crops)) {
        const { fertilizer } = await (
          await call(`crop=${crop}&latitude=${lat}&longitude=${lon}`)
        ).json();
        expect([crop, fertilizer.from]).toEqual([crop, 'saved']);
        const main = fertilizer.items.filter((i: { alt: boolean }) => !i.alt);
        expect([crop, main[0].name, main[0].kg > 0]).toEqual([crop, 'Urea', true]);
      }
  });
  it('gives the mustard doses BARC showed at the starting pin', async () => {
    const { fertilizer } = await (
      await call('crop=mustard&latitude=24.384&longitude=88.584')
    ).json();
    expect(fertilizer.variety).toBe('BARI Sharisa-14');
    expect(fertilizer.items.filter((i: { alt: boolean }) => !i.alt).slice(0, 3)).toMatchObject([
      { name: 'Urea', kg: 90.908 },
      { name: 'TSP', kg: 24.281 },
      { name: 'MoP', kg: 21.583 },
    ]);
    expect(fertilizer.notes.length).toBeGreaterThan(0);
  });
});
