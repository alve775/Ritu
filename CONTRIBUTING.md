# Working on Ritu together

Install with `npm ci`, run `npm run dev`, and keep changes scoped to a small feature. Use branches and pull requests when the team shares this work. Do not commit secrets, dependency folders, build outputs, raw research captures or browser traces.

## Where changes belong

| Area | Files | Primary handoff |
| --- | --- | --- |
| Routes and shared frame | `src/app`, `src/components/shell.tsx` | Abid |
| Calendar and interactions | `calendar.tsx`, `farm-controls.tsx`, view components | Abid |
| Seasonal field and rendering | `season-explorer.tsx`, `field-viewport.tsx`, `field-scene.ts`, `src/domain/season.ts` | Abid with Mahia |
| Guided tours and model evidence | `tour-guide.tsx`, `src/data/tours.ts`, `crop-geometry.ts`, `src/data/crop-models.ts` | Abid; copy and evidence reviewed by the team |
| Crop assumptions and reviewed replacements | `src/data/preview.ts`, `src/domain` | Alve with Abid |
| Colors, typography, original field art | `src/app/globals.css`, `field-art.tsx`, `crop-glyph.tsx` | Mahia with Abid |
| Copy and translation | Paired EN/BN strings and localized data | Team review, including Bangla |
| Tests | `src/**/*.test.ts`, `tests/e2e` | Abid; domain cases reviewed by Alve |

Do not edit the preserved `docs/PROJECT_PLAN.md`. Record subsequent decisions in new documentation.

## Conventions

- Server pages compose interactive client components. A versioned browser store uses `useSyncExternalStore`; its server snapshot is deterministic and saved inputs load on client subscription. DOM language updates stay in an effect.
- Use named shared types. Derive statuses and tradeoffs from inputs, rather than copying them into separate state.
- Keep known blockers visible. Unknown input must never become a successful check by default.
- Do not label example categories as measured savings, confidence, crop performance or forecasts. See `docs/DATA_INTEGRATION.md` before changing evidence-related labels.
- Add both English and Bangla for user-facing copy. Do not translate user-entered farm names.
- Use semantic inputs, visible labels, focus styles and keyboard interactions. Calendars scroll within their panel on small screens; the document must not overflow.
- Preserve the 20px body baseline, optional 24px setting and readable supporting labels. The Three.js canvas supplements the month details; keep an equivalent keyboard-accessible inspection button and a usable WebGL fallback. Render only on changes, dispose GPU resources, and keep drag rotation opt-in so normal page scrolling works.
- Keep tours separate from planner inputs. Route steps must resolve visible controls at desktop/phone widths, trap and restore keyboard focus, allow skipping and support both languages. New inputs should receive corresponding mission explanations. A manual plant example must never become a month-specific growth prediction without reviewed evidence.
- The preview storage key is versioned. If its shape changes, migrate it explicitly or start a new version; validate stored values before using them.
- SVG artwork is original project code. Fonts and icons retain their dependency licenses. Agree on a project license before publication.

## Before a pull request

```sh
npm run format
npm run lint
npm run typecheck
npm test
npm run build
npm run test:browser
```

Describe the changed behavior and actual checks run. Inspect at least one mobile viewport, both languages and affected unknown/conflict cases. Automated accessibility checks complement a human review; they do not establish complete accessibility.
