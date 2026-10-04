# Ritu working record and acceptance checklist

Owner: Abid Al Hossain Swakkhar. Team: three web developers in Rajshahi. Workspace: `E:\001_RITU`; repository: https://github.com/alve775/Ritu. Updated October 4, 2026. This is the continuation entry point: read it before resuming work, then verify files and runtime rather than assuming a recorded result still applies.

## Authoritative scope

Abid requested a Next.js agriculture concept preview before October 7, with later NASA-data integration. This supersedes the earlier preparation-only boundary in ABID_PRE_EVENT.md. Preserve PROJECT_PLAN.md verbatim. Do not present fictional calendars as local recommendations. Do not invent observations, water savings, yield, soil-health outcomes or NASA compliance. Do not commit/push/publish without a request. Keep the existing local preview available.

User requirements across this conversation:

| ID | Requirement | Acceptance and current state |
| --- | --- | --- |
| R01 | Next.js, practical farm rotation preview | Three routes; optimized build passed October 4 |
| R02 | One farm, three seasons, three options | Fictional example rotations, editable baseline and recurring March–February calendar |
| R03 | Readable text, farmer-friendly colors and layout | 20px base, optional 24px, high contrast, expandable details; real farmer validation remains open |
| R04 | Organized, easy exploration with minimal congestion | Farm → comparison → reasons; optional calendars, secondary inputs and 3D |
| R05 | Practical interactive Three.js | Demand rendering, camera controls, crop study/cutaway, source limits, non-WebGL fallback |
| R06 | First-visit and section tours, all options | 20-step full tour and four section replays; every scope checked in four configurations |
| R07 | Smooth focus travel and streamed text | 900ms travel, bounded whole-word reveal, instant text and reduced motion; preserve during repair |
| R08 | No target hidden under instructions | Fixed: desktop guide rail / smaller-screen bottom dock, non-overlapping spotlights and target navigation; selection CTA checked |
| R09 | Spotlight explains the actual section | Fixed: calendar months and crop rows, actual rendered field; arrows explore larger sections and wide calendars |
| R10 | Engaging farm ambience | Original optional morning/evening wind and bird-like/insect-like synthesis; no scientific performance benefit claimed |
| R11 | Sound level and off controls | Reading & sound: Play, Stop, 0–100% master level, Mute all and independent clicks; persisted settings, no ambient autoplay |
| R12 | Interesting farm mascot guides tours | Mati / মাটি, original duck illustration; finite greeting and interactive wave, reduced-motion support |
| R13 | Many relevant crops | 43 sourced crop identities plus rest; search/filter/pagination/details/editor; explicit user dates; 38 added anatomies and taxonomy remain unreviewed |
| R14 | English and Bangla | Existing languages; include new controls/catalogue; terminology review with team remains open |
| R15 | Authentic online research before fixes | Evidence audit and primary-source links; distinguish scientific evidence, standards and design tuning |
| R16 | NASA challenge alignment | Published Field Shift summary aligns with concept; observations/local rules/full brief still outstanding |
| R17 | Test every functionality logically and visually | Build an explicit feature/viewport/language/motion matrix. Test outcomes, overlap, meaningful focus and real browser behavior; do not promise exhaustive bug freedom |
| R18 | Safe persistence/reset and missing values | Existing validation, storage warning, confirmation; preserve and test new settings/crops |
| R19 | Durable checklist and detailed continuation records | This file plus evidence audit, QA matrix/results and integration handoff |
| R20 | Preserve project and team work | Preview verification preceded Git writes; Abid subsequently authorized committing and pushing only to the exact branch `Swakkhar` |

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

## Final verification record

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
- `src/components/farm-view.tsx`, `calendar.tsx`, `season-explorer.tsx`: editor and calendar/field inspection.
- `src/components/crop-geometry.ts`, `field-scene.ts`, `src/data/crop-models.ts`: schematic anatomy and GPU lifecycle.
- `tests/e2e/`, `src/**/*.test.ts`: reproducible regression tests.
- `docs/EVIDENCE_AND_USABILITY_AUDIT.md`: claims, primary sources, NASA coverage and farmer-study limits.
- `docs/DATA_INTEGRATION.md`: future provenance and reviewed-rule contract.
- `docs/PREVIEW_VERIFICATION.md`: exact latest results; supersede stale counts after changes.
- `docs/QA_MATRIX.md`, `docs/CROP_CATALOGUE.md`: coverage matrix, crop-source scope and outstanding taxonomy/anatomy.
- `scripts/review-tours.mjs`, `scripts/verify-production.mjs`, `scripts/verify-mascot.mjs`: local contact-sheet generation, optimized runtime and mascot checks. Browser suites replace test-results; archive captures before rerunning.
- `research/`: ignored screenshots, scripts and transient QA artifacts; never assume these ship with Git.

Run tools using Node's bundled npm if the Windows npm shim is unavailable. Existing QA browser session is isolated from the user's browser. Do not restart unrelated apps. Record owned server sessions/ports before stopping them. Only record completed checks after seeing their actual results.

Preview verification closing state: the owned development preview remains at `http://127.0.0.1:3000` (session 35450 for this run only); the temporary optimized QA server at 3004 and isolated `ritu-science` browser are closed after verification. Session identifiers are not durable and must be rediscovered. Next 16.3.8 uses `.next/dev` for development output; inspect the installed version before assuming builds share that isolation. Git handoff authorization is recorded below. The final tour captures are archived in ignored `research/tour-review-20261004-final/`, and earlier reviewed contact sheets are in `research/tour-contact-sheets/`.

## Authorized Git handoff — October 4

After preview verification, Abid explicitly requested: commit and push on a different branch, named **Swakkhar**, rather than main. The remote is `https://github.com/alve775/Ritu.git`; remote inspection returned no existing refs and the local main branch had no commits. Use the exact branch name, push with upstream tracking, and verify the remote commit matches local HEAD. Do not create or update main, force-push, publish hosting or open/merge a pull request under this instruction. Dependencies, build output, environment files, research captures and browser traces remain excluded. The outgoing-file secret-pattern scan found no matches; that scan is not a universal secret-detection guarantee. Inspect `git status`, `git log` and `git ls-remote` to obtain the actual current handoff result.

## External work still required

- [ ] Review the full 2026 challenge brief/resources when published and confirm applicable preparation/submission rules with organizers.
- [ ] Integrate NASA observations with product/version, units, time/grid footprint, quality and processing provenance.
- [ ] Obtain locally reviewed planting windows, crop characteristics, soil/irrigation/drainage rules and method validation.
- [ ] Observe intended Rajshahi farmers on their actual phones and revise from real feedback.
- [ ] Review Bangla terms and physical-device visibility, audio and GPU behavior.
- [ ] Team decisions: licensing, hosting, official registrations and repository workflow.
