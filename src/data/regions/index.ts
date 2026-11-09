import { rajshahiRegion } from './rajshahi';
import { regionFor as findRegion, type PilotRegion } from '../../domain/region';
import type { FarmSite } from '../../domain/farm-site';

/** Regions where Ritu compares rotations. Add a region by adding its file here. */
export const pilotRegions: PilotRegion[] = [rajshahiRegion];
export const pilotRegionFor = (site?: Pick<FarmSite, 'latitude' | 'longitude'>) =>
  findRegion(site, pilotRegions);
