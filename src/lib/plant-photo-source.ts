import type { GlobalCrop } from '../domain/global-season';
import type { PlantPhoto, CommonsImageInfo } from '../domain/plant-photo';
import {
  normalizedTaxon,
  parseCommonsPhoto,
  photoPriority,
  unsuitablePhotoTitle,
  isStandardThumbnail,
  commonThumbnailWidths,
} from '../domain/plant-photo';
import { wikimediaApi } from './wikimedia-api';
interface Claim {
  rank?: string;
  mainsnak?: { datavalue?: { value?: unknown } };
}
interface Entity {
  id: string;
  claims?: Record<string, Claim[]>;
  aliases?: { en?: { value: string }[] };
}
interface WikiPage {
  title: string;
  pageimage?: string;
  pageprops?: { wikibase_item?: string };
  imageinfo?: CommonsImageInfo[];
}
interface WikiResponse {
  query?: {
    pages?: Record<string, WikiPage>;
    normalized?: { from: string; to: string }[];
    redirects?: { from: string; to: string }[];
  };
}
interface Evidence {
  entity: string;
  accepted: string;
  files: string[];
  lead?: string;
}
const photoCache = new Map<string, { expires: number; photo: PlantPhoto | null }>();
const pending = new Map<string, Promise<Record<string, PlantPhoto | null>>>();
const values = (entity: Entity | undefined, property: string) =>
  (entity?.claims?.[property] ?? [])
    .filter((c) => c.rank !== 'deprecated')
    .flatMap((c) =>
      typeof c.mainsnak?.datavalue?.value === 'string' ? [c.mainsnak.datavalue.value] : [],
    );
async function getEntities(ids: string[]) {
  if (!ids.length) return {} as Record<string, Entity>;
  const data = (await wikimediaApi('wikidata', {
    action: 'wbgetentities',
    ids: [...new Set(ids)].join('|'),
    props: 'claims|aliases',
    languages: 'en',
  })) as { entities?: Record<string, Entity> };
  return data.entities ?? {};
}
function entityEvidence(
  entity: Entity | undefined,
  plant: GlobalCrop,
  redirected = false,
  lead?: string,
): Evidence | null {
  // A genus page can redirect from a species in a monotypic group, but its
  // image is not species-level identity evidence. Let exact taxon search run.
  const names = values(entity, 'P225').filter(
    (name) => normalizedTaxon(name).split(' ').length >= 2,
  );
  const exact = names.some((name) => normalizedTaxon(name) === normalizedTaxon(plant.scientific));
  const alias = entity?.aliases?.en?.some(
    (name) => normalizedTaxon(name.value) === normalizedTaxon(plant.scientific),
  );
  if (
    !entity ||
    !/^Q[1-9][0-9]*$/.test(entity.id) ||
    !names.length ||
    !(exact || alias || (redirected && normalizedTaxon(plant.scientific).split(' ').length === 2))
  )
    return null;
  const files = [...new Set([...values(entity, 'P18'), ...(lead ? [lead] : [])])]
    .filter((file) => !unsuitablePhotoTitle(file))
    .slice(0, 6);
  return files.length ? { entity: entity.id, accepted: names[0], files, lead } : null;
}
async function fetchPhotos(plants: GlobalCrop[]): Promise<Record<string, PlantPhoto | null>> {
  const wiki = (await wikimediaApi('wikipedia', {
    action: 'query',
    redirects: '1',
    prop: 'pageprops|pageimages',
    piprop: 'name',
    titles: plants.map((p) => p.scientific).join('|'),
  })) as WikiResponse;
  const pages = Object.values(wiki.query?.pages ?? {}),
    links = [...(wiki.query?.normalized ?? []), ...(wiki.query?.redirects ?? [])];
  const pageFor = (plant: GlobalCrop) => {
    let title = plant.scientific;
    for (let i = 0; i < 10; i++) {
      const next = links.find((l) => l.from === title);
      if (!next) break;
      title = next.to;
    }
    return {
      page: pages.find((p) => p.title === title),
      redirected: (wiki.query?.redirects ?? []).some((l) => l.from === plant.scientific),
    };
  };
  const entities = await getEntities(
    pages
      .map((p) => p.pageprops?.wikibase_item)
      .filter((v): v is string => !!v && /^Q[1-9][0-9]*$/.test(v)),
  );
  const evidence = new Map<string, Evidence>();
  for (const plant of plants) {
    const { page, redirected } = pageFor(plant),
      id = page?.pageprops?.wikibase_item;
    const match = id ? entityEvidence(entities[id], plant, redirected, page?.pageimage) : null;
    if (match) evidence.set(plant.id, match);
  }
  // Missing pages, plant varieties and fruit articles are resolved to an exact
  // P225 scientific taxon. A first fuzzy search result is never sufficient.
  const unresolved = plants.filter((p) => !evidence.has(p.id));
  const searches = new Map<string, string[]>();
  for (const plant of unresolved) {
    const data = (await wikimediaApi('wikidata', {
      action: 'wbsearchentities',
      search: plant.scientific,
      language: 'en',
      type: 'item',
      limit: '6',
    })) as { search?: { id: string }[] };
    searches.set(
      plant.id,
      (data.search ?? []).map((s) => s.id).filter((id) => /^Q[1-9][0-9]*$/.test(id)),
    );
  }
  const fallbackIds = [...new Set([...searches.values()].flat())];
  const fallback: Record<string, Entity> = {};
  for (let i = 0; i < fallbackIds.length; i += 40)
    Object.assign(fallback, await getEntities(fallbackIds.slice(i, i + 40)));
  for (const plant of unresolved) {
    for (const id of searches.get(plant.id) ?? []) {
      const match = entityEvidence(fallback[id], plant);
      if (match) {
        evidence.set(plant.id, match);
        break;
      }
    }
  }
  const files = [...new Set([...evidence.values()].flatMap((e) => e.files))];
  const imageInfo = new Map<string, { title: string; info: CommonsImageInfo }>();
  for (let i = 0; i < files.length; i += 30) {
    const data = (await wikimediaApi('commons', {
      action: 'query',
      prop: 'imageinfo',
      iiprop: 'url|extmetadata|mime|size',
      iiurlwidth: '500',
      titles: files
        .slice(i, i + 30)
        .map((file) => 'File:' + file)
        .join('|'),
    })) as WikiResponse;
    for (const page of Object.values(data.query?.pages ?? {}))
      if (page.imageinfo?.[0])
        imageInfo.set(page.title.replaceAll('_', ' '), {
          title: page.title,
          info: page.imageinfo[0],
        });
  }
  // imageinfo returns an unscaled original when the requested size exceeds
  // the source width. Ask the API for a smaller documented standard bucket;
  // do not construct URLs or hotlink originals as a fallback.
  const smaller = new Map<number, string[]>();
  for (const source of imageInfo.values()) {
    if (isStandardThumbnail(source.info.thumburl ?? '')) continue;
    const width = source.info.width;
    if (typeof width !== 'number' || width < 64) continue;
    const bucket = [...commonThumbnailWidths].reverse().find((size) => size < width && size <= 500);
    if (bucket) smaller.set(bucket, [...(smaller.get(bucket) ?? []), source.title]);
  }
  for (const [width, titles] of smaller)
    for (let offset = 0; offset < titles.length; offset += 30) {
      const data = (await wikimediaApi('commons', {
        action: 'query',
        prop: 'imageinfo',
        iiprop: 'url|extmetadata|mime|size',
        iiurlwidth: String(width),
        titles: titles.slice(offset, offset + 30).join('|'),
      })) as WikiResponse;
      for (const page of Object.values(data.query?.pages ?? {}))
        if (page.imageinfo?.[0])
          imageInfo.set(page.title.replaceAll('_', ' '), {
            title: page.title,
            info: page.imageinfo[0],
          });
    }
  const result: Record<string, PlantPhoto | null> = {};
  for (const plant of plants) {
    const match = evidence.get(plant.id),
      candidates: PlantPhoto[] = [];
    for (const file of match?.files ?? []) {
      const source = imageInfo.get(('File:' + file).replaceAll('_', ' '));
      if (!source || !match) continue;
      const photo = parseCommonsPhoto(
        source.info,
        source.title,
        plant.scientific,
        match.accepted,
        match.entity,
      );
      if (photo) candidates.push(photo);
    }
    const priority = (photo: PlantPhoto) =>
      photoPriority(photo) +
      (match?.lead &&
      photo.title.replaceAll('_', ' ') === ('File:' + match.lead).replaceAll('_', ' ')
        ? 40
        : 0);
    result[plant.id] = candidates.sort((a, b) => priority(b) - priority(a))[0] ?? null;
  }
  return result;
}
/** API-delivered source images, batched and cached; no local photo manifest. */
export async function resolvePlantPhotos(plants: GlobalCrop[]) {
  const result: Record<string, PlantPhoto | null> = {},
    missing: GlobalCrop[] = [];
  for (const plant of plants) {
    const hit = photoCache.get(plant.id);
    if (hit && hit.expires > Date.now()) result[plant.id] = hit.photo;
    else missing.push(plant);
  }
  if (!missing.length) return result;
  const key = missing
    .map((p) => p.id)
    .sort()
    .join(',');
  let request = pending.get(key);
  if (!request) {
    request = fetchPhotos(missing).then((data) => {
      for (const [id, photo] of Object.entries(data)) {
        if (photoCache.size >= 1024) photoCache.delete(photoCache.keys().next().value!);
        photoCache.set(id, { photo, expires: Date.now() + (photo ? 86400000 : 3600000) });
      }
      return data;
    });
    pending.set(key, request);
  }
  try {
    return { ...result, ...(await request) };
  } finally {
    if (pending.get(key) === request) pending.delete(key);
  }
}
