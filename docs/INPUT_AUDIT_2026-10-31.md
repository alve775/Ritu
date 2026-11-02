# RITU input-to-output audit and walkthrough - 31 October 2026

## Authorized task and boundaries

The user requested at least hundreds of input attempts, repairs for reproducible failures, and a screenshot PDF explaining one definitive run from inputs to output. This authorizes verification and necessary fixes to the existing app. No commit or push is requested for this task. Preserve pre-existing untracked images and the supplied project plan.

Baseline: main at cdfca2e. Read the installed Next layout/page guide before implementation work. Existing preview at 127.0.0.1:3000 was verified as RITU; a launch attempt found the port occupied, so the existing server is reused.

## Evidence selected for the definitive run

- Primary research: Chaki et al., Field Crops Research 275 (2022), 108344, "How we used APSIM to simulate conservation agriculture practices in the rice-wheat system of the Eastern Gangetic Plains". https://repository.cimmyt.org/bitstream/10883/21737/1/64540.pdf
- Printed p.3: Rajshahi experimental site 24 degrees 22 minutes N, 88 degrees 39 minutes E; decimal conversion 24.3666667, 88.65. These are published approximate site coordinates, not a surveyed current farm boundary.
- Printed p.3: 5 m by 6 m subplot = 30 square metres = 0.003 ha. Historical experiments were in 2016-2017. CS6 explicitly describes a rainfed treatment. Use that historical treatment, not an invented claim about current irrigation supply.
- Soil texture and drainage remain Not sure. The paper's detailed soil properties are not silently mapped to the app's coarse categories. Previous wheat/mung cultivation is documented. Crop selections and the 2026-10-31 planning date are declared walkthrough choices.
- No actual planting or harvest in 2026 has been observed. Keep completed-activity dates blank. Any administrative note must identify the historical source, not invent field observations.

This is a source-grounded research-site walkthrough with current environmental context, not an independently surveyed current farmer case or a reproduction/validation of the paper's APSIM model. The app does not implement APSIM or infer yield, irrigation doses, optimum timing or crop suitability from these inputs.

## Live provider checks

Real requests through RITU returned HTTP 200 for current Open-Meteo weather, NASA POWER annual 2025 context at the research-site grid, and all nine supported seasonal history intervals. Source URLs, original provider-derived values and timestamps are saved in ignored research/input-audit-2026-10-31/authentic-provider-records.json. Nothing is retimestamped or fabricated.

## Browser matrix - completed

The local matrix harness is research/input-audit-2026-10-31/matrix.spec.ts with its own Playwright config. It enters all profile values through actual browser controls; it does not seed a completed farm into storage.

108 combinations per viewport: four water settings x three drainage settings x three soil settings x three priorities. Desktop and phone produce 216 distinct complete input-to-calendar-and-tracking cases. Dates rotate across current-year, January, leap-day and upper supported-year cases; area entry rotates hectares, square metres and decimal/shotok. Every offered calendar option is checked for date overlap and retained full durations; selected plans are saved, notes are reloaded, and source/family/water/drainage constraints are checked independently.

Matrix cases replay exact freshly captured real provider records, preserving dates and values. These are QA scenario settings, not measurements from 216 farms. Map tiles are suppressed during the matrix to avoid bulk community tile requests. The definitive report capture will run separately with normal live providers and map tiles.

Eight pilot cases passed. The complete matrix then passed all 216 cases in one run (12.5 minutes), with zero skips, unexpected failures or flaky results. There are 216 corresponding scenario.json evidence records. Browser source/replay checks do not prove agronomic effectiveness.

The first domain/API suite was run concurrently with the browser matrix: 207 tests passed and one historical demo-planner combinatorial test exceeded its explicit 30-second timeout (it took approximately 51 seconds under that load). It reported a timeout, not a failing logic assertion. The complete suite was then rerun serially after browser load ended: all 208 tests across 18 files passed in 20.22 seconds. No timeout budget or application behavior was changed. Both logs are preserved: unit-parallel-initial.log and unit.log.

The required PDF operation marker was run successfully once before authoring build_walkthrough_pdf.py. Do not repeat the create marker for the same PDF. The builder refuses publication unless all 216 matrix cases pass and the live walkthrough has actual weather/NASA responses and no browser page errors. Final output is output/pdf/RITU_Verified_Input_to_Output_Walkthrough.pdf.

## Additional acceptance suite - completed

All 68 existing finalization browser cases passed in 180.53 seconds across the configured desktop and phone projects, with zero skips, unexpected failures or flaky results. These cover the existing error/recovery, persistence, responsive, reading/language and guide behavior assertions. They use the suite's existing QA fixtures, separately from the real-provider replay matrix and normal live walkthrough. See research/input-audit-2026-10-31/additional-results.json. Final totals are 216 matrix browser cases, 68 separate acceptance browser cases and 208 unit/API/domain tests; do not describe all of these as independent farms or live upstream requests.

## Definitive live walkthrough - completed

Twenty screenshots were captured from normal application interactions in a fresh isolated browser. No completed farm profile was injected and no provider routes were intercepted. Live endpoints can return genuine cached provider records; the capture preserves their original timestamps. Soil and drainage remain unknown; no completed planting/harvest is invented. The source-grounded historical 30 m2 / 0.003 ha rainfed subplot case uses the entered approximate site point 24.36667 N, 88.65 E, Rajshahi district, chosen planning start 2026-10-31, historical previous wheat/mung, and the selected diversity comparison preference.

Actual saved output (inclusive display dates):

| Crop | Start | Finish | Reserved days |
| --- | --- | --- | --- |
| Wheat | 2026-11-12 | 2027-03-10 | 119 |
| Mung bean - Kharif I | 2027-03-19 | 2027-05-27 | 70 |
| Aman rice | 2027-06-11 | 2027-10-21 | 133 |

There are two botanical families, a pulse, and unallocated gaps 11-18 March and 28 May-10 June 2027. Rice duration includes the seedbed phase: nursery and field transplanting dates are different. These are regional reference dates, not validated optimal sowing dates or yield predictions. NASA interval history remains contextual and does not determine eligibility or ranking.

All three selected crop NASA intervals loaded actual records. Current Open-Meteo weather and seven forecast dates were captured separately. The live walkthrough had zero page errors. The administrative note persisted after reload, and the exported ritu-evidence-v2 object exactly equals the captured saved state.

The first regional screenshot method allowed the sticky header to obscure a section heading. This was a capture defect, not an application repair: the final captures use full-document coordinates from scroll position zero, preserving the actual section content without the overlaid navigation. No application source or test timeout was changed; no reproducible application defect was found in the completed cases.

## Final artifact and verification

- [x] 216 full matrix cases and their 216 scenario.json records inspected; all passed.
- [x] 68 existing acceptance cases inspected; all passed.
- [x] 208 unit/API/domain tests passed in the final serial run; initial concurrent timeout retained in the report.
- [x] Twenty definitive screenshots, actual endpoint responses, export and saved state retained under research/input-audit-2026-10-31/walkthrough/.
- [x] PDF created at output/pdf/RITU_Verified_Input_to_Output_Walkthrough.pdf (22 pages; 3,846,773 bytes at delivery).
- [x] All 22 pages rendered and visually reviewed, including the dense result ledger at full page resolution. No clipped text/overlapping footer or layout warnings found. Text extraction succeeded on every page; six clickable external source links verified structurally.
- [x] Definitive export SHA-256: 0cb4a5983636e8439fe4b1d56ad7f73132fc6bf68db07fc9d514bfbd4526903c.
- [x] PDF builder, screenshots, raw JSON, render images and test logs retained in ignored research/input-audit-2026-10-31/ for local reproduction. No memory file changes.
- [x] No commit/push performed; unrelated untracked image assets preserved. No absolutely bug-free or agronomically effective claim is established by software QA.
