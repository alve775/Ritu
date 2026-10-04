# Concept preview verification — October 4, 2026

Verified locally on Windows with Node 22.13.1, Next.js 16.3.8, React 19.3.0 and TypeScript 6.0.3. Versions are pinned in the lockfile. These results establish tested software behavior, not validated agricultural advice or universal bug freedom.

## Latest checks

| Check | Observed result |
| --- | --- |
| Vitest domain, stored-data, seasonal activities and geometry | **65 tests passed** across four files |
| Playwright Chromium desktop and emulated phone | **78 tests passed in one complete final run (4.6 minutes)** after the crop-dialog CSS repair and Escape timing-test correction |
| Every tour scope | 20 full-tour steps plus 19 section-tour steps in each of four configurations: **156 screenshot-backed visits** |
| Visual review | All 16 contact sheets reviewed, covering all 156 visits; individual narrow Bangla soil/calendar/evidence, selection CTA, sound, crop and potato cutaway captures inspected |
| Axe accessibility scans | No violations in tested core screens, expanded form/evidence, crop/model/data dialogs, reading/sound settings and tours; this is not full WCAG conformance |
| ESLint | Passed with no warnings after the final CSS repair and added dialog bounds assertions |
| Strict TypeScript and optimized Next.js build | Final rebuild passed compilation, type checking and prerendering `/`, `/farm`, `/insights` |
| Formatting | Final source/tests/config check passed |
| Optimized runtime | Final rebuilt app passed three animated 20-step tours at 1440×1000 English, 320×800 Bangla 20px and 320×800 Bangla 24px; **60 visits**, zero guide/spotlight overlap and no page errors. Actual WebGL cutaway, centered crop dialog/reference and playback/scene/mute passed |
| Mati interaction | Additional optimized-app checks passed keyboard-triggered 800ms single-iteration waves, no ongoing wing animation after settling, and no wave under reduced motion at 1440px and 320px |
| Original plan | Unchanged SHA-256: `46DE5AC2463D3CEFAFBF4E4537B1B16B7499A9B9B23062A5DFDE3678F184719A` |

The earlier Escape failure was a test timing race: Playwright's navigation waiting could outlast the animation under test. The test now initiates a same-page transition, observes its busy state and presses Escape during travel. Both desktop and phone variants passed without an application change. Production screenshot review subsequently found a crop dialog inheriting disclosure padding and zero margins. The disclosure rules now exclude dialogs; every crop's dialog is checked for centering, viewport width and visible close controls.

## Coverage that addresses the reported defects

Tour placement reserves a 404px desktop guide rail at widths of 1200px and above; smaller screens use a bottom dock capped at half the viewport height. The spotlight is confined to the remaining visible page area. The calendar target includes actual months and crop rows, and the camera target includes the rendered field. Guide arrows move within long sections or pan a wide calendar. The selection action is checked separately, rather than inferring visibility from a nonzero rectangle.

All five scopes run in these configurations: 1440×1000 English/20px/reduced motion; 1000×1000 Bangla/24px/normal motion; 412×1000 English/20px/reduced motion; 320×1000 Bangla/24px/normal motion. Each visit checks card and Next bounds, zero card/spotlight intersection, a useful visible target area, calendar content and section navigation. Small contact sheets establish placement and consistency; individual captures are needed for typography assessment. Shorter 320×800 production checks supplement this matrix.

Normal-motion cases observe intermediate scroll, spotlight travel and instruction opacity, guard repeated Next presses, cancel travel with Escape and change reduced-motion preference while moving. Word streaming preserves final layout, exposes the full text once to assistive technology and supports an instant-text control. The OS reduced-motion preference overrides the application setting. Mati's greeting and click wave are finite and obey that preference. These checks do not establish subjective comfort, frame-rate targets or device performance.

## Planning, crops and field explorer

Core flows exercise saved farm inputs, unknown values, household crop-group and help-month conflicts, selected options across routes, recurring-year boundaries, overlaps/gaps, add/remove/edit/reset, Bangla persistence, storage failure and corrupt data. Irrigation, soil and drainage suitability remain unassessed even when inputs are supplied. A saved selection is never a farming recommendation.

The catalogue contains **43 named crop entries plus rest**, with English/Bangla search, category filters, pagination and empty results. Browser checks inspect all 43 dialogs and select all 44 IDs in the calendar editor. Adding a crop requires the user's start month and duration; nothing supplies an inferred planting window. A Maize addition persists, selects the current calendar and asks the user to review conflicts. Domain checks cover every ID and missing-data behavior. Source references establish only crop identities/groups; the added 38 entries have unreviewed taxonomy and no anatomy models. They are excluded from reviewed-family counts. Periods longer than 12 months require a future multi-year planner.

Real WebGL checks cover field/close-up/cutaway, camera movement/reset, drag, synchronized months, source dialogs, reopening without duplicate canvases, context-loss recovery and no-WebGL fallback. Unsupported crops render no substitute plant. Rice, wheat, mung bean and potato anatomy is source-informed schematic geometry; young/mature study choices are independent of calendar timing. Draw instrumentation verifies intermediate camera frames and no continued draws after settling, including a motion-preference change. This is not a physical-device GPU or energy benchmark.

## Reading and sounds

The first comparison screen exposes three choices; calendars, additional farm inputs, catalogue, evidence and 3D are optional disclosures. Default body text is 20px at a normal browser base; extra-large is 24px. Reading settings persist independently of planner inputs. Bangla core screens are also checked at 320px with a 250% root font and user line/paragraph/letter/word spacing, without document overflow or clipped core labels. Expanded optional content has separate accessibility checks. These results do not cover every combination of browser zoom and user styles.

Farm ambience uses original synthesized wind and bird-like morning or insect-like evening calls. It is not a recording, species-accurate simulation or proven cognitive benefit. **Reading & sound** offers Play, Stop, scene selection, a 0–100% master level, Mute all and independent optional click feedback. Ambience is off by default and never starts automatically after reload.

Browser instrumentation verifies no AudioContext before opt-in, a nonzero real waveform during playback, graph cleanup on scene change/zero/mute, finite 65ms click tones, no more tones after mute, persisted settings without autoplay, denied-playback status, and simulated hidden-tab pause/resume only when playback was requested. Hardware audio output was not listened to or loudness-calibrated. Volume percentages are digital gain settings, not sound-pressure measurements.

## Reproduce and continue

1. Install the lockfile dependencies with `npm ci`; start the local preview with `npm run dev`.
2. Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run format:check` and `npm run test:browser`. Playwright's config reuses a local server at port 3000.
3. Archive `test-results/` before another browser run; never run two suites concurrently into that directory. `scripts/review-tours.mjs` generates contact sheets from the archived local tour captures.
4. Build with `npm run build`, start an owned QA server, then run `node scripts/verify-production.mjs http://127.0.0.1:3004` and `node scripts/verify-mascot.mjs http://127.0.0.1:3004`. Do not assume a server session is still alive from a document.
5. Read [WORK_TRACKER.md](WORK_TRACKER.md), [QA_MATRIX.md](QA_MATRIX.md), [CROP_CATALOGUE.md](CROP_CATALOGUE.md) and the [evidence audit](EVIDENCE_AND_USABILITY_AUDIT.md) before changing scope or claims.

Screenshots in ignored `research/tour-review-20261004/`, `research/tour-contact-sheets/` and `research/final-production/` are local evidence, not shipped assets. The final 78-test run's 156 tour captures are also archived in `research/tour-review-20261004-final/`; the previously reviewed sheets remain valid for tour placement because the last CSS repair affects only native crop dialogs. The Markdown record remains the durable handoff when those files are absent.

## Remaining validation

Safari, Firefox, physical devices, screen readers, sunlight readability, actual speaker/headphone listening and farmer usability have not been tested. The team should review agricultural Bangla. No NASA observations, locally validated crop rules, forecasts, yield/water savings or real farmer records are integrated. The full challenge brief and submission rules still need review. See the [NASA coverage table](EVIDENCE_AND_USABILITY_AUDIT.md) and [integration contract](DATA_INTEGRATION.md).

CI is authored but has not run on GitHub. Public hosting is not configured. These preview checks completed before the first commit/push; Abid subsequently authorized the `Swakkhar` branch handoff recorded in WORK_TRACKER.md. Hosting publication is not authorized by that Git request. Before October 7, the team should test the preview on its own machines, review language/source limits, agree on licensing/hosting/repository workflow and observe intended Rajshahi users on their own phones. Do not substitute automated passes for that feedback.
