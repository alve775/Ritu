'use client';
import { globalCrop } from '../domain/global-season';
import type { CropId } from '../domain/types';
import { PlantPhoto } from './plant-photo';
/** Legacy record IDs resolve to the same live image API as the current catalogue. */
export function photoFor(crop: CropId) {
  return globalCrop(['boro', 'aman', 'aus'].includes(crop) ? 'rice' : crop);
}
export function CropPhoto({ crop }: { crop: CropId; compact?: boolean }) {
  const plant = photoFor(crop);
  return plant ? <PlantPhoto plant={plant} /> : null;
}
