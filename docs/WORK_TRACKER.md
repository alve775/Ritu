# Ritu working record and acceptance checklist

Owner: Abid Al Hossain Swakkhar. Team: three web developers in Rajshahi. Workspace: `E:\001_RITU`; repository: https://github.com/alve775/Ritu. Updated October 4, 2026. This is the continuation entry point: read it before resuming work, then verify files and runtime rather than assuming a recorded result still applies.

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
| R13 | Many relevant crops                                              | 43 sourced crop identities plus rest; read-only search/filter/details, 13 mock rule/window records; 38 additional anatomies and taxonomy remain unreviewed            |
| R14 | English and Bangla                                               | Existing languages; include new controls/catalogue; terminology review with team remains open                                                                         |
| R15 | Authentic online research before fixes                           | Evidence audit and primary-source links; distinguish scientific evidence, standards and design tuning                                                                 |
| R16 | NASA challenge alignment                                         | Published Field Shift summary aligns with concept; observations/local rules/full brief still outstanding                                                              |
| R17 | Test every functionality logically and visually                  | Build an explicit feature/viewport/language/motion matrix. Test outcomes, overlap, meaningful focus and real browser behavior; do not promise exhaustive bug freedom  |
| R18 | Safe persistence/reset and missing values                        | Existing validation, storage warning, confirmation; preserve and test new settings/crops                                                                              |
| R19 | Durable checklist and detailed continuation records              | This file plus evidence audit, QA matrix/results and integration handoff                                                                                              |
| R20 | Preserve project and team work                                   | Preview verification preceded Git writes; Abid subsequently authorized committing and pushing only to the exact branch `Swakkhar`                                     |
| R21 | Implement the supplied real-product description as a demo        | Requirement mapping in PROJECT_DESCRIPTION_AUDIT.md; real observations/validated advice remain future work                                                            |
| R22 | No real data APIs; mock data only                                | Local climate fixtures and 13 explicitly invented crop rules; no remote provider                                                                                      |
| R23 | Preferred crops, screening, generated rotations and explanations | Passing windows among 13 mock records are selectable; strict generator refuses missing/unknown/conflicting combinations; seven mock checks separated from real checks |
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

Real data/rule work below remains future work under the mock-only instruction; it is not a current-turn blocker.

- [ ] Review the full 2026 challenge brief/resources when published and confirm applicable preparation/submission rules with organizers.
- [ ] Integrate NASA observations with product/version, units, time/grid footprint, quality and processing provenance.
- [ ] Obtain locally reviewed planting windows, crop characteristics, soil/irrigation/drainage rules and method validation.
- [ ] Observe intended Rajshahi farmers on their actual phones and revise from real feedback.
- [ ] Review Bangla terms and physical-device visibility, audio and GPU behavior.
- [ ] Team decisions: licensing, hosting, official registrations and repository workflow.
