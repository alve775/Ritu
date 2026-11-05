# Shared green theme — 5 November 2026

The owner's follow-up asked for a slightly darker green across the website, including buttons. The shared action color is now `#3e694b`, replacing the frame-only `#467552` and the older independent button greens.

Header/sidebar backgrounds, primary buttons, landing CTA, language selection, crop selection accents, calendar selection, checkboxes, radio buttons, links already using the primary token, and focus styling now use the same green family. Secondary buttons use `#edf3ec`, green text and `#7b9476` borders. Primary hover is `#31543c`; secondary hover is `#e0eadf`. Hardcoded action greens in seasonal, evidence, location and landing styles were replaced by shared tokens. Calendar weather/reference colors retain their meanings.

Browser inspection measured the same `rgb(62, 105, 75)` on the header, sidebar, Add a farm, Open farm, selected language, selected calendar day, landing CTA and selected animation chapter. Both hover colors were also verified. White text on the shared green has a calculated 6.31:1 contrast ratio.

Validation:

- Existing token contrast suite: **28/28 passed**.
- Existing first-visit and saved-farm journeys, desktop and phone: **4/4 passed**.
- Six scoped automated WCAG A/AA scans (desktop dashboard, calendar, land form, landing; phone dashboard and landing): zero reported violations, page errors or horizontal overflow.
- Scoped formatting and Git whitespace checks passed.

[Browser results](../output/audit/theme-2026-11-05/browser-review.json), [journey results](../output/audit/theme-2026-11-05/journey-tests.json), [dashboard preview](../output/audit/theme-2026-11-05/dashboard-desktop.png), [landing preview](../output/audit/theme-2026-11-05/landing-desktop.png), [calendar preview](../output/audit/theme-2026-11-05/calendar-desktop.png).

The screenshot farm is explicitly an isolated UI test fixture, with captured climate context and synthetic activity dates. It was not inserted into the website's production data or the owner's browser. The capture helper is retained at `research/theme-2026-11-05/capture.mjs`. Automated checks do not constitute a full accessibility certification. Work is local; no new commit or push was requested.
