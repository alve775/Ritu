> **Superseded workflow:** The real-only finalization and sequential 2D storyboard replace the prototype rules/screens described below. Start with [FINALIZATION_2026-10-26.md](FINALIZATION_2026-10-26.md) and [FARM_ANIMATION_STORYBOARD.md](FARM_ANIMATION_STORYBOARD.md). Earlier passing counts are historical, not verification of the current source state.

# Farmer workflow and NASA integration — 26 October 2026

> Superseded intake controls: see [the current live workflow](LIVE_FARM_WORKFLOW.md). The location/year form described in the earlier work below has been replaced by typed global search, farm-pin map and automatic weather/forecast/NASA context. Current verification is 164 unit checks and 136 distinct browser cases across full/focused runs. Crop rules still need local validation.

## Authorized scope

The latest request replaces the mock-only data restriction: integrate authentic NASA environmental history, simplify the interface for farmers, restore four large steps in a desktop left sidebar and use the available workspace. The user clarified that images must be clear CROP PHOTOGRAPHS, not satellite imagery. Use verified public-domain/CC0 photos with source credits where permitted; preserve the existing schematic 3D source for future anatomy work. Keep English/Bangla, tours, sound controls, saved calendars, tracking and reset. Do not silently remove household requirements. Do not publish without a separate request.

## Implementation checklist

- [x] Desktop left navigation: Farm → Crops → Calendar → Track; useful mobile navigation.
- [x] White main workspace, readable text, large targets, visible essential choices.
- [x] Show priorities, household requirements and previous crops without opening a disclosure.
- [x] Real NASA POWER ingestion, units, missing-value checks, provenance and historical year.
- [x] Live refresh endpoint; a verified NASA snapshot for offline startup, never fake fallback values.
- [x] Actual observations feed experimental planning comparisons; hypothetical scenarios clearly distinguished.
- [x] Ten clear public-domain/CC0 crop photo references cover twelve planning entries. Rice seasons share one species photo; mung is explicitly a harvested-seed reference. The existing 3D source is preserved; the active explorer uses photos. No satellite image is presented as a crop photo.
- [x] Explain that crop thresholds/windows remain experimental and require local agronomic validation.
- [x] Preserve hard household requirements on changes; explicit conflict resolution only.
- [x] Update tour sequence, truthful landing/source copy and saved display preferences.
- [x] Parser/API tests, full workflow tests, visual responsive inspection, lint/type/build.
- [x] Record passed, failed and untested checks below.

## Primary evidence and boundaries

- Official challenge: https://www.spaceappschallenge.org/2026/challenges/adapting-farms-with-nasa-data/ — NASA Earth observations plus local soil information, crop characteristics and farmer priorities, exploring rotations for soil health and adaptation. The public page currently exposes the summary; do not invent unpublished detailed requirements.
- NASA POWER daily API: https://power.larc.nasa.gov/docs/services/api/temporal/daily/ — daily source-native-resolution meteorology. Use PRECTOTCORR (mm/day), T2M/T2M_MAX/T2M_MIN (°C), GWETTOP (dimensionless). MERRA-2 source grid is regional (0.5° latitude × 0.625° longitude), not a soil test or field sensor.
- NASA GIBS was researched and two scenes were inspected, then excluded after the user clarified that they want clear crop photographs. No GIBS imagery is shipped or claimed as integrated.
- WCAG target size enhanced: https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html — 44 × 44 CSS px; RITU aims for 48 px controls. This does not establish farmer usability without user testing.
- W3C cognitive accessibility: https://www.w3.org/WAI/cognitive/ — clear labels, familiar controls, consistent navigation and available help.
- Contest third-party materials rules: https://www.spaceappschallenge.org/legal/ — requires public availability/appropriate license, license documentation and citation of every source. Select only public-domain/CC0 photographs here, retain metadata, and link sources/licenses in the UI and project documentation. Photographs are reference examples, not NASA data, a specific Bangladeshi cultivar, or predicted crop growth.
- Wikimedia reuse instructions: https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia — verify each file's specific rights and original author, not just the repository's availability.
- BARI field study: https://www.banglajol.info/index.php/BAJ/article/view/62850/42825 — cultivar-specific mustard/Boro trials in Chalanbeel, Sirajganj, 2018–20. It is NOT evidence for every crop/date in Barind; do not transplant those prescriptions or reported yield gains.
- FAO Northwest Bangladesh context: https://www.fao.org/4/ag257e/AG257E06.htm — historical drought/physiography context, not current measured field conditions.

## Data rules

Monthly rain sums valid daily precipitation. Temperature and wetness use arithmetic means of valid daily values. Missing/sentinel/non-finite records must not become zero. Full-year planning inputs require complete daily coverage. March–February charts reorder months of one historical January–December year; January/February are the same source year, not fabricated next-year observations. A historical year is not a forecast for a future calendar.

POWER supplies modeled/reanalysis meteorology, not a crop recommendation engine. IMERG and SMAP are reference/planned sources unless actually ingested. NASA does not provide RITU's soil-texture input, cultivar, sowing spacing, local pest assessment, yield prediction or measured water savings. All provisional crop rules must retain their experimental label.

## Verification log

- 144 unit/API/asset tests passed in 11 files. They verify NASA daily aggregation, missing/sentinel/invalid records, leap days, units/location/year, fixed-host API requests, failure/cache behavior, photo rights and file hashes, and existing planner/calendar invariants.
- NASA live endpoint: Naogaon 24.81° N, 88.95° E, 2025; HTTP 200, 365 validated days, 1922.69 mm annual precipitation. This is an actual separate upstream record. Rajshahi bundled record: 1826.92 mm in 365 days, with original daily fixture retained for reproducibility.
- All 28 full-tour steps and six section replays passed unobscured-focus checks in English/Bangla on desktop/mobile, including large Bangla text. Initial failures found and fixed a sticky Continue target and old 3D assertions; sound and streaming/reduced-motion checks are retained.
- Focused final source-dependent blocker/scenario/large-text checks: 8 passed. The former dry-scenario assumption no longer matched the authentic rainfall year; the test now exercises unknown irrigation (a real blocked input), rather than forcing a failed outcome from the data.
- Strict TypeScript and ESLint passed. One exhaustive unit test exceeded its 30-second budget while browser/lint tasks ran concurrently; the unchanged unit suite passed in 18 seconds when run without browser contention. Final browser coverage: 118 cases passed across the complete run and focused reruns. The complete 116-case run passed 112; four remaining assertions expected old household wording/tour order and all four passed after updating them. Two additional desktop/mobile checks verify that scenario-adjusted quantities are labelled as hypothetical, not historical. Production build and its TypeScript/static generation passed, including /api/climate and /sample. An isolated production server also passed runtime checks for home/farm/sample, HTTP 200 for all ten photos, HTTP 400 for an invalid NASA query, and zero browser runtime errors; that temporary server was stopped. ESLint and formatting checks passed.
- Visual inspection: 1920px desktop farm/crop/explorer screens and a photo contact sheet. The first satellite scene was rejected as cloud-obscured; both satellite assets were removed after the user's clarification. Final 390px phone crop/farm screenshots and 320px extra-large Bangla were inspected; no document overflow was found. Source and image failure handling and source-record preservation were tested.
- Existing original PROJECT_PLAN.md SHA-256 remains 46DE5AC2463D3CEFAFBF4E4537B1B16B7499A9B9B23062A5DFDE3678F184719A. The user's untracked October 14 image remains B2A05F18173C5FB6263E73EE563DB12350DC8F186F5F56094C6DA56DCE237492. No new commit or push.

## Remaining external work

- Local cultivar-specific planting/harvest dates, preparation gaps, crop/soil/drainage/irrigation thresholds and priority weight validation. The engine still uses experimental authored rules, visibly separated from authentic NASA inputs.
- Field trials and farmer usability studies in Bangla; physical low-end phones, real rural network conditions and assistive-technology testing. WCAG checks and visual inspection do not establish universal ease of use or bug freedom.
- IMERG/SMAP are not ingested; no forecast, yield, measured water saving or soil-health outcome is predicted.
- A clean dependency installation was not established by the prior audit (npm edgesOut error); current installed workspace checks are distinct from a clean-machine install.

Local reproducibility evidence: research/nasa-integration/, research/farmer-workflow-20261026/, test-results/ (ignored). Published photo metadata and license documentation: src/data/crop-photos.json and CROP_PHOTO_CREDITS.md. Prior baseline review: REVIEW_2026-10-25.md.
