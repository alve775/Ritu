import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GET } from './route';
const { resolve } = vi.hoisted(() => ({ resolve: vi.fn() }));
vi.mock('../../../lib/plant-photo-source', () => ({ resolvePlantPhotos: resolve }));
beforeEach(() => {
  resolve.mockReset();
});
describe('batched plant image endpoint', () => {
  it('rejects unknown IDs, duplicates and oversized requests before calling a provider', async () => {
    for (const query of [
      '',
      'plant=unknown',
      'plants=tomato,tomato',
      'plants=' + Array(13).fill('tomato').join(','),
    ])
      expect((await GET(new Request('http://localhost/api/plant-photo?' + query))).status).toBe(
        400,
      );
    expect(resolve).not.toHaveBeenCalled();
  });
  it('accepts only catalogue identities and serves the API mapping without a local fallback', async () => {
    resolve.mockResolvedValue({ tomato: null, cabbage: null });
    const result = await GET(new Request('http://localhost/api/plant-photo?plants=tomato,cabbage'));
    expect(result.status).toBe(200);
    expect((await result.json()).photos).toEqual({ tomato: null, cabbage: null });
    expect(resolve.mock.calls[0][0].map((p: { scientific: string }) => p.scientific)).toEqual([
      'Lycopersicon esculentum',
      'Brassica oleracea var. capitata',
    ]);
  });
  it('signals provider outages and allows retry instead of returning an unrelated photo', async () => {
    resolve.mockRejectedValue(Error('Simulated provider outage'));
    const result = await GET(new Request('http://localhost/api/plant-photo?plant=tomato'));
    expect(result.status).toBe(503);
    expect(result.headers.get('Retry-After')).toBe('60');
    expect((await result.json()).photo).toBeUndefined();
  });
});
