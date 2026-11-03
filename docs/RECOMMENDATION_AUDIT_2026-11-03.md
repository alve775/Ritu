# First-section inputs and crop-option audit — 3 November 2026

**Finding: the old list was not reliable enough to describe as verified farming recommendations.** Several screening and interaction defects were repaired. The repaired source-to-screen pipeline passed the checks below. Crop-season water adequacy, local cultivar performance and complete field suitability remain unverified and are now stated explicitly in the interface.

This report does not claim that test volume establishes agricultural accuracy. It does not claim that every imported species is edible, locally legal, commercially useful or suitable for the farmer's field.

## The screenshot's plant 10308

The original source record is **Telfairia pedata**. Its `COMNAME` field is empty, so the earlier display fell back to “Common name unrecorded · plant 10308.” The species was real; that label was not a useful farmer-facing name.

FAO's [Edible nuts](https://www.fao.org/4/v8929e/v8929e.pdf) supplies the English name **Oyster nut**. [Kew's accepted-species record](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A294055-1/general-information) independently confirms the botanical identity. The display now uses the supplemental FAO name and links that source. The original ECOCROP record and its hash remain unchanged. No Bangla translation was invented. A reference photo is not invented when the image service has no acceptable result.

Other records without a usable sourced common name stay in the complete reference catalogue, with planting selection disabled. They no longer appear as selectable unnamed options in the default screen. Existing source common-name labels are not a claim that every label is a verified English translation.

## What was verified

| Check | Verified result | What it establishes |
|---|---:|---|
| Retained plant identities | 2,562 | Every non-retired imported record was included in source comparison; six Sorghum records remain excluded as requested |
| Original crop-source fields | 53,802 comparisons, no differences | Twenty-one imported fields per record: numeric requirements, identity, soil categories, life-form metadata, aliases and use categories agree with the pinned source |
| Historical calendar grids | 14 | Retained original NetCDF hashes and all packed grids rechecked |
| Calendar grid cells | 3,628,800 | Presence masks, including missing observations, agree with source |
| Populated calendar fields | 1,289,526 comparisons | Seven fields in 184,218 populated cells agree with documented two-decimal packing |
| First-section/date matrix | 131,760 evaluations passed | Six locations × 366 dates × 4 soils × 3 drainage choices × 5 water labels |
| Distinct location/date/soil/drainage combinations | 26,352 | Each is exercised under all five water labels; these are not five independent biological experiments |
| Returned options checked | 81,446,025 | Each returned option checked against an independent daily-temperature reference, including membership, ordering, dates, durations and uncertainty flags |
| Saved-record checks within the matrix | 4,320 | Returned selections remain valid, exportable farm-record structures |
| Source records returned at least once | 1,109 | Observed coverage of this six-location matrix, not the number of globally viable crops |
| Full unit/API suite | 547 passed | Software regression and input/provenance guards |
| Real-backend desktop/mobile cases | 66 passed | All five water controls at six actual locations; area/soil/drainage/date/coordinate propagation, source naming, changed-input handling and accessibility |
| Additional browser regression run | 58 passed | Calendars, partial/final harvest, perennials, tours, names, source failures, export/recovery and layouts; six cases overlap the 66-case run |

There are **118 distinct browser cases across those two runs**, not 124 unique cases. Earlier exhaustive reports remain dated historical evidence; their counts are not added to this run as new tests.

The matrix covers **1 March 2027 through 29 February 2028**, including every season, New Year and leap day. It exercises all finite soil/drainage/water combinations currently offered by the form. Names, sizes and geographic coordinates have continuous/unbounded input spaces; representative values and boundaries are tested, not falsely described as every conceivable field.

### Real environmental contexts

| Location | Coordinates | Climate source |
|---|---|---|
| Manikganj, Bangladesh | 23.86186, 90.00273 | NASA POWER, 1991–2020 |
| Washington DC, United States | 38.9072, −77.0369 | Same source, independently requested point |
| Novosibirsk, Russia | 55.0084, 82.9357 | Same source, independently requested point |
| São Paulo, Brazil | −23.5505, −46.6333 | Same source, independently requested point |
| Griffith, Australia | −34.2892, 146.0509 | Same source, independently requested point |
| Nairobi, Kenya | −1.2864, 36.8172 | Same source, independently requested point |

Fresh original responses, URLs, retrieval times and SHA-256 hashes were retained. An independent Python pass checked original coordinates, temperature/rainfall units, every monthly value and the annual precipitation conversion. Land areas, textures, drainage classes and water labels used in QA are **test assumptions, not satellite measurements or surveyed farm facts**.

The matrix reuses those captured environmental records. It does not make 131,760 NASA requests or misrepresent future monthly normals as a weather forecast. The browser cases call the real crop backend; their bulk photo requests deliberately simulate an image-service outage to avoid unrelated provider load. Crop-photo quality is not certified by these recommendation tests.

## Defects and misleading assumptions repaired

1. **Drainage was checked in only one direction.** Well-drained-only plants were excluded from poorly drained fields, but poorly drained-only records could still pass a well-drained field. Both directions now compare explicit source categories. Unknown source/field drainage stays unknown. The form explains that the source's poorly drained class means saturation for over half the year, not merely a brief puddle after rain. Rapid/excessive drainage requires a separate local check; the coarse form is not a hydrological survey.
2. **The longest source duration could incorrectly exclude shorter varieties.** The climate-only annual fallback required the entire source `GMAX` to fit. A source range such as maize's 65–365 days does not mean that every maize variety needs 365 warm days. The screen now finds a continuous monthly-normal temperature interval supporting at least the source minimum, retains the original source range and labels the resulting shorter interval as a **planning reference**, not a cultivar harvest prediction. A compatible actual variety still needs confirmation.
3. **Historical winter/dormant calendars were being treated like continuous active growth.** A regional historical record can span temperatures outside the source's growth range. The record is retained as historical evidence, with the temperature check marked unresolved; dormancy and winter survival are not claimed as verified. Generic perennial comparisons use a 365-day temperature-average reference and a care horizon, not an overwintering or first-fruit model.
4. **Annual rainfall was being used to rank qualitative irrigation labels.** That did not establish crop-season water adequacy or drought resilience. The shortcut was removed. Annual-rainfall metadata remains visible as context, but water adequacy is **unknown for all five labels** without a crop-specific seasonal water budget. Annual monsoon rain must not be used to reject a dry-season reference such as winter wheat solely because the annual total differs from a source range. Consequently, changing the five access labels alone does not manufacture a new drought ranking.
5. **Missing evidence could look like a passing factor.** The output now carries explicit supported/unknown checks for average temperature, texture, drainage, water and local validation. Missing texture/drainage data is never described as verified compatibility. Visible card text identifies unresolved water and local suitability. “Preliminary source match” and “Historical regional option” replace stronger-looking climate labels.
6. **Unusable common-name placeholders were selectable.** The reported case now has its separately sourced name; remaining unnamed records are reference-only. No generated common names, guessed translations or replacement images were added.
7. **Display metadata could invalidate a confirmed field.** The confirmation key previously included place labels and timezone metadata. A timezone arriving from the weather service could invalidate otherwise unchanged physical inputs. The key now binds coordinates and the field profile; a renamed place/timezone alone does not invalidate it. Actual coordinate or field-condition changes still clear the selection. Tests verify that changing drainage removes an outdated rice selection.
8. **API area handling did not carry the actual input.** The crop browser now sends the converted hectare area. The API validates it instead of always substituting one hectare. Area affects input validity and record scale, not an invented species-suitability multiplier.
9. **The precipitation conversion used a generic February length.** The actual 1991–2020 period has eight leap days. Monthly mean daily precipitation now uses that interval's average calendar lengths. This is a unit/calendar correction; derived annual precipitation is still a climatological estimate from rounded source rates, not measured water available to the crop. A cache-version key prevents returning the old parsed conversion.
10. **The optional adaptive corn model needed a clearer label.** Its interface now explicitly says **experimental**. The authentic heat-unit calculation and testable software behavior do not establish forecast accuracy for a farmer's hybrid. See the [tracking-method report](ADAPTIVE_TRACKING_2026-11-03.md).

## Which first-section inputs actually affect the result?

| Input | Actual use | Limit |
|---|---|---|
| Location | Requests that point's NASA climate and local unextrapolated calendar grid | Regional models and historical observations, not measurements of the field |
| Ready-to-plant date | Finds upcoming source/calendar or monthly-normal planning intervals | Neither an optimized sowing date nor a future weather forecast |
| Soil texture | Checks the chosen coarse texture against recorded source categories | Unknown pH, salinity, depth, fertility and structure remain untested |
| Drainage | Checks explicit source drainage categories in both directions | Management, temporary puddles and prolonged saturation are not interchangeable |
| Water access label | Records the farmer's statement and exposes an unresolved water check | No measured quantity, crop coefficients, root-zone storage or validated water budget is supplied |
| Area/unit | Converts and validates field scale and saves it to the farm | Size does not itself establish which species is suitable |
| Farm name | Labels the record | Does not determine crop suitability |
| Current/forecast weather | Supports dated field checks elsewhere in the farm workspace | It is not currently a complete species-selection or sowing-safety model |

## Independent reference and remaining limits

Production aggregates monthly normals by overlapping calendar segments. The audit independently expands captured temperatures into daily values, uses integer hundredth-degree prefix sums and sparse min/max tables, and finds supported durations by binary search. It independently computes calendar windows, category eligibility and ordering. It does **not** call production eligibility or climate-arithmetic helpers to manufacture its expected answers. Source fidelity is checked separately against the original CSV and NetCDF files.

This independence verifies implementation of the **declared screening policy**. It cannot establish that the policy or historical expert parameters are optimal for a local cultivar. Source parameters can be incomplete or outdated. A conservative filter can exclude a plant that would grow under a specific cultivar/management system; a preliminary match can still fail in a real field.

The current app is not a locally calibrated deployment of the complete ECOCROP model, GAEZ, DSSAT or AquaCrop. For comparison, the [University of Hawaiʻi's suitability tool](https://cropsuit.ctahr.hawaii.edu/landing/methods.html) uses multiple environmental factors and locally reviewed crop ranges. RITU does not possess equivalent local validation for thousands of crops worldwide.

Still required before claiming reliable farm-specific recommendations:

- [ ] Crop/variety-specific seasonal water requirements and usable irrigation/root-zone water evidence.
- [ ] Locally appropriate cultivars, verified planting/establishment protocols and actual growth-duration data.
- [ ] Relevant daily extremes, frost, winter hardiness, chilling and photoperiod requirements.
- [ ] Soil chemistry, salinity, depth, nutrients and management information when needed by the crop.
- [ ] Local seed availability, legal/invasive restrictions, pest pressure and practical/economic feasibility.
- [ ] Independent agricultural review and comparisons against real field outcomes.

None of those gaps is turned into a positive suitability claim. The release claim supported by this audit is **authentic-source preliminary screening plus farm records and conditional field checks**, not an agronomist-validated autonomous farming system.

## Reviewable evidence and repeat commands

- [Desktop: entered field assumptions](../output/audit/recommendation-2026-11-03/desktop-01-input.png), [returned wheat options and evidence](../output/audit/recommendation-2026-11-03/desktop-02-option.png), [saved calendar](../output/audit/recommendation-2026-11-03/desktop-03-calendar.png).
- [Phone: entered assumptions](../output/audit/recommendation-2026-11-03/phone-01-input.png), [returned options](../output/audit/recommendation-2026-11-03/phone-02-option.png), [saved calendar](../output/audit/recommendation-2026-11-03/phone-03-calendar.png).
- [All 2,562 records and country-return counts](../output/audit/RITU_Recommendation_Audit_2026-11-03.csv)
- [Machine-readable audit summary](../output/audit/RITU_Recommendation_Audit_2026-11-03.json)
- Local original captures, full test outputs and before/after engine comparisons: `research/recommendation-audit-2026-11-03/`.
- Browser screenshots: `browser/` and `regression/` inside that evidence directory. Photo-source outages in bulk QA are deliberate and labelled above.

```powershell
# Preview must be running for fresh capture. Existing evidence is not overwritten.
npm run audit:recommendations:capture
python tests/recommendation/verify-captures.py
python tests/recommendation/source-audit.py
python tests/recommendation/calendar-audit.py
npm run test:recommendations
python tests/recommendation/summarize.py
npx playwright test tests/e2e/season-recommendation-audit.spec.ts --workers=2
```

The fresh-capture command intentionally refuses to replace existing dated evidence. The domain matrix and report can be rerun using retained captures. Basic unit/browser tests keep their checked-in fixtures; the live browser audit skips when its local captures have not been prepared.

### Captured example and release checks

The two isolated walkthroughs use Manikganj coordinates **23.86186, 90.00273**, an assumed **1 ha**, **clay** texture, **unknown drainage** and **rain-only** supply. These land conditions are QA choices, not measured facts. Both return a historical wheat option with a **11 November 2026** planning start and **120-day reference interval**. Its seasonal water check remains unknown. The actual planting date remains blank; neither the plan nor the illustration pretends the farmer has already planted. The saved record and its original NASA URL are retained beside the screenshots. No user-created farm is changed.

Only the narrow wheat search's photo batch uses the image service in this walkthrough. Other photo requests are deliberately omitted; the broader browser audit simulates a provider outage. The final walkthrough also verifies that expanding one card does not stretch neighbouring badges/text, and the layout defect found during screenshot inspection was repaired. These two captures are additional walkthrough executions, not added to the 118 distinct browser-test count.

Production build, strict TypeScript, ESLint and formatting of changed code pass. The initial sandboxed production build failed when Windows denied Next.js creation of a prerender output directory (`EPERM`); rerunning with filesystem permission succeeded. Both logs remain in the dated evidence directory. No source-data or agricultural failure is hidden by calling that environment error a passing run. Whole-repository formatting has pre-existing differences outside this change; no unrelated mass reformat was performed.

Primary data references: [NASA POWER climatology](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/), [FAO ECOCROP overview](https://www.fao.org/geospatial/data-and-tools/data-portals/ecocrop/en), [pinned distributed source](https://raw.githubusercontent.com/OpenCLIM/ecocrop/f13577f4237604b15d85d8e43741714a2d1eb2d4/EcoCrop_DB.csv), [Sacks original methods/readme](https://sage-public-files.s3.amazonaws.com/crop-calendar-dataset/crop-readme.txt), and [crop-model evaluation requirements](https://dssat.net/data/minimum-data/).
