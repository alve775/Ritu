# Dashboard-first navigation and page tours — 3 November 2026

Follow-up: [navigation and audio repairs](NAVIGATION_AND_AUDIO_REPAIRS_2026-11-03.md) correct the stale-active-farm access shortcut and old-global-tour-flag migration described in this earlier checkpoint, and add tested playback/read-aloud behavior.

Before implementation, the previous project checkpoint was committed and pushed to `origin/main`: [367b9cf](https://github.com/alve775/Ritu/commit/367b9cf). The navigation work described here follows that checkpoint.

## Page order and entry

1. **Dashboard** (`/farms`): view saved fields/seasons, add a farm, open an existing farm or export records.
2. **Land details** (`/farm`): select a field, enter its area and conditions, then confirm the current details.
3. **Suggested crops** (`/crops`): choose one crop and explicitly create its farm.
4. **Farm calendar** (`/plan`, with `/track` retained): track the selected farm's season, observations and weather.

The landing page's primary action opens the dashboard. Desktop navigation, phone tabs, visible step numbers and page titles use the same order. Disabled steps explain the missing prerequisite. Opening their URLs directly also checks those prerequisites after saved browser state has loaded, rather than briefly displaying an unavailable workflow step.

Crop selection requires a confirmation matching the **current** field coordinates, land inputs and starting date. An old confirmation cannot unlock changed inputs. Following the repair, the calendar requires an explicit grant from creating a crop plan or opening a saved farm; a remembered active ID is insufficient. Entering land or crop setup revokes that grant while retaining saved farms. Selecting an existing farm on the dashboard deliberately resumes its calendar without repeating setup.

## Page-local guides

First visits have independent automatic guides: dashboard, land details, suggested crops and calendar. Finishing or dismissing a guide leaves the farmer on that same page and restores its starting scroll position to explore or enter information. Continuing to another page is a separate user action.

`Take a tour` replays the current page's guide directly. Cross-page tour choices and tour-triggered route navigation are removed. Crop-method explanations stay on the crop page; source-page aliases also stay on their current URL. Automatic tours wait until their own controls are rendered, so an upstream failure does not cause a tour of missing crop suggestions.

Tours remain optional. Skipping a guide does not confirm land, select a crop or create a farm. Per-page acknowledgements use `ritu-page-tours-v1`; a one-bit-per-page session cookie and document memory provide fallback when local storage is unavailable. Following the repair, the old global `ritu-tour-v1=seen` flag acknowledges none of the new page guides. No farm or environmental values are stored in the new tour cookie.

Existing farm records, source calculations, logo geometry and decorative artwork are preserved.

## Verification

The initial agent-browser check loaded the dashboard guide and landing page with meaningful controls and no framework error overlay or page errors. The initial 16 new browser cases passed ten and stopped six on ambiguous test selectors for `Next` (tour button versus page pagination); the selectors were narrowed to the tour card without weakening the behavior assertions. Evidence remains under `research/navigation-2026-11-03/initial/`.

The new cases cover the full first-visit sequence, staying on each page after its guide, locked desktop/phone navigation, direct URL/reload bypass attempts, changed-input invalidation, existing-farm resume, new-field isolation, blocked-storage fallback, legacy acknowledgement migration, Bangla replay at 320 px, keyboard focus return and provider-failure recovery.

**Final verification:** all **92 desktop/phone browser cases passed** in the broad run, including all sixteen new navigation cases. A final visual check identified that tours left the page scrolled to the last target. After adding restoration to the starting position, **20/20 focused browser cases passed**, including explicit scroll-position assertions and English/Bangla page-guide checks. The complete unit/API suite passed **566/566**. Production build, TypeScript, ESLint, scoped formatting and diff checks passed. Browser checks replay captured provider contexts or explicitly labeled QA conditions; this interface update does not claim new agricultural field validation. The earlier exhaustive recommendation/input matrices were not re-executed because the screening algorithm is unchanged.

Evidence: `research/navigation-2026-11-03/regression.json`, `scroll-followup.json`, `unit.json` and the individual screenshots/traces. Review the [dashboard guide](../output/audit/navigation-2026-11-03/dashboard-guide.png), [desktop dashboard](../output/audit/navigation-2026-11-03/dashboard-desktop.png) and [phone dashboard](../output/audit/navigation-2026-11-03/dashboard-phone.png). The checkpoint was published before implementation; the new navigation changes are local at this handoff.
