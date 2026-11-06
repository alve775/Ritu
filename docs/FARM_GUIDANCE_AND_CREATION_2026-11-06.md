# Farm guidance and creation repair

## Published checkpoint

This checkpoint includes the earlier field-to-farm hierarchy, date preview and calendar changes, followed by these requested updates:

- Removed the daily work checkboxes, completion score and calendar completion badges. Older completion records remain readable and exportable.
- Kept source-linked daily guidance, field observations, actual planting and partial/final harvest records. Task completion does not generate a harvest prediction.
- Show the optional documented grain-corn heat estimate only when that model is configured.
- Replaced an indefinite creation spinner with a saved-farm calendar link. Reproduced the old failure by holding the calendar navigation after the farm had already saved. The calendar link recovers through a document navigation when storage is available.
- Added idempotent farm creation receipts and regression checks for retry, reset, invalid creation and storage failure.
- Simplified repeated English/Bangla cautions on crop cards, calendar guidance, weather, soil, variety tools, tours and source pages. Forecast labels, methods, source credits, actual validation and storage errors remain available.

## Verification at this checkpoint

- Production build and TypeScript compilation passed.
- ESLint passed without warnings after cleanup.
- Unit/API suite: **579 passed, 0 failed**. The initial run had one obsolete assertion expecting a removed sentence; it now verifies the actual maturity-inspection action and unchanged harvest record.
- Targeted desktop/mobile browser gate: **12 passed**, covering reset in four workflow stages, stalled navigation recovery and checkbox removal.
- Broad production browser gate: **496 cases; 490 passed, 6 failed**. The remaining failures are under investigation; see `output/audit/copy-creation-2026-11-06/browser-all.json`. This checkpoint does not claim a fully passing final browser gate.
- Repository-wide formatting check finds existing formatting differences in 41 untouched files. Changed-file formatting is checked separately.

Browser automation uses isolated QA storage and recorded source fixtures or explicitly labelled synthetic activity cases. It does not reset a farmer's browser or establish agricultural field accuracy.

Earlier field/calendar evidence is in `FIELDS_AND_CALENDAR_2026-11-06.md`. Its completion-checkbox description is superseded by this update.

## Verified follow-up

The published checkpoint is commit `6d7b2cb`. The follow-up corrects a reproduced edge case in its retry protection: intentionally starting a second farm with the same field, name, area, crop and date could reopen the first farm. Each new planting operation now receives a separate identity. Retrying that operation remains idempotent, including across a reload; starting another operation permits a separate plot. Existing records and land confirmation remain compatible.

All six failures at the checkpoint were obsolete UI assertions: four expected the removed caution sentences, and two attempted to tick the removed daily checkboxes. The replacement checks verify source details, the country restriction, persisted planting/observation records and export. They retain the underlying behavioral checks.

Final evidence is in `output/audit/copy-creation-2026-11-06/summary.json`:

- **582/582 unit/API tests**, across 37 files, passed. This includes the independent 20,000 allocation-schedule comparisons and 21,900 calendar day/location/state combinations.
- **498 distinct desktop/mobile browser cases have passing evidence.** The complete production run passed 497/498. Its one failure was an ambiguous heading during a dashboard-to-calendar transition: the parent-field and farm-card headings shared the requested name. The test now waits for the calendar's level-one heading. Four focused reruns passed: twice each on desktop and mobile. This is combined passing coverage, not a claim of a single 498/498 run.
- **15/15 responsive/accessibility checks** passed across five pages at 320 px Bangla/larger text, 1024 px English/larger text, and 1440 px Bangla/comfortable text. No page errors, horizontal control overflow, footer overlap or scoped WCAG A/AA violations were found.
- Production build, TypeScript, ESLint without warnings and formatting of all changed source/test files passed.

The browser coverage includes reset at four workflow stages, direct-route guards, separate countries and plots, identical new plantings, stalled navigation recovery, storage failure, journal export, temporary date preview, early/final/partial harvest, perennials, weather/source outages, soil and water tools, image retries, tours and audio controls. Each isolated test context keeps QA records separate from the farmer's browser.

The current calendar shows **daily farm guidance** with source links. Actual planting starts its day count; actual final harvest closes a seasonal farm. Field observations update the guidance. The optional documented grain-corn heat model remains a separate tool; ordinary task completion supplies no numerical maturity prediction.

Current calendar screenshots (isolated QA activity dates and recorded weather fixtures):

- `output/audit/copy-creation-2026-11-06/calendar-guidance-desktop.png`
- `output/audit/copy-creation-2026-11-06/calendar-guidance-mobile.png`

These checks establish software behavior for the covered cases. They do not establish cultivar performance, seasonal water adequacy or complete field suitability. Source methods and those agricultural distinctions remain available in the application.
