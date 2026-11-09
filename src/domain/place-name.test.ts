import { describe, expect, it } from 'vitest';
import { placeName } from './place-name';

describe('reverse place names', () => {
  it('names the area, district and country', () => {
    expect(
      placeName({
        name: 'Paba Upazila',
        address: {
          county: 'Paba Upazila',
          state_district: 'Rajshahi District',
          state: 'Rajshahi Division',
          country: 'Bangladesh',
        },
      }),
    ).toBe('Paba Upazila, Rajshahi District, Bangladesh');
    expect(
      placeName({
        name: 'রাজশাহী',
        address: { city: 'রাজশাহী', state_district: 'রাজশাহী জেলা', country: 'বাংলাদেশ' },
      }),
    ).toBe('রাজশাহী, রাজশাহী জেলা, বাংলাদেশ');
  });
  it('uses the state when there is no district, and skips repeats', () => {
    expect(
      placeName({
        name: 'Washington',
        address: { city: 'Washington', state: 'District of Columbia', country: 'United States' },
      }),
    ).toBe('Washington, District of Columbia, United States');
    expect(placeName({ name: '', address: { town: 'Bagmara', country: 'Bangladesh' } })).toBe(
      'Bagmara, Bangladesh',
    );
  });
  it('returns null when nothing usable is named', () => {
    expect(placeName({ error: 'Unable to geocode' })).toBeNull();
    expect(placeName(null)).toBeNull();
    expect(placeName({ name: 3, address: [] })).toBeNull();
  });
});
