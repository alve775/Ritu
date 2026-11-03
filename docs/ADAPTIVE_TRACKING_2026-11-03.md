# Adaptive crop tracking — 3 November 2026

This update implements the requested distinction between a planning reference, observed development and actual harvest. It does not turn the existing worldwide species screen into a locally validated cultivar model.

## Farmer workflow

1. Create a farm from the existing land → suggested plant workflow. Open its **Farm calendar**.
2. Record **Actual planting date** after planting. The day counter starts from this event, not from an assumed activity.
3. **Crop progress and timing** shows the original reference dates and the reference shifted to actual planting. Dotted calendar outlines mark the latter. These are source-based planning dates, not a diagnosis of harvest readiness or a statistical confidence interval.
4. Use **Update today’s field observations** or select a past calendar day. Record observed stage, confidence, affected share of the field and harvest status. Soil water, visible symptoms and notes are optional. “Not sure” is retained as uncertainty; “No change” can reuse a previous confirmed stage.
5. **Save daily check-in** updates conditional checks for that day and the next. Dry-soil and visible-damage reports trigger inspection guidance, not an invented irrigation quantity, disease diagnosis or pesticide dose. These short-lived soil/damage prompts apply to the report day and following day; an older report does not masquerade as today’s measurement.
6. **Picking started — crop still active** records partial harvesting. It does not complete the crop. Select **Final harvest finished** only when the seasonal crop cycle is finished. Early and late completion are both supported; the farm and its original selection remain available for review/export.
7. Without final harvest, a seasonal crop remains active after the reference window. Amber calendar days and an explicit status explain that tracking continues. No arbitrary additional number of days is substituted.
8. A perennial harvest records a harvest round and leaves care active. A later round can begin without recreating the planting. The perennial review horizon is not a first-fruit prediction.
9. Open **Daily updates and corrections** to remove an incorrect entry, then record its replacement. Removing the entry that supplied the current final-harvest date reopens that season. Unrelated records remain. A manually entered accidental final date can also be cleared in **Actual harvest date**. Earlier legacy observations remain readable and never retroactively become confirmed harvest events.

Daily reporting is farmer initiated. The app refreshes weather while open; it does not promise background notifications, operate farm equipment, measure soil automatically or infer an unreported crop stage.

## Numerical update: optional grain-corn model

The calendar can display a new numerical projection only for a configured **grain-corn** heat model. Other plants receive lifecycle tracking and observation-based checks, with an explicit unavailable numerical estimate. There is no universal “subtract/add days” rule and no fabricated default hybrid.

The farmer must supply the **actual grain hybrid’s documented** requirement from planting to physiological maturity/black layer, its source URL and an excerpt confirming the method. The form requires explicit confirmation of the 86/50 °F convention and planting origin. An emergence-based number, Celsius heat sum, sweet-corn picking target or silage target is not interchangeable. An optional silking requirement must refer to the same hybrid/method and 50% of plants.

RITU validates the input structure, bounds and method declaration; it **does not authenticate a supplied document or verify that the farmer chose the correct hybrid**. The form’s numerical bounds are input guards, not a claim that every accepted number is agronomically plausible. No supplied cultivar calibration or independent local validation currently exists in this repository.

### Calculation and observation update

The implemented convention follows [Ohio State Extension’s corn GDD method](https://cfaes.osu.edu/fact-sheet/corn-growing-degree-days-method-maturity-rating-hybrids):

```
daily GDD [°F·days] = max(0, (min(Tmax_F, 86) + max(Tmin_F, 50)) / 2 - 50)
```

Daily temperatures arrive in °C and are converted to °F. Accumulation starts the **day after actual planting**. Only completed local days enter accumulated history; today and subsequent days remain forecast contributions.

If a farmer confidently records the first date that at least half the plants showed silks, and provides a documented 50%-silking heat requirement, the calculation anchors the heat sum to that requirement on that date and accumulates subsequent daily heat. Repeated reports of the same event do not keep moving the anchor forward. Silking must accompany a flowering-stage report; black layer must accompany maturing/harvested stage. Unsure reports and insufficient field coverage cannot become model milestones.

This is an explicit stage-anchor assumption, **not an independently validated data-assimilation model or a claim of a particular improvement in forecast accuracy**. A calibrated process model would additionally require crop/variety, soil, management, local observations and evaluation data. See [DSSAT minimum data](https://dssat.net/data/minimum-data/). [DSSAT’s sweet-corn model description](https://dssat.net/ceres-sweetcorn/) explains why sweet-corn harvest cannot simply be equated with grain-corn physiological maturity.

If complete heat history plus available forecast crosses the hybrid target, the calendar marks that date with **≈** as a **heat-threshold projection**. It is not an automatic harvest order. Confirm actual physiological maturity, grain moisture and local harvest/storage requirements. A farmer-confirmed black-layer event remains a reported observation; it never automatically finishes the season.

The projected day also gets a physical-maturity/moisture inspection check. Re-anchoring changes that check’s date along with the marker. A field-stage conflict creates a model-input review task. Current model output is not applied retroactively to earlier days.

### Explicit unavailable and conflict states

- No documented model or no actual planting: no numerical projection.
- Missing completed temperature day: no imputation and no numerical date. The number of missing days is shown.
- Weather for another field/day, expired evidence or a provider failure: no stale numerical date.
- Target beyond the **available seven-day forecast**, or a gap before threshold crossing: no long-range extrapolation or made-up date.
- Completed heat reaches the target but a recent confident field observation is still immature: a conflict notice replaces a new date; review variety, field observations and weather.
- Actual final harvest: completed-season state; history retained.

Heat alone does not model every water/nutrient stress, disease effect, photoperiod response, temperature nonlinearity or harvest moisture. No percentage accuracy, yield, water saving, calibrated error range or worldwide cultivar validity is claimed.

## Weather evidence and implementation

- `/api/crop-thermal` requests only fixed Open-Meteo hosts; a caller-supplied URL is ignored. Coordinates and actual planting date are validated before requests. Supported history is bounded to 730 days.
- [Historical weather API](https://open-meteo.com/en/docs/historical-weather-api): daily minimum/maximum air temperatures through UTC today minus seven days, allowing for publication latency.
- [Forecast API](https://open-meteo.com/en/docs): recent model history (`past_days=14`) fills recent completed days; seven forecast days support only a short projection. Valid archive values take precedence in the overlap. Nulls remain gaps.
- These are **regional modeled/reanalysis estimates**, not measured temperatures at the farmer’s plants. Archive and forecast products can use different models/resolutions. Provider daily aggregations use its fixed timezone offset at the request time; historical daylight-saving transitions can affect daily boundaries.
- Units, coordinates, timezone, date uniqueness, array lengths, finite values and min/max ordering are checked. No unavailable provider response is replaced with a sample weather series.
- Public weather calls are deduplicated and cached for 15 minutes; the response preserves the forecast retrieval timestamp. The client refreshes every 15 minutes and on returning to the tab. Source URLs remain available in the model settings. Farm names, notes and cultivar documents are not sent to the weather provider/cache.
- The existing NASA POWER climate screen is unchanged. Open-Meteo temperature history/forecast is separately attributed; it is not represented as a new NASA cultivar dataset.

Key files: `src/domain/season-lifecycle.ts`, `src/domain/crop-thermal.ts`, `src/lib/thermal-weather.ts`, `src/app/api/crop-thermal/route.ts`, `src/components/season-check-in.tsx`, `src/components/season-progress.tsx`, and `src/components/season-views.tsx`.

Existing version-1 farm records remain readable because the journal, partial-harvest date and model profile are optional. Export includes the new fields. Tests use isolated browser storage and clearly synthetic activity/calibration inputs; those inputs are never shipped as farming recommendations.

## Verification record

Evidence is stored separately in `research/adaptive-tracking-2026-11-03/`; older worldwide audit CSV/PDF/JSON files remain unchanged.

- Focused desktop/phone adaptive checks: **16/16 passed** after correcting accessible control names. Covers overdue tracking, partial/final harvest, correction, perennials, farm isolation, daily/next-day advice, uncertainty, preplanting/future-day guards, model setup, silking re-anchoring, missing history, provider failure, English/Bangla and automated accessibility checks.
- Actual new endpoint probes on 3 November: **Rajshahi, Washington and Moscow returned HTTP 200**, the respective `Asia/Dhaka`, `America/New_York` and `Europe/Moscow` zones, **32 completed days and seven forecast days** from the 1 October start. No missing past temperatures appeared in those responses. These probes validate retrieval/processing, not cultivar forecast accuracy.
- Initial focused-run failures are retained in `browser/`; corrected focused results/screenshots are in `browser-final/`.
- **536/536 unit/API tests passed** in the final stable two-worker run (`unit-stable.json`). This includes the planting-day/milestone-day exclusion and model-driven inspection guidance. Earlier runs hit the unchanged exhaustive annual-rotation test’s time limit under concurrent browser load; the final run completed that test in 18.6 seconds without changing its timeout or assertions. Initial failure reports are retained.
- Full browser run: **303 passed, five failed** during development-server reloads while corrections were being made. Final stable rerun: **32/32 passed**, covering every adaptive case, all five earlier failures, actual-record workflow and English/Bangla tours on desktop/phone. Thus **all 308 distinct current-suite cases passed across the broad run and stable reruns**, including 256 land-profile workflows. Counts do not add duplicated reruns as new cases. See `regression/` and `stable-browser/`.
- The stable grain-corn browser case verifies deleting an incorrect silking report, replacing it with today’s confirmed event and moving the projection without counting today’s heat twice. Screenshots use explicitly synthetic activity/thermal parameters for deterministic QA; they do not assert that a real crop flowered within those test intervals.
- Production build and its TypeScript phase passed. New API `/api/crop-thermal` is included in the generated route manifest. No dependency, model-calibration dataset or crop-photo mapping was added.
- ESLint and changed-code Prettier checks passed; `git diff --check` passed. The repository-wide formatting command still flags **53 untouched baseline files**. Those are recorded separately in `format-baseline.json`; this feature does not reformat unrelated code or captured dataset fixtures.

The source was visually reviewed on desktop and phone, including English/Bangla reports, continuation/harvest states and the optional model. Next-day navigation respects both the operating-system reduced-motion preference and RITU’s motion switch. Empty legacy-observation controls are hidden; existing legacy history stays accessible.

Passing software checks cannot replace field validation against dated flowering/black-layer/harvest observations for named local hybrids. The one-day expiry for transient soil/damage prompts and seven-day recent-stage conflict lookback are operational safeguards, not validated biological duration claims. Further work requires authenticated cultivar documentation, suitable field observations and independent local evaluation before claiming quantitative forecast accuracy.
