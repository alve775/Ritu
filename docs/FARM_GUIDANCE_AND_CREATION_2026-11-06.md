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
