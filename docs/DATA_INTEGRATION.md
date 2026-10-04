# Replacing preview assumptions with reviewed evidence

The preview is a functional interface with an optional fictional planning engine, not a validated agronomic model. Keep it visibly illustrative until the team's data and crop rules have been reviewed. The full challenge resources and submission rules still need to be checked when available.

October 4 instruction: **mock data only; no real data APIs**. `src/data/demo-environment.ts` owns authored environment fixtures and 12 invented crop records; `src/domain/demo-planner.ts` generates/ranks fictional rotations separately from real-world entry checks. Mock settings use `ritu-demo-v1`. Follow [PROJECT_DESCRIPTION_AUDIT.md](PROJECT_DESCRIPTION_AUDIT.md) when replacing this contract: do not reuse invented thresholds as scientific rules or relabel fixtures as NASA observations. Relative wetness is display-only; pulse months do not predict soil improvement.

## October 4 farm-first update — current interface

[JOURNEY_WORKFLOW.md](JOURNEY_WORKFLOW.md) supersedes the older manual calendar/editor flow described below. Generated calendars use authored crop-specific integer intervals within March–February; they cannot wrap or overlap, and every idle month is explicit rest. Legacy recurring example periods remain test fixtures in evaluate/season modules, not selectable farmer plans. There is no manual date or crop injection.

The 12 fictional records now include window alternatives and drainage categories. Every generated candidate passes all mock checks plus entered household/help consistency; priorities rank only passing options. Review/generated fingerprints invalidate stale future suggestions, while ritu-journey-v1 preserves an immutable saved calendar/year and planting/harvest/notes. The year is a label, not a forecasting parameter. Scenario Apply is refused with zero compatible candidates.

For real integration replace month assumptions with locally reviewed dated windows, stage durations and minimum turnaround buffers. Validate rotation/family rules separately; no rule is scientifically validated merely by the current software timing tests. Preserve missingness, provenance, snapshot stability and no-conflict generation when replacing the mocks. No live API is authorized now.

## Legacy evaluator and test-fixture boundaries

`src/data/preview.ts` supplies a fictional farm, crop identity records and legacy calendar test fixtures. The two fixed alternatives are not selectable in the farm-first interface. `src/domain/types.ts` defines their structure. `src/domain/evaluate.ts` checks entered calendar/household/labor consistency; water, soil and drainage suitability always remain unknown. Unsupported water-demand rankings and irrigation thresholds were removed. No option currently receives a recommendation. The UI reads results through `PlannerProvider`; it contains no remote-data download code.

Month index 0 is March, 11 is February. Periods use a start index and a duration in whole months, and repeat annually. Boro starting at 10 for four months covers 10, 11, 0, 1. The rendered fragments are not two unrelated crops. Unspecified months are unknown, not implicit fallow. Crop/rest overlap is a blocker. The monthly preview does not check actual planting windows, real day durations or transition buffers.

`src/domain/season.ts` derives month activities from that same recurring calendar. First/last months produce sample planting/harvest labels; a one-month period includes both. Every overlapping period remains visible. `field-scene.ts` renders a normalized schematic parcel and educational crop structures, not a scientific growth model, satellite image, surveyed geometry or hectare-scaled simulation. Young/mature examples are chosen manually and are independent of the month. `src/data/crop-models.ts` links the anatomy references; these do not validate Rajshahi crop dates, varieties or management rules. Replace sample activity derivation with reviewed stages when integrating dated evidence; never relabel the existing plant sizes as observations.

## Handoff from Alve

For each real crop calendar, provide source ID and URL, publication/version, locality, crop/variety, planting and harvest windows, day-based duration where available, irrigation and drainage applicability, soil constraints, stage definitions and limitations. Do not restore water-demand labels or thresholds without a supported derivation and local applicability review.

For NASA inputs, provide dataset/product and version, retrieval date, coordinates and spatial footprint, temporal coverage, units, missing-value encoding, processing steps, reference period and attribution/reuse requirements. Preserve source-native dates and units before creating display summaries. Missing values remain `null` or explicitly missing; they never become zero.

Keep rainfall histories (planned IMERG, documented POWER fallback) and temperature histories (planned POWER) distinct from crop suitability rules. Historical crop-stage exposure is not a next-season weather forecast or a yield estimate. Do not use coarse grid data as a parcel measurement.

## Integration sequence

1. Agree on and document the verified locality and actual farmer case, including consent if needed. Do not relabel the sample farm as a real observation.
2. Add a reviewed dataset module alongside `preview.ts`, with traceable source metadata. Add validation at the data boundary before it reaches the UI.
3. Separate the future evidence-backed evaluator from the current preview evaluator. Give each applied rule an ID, provenance, scope and missing-input behavior.
4. Replace monthly repeat assumptions with an explicit dated calendar engine when actual planting dates are used. Test leap years, crop transitions, year boundaries, unknown dates and partial coverage.
5. Test known-good and known-blocked examples with Alve. A known blocker outranks a separate unknown; all unknown checks remain visible.
6. Add historical exposure only with a documented crop-stage method and units. Keep environmental exposure, farm feasibility and soil-management features separate.
7. Update the provenance dialog and visible labels to identify exactly which parts are reviewed and which remain illustrative. Do not remove the preview label because only one dataset is connected.
8. Preserve a packaged, reproducible local fixture for the demonstration. Record reviewer feedback and changes. Re-run domain, browser and accessibility checks.

Priorities affect only mock ranking. No example passes all real-world checks because agronomic evidence is unavailable. Before adding evidence-backed ranking, agree on real criteria, provenance, missing-data behavior and sensitivity analysis; a priority must never erase a conflict or unknown. NASA products are already public; the October 28 full-challenge release is not the beginning of public NASA data availability. See [the scientific and usability audit](EVIDENCE_AND_USABILITY_AUDIT.md).
