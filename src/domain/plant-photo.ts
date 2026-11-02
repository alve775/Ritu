export interface PlantPhoto {
  src: string;
  source: string;
  license: string;
  licenseUrl: string;
  author: string;
  scientific: string;
  matchedScientific: string;
  entity: string;
  provider: 'Wikimedia Commons';
  title: string;
  subject: string;
  retrievedAt: string;
}
export const normalizedTaxon = (name: string) =>
  name
    .toLowerCase()
    .normalize('NFC')
    .replace(/\s*×\s*/g, ' x ')
    .replace(/\s+(?:var\.|subsp\.|ssp\.)\s+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
export function plainMetadata(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export function unsuitablePhotoTitle(value: string) {
  return /(?:\.svg$|\.tiff?$|köhler|medizinal|illustration|herbari(?:um|a)|herbaium|\b(?:erbario|herbario|herbier)\b|botanical magazine|seikei.?zusetsu|flora.de.filipinas|blanco\d|lithograph|engraving|dist(?:ribution)?[\s_.-]?map|drawing|diagram|sewage|sewer|drain|fence|signboard|stew|cooked|recipe|salad|soup|pizza|logo|collage)/i.test(
    value,
  );
}
export interface CommonsImageInfo {
  url?: string;
  thumburl?: string;
  descriptionurl?: string;
  mime?: string;
  width?: number;
  height?: number;
  extmetadata?: Record<string, { value?: string }>;
}
export const commonThumbnailWidths = [
  20, 40, 60, 120, 250, 330, 500, 960, 1280, 1920, 3840,
] as const;
/** Wikimedia's documented standard buckets; original-size hotlinks can be denied. */
export function isStandardThumbnail(value: string) {
  try {
    const u = new URL(value);
    return (
      u.protocol === 'https:' &&
      ['upload.wikimedia.org', 'thumb.wikimedia.org'].includes(u.hostname) &&
      u.pathname.includes('/thumb/') &&
      commonThumbnailWidths.some((width) => u.pathname.split('/').at(-1)?.startsWith(`${width}px-`))
    );
  } catch {
    return false;
  }
}
/** Commons metadata proves provenance/reuse, not universal visual accuracy. */
export function parseCommonsPhoto(
  info: CommonsImageInfo,
  title: string,
  scientific: string,
  matchedScientific: string,
  entity: string,
): PlantPhoto | null {
  if (
    !/^Q[1-9][0-9]*$/.test(entity) ||
    normalizedTaxon(matchedScientific).split(' ').length < 2 ||
    unsuitablePhotoTitle(title) ||
    !['image/jpeg', 'image/png', 'image/webp'].includes(info.mime ?? '')
  )
    return null;
  if (
    (info.width !== undefined && info.width < 64) ||
    (info.height !== undefined && info.height < 64)
  )
    return null;
  const text = (key: string) => plainMetadata(info.extmetadata?.[key]?.value);
  const description = text('ImageDescription');
  const categories = text('Categories');
  // A taxon-linked raster can still be a map, book plate or pressed specimen.
  // Fail closed when the source cannot describe the subject, or only credits
  // an occurrence/collection record whose live-plant/photo status is unverified.
  if (!description) return null;
  const credit = text('Credit');
  if (
    /(?:gbif\.org\/occurrence\/|records\.data\.kew\.org\/occurrences\/|icones\s+plantarum)/i.test(
      `${credit} ${text('Artist')}`,
    )
  )
    return null;
  if (
    /\b(?:illustrations?|drawings?|lithographs?|engravings?|watercolou?rs?|herbari(?:um|a)|herbaium|erbario|herbario|herbier|maps?|specimens?)\b/i.test(
      categories,
    )
  )
    return null;
  if (
    /(?:sewage|sewer|drainage outlet|chain.link fence|signboard|\billustration\b|\bdrawing\b|\blithograph\b|\bengraving\b|\bwatercolou?r\b|\bherbari(?:um|a)\b|\bherbaium\b|\bspecimen\b|botanical plate|(?:occurrence|distribution|range)\s+(?:data\s+)?map)/i.test(
      description,
    )
  )
    return null;
  const license = text('LicenseShortName');
  if (!(
    license === 'CC0' ||
    license === 'Public domain' ||
    /^CC BY(?:-SA)? [1234]\.0$/.test(license)
  ))
    return null;
  let image: URL, source: URL;
  try {
    image = new URL(info.thumburl || info.url || '');
    source = new URL(info.descriptionurl || '');
  } catch {
    return null;
  }
  if (!isStandardThumbnail(image.href)) return null;
  if (
    image.protocol !== 'https:' ||
    !['upload.wikimedia.org', 'thumb.wikimedia.org'].includes(image.hostname) ||
    source.protocol !== 'https:' ||
    source.hostname !== 'commons.wikimedia.org' ||
    !source.pathname.startsWith('/wiki/File:')
  )
    return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(source.pathname.slice('/wiki/'.length)).replaceAll('_', ' ');
  } catch {
    return null;
  }
  if (decoded !== title.replaceAll('_', ' ')) return null;
  let licenseUrl = text('LicenseUrl').replace(/^http:/, 'https:');
  if (licenseUrl.startsWith('//')) licenseUrl = 'https:' + licenseUrl;
  if (license === 'Public domain')
    licenseUrl = 'https://commons.wikimedia.org/wiki/Commons:Public_domain';
  if (license === 'CC0') licenseUrl = 'https://creativecommons.org/publicdomain/zero/1.0/';
  if (
    !/^https:\/\/creativecommons\.org\/(licenses|publicdomain)\//.test(licenseUrl) &&
    license !== 'Public domain'
  )
    return null;
  return {
    src: image.href,
    source: source.href,
    license,
    licenseUrl,
    author: text('Artist') || 'Author not named in source metadata',
    scientific,
    matchedScientific,
    entity: `https://www.wikidata.org/wiki/${entity}`,
    provider: 'Wikimedia Commons',
    title,
    subject: description.slice(0, 600),
    retrievedAt: new Date().toISOString(),
  };
}
export function photoPriority(photo: PlantPhoto) {
  const text = `${photo.title} ${photo.subject}`.toLowerCase();
  return (
    (/(?:fruit|fruits|ripe|bunch|pods|bulbs|cloves|bolls|tubers|roots|seeds|nuts|whole|cross.section|close.up)/.test(
      text,
    )
      ? 30
      : 0) - (/(?:flowering|flowers|seedling|nursery|landscape|panorama)/.test(text) ? 15 : 0)
  );
}
