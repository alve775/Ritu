# RITU description audit and demo implementation

Updated October 4, 2026. Abid supplied the intended real-product description, then explicitly clarified: **do not use real data APIs; this is a demo and mock data may be used**. That instruction governs this implementation. No NASA API integration was added.

## Requirement-by-requirement result

| Description requirement | Previous preview | Current demo behavior | Real-product work still needed |
| --- | --- | --- | --- |
| Rajshahi / Barind pilot and adaptable location | Static locality label | Farm → Location & demo environment selects Barind or another example region; location changes the authored fixture | Actual coordinates/parcel/location coverage and regional knowledge |
| Farm, soil, irrigation, household needs, previous/current crops | Implemented | Preserved; severe-shortage category added | Reliable field records and reviewed local constraints |
| Rainfall, temperature and soil-moisture-related indicators | Source links only | Twelve mock months of rain (mm), air temperature (°C) and relative wetness (0–1); seasonal/dry/hot examples | Real product selection, origins, units, dates, quality, missingness and spatial footprint |
| Identify possible crops and let the farmer choose | Catalogue and manual calendar only | Mock screening for 13 crops; only passing crop windows are selectable; 43 named catalogue crops remain read-only references | Crop stages, varieties, local suitability and validated screening rules |
| Generate several complete rotations | Two fixed examples | Enumerates chosen crop-specific passing windows; rejects every conflict/unknown and overlap; ranks up to three complete calendars with explicit rest | Actual calendars, transitions, longer/multi-year crops and agronomic rotation rules |
| Compare water demand, drought response, climate and diversity | Calendar/entry checks; most agronomy unknown | Separate mock water/drought indices, mock climate/texture checks, crop-group counts and pulse months | Water balance/available supply, drought method, locally applicable crop thresholds and soil-health validation |
| Why this plan? | Existing entry-conflict explanations | Reasons page adds a labelled demo comparison with all seven checks and individual rule help | Explainable real data/rule provenance and method validation |
| Scenario simulation | Editing stored farm inputs only | Saved setup versus draft; changes to irrigation, priority or mock climate recompute candidates immediately. Reset discards; explicit Apply saves | Appropriate scenarios and scientifically reviewed model response |
| Priorities include drought resilience and soil health | Water/diversity/familiar saved only | Adds resilience and soil priorities; mock soil priority uses pulse inclusion, with no predicted soil improvement | Reviewed priorities/tradeoffs and interpretable real soil indicators |
| Guided game-like onboarding and individual help | Tours implemented | 28 full-tour steps plus six section replays, Mati, streaming text; local help for environment, reasons and scenarios | Farmer usability, Bangla and assistive-technology review |
| Visual calendar and crop progression | Calendar plus source-informed 3D | Preserved; prominent Explore 3D crops button and independent crop-study selector work even in rest months | Measured cultivar geometry and validated growth progression if claimed |
| White main theme / dark green left and top | Green-tinted surfaces | White body and cards; dark green navigation/top bar; neutral secondary surfaces and model background | User comfort on actual devices; no eye-health benefit is claimed |

## Mock rules are not scientific crop data

`src/data/demo-environment.ts` contains every authored climate number and all 13 fictional crop records. Temperature intervals, season membership, texture preferences, water/drought indices and rainfall-credit thresholds are invented demonstration inputs. They are **not copied from NASA, BRRI, FAO or a Rajshahi farm**. The source-backed catalogue and existing plant-anatomy references remain separate.

The display uses realistic units to demonstrate the interface, but no observation years, retrieval timestamp or NASA branding is attached to fictional values. Relative wetness is shown only; the engine does not use it for suitability. Drainage uses an invented category check; soil health is not predicted. Pulse presence and group count do not establish a soil benefit. Water demand is an invented 1–3 index, not millimeters, pumping volume, available water, savings or a yield estimate.

The original real-world evaluation continues to report water, soil and drainage suitability as unassessed. **Fits demo rules** and **Demo conflict** appear only in the explicitly labelled mock comparison; they never change those real-world checks into passes.

## Deterministic generator and scenarios

The generator screens authored crop-specific windows, intersects them with the farmer's selected crops, enumerates complete three-season combinations and keeps only options passing every mock/entry check. Dates stay locked, idle intervals become explicit rest, and windows never overlap or wrap outside the twelve-month cycle. Missing seasons or unsatisfied household requirements produce no plan.

Passing options rank by the selected mock priority, then stable IDs. Priority never overrides a conflict or unknown. Water/drought indices are duration-weighted; soil priority uses pulse-month count; familiarity counts previously grown identities. The engine retains the best assignment for each crop sequence, up to three sequences. None is verified farm advice.

Scenario drafts recompute the same strict generator without saving. Apply is disabled if no compatible calendar exists. Applying changes future plans while preserving saved tracking until an explicit replacement.

Tracking is now implemented: save one locked calendar/year snapshot, mark planting/harvest and notes, reload, detect changed farm inputs and deliberately replace/clear records. See [JOURNEY_WORKFLOW.md](JOURNEY_WORKFLOW.md) for the four-step flow and persistence contract.

## Persistence, visuals and integration boundaries

- Existing farm, language, priority and selection remain under `ritu-preview-v1`, with backward-compatible validation for new priorities/shortage/generated IDs.
- New location, mock environment, preferences and generated-mode flag use separately validated `ritu-demo-v1`. A validated ritu-journey-v1 stores review/generated fingerprints and tracked snapshot/tasks. Reset clears all three stores; unavailable storage keeps the current tab usable with a notice.
- Original fixed-plan fallback and manual date entry are removed from the farmer workflow. Generated passing calendars feed the shared calendar, field and Reasons views.
- Five existing sourced crop entries have schematic 3D anatomy: Boro/Aman rice, wheat, mung bean and potato. The independent study selector does not alter the calendar or month details. Unsupported crop anatomy has no substitute model.
- The [contrast criterion](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) supports contrast testing, not a guarantee that white is more comfortable for every person. The palette change follows Abid's reported preference. Mobile testing caught a pale navigation tile with white text; the tile now inherits the dark navigation background.
- Local static fixtures are the sole environmental provider. External references may open only when a user follows a link; no real data API, geolocation service or tracking dependency is called.

Exact observed test results are in [PREVIEW_VERIFICATION.md](PREVIEW_VERIFICATION.md), with coverage in [QA_MATRIX.md](QA_MATRIX.md). The original project plan remains unchanged. Future real integration should replace the fixture contract and reviewed rules according to [DATA_INTEGRATION.md](DATA_INTEGRATION.md), not relabel these demo numbers as observations.
