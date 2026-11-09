import { describe, expect, it } from 'vitest';
import { pointInRings, regionFor } from './region';
import { pilotRegionFor, pilotRegions } from '../data/regions';
import { rajshahiRegion } from '../data/regions/rajshahi';
import { regionalCalendars } from '../data/regional-calendars';

const at = (latitude: number, longitude: number) => pilotRegionFor({ latitude, longitude });

describe('pilot regions', () => {
  it('finds fields inside the four Rajshahi-region districts', () => {
    const inside: [string, number, number, string][] = [
      ['Rajshahi city', 24.3745, 88.6042, 'rajshahi'],
      ['Godagari', 24.468, 88.329, 'rajshahi'],
      ['Tanore', 24.62, 88.56, 'rajshahi'],
      ['Naogaon town', 24.7936, 88.9318, 'naogaon'],
      ['Natore town', 24.41, 88.99, 'natore'],
      ['Chapainawabganj town', 24.5965, 88.2775, 'chapainawabganj'],
      ['Nachole', 24.73, 88.41, 'chapainawabganj'],
    ];
    for (const [place, lat, lon, district] of inside) {
      const match = at(lat, lon);
      expect(match?.region.id, place).toBe('rajshahi');
      expect(match?.district.id, place).toBe(district);
    }
  });
  it('returns null outside the pilot region or without a location', () => {
    const outside: [string, number, number][] = [
      ['Dhaka', 23.8103, 90.4125],
      ['Dinajpur', 25.6217, 88.6355],
      ['Bogura', 24.8481, 89.373],
      ['Joypurhat', 25.1, 89.02],
      ['Manikganj', 23.86186, 90.00273],
      ['Nairobi', -1.2921, 36.8219],
    ];
    for (const [place, lat, lon] of outside) expect(at(lat, lon), place).toBeNull();
    expect(pilotRegionFor(undefined)).toBeNull();
    expect(at(Number.NaN, 88.6)).toBeNull();
    expect(regionFor({ latitude: 24.37, longitude: 88.6 }, [])).toBeNull();
  });
  it('handles holes with even-odd rings', () => {
    const square = [
      [0, 0],
      [10, 0],
      [10, 10],
      [0, 10],
      [0, 0],
    ];
    const hole = [
      [4, 4],
      [6, 4],
      [6, 6],
      [4, 6],
      [4, 4],
    ];
    expect(pointInRings(2, 2, [square, hole])).toBe(true);
    expect(pointInRings(5, 5, [square, hole])).toBe(false);
    expect(pointInRings(11, 5, [square])).toBe(false);
  });
  it('offers only crops with a sourced regional calendar, in the right season', () => {
    const { seasonCrops } = rajshahiRegion;
    expect(seasonCrops.monsoon).toEqual(['aman']);
    expect(seasonCrops['pre-monsoon']).toEqual(expect.arrayContaining(['aus', 'mung']));
    expect(seasonCrops.winter).toEqual(expect.arrayContaining(['boro', 'lentil', 'mustard']));
    const all = Object.values(seasonCrops).flat();
    expect(new Set(all).size).toBe(regionalCalendars.length);
    expect(pilotRegions.map((r) => r.id)).toEqual(['rajshahi']);
  });
  it('keeps the boundary attribution with the data', () => {
    expect(rajshahiRegion.boundary.license).toBe('CC BY 3.0 IGO');
    expect(rajshahiRegion.boundary.districts.map((d) => d.id).sort()).toEqual([
      'chapainawabganj',
      'naogaon',
      'natore',
      'rajshahi',
    ]);
  });
});
