import boundary from './rajshahi-districts.json' with { type: 'json' };
import { regionalCalendars } from '../regional-calendars';
import type { PilotRegion, RegionBoundary } from '../../domain/region';
import type { Season } from '../../domain/evidence-planner';

const seasonCrops = (season: Season) =>
  regionalCalendars.filter((c) => c.group === season).map((c) => c.id);

/** The DAE/BAMIS "Rajshahi region" that the repo's regional crop calendars were published for. */
export const rajshahiRegion: PilotRegion = {
  id: 'rajshahi',
  name: { en: 'Rajshahi region pilot', bn: 'রাজশাহী অঞ্চল পাইলট' },
  scope: regionalCalendars[0].scope,
  calendarSource: {
    en: 'Crop calendars: Department of Agricultural Extension · BAMIS, Rajshahi region',
    bn: 'ফসল পঞ্জিকা: কৃষি সম্প্রসারণ অধিদপ্তর · BAMIS, রাজশাহী অঞ্চল',
  },
  boundary: boundary as RegionBoundary,
  seasonCrops: {
    'pre-monsoon': seasonCrops('pre-monsoon'),
    monsoon: seasonCrops('monsoon'),
    winter: seasonCrops('winter'),
  },
};
