# RITU (ঋতু) · crop planning with NASA data for Rajshahi farmers

Ritu helps a farmer in the Rajshahi region of Bangladesh plan a whole year on each plot of land: which crops to grow in the three seasons, when to sow, when to irrigate and for how long, and what to watch for. It compares the farmer's own rotation from last year with alternatives, using NASA rain, soil-moisture and climate data for the farmer's location, and then turns the chosen plan into a daily calendar. It works in English and Bangla.

- **Live demo:** https://ritu-three.vercel.app
- **NASA Space Apps Challenge 2026:** Field Shift: Adapting Farms with NASA Data
- **Pilot region:** Rajshahi, Chapainawabganj, Natore and Naogaon districts

## What a farmer does

1. **Dashboard:** add a land by pinning it on the map and giving its size. Weather, long-term climate and soil (texture and pH from SoilGrids) load for that point. Divide the land into plots.
2. **Plot:** give the plot's size and what grew there last year in each season. A plot can have its own water and drainage if they differ from the rest of the land.
3. **Year plans:** Ritu shows three whole-year plans for the plot, with last year's rotation as Plan A when it is known. Each plan shows the irrigations it needs, heat risk, soil fit and how much it wears out the soil, crop by crop, with the reasons. NASA lines on the plan say where a dry spell usually hits a crop at flowering and where the soil is usually too dry to sow without watering first. The farmer can also build a plan crop by crop.
4. **Crop calendar:** the chosen plan becomes one calendar for the plot. A Today card says what to do (sow, irrigate with pump hours, harvest, or a field job such as top-dressing urea), with the live forecast and, for days beyond it, the usual weather, rain, root-zone wetness and dry-spell chance for that week. Sowing deadlines, late sowing, cancelled or lost crops and early harvests are handled. The plan can be changed for crops not yet sown; crops already sown stay in it.
5. **Your diary:** notes with tags, photos and reminders, shown on the calendar.

Lands outside the pilot region get a one-season crop chooser instead of year plans, because the crop calendars and NASA rain and soil summaries cover only the four districts.

## How NASA data is used

| NASA dataset                                                                                                                                                                                    | What Ritu takes from it                                                                                                                                | Where it changes the advice                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [NASA POWER](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/) 1991–2020 monthly climatology at the pin (temperature, maximum and minimum, corrected rain, top-soil wetness) | Monthly rain and reference crop water use (FAO-56 Hargreaves ET0)                                                                                      | Week-by-week water balance of every crop: how many irrigations, in which weeks, and how many pump hours; heat risk at the crop's sensitive stage                                                                                                                                                                                                                                                                                                       |
| [GPM IMERG Final daily precipitation, V07](https://doi.org/10.5067/GPM/IMERGDF/DAY/07) (GES DISC, 0.1°), 1 Jan 2001 to 30 Sep 2025                                                              | For each week of the year: mean rain, 20th and 80th percentiles, and the share of years in which a run of 21 or more days below 1 mm touched that week | Dry-spell risk in each crop's flowering and grain weeks. The rain the water plan counts on there becomes extra irrigation in a dry year, so the plan's score drops by the expected extra irrigations (from 20% of years); from 40% the crop's water bar also rises on plots with limited water, rain only or a severe shortage. Calendar days show the weekly rain and dry-spell chance; the Today card says not to wait for rain in usually dry weeks |
| [SMAP L4 surface and root-zone soil moisture, V8](https://doi.org/10.5067/T5RUATAQREF8) (NSIDC DAAC, 9 km), 1 Apr 2015 to 31 Dec 2025                                                           | For each week: mean root-zone wetness (3-hour value nearest 12:00 Bangladesh time), scaled from the driest to the wettest week anywhere in the region  | The soil water a crop other than rice starts with at sowing (rice starts on a puddled field). Below half the regional range, Ritu adds one irrigation before sowing to the plan and the calendar. Calendar days show the usual root-zone wetness                                                                                                                                                                                                       |

The IMERG and SMAP summaries were built once from NASA Earthdata, requesting only the box 87.9–89.45° E, 24.0–25.3° N (slightly larger than the four pilot districts, which decide where year plans are offered) through NASA's OPeNDAP service, and are shipped with the app in `src/data/nasa/` (about 1 MB each). The app reads them through `/api/nasa-local`; no NASA login is needed to run it. All values describe a grid square of about 10 km, not one field, and the app says "in this area".

**No trained model.** Ritu combines counted NASA history (averages, percentiles, how often a dry spell happened), published crop requirements and stated assumptions to estimate irrigation needs and pump time. The assumptions are in the code: for example, pump hours assume a shallow tube well giving 14 litres a second, and the soil-wear bar is a rating from the crop sequence (rice after rice, the same crop again, a pulse). Each figure can be traced to its data or assumption.

## Other data

- **Crop calendars and rotations:** sowing windows and durations are planning values from BARI, BRRI and DAE/BAMIS calendars for north-west Bangladesh. There are 18 crops: chickpea, onion, garlic, brinjal, groundnut and black gram were added from the DAE district crop table and the BAMIS Rajshahi-region calendars. The 36 rotations combine the region's common patterns from those calendars with combinations of the same crops whose seasons fit together; the three with black gram in place of Aman are suggested only where no Aman plan fits the plot. Field jobs (fertiliser, weeding, pest checks) follow the same guidance. Crop coefficients: FAO-56 Table 12. Some heat limits and soil fits are commonly reported values that are marked in the code as not yet checked against a source.
- **Soil:** [ISRIC SoilGrids](https://isric.org/explore/soilgrids) texture and pH at 5–15 cm, kept separate from a farmer's own soil test. Crop pH ranges: [FAO ECOCROP](https://www.fao.org/geospatial/data-and-tools/data-portals/ecocrop/en).
- **Soil survey (Rajshahi, Chapainawabganj, Natore, Naogaon):** soil texture and drainage are filled in from the soil units of the [BARC Crop Zoning Information System](https://czis.cropzoning.gov.bd) (SRDI soil survey data, the data behind the government's Khamari app), sampled once every 0.005° (about 500 m) and shipped in `src/data/barc/`. Used before SoilGrids texture where there is a soil unit; the farmer's own choice always wins. Reproduced under the portal's [copyright policy](https://portal.cropzoning.gov.bd/copyrightPolicy).
- **Fertiliser:** each crop in the calendar shows the [BARC Crop Zoning Information System](https://czis.cropzoning.gov.bd) fertiliser recommendation for the land's pin (by point, from SRDI soil nutrient data), scaled to the plot's size, with one common variety per crop (`src/data/barc/fertilizer-crops.json`). Ritu asks BARC live and caches the answer for a day; the recommendations at the app's starting pin and the Godagari test land are saved in `src/data/barc/rajshahi-fertilizer.json` so the demo does not depend on BARC's server. Where BARC can't be reached, the card links to BARC's own page.
- **Weather:** [Open-Meteo](https://open-meteo.com/en/docs) 7-day forecast and place search; [OpenStreetMap](https://www.openstreetmap.org/copyright) map tiles.
- **Pilot boundary:** geoBoundaries district outlines (BBS, OCHA ROAP).

The Sources page in the app lists every dataset with its period and link.

## Limits

Ritu gives planning values for common varieties, not field-specific prescriptions. NASA values are for a grid square, past years are not a forecast, and the crop values have not been reviewed by an agronomist for this app. It gives no yield forecast and no fertiliser or pesticide doses. Records are stored only in the browser on the device (no account, no server database); "Export all records" downloads them, diary photos included.

## Run

Node.js 22.13 or newer and npm.

```sh
npm ci
npm run dev          # http://127.0.0.1:3000
```

No account, database or API key is needed. Location search, map tiles, weather and NASA POWER requests need internet.

```sh
npm run typecheck
npm run lint
npm test             # unit tests (vitest)
npm run build
```

Browser tests (`npm run test:browser`, Playwright) were written for earlier versions of the interface and have not yet been updated to the year-plan screens.

## Where things are

| Path                                                  | What it holds                                                                                                                              |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/domain/rotation/`                                | Scheduling, weekly water balance (`crop-weeks.ts`), plan scoring and dry-spell risk (`assess.ts`), the day-by-day calendar (`day-plan.ts`) |
| `src/domain/nasa-local.ts`                            | Reading the IMERG and SMAP weekly summaries at a pin                                                                                       |
| `src/data/rotation-crops.ts`, `src/data/crop-jobs.ts` | Crops, rotations and field jobs, with their sources in comments                                                                            |
| `src/data/nasa/`                                      | The IMERG and SMAP summaries                                                                                                               |
| `src/data/barc/`                                      | The BARC crop-zoning soil grid for Rajshahi, Chapainawabganj, Natore and Naogaon                                                           |
| `src/components/rotation/`                            | Year plans and the crop calendar                                                                                                           |

## Team

| Member                   | Responsibility                                                                |
| ------------------------ | ----------------------------------------------------------------------------- |
| Kamruzzaman Khan Alve    | Research, NASA data, crop evidence, verified comparison rules and methodology |
| Abid Al Hossain Swakkhar | Architecture, calendar, integration, testing and preview application          |
| Mahia Ribahna            | Visual design, graphics, storytelling and presentation assets                 |

Repository: [alve775/Ritu](https://github.com/alve775/Ritu). Dependencies are pinned in the lockfile.
