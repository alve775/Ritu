# RITU finalization work record

> Latest continuation: [USABILITY_AUDIT_2026-10-26.md](USABILITY_AUDIT_2026-10-26.md). It supersedes this file's earlier acceptance counts and records the gutter fix, responsive framing, simpler intake, local area units, seasonal choices, precise errors, record-preserving drafts and eight-step first-visit setup tour. Historical real-provider captures below remain separate from fixture-based software QA.

Latest user direction: remove all synthetic production inputs and invented recommendation rules, use real traceable data/methods, and replace the low-detail landing animation without obstructing it with a large caption. Earlier mock-only authorization is superseded. Do not claim agronomic effectiveness or final release readiness merely because a build passes.

## Required work

- [x] Replace the landing scene with a substantially more detailed original animated farm; caption and controls must sit outside the illustration.
- [x] Remove fabricated farm defaults, sample-plan entry points and fake tour data from the active application.
- [x] Remove invented 1–3 water/drought scores, rainfall credits, temperature/soil thresholds and artificial climate perturbations from production decisions.
- [x] Replace planning evidence with official DAE/BAMIS Rajshahi crop calendars, source-specific dates/durations and explicitly bounded applicability. Never transplant another region's agronomy or infer unprovided cultivar details.
- [x] Use day-based intervals and real year boundaries; never manufacture a non-overlapping calendar by shortening a crop or assigning a gap as a crop.
- [x] Keep current modeled weather/forecast separate from dated NASA POWER seasonal context and farmer-entered observations. Missing or unavailable information stays unavailable.
- [x] Preserve actual farmer inputs/notes; do not silently treat old experimental plans as validated advice or silently delete their records.
- [x] Maintain Bangla, accessible controls, no autoplay sound, reduced motion, correct reset and truthful source attributions.
- [x] Verify the actual new flows, production build and visible animation at the reported wide/shallow viewport and on mobile.

## Primary sources discovered

- DAE/BAMIS calendar index: https://www.bamis.gov.bd/en/calendar/
- Rajshahi wheat: https://www.bamis.gov.bd/calendar/1/9/2/ — https://www.bamis.gov.bd/res/public/calendars/2019/08/23/5116.pdf (regional duration 119 days; displayed normal weeks 46–10).
- Rajshahi green gram, Kharif 1: https://www.bamis.gov.bd/calendar/1/86/2/
- Rajshahi mustard: https://www.bamis.gov.bd/calendar/1/44/2/
- Rajshahi Aman: https://www.bamis.gov.bd/calendar/1/74/2/
- Rajshahi potato: https://www.bamis.gov.bd/calendar/1/52/2/
- Rajshahi lentil: https://www.bamis.gov.bd/calendar/1/58/2/
- BARC official suitability/advisory portal: https://portal.cropzoning.gov.bd/ (its existence is not an integrated API or parcel-specific suitability result).
- FAO/BBS national cereal sowing/harvest calendar, historical national reference: https://www.fao.org/4/ai472e/ai472e00.htm (not cultivar-specific local recommendation).
- Animation controls: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html
- Three.js official renderer docs: https://threejs.org/docs/

## Required external evidence

User confirmed there is no krishibid/institutional reviewer; use identifiable primary sources online. Official pages retrieved through Firecrawl when web fetch returned 502: Field Shift: Adapting Farms with NASA Data; global hackathon November 14–15, 2026; global submission opens November 14 at 09:00 and closes November 15 at 23:59 local time. The official Rajshahi page independently lists challenge statements October 28 and submission November 15 at 23:59 Bangladesh time. Do not invent a separate local-selection deadline.

Official pages: https://www.spaceappschallenge.org/2026/ and https://www.spaceappschallenge.org/2026/local-events/rajshahi/ . The full technical challenge resource details were not present in the retrieved challenge summary as of this check; recheck after October 28.

Actual cultivar-specific prescriptions, soil-test interpretation, measured root-zone water balance and effectiveness on farms cannot be established by relabeling prototype rules. Record unresolved evidence explicitly and keep unsupported decisions disabled.

## Historical implementation checkpoint (superseded below)

- Detailed original farm diorama implemented in `src/components/landing/farm-diorama.ts`, with external activity-focus/pause controls in `growing-scene.tsx`; `farm-diorama.css`. Visually inspected at 1900×860 and 412px. Caption no longer overlays illustration. New user clarification: 2D is acceptable; visual detail matters more than format. Do not redo completed composition just to change the rendering technology.
- New real-only context/store: `planner-provider.tsx`, `evidence-store.ts`, `region-environment.ts`. Farm defaults are blank/unknown. Old v1 stores are preserved for export, not silently accepted as real farm observations. Old components now explicitly import `legacy-planner-provider.tsx` and are no longer used by farmer routes.
- Main routes Farm/Crops/Plan/Track now import `evidence-views.tsx`; `/sources`, `/insights`, and the old `/sample` URL show real source documentation. Landing sample link replaced by sources link. Metadata/about/tours still need final consistency review.
- `regional-calendars.ts` has five visually verified government sources: mung 65–70d, Aman 133d (includes nursery), wheat 119d, mustard 80–100d, lentil 119d. Regional weeks are display anchors, explicitly not optimal sowing dates. `evidence-planner.ts` uses actual date intervals and maximum source durations; never shortens a crop to force fit. Current version still requires one crop in each of next three reference occurrences; consider explicit farmer-selected unplanted seasons rather than forcing three crops where real references overlap.
- `crop-practices.ts` and `crop-practice-tools.tsx` add source-backed mung waterlogging caution, seed requirement calculations by variety for broadcast establishment, and actual germination test calculation. Source: CIMMYT/CSISA, Islam et al. 2016, CC BY 4.0: https://csisa.org/wp-content/uploads/sites/2/2014/06/Easy-to-use-methods-to-improve-mungbean-production-in-Bangladesh.pdf . Verified text: printed p.9 germination (50 seeds, 5–6 days, ≥85%); pp.12–13 seed rates; pp.14–15 establishment/30cm machine row spacing and heavy clay/salinity cautions; p.20 drain standing water before sowing. Regional BAMIS durations are not replaced by a selected cultivar duration without explicitly sourcing that change.
- Additional original English BAMIS PDFs downloaded and rendered under research/finalization, NOT yet integrated: potato `8864.pdf` (105d, weeks42–4), Boro `5105.pdf` (150–155d, weeks49–19), Aus `5072.pdf` (126d, weeks20–37), Rabi maize `5125.pdf` (112d, weeks46–9). Verify complete page visually before integrating. Beware guessed route IDs: 72 and 73 were wrong crops (one was litchi); those research files are rejected, not evidence. Correct page IDs: potato52, Boro75, Aus7, Rabi maize79.
- Crop metadata extracted into `src/data/crops.ts` so active crop photos do not import synthetic example calendars. Do not import old `demo-environment`, `demo-planner`, `preview` or legacy provider into the active production route graph.
- Last TypeScript check passed before the most recent source-practice/store validation edits. No current end-to-end claim: previous 164/136 results predate this replacement.

## Historical next-work list (resolved or bounded below)

1. Finish strict saved-plan validation and record-preserving recovery/export; ensure date/country/district/area gates cannot be bypassed via direct URLs.
2. Replace stale 28-step tours with real-input targets. The current tour engine waits indefinitely for absent targets; new gated pages must have meaningful fallback targets or the guide must handle missing targets without fictitious sample data. Preserve smooth motion, mascot, keyboard and reduced motion.
3. Add actual NASA context to calendar comparisons without invented suitability thresholds. Prefer contiguous historical analogues via a validated partial-date NASA endpoint; if using annual monthly records, label full source months explicitly and never present noncontiguous named months as a continuous season or prorated daily observations.
4. Verify/optionally integrate additional regional calendars and a real reference-only crop library. No fabricated field suitability, irrigation dose, optimum or yield claims.
5. Write new domain/persistence/API/browser tests for the real-only flow and visuals; old prototype browser contracts are obsolete and must be archived/labeled rather than misreported as current acceptance tests. Re-run lint/format/strict TypeScript/build, real upstream smoke and source-graph audit.

## Previous verification

164 unit/API/asset checks and 136 distinct browser cases across full/focused runs describe the prior experimental workflow. They must not be represented as verification of the replacement recommendation method or finalization changes.

## Current implementation — sequential 2D and real-only routes

- Latest explicit user direction is detailed **2D**, with activities appearing **one after another**. The Three.js landing implementation was removed. One original vector farm now progresses through Sow (7s), Care (7s), Grow (9s), Harvest (8s); only the active shot is mounted. The pacing is an editorial choice, not an agronomic duration or experimentally established UX optimum. See FARM_ANIMATION_STORYBOARD.md for primary research, handoffs, accessibility and lifecycle.
- Nine original BAMIS Rajshahi calendars are integrated: mung, Aman, wheat, mustard, lentil, potato, Boro, Aus and winter maize. Additional PDFs were visually checked. The planner retains maximum durations, nursery caveats, actual day/year boundaries and source URLs. Farmers can explicitly leave a season unplanted; no artificial three-crop result is forced. Botanical family counts now use individually referenced taxonomy, rather than grouping unreviewed labels as a family.
- Active Farm/Crops/Plan/Track/Sources use the new real-only provider/store. Empty farm defaults, no fake tour examples, no sample-plan endpoint, no invented water/drought scoring or climate adjustments. The old /sample route now shows sources. Legacy components remain for historical tests but are absent from the production import graph. An import audit visited 78 files and found zero banned prototype modules.
- New /api/season-history requests contiguous actual daily NASA POWER intervals, including cross-year winter crops, with fixed provider host, strict complete coverage/units/location checks, timeout, caching and honest failures. Calendar cards show actual rainfall, temperature and dimensionless wetness with dates and original NASA links, separately from forecasts or crop suitability.
- Live API verification returned 200 for current weather (seven forecast days), global Washington suggestions (eight disambiguated places), mung NASA history (2026-03-19 through 2026-05-27, 70 days), and cross-year wheat history (2025-11-12 through 2026-03-10, 119 days). Captures are research/finalization/live-*.json. These are source retrieval checks, not field validation.
- Tours now cover actual input order and meaningful setup gates. Absent optional targets no longer trap the tour. All 19 full-tour steps were traversed on both viewports with empty and completed setup, without changing saved input.
- Saved plans/observations preserve farm snapshots. Invalid state is backed up, export retains invalid raw records, and old sample plans are not treated as farmer observations. Confirmed full reset clears every farm field plus records and retains language/display preferences.
- QA found and fixed two accessible-label issues: the planning date label included its nested Use today button; a note label enclosed textarea text, making its exact label ambiguous after reload. Dates/notes now have explicit labels. Debugging confirmed the note was stored intact; desktop/mobile reload checks passed after the label fix.

## Verification at this checkpoint

- 199 unit/API/asset checks passed before adding three storyboard unit checks (rerun required for the updated total).
- Current browser suite: 28 of 30 passed in the complete run; the two label-related cases were fixed and both passed in a focused desktop/mobile rerun. This is 30 distinct current passing cases across complete/focused runs, not a single all-green full run. The four storyboard cases cover real-clock automatic transitions, exactly one activity, pause/replay, manual selection and reduced motion.
- TypeScript, ESLint and production build passed before the last explicit-label edit; rerun final checks and record final results below.
- Visuals inspected for all four sequential chapters, wide desktop, phone, saved records and tour gates. No physical-device or farmer study has been performed.

## Open validation and release boundaries

- No krishibid/institutional review or farm trial exists. Do not claim best crops, optimum exact sowing dates, proven yield/water/soil improvement, disease diagnosis or precise irrigation/fertilizer/pesticide doses. Unknown field measurements remain unknown. Help checks cover reference start/end only, not every intermediate transplanting/labor task.
- Official challenge verified as Field Shift: Adapting Farms with NASA Data. Rajshahi lists October 28 statements and November 15 23:59 Bangladesh submission; global hackathon is November 14–15. Recheck the full technical challenge brief when published; no separate local-selection deadline or guaranteed eligibility has been established.
- IMERG/SMAP, BARC suitability outputs and IRAS prescriptions are not integrated. Worldwide weather is supported; crop-planning references are restricted to four Rajshahi-region districts with an explicitly conservative product gate.
- Records are browser-local, without cloud backup. Production service limits, deployment, local agronomy and real farmer usability still need validation. No new commit or push was requested.

## Final software checks

- **202 distinct unit/API/asset checks passed**: 199 in the complete domain/API run plus the three new storyboard boundary/fade checks in a focused run. Historical domain tests remain as regression coverage; their presence does not put prototype data back in production.
- **30 distinct current browser cases passed** across the complete run (28 passes) and focused rerun of the two corrected explicit-label cases (2 passes), on desktop and mobile. The 19-step full tour was traversed for both incomplete and completed setup on each viewport (76 step visits); source routes also passed automated WCAG A/AA checks. This is not a claim that all previous prototype browser specifications are current or passing.
- Final ESLint, strict TypeScript/production build and Prettier check (preserving checkout line endings) passed. The final build contains four environmental API routes and all intended farmer/source pages.
- A separate compiled-production smoke at 1900×860 and 412×900 showed one 2D activity at a time, working chapter selection, no canvas/WebGL, blank new farm input, nine original calendar source links, and **zero browser page errors**. Evidence: `research/finalization/production-smoke.json`, `production-sow.png`, `production-care.png`, `production-grow.png`, `production-harvest.png`, `production-phone.png`.
- Live APIs returned verified NASA intervals and actual current weather/place responses. No credentials or farm notes were logged. Protected supplied project plan and user image SHA-256 hashes remain unchanged.
- No commit, push, merge or deployment was performed in this task. Continue from this checkpoint; do not redo the abandoned Three.js scene or restore sample calendars.
