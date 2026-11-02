import { describe, expect, it } from 'vitest';
import {
  normalizedTaxon,
  parseCommonsPhoto,
  unsuitablePhotoTitle,
  photoPriority,
  type CommonsImageInfo,
} from './plant-photo';
const title = 'File:Tomato fruit.jpg';
const info = {
  url: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/Tomato_fruit.jpg',
  thumburl:
    'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/Tomato_fruit.jpg/500px-Tomato_fruit.jpg',
  descriptionurl: 'https://commons.wikimedia.org/wiki/File:Tomato_fruit.jpg',
  mime: 'image/jpeg',
  extmetadata: {
    LicenseShortName: { value: 'CC BY-SA 4.0' },
    LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' },
    Artist: { value: '<a href="https://example.com">Photographer</a>' },
    ImageDescription: { value: 'Ripe tomato fruits on the plant' },
  },
};
describe('API image provenance and relevance guards', () => {
  it('keeps the exact scientific identity, original file, license and clean photographer credit', () => {
    const p = parseCommonsPhoto(
      info,
      title,
      'Lycopersicon esculentum',
      'Solanum lycopersicum',
      'Q23501',
    )!;
    expect(p.scientific).toBe('Lycopersicon esculentum');
    expect(p.matchedScientific).toBe('Solanum lycopersicum');
    expect(p.author).toBe('Photographer');
    expect(p.source).toBe(info.descriptionurl);
    expect(p.src).toBe(info.thumburl);
    expect(p.entity).toBe('https://www.wikidata.org/wiki/Q23501');
  });
  for (const label of [
    'Drain.jpg',
    'Tomato sewage outlet.jpg',
    'Fence.jpg',
    'Köhler Medizinal Pflanzen.jpg',
    'Illustration.svg',
    'Herbarium.tif',
    'Okra stew.jpg',
    'Seikei Zusetsu vol. 18.jpg',
    'Sonneratia pagatpat Blanco1.175b.png',
    'Acacia brassiiDistMap131.png',
    'Agathis labillardierei herbaium specimen K000553251.jpg',
  ])
    it(`rejects unsuitable or non-photo subject: ${label}`, () =>
      expect(unsuitablePhotoTitle(label)).toBe(true));
  it('rejects unverified collection records, book credits, missing subjects and ambiguous specimens', () => {
    expect(unsuitablePhotoTitle('Nicotiana rustica Erbario Frizzi Perugia.jpg')).toBe(true);
    const patches: NonNullable<CommonsImageInfo['extmetadata']>[] = [
      { Credit: { value: 'https://www.gbif.org/occurrence/1320561145' } },
      { Credit: { value: 'https://records.data.kew.org/occurrences/example' } },
      { Artist: { value: 'Hooker, Icones Plantarum, vol. 29: t. 2839' } },
      { ImageDescription: { value: '' } },
      { ImageDescription: { value: 'Specimen of gaboon (okoume)' } },
      { Categories: { value: 'Acacia distribution maps' } },
      { Categories: { value: 'Nicotiana rustica|Erbario Frizzi Perugia' } },
    ];
    for (const patch of patches)
      expect(
        parseCommonsPhoto(
          { ...info, extmetadata: { ...info.extmetadata, ...patch } },
          title,
          'Solanum lycopersicum',
          'Solanum lycopersicum',
          'Q1',
        ),
      ).toBeNull();
  });
  it('rejects a raster drawing described in metadata even when its filename looks photographic', () => {
    expect(
      parseCommonsPhoto(
        {
          ...info,
          extmetadata: {
            ...info.extmetadata,
            Categories: { value: 'Solanum lycopersicum|Botanical illustrations' },
          },
        },
        title,
        'Lycopersicon esculentum',
        'Solanum lycopersicum',
        'Q23501',
      ),
    ).toBeNull();
    expect(
      parseCommonsPhoto(
        {
          ...info,
          extmetadata: {
            ...info.extmetadata,
            ImageDescription: { value: 'Botanical illustration of tomato' },
          },
        },
        title,
        'Lycopersicon esculentum',
        'Solanum lycopersicum',
        'Q23501',
      ),
    ).toBeNull();
    expect(parseCommonsPhoto(info, title, 'Sonneratia apetala', 'Sonneratia', 'Q1')).toBeNull();
  });
  for (const license of ['CC BY-NC 4.0', 'CC BY-ND 4.0', 'Copyright', 'GFDL', ''])
    it(`does not silently use unsupported license: ${license}`, () =>
      expect(
        parseCommonsPhoto(
          { ...info, extmetadata: { ...info.extmetadata, LicenseShortName: { value: license } } },
          title,
          'Solanum lycopersicum',
          'Solanum lycopersicum',
          'Q1',
        ),
      ).toBeNull());
  it('rejects foreign hosts, mismatched file descriptions and disguised non-photo files', () => {
    for (const patch of [
      { thumburl: 'https://evil.example/photo.jpg' },
      { descriptionurl: 'https://example.com/wiki/File:Tomato_fruit.jpg' },
      { descriptionurl: 'https://commons.wikimedia.org/wiki/File:Fence.jpg' },
      { mime: 'image/svg+xml' },
    ])
      expect(
        parseCommonsPhoto(
          { ...info, ...patch },
          title,
          'Solanum lycopersicum',
          'Solanum lycopersicum',
          'Q1',
        ),
      ).toBeNull();
  });
  it('rejects unscaled originals and nonstandard thumbnail widths rather than issuing blocked media requests', () => {
    expect(
      parseCommonsPhoto(
        { ...info, thumburl: info.url },
        title,
        'Solanum lycopersicum',
        'Solanum lycopersicum',
        'Q1',
      ),
    ).toBeNull();
    expect(
      parseCommonsPhoto(
        { ...info, thumburl: info.thumburl.replace('500px-', '640px-') },
        title,
        'Solanum lycopersicum',
        'Solanum lycopersicum',
        'Q1',
      ),
    ).toBeNull();
  });
  it('normalizes botanical rank punctuation without reducing a variety to its parent species', () => {
    expect(normalizedTaxon('Citrus × sinensis')).toBe(normalizedTaxon('Citrus x sinensis'));
    expect(normalizedTaxon('Brassica oleracea var. capitata')).toBe(
      normalizedTaxon('Brassica oleracea capitata'),
    );
    expect(normalizedTaxon('Brassica oleracea')).not.toBe(
      normalizedTaxon('Brassica oleracea var. capitata'),
    );
  });
  it('prefers a clear fruit/produce reference over a flowering or seedling view', () => {
    const fruit = parseCommonsPhoto(
      info,
      title,
      'Solanum lycopersicum',
      'Solanum lycopersicum',
      'Q1',
    )!;
    expect(photoPriority(fruit)).toBeGreaterThan(
      photoPriority({
        ...fruit,
        title: 'Flowering plant.jpg',
        subject: 'Flowering plant in nursery',
      }),
    );
  });
});
