# Fields, farms and calendar — 6 November 2026

**Follow-up:** Daily completion checkboxes and scores were subsequently removed. Use the source-linked daily guidance and record actual planting, observations and harvests. See [Farm guidance and creation repair](FARM_GUIDANCE_AND_CREATION_2026-11-06.md) for the current behavior and verification. The earlier run results below are retained as historical evidence.

The dashboard now registers physical fields before grouping crop farms within them. A field in Bangladesh and another in Washington keep separate locations, areas, conditions and weather. Each farm uses part of its parent field, with its own crop, season, calendar and records.

## How to use it

1. Open **Dashboard** and enter how many fields to add.
2. Choose **Set up field** for each one. Set its location, name, total area, soil and water information, then **Save field**.
3. Choose **Add a farm** within that field. Enter the part of the field used by this farm and when it will be ready, then choose a crop. Repeat for another crop or part of the field.
4. Open the farm calendar. Record actual planting with **I planted on this day** or its date input. The day counter, growing period and daily work update together.
5. Review the daily guidance. Stage, water, damage and harvest choices show the next-guidance preview before saving; **Save daily check-in** applies them to the farm record. Completion checkboxes and scores have been removed.
6. For a mentor walkthrough, choose **Preview another day**, then **Next preview day** or a specific **Preview date**. Planting, observations, harvest, notes and settings in this mode affect only an in-memory copy. **Finish preview** restores the saved farm. Export continues to contain real saved records.

The ordinary **Previous day / Next day** buttons browse work for a calendar date. Future actual activity remains disabled outside preview mode. Weather retains its real timestamps and available forecast window; advancing the preview does not manufacture future weather.

## Data and behavior

- Every field has an independent location and total area. Farms inherit its location and initial conditions; their own area and season are recorded separately. Simultaneous farm allocations must fit inside that field. Finished seasonal crops release their area after actual final harvest; active plantings and perennial crops retain it.
- **Change farm area** can release part of an existing field while preserving that farm's notes, dates and journal. Moving a populated field to another location requires a separate field, preserving the original crop/weather evidence.
- Earlier saved farms migrate to independent parent fields without merging coordinates or discarding journals. A damaged file preserves readable farms and fields, including fields not yet configured, and retains its original recovery export.
- Green dates cover the full growing schedule from planting to the estimated/reference end. Recording actual planting shifts it; an actual seasonal final harvest ends it early if appropriate. A crop still growing beyond the reference interval remains active and is shown in amber. A perennial date is a care review, not first fruit or automatic completion.
- Completion counts include earlier work done on the selected day even when planting changes the current task list. The selected calendar date stays dark green and readable within the shaded period.
- A field created from coordinates can resolve its local clock through live weather before defaulting the planting date. A regression reproduced UTC 6 November while Washington was still on 5 November; the corrected form uses Washington's local day and preserves a manually chosen later date.
- Removed the supplied NASA introductory paragraph and animation forecast footer from the landing page. Repeated progress and perennial copy is shorter. Crop-specific methods, source evidence and distinctions between measured, modeled and forecast inputs remain available.

Crop-stage choices change field guidance; they do not invent a new harvest date. Numerical date changes still require actual planting/harvest events, a supported named-variety reference or the existing documented grain-corn model and sufficient temperature evidence. No new agricultural coefficient, synthetic forecast or automatic hardware control was introduced.

## Verification

- **572/572 unit/API tests passed.** Two of the new domain tests contain **20,000 independently checked allocation schedules** and **21,900 date/location/lifecycle cases**. These 41,900 generated scenarios are part of the test suite, not agricultural field trials. [Unit results](../output/audit/fields-calendar-2026-11-06/unit-final.json).
- The broad production-browser sweep executed **482 cases: 476 passed and 6 failed**. Two failures exposed selected-day color contrast, and four expected the previous empty dashboard or editable inherited location. The contrast was repaired and those expectations updated for the field hierarchy. [Broad result](../output/audit/fields-calendar-2026-11-06/browser-all.json).
- **228/228 corrected production-browser cases passed**, including every earlier failure and all non-matrix workflows. The already-passing location/setup matrix was not rerun in that gate. [Corrected gate](../output/audit/fields-calendar-2026-11-06/browser-final.json).
- A subsequent midnight probe exposed the missing inherited-field time zone. After its repair, **26/26 field/calendar browser cases passed** on the final build, including the new regression. They cover independent countries, subdividing fields, area overflow prevention, resizing without journal loss, recovery, instantaneous feedback, changing stages, preview isolation, early completion, continued crops and perennial harvests. [Latest field gate](../output/audit/fields-calendar-2026-11-06/fields-final.json).
- **15 responsive/accessibility combinations passed** across dashboard, land, crops, calendar and sources, including enlarged Bangla at 320 px and enlarged English at 1024 px. No page errors, horizontal control clipping, automated WCAG A/AA violations or short bottom-navigation reservation were reported. [Layout results](../output/audit/fields-calendar-2026-11-06/responsive-review.json).
- Final production build, TypeScript, full source/test/script lint, scoped formatting and whitespace checks passed. The initial concurrent unit attempt timed out in an unchanged historical exhaustive planner test. The idle rerun passed without increasing its timeout; the failed attempt is retained as [the under-load result](../output/audit/fields-calendar-2026-11-06/unit-under-load.json).
- Live NASA POWER climatology and Open-Meteo weather requests returned **200 for both Bangladesh and Washington**, with the correct requested coordinates, local time zones and seven-day weather windows. These requests used no intercepted browser fixtures. [Live provider checks](../output/audit/fields-calendar-2026-11-06/live-providers.json).

[Machine-readable run summary](../output/audit/fields-calendar-2026-11-06/summary.json). Initial failures, traces and helper scripts remain under `research/fields-calendar-2026-11-06/`; older dated audits are preserved. Browser testing used isolated QA records and captured climate fixtures, not the user's browser profile. Recorded test observations are not shipped as farmer data. Passing these software tests does not establish cultivar performance or complete field suitability.

## Screenshots

- [Two countries, separate fields and subdivided farms](../output/audit/fields-calendar-2026-11-06/two-countries-fields-desktop.png).
- [Green growing period, selected date and completed work](../output/audit/fields-calendar-2026-11-06/calendar-completion-desktop.png).
- [Temporary date preview](../output/audit/fields-calendar-2026-11-06/temporary-preview-desktop.png).
- [Enlarged Bangla calendar on a narrow phone](../output/audit/fields-calendar-2026-11-06/layout-320-bn-plan.png).

Changes are local. No commit, push or deployment was requested for this update.
