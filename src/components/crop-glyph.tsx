import { Leaf, Sprout, Wheat, CircleDot, Coffee } from 'lucide-react';
import type { CropId } from '../domain/types';
import { previewData } from '../data/preview';
export function CropGlyph({ crop, size = 18 }: { crop: CropId; size?: number }) {
  const Icon =
    previewData.crops[crop].category === 'pulse'
      ? Sprout
      : crop === 'potato'
        ? CircleDot
        : crop === 'fallow'
          ? Coffee
          : previewData.crops[crop].category === 'cereal'
            ? Wheat
            : Leaf;
  return <Icon size={size} strokeWidth={1.6} aria-hidden="true" />;
}
