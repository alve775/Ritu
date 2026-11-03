# RITU scientific evidence review — 3 November 2026

## Decision

**Published research can establish methods and their conditions of use. It cannot certify the condition or outcome of an unmeasured farm.** This review establishes a defensible route to stronger recommendations; it does not relabel missing evidence as confirmed suitability.

The review covers the active land → plant → calendar → multiple-farm workflow, its data inputs, screening, growth tracking, guidance, photographs and interface assumptions. Previous annual-rotation tools are distinguished from the current workflow. This is a targeted methods/claims audit, not a claim that every cultivar, photograph, code path or human-factors outcome has been independently evaluated.

Relevant sections of **34 substantive source pages/documents** were reviewed and retained, including original studies, official methods, data-provider documentation and accessibility guidance. These are not 34 independent experiments: several pages belong to the same FAO manual or provider. One additional documentation URL returned insufficient content. Two local-guide pages could not be read sufficiently and were not promoted into rules. Local captures, hashes and access failures are indexed in `research/scientific-review-2026-11-03/source-manifest.json`.

## What can and cannot be confirmed

| Question | Research finding | Current RITU status |
|---|---|---|
| Is there an established crop-water calculation? | Yes: FAO-56 reference ET, crop coefficients and root-zone water balance, with documented inputs and limitations | The app retrieves reference ET₀ but does not implement a complete field water balance |
| Can five irrigation-access labels establish adequate seasonal water? | No: they provide neither quantities nor the initial soil-water state | Recorded as farmer statements; water stays unresolved for all options |
| Can public soil products help? | Yes, as modeled regional estimates with depth, units and uncertainty | Not connected; a predicted grid property is not a soil-test result |
| Does NASA have root-zone soil moisture? | Yes: SMAP L4 includes assimilated/model-derived root-zone estimates | Not connected; its grid scale does not establish available water in this field |
| Can general climate data identify every suitable local crop/variety? | No: cultivar, soil, water, extremes and management can change the result | The current output remains preliminary species screening |
| Is the optional grain-corn GDD calculation authentic? | Its 86/50 convention and published examples are documented | Method calculation verified; cultivar document and local forecast accuracy unverified |
| Is the farmer-observation stage adjustment independently validated? | No direct validation of RITU's particular re-anchoring rule was found in the inspected evidence | Remains experimental; no accuracy improvement is claimed |
| Do reference dates establish harvest readiness? | No: development, physiological maturity and harvest conditions differ | Actual observations and final harvest remain separate from calendar references |
| Is there a scientifically optimal universal farmer interface? | No universal font, palette, tour length or mascot was established | Accessibility standards guide the interface; actual farmer usability remains to be evaluated |

## 1. Water adequacy: an established method with missing field inputs

[FAO-56 Chapter 2](https://www.fao.org/4/x0490e/x0490e06.htm) defines the reference evapotranspiration method. [Chapter 6](https://www.fao.org/4/x0490e/x0490e0b.htm) relates reference ET to crop coefficients and explains local growth-stage variation. ET₀ represents a reference surface; it is not an irrigation dose for the selected plant.

The auditable calculation path from [Chapter 8](https://www.fao.org/4/x0490e/x0490e0e.htm) includes:

```text
TAW [mm] = 1000 × (field capacity − wilting point) × effective rooting depth [m]
RAW [mm] = depletion fraction × TAW
ETc [mm/day] = Kc × ET₀                         [standard-condition approximation]
Dr_today = Dr_yesterday − (rain − runoff) − net irrigation
           − capillary rise + crop ET + deep percolation
```

The crop coefficient, root depth, water capacity, initial depletion and water additions must have evidence. Soil texture alone is insufficient to measure them. Stress, salinity, partial wetting, paddy water and changing root depth need appropriate treatment. Actual field water advice must preserve the distinction between measured, modeled and forecast inputs.

**Research calculation check:** the retained script reproduces nine crop/soil combinations from FAO Example 36 and ten daily depletion values from Example 37, within the source's displayed rounding. These are textbook inputs, not farmer defaults. No example coefficient or soil capacity was inserted into production recommendations. The existing provider ET₀ remains a reference quantity.

**Required implementation gate:** only calculate an operational irrigation quantity when crop/stage coefficients and local root-zone/water-supply inputs are present, with an appropriate method and evaluation. Otherwise show the missing inputs; do not substitute an arbitrary rain percentage, soil-to-water lookup or universal crop coefficient. A seven-day forecast cannot by itself guarantee water for a whole season.

### A real crop-specific practice is not a universal watering rule

The [IRRI-origin FAO TECA AWD document](https://openknowledge.fao.org/server/api/core/bitstreams/de4695f2-a313-4ef0-b84b-1fb5d088033d/content) describes water-tube monitoring for irrigated lowland rice, including an exception around flowering. Its prerequisites differ from rainfed maize, vegetables or orchards. It can support a future specifically configured rice protocol, not an automatic all-crop instruction. The retrieved text contains inconsistent tube-length/placement descriptions. The original page geometry was not visually resolved here, so no tube-construction geometry was inferred or shipped from that extraction. Reported study/practice benefits are not RITU's measured water savings.

## 2. Local cultivar performance requires outcome evidence

[DSSAT's minimum-data specification](https://dssat.net/data/minimum-data/) distinguishes inputs needed to run a model from observations needed to evaluate its outputs. Weather, soil and management are accompanied by observed phenology, yield or related outcomes. A source URL and a hybrid name do not verify a farmer's document or authenticate its claimed coefficients.

An original [2019 cultivar-selection study](https://www.pnas.org/doi/10.1073/pnas.1813720116) used 12,409 farmer-managed trial plots for beans in Nicaragua and wheat in Ethiopia and India. It demonstrates a research route based on local performance observations and environmental context. Those results do not establish adaptation of every RITU species or the same cultivar on a new farm.

The [maize phenology study](https://www.nature.com/articles/s41598-021-95253-7) combined field ground truth, weather and satellite features, with model training and testing on unseen data. It supports the need for observed stages and evaluation. It does not test RITU's simpler heat-sum reset at a reported silking date. This review found no basis for attaching a forecast-accuracy percentage or validated improvement to that reset.

**Evidence needed to close this gap:** authenticated variety/method records; correctly identified observations across relevant sites, seasons and management; independent evaluation that keeps observations from the same trial out of both calibration and testing; documented timing error and failure cases. Public trials may support a bounded regional service when their actual coverage fits. They are not a universal cultivar API.

## 3. What the existing crop screen actually establishes

### Historical species constraints

[FAO states that ECOCROP](https://www.fao.org/geospatial/data-and-tools/data-portals/ecocrop/en) was developed in 1999 and discontinued around 2015. Its useful environmental descriptors do not make it a current cultivar advisory service. Retrieval time, file hash, source fidelity and biological validity are separate properties.

RITU currently checks recorded temperature, coarse texture and drainage categories. Source pH limits are retained, but the active field form does not capture a comparable measured pH and the engine does not evaluate that factor. Salinity, effective soil depth, nutrients, photoperiod, frost, winter hardiness, seed availability and economic feasibility are not established. A positive checked factor must not imply that those absent factors passed.

### No single uniquely correct duration shortcut was established

The [Recocrop maintainer's parameter documentation](https://search.r-project.org/CRAN/refmans/Recocrop/html/parameters.html) explicitly describes expert-derived parameters and its own duration/precipitation transformations. The [Hawaiʻi suitability tool](https://cropsuit.ctahr.hawaii.edu/landing/methods.html) uses more environmental factors and locally revised crop ranges. These methods are different. Neither validates RITU's exact monthly-temperature-window heuristic worldwide.

RITU's shorter supported-temperature interval is a transparent policy for preliminary comparison. It does not prove that the farmer has a cultivar that matures in that interval. A perennial's 365-day review horizon is an application interval, not its first-harvest time or proof of winter survival. Keep the original source duration and unresolved local checks visible.

### Regional historical calendars need careful interpretation

The [original Sacks documentation](https://sage-public-files.s3.amazonaws.com/crop-calendar-dataset/crop-readme.txt) describes mostly 1990s/early-2000s regional observations, unfilled versus extrapolated grids and coarse spatial assignment. It also states that tropical/subtropical records classified as “winter” can involve spring cereal varieties. Therefore RITU must not infer a farmer's actual cultivar, vernalization requirement or cold tolerance from that label.

There is no support for converting a historical next planting window into an exact modern optimum. Date arithmetic and leap-day correctness verify the displayed reference, not current planting safety. RITU uses the unextrapolated record where available and does not copy another country's dates into a missing cell.

## 4. Better data candidates and their actual limits

| Product | Useful contribution | Important boundary | Integrated now? |
|---|---|---|---|
| [NASA POWER climatology](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/) | Explicit 1991–2020 temperature/precipitation context | Long-term normal, not future season weather or a field sensor | Yes |
| [Open-Meteo forecast](https://open-meteo.com/en/docs) | Current modeled conditions, seven-day forecast and reference ET₀ | Model estimates; precipitation period and missing values matter | Yes |
| [FAO GAEZ v5](https://www.fao.org/gaez/en) | Additional modeled crop suitability under water/management assumptions | Select exact layer, crop, period and management; potential is not observed field yield | No |
| [SoilGrids](https://isric.org/explore/soilgrids) | Depth-specific predicted soil properties with uncertainty | Provider currently reports REST paused; use documented stable access rather than assume an available point API | No |
| [SMAP L4 v8](https://www.earthdata.nasa.gov/data/catalog/nsidc-cprd-spl4smgp-008) | Model-assimilated surface/root-zone moisture, 3-hourly at 9 km | Regional model state; not a crop-specific field water inventory | No |
| [GPM IMERG](https://gpm.nasa.gov/data/imerg) | Estimated precipitation with product-specific latency | Rain is not infiltrated/available root-zone water; early and final products differ | No |
| [FAO AquaCrop](https://www.fao.org/aquacrop/overview/en/) | Established water-driven crop-model framework for herbaceous crops | Needs appropriate inputs/parameters/evaluation; not a universal orchard or all-species model | No |

The [NASA data FAQ](https://power.larc.nasa.gov/docs/faqs/data/) explains source-grid interpretation, terrain differences, latency and evaluation. A farm pin improves location selection; it does not improve a provider's native measurement/model resolution. “Current” means the source's modeled time, not a sensor reading at the plant.

**Resolution discrepancy resolved to a release gate, not a guessed number:** FAO's current GAEZ overview advertises approximately 1 km key outputs. Its [model wiki](https://github.com/un-fao/gaezv5/wiki) contains a broader 5-arc-minute description. The [FAO 2025 methods annex](https://openknowledge.fao.org/server/api/core/bitstreams/a7f92713-890a-4ff8-85ae-eb2aa76ae702/content/state-of-the-worlds-land-and-water-resources-for-food-and-agriculture-2025-2025/annexes-1.html) describes mixed-resolution inputs. A future adapter must inspect each actual raster's metadata; it must not label every layer 1 km or field-scale. No GAEZ layer was downloaded or connected in this review.

The [SoilGrids original study](https://soil.copernicus.org/articles/7/217/2021/) explains prediction uncertainty and uneven observation coverage. [ISRIC lists WCS and WebDAV alternatives](https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_02.html); those are access routes, not evidence of farm-measurement accuracy. A model estimate may prefill a visibly identified reference, but must not silently overwrite a farmer's laboratory result. API status is a 3 November 2026 observation and may change.

## 5. Crop progress, calendar and daily instructions

The implemented [Ohio State grain-corn GDD convention](https://cfaes.osu.edu/fact-sheet/corn-growing-degree-days-method-maturity-rating-hybrids) caps the daily maximum at 86 °F, floors the daily minimum at 50 °F, subtracts a 50 °F base and starts accumulating the day after planting. Its three published numerical examples match the existing tests. Hybrid requirements must use the same convention and accumulation origin. Physiological maturity is not automatically harvest/storage readiness.

The current app's actual planting, partial picking and final-harvest states are farmer records. They are legitimate recordkeeping choices; they are not biological inferences. Generic crop age cannot establish a stage. An observed stage can change a conditional inspection prompt without justifying a new numerical maturity date.

[FAO IPM guidance](https://www.fao.org/agriculture/crops/thematic-sitemap/theme/spi/scpi-home/managing-ecosystems/integrated-pest-management/ipm-how/en/) supports context-specific observation and diagnosis rather than generalized treatment packages. RITU's field walks, damage documentation and root-zone checks remain inspection prompts. They are not complete crop-specific management protocols, diagnoses, fertilizer rates or pesticide prescriptions.

Local soil tests are needed for comparable field chemistry and nutrient decisions; see the [University of Minnesota farm soil-testing guidance](https://extension.umn.edu/agriculture/specialty-crops/soil-testing-on-fruit-and-vegetable-farms). Its regional sampling or fertilizer instructions are not automatically applied worldwide.

The one-day lifetime of transient damage/water prompts, the seven-day recent-stage conflict window and the 365-day care horizon are operational policies. This research does not claim those constants are validated biological thresholds. No imagery, mascot or decorative growing scene is a measurement of actual plant development or sowing spacing.

## 6. Usability, imagery and production claims

- [WCAG contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) provides checkable contrast requirements, including 4.5:1 for ordinary text and 3:1 for qualifying large text. It does not prove that green or white is ideal for every farmer or that a specific palette prevents eye strain.
- [Text resizing](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html) requires usable enlargement to 200%; it does not set one universal default pixel size. [Target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) specifies 24 CSS pixels with conditions/exceptions. Larger important controls can be a design choice, not a universal empirical optimum.
- [Pause/stop guidance](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) covers automatic motion and updating content. The landing animation has pause/reduced-motion support. Weather auto-refresh currently has no explicit user pause/frequency setting: this is a remaining accessibility task, not silently certified by an automated audit.
- [W3C cognitive-accessibility guidance](https://www.w3.org/TR/coga-usable/) supports clear purpose, familiar controls, manageable instructions and involving users. The land → options → calendar sequence, tour length, mascot and optional ambience are product choices. Their usefulness for Bangla-speaking farmers still needs real task-based testing, including reading, touch, sunlight and connection constraints. Automated accessibility checks do not establish comprehension or full WCAG conformance.
- [MediaWiki image metadata](https://www.mediawiki.org/wiki/API:Imageinfo) supports provenance/license attribution. Metadata, a botanical ID and a filename filter cannot guarantee a correct visual depiction for every plant. Missing photos stay unavailable; no source establishes that all photographs or translations are correct. The existing image audit remains separate from this methods review.
- [Open-Meteo's terms](https://open-meteo.com/en/terms) distinguish its free non-commercial endpoint and usage limits from commercial service. Free data availability is not a production uptime guarantee. Saved farms remain browser-local records, not cloud backup, remote monitoring or farm-equipment control.

## 7. Implementation sequence with acceptance gates

This is the research-backed path forward. Items are not marked implemented merely because their methods are published.

- [x] Correct the current Sources page's obsolete irrigation-ranking claim, historical catalogue age and calendar interpretation; disclose candidate datasets separately from connected providers in English/Bangla.
- [x] Verify the existing grain-corn worked examples and reproduce the published FAO water examples without installing their example inputs as farmer defaults.
- [ ] Add an optional measured-soil evidence record: property, value, units/method, sampling depth/date and provenance. An unknown value must remain unknown; confirm the source measurement convention rather than blindly compare pH(H₂O) with another method. Recocrop describes the water convention as presumed, so that convention is not independently authenticated for every raw FAO record.
- [ ] Add versioned GAEZ/soil-grid reference adapters only after inspecting actual layer metadata, geographic coverage, missing values, license and provider access. Preserve modeled status and uncertainty.
- [ ] Add a crop/management-specific water module using appropriate stage coefficients and root-zone state. Require a justified treatment for runoff, drainage, capillary rise and changing roots; include separate paddy handling. Test conservation and published examples, then evaluate field performance independently.
- [ ] Add a bounded regional cultivar registry backed by actual variety/trial documents and eligible geographies/management. Do not let a generic species duration become an authenticated cultivar model.
- [ ] Evaluate crop timing on independent dated field observations. Report timing errors, unavailable cases and coverage; do not publish an accuracy percentage before that evaluation.
- [ ] Add a user control for automatic weather updates, with timestamps and stale-data guards retained. Pausing refresh must not make old conditions look current.
- [ ] Run representative farmer usability sessions. Success should mean completing real tasks and correctly understanding uncertain guidance, not liking an animation.

For a first scientifically defensible deployment, supporting a bounded set of crops/cultivars and conditions is more justifiable than claiming locally validated prescriptions for all 2,562 reference records. This is an engineering inference from the evidence requirements above, not a statement that worldwide browsing or farm records must be removed.

## Changes and verification in this research pass

The production change is a correction and expansion of `/sources`, in English and Bangla. **The recommendation algorithm, data, saved farms and forecasts were not replaced or upgraded into a new validated model in this pass.** The main Sources page now distinguishes daily legacy history from current climatology, states the catalogue's age, names the water/model evidence gaps and explicitly identifies unconnected datasets.

- Focused existing method/input tests: **40 passed** across corn thermal time, weather parsing and the recommendation-input contract. The initial sandboxed run failed to access two transformed temporary modules; the permitted rerun passed all three files. Both results remain retained.
- FAO research examples: **nine water-capacity cases and ten daily balance comparisons passed**. This is numerical agreement with a textbook, not field testing or a product water-module integration.
- Sources-page browser review: **four desktop/phone × English/Bangla combinations passed**, with no runtime errors, horizontal overflow or violations in the selected automated Axe rules. A first capture attempt found the local preview stopped; the preview was started and the four checks completed. No user farm data was modified.
- Production build, strict TypeScript, ESLint, changed-component formatting and `git diff --check` passed after the Sources-page change. No dependency or production data-provider integration was added.
- Earlier **131,760 setup/date evaluations**, **547 unit/API tests** and **118 distinct browser cases** belong to the [preceding audit](RECOMMENDATION_AUDIT_2026-11-03.md). They were not rerun as new agricultural experiments or added to this pass's counts.

The companion [claim matrix](SCIENTIFIC_EVIDENCE_MATRIX_2026-11-03.csv) connects each major reviewed behavior to its implementation, sources and remaining evidence. The [machine-readable ledger](../output/audit/RITU_Scientific_Evidence_2026-11-03.json) includes source URLs and capture hashes. Capture texts and research calculations live under `research/scientific-review-2026-11-03/`; hashes identify retained extracted text, not authentication of the upstream PDF binary or agronomic validity. Their presence does not mean every line of each large document was read; the relevant methods, definitions and limitations were reviewed. The unread local-guide leads are explicitly excluded from numerical rules.
