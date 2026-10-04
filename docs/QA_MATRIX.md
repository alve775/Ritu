# QA coverage and manual review matrix

Updated October 4, 2026. This records what the reproducible checks exercise. Final outcomes are in [PREVIEW_VERIFICATION.md](PREVIEW_VERIFICATION.md); continuation requirements are in [WORK_TRACKER.md](WORK_TRACKER.md). Passing an automated check is not a claim of universal bug freedom or agronomic validation.

## Feature coverage

| Feature                    | Reproducible coverage                                                                                                                                                                                                                                       | Remaining external validation                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Navigation / first screen  | Five journey/reasons routes, four steps, default closed details, lazy 3D, selected option retained                                                                                                                                                          | Intended-user understanding                                               |
| Farm inputs                | Names, area validation, irrigation categories and unknown; separate soil/drainage; household groups, unavailable-help months                                                                                                                                | Real records and agricultural terminology                                 |
| Full farm/planning reset   | Visible top control; all farm/settings defaults; empty crop choices, review/generated fingerprints and tracking; invalid area-draft cleanup; Cancel/Escape without mutation; focus, reload and 320px Bangla/24px confirmation                               | Browser storage eviction and intended-user understanding of demo defaults |
| Locked calendar / tracking | Crop-specific assigned dates, exact twelve-month occupancy with rest, no manual-date bypass, immutable snapshot, planting/harvest order, notes, replacement/reset, reload                                                                                   | Real local day-based windows, turnaround buffers and multi-year crops     |
| Comparison                 | All/selected view, priorities, selection across routes, consistency checks and unknown suitability                                                                                                                                                          | Reviewed comparison method                                                |
| Mock location/environment  | Two authored locations, seasonal/dry/hot fixtures, twelve-month table, persistence, no external API requests during the tested flow                                                                                                                         | Real NASA data and provenance                                             |
| Mock generation            | Preferred-only complete candidates, deterministic ranking, all-check-pass filtering, 270 input combinations, alternate labor windows, missing-season/household refusal, selection/calendar/reasons/tracking/reload                                          | Scientifically reviewed crop/rotation rules                               |
| Scenario simulator         | Saved/draft separation, changed ranking, Reset, explicit Apply, reload and hash disclosure reopening                                                                                                                                                        | Validated real-model response                                             |
| New demo layouts/help      | White body/dark navigation colors, mock rule help, 320px extra-large Bangla generation/scenario/table reflow and axe scans                                                                                                                                  | Intended-user comfort and comprehension                                   |
| Crop catalogue             | 42 identities, English/Bangla search, group filtering, pagination, no results, every detail dialog including centering/close bounds, source links, read-only records, no date injection                                                                     | Additional taxonomy and locally appropriate crop rules                    |
| Reasons                    | Calendar/household/help conflicts; supplied water/soil/drainage remain unassessed; evidence/source disclosures                                                                                                                                              | NASA integration and local scientific review                              |
| Three.js                   | Actual WebGL render, camera buttons/reset, field/close-up/cutaway, manual structure choice, independent crop study in a rest month, unchanged calendar details, source dialogs, synchronized months, reopen cleanup, no-WebGL behavior, unsupported anatomy | Physical GPUs, measured anatomy/proportions                               |
| First visit / tours        | Prompt, skip/reload, full mission, Back, seven scopes, route handoffs, field reopening, preserved inputs and focus                                                                                                                                          | Intended-user comprehension                                               |
| Tour geometry              | Every step in every scope: card/Next bounds, zero card/spotlight overlap, minimum useful visible target area, calendar row visibility, selection CTA visibility, section and calendar arrows                                                                | Arbitrary browser/user stylesheet combinations                            |
| Tour motion                | Actual intermediate scroll/spotlight/copy; repeated-click guard; Escape during travel; reduced-motion changes; whole-word reveal and instant text                                                                                                           | Subjective comfort and device performance                                 |
| Mati                       | Finite step greeting and click wave, keyboard-accessible control, reduced-motion behavior                                                                                                                                                                   | User preference and cultural interpretation                               |
| Reading                    | 20/24px settings, persistence independent of farm, motion override, 320px Bangla, 200% text increase plus spacing overrides                                                                                                                                 | Sunlight, screen readers, physical devices                                |
| Farm sounds                | No context before request; actual nonzero waveform; scenes, volume-zero, Stop, Mute all, independent clicks, reload without autoplay, simulated hidden-tab pause/resume, denied playback                                                                    | Physical speaker/headphone listening and loudness                         |
| Persistence                | Versioned schema, every crop ID, corrupt/blocked storage, saved notice, deliberate reset, language retained                                                                                                                                                 | Browser eviction/private-mode variation                                   |
| Accessibility              | Axe A/AA scans, keyboard loop, Escape/focus restoration, controls/labels, reduced motion, text spacing/reflow                                                                                                                                               | Full WCAG audit and assistive-technology/farmer sessions                  |

## Every-tour viewport matrix

`tests/e2e/tour-layout.spec.ts` traverses **28 full-tour steps + 27 section-tour steps = 55 step visits** per configuration. Every visit captures a screenshot. The 28-step total includes the welcome screen, which appears only in the full tour.

| Width × height | Language / body text | Motion  | Mode                     |
| -------------- | -------------------- | ------- | ------------------------ |
| 1440 × 1000    | English / 20px       | Reduced | Desktop guide rail       |
| 1000 × 1000    | Bangla / 24px        | Normal  | Tablet-sized bottom dock |
| 412 × 1000     | English / 20px       | Reduced | Phone dock               |
| 320 × 1000     | Bangla / 24px        | Normal  | Narrow phone dock        |

This produces **220 screenshot-backed visits** across all seven scopes. Separate motion tests inspect intermediate frames. Additional production smoke checks cover shorter phone heights; record their actual completed dimensions/results in PREVIEW_VERIFICATION.md.

Screenshot generation alone is not visual inspection. Use the contact sheets and inspect individual screenshots wherever a layout appears cramped. Small contact-sheet thumbnails establish placement and consistency, not fine typography legibility.

## Evidence and artifact rules

- `test-results/` contains current tour screenshots and failure traces; the next Playwright run replaces it. Never run simultaneous suites into this directory.
- Copy final review artifacts into ignored `research/` before another suite. Review helper scripts are in `scripts/` or `research/`.
- `research/` and `test-results/` are local artifacts, not shipped documentation. The Markdown record must remain sufficient when those files are absent.
- Domain tests establish software behavior. Source links establish only their stated scope. Neither validates crop suitability or a forecast.
- Chromium desktop and device emulation do not establish Safari/Firefox or physical-device behavior.
- For an interrupted test run, do not infer a pass from a running process or incomplete log. Obtain the final exit/result.
- Expected forced WebGL failure output belongs to the fallback test; unexpected hydration/runtime warnings must be investigated.
