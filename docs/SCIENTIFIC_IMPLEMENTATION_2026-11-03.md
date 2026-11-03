# Research-backed browser implementation — 3 November 2026

This implementation follows [the scientific review](SCIENTIFIC_REVIEW_2026-11-03.md). The review is a dated research snapshot; this document supersedes its earlier statements that no soil product or daily water calculation is connected. Agricultural field validation remains separate from software verification.

## What is available in the app

| Browser location | Implemented behavior | Evidence boundary |
|---|---|---|
| Land details → optional soil test record | Save actual pH, measurement method, sample depth/date and report provenance | Farmer-reported evidence; no laboratory authentication or unverified pH-method conversion |
| Land details and farm calendar → Regional soil reference | Automatically request SoilGrids when opened, and follow pin/depth changes; display median pH(H₂O), 5th/95th prediction quantiles, depth, retrieval date and original requests | Modeled regional soil, separate from a soil test; no automatic field capacity or crop-suitability inference |
| Farm calendar → Daily water balance · FAO-56 | Calculate and save a selected day's root-zone balance from supplied soil, roots, coefficients and water inputs; retain separate records for each farm and day | Optional specialist calculation, with no invented defaults or universal irrigation prescription |
| Same water panel | Explicitly import forecast reference ET₀; explicitly carry a previous calculated soil state | Both actions select planning-scenario mode; a modeled/carried value is never silently labeled measured |
| Bangladesh mungbean farm → Named mungbean varieties | Select an actual BARI variety from five documented historical references; show seeding-to-maturity interval and broadcast seed quantity for the saved area | Bounded 2016 Bangladesh source, farmer confirmation required, known non-Bangladesh locations cannot apply it |
| Calendar/progress | Use the selected named-variety interval while preserving original species/calendar references; continue tracking until actual final harvest | A reference window is not a harvest-readiness prediction or automatic completion |
| Reading & sound → Weather updates | Pause background weather/heat-data refresh; retain manual update, timestamps and stale-data checks; remember the choice after reload | New fields still load once; pausing does not turn stale data into current evidence |
| Sources | English/Bangla descriptions match these connected and unconnected features | GAEZ, SMAP and IMERG are not claimed as integrated |

These features are optional disclosures so the main farmer journey remains land → crop → independent farm calendar. No demonstration farm, textbook input or example cultivar is inserted into normal use. Automated tests use explicitly identified synthetic activity records.

## Implemented methods and restrictions

### Water

The calculation follows [FAO-56 Chapter 8](https://www.fao.org/4/x0490e/x0490e0e.htm): TAW, RAW, beginning-of-day stress coefficient, single-Kc crop ET and daily depletion accounting. The [crop-coefficient chapter](https://www.fao.org/4/x0490e/x0490e0b.htm) supplies the method context, not universal defaults for every crop.

All eleven numerical inputs and their sources are required. Volumetric percentages are converted to fractions; roots are in metres and daily fluxes in millimetres. Rainfall runoff cannot exceed rainfall, and initial soil water must lie between the supplied wilting point and field capacity. A below-wilting daily balance is withheld rather than silently clipped. Surplus water drains at day end. Ponded paddy is explicitly unsupported.

This is a daily, fixed-root-depth approximation. It does not resolve within-day wetting timing, salinity, root growth, paddy storage, field hydraulic variability or a full-season water supply. The supplied depletion fraction and crop coefficient must fit the actual crop/stage and conditions. The application does not turn storage depletion into a pump/gross irrigation dose. Only a same-day reported-input balance can add a conditional field-inspection reminder; planning scenarios cannot do so.

### Soil

The [official ISRIC WCS service](https://docs.isric.org/globaldata/soilgrids/wcs.html) is used because the REST endpoint is paused. The adapter requests three quantiles for one of three supported depths: 0–5, 5–15 or 15–30 cm. It verifies raster CRS, bounds, dimensions and point-pixel identity, then converts raw pH values using the [official layer codebook](https://docs.isric.org/globaldata/soilgrids/SoilGrids_faqs_01.html). The native product grid is 250 m.

Masked WCS cells can arrive as zero without an explicit no-data tag. Those ambiguous values are unavailable, never pH zero or a neighboring pixel substitute. Unavailable/rate-limited/provider failures preserve the farmer's measured record. Requests have fixed provider URLs, bounded response size, timeouts, caching and no redirects.

Measured pH remains a record rather than an automatic ECOCROP filter: comparability with the original catalogue's measurement conventions has not been established. SoilGrids predictions do not fill field capacity, wilting point or initial water.

### Named variety reference

The source is the [July 2016 CIMMYT/CSISA Bangladesh mungbean guide](https://csisa.org/wp-content/uploads/sites/2/2014/06/Easy-to-use-methods-to-improve-mungbean-production-in-Bangladesh.pdf), printed table p.6 and broadcast seed rates p.12. BARI Mung-2: 60–65 days, 30–35 kg/ha; Mung-8: 60–62, 30–35; Mung-5 and Mung-6: 55–60, 45–50; Mung-7: 60–62, 45–50. Sowing date affects duration. No yield, resistance, seed certification, universal machine spacing or current cultivar performance claim is inferred.

## Verification record

The final complete unit/API suite passed **566/566** using two workers. Water tests reproduce the nine FAO Example 36 combinations and ten Example 37 daily depletions, and exercise **10,000 generated numerical input cases** for conservation and physical bounds. Those generated cases are software tests, not agricultural field trials. Raster tests check point identity, pH scale, missing data, wrong CRS, query validation and upstream failure. The production build, TypeScript, ESLint and scoped formatting pass.

The broader desktop/mobile browser run passed **74/76**, preserving two failures in the carry-forward case. Its remaining failure was an unstable accessible label when React prefilled a nested textarea. Explicit localized textarea labels fix that problem. The final scientific browser run passed **18/18 against the production build**, including both formerly failing carry-forward cases. Thus all 76 distinct regression cases have a passing result across the broad run and scoped follow-up; this is not one uninterrupted 76/76 run. The earlier 131,760 recommendation matrix was not re-executed because this patch does not change the species-screening algorithm.

Production browser checks cover daily water save/reload/export, paddy rejection, inconsistent water inputs, measured soil persistence/clear, prediction-depth changes, named-variety persistence/restoration and geographic blocking, explicit forecast/carry-forward provenance, pause/manual refresh for both weather and heat endpoints, Bangla accessibility and overflow. Numerical fixtures and activity records are labeled synthetic QA; the separate live soil capture is unmocked. Final machine-readable reports: `research/scientific-implementation-2026-11-03/unit-final.json` and `browser-final.json`; screenshots/traces remain in their separate initial/final run folders.

The app is served locally at `http://127.0.0.1:3000` from the verified production build. The unmocked SoilGrids response also rendered through the normal coordinate-entry interface, with no page errors. [Live soil UI screenshot](../output/audit/scientific-2026-11-03/live-soil-desktop.png). The browser proof is in `research/scientific-implementation-2026-11-03/browser-live-soil.json`.

Dependency verification found a pre-existing [Next.js critical advisory](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr). Next.js and its matching ESLint configuration were upgraded from 16.3.8 to **16.4.4**. `geotiff` 3.0.5 is pinned for numerical raster reading. The final production-dependency audit reports **zero known vulnerabilities**; the overall install still reports 18 development-tool advisories, which this scoped runtime update does not claim to resolve. Audit JSON is retained beside the scientific implementation evidence.

Live, unmocked soil endpoint probes at 5–15 cm returned:

| Point | Median pH(H₂O) | 5th–95th quantiles |
|---|---:|---:|
| United States, 41° N, 100° W | 6.8 | 5.5–8.1 |
| Bangladesh, 23.86186° N, 90.00273° E | 5.3 | 4.6–7.4 |
| Kenya, 0.5° S, 36.9° E | 5.4 | 4.5–7.1 |

These are product predictions retrieved on 3 November, not surveyed-farm measurements. Raw requests/responses are retained in `research/scientific-implementation-2026-11-03/live-soil.json`.

Initial failures are preserved. The first twelve browser cases failed because of exact-label selector ambiguity, duplicate sibling React keys and an aborted StrictMode request incorrectly marked completed while automatic refresh was paused. The fixes introduced explicit labels, unique keys and completed-request tracking. The next twelve desktop/mobile cases passed. The first full unit run had 565 passes and one legacy annual-demo timeout under concurrent load; its unchanged 16-test file passed separately in 14 seconds. No timeout was increased and no assertion was removed.

## What this does not establish

The new controls cannot certify seasonal water adequacy, local cultivar performance, complete field suitability or farmer usability. Those require the appropriate measurements, protocols, observed outcomes and evaluation. The species screen remains preliminary. SMAP, IMERG, GAEZ, automatic fertilizer/pesticide dosing and a validated all-species maturity model are not integrated. No external data release is invented. Saved farms remain browser-local and exportable; this change is not a cloud synchronization service.
