# RITU — grow with the seasons

Latest browser implementation: [soil evidence, live SoilGrids predictions, FAO-56 daily water accounting, bounded named-variety references and weather-update controls](docs/SCIENTIFIC_IMPLEMENTATION_2026-11-03.md). These optional features preserve measured/model/forecast distinctions and do not certify seasonal water supply or local crop performance.

Latest scientific review: [methods, source limits and the route to local validation](docs/SCIENTIFIC_REVIEW_2026-11-03.md), with a [38-claim evidence matrix](docs/SCIENTIFIC_EVIDENCE_MATRIX_2026-11-03.csv). Established water and crop-timing methods were checked against primary sources; field-specific water and cultivar accuracy remain unconfirmed. The Sources page now distinguishes connected providers from researched candidates.

Latest recommendation audit: [first-section inputs and source-to-screen verification, 3 November](docs/RECOMMENDATION_AUDIT_2026-11-03.md). Repaired drainage, duration-window, source-name and input-propagation defects. **131,760 setup/date evaluations, 547 unit/API tests and 118 distinct browser cases passed.** Every retained source record was compared with the pinned original. These checks verify preliminary screening and software behavior; seasonal water adequacy, cultivar performance and field suitability remain unvalidated. Earlier audit counts below describe older revisions.

Latest tracking update: [adaptive lifecycle, daily check-ins and documented grain-corn heat model](docs/ADAPTIVE_TRACKING_2026-11-03.md). Crops remain active beyond their reference dates; only confirmed final harvest finishes a seasonal farm. A supported model can update short-range timing from real daily weather and confirmed milestones. Other plants keep observation-based guidance without invented numerical predictions.

Latest farmer-facing labels: [common English/Bangla names](docs/COMMON_NAMES_2026-11-02.md). Latin names stay in source details; unavailable translations remain explicit. This follow-up passed 499 unit/API tests, 20 browser checks and the production build.

A bilingual, worldwide field-planning application: describe land, choose **one planting plan** (seasonal crop or perennial care), then manage its calendar, daily field checks and forecast. Each field/crop gets a separate saved farm. The active workflow combines NASA POWER climate, published species requirements and historical regional crop calendars. It starts with the farmer's own inputs; no sample farm or fabricated weather is substituted.

Latest catalogue/image changes: [complete plant catalogue and live image API](docs/PLANT_CATALOGUE_AND_IMAGES_2026-11-01.md).

Earlier exhaustive verification: [six-country source and setup audit](docs/GLOBAL_AUDIT_2026-11-01.md), including every retained source entry, all supported land profiles, independent calendar comparisons and explicit scientific limitations. The matrix passed 263,160 setup/date evaluations; 495 unit/API tests and 752 unique browser cases passed after documented reruns. Review the [per-plant CSV](output/audit/RITU_Plant_Audit.csv), [machine-readable summary](output/audit/RITU_Audit_Summary.json) and [10-page screenshot walkthrough](output/pdf/RITU_Worldwide_Verification_and_Farm_Walkthrough.pdf). Image completion, missing source data and initial failures remain explicit; earlier passing counts describe earlier revisions.

Current implementation and continuation record: [Worldwide single-season workflow](docs/GLOBAL_SINGLE_SEASON_2026-10-31.md) and [working tracker](docs/WORK_TRACKER.md). Abid's latest instructions supersede the annual-rotation interface. Earlier audits and the rotation walkthrough PDF remain historical evidence, not a description of this workflow.

Latest visual repair: [canal-to-soil seam correction](docs/EDGE_CORRECTION_2026-10-26.md), with matching before/after crops and contour/pixel checks. The user clarified that the pale band inside the illustration was the target; earlier outer-layout changes addressed the wrong area.

## Run

Node.js 22.13 or newer and npm are required.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No account, database or API key is needed. Location search, map tiles, weather and new NASA requests need internet. Google fonts download during the build and are served locally afterward. This is not an offline-installable PWA.

```sh
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:browser
npm run build
npm start
```

## Farmer workflow

1. **Land details:** search anywhere, use GPS or enter coordinates, and pin the field. Enter measured area (hectares, acres, m² or decimal/shotok), ready-to-plant date, known soil/drainage and available water. Unknown facts stay unknown. Climate and weather load automatically; no district whitelist is required.
2. **Suggested crops:** compare next-season crop options, reasons, indicative timing and remaining field checks. Choose exactly one crop and create a farm. The selection action stays near the top. Missing provider data shows a retry state rather than invented suggestions.
3. **Farm calendar:** explore reference windows, actual dates, forecast rainfall and conditional field guidance. Record planting, daily observations and partial/final harvest separately. Late crops continue; final harvest completes a seasonal cycle while retaining history, and perennial care continues. An optional documented grain-corn model provides a heat-threshold projection only when the required weather and hybrid evidence exist. Plans are not automatically marked as completed activities.
4. **My farms:** create separate farms for other fields/crops, switch between independent workspaces, export all records, and confirm single-farm deletion or full reset. Previous annual-rotation records remain at `/records`.

Worldwide support does not mean every crop or local cultivar has a verified calendar. The complete source catalogue contains **2,562 plant records**: 2,568 ECOCROP records minus the six retired sorghum entries. It includes vegetables, fruits/nuts, grains, pulses, roots/tubers, forage, trees and other source uses. Search, life-cycle/use filters and 12-result pages expose every retained record, including incomplete ones in catalogue mode. A record needs sufficient temperature, growing-period and field-condition evidence to become selectable. Perennials get an explicitly labelled care/review horizon; generic growing periods do not predict first fruit. Historical calendar observations are used where the selected grid has a record. Otherwise the option is explicitly climate-based and shows a broad source growing-period range. Missing records are never filled from a neighbouring country. This is preliminary screening, not a validated best-crop, yield or optimal-sowing model.

The former DAE/BAMIS rotation library remains available for previous records; its four-district coverage is not applied as a worldwide rule. No retired sorghum crop is reintroduced.

## Data and evidence

- **NASA POWER:** the current crop screen uses explicit **1991–2020 monthly climate normals** (`T2M`, `PRECTOTCORR`), validating the point, baseline, units and all twelve months. Long-term climate participates in matching; it is not a current soil measurement or seasonal forecast. Older daily/yearly history endpoints remain for previous records. [Climatology API](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/).
- **FAO ECOCROP:** the full retained catalogue's temperature ranges, growing periods and source soil/drainage categories, distributed by [OpenCLIM at a pinned commit](https://github.com/OpenCLIM/ecocrop/blob/f13577f4237604b15d85d8e43741714a2d1eb2d4/EcoCrop_DB.csv). [Original database context](https://gaez.fao.org/pages/ecocrop), [distribution/license](https://zenodo.org/records/10843625). RITU implements an explicit screening heuristic, not the full OpenCLIM model. Annual rainfall supplies context/cautions only; neither annual rain nor qualitative irrigation labels establish crop-season water adequacy or change water-based ranking. FAO reports ECOCROP was discontinued around 2015; it is a historical species reference, not a continuously updated cultivar service.
- **Sacks/SAGE calendars:** fourteen **unextrapolated** 0.5° crop/season grids from Sacks et al. (2010). Original observation IDs, timing, grid centres and source links remain traceable. Old regional observations do not establish current crop presence or a field-specific optimum. [Original dataset and documentation](https://sage.nelson.wisc.edu/data-and-models/datasets/crop-calendar-dataset/). Rebuild numeric packages with `scripts/prepare-global-crops.py` (Python/numpy/scipy needed only for regeneration).
- **Open-Meteo / GeoNames:** current model conditions, seven-day forecasts and global place suggestions. Timestamps, missing values and provider failures remain visible. Weather refreshes online while visible; stale conditions do not produce weather-derived prompts.
- **OpenStreetMap / Leaflet:** attributed map tiles and a draggable/touch/keyboard farm pin. The pin is not a surveyed farm boundary. No bulk tile download is included.
- **Daily field guidance:** [FAO crop water needs](https://www.fao.org/4/s2022e/s2022e02.htm) and [integrated pest-management observation principles](https://www.fao.org/agriculture/crops/thematic-sitemap/theme/spi/scpi-home/managing-ecosystems/integrated-pest-management/ipm-how/en/). Checks combine actual planting status, observed stage and fresh, correctly located forecasts. No exact irrigation, fertilizer or pesticide dose is generated.
- **Retained regional references:** DAE/BAMIS calendars and the named 2016 CIMMYT/CSISA mung guide remain in previous-record tools. Their region/variety-specific methods are not silently generalized worldwide. BARC, IRAS, IMERG, SMAP and FAO's separate Crop Calendar API are not integrated current providers.
- **Crop photographs:** the active catalogue loads images through `/api/plant-photo`, using Wikipedia scientific-name records, Wikidata botanical identity/image statements and Wikimedia Commons licensing/credit metadata. Requests are batched, paced and cached. There is no observation-photo or manually placed local-image fallback. Unresolved source images remain unavailable. Public-domain, CC0, CC BY and CC BY-SA photographs are attributed per card. [API implementation and limits](docs/PLANT_CATALOGUE_AND_IMAGES_2026-11-01.md). The earlier [static photo credits](docs/CROP_PHOTO_CREDITS.md) remain historical evidence; retained crop-photo components now use the live API too.

No synthetic climate perturbations, rainfall credits, yield forecasts, measured water savings or proven soil-health gains are presented. Local cultivar dates, soil chemistry, actual root-zone water and field effectiveness still need field evidence and agricultural review. The app does not control irrigation hardware or run unattended background/cloud farming jobs.

## Interface and animation

The white workspace has four large desktop sidebar steps and mobile navigation, English/Bangla, comfortable/larger text, replayable Mati tours, opt-in synthesized farm ambience, volume/mute and click feedback. No sound autoplays. Tours explain actual screens and setup gates without injecting fictional data.

The original **2D** landing illustration follows one farm through **sow → care → grow → harvest**. Only one activity is mounted at a time. Chapter selection pauses for inspection; Play continues and Replay starts at sowing. Motion pauses offscreen, in hidden tabs and under reduced-motion settings. Controls stay outside the artwork. See [research and storyboard](docs/FARM_ANIMATION_STORYBOARD.md). The art is decorative, not a growth/spacing model or NASA imagery; no WebGL is required.

## Records and test boundaries

Inputs and actual observations stay in versioned browser local storage; there is no cloud sync, account system or analytics. Old experimental records are retained for export, not silently treated as validated advice. Invalid newer records are backed up for recovery; no sample farm replaces them. Full reset removes device records only after confirmation and retains language/reading/sound preferences. Export first if records matter.

Only environmental coordinates and necessary dates/crop reference identifiers go through the environmental APIs. Farm names, notes and household details are not sent to NASA or weather providers. Open-Meteo's free endpoint has non-commercial/rate-limit terms; production hosting and service capacity need deployment review.

The current browser contract is `tests/e2e/season-workflow.spec.ts`, plus preserved landing-animation/edge checks. Earlier annual-rotation specs are historical and excluded by the default test match. The current matrix enters 256 complete location/soil/drainage/water input-to-farm runs across desktop and phone, alongside recovery, data-outage, accessibility, language/tour and persistence checks. Provider fixtures are labelled QA records and never shipped as live weather. Automated software checks do not establish field effectiveness or universal bug freedom.

## Team

Start continuation work with [the detailed requirements and working checklist](docs/WORK_TRACKER.md). [The QA matrix](docs/QA_MATRIX.md) records coverage and outstanding physical-device/farmer checks.

| Member                   | Responsibility                                                                |
| ------------------------ | ----------------------------------------------------------------------------- |
| Kamruzzaman Khan Alve    | Research, NASA data, crop evidence, verified comparison rules and methodology |
| Abid Al Hossain Swakkhar | Architecture, calendar, integration, testing and preview application          |
| Mahia Ribahna            | Visual design, graphics, storytelling and presentation assets                 |

See [CONTRIBUTING.md](CONTRIBUTING.md) for file ownership, conventions and checks. Dependencies are pinned in the lockfile. [The supplied plan](docs/PROJECT_PLAN.md) is preserved verbatim; Abid's subsequent instruction on October 2 authorizes this pre-event concept preview and selects Next.js. This preview does not establish official challenge eligibility or replace the full challenge brief.

Repository: [alve775/Ritu](https://github.com/alve775/Ritu). Publishing, project licensing and the final hosting account remain team decisions. No project license has been assumed.
