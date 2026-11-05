# Website bug sweep — 5 November 2026

Nine reproduced website defects were repaired. The existing logo, green-theme work, farmer artwork, saved-record format and agricultural screening rules were preserved. Changes remain local; this audit did not commit, push or deploy anything.

## Repairs

| Defect | Reproduced behavior | Repair |
| --- | --- | --- |
| Cross-tab draft reset | Resetting in another tab left the old land draft visible; another edit could save it again. | Draft storage events update the open tab without writing the event back. Invalid external drafts retain the readable in-tab copy and block overwriting the stored original. |
| Deleted farm storage | Removing the farm-storage key in another tab left its old calendar active. | Key removal and storage clearing discard stale in-memory farms and calendar access. |
| Export with full storage | A land draft visible in memory was absent from the downloaded backup when storage writes failed. | Export includes the current in-tab draft and preserves a differing stored original separately. |
| Wrong local date | Soil sampling used UTC: it rejected today's Bangladesh sample after local midnight, or permitted tomorrow's Washington date. | Validation and the date control use the farm's local day, consistent with actual planting. |
| Ineffective photo retry | Retrying an expired image used the same fulfilled client-cache promise and never requested refreshed metadata. | Retry invalidates that plant's cache entry; metadata requests bypass the browser HTTP cache. Fresh image decoding is checked in the regression. |
| Stale map metadata | Moving a pin kept the geocoded location's old name, country and timezone. | A manually placed pin gets its own label and coordinates; old administrative metadata is removed, and weather can resolve the new timezone. |
| Late GPS response | A delayed location response overwrote a field the farmer had selected manually afterward. | Request generations discard obsolete callbacks, including callbacks after leaving the page. |
| English-only categories | The plant-use menu stayed English after choosing Bangla. | All sixteen category labels are translated; source category identifiers are preserved. |
| Footer overlap | At 320 px with enlarged Bangla text, the bottom navigation exceeded the reserved footer space. | The actual navigation height is observed as labels, fonts and viewport change. Footer spacing includes the safe area once. |

Partly damaged farm-storage recovery was also tested and already worked: the valid farm remained usable and the damaged original remained exportable. Its regression was retained without changing the validator.

## Verification and run integrity

- **566/566 unit/API/domain checks passed** after compatible dependency patches, without changing timeouts. [Final report](../output/audit/full-sweep-2026-11-05/unit-final.json).
- The broad existing desktop/phone run executed **430 cases**: **429 passed**, with one Nairobi mobile reload interrupted by development Fast Refresh while repairs were being edited. The trace records the full-reload collision; that exact case subsequently passed on the optimized production build. This was not a single 430/430 clean run. [Reload evidence](../output/audit/full-sweep-2026-11-05/development-reload.json).
- **70/70 final production desktop/phone cases passed**, including **22 new regression cases**, all affected navigation/scientific/record/image journeys and the interrupted Nairobi case. [Final production result](../output/audit/full-sweep-2026-11-05/production-final.json).
- **15 page/viewport/language combinations** were checked across dashboard, land details, crop choices, calendar and sources, including enlarged text at 320 px Bangla and 1024 px English. The settled layout checks include horizontal clipping and the actual bottom-navigation reservation; automated WCAG A/AA scans reported no violations or page errors. [Layout results](../output/audit/full-sweep-2026-11-05/responsive-review.json).
- Production compilation, full-project TypeScript checking, source/test/script ESLint, scoped formatting and Git whitespace checks passed. Next's generated development type imports were restored after building.
- Fifteen route/asset checks returned the expected statuses, including a real 404 for an unknown path. [Route checks](../output/audit/full-sweep-2026-11-05/route-status.json).
- Live production requests returned **200** for NASA POWER climatology, Open-Meteo current weather/forecast, place search, crop search, Wikimedia photo metadata and ISRIC WCS soil predictions. Four malformed API requests returned **400**. These live requests used no fixture substitutions. [Provider checks, with source URLs and timestamps](../output/audit/full-sweep-2026-11-05/live-providers.json).

An initial sandboxed unit attempt failed to access temporary transformed modules. A subsequent parallel native run had one legacy exhaustive-test timeout. Both attempts are preserved; the final single-worker run passed all 566 checks. The first footer scan checked horizontal layout and automated accessibility; visual inspection revealed the additional vertical reservation defect, which was then reproduced and repaired. The final layout helper waits for hydration, language preferences and font/layout settlement before measuring.

Reproduction traces, initial failures, scripts and the pre-audit diff are retained under `research/full-sweep-2026-11-05/`. Test weather, journal dates and field measurements are confined to isolated QA contexts. The user's browser records were not seeded or reset by the audit.

## Dependencies

Compatible patches updated Vite **8.3.2 → 8.3.6**, Zod **4.6.5 → 4.6.7** and related transitive tooling. The lockfile also received the compatible nanoid **3.3.19 → 3.3.20** patch. No forced downgrade or install script was used. Unit tests, linting and the production build were checked afterward.

The production dependency audit reports **zero known advisories**. The complete development graph still reports **eight moderate affected package entries** belonging to the lint dependency chain's [minimatch advisory](https://github.com/advisories/GHSA-g3hv-75wg-m249); high and critical counts are zero. npm's remaining recommendation downgrades `eslint-config-next` from the current Next 16 generation to 15.5.29. That incompatible downgrade was not applied. The development-tool advisory remains an explicitly open maintenance item; it is not represented as fixed or as a production-package vulnerability. [Production dependency audit](../output/audit/full-sweep-2026-11-05/production-dependency-audit.json).

## Limits

These checks establish observed software behavior, not universal absence of bugs. They used Chromium desktop and Android emulation rather than physical-device testing across all browser engines. Automated accessibility scans are not a complete accessibility certification. Crop suitability, cultivar performance and field efficacy still require agricultural validation; no new claim or coefficient was invented to turn those gaps into passing software results. Future upstream availability and every remote crop photograph's botanical accuracy cannot be guaranteed by these runs.
