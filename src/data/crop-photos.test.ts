import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import photos from './crop-photos.json';
import { demoCropRules } from './demo-environment';

describe('crop reference image provenance', () => {
  it('covers every planner crop with a verified local asset and public-domain/CC0 rights', () => {
    for (const crop of Object.keys(demoCropRules)) {
      const key = ['aman', 'boro', 'aus'].includes(crop) ? 'rice' : crop;
      expect(photos).toHaveProperty(key);
    }
    for (const photo of Object.values(photos)) {
      expect(['Public domain', 'CC0']).toContain(photo.license);
      expect(photo.author.length).toBeGreaterThan(2);
      expect(new URL(photo.source).hostname).toBe('commons.wikimedia.org');
      const bytes = readFileSync(`public${photo.src}`);
      expect(bytes[0]).toBe(255);
      expect(bytes[1]).toBe(216);
      expect(createHash('sha256').update(bytes).digest('hex')).toBe(photo.sha256);
    }
  });
});
