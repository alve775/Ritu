# Frame color and 2D farm characters — 5 November 2026

> Follow-up: [Shared green theme](THEME_UNIFICATION_2026-11-05.md) supersedes the first-pass color below. The final shared green is `#3e694b` across the frame, primary buttons and selected controls. The character artwork described here is preserved.

The header and desktop sidebar now use medium leaf green (`#467552`). This replaces the first pale-sage attempt after the owner's feedback, and is lighter than the previous forest green (`#204b3b`). Shared frame tokens control background, text, hover and dividers. White navigation text has a calculated 5.35:1 contrast ratio; secondary text (`#edf4e9`) has 4.77:1. Sidebar keyboard focus has a white outline. The existing logo and vine-stitch geometry are preserved.

The original SVG farmers now have smaller heads relative to their bodies, outlined facial features, blinking eyes, shaped hands, elbows, sandals, fabric folds, checked lungi and gamcha details. The care chapter has a woman in a sari; watering uses a carrying handle and closed grip. The harvest character has a headcloth, grain bundle and a sickle held in the other hand. The existing four sequential chapters, pause/replay controls and motion preferences remain in place.

The owner's visual reference was Meena. [UNICEF's Meena page](https://www.unicef.org/bangladesh/en/meena-and-unicef) and its linked character illustration were consulted for visual context. The website characters are original SVG drawings; no UNICEF artwork was incorporated.

Validation:

- Existing desktop/mobile animation and canal-edge regression tests: **8/8 passed** on the final revision.
- Four viewport sizes (1900×860, 1440×1000, 412×915, 320×700), three character chapters each: **12/12** workers fit their frames; no horizontal page overflow.
- Automated WCAG A/AA scans: no violations on the desktop dashboard, phone dashboard or phone landing page. This is a scoped automated check, not a complete accessibility certification.
- TypeScript, component ESLint, scoped Prettier and Git whitespace checks passed.
- Final browser console: no page errors.

Evidence: [browser review](../output/audit/visual-refresh-2026-11-05/browser-review.json), [animation tests](../output/audit/visual-refresh-2026-11-05/animation-tests.json), [dashboard](../output/audit/visual-refresh-2026-11-05/dashboard-desktop.png), [sowing](../output/audit/visual-refresh-2026-11-05/sow-desktop.png), [care](../output/audit/visual-refresh-2026-11-05/care-desktop.png), [harvest](../output/audit/visual-refresh-2026-11-05/harvest-desktop.png). Capture helper is retained under `research/visual-refresh-2026-11-05/`. An initial final-check attempt could not reach loopback from the managed sandbox; the final recorded run used the installed browser and reachable preview.

These are presentation changes. Agricultural calculations, source records and farmer data were not edited. Work remains local; no new commit or push was requested.
