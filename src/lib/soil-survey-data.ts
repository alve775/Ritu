import grid from '../data/barc/rajshahi-soil.json' with { type: 'json' };
import { soilSurveyAt, type SoilSurveyFile } from '../domain/soil-survey';

const file = grid as unknown as SoilSurveyFile;

/** BARC soil unit at a pin in Rajshahi, Chapainawabganj, Natore and Naogaon, from the grid shipped with Ritu. */
export const loadSoilSurvey = (lat: number, lon: number) => soilSurveyAt(file, lat, lon);
