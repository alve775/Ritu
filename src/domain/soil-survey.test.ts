import { describe, expect, it } from 'vitest';
import { soilSurveyAt, type SoilSurveyFile } from './soil-survey';

// A 2 x 3 grid in the shape scripts/fetch-barc-rajshahi.py writes, with units as BARC returned
// them at Godagari and Naogaon, an empty unit, and a poorly drained clay unit.
const fields = [
  'land_type_name',
  'texture_name',
  'drainage_name',
  'reaction_name',
  'soil_group_name',
  'aez',
];
const file: SoilSurveyFile = {
  source: 'BARC CZIS',
  sourceUrl: 'https://czis.cropzoning.gov.bd',
  copyright: 'https://portal.cropzoning.gov.bd/copyrightPolicy',
  retrievedAt: '2026-11-11T08:00:00+00:00',
  fields,
  step: 0.005,
  origin: [24.0, 88.0],
  rows: 2,
  cols: 3,
  units: [
    ['High Land', 'Loam', 'Imperfectly Drained', 'Neutral', 'Amnura', 26],
    [null, null, null, null, null, null],
    ['Low land', 'Clay', 'Poorly Drained', 'Moderately Acidic', 'Manda', 3],
    ['High Land', 'Sandy Loam ', 'Well Drained', 'Neutral', 'Gangachara', 11],
  ],
  cells: [0, 1, -2, 2, 3, -1],
};

describe('BARC soil survey grid', () => {
  it('reads the soil unit of the pin’s cell', () => {
    expect(soilSurveyAt(file, 24.001, 88.002)).toMatchObject({
      landType: 'High Land',
      texture: 'Loam',
      series: 'Amnura',
      aez: 26,
      soil: 'loam',
      drains: null,
    });
  });
  it('maps textures and drainage to the app’s own answers', () => {
    expect(soilSurveyAt(file, 24.005, 88.0)).toMatchObject({ soil: 'clay', drains: 'poor' });
    // BARC writes this class with a trailing space.
    expect(soilSurveyAt(file, 24.005, 88.005)).toMatchObject({
      texture: 'Sandy Loam',
      soil: 'sandy',
      drains: 'good',
    });
  });
  it('says none for rivers, towns and empty units', () => {
    expect(soilSurveyAt(file, 24.0, 88.005)).toBe('none');
    expect(soilSurveyAt(file, 24.0, 88.01)).toBe('none');
  });
  it('returns null outside the districts and the grid', () => {
    expect(soilSurveyAt(file, 24.005, 88.01)).toBeNull();
    expect(soilSurveyAt(file, 23.9, 88.0)).toBeNull();
    expect(soilSurveyAt(file, 24.0, 89.0)).toBeNull();
    expect(soilSurveyAt(file, Number.NaN, 88.0)).toBeNull();
  });
});
