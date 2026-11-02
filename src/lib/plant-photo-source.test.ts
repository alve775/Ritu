import { beforeEach, describe, expect, it, vi } from 'vitest';
import { globalCrop } from '../domain/global-season';
const api = vi.fn();
vi.mock('./wikimedia-api', () => ({ wikimediaApi: (...args: unknown[]) => api(...args) }));
beforeEach(() => {
  vi.resetModules();
  api.mockReset();
});
const claim = (value: string) => ({ mainsnak: { datavalue: { value } } });
const photoInfo = (file: string) => ({
  url: `https://upload.wikimedia.org/wikipedia/commons/a/ab/${file.replaceAll(' ', '_')}`,
  thumburl: `https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/${file.replaceAll(' ', '_')}/500px-${file.replaceAll(' ', '_')}`,
  width: 800,
  height: 600,
  descriptionurl: `https://commons.wikimedia.org/wiki/File:${file.replaceAll(' ', '_')}`,
  mime: 'image/jpeg',
  extmetadata: {
    LicenseShortName: { value: 'CC0' },
    Artist: { value: 'Photographer' },
    ImageDescription: { value: 'Ripe fruits of the identified species' },
  },
});
describe('automatic plant-image API chain', () => {
  it('does not use a genus-level scientific redirect as species evidence', async () => {
    api.mockImplementation(async (host: string, params: Record<string, string>) => {
      if (host === 'wikipedia')
        return {
          query: {
            redirects: [{ from: 'Sonneratia apetala', to: 'Sonneratia' }],
            pages: { 1: { title: 'Sonneratia', pageprops: { wikibase_item: 'Q1' } } },
          },
        };
      if (params.action === 'wbgetentities')
        return {
          entities: {
            Q1: {
              id: 'Q1',
              claims: { P225: [claim('Sonneratia')], P18: [claim('Other species.jpg')] },
            },
          },
        };
      if (params.action === 'wbsearchentities') return { search: [] };
      throw Error('A genus photograph must not reach Commons lookup');
    });
    const { resolvePlantPhotos } = await import('./plant-photo-source');
    expect((await resolvePlantPhotos([globalCrop('ecocrop-9938')!]))['ecocrop-9938']).toBeNull();
    expect(api.mock.calls.some(([, p]) => p.action === 'wbsearchentities')).toBe(true);
  });
  it('does not collapse a botanical variety to a species through a redirect alone', async () => {
    api.mockImplementation(async (host: string, params: Record<string, string>) => {
      if (host === 'wikipedia')
        return {
          query: {
            redirects: [{ from: 'Brassica oleracea var. capitata', to: 'Brassica oleracea' }],
            pages: { 1: { title: 'Brassica oleracea', pageprops: { wikibase_item: 'Q1' } } },
          },
        };
      if (params.action === 'wbgetentities')
        return {
          entities: {
            Q1: {
              id: 'Q1',
              claims: { P225: [claim('Brassica oleracea')], P18: [claim('Broccoli.jpg')] },
            },
          },
        };
      if (params.action === 'wbsearchentities') return { search: [] };
      throw Error('A broader taxon must not reach Commons lookup');
    });
    const { resolvePlantPhotos } = await import('./plant-photo-source');
    expect((await resolvePlantPhotos([globalCrop('cabbage')!])).cabbage).toBeNull();
  });
  it('requests a smaller standard thumbnail when the API first returns an unscaled original', async () => {
    api.mockImplementation(async (host: string, params: Record<string, string>) => {
      if (host === 'wikipedia')
        return {
          query: {
            pages: {
              1: { title: 'Lycopersicon esculentum', pageprops: { wikibase_item: 'Q23501' } },
            },
          },
        };
      if (host === 'wikidata')
        return {
          entities: {
            Q23501: {
              id: 'Q23501',
              claims: {
                P225: [claim('Lycopersicon esculentum')],
                P18: [claim('Tomato fruits.jpg')],
              },
            },
          },
        };
      const info = photoInfo('Tomato fruits.jpg');
      info.width = 320;
      info.thumburl =
        params.iiurlwidth === '250' ? info.thumburl.replace('500px-', '250px-') : info.url;
      return { query: { pages: { 1: { title: 'File:Tomato fruits.jpg', imageinfo: [info] } } } };
    });
    const { resolvePlantPhotos } = await import('./plant-photo-source');
    expect((await resolvePlantPhotos([globalCrop('tomato')!])).tomato?.src).toContain('/250px-');
    expect(
      api.mock.calls.filter(([host]) => host === 'commons').map(([, params]) => params.iiurlwidth),
    ).toEqual(['500', '250']);
  });
  it('resolves an exact scientific redirect to the accepted taxon, excludes a drain and caches the API result', async () => {
    api.mockImplementation(async (host: string, params: Record<string, string>) => {
      if (host === 'wikipedia')
        return {
          query: {
            redirects: [{ from: 'Lycopersicon esculentum', to: 'Tomato' }],
            pages: { 1: { title: 'Tomato', pageprops: { wikibase_item: 'Q23501' } } },
          },
        };
      if (host === 'wikidata' && params.action === 'wbgetentities')
        return {
          entities: {
            Q23501: {
              id: 'Q23501',
              claims: {
                P225: [claim('Solanum lycopersicum')],
                P18: [claim('Tomato drain.jpg'), claim('Tomato fruits.jpg')],
              },
            },
          },
        };
      if (host === 'commons')
        return {
          query: {
            pages: {
              1: { title: 'File:Tomato fruits.jpg', imageinfo: [photoInfo('Tomato fruits.jpg')] },
            },
          },
        };
      throw Error('Unexpected request');
    });
    const { resolvePlantPhotos } = await import('./plant-photo-source');
    const data = await resolvePlantPhotos([globalCrop('tomato')!]);
    expect(data.tomato?.title).toBe('File:Tomato fruits.jpg');
    expect(data.tomato?.matchedScientific).toBe('Solanum lycopersicum');
    expect(api).toHaveBeenCalledTimes(3);
    await resolvePlantPhotos([globalCrop('tomato')!]);
    expect(api).toHaveBeenCalledTimes(3);
    expect(api.mock.calls.some(([, params]) => String(params.titles).includes('drain'))).toBe(
      false,
    );
  });
  it('rejects a fuzzy first search hit and selects the exact botanical variety', async () => {
    api.mockImplementation(async (host: string, params: Record<string, string>) => {
      if (host === 'wikipedia') return { query: { pages: {} } };
      if (params.action === 'wbsearchentities') return { search: [{ id: 'Q1' }, { id: 'Q2' }] };
      if (params.action === 'wbgetentities')
        return {
          entities: {
            Q1: {
              id: 'Q1',
              claims: { P225: [claim('Brassica oleracea')], P18: [claim('Wrong species.jpg')] },
            },
            Q2: {
              id: 'Q2',
              claims: {
                P225: [claim('Brassica oleracea var. capitata')],
                P18: [claim('Cabbage heads.jpg')],
              },
            },
          },
        };
      if (host === 'commons')
        return {
          query: {
            pages: {
              2: { title: 'File:Cabbage heads.jpg', imageinfo: [photoInfo('Cabbage heads.jpg')] },
            },
          },
        };
      throw Error('Unexpected request');
    });
    const { resolvePlantPhotos } = await import('./plant-photo-source');
    const data = await resolvePlantPhotos([globalCrop('cabbage')!]);
    expect(data.cabbage?.entity).toBe('https://www.wikidata.org/wiki/Q2');
    expect(
      api.mock.calls.some(([, params]) => String(params.titles).includes('Wrong species')),
    ).toBe(false);
  });
  it('returns no image when the exact taxon has no reusable photograph, with no observation or local-file fallback', async () => {
    api.mockImplementation(async (_host: string, params: Record<string, string>) =>
      params.action === 'wbsearchentities' ? { search: [] } : { query: { pages: {} } },
    );
    const { resolvePlantPhotos } = await import('./plant-photo-source');
    expect((await resolvePlantPhotos([globalCrop('cabbage')!])).cabbage).toBeNull();
    expect(
      api.mock.calls.every(([host]) => ['wikipedia', 'wikidata', 'commons'].includes(host)),
    ).toBe(true);
  });
  it('allows retry after a provider outage rather than caching a fabricated success', async () => {
    api.mockRejectedValue(Error('Rate limited'));
    const { resolvePlantPhotos } = await import('./plant-photo-source');
    await expect(resolvePlantPhotos([globalCrop('tomato')!])).rejects.toThrow('Rate limited');
    api.mockImplementation(async (_host: string, params: Record<string, string>) =>
      params.action === 'wbsearchentities' ? { search: [] } : { query: { pages: {} } },
    );
    expect((await resolvePlantPhotos([globalCrop('tomato')!])).tomato).toBeNull();
  });
});
