# Farm-first workflow and strict mock calendar

Updated October 4, 2026. Owner: Abid al Hossain Swakkhar. This supersedes the earlier comparison-first/manual-date preview. The supplied PROJECT_PLAN.md remains unchanged.

## User requirement

Farm conditions first → matching crop suggestions → farmer chooses among suggestions → automatic non-overlapping calendar → tracking. Mock data only. No real data API. The system assigns dates; the farmer cannot create arbitrary timing overlaps.

## Four steps

1. **Your farm /farm**: name/area, mock pilot location and environment, soil texture, drainage and irrigation. Unknown soil/drainage/water is allowed to record but cannot proceed to suggestions until confirmed. Optional priorities, household crop groups, unavailable planting/harvest-help months and previous crop identities are retained. Previous crops record familiarity, not future dates. Invalid area stops Continue and focuses the error.
2. **Suggested crops /crops**: only crop windows passing all five mock/entered screening checks (water, climate/season, soil, drainage, help) appear. Farmer checks crops to consider; one identity may be eligible for multiple seasons. Suggested dates are shown per season. No free crop/date entry. The separate 43-entry reference catalogue is read-only and cannot bypass screening. Build remains disabled if a season is unselected or no complete rotation meets household constraints.
3. **Calendar /plan**: engine enumerates combinations from selected passing windows, requires every full-plan check to pass, then ranks them. Up to three distinct crop sequences are shown. Only one best-ranked date assignment per sequence is retained. Months without crops are explicit rest. Dates and durations are locked. Why this plan? shows seven mock/entry checks separately from unassessed real-world suitability. Save labels a March–February cycle with a year; the year is not a forecast and does not modify mock climate.
4. **Track /track**: immutable saved rotation snapshot with planting/harvest checkboxes and 500-character notes for each crop. Harvest requires planting; undo harvest before planting. Progress counts farmer-entered tasks only. No task is inferred from time, satellites or 3D. Re-saving the identical plan/year/input fingerprint preserves records. Replacing or clearing records requires an explicit confirmation.

The home route redirects to /farm. Reasons remain at /insights. Four navigation steps, page titles and step indicators show the sequence. Guided tours can visit temporary examples before a user has generated a plan; they never mark the actual farm reviewed, enable generation or save tracking records.

## Timing contract

- March is index 0, February 11. Periods are integer half-open intervals [start, start + duration).
- Start ≥ 0, duration > 0, end ≤ 12. New generated periods never wrap across the cycle boundary.
- Each occupied month may occur only once. completeCalendar rejects invalid or overlapping periods, then inserts explicit rest gaps.
- A complete generated calendar covers all twelve months exactly once and contains three non-rest crop periods.
- Windows are crop-specific authored fixtures, not fixed four-month blocks. Where fixtures offer alternatives, ranking/labor checks can choose another start or duration.
- No arbitrary crop, manual start month, duration, original fixed-plan fallback or unsupported crop can enter the generated selection.
- Missing or conflicting input excludes a window. Zero complete compatible rotations means zero plans, never a forced conflicting plan.
- Priority ranks only passing plans. Household requirements apply to the complete rotation, not to each single-crop suggestion.
- Mock labor checks concern the first/last month only; they do not predict all labor demand.

This is a month-resolution software guarantee for authored demo fixtures. It does not establish valid real planting windows, safe field turnaround, cultivar maturity, crop compatibility or day-level farming feasibility.

## Fictional data contract

src/data/demo-environment.ts defines two authored locality fixtures, three weather fixtures, twelve rain/temperature/relative-wetness records, 13 crop rules and crop-specific windows. All season/temperature/soil/drainage rules, rainfall credits, water/drought indices and windows are invented. They are not NASA/BRRI/FAO observations or recommendations. Relative wetness is displayed only. Pulse months and crop-group counts are descriptive proxies; no soil benefit, yield, water saving or drought outcome is predicted.

Names/catalogue source links and the five supported 3D anatomy entries remain source-informed and separate from invented crop-matching values. Unsupported anatomy uses an identified empty placeholder, never substitute geometry. Manual anatomy study does not change the chosen plan or calendar.

## State and invalidation

- ritu-preview-v1: farm, language, priority and selected generated ID.
- ritu-demo-v1: mock location/weather, crop choices and generated-mode flag.
- ritu-journey-v1: reviewed farm fingerprint, generated input fingerprint, saved calendar/year and recorded tasks/notes.
- A farm/location/weather/priority change invalidates review and future generation until reviewed again. Crop-choice edits require rebuilding. The tracked snapshot remains intact and a stale-input notice explains it.
- Applying a scenario explicitly updates farm/settings and their review/generated fingerprints only when the draft has compatible plans. Draft/Reset do not save farm changes. Existing tracking is untouched until a replacement is explicitly saved.
- Store loading uses deterministic server snapshots; main inputs appear only once browser state is ready, preventing pre-hydration edits from being discarded.
- Each schema is validated on load. Invalid tracked timing, record keys or harvest-before-planting cannot be restored. Storage errors leave the current tab usable with a visible notice.
- **Reset all data** is visible beside the farm heading; the footer invokes the same operation. After confirmation, all farm inputs, mock location/weather and priorities return to the demo defaults; crop choices, review/generated fingerprints, saved calendar, progress and notes are cleared. Language and reading/motion/sound preferences remain. Reset restores sample defaults rather than blank inputs.
- Full reset remounts the farm form, clearing unfinished area drafts and other local form state, closes the field view and returns to the first month. Cancel/Escape leave stored data unchanged; confirmed reset restores focus to the current reset control.
- **Reset previous crops** is a separate history-only action. It preserves other farm inputs and the saved tracking snapshot, while invalidating future suggestions until the changed farm is reviewed again.

## Design basis and scope

[W3C multi-page form guidance](https://www.w3.org/WAI/tutorials/forms/multi-page/) supports logical steps, visible progress, optional stages, saved earlier inputs and avoiding form time limits. It does not establish that this app has been validated with Rajshahi farmers or that mock crop windows are scientifically correct. Palette follows the user's white-body/dark-green-navigation preference; no eye-health benefit is claimed.

Seven replay scopes: full, farm, crops, calendar comparison, field, reasons and tracking. Full mission has 28 steps; section replays have 27 combined. Streaming words, 900ms target travel, reserved rail/dock, Mati and sound controls remain. Reduced motion/instant text are available. Farm ambience and click sounds are optional, synthesized, and not ecological recordings.

## Verification and continuation

Exact completed results belong in PREVIEW_VERIFICATION.md. Unit coverage includes a 270-combination soil/drainage/irrigation/weather/priority matrix and alternate planting-window selection when help is unavailable. Browser coverage exercises the full real UI, missing inputs, strict scenarios, persistence, stale tracking, replacement/reset, Bangla reflow, accessibility, every tour and actual WebGL/audio behavior.

Future integration needs independently reviewed day-based windows, crop/variety stages, transition buffers, local soil/drainage/water rules, crop-family rotation rules, NASA provenance/missingness and physical-device/farmer validation. Replace mock rules visibly; do not relabel fixtures as observations. No live APIs are authorized for this demo.

Latest source map: demo-planner.ts (suggestions/generator/timing/fingerprints), journey-store.ts (validated snapshot/tasks), farm-view.tsx (Step 1), journey-views.tsx (Steps 2/4), compare-view.tsx (Step 3/save), demo-planning.tsx (environment/reasons/scenarios), tours.ts and tour-guide.tsx (read-only guide).
