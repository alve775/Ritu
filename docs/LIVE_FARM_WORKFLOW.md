> **Superseded workflow:** The real-only finalization and sequential 2D storyboard replace the prototype rules/screens described below. Start with [FINALIZATION_2026-10-26.md](FINALIZATION_2026-10-26.md) and [FARM_ANIMATION_STORYBOARD.md](FARM_ANIMATION_STORYBOARD.md). Earlier passing counts are historical, not verification of the current source state.

# Live farm workflow — October 26, 2026

## Current authorized changes

- [x] Put the logo at the viewport's top-left on the planner and landing page.
- [x] Full-screen landing with an original animated sowing → watering → growing → harvest scene, pause and reduced-motion support.
- [x] Location first: globally searchable, disambiguated autocomplete on the left; interactive farm-pin map on the right; mouse, touch and keyboard alternatives.
- [x] Automatically retrieve current conditions and a seven-day forecast, refresh while visible, retain timestamps/source attribution, and handle unavailable data honestly.
- [x] Remove the normal year and Load history controls. Automatically obtain NASA history as separate background seasonal context for the chosen location.
- [x] Sequence the intake: location → field/history → soil/drainage → irrigation → priorities/resources → crop choices → calendar → ongoing observation/actions.
- [x] Keep saved farm coordinates with the tracking snapshot. Show current weather, forecast and transparent next-check reminders for the saved farm.
- [x] Preserve existing household requirements, calendar safety, Bangla, tours, reading/sound controls and reset.
- [x] Test API parsing/failures, Washington/location ambiguity, map pin/touch/keyboard, stale requests, automatic updates, reminders, motion, responsive views and production build.

## Research and implementation boundaries

- NASA POWER FAQs: https://power.larc.nasa.gov/docs/faqs/data/ — meteorology generally has 2–3 day latency. It must not be labeled an instantaneous field sensor or a future forecast. Retain the real historical POWER integration as separately dated seasonal context.
- Current weather/forecast: https://open-meteo.com/en/docs — current values use 15-minute model data, not a measurement on the user's farm. Forecast horizon up to 16 days; use seven days for readable operational planning. Source-grid coordinates can differ from the selected farm pin.
- API/data terms: https://open-meteo.com/en/terms — free API is non-commercial, with request limits; data CC BY 4.0. Credit Open-Meteo and underlying providers, use caching/deduplication. A commercial launch needs the appropriate provider arrangement; do not imply universal free commercial use or guaranteed forecasts.
- Place search: https://open-meteo.com/en/docs/geocoding-api — GeoNames-derived worldwide search; three-character prefix search, returned admin/country/coordinates. A city center is not the farm: ask the farmer to move the pin. Retain GeoNames/Open-Meteo attribution.
- Leaflet: https://leafletjs.com/examples/quick-start/ — version 1.9.4; BSD-2-Clause. Vendor verified official distribution locally; keep its license. Native map click/drag/pinch/zoom and keyboard controls.
- Map tiles: https://operations.osmfoundation.org/policies/tiles/ — standard HTTPS OSM tiles only for interactive viewport viewing, visible OSM contributor attribution, normal browser caching/referer, no bulk/offline tile downloads. No guarantee of service; location selection must have a usable fallback.
- Extension intake and irrigation: https://extension.umn.edu/natural-resources/conservation/agricultural-soil-and-water/basics-of-irrigation-scheduling — irrigation decisions require soil water-holding capacity, rooting depth, crop-specific depletion and monitoring. Rainfall forecasts or soil texture alone cannot give an exact watering dose. Minnesota numerical recommendations must not be transplanted to Bangladesh.
- Rotation context: https://www.fao.org/4/v9926e/v9926e06.htm — local soil, climate, crop sequence and farmer conditions matter. No single universal questionnaire order is claimed as an expert standard.

## Decision rules

Location/weather tools may work worldwide. Existing crop windows are experimental Bangladesh seasonal templates; do not silently apply them to Washington or other regions. Outside the supported pilot, provide real weather and state that local crop-calendar rules need regional evidence. No made-up globally optimal crops.

Automatic suggestions are explainable observation/planning reminders: check field wetness before deciding on irrigation when forecast rain is reported, review freezing-air forecasts, inspect recorded crops, and review calendar tasks. They do not prescribe fertilizer/pesticide doses, precise irrigation quantities, diagnose disease or infer growth stage without cultivar/planting/field evidence. Calendar dates and task checkmarks are not observed growth.

## Verification and continuation

Current verified checks (26 October 2026):

- **164 unit/API/asset tests in 14 files passed.** Captured Open-Meteo provider data is a test fixture only; it is never substituted for live API failures.
- **136 distinct desktop/emulated-mobile browser cases passed across the complete regression run and focused follow-ups.** The initial 126-case run passed 122 and exposed four failures: the outdated zero-external-request assertion on both viewports, a 320px/large-Bangla tracking overflow, and tour re-prompting after blocked storage. All corrected cases passed focused reruns. Ten new edge cases cover GPS/accuracy, marker dragging, denied permission, unavailable tiles, manual coordinates, stale request cancellation, stale source time, reconnection and recovery after an interrupted map stylesheet load. The reconnection test was corrected to avoid treating React development double-mount requests as user reconnection.
- All seven tour scopes passed geometry checks in English/Bangla on desktop/mobile: **220 focus visits**, with no card/spotlight overlap, useful visible targets, section/calendar panning and preserved inputs. Full-tour navigation, streaming instructions, interrupted travel and reduced-motion tests also passed.
- Automated WCAG A/AA checks passed on tested pages and states, including 320px large Bangla, expanded forecasts and crop photographs. These do not establish universal accessibility or intended-user comprehension.
- Real-provider check at **2026-10-26T05:10:14Z**: Open-Meteo current model time **2026-10-26 11:00 Asia/Dhaka**, seven daily dates **October 26–November 1**, real disambiguated Washington search results, eight loaded OSM map tiles, zero browser page errors. Values are dated evidence of integration, not a current forecast to quote later. Local capture: research/live-workflow/real-provider-verification.json.
- Visuals inspected: full-screen desktop landing, real street map/search layout with logo at viewport top-left, crop photos, mobile tour location focus and large-Bangla tracking. Test tiles are stubbed during exhaustive browser runs to avoid bulk traffic to OSM; the separate live-provider check used real tiles.
- Strict TypeScript, ESLint (zero warnings), formatting and the optimized production build passed. Production browser smoke checks returned HTTP 200 for /, /farm, /crops, /plan, /track and /sample, real weather and eight Washington search results, with zero browser page errors. Changing the pin to 24.38, 88.60 automatically retrieved a genuine NASA POWER 2025 record with complete 365-day coverage (retrieved 2026-10-26T05:34:07Z). Local report: research/live-workflow/production-verification.json.
- Original docs/PROJECT_PLAN.md and the user's October 14 image retain their previously recorded SHA-256 hashes. No commit or push is requested or performed for this task.

Remaining evidence/work:

- Real farmers and a local krishibid must test comprehension, questionnaire order and recommendations. This is a practical intake order, not a proven universal agricultural protocol.
- Crop rules and monthly templates remain experimental Rajshahi-region rules. Worldwide weather/search does not validate global crop calendars. Local soil tests, cultivar-specific dates, rooting depth and observed field moisture remain necessary for precise management advice.
- Device-emulated browser tests do not establish physical GPS precision, sunlight readability, audio comfort or usability on a farmer's actual phone.
- Open-Meteo current values are model estimates. Missing/failed data stays missing; old provider timestamps suppress weather-derived reminders. Forecast rain is not field-measured moisture. Reminders do not infer crop stage, diagnose disease or prescribe irrigation/fertilizer/pesticide quantities.
- No accounts, cross-device cloud sync, background push notifications or surveyed farm boundaries are implied. Forecasts/reminders refresh while the relevant page is open/visible and on return online; the app is not an unattended alert service.

Continuation entry points: src/components/farm-location.tsx, farm-map.tsx, weather-panel.tsx and farm-monitor.tsx; src/domain/live-weather.ts and farm-reminders.ts; src/app/api/weather and places; tests/e2e/live-farm*.spec.ts. NASA parsing/validation remains in src/domain/nasa-power.ts and src/app/api/climate. API caches contain public environmental/place records, not farm notes or household inputs. Standard map interaction is permitted; no bulk or offline tile download is included.
