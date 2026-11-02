import { gunzipSync } from 'node:zlib';
import dataset from '../data/global/calendar-grid.json' with { type: 'json' };
import type { LocalCropCalendar } from '../domain/global-season';
const maps = dataset.grids.map((grid) => ({
  ...grid,
  map: gunzipSync(Buffer.from(grid.cells, 'base64')),
}));
export function calendarsAt(latitude: number, longitude: number): LocalCropCalendar[] {
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  )
    throw Error('Invalid coordinates');
  const row = Math.min(359, Math.floor((90 - latitude) * 2));
  const column = Math.min(719, Math.floor((longitude + 180) * 2));
  const cell = row * 720 + column;
  return maps.flatMap((grid) => {
    const index = grid.map.readUInt16LE(cell * 2),
      record = grid.records[index];
    if (!record || record.some((v, i) => [0, 3, 4, 5, 6].includes(i) && v === null)) return [];
    const [planting, first, last, harvest, duration, observation, level] = record;
    return [
      {
        crop: grid.crop,
        season: grid.season,
        planting: planting!,
        first,
        last,
        harvest: harvest!,
        duration: duration!,
        observation: observation!,
        level: level!,
        sourceUrl: grid.url,
        grid: { latitude: 89.75 - row / 2, longitude: -179.75 + column / 2 },
      },
    ];
  });
}
