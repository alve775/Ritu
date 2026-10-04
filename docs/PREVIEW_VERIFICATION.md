# Concept preview verification — October 4, 2026

Verified locally on Windows with Node 22.13.1, Next.js 16.3.8, React 19.3.0 and TypeScript 6.0.3. Versions are pinned in the lockfile. These results establish tested software behavior, not validated agricultural advice or universal bug freedom.

## Latest checks — strict farm-first journey

The current flow is **Farm → suggested crops → automatic calendar → tracking**. Only windows passing the authored mock soil, drainage, water, climate and available-help checks are selectable. Generation requires all seven checks, including calendar and household consistency, to pass. It returns up to three distinct crop sequences, with assigned dates and explicit rest; it returns no plan for unknown, missing or incompatible conditions. See [JOURNEY_WORKFLOW.md](JOURNEY_WORKFLOW.md) for the timing and persistence contracts.

| Check | Observed result |
| --- | --- |
| Vitest | **76 tests passed across five files**, including 11 mock planner/store cases and a 270-combination constraint matrix |
| Complete Playwright regression | **78 desktop/emulated-phone Chromium tests passed in one final run (5.8 minutes)** after the supported-model tour fixture repair |
| Every tour scope | 28 full-tour + 27 combined section-tour steps per configuration: **220 screenshot-backed visits**, covering all seven scopes in English/Bangla and desktop/phone |
| Visual review | All **24 final tour contact sheets** reviewed; individual optimized 320×800 Bangla/24px soil and rendered-field steps inspected, plus actual workflow, calendar, tracking and crop-study captures |
| Farm-first flow | Review required; initial choices empty; missing water/soil/drainage, invalid area, missing seasons and incompatible household/help constraints prevent progression or generation; no manual date/crop injection |
| Timing safety | Integer positive bounded intervals; no month occupied by two crops; exact twelve-month coverage with explicit rest; three crop periods; alternate valid windows considered; invalid saved calendars rejected |
| Scenario simulator | Draft calculation, Reset without mutation, invalid Apply disabled, valid Apply/reload and stale saved-calendar behavior passed |
| Tracking | Immutable saved snapshot/year; planting before harvest; undo harvest before planting; notes/progress/reload; identical save preserves records; changed save and clear require explicit confirmation |
| Accessibility/readability | Tested axe scans passed, including 320px/24px Bangla; large root-font/user-spacing checks and internally scrolling calendar passed. This is not a full WCAG-conformance or farmer-comfort claim |
| Data boundary | Instrumented optimized journey produced **no external requests or page errors**; mock fixtures remain local and fictional |
| Lint / formatting / build | ESLint, Prettier, strict TypeScript and optimized Next.js compilation/prerendering passed; home redirect plus five app screens and not-found route |
| Optimized runtime | **84 animated full-tour visits passed**: 28 each at 1440×1000 English/20px, 320×800 Bangla/20px and Bangla/24px, with zero guide/spotlight overlap. Actual WebGL cutaway, source dialog, playback/scene/mute and no page errors passed |
| Optimized complete journey | Crop choices, locked plans, all seven explanations, three local help dialogs, strict scenario Reset/Apply/reload, planting/harvest/notes persistence, independent Potato model and 320px Bangla tracking passed |
| Mascot | Optimized keyboard-triggered finite wave and reduced-motion suppression passed at 1440px and 320px; mascot component unchanged by the final supported-model fixture repair |
| Original plan | SHA-256 unchanged: `46DE5AC2463D3CEFAFBF4E4537B1B16B7499A9B9B23062A5DFDE3678F184719A` |

Browser verification found and repaired an early-input hydration race, tour selectors targeting missing or ambiguous elements, unnecessary pan arrows for fully visible sections, and an onboarding prompt during the home redirect. Visual review then found the tutorial starting with an unsupported crop model. Its temporary example now begins with supported Mung bean; every tour's rendered-field step asserts both the ready renderer and that crop title. Tours leave actual farm, review/generation state and tracking unchanged.

The final 78-case captures are archived in ignored `research/journey-verified-regression/`; the 24 reviewed tour sheets and four core-flow sheets are in `research/journey-verified-sheets/`. Current optimized tour captures are in `research/final-production/`; individual journey captures are in `research/journey-production/`. Two closing text corrections remove old manual-date/annual-wrap instructions; **14 focused catalogue/calendar browser cases passed**, followed by a successful final optimized build, ESLint and formatting check. Older results below describe superseded interfaces, not the current manual-editing capability.

Abid subsequently requested committing and pushing these changes to **`Swakkhar`**. The earlier baseline is `1ea91bcd5bad3f6095453e6f8891821313f2e3ee`; confirm the new commit and remote state using Git. The owned production QA server is stopped after verification; the development preview remains at `http://127.0.0.1:3000/farm`.

After these checks, Abid reported that the fifth full-tour step scrolls upward. Tour ordering is a known open issue recorded in WORK_TRACKER.md; the checks above establish placement and functionality, not monotonic page traversal.

The non-overlap guarantee applies to the demo's discrete monthly intervals. Mock dates, suitability checks and scores are invented, not scientifically optimal planting dates. Actual daily durations, turnover buffers, NASA observations and locally reviewed agronomy remain future integration work. Tracking is local to this browser. The five anatomy entries remain source-informed schematic models; no measured growth or field geometry is claimed. Physical-device performance, speaker listening/calibration, Firefox/Safari and real farmer studies remain unverified.

## Historical mock-description extension — before the farm-first journey

User instruction: **mock data only, no real data APIs**. This extension implements the supplied product description as a fictional demonstration. See [PROJECT_DESCRIPTION_AUDIT.md](PROJECT_DESCRIPTION_AUDIT.md) for the requirement mapping and invented-rule boundaries.

| Check | Observed result |
| --- | --- |
| Vitest | **72 tests passed across five files**, including seven mock-engine/store boundary cases |
| Complete Playwright regression | **88 Chromium desktop/emulated-phone tests passed in one complete final run (6.1 minutes)** |
| Every tour scope | 25 full-tour + 24 section-tour steps in each of four configurations: **196 screenshot-backed visits** |
| Visual review | All 20 contact sheets reviewed (196 visits), plus individual new-feature and narrow extra-large Bangla screenshots |
| Mock environment/generation | Location and weather change fixtures; twelve months; preferred-only deterministic candidates; missing-season recovery; selection/reasons/calendar/reload integration |
| Scenario simulator | Saved and draft candidates differ in tested reliable/familiar → severe/water case; Reset leaves farm unchanged; Apply saves and reload preserves shortage |
| Theme/3D | Computed white body and dark green navigation; actual WebGL; independent Potato study during fallow; source dialog identifies Potato while month details still identify fallow |
| Accessibility | No axe violations in tested new flows, including 320px/24px Bangla; twelve-month table scrolls internally without page overflow |
| Data boundary | No external API requests during the instrumented mock environment flow; source modules contain no remote provider |
| ESLint / formatting | Passed; formatting-only correction applied to CompareView after the complete browser run |
| Optimized build | Passed compilation, strict TypeScript and prerendering all three app routes |
| Optimized runtime | **75 animated full-tour visits passed**: 25 each at 1440×1000 English/20px, 320×800 Bangla/20px and Bangla/24px; zero guide/spotlight overlap and no page errors. Real WebGL cutaway, centered crop/source dialog and playback/scene/mute also passed |
| Optimized mock flow | Generation, all four local help dialogs, saved/draft comparison, Apply/reload, six explanations, actual WebGL independent study and 320×800 Bangla/24px reflow passed; **no external requests or page errors** |
| Optimized mascot | Keyboard-triggered finite wave and reduced-motion suppression passed at 1440px and 320px |
| Original plan | SHA-256 unchanged: `46DE5AC2463D3CEFAFBF4E4537B1B16B7499A9B9B23062A5DFDE3678F184719A` |

Three defects were found and repaired during this extension: ranking could put a household conflict behind a mock priority; mobile navigation inherited pale tiles under white labels; after Apply/reload, a scenario hash link could leave its disclosure closed. Unit coverage now requires entered constraints to rank first; CSS restores dark mobile tiles; matching hash disclosure sections reopen on mount and hash changes. The earlier full run returned 85 passes/one mobile failure before that disclosure repair. Ten focused new-feature cases then passed, followed by the complete 88-case pass above.

The 196 reviewed captures were archived before the final hash-opening fix. That fix does not change guide placement; the closing regression independently repeated all 196 tour visits and also checks that touring never enables mock generation. Local captures are in `research/tour-review-demo-20261004/`, `research/demo-tour-contact-sheets/`, `research/demo-final-focused/` and `research/demo-final-regression/`. Individual optimized short-phone calendar/builder/scenario/field steps, white overview, Bangla scenario and Potato cutaway were inspected in `research/final-production/` and `research/demo-final-production/`.

Mock water/drought indices, temperature intervals, season membership, texture preferences and rainfall credits are invented software fixtures. They establish no agricultural suitability, water savings, soil benefit, forecast or NASA-data integration. Original real-world water/soil/drainage checks remain unknown. The five supported crop entries retain source-informed **schematic** models; no measured growth/cultivar accuracy or substitute anatomy is claimed. Chromium emulation and axe passes do not establish farmer comfort, full accessibility or universal bug freedom.

Extension changes are local and uncommitted on `Swakkhar`; the previously authorized/pushed baseline remains `1ea91bcd5bad3f6095453e6f8891821313f2e3ee`. The subsequent logo request replaces the placeholder brand/browser icon with the supplied original `public/Ritu_Logo.jpeg`; the regression counts above predate this logo-only change.

Logo-only verification: desktop and 320×800 Bangla navigation were visually inspected; the optimized image loads, retains its aspect ratio and has a working localized home link. No document overflow or browser errors were observed. Browser-icon metadata uses the JPEG. The new production build (including strict TypeScript), changed-file ESLint, formatting and diff check passed. Captures: ignored `research/logo-desktop.png` and `research/logo-mobile-bangla.png`.

## Historical checks — before mock-description extension

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
4. Build with `npm run build`, start an owned QA server, then run `node scripts/verify-production.mjs http://127.0.0.1:3004`, `node scripts/verify-demo-production.mjs http://127.0.0.1:3004` and `node scripts/verify-mascot.mjs http://127.0.0.1:3004`. Do not assume a server session is still alive from a document.
5. Read [WORK_TRACKER.md](WORK_TRACKER.md), [QA_MATRIX.md](QA_MATRIX.md), [CROP_CATALOGUE.md](CROP_CATALOGUE.md) and the [evidence audit](EVIDENCE_AND_USABILITY_AUDIT.md) before changing scope or claims.

Screenshots in ignored `research/tour-review-20261004/`, `research/tour-contact-sheets/` and `research/final-production/` are local evidence, not shipped assets. The final 78-test run's 156 tour captures are also archived in `research/tour-review-20261004-final/`; the previously reviewed sheets remain valid for tour placement because the last CSS repair affects only native crop dialogs. The Markdown record remains the durable handoff when those files are absent.

## Remaining validation

Safari, Firefox, physical devices, screen readers, sunlight readability, actual speaker/headphone listening and farmer usability have not been tested. The team should review agricultural Bangla. No NASA observations, locally validated crop rules, forecasts, yield/water savings or real farmer records are integrated. The full challenge brief and submission rules still need review. See the [NASA coverage table](EVIDENCE_AND_USABILITY_AUDIT.md) and [integration contract](DATA_INTEGRATION.md).

CI is authored but has not run on GitHub. Public hosting is not configured. These preview checks completed before the first commit/push; Abid subsequently authorized the `Swakkhar` branch handoff recorded in WORK_TRACKER.md. Hosting publication is not authorized by that Git request. Before October 7, the team should test the preview on its own machines, review language/source limits, agree on licensing/hosting/repository workflow and observe intended Rajshahi users on their own phones. Do not substitute automated passes for that feedback.
