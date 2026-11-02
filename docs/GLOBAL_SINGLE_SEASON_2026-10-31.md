# Worldwide, single-season, multiple-farm workflow

Superseded catalogue/image coverage: see [the 1 November full catalogue and live image API update](PLANT_CATALOGUE_AND_IMAGES_2026-11-01.md). The 23-species limit and static-photo details below describe the previous checkpoint.

## User requirement superseding the annual-rotation workflow

On 31 October 2026 Abid clarified the intended product:

1. Farmers describe a real field: location/pin, measured area, known soil/drainage and water access.
2. Environmental records load automatically for that location.
3. Show explainable crop suggestions. The farmer chooses **one crop for one season**, not three crops for a year.
4. Create a separate farm workspace with a crop calendar, daily guidance and upcoming weather.
5. Farmers can create multiple farms for separate plots/crops. Preserve their independent activities and notes.
6. Worldwide scope, using reliable free sources where possible; automate data loading and updates. No fabricated data or unsupported crop prescriptions.

This replaces the active annual rotation selection experience. Earlier acceptance/PDF counts document the previous product, not acceptance of this new requirement. They remain historical evidence. The previously generated PDF is not a walkthrough of the new product.

## Implementation

- `/farm`: worldwide search/GPS/pin, field area (hectares, acres, m2 or decimal/shotok), optional name, ready-to-plant date (defaults to local today), texture, drainage and water. No district whitelist. Unknown field facts can stay unknown. Land confirmation is invalidated by changes.
- `/crops`: one option per species for its next candidate season, a single radio selection, reasons, cautions and source links. Six cards initially, with remaining options available explicitly. Create-farm action is near the top and stays available while scrolling. Never require three seasons before creating a farm.
- `/plan` and `/track`: selected farm workspace, illustrative field, single-crop status, month/day calendar, dated forecast rainfall, daily field checks, actual planting/harvest, notes, observed stages and full record export.
- `/farms`: all saved farms, add/switch/open, delete one farm after confirmation, export. Creation never replaces another farm. Data remains local to this browser; no account/cloud synchronization is claimed.
- `/records`: retained prior annual-rotation records and their existing export/edit tools. The old `ritu-evidence-v2` record is not silently migrated into invented new farms or deleted by ordinary creation.
- New independent storage key `ritu-season-farms-v1`. Invalid originals get a recovery copy before subsequent changes; storage failures show a visible export warning. Explicit Reset all data clears the new farms as well as old planner state; reading/language/audio preferences remain.
- Landing copy, sidebar steps, source explanations and tours now describe the one-season/multiple-farm product. Preserve original logo, square corner/vine, existing landing animation and reading/audio controls.

## Actual integrated data sources

### NASA POWER climate baseline

Endpoint: `https://power.larc.nasa.gov/api/temporal/climatology/point`, AG community, `T2M,PRECTOTCORR`, explicit `start=1991&end=2020`. The actual response declares the 30-year 1991–2020 baseline. Validate baseline, units, requested point and all twelve monthly values. No missing-value substitution. Temperature is Celsius; precipitation is mm/day. Monthly rain uses mean month lengths (February 28.25 days) and annual rain is their sum. It is a **long-term baseline**, not current field moisture or a seasonal forecast.

Server caches public baseline responses for 30 days and deduplicates concurrent requests. A client pin change aborts the previous request; a late response must match the requested point. Network reconnection retries. Missing baseline data gives a visible retry state, not fabricated crop suggestions.

Documentation: https://power.larc.nasa.gov/docs/services/api/temporal/climatology/

### FAO ECOCROP numeric requirements

23 species records, identified by scientific name and ECOCROP ID. Source attributes retain temperature limits/preferred ranges, annual rain ranges, pH ranges, growing-time ranges and source texture/drainage categories. Current screening does not pretend that all attributes were measured or all plant constraints were modeled.

- Original database context: https://gaez.fao.org/pages/ecocrop
- Data distribution used: OpenCLIM's `EcoCrop_DB.csv`, pinned to commit `f13577f4237604b15d85d8e43741714a2d1eb2d4`.
- Distribution metadata/license: https://zenodo.org/records/10843625 (OGL-UK-3.0). Attribute FAO original data and OpenCLIM distribution. Numeric source facts are retained; this project does not copy or claim to implement the full OpenCLIM suitability model.
- No retired sorghum entry is reintroduced.

### Historical regional planting/harvest records

Sacks, Deryng, Foley & Ramankutty (2010), *Crop planting dates: an analysis of global patterns*, DOI `10.1111/j.1466-8238.2010.00551.x`, distributed by University of Wisconsin–Madison SAGE.

https://sage.nelson.wisc.edu/data-and-models/datasets/crop-calendar-dataset/

Fourteen 0.5-degree **unfilled, unextrapolated** crop/season grids are integrated. Keep missing cells missing. Never substitute the closest region or use `.fill.nc.gz` extrapolated files as local observations. Records include original mean/window planting days, harvest day, elapsed duration, observation ID, political level, grid centre and original source URL.

`scripts/prepare-global-crops.py` reproduces the packaged requirement subset and compact source grids from public files. It retains source hashes. It needs Python/numpy/scipy only for regeneration, not app runtime. Only source record values are packed, to two decimal places; no calendar is invented. Runtime lookup stays on the server, so the global grid is not downloaded to every browser.

These records can be old/coarse, regional rather than field surveys, and do not prove current crop presence. If no crop calendar exists in a cell, a candidate is marked **climate-based**, with broad ECOCROP timing instead of an invented regional date. FAO's separate Crop Calendar API was inspected during research but is **not** an integrated provider here; its coverage is not worldwide.

### Current weather and seven-day forecasts

Existing Open-Meteo provider, source times, returned local timezone and original request link. Automatic refresh every ten minutes while visible and on reconnection/return. The current estimate is not a farm sensor. Forecast rainfall is shown only on dates present in the actual response. Stale, failed or differently located forecasts must not drive weather-dependent field checks.

Free hosted API is for noncommercial use within its published limits; CC BY 4.0 attribution retained. Scaling/commercial operation requires revisiting provider terms/capacity. https://open-meteo.com/en/docs

## Transparent screening method

- Compare the requested season's weighted mean monthly climate against the ECOCROP species temperature limits.
- For a climate-only option, also reject candidate spans containing a whole month outside those limits; a warm average must not hide a cold month. Historical local winter cereal records remain distinct because dormancy can occur.
- Exclude **known** incompatible coarse texture/drainage categories. Loam maps to medium, clay to heavy, sandy to light. Missing source/field categories remain uncertain, not a claimed pass.
- Rank by preferred-temperature fit, rainfall-related checks for limited/rain-only water, regional-calendar evidence, then next candidate date. This is an explicit heuristic; no scientifically validated yield, profit or optimum score is claimed.
- Annual rainfall is a caution/prioritization check, never a crop-season water balance or watering instruction. Unknown irrigation/texture/drainage stay visible in cautions.
- Return a single next-season option per crop species. A crop selection creates one farm; each new plot/crop needs its own farm.
- Calendar boundaries are stored as exclusive end dates. Displayed indicative finish dates use duration minus one day from the chosen start. Broad species durations and historical regional timing are not cultivar-specific predictions. Nursery/transplanting and cultivar maturity require local confirmation.

## Guidance automation boundaries

Actual planting starts the day counter. It is never inferred from a planned date. Actual harvest cannot precede planting or lie in the future. Tick only completed work; future task checkboxes are disabled. Calendar/day changes reveal that day's guidance.

Checks cover field readiness, establishment, regular crop observation, root-zone water inspection, farmer-observed flowering/maturity, source-duration maturity inspection and actual dated rain/freezing forecasts. Observed stages influence guidance; the app does not invent them from an exact day count. Sources include FAO crop-water guidance and integrated pest-management field observation principles.

- https://www.fao.org/4/s2022e/s2022e02.htm
- https://www.fao.org/agriculture/crops/thematic-sitemap/theme/spi/scpi-home/managing-ecosystems/integrated-pest-management/ipm-how/en/

This is software assistance and monitoring while the app is open, **not** unattended irrigation hardware control, background push/cloud jobs, pest diagnosis, exact fertilizer/pesticide dosing, or a validated agronomic recommendation engine. Those require additional field measurements, local protocols and—in physical automation—appropriate sensors/controllers. No API can infer all of those facts from a map pin.

## Verification record

- Actual `/api/season-context` requests returned HTTP 200 at Manikganj, Washington DC, Sydney, Nairobi, London, Delhi, São Paulo and Tokyo. Exact responses are retained locally and as explicitly historical QA fixtures. Each returned unextrapolated regional records where available.
- 216 land-condition domain profiles (8 locations × 3 soil categories × 3 drainage categories × 3 water systems), plus 10 focused tests: **226 passed**. Scenarios are QA inputs, not 216 measured farms.
- Eight focused desktop/phone pilot cases passed: Manikganj creation, multi-farm isolation/deletion, planting/stage/tasks/export with accessibility checks, and location-change invalidation. A separate live-data run supplies visual evidence rather than treating intercepted test data as live.
- Initial pilot discovery required JSON module attributes in Node ESM; corrected. Browser tests exposed overly verbose implicit select/textarea names; fixed with explicit accessible names. Repeated matching was memoized to keep selection interactions responsive. These initial failures remain in local evidence.
- The final expanded browser run passed **all 280 cases** in 736.22 seconds, with zero skips, unexpected failures or flaky results. This includes **256 complete UI input-to-farm workflows** (8 actual climate locations × 16 soil/drainage/water profiles × desktop/phone). All land values are entered through controls; each run selects exactly one crop, creates its own farm, checks area conversion and stored field values, records a note and verifies reload. The remaining 24 checks cover multi-farm isolation/deletion, actual planting and observed-stage actions, export, axe accessibility, location-change invalidation, partial-record recovery/reset, denied storage, NASA outage/retry, English/Bangla full tours and preserved landing animation/edge behavior.
- Browser matrix requests replay exact archived NASA baseline records. Repeated scenarios deliberately exercise unavailable weather, suppress community map tiles and use isolated contexts; they are not 256 independently surveyed farms or 256 new live NASA downloads. Separate live screenshots and the production probe use normal provider calls.
- After the final selection-bar order change, all four English/Bangla desktop/phone tour cases passed again; the expanded 280-case run also includes that order. The guide visits the selection bar before the crop grid to follow the page top-to-bottom.
- Final serial unit/API/domain run: **438 tests across 20 files passed** in 47.44 seconds. The 216 location/condition domain cases are part of this total, not an additional browser count.
- A final negative test reproduced acceptance of an empty/one-coordinate NASA geometry array despite valid-looking climate values. The parser now requires at least two finite, correctly located coordinates. The failing pre-fix log is retained as point-guard-before.log. The full unit suite and production build/probe passed after the repair; no genuine source values were altered.
- Production build and its TypeScript checks passed after the final guard. Scoped ESLint and formatting passed. Generated next-env.d.ts production-path changes were inspected and restored to the existing development baseline; unrelated assets are preserved.
- A separate temporary production server returned HTTP 200 from /farms and /api/season-context at the Manikganj point, with the actual 1991–2020 NASA baseline and four unextrapolated calendar records. The temporary production server was stopped; the user's development preview remains available on port 3000.
- The 1 November live capture entered the screenshot scenario (Manikganj point 23.86186 N, 90.00273 E; 30 ha, clay, unknown drainage, rain-only water), selected Potato and saved a separate one-season farm. Actual planting/harvest stayed blank. Notes survived reload. These area/field settings are user-provided QA inputs, not independently measured facts or NASA measurements.
- Final desktop and phone images were visually reviewed. Current screenshots: research/global-season-2026-10-31/crops-overview-final.png, farm-overview-final.png, farm-mobile.png and farms-mobile.png. Exact live saved-state evidence is live-smoke.json; production response evidence is production-probe.json.

Local evidence: `research/global-season-2026-10-31/`. Existing annual-flow audit and PDF remain historical. No commit/push is requested for this redesign; preserve unrelated untracked image assets.

Completed and verified on 1 November 2026. Remaining product boundaries are field/cultivar validation, source-record age and granularity, broader crop coverage, physical-farmer usability testing, cloud synchronization/backup restoration UX and actual sensor/controller integration. Software QA does not establish agronomic effectiveness or universal bug freedom.
