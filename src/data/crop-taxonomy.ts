import type { CropId } from '../domain/types';
/** Primary botanical references, checked 2026-10-26. Rice seasons share one species/family. Mustard species remains unspecified; Brassica crop species share Brassicaceae. */
export const cropTaxonomy: Partial<Record<CropId, { family: string; source: string }>> = {
  aman: { family: 'Poaceae', source: 'https://www.kew.org/plants/asian-rice' },
  boro: { family: 'Poaceae', source: 'https://www.kew.org/plants/asian-rice' },
  aus: { family: 'Poaceae', source: 'https://www.kew.org/plants/asian-rice' },
  wheat: { family: 'Poaceae', source: 'https://www.kew.org/plants/bread-wheat' },
  maize: { family: 'Poaceae', source: 'https://www.kew.org/plants/maize' },
  lentil: { family: 'Fabaceae', source: 'https://www.kew.org/plants/lentil' },
  mustard: {
    family: 'Brassicaceae',
    source: 'https://npgsweb.ars-grin.gov/gringlobal/taxon/taxonomydetail?id=7654',
  },
  mung: { family: 'Fabaceae', source: 'https://www.nparks.gov.sg/florafaunaweb/flora/5/8/5888' },
  potato: { family: 'Solanaceae', source: 'https://www.kew.org/plants/potato' },
};
