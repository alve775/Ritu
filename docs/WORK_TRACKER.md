> **Latest guidance/creation update, 6 November:** [Farm guidance and creation repair](FARM_GUIDANCE_AND_CREATION_2026-11-06.md). Daily completion checkboxes, scores and badges are removed; planting, observations, harvest records and source-linked guidance remain. Saved farms have a recoverable calendar link if navigation stalls. Retry protection is scoped to each planting operation, so identical new plots remain separate. Repeated English/Bangla cautions are simplified, with methods, forecast labels, source credits and validation retained. Checkpoint `6d7b2cb` was pushed before continuing. Final evidence: 582/582 unit/API tests, 41,900 generated field/calendar scenarios, 498 distinct browser cases with passing evidence across the full run and scoped tour rechecks, and 15/15 responsive/accessibility checks. The report records the initial failures and exact accounting.

> **Earlier field/calendar update, 6 November:** [Fields, farms, live feedback and date preview](FIELDS_AND_CALENDAR_2026-11-06.md). Physical fields in separate locations can be subdivided into crop farms, resized without losing journals, and retained through migration. Temporary future-date previews preserve real farm records. Its earlier completion-checkbox interface is superseded by the guidance update above.

> **Latest motion correction, 5 November:** [Hand, prop and action timing repairs](MOTION_REPAIRS_2026-11-05.md). Grain, sickle, can and basket follow their grips; seed release and the moving water outlet are synchronized. Harvest cuts before lifting and settles once. Growth roots remain grounded. Desktop/phone contact and playback regressions plus 32 timed frames check the movement that earlier chapter-only tests did not cover. No commit/push requested for this follow-up.

> **Latest full sweep, 5 November:** [Nine reproduced website bugs repaired](FULL_SWEEP_2026-11-05.md): cross-tab resets/storage deletion, unsaved-draft export, local soil dates, photo retries, map metadata, late GPS, Bangla categories and mobile footer spacing. Final unit/API suite: 566/566. Broad browser run: 429/430 plus a traced development reload; affected cases and new regressions verified in the production gate. Dependency patches removed the high advisories; eight moderate lint-chain entries remain, with zero production advisories. Earlier theme and character work is preserved. No commit/push/deploy requested.

> **Latest theme follow-up, 5 November:** [Shared green theme](THEME_UNIFICATION_2026-11-05.md). Darkened the palette slightly to `#3e694b` and unified header/sidebar, primary buttons, selected controls, secondary-button tints, hover and focus styling. Browser measurements confirm matching colors. 28 contrast checks, 4 desktop/phone farm journeys and 6 scoped accessibility scans passed. No new commit/push requested.

> **Latest visual update, 5 November:** [Frame and 2D characters](VISUAL_REFRESH_2026-11-05.md). Header/sidebar use medium leaf green after feedback that pale sage was too light. Original farmers now have defined faces, hands, clothing and tool details. Final 8/8 animation/layout tests and 12 viewport/chapter fit checks passed; three scoped automated accessibility scans reported no violations. Agricultural rules and farmer records are unchanged. No new commit/push requested.

> **Latest correction, 3 November:** [NAVIGATION_AND_AUDIO_REPAIRS_2026-11-03.md](NAVIGATION_AND_AUDIO_REPAIRS_2026-11-03.md) supersedes the stale-active-farm and legacy-tour assumptions below. Calendar access requires explicit creation/opening and is revoked in setup; old global flags suppress no new page guide. Audio recovers from mute, and tour read-aloud uses matching browser voices. Native English speech and real sound/click signals were verified; this browser has no Bangla voice. 566 unit/API checks, final build and 28 production follow-ups passed. The broad run was 109/114 before those follow-ups, with all five failed cases subsequently passing.

> **Latest navigation update, 3 November:** [PAGE_TOURS_AND_DASHBOARD_2026-11-03.md](PAGE_TOURS_AND_DASHBOARD_2026-11-03.md). Previous work committed/pushed first as 367b9cf. New order: Dashboard → Land details → Suggested crops → Farm calendar. Guides are page-local; direct URLs and navigation respect current land confirmation and active farm selection. New-field setup preserves existing records. Older cross-page full-tour descriptions below are historical.

> **Latest browser implementation, 3 November:** [SCIENTIFIC_IMPLEMENTATION_2026-11-03.md](SCIENTIFIC_IMPLEMENTATION_2026-11-03.md) supersedes the research-only integration status below. Optional soil test records, live ISRIC WCS pH predictions with quantiles, a bounded FAO-56 daily water calculator, five documented Bangladesh mungbean references and pause/manual weather controls are implemented. Keep modeled/forecast/reported inputs separate; no field validation, irrigation order or unconnected NASA product is implied.

> **Latest scientific research, 3 November:** Read [SCIENTIFIC_REVIEW_2026-11-03.md](SCIENTIFIC_REVIEW_2026-11-03.md) and its 38-claim CSV before changing agricultural rules. Relevant methods/limits from 34 retained substantive pages were examined. FAO-56 and corn calculations have source support; RITU field/cultivar accuracy remains unvalidated. SoilGrids REST is currently paused; SMAP L4 root-zone estimates and GAEZ v5 were researched but not integrated. Sources-page wording is corrected in both languages. Keep `research/scientific-review-2026-11-03/` separate from earlier frozen audits. No new recommendation algorithm or fake coefficients were introduced.

> **Latest recommendation audit, 3 November:** [Source-to-screen verification](RECOMMENDATION_AUDIT_2026-11-03.md). Repaired actual screening/input defects; **131,760 evaluations, 547 unit/API tests and 118 distinct browser cases passed**. Preserve the new dated evidence separately from earlier audits. Water adequacy, cultivar performance and complete field suitability remain unvalidated. See the report for exact source comparisons, screenshots and outstanding scientific work.

> **Latest tracking update, 3 November:** [Adaptive crop tracking](ADAPTIVE_TRACKING_2026-11-03.md) records lifecycle states, partial/final harvest, correctable daily check-ins, next-day guidance and the opt-in documented grain-corn thermal model. New evidence is kept in `research/adaptive-tracking-2026-11-03/`; older audit exports remain frozen. See the linked document for final test results and scientific limits.

> **Current audit, 2 November:** [Worldwide source and setup verification](GLOBAL_AUDIT_2026-11-01.md). All 2,562 retained source records were compared with their original data. The six-location matrix passed **263,160 setup/date calls** across all 60 supported land profiles and 731 dates. **495 unit/API tests**, **720 unique input workflows** and **32 additional feature/tour/layout cases** passed; final photo-render/outage reruns passed **4/4**. Production build, TypeScript, source/script lint and scoped formatting passed. The report links the **10-page screenshot walkthrough** and the exported per-entry CSV/JSON; image completion and unavailable results are explicit in that ledger. Preserve `research/global-audit-2026-11-01/`, including initial failures and source hashes. Passing software checks does not certify worldwide cultivar suitability. Earlier counts below remain historical. No commit/push was requested for this audit.

> **Current entry point:** [PLANT_CATALOGUE_AND_IMAGES_2026-11-01.md](PLANT_CATALOGUE_AND_IMAGES_2026-11-01.md). Worldwide land setup → one seasonal crop or perennial care plan → an independent calendar, daily checks and forecast → multiple saved farms. The complete source catalogue has 2,562 non-retired records. Images are fetched automatically through Wikipedia/Wikidata/Commons APIs. Unknown field facts, source gaps and provider failures never become invented data or photographs. Earlier rotation records remain at /records. The previous [single-season checkpoint](GLOBAL_SINGLE_SEASON_2026-10-31.md) remains historical context. No commit/push is requested for this redesign.

> **Final image ledger:** all 2,562 identities checked; **1,752 accepted image entries**, **810 unavailable**, no unresolved provider/provenance/file errors. Every accepted asset was rehashed and fully pixel-decoded. The final eight live production checks passed on 2 November; helper port 3015 is stopped and preview port 3000 remains running. `output/audit/RITU_Artifact_Verification.json` records final CSV/PDF integrity. Source/software verification remains distinct from botanical identification or farmer field validation.

Latest update (2026-11-01): [Full plant catalogue and API images](PLANT_CATALOGUE_AND_IMAGES_2026-11-01.md). The active app now uses all 2,562 non-retired source records, searchable/paginated plant groups, truthful seasonal/perennial plans, and automatic Wikipedia/Wikidata/Commons image delivery. Observation photos and manual image placement are superseded. The live 32-plant API audit passed; twelve real remote images decoded and actual tomato/pepper/papaya UI cards were captured. **469 unit/API checks and 288 browser checks passed** (280 workflow + 8 layout/animation), including 256 full land-input flows. Production build and live production image/NASA-backed search probes passed. Earlier counts below are historical.

> **Historical audit of the superseded rotation flow:** [INPUT_AUDIT_2026-10-31.md](INPUT_AUDIT_2026-10-31.md) records the earlier 216 browser cases, 68 acceptance checks, 208 unit/API tests and 22-page PDF. That PDF documents the old multi-season flow; it is not acceptance evidence for the newly requested product. Earlier workflow descriptions and passing counts below are historical checkpoints.

> **Final verification, 1 November:** 280 browser cases passed, including 256 complete UI input-to-farm runs across eight worldwide locations, 16 land profiles and desktop/phone; 438 unit/API/domain tests passed. Production build/TypeScript, scoped lint/format and a real-data production API probe passed. The Manikganj screenshot scenario now produces one-crop farm options and an independent calendar/forecast workspace. A malformed NASA coordinate-array acceptance bug was reproduced and repaired. Preview: http://127.0.0.1:3000/farms. Exact source/coverage/automation limits and screenshot paths are in the current entry-point document. No commit or push has been performed.

> Previous release baseline: [RELEASE_CHECK_2026-10-26.md](RELEASE_CHECK_2026-10-26.md) records main-branch publication and the preserved desktop corner. Then read [SIMPLIFICATION_AUDIT_2026-10-26.md](SIMPLIFICATION_AUDIT_2026-10-26.md), [USABILITY_AUDIT_2026-10-26.md](USABILITY_AUDIT_2026-10-26.md), [FINALIZATION_2026-10-26.md](FINALIZATION_2026-10-26.md) and [FARM_ANIMATION_STORYBOARD.md](FARM_ANIMATION_STORYBOARD.md).

# Ritu working record and acceptance checklist

Latest color correction: the user reported weak stitch visibility on white. The stem and leaves now use fully opaque olive #82965f. Preserve the existing geometry, stroke widths, dash pattern, size and corner position; the paint alone changes. Calculated specified-color contrast is approximately 3.24:1 on white and 3.04:1 on the dark green sidebar. Four focused corner/density browser cases passed; current visual evidence and the W3C reference are in [the release check](RELEASE_CHECK_2026-10-26.md). Earlier counts below describe earlier revisions.

Latest visual revision: the user reported the wavy stem missing after 211e6f5. The shifted sidebar background clipped half of the original artwork. Keep the square corner, unchanged original logo and all control geometry. Render public/ornaments/vine-stitch.svg on the sidebar's fixed decorative ::after layer so the complete wave and both sets of leaves remain visible across the boundary. Keep pointer-events: none; the layer disappears with the sidebar on phones and during desktop tours. See [the release check](RELEASE_CHECK_2026-10-26.md) for current captures and superseded treatments.

Exact corner requirement: the user rejected the extension added in d48412e. Keep only the original public/ornaments/vine-stitch.svg, unchanged at 14 × 120px, positioned with left: calc(var(--sidebar-w) - 6.5px) so the original stem intersects the square corner. Preserve the vertical phase. The added vine-corner.svg is removed; do not restore it or add another branch. Do not return to a clipped sidebar background. All ten focused density/logo/reading browser cases passed. The regression now checks paint on both sides over a complete wave repeat on standard and high-density displays; the old single-pixel test did not catch clipping.

Latest conservative simplification: [SIMPLIFICATION_AUDIT_2026-10-26.md](SIMPLIFICATION_AUDIT_2026-10-26.md). Standard text is 16px, with large text retained and no logo change. Keep all four stages and unique explanations. Full tour: 14 core stops; first visit: five stops; optional explanations remain in section guides. Remove only repeated presentation and two unimplemented ranking choices, preserving older saved preferences. **66 distinct browser cases passed across the broad run and focused follow-ups; build/TypeScript, scoped lint and formatting passed.** The linked audit records initial test-helper failures, precise run accounting, sources and screenshots. Counts below are earlier checkpoints.

Latest interface work: [UI_DENSITY_AND_LOGO_2026-10-26.md](UI_DENSITY_AND_LOGO_2026-10-26.md). Keep the 18px default and tighter spacing. The unchanged pre-pull white logo badge from 773ae11 now sits at the top of the desktop sidebar with 24px vertical clearance; the toolbar starts at the main-content column. Phones and desktop tours keep one compact header badge. This replaces the cramped centered-in-header composition. **All 58 current finalization browser cases passed**, including six responsive widths, visible-scrollbar clearance, Bangla/larger text and full tours; production build/TypeScript, scoped lint and formatting passed. Primary research, before/after captures and exact limits are in the linked document. Entries below describe earlier checkpoints.

Latest narrow repair: the user clarified the target is the **pale curved band beside the canal**, not the outer layout. [EDGE_CORRECTION_2026-10-26.md](EDGE_CORRECTION_2026-10-26.md) records the matching soil/water contour, before/after crops and seam regression. Earlier outer-gutter changes addressed the wrong area.

Current live-workflow QA: **164 unit/API/asset tests**, **136 distinct browser cases across full/focused runs**, including **220 all-scope tour focus visits**. All originally failing cases were corrected and rerun. See [the detailed current log](LIVE_FARM_WORKFLOW.md) for exact run accounting, real-provider captures and remaining farmer/agronomy validation. Earlier verification paragraphs below belong to earlier source states.

> Live workflow update (26 October 2026): the normal farm form starts with worldwide location search and a farm-pin map. Current model estimates and seven-day forecasts load automatically from Open-Meteo. NASA POWER history remains separate, dated seasonal context and follows a changed pin automatically; there is no normal year selector or Load history button. Saved calendars retain their farm location, weather view and explainable observation reminders. Crop dates/rules are still experimental Rajshahi templates, not validated global recommendations. See [LIVE_FARM_WORKFLOW.md](LIVE_FARM_WORKFLOW.md) for current scope, sources and verification; earlier results below are historical.

Owner: Abid Al Hossain Swakkhar. Team: three web developers in Rajshahi. Workspace: `E:\001_RITU`; repository: https://github.com/alve775/Ritu. Updated October 25, 2026. This is the continuation entry point: read it before resuming work, then verify files and runtime rather than assuming a recorded result still applies.

## Current implementation — October 26

The current user instruction supersedes the mock-only restriction: real NASA environmental history is now authorized. Four main steps have moved back to a large desktop left sidebar; the workspace is white and wider; priorities, household needs and previous crops are visible. POWER daily history is integrated with validation, a live refresh endpoint and an authentic 2025 Rajshahi snapshot. A live endpoint request for Naogaon returned a separately validated 365-day 2025 record. Experimental crop rules and dates remain explicitly unvalidated.

The user clarified that images mean CLEAR CROP PHOTOGRAPHS, not satellite scenes. The app now uses ten public-domain/CC0 species reference photographs with source/license credits (all twelve planning entries, with three rice seasons sharing one species photo). Mung beans are explicitly a harvested-seed reference. No satellite crop images or GIBS integration ship. Existing Three.js source is retained but not loaded in this photo workflow. See [crop photo licenses](CROP_PHOTO_CREDITS.md).

Household requirements now survive condition changes; conflict resolution is explicit. The landing page states the data boundary, honors saved reading preferences, and opens a real read-only sample calendar. Tours follow form order and the Continue bar stops sticking while measured by the tour.

Read [FARMER_WORKFLOW_AND_NASA.md](FARMER_WORKFLOW_AND_NASA.md) for the current checklist, primary research, and verification log. Unit/API/asset checks: 144 passed. All 118 browser cases passed across the complete run and focused reruns, including 220 full-tour/section focus visits across English/Bangla and desktop/mobile. Production build, strict TypeScript, ESLint and formatting passed. Physical-device/farmer and agronomic validation remain open. Prior statuses below are historical, including earlier no-NASA claims. No new commit or push has been requested for these changes.

## Latest update and review — October 25

Abid requested pulling the friend's latest changes and analyzing whether they were right. Local `main` fast-forwarded from `773ae11` to `1e4b07c`, comprising 47 incoming commits and 107 changed files. The existing untracked October 14 image is unchanged. No implementation repair or new commit/push was performed.

See [REVIEW_2026-10-25.md](REVIEW_2026-10-25.md) for reproducible findings, limits and evidence. **129 unit tests, lint and production build/TypeScript passed. The complete browser run finished with 116 passes and 4 failures out of 120 cases**; the failures are two stale three-plan assertions on both viewports, inherited from the earlier crop retirement. New landing-page concerns are a missing clear mock-data notice, ignored saved reading preferences on direct visits, and a sample-plan link that opens the farm form. Condition changes also remove stored household requirements automatically; a visible notice is shown, but this needs an explicit product decision. No scientific validity, NASA integration or user-study outcome is established by these checks.

The ordinary formatting check reports CRLF checkout differences; accepting current line endings passes. npm dependency synchronization hit a local `edgesOut` error; a clean install remains unverified. Generated build-file changes are restored after checking. Earlier statuses below are historical and do not replace this review.

## Website and shortcut logos — October 5

- [x] Use supplied `website_logo.jpg` for the visible logo; show the complete symbol and wordmark while hiding blank margins in its display frame.
- [x] Use supplied `icon_logo.jpg` for tab/bookmark/desktop favicons, Apple home-screen icons and 192px/512px manifest icons. Add a padded maskable icon and reproducible local generator. Preserve both source JPEGs.
- [x] Inspect desktop and phone rendering; verify metadata links, manifest, HTTP responses and actual icon dimensions. Three Playwright viewports passed (1440px, 390px, 320px); zero page errors/overlays/overflow. Scoped lint, strict TypeScript, formatting and the production build passed.
- [ ] Physical-device shortcut installation remains untested; existing shortcuts may need recreating to discard cached icons.

See [BRAND_ASSETS.md](BRAND_ASSETS.md). Abid explicitly requested committing and pushing the logo and crop-removal follow-ups to `main` on October 5. Include both supplied JPEGs and generated shortcut icons; keep local QA captures, dependencies and video outputs ignored. The remote baseline was verified at `9841cf2`; use a normal push and verify the remote commit and clean worktree afterward. Earlier branch/work-status statements below describe their historical checkpoints.

## Retired crop removal — October 5

- [x] Remove sorghum from the active ID list, bilingual catalogue, default preferences, mock suitability rules and planting windows. The live catalogue contains 42 named crops plus rest; 12 identities have mock rules/windows.
- [x] Update bilingual tour copy, current catalogue documentation, acceptance counts and existing production/browser checks. Default mock choices now yield two compatible calendar options; no replacement crop or conflicting dates are introduced.
- [x] On loading older farm/demo saves, remove only the retired crop from previous crops and preferences, preserving other farm/environment fields. An entirely removed history becomes the existing empty-history sentinel. A retired selected plan ID returns to the neutral selection; existing saved-plan validation refuses any tracked calendar containing the removed identity.
- [x] Keep the retired name only in compatibility code and regression fixtures, never in the active catalogue or crop rules.
- [x] Focused regression passed: **77 unit tests, 10 desktop/emulated-phone browser cases (46.2 seconds)**, scoped ESLint, formatting and production build/TypeScript. Browser checks opened all 42 remaining crop dialogs on both viewports, verified retired English/Bangla searches return zero, preserved legacy farm/environment data, and completed crop selection, automatic calendar and tracking. Missing-input/season guards still passed.

This follow-up and the logo changes are included in the October 5 authorized `main` handoff. Existing video captures and earlier verification counts describe their original historical app version, not a newly recorded video or tour audit.

## Current task: strict farm-first journey — October 4

This section supersedes previous comparison-first/manual-date requirements. See [JOURNEY_WORKFLOW.md](JOURNEY_WORKFLOW.md) for detailed state, timing and continuation contracts.

- [x] R27: home → farm inputs → passing suggested crops → automatic calendar → tracking; four navigation steps and no arbitrary crop/date injection.
- [x] R28: crop-specific mock windows, safe interval guard, exact twelve-month coverage with explicit rest; every generated option passes all seven checks. Unknown/conflicting choices yield no plan.
- [x] R29: locally saved calendar/year snapshot, planting/harvest order, notes, progress, identical-save preservation, stale-input notice and explicit replacement/clear/reset.
- [x] R30: 28-step full mission plus six replays covering the new sequence; temporary guide examples preserve actual review/generated flags and saved tracking.
- [x] Preserve white body/dark navigation, supplied original JPEG logo, 3D anatomy/source limits, optional audio, reading/motion/language controls.
- [x] Finish current browser/tour visual/optimized checks and record exact outcomes in PREVIEW_VERIFICATION.md: **76 unit tests, 78 browser tests, 220 tour visits across 24 reviewed sheets and 84 optimized animated visits**. Strict journey/scenarios/tracking, actual WebGL and opt-in sounds passed; no external requests or page errors during the optimized mock flow.

Current artifacts: `research/journey-verified-regression/`, `research/journey-verified-sheets/`, `research/final-production/` and `research/journey-production/` are ignored local QA captures. Source and durable verification/continuation documentation ship independently. Closing copy cleanup removes obsolete manual-date/annual-wrap instructions; **14 focused browser cases, final build/strict TypeScript, lint, formatting and diff whitespace checks passed**. The original plan remains byte-for-byte unchanged. Development preview responds at port 3000; owned production QA at port 3004 was closed.

Abid explicitly requested committing and pushing this work to `Swakkhar` on October 4. Keep `main` unchanged; verify the remote branch and clean worktree after pushing. The earlier pushed baseline is historical; inspect git before future handoff.

- [ ] Latest reported issue: the fifth full-tour step scrolls upward. Review the farm tour's order against the physical page layout and verify a coherent sequence. This report arrived after the completed regression above; it remains open in this handoff.

## Calendar blocker and action spacing — October 4 follow-up

- [x] Distinguish seasons with no passing mock windows from seasons with suggestions that have not been selected. The old message incorrectly asked users to select crops that were not offered.
- [x] State the current three-season requirement and add **Review farm conditions** beside the disabled build action. No farm input, eligibility rule or no-overlap guard is relaxed automatically.
- [x] Group the two actions in a responsive wrapping row with **16px separation**, 20px space above it and controls at least 48px tall. These dimensions are design choices, not scientifically universal spacing requirements.
- [x] Reproduce the Aman-only state using mock loam / limited irrigation / water-collecting drainage. Verify the unavailable pre-monsoon/winter explanation, unchanged stored inputs, disabled build, Bangla translation and explicit review/recovery to a complete calendar.
- [x] Final focused workflow regression: **16 Chromium desktop/emulated-phone cases passed (39.8 seconds)**, including geometric action-gap/height assertions and 320×800 Bangla with 24px reading settings; tested axe scans passed. Optimized build/strict TypeScript, ESLint and formatting passed. The broader 78-case/220-tour result above predates this follow-up and was not rerun.

Local captures: ignored `research/calendar-blocker-desktop.png`, `research/calendar-blocker-mobile.png` and the corresponding Bangla captures. Desktop panel visually reviewed; narrow captures confirm wrapped controls but may include the sticky header during automated element capture. Gap/height and no-document-overflow checks use actual browser geometry. This follow-up remains local on `Swakkhar`, after pushed commit `08961d0`; no additional push has been made.

Primary-source basis: [W3C Error Suggestion](https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html) supports actionable recovery guidance. [W3C Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) addresses target size/spacing; it does not prescribe a universal 16px gap. Ineligible demo conditions are not claimed to be incorrect real farm information.

## Previous-crop controls — October 4 follow-up

- [x] Replace visible Remove text with an ash-grey cross: 44×44px native button, 20px decorative icon, crop-specific English/Bangla accessible name and tooltip; retain focus styling and keyboard activation.
- [x] Add a 16px gap between the previous-crop dropdown and Add previous crop, scoped to that button.
- [x] Verify actual add/remove behavior, duplicate guard, Enter/Space removal and reload persistence on 1440px English and 320×800 Bangla at 24px. Measured icon button dimensions, neutral colors and dropdown gap pass; tested axe scans show no violations, and there are no page errors or horizontal document overflow.
- [x] Visually inspect desktop history section and narrow Bangla section/cross captures. Optimized build/strict TypeScript, changed-component ESLint, formatting and diff whitespace check pass.

Ignored local QA helper/captures: `research/verify-history-ui.mjs`, `research/history-desktop.png`, `research/history-mobile-bangla.png` and `research/history-cross-*.png`. The initial QA helper needed an explicit Playwright browser context for axe; after that harness correction both configurations passed. No app workaround was introduced. The isolated `ritu-history-ui` browser was closed; the local preview stays running. These changes and the preceding calendar-message/spacing fixes remain local after `08961d0`.

The [W3C Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/) supports accessible button names and Enter/Space activation; the neutral color and 16px spacing follow the user's visual preference and project layout choices.

## Previous-crop reset — October 4 follow-up

- [x] Add **Reset previous crops** beside Add in the optional history section. Both controls wrap with a 16px gap and remain 16px below the dropdown.
- [x] Require confirmation through the existing accessible dialog. Keep and Escape leave history unchanged; confirmed clearing writes the validated fallow sentinel and displays an explicit empty state. Disable reset when empty and return focus to Add after clearing.
- [x] Clear history only; preserve all other farm fields and the stored calendar/tracking snapshot. Changing history invalidates future suggestions through the existing farm fingerprint, so review is required before generation.
- [x] **18 workflow browser cases passed (39.1 seconds)**, including both desktop/phone reset cases: cancellation, Escape, focus, 320×800 Bangla/24px confirmation bounds, tested axe scan, persistence, re-adding a crop and exact saved-tracking preservation. Optimized build/strict TypeScript, scoped lint, formatting and diff whitespace checks passed. Narrow confirmation/empty-state screenshots visually inspected.

Ignored local captures: `research/history-reset-dialog-*.png` and `research/history-reset-empty-*.png`. Broader historical full-tour counts are not a fresh regression for this follow-up. This change remains local after `08961d0`; full-demo reset is still available separately through the existing Reset demo footer control.

Primary-source basis: [W3C Error Prevention](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html) describes confirmation/reversal/checking mechanisms for stored-data changes; the project uses confirmation for clearing the entire history list.

## Full farm and planning reset — October 4 follow-up

The latest correction explicitly requests resetting **all farm data**, rather than only previous crops. This supersedes the scope of the history-only interpretation above; both reset controls remain available for their respective purposes.

- [x] Add a visible **Reset all data** button next to the farm-page heading. The footer uses the same confirmation component and reset operation.
- [x] Restore every farm field to the demo defaults: name, area, soil, drainage, irrigation, household crop requirements, help availability and previous crops. Restore the mock location/weather, priority and default selected option; clear explicit crop choices, review/generated fingerprints, saved calendar, progress and notes.
- [x] Preserve language, reading, motion and sound preferences. Do not clear unrelated browser storage. Reset means restoring sample defaults, not leaving every field blank.
- [x] Remount the farm form after a full reset so unfinished/invalid area text, the history dropdown and local disclosure/dialog state cannot survive. Close the field view and reset the selected month.
- [x] Cancel and Escape preserve all three saved stores; confirmation returns keyboard focus to the current reset control. Shorten the bilingual confirmation so both actions fit the tested 320×800 Bangla/24px layout.
- [x] Add an end-to-end test that first records actual calendar progress/notes and changes all farm/settings categories, then verifies exact defaults, empty crop choices/tracking, invalid-draft cleanup and persistence after reload.
- [x] Final focused regression: **40 desktop/emulated-phone workflow/planner cases passed (1.5 minutes)**, plus **76 unit tests**, ESLint, formatting, strict TypeScript and optimized build. Tested axe scans and 320×800 Bangla/24px reflow passed. Original plan hash unchanged; local farm preview HTTP 200. Historical full-tour counts were not rerun for this reset change.

Ignored visual captures: `research/full-reset-desktop.png`, `research/full-reset-dialog-english.png`, `research/full-reset-dialog-*.png` and `research/full-reset-farm-*.png`. Desktop header and narrow confirmation visually reviewed. Final check results are recorded in PREVIEW_VERIFICATION.md. These follow-ups remain local on `Swakkhar`, after pushed commit `08961d0`; no additional push has been made. The fifth-step upward tour report remains open.

Primary-source basis: [W3C Error Prevention](https://www.w3.org/WAI/WCAG22/Understanding/error-prevention-legal-financial-data.html) supports confirmation/reversal/checking for stored-data changes. The confirmation explicitly identifies restoring demo defaults and clearing saved planning records.

## Pitch motion video — October 4, completed locally

Abid supplied the Who → Why → What → How pitch model and requested an accurate contest motion video. Confirmed brief: **Code_Geass, English, under four minutes, AI narrator with captions**. Read [PITCH_VIDEO_PRODUCTION.md](PITCH_VIDEO_PRODUCTION.md) before continuing: it contains the storyboard, draft narration, primary-source claim ledger, mock/planned-data boundary and render gates.

The completed local delivery is **185 seconds, 1920×1080, 24 fps, H.264/AAC**: `video/output/RITU_Code_Geass_Pitch.mp4`, SRT captions and an editable production ZIP. Narration is **Microsoft Mark**, installed Windows offline speech at rate 0. Holden failed for lack of credits; Abid authorized a free alternative. Automatic approval review rejected repository/production-file exports and narration-text transfer to third-party destinations; subsequent production stayed local. No app code, commit/push or publication was performed for this video.

Actual UI recordings/captures cover farm conditions, crop choices, two generated calendars, reasons, tracking, Bangla, help and scenario blockers; the camera interaction in the 3D scene is real recorded UI. Captures use a new Playwright context, preserving personal saved data, with zero captured page errors. The native six-second opening uses the previously reviewed 720p source, cropped/scaled into the HD edit; further animated diagrams use the local compositor. The supplied JPEG logo and original PROJECT_PLAN.md hashes remain verified.

Caption verification: **443/443 words**, 128 cues, local Whisper-small, **98.9% script/transcript agreement**, exact normalized authored-word coverage. Decode passes; video/audio endpoints differ by **0.021333 seconds**. Sound measurement: **−16.3 LUFS integrated, −1.4 dBFS true peak**. Decoded scene/entrance and beginning/middle/end caption frames were inspected; thick caption outlines and a team-slide text overlap were corrected. The source/claim ledger, editable timeline, clean master and receipts are preserved locally; see `video/README.md` and PITCH_VIDEO_PRODUCTION.md. Individual member names, exact challenge enrollment and local submission rules remain unspecified. NASA/local agronomic integration and measured outcomes are explicitly planned, not presented as complete.

## Authoritative scope

Latest steering: Abid requested the farm-first sequence with only passing crop suggestions, assigned mock timing and no overlap, followed by calendar tracking. **Mock data only, no real data APIs** remains authoritative. Read [PROJECT_DESCRIPTION_AUDIT.md](PROJECT_DESCRIPTION_AUDIT.md) for the complete feature mapping and mock-rule boundaries.

Abid requested a Next.js agriculture concept preview before October 7, with later NASA-data integration. This supersedes the earlier preparation-only boundary in ABID_PRE_EVENT.md. Preserve PROJECT_PLAN.md verbatim. Do not present fictional calendars as local recommendations. Do not invent observations, water savings, yield, soil-health outcomes or NASA compliance. Do not commit/push/publish without a request. Keep the existing local preview available.

User requirements across this conversation:

| ID  | Requirement                                                      | Acceptance and current state                                                                                                                                          |
| --- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R01 | Next.js, practical farm rotation preview                         | Five app screens plus home redirect; optimized build passed October 4                                                                                                 |
| R02 | One farm, three seasons, three options                           | Up to three passing generated rotations; locked crop-specific March–February windows and rest                                                                         |
| R03 | Readable text, farmer-friendly colors and layout                 | 20px base, optional 24px, high contrast, expandable details; real farmer validation remains open                                                                      |
| R04 | Organized, easy exploration with minimal congestion              | Farm → screened crop choices → calendar → tracking; reasons/scenarios/3D are secondary                                                                                |
| R05 | Practical interactive Three.js                                   | Demand rendering, camera controls, crop study/cutaway, source limits, non-WebGL fallback                                                                              |
| R06 | First-visit and section tours, all options                       | 28-step full tour and six section replays; every scope checked in four configurations                                                                                 |
| R07 | Smooth focus travel and streamed text                            | 900ms travel, bounded whole-word reveal, instant text and reduced motion; preserve during repair                                                                      |
| R08 | No target hidden under instructions                              | Fixed: desktop guide rail / smaller-screen bottom dock, non-overlapping spotlights and target navigation; selection CTA checked                                       |
| R09 | Spotlight explains the actual section                            | Fixed: calendar months and crop rows, actual rendered field; arrows explore larger sections and wide calendars                                                        |
| R10 | Engaging farm ambience                                           | Original optional morning/evening wind and bird-like/insect-like synthesis; no scientific performance benefit claimed                                                 |
| R11 | Sound level and off controls                                     | Reading & sound: Play, Stop, 0–100% master level, Mute all and independent clicks; persisted settings, no ambient autoplay                                            |
| R12 | Interesting farm mascot guides tours                             | Mati / মাটি, original duck illustration; finite greeting and interactive wave, reduced-motion support                                                                 |
| R13 | Many relevant crops                                              | 42 sourced crop identities plus rest; read-only search/filter/details, 12 mock rule/window records; 37 additional anatomies and taxonomy remain unreviewed            |
| R14 | English and Bangla                                               | Existing languages; include new controls/catalogue; terminology review with team remains open                                                                         |
| R15 | Authentic online research before fixes                           | Evidence audit and primary-source links; distinguish scientific evidence, standards and design tuning                                                                 |
| R16 | NASA challenge alignment                                         | Published Field Shift summary aligns with concept; observations/local rules/full brief still outstanding                                                              |
| R17 | Test every functionality logically and visually                  | Build an explicit feature/viewport/language/motion matrix. Test outcomes, overlap, meaningful focus and real browser behavior; do not promise exhaustive bug freedom  |
| R18 | Safe persistence/reset and missing values                        | Existing validation, storage warning, confirmation; preserve and test new settings/crops                                                                              |
| R19 | Durable checklist and detailed continuation records              | This file plus evidence audit, QA matrix/results and integration handoff                                                                                              |
| R20 | Preserve project and team work                                   | Preview verification preceded Git writes; Abid subsequently authorized committing and pushing only to the exact branch `Swakkhar`                                     |
| R21 | Implement the supplied real-product description as a demo        | Requirement mapping in PROJECT_DESCRIPTION_AUDIT.md; real observations/validated advice remain future work                                                            |
| R22 | No real data APIs; mock data only                                | Local climate fixtures and 12 explicitly invented crop rules; no remote provider                                                                                      |
| R23 | Preferred crops, screening, generated rotations and explanations | Passing windows among 12 mock records are selectable; strict generator refuses missing/unknown/conflicting combinations; seven mock checks separated from real checks |
| R24 | Scenario simulator                                               | Saved/draft comparison, immediate recalculation, Reset and explicit Apply; shortage/climate/priority controls                                                         |
| R25 | White main content; dark green left/top                          | White planning surfaces and neutral secondary panels; corrected mobile navigation contrast                                                                            |
| R26 | Bring 3D back and make it easy to find                           | Existing source-informed schematic models retained; prominent entry and independent study selector, no calendar mutation                                              |

## Historical mock-description extension — October 4, before farm-first workflow

- [x] Audit every supplied description requirement against the existing implementation and record the future real-data boundary.
- [x] Add local climate/location fixtures, preferences and mock crop screening; never present an invented observation as NASA data.
- [x] Generate complete preferred-only three-slot candidates; preserve missing/unknown inputs and actual entry conflicts.
- [x] Rank actual calendar/household/help conflicts ahead of fictional priorities. A unit test found and fixed this ordering defect.
- [x] Connect generated candidates to selection, calendars, field view, reasons and versioned storage.
- [x] Add saved-versus-draft scenarios with Reset and explicit Apply, plus four local help dialogs.
- [x] Change main body/cards to white and navigation to dark green. Axe exposed mobile tiles inheriting a pale background; corrected their background.
- [x] Keep original 3D models and add independent crop study even in rest months, including correct model-source dialog identity.
- [x] Extend all tours and verify that touring never enables generated mode or changes saved farm inputs.
- [x] Fix scenario/builder/environment links to reopen matching disclosures on hash navigation and reload. The earlier complete run caught the mobile reload defect.
- [x] Review all 196 captures through 20 contact sheets, plus individual new-feature screenshots.
- [x] Record the final complete regression, optimized build and production extension results in PREVIEW_VERIFICATION.md before closing work: **72 unit cases, 88 browser cases, 196 reviewed tour visits, 75 optimized animated tour visits**, optimized mock flow/help/3D and mascot checks passed. Lint, formatting, strict TypeScript/build and diff whitespace check passed; original plan hash preserved.

Current source changes for this extension are local on `Swakkhar`; the earlier pushed baseline is `1ea91bcd5bad3f6095453e6f8891821313f2e3ee`. Do not infer another commit/push from that completed one-time handoff. Follow-up instruction: Abid requested using `public/Ritu_Logo.jpeg` as the project logo. The original JPEG now supplies the desktop/mobile home brand and browser icon; its embedded Bangla wordmark is preserved with no cropping or recoloring.

Historical QA artifacts: `research/demo-final-regression/` archives the closing 88-case run; `research/demo-tour-contact-sheets/` contains the 20 reviewed sheets; `research/demo-final-production/` contains the white overview and mock-flow views. `scripts/verify-demo-production.mjs` reproduces the optimized extension flow and asserts no external requests. Final production tour captures are in `research/final-production/` (now 25 steps per configuration). These ignored artifacts do not ship; the documentation is the durable record.

Logo follow-up verification: actual image loads through Next.js optimization, preserves intrinsic aspect ratio, and has an accessible home link in both languages. Desktop and 320×800 Bangla captures were visually reviewed; no mobile document overflow or browser errors. Browser icon resolves to the supplied JPEG. Optimized build/strict TypeScript, changed-file ESLint, formatting and diff whitespace checks passed. No new unit tests were added for this visual-only change. The isolated `ritu-logo` QA browser was closed; development preview remains available.

## Completed implementation — October 3–4 follow-up

- [x] Inspected both supplied screenshots and current tour code. Confirmed placement falls back to overlapping bottom/right and target selector highlights only `.board-heading`.
- [x] Read installed Next.js `use client` documentation and browser skill. Memory registry has no Ritu entry; current workspace is authoritative.
- [x] Reviewed W3C unobscured-focus/audio-control and MDN Web Audio guidance; located BARC crop zoning and FAO Bangladesh crop diversification sources.
- [x] Repair tour placement by reserving guide space and highlight useful content rather than clipping a rectangle into an arbitrary strip.
- [x] Add mascot and finite expressive motion.
- [x] Add farm ambience, master mute and volume, lifecycle handling and failure messages.
- [x] Expand/search/filter crop catalogue; integrate with calendar/editor/details/storage; distinguish supported anatomy from unavailable models.
- [x] Update all tour scopes and test every step in both languages, small/large/desktop viewports, normal/reduced motion and text settings.
- [x] Verify target/card non-overlap, meaningful visible target area, unobscured buttons and smooth intermediate behavior.
- [x] Exercise sound controls, mute/zero/visibility/background/blocked playback/persistence in Chromium.
- [x] Verify all crop records, calendar editing, details, evidence links, unsupported model fallback and persistence.
- [x] Run domain, browser, accessibility, lint, typecheck, formatting and production checks; exact latest outcomes in PREVIEW_VERIFICATION.md.
- [x] Inspect all 156 tour screenshots using 16 contact sheets; individually inspect cramped phone layouts and optimized WebGL/sound/crop captures.
- [x] Update this record, README, evidence audit and verification documentation.
- [x] Repair crop-dialog positioning found during production screenshot review: exclude dialogs from disclosure padding/margin rules; add bounds/centering checks for every crop on both browser projects.

## Historical verification — before mock-description extension

65 Vitest cases passed. The complete browser suite passed all 78 cases. Tour layout coverage includes 39 visits in each of four viewport/language/motion settings (156 visits). The final optimized rebuild passed three animated 20-step tours at 1440×1000 English, 320×800 Bangla and 320×800 extra-large Bangla, plus real WebGL cutaway, centered crop dialog/source links and audio controls. Additional optimized-app checks verified Mati's finite keyboard wave and reduced-motion behavior at 1440px and 320px. See PREVIEW_VERIFICATION.md for exact coverage and limits.

An earlier full run passed 77 cases and failed one Escape-during-travel test: Playwright route waiting outlasted the transition. The test now starts a same-page transition, observes the busy state, then presses Escape. Both affected variants passed, followed by **one complete final 78-test pass (4.6 minutes)** after the crop-dialog CSS repair. The final optimized rebuild also passed compilation, strict TypeScript and all three routes; lint and formatting passed.

No build, browser test or source citation establishes agricultural suitability, full accessibility or universal bug freedom. Additional entries have no reviewed taxonomy/anatomy and never use a substitute potato model. The source crop list is not a NASA-prescribed or Rajshahi-recommended list.

## Prior verified baseline and known limitations

Before this follow-up, 64 Chromium desktop/emulated-phone tests, 20 domain tests, lint, strict TypeScript and build passed. Three full production tours (1440px English, 320px Bangla at both text settings) passed card bounds and Next-button bounds. **Those checks were insufficient:** target/card overlap and useful spotlight content were not tested. Do not cite them as proof of the reported tour behavior.

Agronomic water, drainage and soil checks always remain unknown, even with supplied input. Household checks cover crop-group presence, not quantities. Labor checks cover sample first/last months, not real labor demand. Family counts describe taxonomy, not soil benefits. NASA products are already publicly available; October 28 is identified on official event listings as full-challenge release, not data availability. No real data is integrated.

Automated accessibility checks do not equal full WCAG conformance. Chromium emulation does not establish Safari/Firefox/physical-device behavior. No farmer study, actual speaker/headphone calibration or agricultural Bangla review has occurred. Any new soundscape is an optional experience feature, not a scientific observation or proven cognitive benefit.

## Continuation map

- `src/components/tour-guide.tsx`, `src/components/farm-guide.tsx`, `src/data/tours.ts`: scope, targets, routing, motion, placement, Mati and guide controls.
- `src/components/reading-controls.tsx`, `src/lib/display-store.ts`, `src/lib/farm-audio.ts`: reading/motion/audio preferences, synthesis and lifecycle; versioned device storage.
- `src/data/preview.ts`, `src/data/crop-catalogue.ts`, `src/components/crop-catalogue.tsx`, `src/domain/types.ts`, `src/domain/evaluate.ts`: fixtures, sources, catalogue, crop types and entry checks.
- `src/components/farm-view.tsx`, `journey-views.tsx`, `compare-view.tsx`: farm-first flow, passing choices, save/replacement and tracking. `src/lib/journey-store.ts`: validated review/generation and saved records. `calendar.tsx`, `season-explorer.tsx`: locked timeline and field inspection.
- `src/data/demo-environment.ts`, `src/domain/demo-planner.ts`, `src/lib/demo-store.ts`, `src/components/demo-planning.tsx`: authored fixtures, fictional generation/ranking, mock storage, section hash reopening, help and draft scenarios.
- `src/components/crop-geometry.ts`, `field-scene.ts`, `src/data/crop-models.ts`: schematic anatomy and GPU lifecycle.
- `tests/e2e/`, `src/**/*.test.ts`: reproducible regression tests.
- `docs/EVIDENCE_AND_USABILITY_AUDIT.md`: claims, primary sources, NASA coverage and farmer-study limits.
- `docs/DATA_INTEGRATION.md`: future provenance and reviewed-rule contract.
- `docs/PREVIEW_VERIFICATION.md`: exact latest results; supersede stale counts after changes.
- `docs/QA_MATRIX.md`, `docs/CROP_CATALOGUE.md`: coverage matrix, crop-source scope and outstanding taxonomy/anatomy.
- `scripts/review-tours.mjs`, `scripts/verify-production.mjs`, `scripts/verify-demo-production.mjs`, `scripts/verify-mascot.mjs`: local contact-sheet generation, optimized runtime/demo and mascot checks. Browser suites replace test-results; archive captures before rerunning.
- `research/`: ignored screenshots, scripts and transient QA artifacts; never assume these ship with Git.

Run tools using Node's bundled npm if the Windows npm shim is unavailable. Existing QA browser session is isolated from the user's browser. Do not restart unrelated apps. Record owned server sessions/ports before stopping them. Only record completed checks after seeing their actual results.

Preview verification closing state: the owned development preview remains at `http://127.0.0.1:3000` (session 35450 for this run only); the temporary optimized QA server at 3004 and isolated `ritu-science` browser are closed after verification. Session identifiers are not durable and must be rediscovered. Next 16.3.8 uses `.next/dev` for development output; inspect the installed version before assuming builds share that isolation. Git handoff authorization is recorded below. The final tour captures are archived in ignored `research/tour-review-20261004-final/`, and earlier reviewed contact sheets are in `research/tour-contact-sheets/`.

## Latest Git authorization — October 4, main

After the completed pitch delivery, Abid explicitly requested **commit and push the whole project to main**. This supersedes the earlier instruction to leave main unchanged. The remote was verified to contain only `Swakkhar` at `08961d0`; create `main` from the current project history, commit the pending farm/reset/spacing fixes, documentation and video production source, and push without force. Preserve `Swakkhar`. Existing ignore rules exclude dependencies, secrets, build/test caches, local research and generated video outputs; the MP4/SRT/editable ZIP remain in `video/output/` locally. Video-specific lint overrides distinguish native Higgsedit JSX and the Node CJS capture entry point from the React application. Verify the resulting remote main commit and worktree after the push.

## Earlier authorized Git handoff — October 4

After preview verification, Abid explicitly requested: commit and push on a different branch, named **Swakkhar**, rather than main. The remote is `https://github.com/alve775/Ritu.git`; remote inspection returned no existing refs and the local main branch had no commits. Use the exact branch name, push with upstream tracking, and verify the remote commit matches local HEAD. Do not create or update main, force-push, publish hosting or open/merge a pull request under this instruction. Dependencies, build output, environment files, research captures and browser traces remain excluded. The outgoing-file secret-pattern scan found no matches; that scan is not a universal secret-detection guarantee. Inspect `git status`, `git log` and `git ls-remote` to obtain the actual current handoff result.

## External work still required

The current application uses real source integrations. Remaining work below concerns additional releases, local agricultural evidence and field evaluation.

- [ ] Review the full 2026 challenge brief/resources when published and confirm applicable preparation/submission rules with organizers.
- [x] Integrate NASA POWER climate and Open-Meteo weather with source links, coordinates, timestamps and units.
- [ ] Evaluate additional NASA products against the released challenge resources, retaining product/version, time/grid footprint, quality and processing provenance.
- [ ] Obtain locally reviewed planting windows, crop characteristics, soil/irrigation/drainage rules and method validation.
- [ ] Observe intended Rajshahi farmers on their actual phones and revise from real feedback.
- [ ] Review Bangla terms and physical-device visibility, audio and GPU behavior.
- [ ] Team decisions: licensing, hosting, official registrations and repository workflow.

Latest publication follow-up: [Common names](COMMON_NAMES_2026-11-02.md). Commit/push to main authorized for the complete project. Current follow-up: 499 unit/API tests, 20 browser cases and production build passed.

Rotation branch, 7 November: persistent plots (`src/domain/plot.ts`) record last year's crop per season, start/end dates and `madeFrom` parents; older saved data loads unchanged. 595 unit tests, lint on changed files and typecheck passed. No UI yet.
Rotation branch, 7 November: plot setup screen at `/plot` (name, size, last year's crop per season as tiles) and a Plots section in each set-up field on the dashboard; `updatePlot` store action. 596 unit tests, typecheck and lint passed; clicked through in a browser in English and Bangla. Production build not run here (Google Fonts unreachable from the test machine).
Rotation branch, 7 November: pilot region = DAE/BAMIS Rajshahi region (Rajshahi, Chapainawabganj, Naogaon, Natore), detected from the field pin with geoBoundaries district boundaries (BBS/OCHA, CC BY 3.0 IGO). Plot tiles inside come from the regional calendars; outside shows a not-ready note. 601 unit tests, typecheck and lint passed; checked in a browser.
Rotation branch, 7 November: the location card and map are unchanged; new fields start with the default Rajshahi pin (24.374 N, 88.601 E, the location-search result, just above the map's city label) already selected; the map opens at zoom 12, which has all four Sacks/SAGE calendar layers for this area, the cached NASA POWER year and DAE/BAMIS region coverage. 601 unit tests, typecheck and lint passed.
Rotation branch, 7 November: a pin placed on the map, by GPS or by coordinates now shows its area name (OpenStreetMap Nominatim reverse lookup via /api/places/reverse, coordinates rounded to ~110 m, cached 7 days, English/Bangla). The generic "My pinned field" label stays if the lookup fails. 607 unit tests, typecheck and lint passed; checked on the running app in both languages.
Rotation branch, 7 November: SoilGrids pH loads automatically when the pin is set and shows in the collapsed line ("Soil pH: 7.2 · SoilGrids estimate · 5-15 cm"); the farmer's own soil test is labelled "Enter your own soil test pH · optional". Soil texture is still farmer-entered (not loaded). 607 unit tests, typecheck and lint passed.
Rotation branch, 7 November: soil texture is pre-filled from SoilGrids median clay/sand/silt (5-15 cm, scaled to 100%, USDA triangle -> Sandy/Loam/Clay) unless the farmer chose one; one "Soil pH" card shows "From data" (SoilGrids) and the farmer's own test; both use the nearest predicted 250 m cell within 2 km when the pin's cell has none (e.g. Rajshahi city centre, 1.1 km). Near Rajshahi this gives Clay (about 50% clay). 617 unit tests, typecheck and lint passed.
Rotation branch, 7 November: Soil pH card made minimal: "From data: 6.7 · likely between 5.1 and 8.1 · nearest data 1.1 km away" plus a one-line ISRIC SoilGrids CC BY 4.0 credit; depth fixed at 5-15 cm (no selector, raw links, date or refresh button). e2e soil specs updated to match (not run here). 617 unit tests, typecheck and lint passed.
Rotation branch, 7 November: "Show suggested crops" now opens a "What did you grow here last year?" popup (same season tiles as the plot page, region crops inside the Rajshahi region); all three seasons must be answered (Left empty / Not sure allowed). Saved as Farm.lastYear on the draft and the field profile. 618 unit tests, typecheck and lint passed; clicked through on the running app.
- 2026-11-07: Land → Plot → Crops restructure. Land page saves land only ("Save land" → Add a plot). Plot form: name, size, ready-to-plant date, "Show suggested crops" opens the last-year popup, then /crops; new crops carry plotId. Dashboard rebuilt as one prominent box per land (facts chips, area-in-plots bar, plot tiles with last year + current crop + calendar link, dashed "Add a plot" tile); count form and "Add a farm" removed. Navigation is 3 steps (Dashboard · Suggested crops · Crop calendar); "farm" wording replaced by land/plot/crop in EN and BN. Unit tests 618/618; e2e specs still script the old flow and need updating.
- 2026-11-07: Plot form layout fixed: name, size and date controls share one 48px row height (grid rows label/control/help), help text muted; Bangla numbers on the plot page and dashboard use Bengali digits (localDigits). 619 unit tests passed.
- 2026-11-07: Bangla font changed to Noto Sans Bengali (body and headings). Only its Bengali subset is loaded and it comes first in the font stacks, so English keeps Hind Siliguri / Anek Bangla Latin letters. New --font-heading token replaces direct var(--font-display) uses. 619 unit tests passed.
- 2026-11-07: Year plans (rotation). New src/data/rotation-crops.ts (10 Rajshahi crops, windows, FAO-56 Kc, heat limits, soil fit, 10 patterns) and src/domain/rotation (Bangla calendar, Hargreaves ET0, weekly water/heat per crop, timing check, intensity levels, verdicts, plan suggestions, pump hours) with tests. NASA climatology now also fetches T2M_RANGE (average daily max/min = mean ± range/2; POWER's climatology T2M_MAX/MIN are extremes) and GWETTOP. Plot.plan + SeasonFarm.rotationSeason saved and validated. /crops shows Plan A (last year) + two suggestions, and a choose-myself builder with rated crop cards; choosing creates the first crop's calendar. Dashboard plot tile shows Now/Next/Then; /plan shows the year wheel, this-week card, week grid, week detail and a detailed chart. Single-crop list kept behind a link. 632 unit tests, typecheck, lint pass; clicked through EN and BN on the running app.
