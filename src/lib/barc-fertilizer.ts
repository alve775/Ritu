import crops from '../data/barc/fertilizer-crops.json' with { type: 'json' };
import saved from '../data/barc/rajshahi-fertilizer.json' with { type: 'json' };
import { parseFertilizer, type FertilizerAdvice } from '../domain/barc-fertilizer';
import type { RotationCropId } from '../data/rotation-crops';

type CropEntry = { cropId: number; varietyId: number; variety: string };
const cropTable = crops.crops as Record<string, CropEntry>;
const savedFile = saved as {
  retrievedAt: string;
  points: { name: string; lat: number; lon: number; pages: Record<string, string | null> }[];
};
const base = 'https://czis.cropzoning.gov.bd/czis/fertilizer';

export interface FertilizerResult extends FertilizerAdvice {
  crop: RotationCropId;
  variety: string;
  /** BARC's own recommendation page for this crop at the pin, for the farmer to open. */
  pageUrl: string;
  from: 'saved' | 'live';
}

export const barcCrop = (crop: string) => cropTable[crop] ?? null;
/** BARC covers Bangladesh only. */
export const inBangladesh = (lat: number, lon: number) =>
  lat >= 20.5 && lat <= 26.7 && lon >= 88 && lon <= 92.7;
const coord = (v: number) => Number(v.toFixed(5));
export const barcPageUrl = (c: CropEntry, lat: number, lon: number) =>
  `${base}/byvar/crop/${c.cropId}/point/lon/${coord(lon)}/lat/${coord(lat)}`;

/**
 * BARC's fertiliser recommendation (per 100 decimals) for a crop at a pin: from the saved set for
 * the demo pins, otherwise asked live. `null` items mean BARC has no recommendation there (towns,
 * rivers); a thrown error means BARC could not be reached.
 */
export async function loadFertilizer(
  crop: RotationCropId,
  lat: number,
  lon: number,
): Promise<FertilizerResult | null> {
  const c = barcCrop(crop);
  if (!c || !inBangladesh(lat, lon)) return null;
  const pageUrl = barcPageUrl(c, lat, lon);
  const point = savedFile.points.find(
    (p) => Math.abs(p.lat - lat) < 0.0006 && Math.abs(p.lon - lon) < 0.0006,
  );
  if (point && crop in point.pages) {
    const page = point.pages[crop];
    const advice = page ? parseFertilizer(page) : { items: [], notes: [] };
    return { crop, variety: c.variety, pageUrl, from: 'saved', ...advice };
  }
  const url = `${base}/recommendationbypoint/crop/${c.cropId}/lon/${coord(lon)}/lat/${coord(lat)}/var/${c.varietyId}/100`;
  const r = await fetch(url, {
    signal: AbortSignal.timeout(6000),
    headers: { 'User-Agent': 'Ritu (NASA Space Apps 2026)' },
    next: { revalidate: 86400 },
  });
  if (!r.ok) throw Error(`BARC answered ${r.status}`);
  return { crop, variety: c.variety, pageUrl, from: 'live', ...parseFertilizer(await r.text()) };
}
