# Ritu Golden Hour Redesign Implementation Plan

**Goal:** Restyle and simplify every Ritu page into the Golden Hour (light) and Deep Forest (dark) design. Every feature, string, route, store and the 3D field model keep working exactly as before.

**Architecture:**
- The 4,335-line `src/app/globals.css` is wrapped unchanged into a lowest-priority cascade layer (`legacy`). New, token-based CSS is written in ordered higher layers, so each task can restyle one area while the app keeps working.
- New visuals come from a handful of small shared components under `src/components/ui/`: StepProgress, BottomTabBar, ThemeSwitch, ActionBar, SeasonChip, StatusPill and YearWheel. Their pure logic lives in `src/domain/` and is covered by Vitest. Pages are then re-composed around those components.
- The last task deletes the legacy layer.

**Tech Stack:** Next.js 16.3.8 (App Router), React 19.3, TypeScript 6, plain CSS with `@layer`, lucide-react icons, @fontsource self-hosted fonts, Vitest 5 (node environment, `src/**/*.test.ts`), Playwright 1.63 with @axe-core/playwright (projects `desktop` 1440×1000 and `mobile` Pixel 7).

**Spec:** `docs/superpowers/specs/2026-10-12-ritu-redesign-design.md` (read it before starting any task). Section 0 below records four amendments that this plan makes to the spec.

## 0. Spec amendments (found while planning against the tests)

1. **No Wheel/Months switch.** Playwright expects `.timeline .crop-bar` to be visible on `/plan` straight after "Build my calendar" (`demo-planning.spec.ts:99`, `planner.spec.ts:27`), and a tour step targets `.calendar-board .calendar-scroll`. On Calendar and Track, the YearWheel is therefore shown **in addition to** the months grid, never instead of it. The new strings "Wheel" and "Months" are dropped.
2. **The Crops action panel stays in normal flow, not sticky.** `[data-tour="build-calendar"]` must contain the long status messages, the "Review farm conditions" link and two `.calendar-actions > .button` elements that are at least 48px tall and at least 15.5px apart (`demo-planning.spec.ts:163-209`). It is restyled as the page's closing action card. Sticky `ActionBar` is used on Farm and Calendar only.
3. **Single CSS entry is `src/app/layout.tsx`.** It imports the stylesheets in a fixed order. `src/app/globals.css` only declares the layer order. The Next 16 CSS guide recommends keeping CSS imports in one JS/TS entry, and this avoids relying on CSS `@import` handling.
4. **Year-wheel labels sit outside the ring.** Crop names are curved text along each arc, just outside the ring, in the season *text* colour (≥ 4.5:1). Month names sit just inside the ring. White text on the arcs would fail contrast. Each wheel month is an SVG `role="button"` named "`Year wheel: <Mon>`" (Bangla "`বছরের চক্র: <মাস>`") so it never collides with the existing "Inspect month: <Mon>" buttons or the explorer's "<Mon>" buttons.

Task 14 also patches the spec file to record these amendments.

## Global Constraints

Every task's requirements include all of these:

- **Next.js 16:** before writing Next-specific code, read the matching guide in `node_modules/next/dist/docs/` (`AGENTS.md`). Viewport metadata uses `export const viewport: Viewport` (`01-app/03-api-reference/04-functions/generate-viewport.md`).
- **No behaviour changes:** routes, stores, storage keys (`ritu-preview-v1`, `ritu-demo-v1`, `ritu-journey-v1`, `ritu-display-v1`, `ritu-tour-v1`), domain logic, crop data, tour steps and the 3D model geometry and materials stay as they are.
- **Copy:** every existing English and Bangla string is reused verbatim. Any new user-facing string needs both English and Bangla via `t('English', 'বাংলা')`. The only new strings allowed are Light / Dark / Auto / Theme, "+ Add a note", "Your year", "All" and "Year wheel".
- **Bangla font stays Noto Sans Bengali.** No decorative Bangla lines.
- **Logo:** `public/website_logo.jpg` is never edited, recoloured or replaced. It is shown on `.brand-chip`, which has a `var(--logo-chip)` background.
- **Fonts:** `@fontsource-variable/newsreader@5.3.0` (family `'Newsreader Variable'`) and `@fontsource-variable/geist@5.3.0` (family `'Geist Variable'`), pinned exactly like the other dependencies. `@fontsource/noto-sans-bengali` 400/600 is kept. `@fontsource/dm-sans` and `@fontsource/fraunces` are removed.
- **Tokens only:** components and page CSS use the `var(--…)` tokens from `src/styles/tokens.css`. No raw hex values outside `tokens.css`, except that the legacy layer is untouched until Task 13.
- **Shape:** interactive controls are `var(--radius-pill)`; cards, sheets and dialogs `var(--radius-card)` (18px); inputs, tiles and inner panels `var(--radius-control)` (12px).
- **Type:** the root font size stays `125%` (20px) and `150%` (24px) for `html[data-text-size='larger']`. No text renders below 16px (0.8rem). Tests assert body ≥ 20px, `.crop-bar` ≥ 16px, `.month-activity small` ≥ 16px and `.explorer-selection select` ≥ 20px.
- **Touch:** every interactive element has a hit area of at least 44×44px. Primary and secondary `.button`s are at least 48px tall.
- **Layout:** no horizontal document overflow at 320px, in either language and at either text size (`reading.spec.ts`).
- **Motion:** only `transform` and `opacity` are animated, using `--dur-enter: 240ms`, `--dur-exit: 160ms`, `--dur-micro: 150ms` and `--ease-out`. Nothing animates when `prefers-reduced-motion: reduce` or `html[data-motion='off']`.
- **Selectors:** every selector listed in spec §10.2 keeps resolving to an equivalent element. That covers test selectors, tour selectors, `data-tour` values and accessible names.
- **Icons:** `lucide-react` only, with `strokeWidth` left at its default of 2. No emoji in the interface.
- **Commits:** author is the local git user. **No** `Co-Authored-By` trailer, **no** generated-by line (only Alve, Abid and Mahia are credited). Conventional, imperative subject lines.
- **Verification per task:** `npm run format` then `npm run lint`, `npm run typecheck`, `npm test` and `npm run build` must pass. Run `npm run test:browser` wherever the task says so. Playwright starts its own dev server on port 3000, so stop any other server on 3000 first, or let it reuse one started with `npm run dev`.

## Review Focus

The five input classes most likely to hurt a real user that no single feature test naturally covers. Each line names the task whose tests pin it down.

1. **Bangla at "Extra large" on a 320px phone.** The new header tools, tab bar, sticky action bar and year wheel must not overflow or clip. Pinned by the overflow matrix in Task 14; each page task also runs `reading.spec.ts`.
2. **Theme persistence edge cases.** A stored theme that is missing, invalid or from older versions (an older `ritu-display-v1` without `theme`) falls back to Auto. A manual Dark choice survives a reload, and Auto follows the system setting. Pinned in Task 2 (unit and e2e).
3. **Sticky bars covering tour spotlights or focused fields.** The fixed tab bar and sticky action bar must never hide a tour target or a field focused by keyboard. Pinned by `scroll-padding-bottom` in Task 3 plus the existing `tour-layout.spec.ts`, rerun in Tasks 3, 7 and 10.
4. **Degenerate calendars in the wheel.** A 12-month rest, 1-month crops, a crop starting in Feb (month 11), progress of exactly 0 and 1, and an empty `periods` array must all render without NaN paths or crashes. Pinned in Task 4 unit tests and Task 9.
5. **Keyboard and reduced motion on the wheel.** Wheel months can be operated with Enter and Space, show a visible focus, and the arcs do not animate under reduced motion or with the motion setting off. Pinned in Task 5.

---

## File structure

| Path | Status | Responsibility |
|---|---|---|
| `src/app/globals.css` | rewrite | Declares the layer order only |
| `src/styles/legacy.css` | create (Task 1), delete (Task 13) | Old globals wrapped in `@layer legacy` |
| `src/styles/tokens.css` | create | Light and dark design tokens |
| `src/styles/base.css` | create | Element defaults, type, focus, grain, motion guards |
| `src/styles/layout.css` | create | Header, step progress, tab bar, main, footer |
| `src/styles/components.css` | create | Buttons, chips, cards, disclosure, dialog, forms, ActionBar, SeasonChip, StatusPill, ThemeSwitch |
| `src/styles/year-wheel.css` | create | YearWheel styles |
| `src/styles/pages/{farm,crops,calendar,track,insights,tour}.css` | create | Page-specific styles |
| `src/styles/contrast.test.ts` | create | Parses tokens.css and asserts WCAG pairs |
| `src/app/layout.tsx` | modify | Font and CSS imports, viewport metadata |
| `src/lib/display-store.ts` | modify | `theme` preference and `parseTheme` |
| `src/lib/display-store.test.ts` | create | Theme parsing tests |
| `src/domain/year-wheel.ts` (+ `.test.ts`) | create | Wheel geometry (pure) |
| `src/domain/season-coverage.ts` (+ `.test.ts`) | create | Crops "Your year" tracker state (pure) |
| `src/components/ui/step-progress.tsx` | create | Desktop stitched steps |
| `src/components/ui/bottom-tab-bar.tsx` | create | Phone step tabs |
| `src/components/ui/theme-switch.tsx` | create | Light/Dark/Auto radios |
| `src/components/ui/action-bar.tsx` | create | Sticky or in-flow action area |
| `src/components/ui/season-chip.tsx` | create | Season + months chip |
| `src/components/ui/status-pill.tsx` | create | Checked / not-assessed / conflict pill |
| `src/components/ui/year-wheel.tsx` | create | The Ritu year wheel |
| `src/components/shell.tsx` | modify | New app frame |
| `src/components/reading-controls.tsx` | modify | Adds the Theme fieldset; responsive launch label |
| `src/components/tour-guide.tsx` | modify | Responsive launch label only |
| `src/components/farm-view.tsx` | modify | Farm layout |
| `src/components/journey-views.tsx` | modify | Crops and Track layouts |
| `src/components/compare-view.tsx` | modify | Calendar layout |
| `src/components/season-explorer.tsx` | modify | Stage wrapper class only |
| `src/components/field-scene.ts` | modify | Renderer clear colour only |
| `src/components/insights-view.tsx` | modify | Insights layout |
| `src/app/not-found.tsx`, `src/app/error.tsx` | modify | Class names only |
| `tests/e2e/theme.spec.ts`, `tests/e2e/redesign.spec.ts` | create | Theme and layout-matrix tests |
| `README.md`, `CONTRIBUTING.md`, `docs/BRAND_ASSETS.md` | modify (Task 14) | Describe the new frame |

## Execution order and parallelism

| Phase | Tasks | Parallel? |
|---|---|---|
| 1 Foundation | 1 → 2 → 3 | Sequential, one implementer |
| 2 Shared pieces | 4 → 5; 6 | 4→5 sequential; 6 can run alongside 4/5 |
| 3 Pages | 7 (Farm) · 8→9 (Crops then Track, one after the other, both in `journey-views.tsx`) · 10 (Calendar) · 11 (Insights) | Can be done in parallel on separate branches. Each touches only its listed files and its own `src/styles/pages/*.css`. **No JSX edits in `demo-planning.tsx`, `farm-controls.tsx` or `calendar.tsx`**: style them through CSS from the owning page file. |
| 4 Finish | 12 → 13 → 14 | Sequential |

Each task's diff is reviewed and that task's verification rerun before merging, plus the full suite at the end of each phase.

---

### Task 1: Fonts, CSS layers, tokens and base styles

**Files:**
- Modify: `package.json`, `package-lock.json` (through npm)
- Modify: `src/app/layout.tsx:1-11`
- Rewrite: `src/app/globals.css`
- Create: `src/styles/legacy.css`, `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/layout.css`, `src/styles/components.css`, `src/styles/year-wheel.css`, `src/styles/pages/farm.css`, `src/styles/pages/crops.css`, `src/styles/pages/calendar.css`, `src/styles/pages/track.css`, `src/styles/pages/insights.css`, `src/styles/pages/tour.css`
- Test: `src/styles/contrast.test.ts`

**Interfaces:**
- Produces: every token listed in `tokens.css` below. Later tasks reference them by name. The layer names `legacy, tokens, base, layout, components, pages` and empty files for every later task's CSS, already imported in order, so later tasks only fill files in.

- [ ] **Step 1: Swap the font packages**

```bash
npm uninstall @fontsource/dm-sans @fontsource/fraunces
npm install --save-exact @fontsource-variable/newsreader@5.3.0 @fontsource-variable/geist@5.3.0
```

Expected: `package.json` lists both new packages at `5.3.0` and no longer lists dm-sans or fraunces.

- [ ] **Step 2: Write the failing contrast test**

Create `src/styles/contrast.test.ts`:

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

type RGB = [number, number, number];
const css = readFileSync(new URL('./tokens.css', import.meta.url), 'utf8');

function block(selector: RegExp): Record<string, string> {
  const match = css.match(selector);
  if (!match) throw new Error(`Missing token block ${selector}`);
  const tokens: Record<string, string> = {};
  for (const [, name, value] of match[1].matchAll(/--([\w-]+):\s*([^;]+);/g)) tokens[name] = value.trim();
  return tokens;
}
const light = block(/:root \{([^}]*)\}/);
const darkAuto = block(/:root:not\(\[data-theme='light'\]\) \{([^}]*)\}/);
const darkManual = block(/:root\[data-theme='dark'\] \{([^}]*)\}/);

function parse(value: string): { rgb: RGB; alpha: number } {
  const hex = value.match(/^#([0-9a-f]{6})$/i);
  if (hex) {
    const n = hex[1];
    return { rgb: [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16)) as RGB, alpha: 1 };
  }
  const rgba = value.match(/^rgba\(\s*(\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\s*\)$/);
  if (rgba) return { rgb: [+rgba[1], +rgba[2], +rgba[3]], alpha: +rgba[4] };
  throw new Error(`Unsupported colour ${value}`);
}
function resolve(tokens: Record<string, string>, name: string): RGB {
  const value = tokens[name];
  if (!value) throw new Error(`Missing token --${name}`);
  const { rgb, alpha } = parse(value);
  if (alpha === 1) return rgb;
  const base = resolve(tokens, 'color-surface');
  return rgb.map((c, i) => Math.round(alpha * c + (1 - alpha) * base[i])) as RGB;
}
function luminance([r, g, b]: RGB) {
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function ratio(a: RGB, b: RGB) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const pairs: [string, string, number][] = [
  ['color-ink', 'color-bg', 4.5],
  ['color-ink', 'color-surface', 4.5],
  ['color-ink-muted', 'color-bg', 4.5],
  ['color-ink-muted', 'color-surface', 4.5],
  ['color-ink-muted', 'color-soft', 4.5],
  ['color-on-primary', 'color-primary', 4.5],
  ['color-primary', 'color-bg', 4.5],
  ['color-accent', 'color-bg', 3],
  ['color-warn-ink', 'color-warn-bg', 4.5],
  ['color-success-ink', 'color-success-bg', 4.5],
  ['color-danger', 'color-surface', 4.5],
  ['season-pre-text', 'color-surface', 4.5],
  ['season-mon-text', 'color-surface', 4.5],
  ['season-win-text', 'color-surface', 4.5],
  ['season-pre', 'wheel-track', 3],
  ['season-mon', 'wheel-track', 3],
  ['season-win', 'wheel-track', 3],
  ['season-pre', 'color-surface', 3],
  ['season-mon', 'color-surface', 3],
  ['season-win', 'color-surface', 3],
  ['stage-ink', 'stage-bg', 4.5],
  ['stage-muted', 'stage-bg', 4.5],
];

describe.each([
  ['light', light],
  ['dark', { ...light, ...darkManual }],
])('%s theme contrast', (_, tokens) => {
  it.each(pairs)('--%s on --%s ≥ %s:1', (fg, bg, min) => {
    expect(ratio(resolve(tokens, fg), resolve(tokens, bg))).toBeGreaterThanOrEqual(min);
  });
});

it('defines the dark theme identically for Auto and manual Dark', () => {
  expect(darkAuto).toEqual(darkManual);
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npx vitest run src/styles/contrast.test.ts`
Expected: FAIL with `ENOENT … tokens.css`.

- [ ] **Step 4: Create `src/styles/tokens.css`**

```css
@layer tokens {
  :root {
    color-scheme: light;
    --font-display: 'Newsreader Variable', 'Noto Sans Bengali', Georgia, serif;
    --font-ui: 'Geist Variable', 'Noto Sans Bengali', system-ui, sans-serif;
    --serif: var(--font-display);
    --sans: var(--font-ui);
    --color-bg: #f4f5ef;
    --color-surface: #fdfdfa;
    --color-surface-raised: #ffffff;
    --color-ink: #10241b;
    --color-ink-muted: #4f6457;
    --color-line: #e1e4d8;
    --color-soft: #eaece2;
    --color-primary: #0e5a3a;
    --color-on-primary: #f6f8f2;
    --color-accent: #c27a12;
    --color-warn-bg: #fbefd6;
    --color-warn-ink: #7a4c0d;
    --color-success-bg: #e6f0e8;
    --color-success-ink: #0e5a3a;
    --color-danger: #a3401f;
    --color-focus: #0e5a3a;
    --season-pre: #bb7310;
    --season-pre-text: #8f5a0b;
    --season-mon: #2f7fc1;
    --season-mon-text: #24659f;
    --season-win: #557f24;
    --season-win-text: #4a7121;
    --wheel-track: #e6e8dd;
    --stage-bg: #0b3a28;
    --stage-ink: #eef0e6;
    --stage-muted: #b9c9bd;
    --stage-line: rgba(238, 240, 230, 0.14);
    --stage-accent: #f5c36b;
    --logo-chip: #ffffff;
    --shadow-1: 0 1px 2px rgba(16, 36, 27, 0.05), 0 10px 26px rgba(16, 36, 27, 0.07);
    --shadow-2: 0 18px 48px rgba(16, 36, 27, 0.18);
    --grain-opacity: 0.05;
    --radius-pill: 999px;
    --radius-card: 18px;
    --radius-control: 12px;
    --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
    --dur-enter: 240ms;
    --dur-exit: 160ms;
    --dur-micro: 150ms;
    --z-actionbar: 20;
    --z-header: 30;
    --z-tabbar: 30;
    --z-popover: 40;
    --z-dialog: 50;
    --z-tour: 60;
    --z-grain: 70;
    --header-h: 64px;
    --tabbar-h: 0px;
    --page-max: 1180px;
    --gutter: 28px;
  }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme='light']) {
      color-scheme: dark;
      --color-bg: #0f1d17;
      --color-surface: #16271f;
      --color-surface-raised: #1b2e25;
      --color-ink: #f1ede2;
      --color-ink-muted: #a9b6aa;
      --color-line: rgba(241, 237, 226, 0.09);
      --color-soft: rgba(241, 237, 226, 0.07);
      --color-primary: #efe8d6;
      --color-on-primary: #0f3324;
      --color-accent: #f1ede2;
      --color-warn-bg: rgba(214, 162, 78, 0.12);
      --color-warn-ink: #e6c48c;
      --color-success-bg: rgba(169, 216, 184, 0.12);
      --color-success-ink: #a9d8b8;
      --color-danger: #f0a08a;
      --color-focus: #efe8d6;
      --season-pre: #d6a14f;
      --season-pre-text: #d6a14f;
      --season-mon: #6fa3cf;
      --season-mon-text: #6fa3cf;
      --season-win: #97b46c;
      --season-win-text: #97b46c;
      --wheel-track: rgba(241, 237, 226, 0.08);
      --stage-bg: #0a2a1d;
      --stage-ink: #f1ede2;
      --stage-muted: #b9c9bd;
      --logo-chip: #efe8d6;
      --shadow-1: inset 0 0 0 1px rgba(241, 237, 226, 0.07), 0 12px 30px rgba(0, 0, 0, 0.28);
      --shadow-2: inset 0 0 0 1px rgba(241, 237, 226, 0.09), 0 18px 48px rgba(0, 0, 0, 0.45);
      --grain-opacity: 0.04;
    }
  }
  :root[data-theme='dark'] {
    color-scheme: dark;
    --color-bg: #0f1d17;
    --color-surface: #16271f;
    --color-surface-raised: #1b2e25;
    --color-ink: #f1ede2;
    --color-ink-muted: #a9b6aa;
    --color-line: rgba(241, 237, 226, 0.09);
    --color-soft: rgba(241, 237, 226, 0.07);
    --color-primary: #efe8d6;
    --color-on-primary: #0f3324;
    --color-accent: #f1ede2;
    --color-warn-bg: rgba(214, 162, 78, 0.12);
    --color-warn-ink: #e6c48c;
    --color-success-bg: rgba(169, 216, 184, 0.12);
    --color-success-ink: #a9d8b8;
    --color-danger: #f0a08a;
    --color-focus: #efe8d6;
    --season-pre: #d6a14f;
    --season-pre-text: #d6a14f;
    --season-mon: #6fa3cf;
    --season-mon-text: #6fa3cf;
    --season-win: #97b46c;
    --season-win-text: #97b46c;
    --wheel-track: rgba(241, 237, 226, 0.08);
    --stage-bg: #0a2a1d;
    --stage-ink: #f1ede2;
    --stage-muted: #b9c9bd;
    --logo-chip: #efe8d6;
    --shadow-1: inset 0 0 0 1px rgba(241, 237, 226, 0.07), 0 12px 30px rgba(0, 0, 0, 0.28);
    --shadow-2: inset 0 0 0 1px rgba(241, 237, 226, 0.09), 0 18px 48px rgba(0, 0, 0, 0.45);
    --grain-opacity: 0.04;
  }
}
```

Note: Prettier may reformat this file; the test's regexes tolerate any whitespace inside the blocks, but the selector lines must keep the exact form `:root {`, `:root:not([data-theme='light']) {` and `:root[data-theme='dark'] {`. Prettier keeps single quotes in CSS attribute selectors as written.

- [ ] **Step 5: Run the contrast test to verify it passes**

Run: `npx vitest run src/styles/contrast.test.ts`
Expected: PASS (45 tests: 22 pairs × 2 themes, plus the parity test).

- [ ] **Step 6: Wrap the legacy CSS**

```bash
git mv src/app/globals.css src/styles/legacy.css
```

Then edit `src/styles/legacy.css`: add `@layer legacy {` as the very first line and `}` as the very last line, and indent nothing (keep the diff readable). Add this comment above the `@layer` line:

```css
/* Pre-redesign styles, lowest priority. Each redesign task overrides these; Task 13 deletes this file. */
```

- [ ] **Step 7: Create the new `src/app/globals.css` and the empty layer files**

`src/app/globals.css`:

```css
/* Cascade order for the whole app. Later layers win; unlayered CSS (only @font-face) is unaffected. */
@layer legacy, tokens, base, layout, components, pages;
```

Create each of these with a single wrapper so later tasks only add rules inside it:

- `src/styles/layout.css` → `@layer layout {\n}`
- `src/styles/components.css` → `@layer components {\n}`
- `src/styles/year-wheel.css` → `@layer components {\n}`
- `src/styles/pages/farm.css`, `crops.css`, `calendar.css`, `track.css`, `insights.css`, `tour.css` → `@layer pages {\n}`

- [ ] **Step 8: Create `src/styles/base.css`**

```css
@layer base {
  html {
    font-size: 125%;
    scroll-behavior: smooth;
    scroll-padding-top: calc(var(--header-h) + 16px);
    scroll-padding-bottom: calc(var(--tabbar-h) + 120px);
    -webkit-text-size-adjust: 100%;
  }
  html[data-text-size='larger'] {
    font-size: 150%;
  }
  body {
    margin: 0;
    min-height: 100dvh;
    background: var(--color-bg);
    color: var(--color-ink);
    font-family: var(--font-ui);
    font-size: 1rem;
    line-height: 1.6;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
    -webkit-font-smoothing: antialiased;
  }
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    z-index: var(--z-grain);
    pointer-events: none;
    opacity: var(--grain-opacity);
    mix-blend-mode: overlay;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  }
  h1,
  h2,
  h3 {
    margin: 0;
    color: var(--color-ink);
    font-family: var(--font-display);
    font-weight: 500;
    letter-spacing: -0.02em;
    line-height: 1.12;
  }
  h1 {
    font-size: 2.2rem;
  }
  h2 {
    font-size: 1.5rem;
  }
  h3 {
    font-size: 1.1rem;
  }
  h1 em,
  h2 em {
    font-style: italic;
    font-weight: 400;
    color: var(--color-accent);
    padding-bottom: 0.08em;
  }
  p {
    margin: 0;
    color: var(--color-ink-muted);
    line-height: 1.6;
  }
  :lang(bn) h1,
  :lang(bn) h2,
  :lang(bn) h3 {
    letter-spacing: 0;
    line-height: 1.4;
  }
  :lang(bn) body,
  :lang(bn) p {
    line-height: 1.75;
  }
  small {
    font-size: 0.8rem;
  }
  a {
    color: inherit;
  }
  button,
  input,
  select,
  textarea {
    font: inherit;
    color: inherit;
  }
  :focus-visible {
    outline: 3px solid var(--color-focus);
    outline-offset: 3px;
  }
  ::selection {
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
  .skip-link {
    position: fixed;
    top: -100px;
    left: 16px;
    z-index: calc(var(--z-tour) + 1);
    padding: 12px 20px;
    border-radius: var(--radius-pill);
    background: var(--color-primary);
    color: var(--color-on-primary);
  }
  .skip-link:focus {
    top: 12px;
  }
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
  }
  @media (max-width: 767px) {
    h1 {
      font-size: 1.6rem;
    }
    h2 {
      font-size: 1.3rem;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }
    *,
    *::before,
    *::after,
    .dialog::backdrop {
      animation: none !important;
      transition: none !important;
    }
  }
  html[data-motion='off'] {
    scroll-behavior: auto;
  }
  html[data-motion='off'] *,
  html[data-motion='off'] *::before,
  html[data-motion='off'] *::after,
  html[data-motion='off'] .dialog::backdrop {
    animation: none !important;
    transition: none !important;
  }
}
```

- [ ] **Step 9: Update the imports in `src/app/layout.tsx`**

Replace lines 1-11 (the type imports stay):

```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource-variable/geist/wght.css';
import '@fontsource/noto-sans-bengali/400.css';
import '@fontsource/noto-sans-bengali/600.css';
// Stylesheet order is cascade order: the layer list first, then each layer's file.
import './globals.css';
import '../styles/legacy.css';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/layout.css';
import '../styles/components.css';
import '../styles/year-wheel.css';
import '../styles/pages/farm.css';
import '../styles/pages/crops.css';
import '../styles/pages/calendar.css';
import '../styles/pages/track.css';
import '../styles/pages/insights.css';
import '../styles/pages/tour.css';
```

- [ ] **Step 10: Verify**

Run: `npm run format && npm run lint && npm run typecheck && npm test && npm run build`
Expected: all pass. The build lists the routes `/`, `/farm`, `/crops`, `/plan`, `/track`, `/insights`.

Then run `npm run test:browser`.
Expected: the same pass and fail result as on `main` before this task. Record any failure that already failed before this task in the commit body. The UI should look nearly identical to before, apart from the Newsreader/Geist fonts, the bone background and the grain.

- [ ] **Step 11: Commit**

```bash
git add package.json package-lock.json src/app src/styles
git commit -m "Add Golden Hour tokens, layered CSS skeleton and new fonts"
```

---

### Task 2: Theme preference (Light / Dark / Auto)

**Files:**
- Modify: `src/lib/display-store.ts`
- Create: `src/lib/display-store.test.ts`
- Create: `src/components/ui/theme-switch.tsx`
- Modify: `src/components/reading-controls.tsx` (insert the fieldset after the text-size fieldset, around line 81)
- Modify: `src/app/layout.tsx` (add the `viewport` export)
- Modify: `src/styles/components.css`
- Create: `tests/e2e/theme.spec.ts`

**Interfaces:**
- Produces: `export type Theme = 'auto' | 'light' | 'dark'`; `DisplayPreferences.theme: Theme`; `export function parseTheme(value: unknown): Theme` (in `src/lib/display-store.ts`); `<ThemeSwitch />` with no props; `document.documentElement.dataset.theme` set to `'light'` or `'dark'`, or removed for Auto.

- [ ] **Step 1: Write the failing unit tests**

`src/lib/display-store.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { parseTheme } from './display-store';

describe('parseTheme', () => {
  it.each(['auto', 'light', 'dark'] as const)('keeps %s', (theme) => {
    expect(parseTheme(theme)).toBe(theme);
  });
  it.each([undefined, null, '', 'Dark', 'system', 1, {}])('falls back to auto for %s', (value) => {
    expect(parseTheme(value)).toBe('auto');
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/lib/display-store.test.ts`
Expected: FAIL with `parseTheme is not a function` (or not exported).

- [ ] **Step 3: Implement the store change**

In `src/lib/display-store.ts`:

```ts
export type Theme = 'auto' | 'light' | 'dark';
export function parseTheme(value: unknown): Theme {
  return value === 'light' || value === 'dark' || value === 'auto' ? value : 'auto';
}
export interface DisplayPreferences {
  text: 'comfortable' | 'larger';
  motion: boolean;
  sound: boolean;
  volume: number;
  ambience: 'morning' | 'evening';
  theme: Theme;
}
const defaults: DisplayPreferences = {
  text: 'comfortable',
  motion: true,
  sound: false,
  volume: 35,
  ambience: 'morning',
  theme: 'auto',
};
```

In `apply()`, add after the `motion` line:

```ts
  const { theme } = snapshot.preferences;
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
```

In `subscribe`, inside the parsed `preferences` object, add after `ambience`:

```ts
              theme: parseTheme('theme' in parsed ? parsed.theme : undefined),
```

The validity guard above it stays unchanged, so older stored values without `theme` are still accepted.

- [ ] **Step 4: Run the unit tests to verify they pass**

Run: `npx vitest run src/lib/display-store.test.ts`
Expected: PASS (10 tests).

- [ ] **Step 5: Create `src/components/ui/theme-switch.tsx`**

```tsx
'use client';
import { useSyncExternalStore } from 'react';
import { displayStore } from '../../lib/display-store';
import type { Theme } from '../../lib/display-store';
import { usePlanner } from '../planner-provider';

export function ThemeSwitch() {
  const { t } = usePlanner();
  const { preferences } = useSyncExternalStore(
    displayStore.subscribe,
    displayStore.getSnapshot,
    displayStore.getServerSnapshot,
  );
  const options: { value: Theme; label: string }[] = [
    { value: 'auto', label: t('Auto', 'স্বয়ংক্রিয়') },
    { value: 'light', label: t('Light', 'হালকা') },
    { value: 'dark', label: t('Dark', 'গাঢ়') },
  ];
  return (
    <fieldset className="theme-switch">
      <legend>{t('Theme', 'রং')}</legend>
      <div className="segmented">
        {options.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name="theme"
              checked={preferences.theme === option.value}
              onChange={() => displayStore.update({ theme: option.value })}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
```

- [ ] **Step 6: Add it to the Reading & sound dialog**

In `src/components/reading-controls.tsx`, add `import { ThemeSwitch } from './ui/theme-switch';`. Then insert `<ThemeSwitch />` directly after the closing `</fieldset>` of `.reading-size`, and before the motion `setting-check` label.

- [ ] **Step 7: Add the viewport metadata in `src/app/layout.tsx`**

Change the type import to `import type { Metadata, Viewport } from 'next';` and add below `metadata`:

```tsx
export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f5ef' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1d17' },
  ],
};
```

- [ ] **Step 8: Style the segmented control**

Append inside `@layer components { … }` in `src/styles/components.css`:

```css
.segmented {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  border-radius: var(--radius-pill);
  background: var(--color-soft);
}
.segmented label {
  position: relative;
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  padding: 0 16px;
  border-radius: var(--radius-pill);
  cursor: pointer;
  font-weight: 600;
}
.segmented input {
  position: absolute;
  inset: 0;
  opacity: 0;
  margin: 0;
  cursor: pointer;
}
.segmented label:has(input:checked) {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.segmented label:has(input:focus-visible) {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
.theme-switch {
  border: 0;
  margin: 0 0 16px;
  padding: 0;
}
.theme-switch legend {
  margin-bottom: 8px;
  font-weight: 600;
}
```

- [ ] **Step 9: Write the e2e theme test**

`tests/e2e/theme.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
});

const bodyBackground = (page: import('@playwright/test').Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);

test('auto theme follows the system colour scheme', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/farm');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(await bodyBackground(page)).toBe('rgb(15, 29, 23)');
  await page.emulateMedia({ colorScheme: 'light' });
  expect(await bodyBackground(page)).toBe('rgb(244, 245, 239)');
});

test('a manual dark theme persists across reloads and overrides the system', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/farm');
  await page.getByRole('button', { name: 'Reading & sound' }).click();
  await page.getByRole('radio', { name: 'Dark', exact: true }).check();
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await bodyBackground(page)).toBe('rgb(15, 29, 23)');
});

test('an invalid stored theme falls back to auto', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'ritu-display-v1',
      JSON.stringify({ text: 'comfortable', motion: true, sound: false, theme: 'neon' }),
    ),
  );
  await page.goto('/farm');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
});
```

- [ ] **Step 10: Verify**

Run: `npm run format && npm run lint && npm run typecheck && npm test && npm run build`, then `npx playwright test tests/e2e/theme.spec.ts tests/e2e/reading.spec.ts tests/e2e/farm-audio.spec.ts`
Expected: all pass on both projects.

- [ ] **Step 11: Commit**

```bash
git add src/lib/display-store.ts src/lib/display-store.test.ts src/components/ui/theme-switch.tsx src/components/reading-controls.tsx src/app/layout.tsx src/styles/components.css tests/e2e/theme.spec.ts
git commit -m "Add light, dark and auto theme preference"
```

---

### Task 3: App frame (header, step progress, tab bar, footer, core controls)

**Files:**
- Create: `src/components/ui/step-progress.tsx`, `src/components/ui/bottom-tab-bar.tsx`
- Modify: `src/components/shell.tsx` (the JSX from line 66 to the end of the footer, plus imports)
- Modify: `src/components/reading-controls.tsx:59-62`, `src/components/tour-guide.tsx:113-119` (launch buttons only)
- Modify: `src/styles/layout.css`, `src/styles/components.css`

**Interfaces:**
- Consumes: tokens from Task 1; `ThemeSwitch` from Task 2 (already inside ReadingControls).
- Produces:
  - `export interface StepItem { href: string; label: string; icon: LucideIcon }`
  - `<StepProgress items={StepItem[]} path={string} />`
  - `<BottomTabBar items={StepItem[]} path={string} />`
  - CSS classes for later tasks: `.button`, `.button.primary`, `.button.secondary`, `.text-button`, `.icon-button`, `.card`, `.chip`, `.disclosure`, `.notice-amber`, `.page`, `.page-header`, `.page-header-actions`.

- [ ] **Step 1: Write a failing e2e check for the frame**

Create `tests/e2e/redesign.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('ritu-tour-v1', 'seen'));
});

test('the app frame shows the logo, four steps and the tools', async ({ page }, info) => {
  await page.goto('/farm');
  await expect(page.locator('.brand-chip img')).toBeVisible();
  const steps = page.getByRole('navigation', { name: 'Main navigation' });
  await expect(steps.getByRole('link')).toHaveCount(4);
  await expect(steps.getByRole('link', { name: 'Your farm' })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('button', { name: 'Take a tour', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reading & sound' })).toBeVisible();
  await expect(page.getByText('Saved on this device')).toBeVisible();
  const box = (await page.locator('.app-header').boundingBox())!;
  expect(box.height).toBeLessThanOrEqual(info.project.name === 'mobile' ? 64 : 80);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx playwright test tests/e2e/redesign.spec.ts`
Expected: FAIL. `.brand-chip img` does not exist yet.

- [ ] **Step 3: Create `src/components/ui/step-progress.tsx`**

```tsx
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export interface StepItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function StepProgress({
  items,
  path,
  label,
}: {
  items: StepItem[];
  path: string;
  label: string;
}) {
  const current = items.findIndex((item) => item.href === path);
  return (
    <nav className="step-progress" aria-label={label}>
      <ol>
        {items.map((item, index) => {
          const state = index === current ? 'current' : index < current ? 'done' : 'upcoming';
          return (
            <li key={item.href} className={`step ${state}`}>
              <Link
                className="nav-item"
                href={item.href}
                aria-current={state === 'current' ? 'page' : undefined}
              >
                <span className="step-dot" aria-hidden="true" />
                <span className="nav-text">
                  <strong>{item.label}</strong>
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
```

- [ ] **Step 4: Create `src/components/ui/bottom-tab-bar.tsx`**

```tsx
import Link from 'next/link';
import type { StepItem } from './step-progress';

export function BottomTabBar({
  items,
  path,
  label,
}: {
  items: StepItem[];
  path: string;
  label: string;
}) {
  return (
    <nav className="tab-bar" aria-label={label}>
      {items.map(({ href, label: text, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={`tab ${path === href ? 'current' : ''}`}
          aria-current={path === href ? 'page' : undefined}
        >
          <Icon size={22} aria-hidden="true" />
          <span className="nav-text">
            <strong>{text}</strong>
          </span>
        </Link>
      ))}
    </nav>
  );
}
```

Both navs share the accessible name "Main navigation" (`t('Main navigation', 'মূল নেভিগেশন')`, an existing string). CSS shows exactly one per breakpoint (`display: none` on the other), so only one is ever in the accessibility tree.

- [ ] **Step 5: Rewrite the Shell markup**

In `src/components/shell.tsx`:
- Keep the `nav` array, but drop the `detail` fields from the items, so each item is `{ href, label, icon }`.
- Keep the About dialog block (lines 172-233) unchanged.
- Imports: remove `ArrowUpRight`, `ChevronRight`, `MapPin`; add `CircleAlert`; add `import { StepProgress } from './ui/step-progress';` and `import { BottomTabBar } from './ui/bottom-tab-bar';`.
- Replace the returned JSX from `<div className={`app …`}>` through the closing `</footer>` with:

```tsx
    <div className={`app ${language === 'bn' ? 'bangla' : ''}`}>
      <a className="skip-link" href="#main">
        {t('Skip to content', 'মূল অংশে যান')}
      </a>
      <header className="app-header">
        <div className="app-header-inner">
          <Link className="brand" href="/" aria-label={t('Ritu home', 'ঋতু হোম')}>
            <span className="brand-chip">
              <Image
                className="brand-logo"
                src={rituLogo}
                alt="RITU · ঋতু"
                sizes="120px"
                loading="eager"
              />
            </span>
          </Link>
          <StepProgress items={nav} path={path} label={t('Main navigation', 'মূল নেভিগেশন')} />
          <div className="header-tools">
            <TourGuide />
            <ReadingControls />
            <div className="language-switch" role="group" aria-label={t('Language', 'ভাষা')}>
              <button onClick={() => setLanguage('en')} aria-pressed={language === 'en'}>
                EN
              </button>
              <button onClick={() => setLanguage('bn')} aria-pressed={language === 'bn'} lang="bn">
                বাংলা
              </button>
            </div>
            <button
              className="icon-button help-button"
              aria-label={t('About the data', 'তথ্য সম্পর্কে')}
              onClick={() => setModal('about')}
            >
              <CircleHelp size={20} />
            </button>
          </div>
        </div>
      </header>
      <main id="main" className="main-content" tabIndex={-1}>
        {ready ? (
          children
        ) : (
          <p role="status">{t('Loading your farm…', 'জমির তথ্য লোড হচ্ছে…')}</p>
        )}
      </main>
      <footer className="footer">
        <div className="footer-inner">
          <span className={`save-indicator ${saved ? '' : 'unsaved'}`}>
            <Check size={16} aria-hidden="true" />
            {!ready
              ? t('Loading your plan…', 'পরিকল্পনা লোড হচ্ছে…')
              : saved
                ? t('Saved on this device', 'এই ডিভাইসে সংরক্ষিত')
                : t(
                    'Storage unavailable — keep this tab open',
                    'সংরক্ষণ সম্ভব নয় — এই ট্যাব খোলা রাখুন',
                  )}
            <ResetDataControl compact />
          </span>
          <button className="preview-badge" onClick={() => setModal('about')}>
            <CircleAlert size={16} aria-hidden="true" />
            {t('Illustrative preview', 'উদাহরণভিত্তিক প্রিভিউ')}
          </button>
        </div>
      </footer>
      <BottomTabBar items={nav} path={path} label={t('Main navigation', 'মূল নেভিগেশন')} />
```

Notes:
- The footer badge reuses the existing string "Illustrative preview".
- `Earth`, `House`, `Layers3`, `Sprout`, `ClipboardCheck`, `CircleHelp` and `Check` stay imported. Remove `Sprout` only if lint reports it unused.
- `useState`, `usePlanner` and the `saved` computation stay.
- `/insights` is not one of the four steps. StepProgress then has no current step; mark Calendar as current there by passing `path === '/insights' ? '/plan' : path` to both navs.

- [ ] **Step 6: Make the two launch buttons responsive (names unchanged)**

In `src/components/reading-controls.tsx`, replace the launch button with:

```tsx
      <button
        className="button secondary tool-button reading-launch"
        aria-label={t('Reading & sound', 'পড়া ও শব্দ')}
        title={t('Reading & sound', 'পড়া ও শব্দ')}
        onClick={() => setOpen(true)}
      >
        <Settings2 size={20} aria-hidden="true" />
        <span className="tool-label">{t('Reading & sound', 'পড়া ও শব্দ')}</span>
      </button>
```

In `src/components/tour-guide.tsx`, replace the launch button with:

```tsx
      <button
        className="button secondary tool-button tour-launch"
        data-tour-launch
        aria-label={t('Take a tour', 'পরিচিতি দেখুন')}
        title={t('Take a tour', 'পরিচিতি দেখুন')}
        onClick={() => setChooser(true)}
      >
        <Compass size={20} aria-hidden="true" />
        <span className="tool-label">{t('Take a tour', 'পরিচিতি দেখুন')}</span>
      </button>
```

The visible label is the same text as the `aria-label`, so it satisfies WCAG 2.5.3 "label in name". Below 1024px the label is hidden and the icon-only button keeps the same accessible name.

- [ ] **Step 7: Write the layout CSS**

Fill `src/styles/layout.css` inside `@layer layout { … }`:

```css
.app {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}
.sidebar,
.topbar,
.breadcrumb,
.preview-tag {
  display: none;
}
.app-header {
  position: sticky;
  top: 0;
  z-index: var(--z-header);
  background: color-mix(in srgb, var(--color-bg) 92%, transparent);
  backdrop-filter: saturate(1.2) blur(10px);
  border-bottom: 1px solid var(--color-line);
}
.app-header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: var(--page-max);
  min-height: var(--header-h);
  margin: 0 auto;
  padding: 8px var(--gutter);
}
.brand {
  display: inline-flex;
  flex-shrink: 0;
  border-radius: var(--radius-control);
}
.brand-chip {
  display: inline-flex;
  padding: 3px 8px;
  border-radius: var(--radius-control);
  background: var(--logo-chip);
  box-shadow: var(--shadow-1);
}
.brand-logo {
  display: block;
  width: 104px;
  height: 52px;
  object-fit: cover;
}
.step-progress ol {
  display: flex;
  align-items: center;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
}
.step + .step::before {
  content: '';
  width: 28px;
  margin: 0 6px;
  border-top: 2px dashed var(--color-line);
}
.step {
  display: flex;
  align-items: center;
}
.step.done + .step::before,
.step.current::before {
  border-top-color: color-mix(in srgb, var(--color-primary) 55%, transparent);
}
.step .nav-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
  padding: 0 6px;
  border-radius: var(--radius-pill);
  color: var(--color-ink-muted);
  text-decoration: none;
}
.step .nav-text strong {
  font-size: 0.8rem;
  font-weight: 600;
}
.step-dot {
  width: 10px;
  height: 10px;
  border: 2px solid currentColor;
  border-radius: 50%;
}
.step.done .nav-item {
  color: var(--color-primary);
}
.step.done .step-dot {
  background: currentColor;
}
.step.current .nav-item {
  color: var(--color-ink);
}
.step.current .step-dot {
  border-color: var(--season-pre);
  background: var(--season-pre);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--season-pre) 28%, transparent);
}
.header-tools {
  display: flex;
  align-items: center;
  gap: 8px;
}
.language-switch {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  border-radius: var(--radius-pill);
  background: var(--color-soft);
}
.language-switch button {
  min-width: 44px;
  min-height: 40px;
  padding: 0 12px;
  border: 0;
  border-radius: var(--radius-pill);
  background: transparent;
  color: var(--color-ink);
  font-weight: 600;
  cursor: pointer;
}
.language-switch button[aria-pressed='true'] {
  background: var(--color-surface-raised);
  box-shadow: var(--shadow-1);
}
.main-content {
  flex: 1;
  width: 100%;
  max-width: var(--page-max);
  margin: 0 auto;
  padding: 32px var(--gutter) 48px;
  outline: none;
}
.footer {
  border-top: 1px solid var(--color-line);
}
.footer-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  max-width: var(--page-max);
  margin: 0 auto;
  padding: 16px var(--gutter);
  font-size: 0.8rem;
  color: var(--color-ink-muted);
}
.save-indicator {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}
.save-indicator.unsaved {
  color: var(--color-danger);
}
.preview-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 14px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-warn-bg);
  color: var(--color-warn-ink);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.tab-bar {
  display: none;
}
@media (max-width: 1023px) {
  .tool-button .tool-label {
    display: none;
  }
  .tool-button {
    width: 44px;
    padding: 0;
    justify-content: center;
  }
}
@media (max-width: 767px) {
  :root {
    --header-h: 56px;
    --tabbar-h: 68px;
    --gutter: 16px;
  }
  .step-progress {
    display: none;
  }
  .brand-logo {
    width: 80px;
    height: 40px;
  }
  .header-tools {
    gap: 6px;
  }
  .help-button {
    display: none;
  }
  .main-content {
    padding-top: 20px;
    padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 24px);
  }
  .footer {
    padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom));
  }
  .tab-bar {
    position: fixed;
    inset: auto 0 0;
    z-index: var(--z-tabbar);
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    padding: 6px 4px calc(6px + env(safe-area-inset-bottom));
    background: var(--color-surface-raised);
    border-top: 1px solid var(--color-line);
  }
  .tab {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 56px;
    color: var(--color-ink-muted);
    text-decoration: none;
  }
  .tab .nav-text strong {
    font-size: 0.8rem;
    font-weight: 600;
    text-align: center;
  }
  .tab.current {
    color: var(--color-primary);
  }
  .tab.current::before {
    content: '';
    position: absolute;
    top: -6px;
    width: 28px;
    height: 3px;
    border-radius: 2px;
    background: var(--season-pre);
  }
}
```

Two exceptions to the Global Constraints, both deliberate:
- About (?) is hidden on phones only; the footer `.preview-badge` opens the same dialog there.
- The `.tab .nav-text strong` label is 0.8rem, which is 16px at the 20px root and still meets the 16px floor. At 320px with "Extra large" text, labels such as "ক্যালেন্ডার" must wrap rather than clip: `overflow-wrap: anywhere` is inherited from `body`.

- [ ] **Step 8: Write the core control CSS**

Append inside `@layer components { … }` in `src/styles/components.css`:

```css
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  padding: 0 20px;
  border: 0;
  border-radius: var(--radius-pill);
  font-weight: 600;
  line-height: 1.2;
  text-align: center;
  text-decoration: none;
  cursor: pointer;
  transition: transform var(--dur-micro) var(--ease-out), opacity var(--dur-micro) var(--ease-out);
}
.button:active:not(:disabled) {
  transform: scale(0.98);
}
.button.primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
  box-shadow: 0 6px 16px color-mix(in srgb, var(--color-primary) 22%, transparent);
}
.button.secondary {
  background: var(--color-surface);
  color: var(--color-ink);
  box-shadow: inset 0 0 0 1.5px var(--color-line);
}
.button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}
.text-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 44px;
  padding: 0 4px;
  border: 0;
  background: none;
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 4px;
  cursor: pointer;
}
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 0;
  border-radius: 50%;
  background: var(--color-soft);
  color: var(--color-ink);
  cursor: pointer;
}
.card {
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-1);
  padding: 20px 22px;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  background: var(--color-soft);
  font-size: 0.8rem;
  font-weight: 600;
}
.notice-amber {
  display: flex;
  gap: 10px;
  align-items: flex-start;
  padding: 12px 16px;
  border-radius: var(--radius-control);
  background: var(--color-warn-bg);
  color: var(--color-warn-ink);
}
.notice-amber p {
  color: inherit;
}
.page {
  display: grid;
  gap: 20px;
  animation: page-enter var(--dur-enter) var(--ease-out);
}
.page-header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.page-header p {
  margin-top: 8px;
  max-width: 62ch;
}
.page-header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
@keyframes page-enter {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
.disclosure {
  border-radius: var(--radius-card);
  border: 1.5px dashed var(--color-line);
  background: transparent;
}
.disclosure > summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 56px;
  padding: 8px 18px;
  font-weight: 600;
  cursor: pointer;
  list-style: none;
}
.disclosure > summary::-webkit-details-marker {
  display: none;
}
.disclosure > summary::after {
  content: '';
  width: 10px;
  height: 10px;
  flex-shrink: 0;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg) translateY(-3px);
  transition: transform var(--dur-micro) var(--ease-out);
}
.disclosure[open] > summary::after {
  transform: rotate(225deg) translateY(-3px);
}
.disclosure[open] {
  border-style: solid;
  background: var(--color-surface);
}
.disclosure > :not(summary) {
  margin: 0 18px 18px;
}
select,
input:not([type='checkbox']):not([type='radio']):not([type='range']),
textarea {
  width: 100%;
  min-height: 48px;
  padding: 10px 14px;
  border: 1.5px solid transparent;
  border-radius: var(--radius-control);
  background: var(--color-soft);
  color: var(--color-ink);
  font-size: 1rem;
}
select:focus-visible,
input:focus-visible,
textarea:focus-visible {
  border-color: var(--color-focus);
  outline-offset: 1px;
}
input[type='checkbox'],
input[type='radio'] {
  accent-color: var(--color-primary);
  width: 22px;
  height: 22px;
}
.form-field {
  display: grid;
  gap: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--color-ink);
}
.field-error {
  color: var(--color-danger);
  font-weight: 500;
}
.dialog {
  width: min(560px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  padding: 0;
  border: 0;
  border-radius: var(--radius-card);
  background: var(--color-surface-raised);
  color: var(--color-ink);
  box-shadow: var(--shadow-2);
}
.dialog::backdrop {
  background: color-mix(in srgb, var(--color-bg) 40%, rgba(0, 0, 0, 0.55));
}
.dialog-body {
  display: grid;
  gap: 14px;
  padding: 24px;
}
.dialog-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.dialog .button-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}
@media (max-width: 767px) {
  .dialog {
    width: 100vw;
    max-width: 100vw;
    margin: auto 0 0;
    border-radius: var(--radius-card) var(--radius-card) 0 0;
  }
  .dialog-body {
    padding: 20px 16px calc(20px + env(safe-area-inset-bottom));
  }
}
```

- [ ] **Step 9: Verify**

Run: `npm run format && npm run lint && npm run typecheck && npm test && npm run build`
Then: `npx playwright test tests/e2e/redesign.spec.ts tests/e2e/reading.spec.ts tests/e2e/tours.spec.ts tests/e2e/tour-layout.spec.ts tests/e2e/motion.spec.ts`
Expected: all pass on both projects.

Also take screenshots of `/farm` at 1440×1000 and 390×844 and look at them. The header is one line, the step dots show Your farm as current, and on the phone the tab bar sits at the bottom.

- [ ] **Step 10: Commit**

```bash
git add src/components/ui src/components/shell.tsx src/components/reading-controls.tsx src/components/tour-guide.tsx src/styles tests/e2e/redesign.spec.ts
git commit -m "Replace sidebar with Golden Hour header, step progress and phone tab bar"
```

---

### Task 4: Year-wheel geometry (pure)

**Files:**
- Create: `src/domain/year-wheel.ts`
- Test: `src/domain/year-wheel.test.ts`

**Interfaces:**
- Consumes: `CropPeriod` from `src/domain/types.ts`; `coveredMonths` from `src/domain/evaluate.ts`.
- Produces:
  - `type SeasonIndex = 0 | 1 | 2`
  - `seasonOfMonth(month: number): SeasonIndex`
  - `polar(cx: number, cy: number, r: number, degrees: number): Point`
  - `ringSector(cx: number, cy: number, inner: number, outer: number, startMonth: number, months: number, gap?: number): string`
  - `interface WheelGeometry { size: number; center: number; inner: number; outer: number; labelRadius: number; monthRadius: number; hitInner: number; hitOuter: number }`
  - `const fullWheel: WheelGeometry`, `const miniWheel: WheelGeometry`
  - `interface WheelSegment { crop: CropId; start: number; duration: number; kind: 'crop' | 'rest'; season: SeasonIndex; path: string; labelPath: string; markerPoint: Point }`
  - `wheelSegments(periods: CropPeriod[], g: WheelGeometry, gap?: number): WheelSegment[]`
  - `progressSector(g: WheelGeometry, start: number, duration: number, fraction: number, gap?: number): string | null`
  - `monthHitPath(g: WheelGeometry, month: number): string`
  - `monthLabelPoint(g: WheelGeometry, month: number): Point`
  - `cropAtMonth(periods: CropPeriod[], month: number): CropPeriod | null`

- [ ] **Step 1: Write the failing tests**

`src/domain/year-wheel.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  cropAtMonth,
  fullWheel,
  miniWheel,
  monthHitPath,
  monthLabelPoint,
  polar,
  progressSector,
  ringSector,
  seasonOfMonth,
  wheelSegments,
} from './year-wheel';
import type { CropPeriod } from './types';

const plan: CropPeriod[] = [
  { crop: 'mung', start: 0, duration: 2 },
  { crop: 'fallow', start: 2, duration: 2 },
  { crop: 'aman', start: 4, duration: 4 },
  { crop: 'mustard', start: 8, duration: 3 },
  { crop: 'fallow', start: 11, duration: 1 },
];
const finite = (path: string) => !/NaN|Infinity/.test(path);

describe('seasonOfMonth', () => {
  it('maps Mar–Jun, Jul–Oct and Nov–Feb to the three seasons', () => {
    expect([0, 3, 4, 7, 8, 11].map(seasonOfMonth)).toEqual([0, 0, 1, 1, 2, 2]);
  });
  it('wraps months outside 0–11', () => {
    expect(seasonOfMonth(12)).toBe(0);
    expect(seasonOfMonth(-1)).toBe(2);
  });
});

describe('polar', () => {
  it('puts 0° at 12 o’clock and turns clockwise', () => {
    expect(polar(100, 100, 50, 0)).toEqual({ x: 100, y: 50 });
    expect(polar(100, 100, 50, 90)).toEqual({ x: 150, y: 100 });
    expect(polar(100, 100, 50, 180)).toEqual({ x: 100, y: 150 });
  });
});

describe('ringSector', () => {
  it('uses the large-arc flag only above 180°', () => {
    expect(ringSector(160, 160, 100, 130, 0, 6)).toContain(' 0 0 1 ');
    expect(ringSector(160, 160, 100, 130, 0, 7)).toContain(' 0 1 1 ');
  });
  it('never produces a degenerate full circle', () => {
    const path = ringSector(160, 160, 100, 130, 0, 12);
    expect(finite(path)).toBe(true);
    expect(path).toContain(' 0 1 1 ');
  });
});

describe('wheelSegments', () => {
  it('returns one segment per period with season and kind', () => {
    const segments = wheelSegments(plan, fullWheel);
    expect(segments.map((s) => [s.crop, s.kind, s.season])).toEqual([
      ['mung', 'crop', 0],
      ['fallow', 'rest', 0],
      ['aman', 'crop', 1],
      ['mustard', 'crop', 2],
      ['fallow', 'rest', 2],
    ]);
    expect(segments.every((s) => finite(s.path) && finite(s.labelPath))).toBe(true);
  });
  it('flips label paths on the lower half so text reads upright', () => {
    const [mung, , aman] = wheelSegments(plan, fullWheel);
    expect(mung.labelPath).toContain(' 0 0 1 ');
    expect(aman.labelPath).toContain(' 0 0 0 ');
  });
  it('handles a full-year rest, single-month crops, February starts and no periods', () => {
    expect(wheelSegments([{ crop: 'fallow', start: 0, duration: 12 }], miniWheel)).toHaveLength(1);
    const [feb] = wheelSegments([{ crop: 'mung', start: 11, duration: 1 }], fullWheel);
    expect(feb.season).toBe(2);
    expect(finite(feb.path)).toBe(true);
    expect(wheelSegments([], fullWheel)).toEqual([]);
  });
});

describe('progressSector', () => {
  it('is empty at 0 and covers the arc at 1', () => {
    expect(progressSector(fullWheel, 4, 4, 0)).toBeNull();
    expect(progressSector(fullWheel, 4, 4, 1)).toBe(ringSector(160, 160, 100, 130, 4, 4, 1.5));
  });
  it('clamps out-of-range fractions', () => {
    expect(progressSector(fullWheel, 4, 4, 2)).toBe(progressSector(fullWheel, 4, 4, 1));
    expect(progressSector(fullWheel, 4, 4, -1)).toBeNull();
  });
});

describe('month helpers', () => {
  it('builds a finite hit wedge and label point for each month', () => {
    for (let m = 0; m < 12; m++) {
      expect(finite(monthHitPath(fullWheel, m))).toBe(true);
      const p = monthLabelPoint(fullWheel, m);
      expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
    }
  });
  it('finds the period covering a month', () => {
    expect(cropAtMonth(plan, 1)?.crop).toBe('mung');
    expect(cropAtMonth(plan, 9)?.crop).toBe('mustard');
    expect(cropAtMonth([], 3)).toBeNull();
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/domain/year-wheel.test.ts`
Expected: FAIL with `Failed to resolve import "./year-wheel"`.

- [ ] **Step 3: Implement `src/domain/year-wheel.ts`**

```ts
import { coveredMonths } from './evaluate';
import type { CropId, CropPeriod } from './types';

/** Ritu's cycle starts in March: months 0–3 pre-monsoon, 4–7 monsoon, 8–11 winter. */
export type SeasonIndex = 0 | 1 | 2;
export const seasonOfMonth = (month: number): SeasonIndex =>
  Math.floor((((month % 12) + 12) % 12) / 4) as SeasonIndex;

export interface Point {
  x: number;
  y: number;
}
const round = (n: number) => Math.round(n * 100) / 100 + 0;

/** Degrees start at 12 o'clock and increase clockwise. */
export function polar(cx: number, cy: number, r: number, degrees: number): Point {
  const radians = (degrees * Math.PI) / 180;
  return { x: round(cx + r * Math.sin(radians)), y: round(cy - r * Math.cos(radians)) };
}

const MAX_SWEEP = 359.99;

/** Closed path for a ring sector covering `months` months from `startMonth`, inset `gap`° each end. */
export function ringSector(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  startMonth: number,
  months: number,
  gap = 0,
): string {
  const sweep = Math.min(MAX_SWEEP, Math.max(0.01, months * 30 - gap * 2));
  const a0 = startMonth * 30 + gap;
  const a1 = a0 + sweep;
  const large = sweep > 180 ? 1 : 0;
  const o0 = polar(cx, cy, outer, a0);
  const o1 = polar(cx, cy, outer, a1);
  const i1 = polar(cx, cy, inner, a1);
  const i0 = polar(cx, cy, inner, a0);
  return `M ${o0.x} ${o0.y} A ${outer} ${outer} 0 ${large} 1 ${o1.x} ${o1.y} L ${i1.x} ${i1.y} A ${inner} ${inner} 0 ${large} 0 ${i0.x} ${i0.y} Z`;
}

export interface WheelGeometry {
  size: number;
  center: number;
  inner: number;
  outer: number;
  labelRadius: number;
  monthRadius: number;
  hitInner: number;
  hitOuter: number;
}
export const fullWheel: WheelGeometry = {
  size: 320,
  center: 160,
  inner: 100,
  outer: 130,
  labelRadius: 142,
  monthRadius: 86,
  hitInner: 70,
  hitOuter: 158,
};
export const miniWheel: WheelGeometry = {
  size: 48,
  center: 24,
  inner: 13,
  outer: 22,
  labelRadius: 0,
  monthRadius: 0,
  hitInner: 0,
  hitOuter: 0,
};

export interface WheelSegment {
  crop: CropId;
  start: number;
  duration: number;
  kind: 'crop' | 'rest';
  season: SeasonIndex;
  path: string;
  /** Open arc for <textPath>; drawn counter-clockwise on the lower half so text stays upright. */
  labelPath: string;
  markerPoint: Point;
}

function labelArc(g: WheelGeometry, start: number, duration: number): string {
  const a0 = start * 30 + 2;
  const a1 = (start + duration) * 30 - 2;
  const mid = (a0 + a1) / 2;
  const flipped = mid > 90 && mid < 270;
  const sweep = Math.min(MAX_SWEEP, a1 - a0);
  const large = sweep > 180 ? 1 : 0;
  const r = flipped ? g.labelRadius + 6 : g.labelRadius;
  const from = polar(g.center, g.center, r, flipped ? a1 : a0);
  const to = polar(g.center, g.center, r, flipped ? a0 : a0 + sweep);
  return `M ${from.x} ${from.y} A ${r} ${r} 0 ${large} ${flipped ? 0 : 1} ${to.x} ${to.y}`;
}

export function wheelSegments(periods: CropPeriod[], g: WheelGeometry, gap = 1.5): WheelSegment[] {
  return [...periods]
    .sort((a, b) => a.start - b.start)
    .map((p) => ({
      crop: p.crop,
      start: p.start,
      duration: p.duration,
      kind: p.crop === 'fallow' ? 'rest' : 'crop',
      season: seasonOfMonth(p.start),
      path: ringSector(g.center, g.center, g.inner, g.outer, p.start, p.duration, gap),
      labelPath: labelArc(g, p.start, p.duration),
      markerPoint: polar(g.center, g.center, (g.inner + g.outer) / 2, (p.start + 0.5) * 30),
    }));
}

/** A crop arc filled to `fraction` (0–1) of its length, for tracking progress. */
export function progressSector(
  g: WheelGeometry,
  start: number,
  duration: number,
  fraction: number,
  gap = 1.5,
): string | null {
  const f = Math.max(0, Math.min(1, fraction));
  if (f === 0) return null;
  return ringSector(g.center, g.center, g.inner, g.outer, start, duration * f, gap);
}

/** Invisible wedge spanning the ring and its labels: the ≥44px tap target for one month. */
export function monthHitPath(g: WheelGeometry, month: number): string {
  return ringSector(g.center, g.center, g.hitInner, g.hitOuter, month, 1, 0);
}

export function monthLabelPoint(g: WheelGeometry, month: number): Point {
  return polar(g.center, g.center, g.monthRadius, (month + 0.5) * 30);
}

export function cropAtMonth(periods: CropPeriod[], month: number): CropPeriod | null {
  return periods.find((p) => coveredMonths(p).includes(month)) ?? null;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/domain/year-wheel.test.ts`
Expected: PASS (all 13).

If the `polar(…, 180)` expectation fails because of `-0`, keep the `+ 0` in `round`, which normalises `-0` to `0`.

- [ ] **Step 5: Verify and commit**

Run: `npm run format && npm run lint && npm run typecheck && npm test`

```bash
git add src/domain/year-wheel.ts src/domain/year-wheel.test.ts
git commit -m "Add year-wheel geometry for the Ritu season ring"
```

---

### Task 5: YearWheel component

**Files:**
- Create: `src/components/ui/year-wheel.tsx`
- Modify: `src/styles/year-wheel.css`
- Modify: `tests/e2e/redesign.spec.ts` (append a test)

**Interfaces:**
- Consumes: everything Task 4 produces; `months`, `previewData` from `src/data/preview.ts`; `activityKey` from `src/lib/journey-store.ts`; `usePlanner` (`t`, `language`).
- Produces:

```ts
export interface YearWheelProps {
  periods: CropPeriod[];
  label: string;                               // e.g. rotation name; used in the accessible summary
  size?: 'full' | 'mini';                      // default 'full'
  month?: number;                              // selected month, full only
  onSelectMonth?: (month: number) => void;     // makes months interactive when given
  progress?: Record<string, number>;           // activityKey(crop,start,duration) → 0..1 (Track)
}
export function YearWheel(props: YearWheelProps): JSX.Element
```

- [ ] **Step 1: Implement the component**

`src/components/ui/year-wheel.tsx`:

```tsx
'use client';
import { useId } from 'react';
import type { KeyboardEvent } from 'react';
import { months, previewData } from '../../data/preview';
import {
  cropAtMonth,
  fullWheel,
  miniWheel,
  monthHitPath,
  monthLabelPoint,
  progressSector,
  wheelSegments,
} from '../../domain/year-wheel';
import type { CropPeriod } from '../../domain/types';
import { activityKey } from '../../lib/journey-store';
import { usePlanner } from '../planner-provider';

export interface YearWheelProps {
  periods: CropPeriod[];
  label: string;
  size?: 'full' | 'mini';
  month?: number;
  onSelectMonth?: (month: number) => void;
  progress?: Record<string, number>;
}

export function YearWheel({
  periods,
  label,
  size = 'full',
  month,
  onSelectMonth,
  progress,
}: YearWheelProps) {
  const { t, language } = usePlanner();
  const id = useId().replace(/:/g, '');
  const g = size === 'mini' ? miniWheel : fullWheel;
  const segments = wheelSegments(periods, g);
  const name = (crop: CropPeriod['crop']) => previewData.crops[crop].name[language];
  const range = (s: { start: number; duration: number }) =>
    `${months[language][s.start]} → ${months[language][(s.start + s.duration - 1) % 12]}`;
  const summary = segments
    .filter((s) => s.kind === 'crop')
    .map((s) => `${name(s.crop)} ${range(s)}`)
    .join('; ');

  if (size === 'mini')
    return (
      <svg className="year-wheel mini" viewBox={`0 0 ${g.size} ${g.size}`} aria-hidden="true">
        <circle
          className="track"
          cx={g.center}
          cy={g.center}
          r={(g.inner + g.outer) / 2}
          strokeWidth={g.outer - g.inner}
        />
        {segments
          .filter((s) => s.kind === 'crop')
          .map((s) => (
            <path key={s.start} className={`arc season-${s.season}`} d={s.path} />
          ))}
      </svg>
    );

  const selected = month ?? null;
  const focus = selected === null ? null : cropAtMonth(periods, selected);
  const keyed = (m: number) => (event: KeyboardEvent<SVGPathElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelectMonth?.(m);
    }
  };

  return (
    <figure className="year-wheel full">
      <svg
        viewBox={`0 0 ${g.size} ${g.size}`}
        role="group"
        aria-label={`${label}: ${summary}`}
      >
        <defs>
          <pattern
            id={`rest-${id}`}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect className="rest-stripe" width="3" height="6" />
          </pattern>
        </defs>
        <circle
          className="track"
          cx={g.center}
          cy={g.center}
          r={(g.inner + g.outer) / 2}
          strokeWidth={g.outer - g.inner}
        />
        {segments.map((s) => {
          const fraction =
            progress && s.kind === 'crop'
              ? (progress[activityKey(s.crop, s.start, s.duration)] ?? 0)
              : null;
          const filled =
            fraction === null ? null : progressSector(g, s.start, s.duration, fraction);
          return (
            <g key={s.start} className={`segment ${s.kind}`}>
              <path
                className={`arc season-${s.season} ${fraction !== null ? 'pending' : ''}`}
                d={s.path}
                fill={s.kind === 'rest' ? `url(#rest-${id})` : undefined}
              />
              {filled && <path className={`arc season-${s.season}`} d={filled} />}
              {s.kind === 'crop' && (
                <>
                  <path id={`label-${id}-${s.start}`} d={s.labelPath} fill="none" />
                  <text className={`arc-label season-${s.season}`}>
                    <textPath href={`#label-${id}-${s.start}`} startOffset="50%" textAnchor="middle">
                      {name(s.crop)}
                    </textPath>
                  </text>
                </>
              )}
            </g>
          );
        })}
        {months[language].map((m, index) => {
          const p = monthLabelPoint(g, index);
          return (
            <text
              key={m}
              className={`month-label ${selected === index ? 'selected' : ''}`}
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
            >
              {m}
            </text>
          );
        })}
        {onSelectMonth &&
          months[language].map((m, index) => (
            <path
              key={`hit-${m}`}
              className="month-hit"
              d={monthHitPath(g, index)}
              role="button"
              tabIndex={0}
              aria-label={`${t('Year wheel', 'বছরের চক্র')}: ${m}`}
              aria-pressed={selected === index}
              onClick={() => onSelectMonth(index)}
              onKeyDown={keyed(index)}
            />
          ))}
        {selected !== null && (
          <circle
            className="month-marker"
            cx={monthLabelPoint({ ...g, monthRadius: (g.inner + g.outer) / 2 }, selected).x}
            cy={monthLabelPoint({ ...g, monthRadius: (g.inner + g.outer) / 2 }, selected).y}
            r="8"
          />
        )}
      </svg>
      {selected !== null && (
        <figcaption className="wheel-center" aria-live="polite">
          <span className="wheel-month">{months[language][selected]}</span>
          <strong>
            {focus && focus.crop !== 'fallow'
              ? name(focus.crop)
              : t('Planned rest / fallow', 'পরিকল্পিত বিরতি / পতিত')}
          </strong>
          {focus && <span className="wheel-range">{range(focus)}</span>}
        </figcaption>
      )}
    </figure>
  );
}
```

- [ ] **Step 2: Style it**

Fill `src/styles/year-wheel.css` inside `@layer components { … }`:

```css
.year-wheel.full {
  position: relative;
  width: 100%;
  max-width: 380px;
  margin: 0 auto;
}
.year-wheel svg,
svg.year-wheel {
  display: block;
  width: 100%;
  height: auto;
  overflow: visible;
}
svg.year-wheel.mini {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
}
.year-wheel .track {
  fill: none;
  stroke: var(--wheel-track);
}
.year-wheel .arc.season-0 {
  fill: var(--season-pre);
}
.year-wheel .arc.season-1 {
  fill: var(--season-mon);
}
.year-wheel .arc.season-2 {
  fill: var(--season-win);
}
.year-wheel .segment.rest .arc {
  fill-opacity: 1;
}
.year-wheel .rest-stripe {
  fill: var(--color-line);
}
.year-wheel .arc.pending {
  opacity: 0.28;
}
.year-wheel .arc-label {
  font-family: var(--font-ui);
  font-size: 11px;
  font-weight: 700;
}
.year-wheel .arc-label.season-0 {
  fill: var(--season-pre-text);
}
.year-wheel .arc-label.season-1 {
  fill: var(--season-mon-text);
}
.year-wheel .arc-label.season-2 {
  fill: var(--season-win-text);
}
.year-wheel .month-label {
  fill: var(--color-ink-muted);
  font-family: var(--font-ui);
  font-size: 10px;
  font-weight: 600;
}
.year-wheel .month-label.selected {
  fill: var(--color-ink);
  font-weight: 800;
}
.year-wheel .month-hit {
  fill: transparent;
  cursor: pointer;
  outline: none;
}
.year-wheel .month-hit:focus-visible {
  fill: color-mix(in srgb, var(--color-focus) 14%, transparent);
  stroke: var(--color-focus);
  stroke-width: 2;
}
.year-wheel .month-marker {
  fill: var(--color-surface-raised);
  stroke: var(--color-ink);
  stroke-width: 3;
  pointer-events: none;
}
.wheel-center {
  position: absolute;
  inset: 34% 24%;
  display: grid;
  place-content: center;
  gap: 2px;
  text-align: center;
  pointer-events: none;
}
.wheel-month {
  color: var(--color-accent);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.wheel-center strong {
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 500;
  line-height: 1.1;
}
.wheel-range {
  color: var(--color-ink-muted);
  font-size: 0.8rem;
}
@media (prefers-reduced-motion: no-preference) {
  html:not([data-motion='off']) .year-wheel.full .arc {
    animation: wheel-in 480ms var(--ease-out) both;
  }
}
@keyframes wheel-in {
  from {
    opacity: 0;
    transform: scale(0.94);
    transform-origin: center;
  }
}
```

The 11px SVG text is in viewBox units: the full wheel renders at 280 to 380px wide for a 320-unit box, so labels display at roughly 10 to 13px. Wheel text is a visual supplement. The same facts are given as ≥ 16px text in the season breakdown (Task 10) and the summary card (Task 9), and in the SVG's `aria-label`.

- [ ] **Step 3: Add the keyboard, reduced-motion and month-sync e2e test**

Append to `tests/e2e/redesign.spec.ts`:

```ts
import { chooseDefaultCrops } from './fixtures';

test('the year wheel is keyboard operable and stays in sync with the calendar month', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/farm');
  await chooseDefaultCrops(page);
  const april = page.getByRole('button', { name: 'Year wheel: Apr', exact: true });
  await april.focus();
  await page.keyboard.press('Enter');
  await expect(april).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Inspect month: Apr', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  const animation = await page
    .locator('.year-wheel.full .arc')
    .first()
    .evaluate((el) => getComputedStyle(el).animationName);
  expect(animation).toBe('none');
});
```

Keep the `chooseDefaultCrops` import at the top of the file with the other imports. This test passes only after Task 10 renders the wheel on `/plan`. Mark it `test.fixme` in this commit and remove `.fixme` in Task 10.

- [ ] **Step 4: Verify and commit**

Run: `npm run format && npm run lint && npm run typecheck && npm test && npm run build`

```bash
git add src/components/ui/year-wheel.tsx src/styles/year-wheel.css tests/e2e/redesign.spec.ts
git commit -m "Add the Ritu year wheel component"
```

---

### Task 6: ActionBar, SeasonChip, StatusPill and season coverage

**Files:**
- Create: `src/domain/season-coverage.ts`, `src/domain/season-coverage.test.ts`
- Create: `src/components/ui/action-bar.tsx`, `src/components/ui/season-chip.tsx`, `src/components/ui/status-pill.tsx`
- Modify: `src/styles/components.css`

**Interfaces:**
- Consumes: `DemoSuggestion` from `src/domain/demo-planner.ts`; `CropId`.
- Produces:
  - `type CoverageState = 'chosen' | 'missing' | 'unavailable'`
  - `seasonCoverage(suggestions: DemoSuggestion[], offered: DemoSuggestion[], preferred: CropId[]): [CoverageState, CoverageState, CoverageState]`
  - `<ActionBar sticky?: boolean status?: ReactNode className?: string tour?: string>{children}</ActionBar>`. It renders `<div className="action-bar …" data-tour={tour}>` with `.action-bar-status` and `.action-bar-actions`.
  - `<SeasonChip season={0|1|2} label={string} range={string} />`
  - `<StatusPill state={'checked'|'unassessed'|'conflict'}>{text}</StatusPill>`

- [ ] **Step 1: Write the failing coverage tests**

`src/domain/season-coverage.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { seasonCoverage } from './season-coverage';
import type { DemoSuggestion } from './demo-planner';

const suggestion = (crop: DemoSuggestion['period']['crop'], season: number): DemoSuggestion => ({
  season,
  period: { crop, start: season * 4, duration: 2 },
  assessment: {} as DemoSuggestion['assessment'],
});
const all = [suggestion('mung', 0), suggestion('aman', 1), suggestion('mustard', 2)];

describe('seasonCoverage', () => {
  it('marks every season chosen when each has a preferred offered crop', () => {
    expect(seasonCoverage(all, all, ['mung', 'aman', 'mustard'])).toEqual([
      'chosen',
      'chosen',
      'chosen',
    ]);
  });
  it('marks seasons without a preferred crop as missing', () => {
    expect(seasonCoverage(all, all, ['aman'])).toEqual(['missing', 'chosen', 'missing']);
  });
  it('marks seasons with no suggestion at all as unavailable, even if a crop is preferred', () => {
    const onlyMonsoon = [suggestion('aman', 1)];
    expect(seasonCoverage(onlyMonsoon, onlyMonsoon, ['aman', 'mung'])).toEqual([
      'unavailable',
      'chosen',
      'unavailable',
    ]);
  });
  it('ignores preferred crops that are not offered', () => {
    expect(seasonCoverage(all, [suggestion('aman', 1)], ['mung', 'aman'])).toEqual([
      'missing',
      'chosen',
      'missing',
    ]);
  });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `npx vitest run src/domain/season-coverage.test.ts`
Expected: FAIL with `Failed to resolve import "./season-coverage"`.

- [ ] **Step 3: Implement `src/domain/season-coverage.ts`**

```ts
import type { DemoSuggestion } from './demo-planner';
import type { CropId } from './types';

export type CoverageState = 'chosen' | 'missing' | 'unavailable';

/**
 * Per-season state for the Crops "Your year" tracker. It mirrors the existing `unavailable`
 * and `unselected` logic in SuggestedCropsView, so the tracker and the status message never disagree.
 */
export function seasonCoverage(
  suggestions: DemoSuggestion[],
  offered: DemoSuggestion[],
  preferred: CropId[],
): [CoverageState, CoverageState, CoverageState] {
  return [0, 1, 2].map((season) =>
    !suggestions.some((s) => s.season === season)
      ? 'unavailable'
      : offered.some((s) => s.season === season && preferred.includes(s.period.crop))
        ? 'chosen'
        : 'missing',
  ) as [CoverageState, CoverageState, CoverageState];
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/domain/season-coverage.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Create the three components**

`src/components/ui/action-bar.tsx`:

```tsx
import type { ReactNode } from 'react';

export function ActionBar({
  sticky = false,
  status,
  className = '',
  tour,
  children,
}: {
  sticky?: boolean;
  status?: ReactNode;
  className?: string;
  tour?: string;
  children: ReactNode;
}) {
  return (
    <div className={`action-bar ${sticky ? 'sticky' : ''} ${className}`} data-tour={tour}>
      {status && <div className="action-bar-status">{status}</div>}
      <div className="action-bar-actions">{children}</div>
    </div>
  );
}
```

`src/components/ui/season-chip.tsx`:

```tsx
import type { SeasonIndex } from '../../domain/year-wheel';

export function SeasonChip({
  season,
  label,
  range,
}: {
  season: SeasonIndex;
  label: string;
  range: string;
}) {
  return (
    <span className={`season-chip season-${season}`}>
      <span>{label}</span>
      <strong>{range}</strong>
    </span>
  );
}
```

`src/components/ui/status-pill.tsx`:

```tsx
import type { ReactNode } from 'react';
import { Check, CircleAlert, CircleHelp } from 'lucide-react';

export function StatusPill({
  state,
  children,
}: {
  state: 'checked' | 'unassessed' | 'conflict';
  children: ReactNode;
}) {
  const Icon = state === 'checked' ? Check : state === 'conflict' ? CircleAlert : CircleHelp;
  return (
    <span className={`status-pill ${state}`}>
      <Icon size={16} aria-hidden="true" />
      {children}
    </span>
  );
}
```

- [ ] **Step 6: Style them**

Append inside `@layer components { … }` in `src/styles/components.css`:

```css
.action-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 20px;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-1);
}
.action-bar.sticky {
  position: sticky;
  bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom) + 12px);
  z-index: var(--z-actionbar);
  background: color-mix(in srgb, var(--color-surface) 94%, transparent);
  backdrop-filter: blur(10px);
  box-shadow: var(--shadow-2);
}
.action-bar-status {
  flex: 1 1 260px;
  color: var(--color-ink-muted);
}
.action-bar-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.season-chip {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 12px;
  border-radius: var(--radius-control);
  font-size: 0.8rem;
  font-weight: 600;
}
.season-chip.season-0 {
  background: color-mix(in srgb, var(--season-pre) 14%, transparent);
  color: var(--season-pre-text);
}
.season-chip.season-1 {
  background: color-mix(in srgb, var(--season-mon) 14%, transparent);
  color: var(--season-mon-text);
}
.season-chip.season-2 {
  background: color-mix(in srgb, var(--season-win) 14%, transparent);
  color: var(--season-win-text);
}
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: 0.8rem;
  font-weight: 700;
}
.status-pill.checked {
  background: var(--color-success-bg);
  color: var(--color-success-ink);
}
.status-pill.unassessed {
  background: var(--color-warn-bg);
  color: var(--color-warn-ink);
}
.status-pill.conflict {
  background: color-mix(in srgb, var(--color-danger) 12%, transparent);
  color: var(--color-danger);
}
@media (max-width: 767px) {
  .action-bar.sticky .action-bar-actions,
  .action-bar.sticky .action-bar-actions > * {
    width: 100%;
  }
}
```

Season-chip text sits on a 14% tint of its own season colour over the surface. The reviewer checks these with the contrast script in Task 14; if any fail, the tint drops to 10%.

- [ ] **Step 7: Verify and commit**

Run: `npm run format && npm run lint && npm run typecheck && npm test && npm run build`

```bash
git add src/domain/season-coverage.ts src/domain/season-coverage.test.ts src/components/ui/action-bar.tsx src/components/ui/season-chip.tsx src/components/ui/status-pill.tsx src/styles/components.css
git commit -m "Add action bar, season chip, status pill and season coverage"
```

---

### Task 7: Farm page

**Files:**
- Modify: `src/components/farm-view.tsx` (the `FarmForm` JSX, lines 76-253)
- Modify: `src/styles/pages/farm.css`

**Interfaces:**
- Consumes: `ActionBar` (Task 6); classes `.page`, `.page-header`, `.card`, `.disclosure`, `.form-field`, `.button` (Task 3).
- Produces: nothing new. Keeps `.planner-heading`, `.form-grid`, `.soil-fields`, `.labor-months`, `.labor-control`, `.household-control`, `.priority-control`, `.water-control`, `.previous-crop-remove` and the `data-tour` values `farm-basics`, `farm-water-soil`, `farm-soil`, `farm-history`, `farm-continue`.

- [ ] **Step 1: Restructure the JSX**

In `FarmForm`:
1. The root `<div className="page-enter calm-page farm-page">` becomes `<div className="page farm-page">`.
2. The header becomes:
```tsx
      <header className="page-header planner-heading">
        <div>
          <h1>{t('Start with your farm', 'আপনার জমি দিয়ে শুরু করুন')}</h1>
          <p>{t('Tell us about soil and water.', 'মাটি ও পানির তথ্য দিন।')}</p>
        </div>
        <div className="page-header-actions">
          <ResetDataControl />
        </div>
      </header>
```
   The `STEP 1 OF 4 · YOUR FARM` eyebrow is removed (spec §5.1). Do not delete the string from other files.
3. `<section className="form-card" data-tour="farm-basics">` becomes `<section className="card form-card" data-tour="farm-basics">`. Do the same for the `farm-water-soil` section.
4. Wrap the two `<details className="disclosure">` elements in `<div className="farm-optional">…</div>` so CSS can place them side by side on desktop.
5. Replace the `<div className="farm-bottom-cta" data-tour="farm-continue">…</div>` block with:
```tsx
      <ActionBar
        sticky
        tour="farm-continue"
        className="farm-bottom-cta"
        status={
          missing ? (
            <p>
              {t(
                'Confirm soil, drainage and irrigation to receive suggestions. Unknown values are never guessed.',
                'ফসলের প্রস্তাব পেতে মাটি, নিষ্কাশন ও সেচ নিশ্চিত করুন। অজানা তথ্য অনুমান করা হয় না।',
              )}
            </p>
          ) : (
            <span className="required-meter" aria-hidden="true">
              <i className={farm.soil !== 'unknown' ? 'done' : ''} />
              <i className={farm.drainage !== 'unknown' ? 'done' : ''} />
              <i className={farm.irrigation !== 'unknown' ? 'done' : ''} />
            </span>
          )
        }
      >
        <button
          className="button primary"
          disabled={missing}
          onClick={/* the existing onClick body, unchanged */}
        >
          {t('See suggested crops', 'প্রস্তাবিত ফসল দেখুন')}
          <ArrowRight size={20} />
        </button>
      </ActionBar>
```
   Move the existing `onClick` arrow function body in verbatim. Add `import { ActionBar } from './ui/action-bar';`.

- [ ] **Step 2: Write the page CSS**

Fill `src/styles/pages/farm.css` inside `@layer pages { … }`:

```css
.farm-page .form-card {
  display: grid;
  gap: 16px;
}
.farm-page .form-card > h2 {
  font-size: 1.3rem;
}
.farm-page .form-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  gap: 14px;
}
.farm-page .soil-fields {
  grid-template-columns: 1fr 1fr;
}
.water-control {
  display: grid;
  gap: 8px;
  border: 0;
  margin: 0;
  padding: 0;
}
.water-control legend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  font-weight: 600;
}
.water-options {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}
.water-options label {
  position: relative;
  display: grid;
  gap: 2px;
  min-height: 72px;
  padding: 12px 14px;
  border-radius: var(--radius-control);
  background: var(--color-soft);
  color: var(--color-ink-muted);
  font-size: 0.8rem;
  cursor: pointer;
  transition: transform var(--dur-micro) var(--ease-out);
}
.water-options label strong,
.water-options label > span:first-of-type {
  color: var(--color-ink);
  font-size: 0.9rem;
  font-weight: 600;
}
.water-options input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  margin: 0;
  opacity: 0;
  cursor: pointer;
}
.water-options label.chosen {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.water-options label.chosen strong,
.water-options label.chosen > span:first-of-type {
  color: var(--color-on-primary);
}
.water-options label:has(input:focus-visible) {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}
.farm-optional {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  align-items: start;
}
.labor-months {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px;
}
.labor-months label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 44px;
  border-radius: var(--radius-pill);
  background: var(--color-soft);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.labor-months label.chosen {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.required-meter {
  display: inline-flex;
  gap: 6px;
}
.required-meter i {
  width: 22px;
  height: 6px;
  border-radius: 3px;
  background: var(--color-line);
}
.required-meter i.done {
  background: var(--color-primary);
}
@media (max-width: 1023px) {
  .water-options {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
  .farm-optional {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 767px) {
  .farm-page .form-grid,
  .farm-page .soil-fields {
    grid-template-columns: 1fr;
  }
  .water-options {
    grid-template-columns: 1fr 1fr;
  }
  .labor-months {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
```

Before relying on the `.water-options` label selectors, read `farm-controls.tsx:48-70` to confirm the inner markup of each tile. If the label text is wrapped differently, for example `<span><strong>…</strong><small>…</small></span>`, adjust the selectors to that structure. Do not change `farm-controls.tsx` JSX.

- [ ] **Step 3: Verify**

Run: `npm run format && npm run lint && npm run typecheck && npm test && npm run build`
Then: `npx playwright test tests/e2e/demo-planning.spec.ts tests/e2e/reading.spec.ts tests/e2e/tours.spec.ts tests/e2e/tour-layout.spec.ts tests/e2e/redesign.spec.ts`
Expected: all pass. Specifically, `demo-planning.spec.ts:360` finds "Reset all data" inside `.planner-heading` and focus returns to it.

Screenshot `/farm` at 1440, 390 and 320px, in English and Bangla, in light and dark, and check:
- the selected irrigation tile is solid green (ivory in dark);
- the sticky action bar never covers the last field when you scroll to the bottom;
- nothing overflows.

- [ ] **Step 4: Commit**

```bash
git add src/components/farm-view.tsx src/styles/pages/farm.css
git commit -m "Redesign the farm page with tile choices and a sticky action bar"
```

---

### Task 8: Crops page

**Files:**
- Modify: `src/components/journey-views.tsx` (`SuggestedCropsView`, lines 55-353)
- Modify: `src/styles/pages/crops.css`

**Interfaces:**
- Consumes: `seasonCoverage`, `SeasonChip`, `ActionBar` (Task 6); `.page`, `.page-header`, `.card`, `.chip` (Task 3).
- Produces: nothing new. Keeps `.suggested-crop`, `.catalogue-crop`, `.catalogue-controls`, `.calendar-actions > .button`, `data-tour` `suggestion-summary`, `suggested-crops`, `build-calendar`, the checkbox names "Consider <crop>", and every status string.

- [ ] **Step 1: Add the season filter state and coverage**

At the top of `SuggestedCropsView`, after `const router = useRouter();`, add:

```tsx
  const [filter, setFilter] = useState<'all' | 0 | 1 | 2>('all');
```

After `const unselected = …`, add:

```tsx
  const coverage = seasonCoverage(suggestions, offered, preferred);
  const visible = choices.filter(
    (id) => filter === 'all' || suggestions.some((s) => s.period.crop === id && s.season === filter),
  );
```

Add the imports: `import { seasonCoverage } from '../domain/season-coverage';`, `import { SeasonChip } from './ui/season-chip';`, `import { ActionBar } from './ui/action-bar';`, `import type { SeasonIndex } from '../domain/year-wheel';`.

- [ ] **Step 2: Restructure the JSX**

1. The root div becomes `<div className="page crops-page">`. The header becomes `<header className="page-header planner-heading">`, with the `STEP 2 OF 4` eyebrow removed and the h1, p and "Edit farm" link kept.
2. Remove the standalone `<p className="evidence-banner">` (No real data API…). Its text moves into the `suggestion-intro` section as that section's first paragraph, so it stays visible.
3. Restyle `<section className="suggestion-intro" data-tour="suggestion-summary">` as `className="suggestion-intro notice-amber"`, keeping all three paragraphs and the h2.
4. Insert the filter pills directly above `.suggested-crops`:
```tsx
      <div className="season-filter" role="group" aria-label={t('Season', 'মৌসুম')}>
        {(['all', 0, 1, 2] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`chip filter ${value === 'all' ? '' : `season-${value}`}`}
            aria-pressed={filter === value}
            onClick={() => setFilter(value)}
          >
            {value === 'all' ? t('All', 'সব') : seasons[value]}
          </button>
        ))}
      </div>
```
   "Season" (`t('Season', 'মৌসুম')`) is a new string. Add it to the Task 14 list of new strings for team review.
5. Map `visible` instead of `choices` for the cards. Inside each card, replace the `<ul className="suggested-windows">…</ul>` with:
```tsx
              <div className="suggested-windows">
                {best.map((s) => (
                  <SeasonChip
                    key={s.season}
                    season={s.season as SeasonIndex}
                    label={seasons[s.season]}
                    range={periodLabel(s.period, language)}
                  />
                ))}
              </div>
```
   Keep the `<label className="suggested-crop-choice">` with the real checkbox, the lock message and the `<details>` "Why suggested?" unchanged.
6. Inside `<section className="choice-panel" data-tour="build-calendar">`, add the tracker as the first child of its first inner `<div>`, above the h2:
```tsx
          <div className="year-tracker" aria-hidden="true">
            <span className="tracker-label">{t('Your year', 'আপনার বছর')}</span>
            {coverage.map((state, season) => (
              <span key={season} className={`tracker-slot ${state} season-${season}`}>
                {state === 'chosen' ? '✓ ' : state === 'missing' ? '+ ' : '– '}
                {seasons[season]}
              </span>
            ))}
          </div>
```
   The tracker is `aria-hidden` because the existing `role="status"` message right below it already announces the same facts in words. Keep the whole panel otherwise unchanged, including `.calendar-actions` and its buttons. It stays in normal flow (amendment 2). The ✓ + – characters are typographic marks, not emoji.

- [ ] **Step 3: Write the page CSS**

Fill `src/styles/pages/crops.css` inside `@layer pages { … }`:

```css
.crops-page .suggestion-intro {
  display: grid;
  gap: 6px;
}
.crops-page .suggestion-intro h2 {
  color: inherit;
  font-size: 1.1rem;
}
.season-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip.filter {
  min-height: 44px;
  padding: 0 16px;
  border: 0;
  background: var(--color-surface);
  box-shadow: inset 0 0 0 1.5px var(--color-line);
  color: var(--color-ink);
  cursor: pointer;
}
.chip.filter[aria-pressed='true'] {
  background: var(--color-ink);
  color: var(--color-bg);
  box-shadow: none;
}
.suggested-crops {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.suggested-crop {
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 16px 18px;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-1);
}
.suggested-crop.chosen {
  box-shadow: inset 0 0 0 2px var(--color-primary), var(--shadow-1);
}
.suggested-crop-choice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-direction: row-reverse;
  gap: 12px;
  min-height: 44px;
  cursor: pointer;
}
.suggested-crop-choice strong {
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 500;
}
.suggested-windows {
  display: grid;
  gap: 6px;
}
.suggested-crop details summary {
  min-height: 44px;
  display: flex;
  align-items: center;
  color: var(--color-ink-muted);
  font-size: 0.8rem;
  text-decoration: underline dotted;
  cursor: pointer;
}
.suggested-crop-lock {
  color: var(--color-warn-ink);
  font-size: 0.8rem;
}
.crops-page .choice-panel {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 18px;
  padding: 20px 22px;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-1);
}
.crops-page .choice-panel > div:first-child {
  flex: 1 1 340px;
  display: grid;
  gap: 8px;
}
.crops-page .calendar-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 16px;
}
.year-tracker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  font-weight: 600;
}
.tracker-label {
  color: var(--color-ink-muted);
}
.tracker-slot {
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  box-shadow: inset 0 0 0 1.5px var(--color-line);
  color: var(--color-ink-muted);
}
.tracker-slot.chosen.season-0 {
  background: color-mix(in srgb, var(--season-pre) 14%, transparent);
  color: var(--season-pre-text);
  box-shadow: none;
}
.tracker-slot.chosen.season-1 {
  background: color-mix(in srgb, var(--season-mon) 14%, transparent);
  color: var(--season-mon-text);
  box-shadow: none;
}
.tracker-slot.chosen.season-2 {
  background: color-mix(in srgb, var(--season-win) 14%, transparent);
  color: var(--season-win-text);
  box-shadow: none;
}
.tracker-slot.unavailable {
  text-decoration: line-through;
}
.crop-catalogue {
  border-radius: var(--radius-card);
}
.catalogue-crop {
  border-radius: var(--radius-control);
  background: var(--color-surface);
  box-shadow: var(--shadow-1);
}
@media (max-width: 1023px) {
  .suggested-crops {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 767px) {
  .suggested-crops {
    grid-template-columns: 1fr;
  }
}
```

Read `src/components/crop-catalogue.tsx` and port any layout rule you need for `.catalogue-browser`, `.catalogue-controls` and `.catalogue-results` from `src/styles/legacy.css` into this file, rewritten with tokens. Do not edit `legacy.css` itself.

- [ ] **Step 4: Verify**

Run: `npm run format && npm run lint && npm run typecheck && npm test && npm run build`
Then: `npx playwright test tests/e2e/crops.spec.ts tests/e2e/demo-planning.spec.ts tests/e2e/reading.spec.ts tests/e2e/tours.spec.ts tests/e2e/tour-layout.spec.ts`
Expected: all pass. That includes the `[data-tour="build-calendar"]` spacing check (`demo-planning.spec.ts:176-195`, buttons ≥ 48px tall and ≥ 15.5px apart) at 320px in Bangla with Extra large text.

- [ ] **Step 5: Commit**

```bash
git add src/components/journey-views.tsx src/styles/pages/crops.css
git commit -m "Redesign the crops page with season filters, chips and the year tracker"
```

---

### Task 9: Track page

Run this task after Task 8, by the same implementer on the same branch, since both edit `journey-views.tsx`.

**Files:**
- Modify: `src/components/journey-views.tsx` (`TrackingView`, from line 354 to the end)
- Modify: `src/styles/pages/track.css`

**Interfaces:**
- Consumes: `YearWheel` (Task 5), `.page`, `.card`, `.notice-amber` (Task 3).
- Produces: nothing new. Keeps `.tracking-crops > section` (one per crop), `data-tour` `tracking-calendar`, `tracking-progress` and `tracking-crops`, the `<progress>` named "Recorded task progress", and the Planted/Harvested checkbox rules.

- [ ] **Step 1: Restructure the JSX**

1. Empty state: replace the root `<div className="page-enter calm-page">` with `<div className="page track-page"><section className="card track-empty">…</section></div>`, keeping the h1, p and link inside.
2. Main state root becomes `<div className="page track-page">`, and the header becomes `<header className="page-header planner-heading">` without the eyebrow (keep h1, p and the "Review calendar options" link).
3. `<p className="evidence-banner">` becomes `<p className="notice-amber">`, and the stale `role="status"` note becomes `<p role="status" className="notice-amber">` (same text).
4. Replace the `tracking-progress` section with a summary card that also holds the wheel:
```tsx
      <section className="card track-summary" data-tour="tracking-progress">
        <YearWheel
          periods={tracked.rotation.periods}
          label={tracked.rotation.name[language]}
          progress={Object.fromEntries(
            Object.entries(tracked.records).map(([key, r]) => [
              key,
              (Number(r.planted) + Number(r.harvested)) / 2,
            ]),
          )}
        />
        <div className="track-summary-copy">
          <h2>{tracked.rotation.subtitle[language]}</h2>
          <p>
            {t('March', 'মার্চ')} {tracked.year} → {t('February', 'ফেব্রুয়ারি')}{' '}
            {tracked.year + 1}
          </p>
          <h3>{t('Your recorded progress', 'আপনার কাজের হিসাব')}</h3>
          <p>
            {completed} / {periods.length * 2}{' '}
            {t('planting and harvest tasks marked', 'রোপণ ও কাটার কাজ চিহ্নিত')}
          </p>
          <progress
            value={completed}
            max={periods.length * 2}
            aria-label={t('Recorded task progress', 'চিহ্নিত কাজের অগ্রগতি')}
          />
        </div>
      </section>
```
5. Keep the existing `tracking-calendar` section (timeline) below the summary, with its class changed to `card form-card`. Change its `<h2>` to `<h2 className="sr-only">`, because the summary card now shows the subtitle.
6. In each crop `<section className="form-card" …>` inside `.tracking-crops`:
   - change the class to `track-crop card season-${seasonOfMonth(period.start)}`;
   - wrap the two existing `<label>` checkboxes in `<div className="tracking-actions stepper">` (it already has `tracking-actions`; add `stepper`);
   - leave the Notes label and textarea in place, and add `placeholder={t('+ Add a note', '+ নোট যোগ করুন')}` to the textarea.

   Import `seasonOfMonth` from `../domain/year-wheel` and `YearWheel` from `./ui/year-wheel`.
7. The "Clear saved calendar & progress" button gets `className="text-button danger"`. The inline confirm block becomes `<div className="card notice-amber">`, with the same text and buttons.

- [ ] **Step 2: Write the page CSS**

Fill `src/styles/pages/track.css` inside `@layer pages { … }`:

```css
.track-summary {
  display: grid;
  grid-template-columns: minmax(200px, 300px) 1fr;
  align-items: center;
  gap: 24px;
}
.track-summary-copy {
  display: grid;
  gap: 6px;
}
.track-summary progress {
  width: 100%;
  height: 10px;
  appearance: none;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-soft);
  overflow: hidden;
}
.track-summary progress::-webkit-progress-bar {
  background: var(--color-soft);
}
.track-summary progress::-webkit-progress-value {
  background: var(--color-primary);
  border-radius: var(--radius-pill);
}
.track-summary progress::-moz-progress-bar {
  background: var(--color-primary);
}
.tracking-crops {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.track-crop {
  display: grid;
  align-content: start;
  gap: 10px;
  border-top: 5px solid var(--season-pre);
}
.track-crop.season-1 {
  border-top-color: var(--season-mon);
}
.track-crop.season-2 {
  border-top-color: var(--season-win);
}
.track-crop h2 {
  font-size: 1.3rem;
}
.stepper {
  display: flex;
  gap: 8px;
}
.stepper label {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  border-radius: var(--radius-control);
  background: var(--color-soft);
  font-weight: 600;
  cursor: pointer;
}
.stepper label:has(input:checked) {
  background: var(--color-primary);
  color: var(--color-on-primary);
}
.stepper label:has(input:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}
.track-crop textarea {
  min-height: 48px;
  resize: vertical;
}
.text-button.danger {
  color: var(--color-danger);
}
.track-empty {
  display: grid;
  gap: 12px;
  justify-items: start;
}
@media (max-width: 1023px) {
  .tracking-crops {
    grid-template-columns: 1fr 1fr;
  }
}
@media (max-width: 767px) {
  .track-summary,
  .tracking-crops {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 3: Add the degenerate-progress e2e test**

Append to `tests/e2e/redesign.spec.ts`:

```ts
import { seedPlan } from './fixtures';

test('track wheel renders at zero and full progress without broken paths', async ({ page }) => {
  await seedPlan(page);
  await page.goto('/plan');
  await page.getByRole('button', { name: 'Save calendar & track', exact: true }).click();
  await expect(page).toHaveURL('/track');
  const paths = () =>
    page.locator('.track-summary .year-wheel path').evaluateAll((els) =>
      els.map((el) => el.getAttribute('d') ?? ''),
    );
  expect((await paths()).some((d) => /NaN|Infinity/.test(d))).toBe(false);
  for (const crop of await page.locator('.tracking-crops > section').all()) {
    await crop.getByRole('checkbox', { name: 'Planted' }).check();
    await crop.getByRole('checkbox', { name: 'Harvested' }).check();
  }
  await expect(page.getByText(/6 \/ 6/)).toBeVisible();
  expect((await paths()).some((d) => /NaN|Infinity/.test(d))).toBe(false);
});
```

Merge the new import with the existing `./fixtures` import line. Before running, confirm that the checkbox accessible names in `TrackingView` are "Planted" and "Harvested".

- [ ] **Step 4: Verify**

Run: `npm run format && npm run lint && npm run typecheck && npm test && npm run build`
Then: `npx playwright test tests/e2e/planner.spec.ts tests/e2e/demo-planning.spec.ts tests/e2e/redesign.spec.ts tests/e2e/tours.spec.ts tests/e2e/tour-layout.spec.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/journey-views.tsx src/styles/pages/track.css tests/e2e/redesign.spec.ts
git commit -m "Redesign tracking with a progress wheel and planted-harvested steppers"
```

---

### Task 10: Calendar page and the 3D stage

**Files:**
- Modify: `src/components/compare-view.tsx` (JSX only)
- Modify: `src/components/season-explorer.tsx` (add the class `field-stage` to the outer section only)
- Modify: `src/components/field-scene.ts:52` (clear colour only)
- Modify: `src/styles/pages/calendar.css`
- Modify: `tests/e2e/redesign.spec.ts` (remove `.fixme` from the Task 5 test)

**Interfaces:**
- Consumes: `YearWheel` (Task 5), `ActionBar`, `SeasonChip`, `StatusPill` (Task 6), `usePlanner().month` / `setMonth` (existing), `seasonOfMonth`.
- Produces: nothing new. Keeps `.option-card`, `.option-card-select`, `.option-card .status.confirm`, `.demo-card-result`, `.choice-summary .button`, `.calendar-board` (with `.rotation-row`, `.timeline`, `.crop-bar`, `.calendar-scroll`), `#rotations`, `#scenario-simulator`, `#field`, `data-tour` `save-calendar` and `field-months`, and the link "Try a water-shortage scenario".

- [ ] **Step 1: Restructure `CompareView`**

1. The root becomes `<div className="page calendar-page">`. The header becomes `<header className="page-header planner-heading">` with the eyebrow removed and this h1:
```tsx
          <h1>
            {language === 'en' ? (
              <>
                Choose your <em>automatic calendar</em>
              </>
            ) : (
              t('Choose your automatic calendar', 'স্বয়ংক্রিয় ক্যালেন্ডার বাছুন')
            )}
          </h1>
```
   The italic split is English-only. Bangla keeps the existing string unsplit.

   `.planner-actions` buttons keep their content, now both `button secondary` (the 3D button already is). Add `explore-3d` to the 3D button's className.
2. Inside each `.option-card`, insert a mini wheel as the first child of the `.option-card-select` button:
```tsx
              <YearWheel
                size="mini"
                periods={evaluation.rotation.periods}
                label={evaluation.rotation.name[language]}
              />
```
3. After `.rotation-picker`, insert the understand zone:
```tsx
      <section className="understand" aria-label={selected.rotation.name[language]}>
        <div className="card wheel-card">
          <YearWheel
            periods={selected.rotation.periods}
            label={selected.rotation.name[language]}
            month={month}
            onSelectMonth={setMonth}
          />
        </div>
        <div className="season-breakdown">
          {selected.rotation.periods.map((p) =>
            p.crop === 'fallow' ? (
              <p key={p.start} className="rest-row">
                <i aria-hidden="true" />
                {periodLabel(p, language)} · {t('Planned rest / fallow', 'পরিকল্পিত বিরতি / পতিত')}
              </p>
            ) : (
              <div key={p.start} className={`season-row card season-${seasonOfMonth(p.start)}`}>
                <div>
                  <span className="season-row-label">{seasons[seasonOfMonth(p.start)]}</span>
                  <strong>{previewData.crops[p.crop].name[language]}</strong>
                </div>
                <span className="season-row-range">
                  {periodLabel(p, language)}
                  <small>
                    {p.duration} {t('months', 'মাস')}
                  </small>
                </span>
              </div>
            ),
          )}
        </div>
      </section>
```
   Add `month` and `setMonth` to the `usePlanner()` destructure. Define `const seasons = [t('Pre-monsoon', 'প্রাক্‌বর্ষা'), t('Monsoon', 'বর্ষা'), t('Winter', 'শীত')];` (same strings as Crops). Import `periodLabel` from `./journey-views`, `previewData` from `../data/preview`, `seasonOfMonth` from `../domain/year-wheel` and `YearWheel` from `./ui/year-wheel`.
4. The `choice-summary` panel, `demo-next-actions` and the `#rotations` details all stay, in that order, after `.understand`. `#rotations` keeps `open`.
5. Replace the `save-calendar` `<section className="choice-panel" …>` with an `ActionBar`. Keep the label and input, the explanatory paragraph as `<small>`, the button, its onClick and the confirm dialog exactly:
```tsx
      <ActionBar
        sticky
        tour="save-calendar"
        className="save-bar"
        status={
          <label className="form-field year-field">
            {t('Cycle starts in March of', 'চক্র শুরু হবে মার্চে, বছর')}
            <input
              type="number"
              min={2000}
              max={2100}
              value={year}
              aria-invalid={!validYear}
              onChange={(e) => setYear(e.target.value)}
            />
            <small>
              {t(
                'The year labels the saved cycle; it does not change the climate or assigned planting windows.',
                'বছর চক্রের নাম; জলবায়ু বা সময় বদলায় না।',
              )}
            </small>
          </label>
        }
      >
        {/* existing Save calendar & track button, unchanged */}
      </ActionBar>
```
   Import `ActionBar` from `./ui/action-bar`.

   Move the `ScenarioSimulator` and `SeasonExplorer` so they render **before** the ActionBar. Final order: header → plans → understand → choice-summary → next actions → #rotations → ScenarioSimulator → SeasonExplorer → ActionBar → confirm dialog.

- [ ] **Step 2: The 3D stage hooks**

- `src/components/season-explorer.tsx`: on the outermost `<section>` (the one with `className="season-explorer …"` and `aria-label="Seasonal field explorer"`), append ` field-stage` to the className. No other change.
- `src/components/field-scene.ts:52`: `renderer.setClearColor('#f6f8fa');` → `renderer.setClearColor('#0b3a28');` and add the comment `// Matches --stage-bg (light); the dark stage edge comes from CSS.` Geometry, materials, lights and camera are untouched.

- [ ] **Step 3: Write the page CSS**

Fill `src/styles/pages/calendar.css` inside `@layer pages { … }`:

```css
.calendar-page .explore-3d {
  background: var(--stage-bg);
  color: var(--stage-ink);
  box-shadow: inset 0 0 0 1px var(--stage-line);
}
.rotation-picker {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}
.option-card {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-1);
}
.option-card.selected {
  box-shadow: inset 0 0 0 2px var(--color-primary), var(--shadow-1);
}
.option-card-select {
  display: grid;
  grid-template-columns: 48px 1fr;
  grid-template-rows: auto auto;
  column-gap: 12px;
  align-items: center;
  min-height: 56px;
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-ink);
  text-align: left;
  cursor: pointer;
}
.option-card-select .year-wheel {
  grid-row: 1 / span 2;
}
.option-card-select .option-selection-mark {
  display: none;
}
.option-card-select span:last-child {
  color: var(--color-ink-muted);
  font-size: 0.8rem;
}
.status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  font-size: 0.8rem;
  font-weight: 700;
}
.status.confirm {
  background: var(--color-warn-bg);
  color: var(--color-warn-ink);
}
.status.passes {
  background: var(--color-success-bg);
  color: var(--color-success-ink);
}
.status.blocked {
  background: color-mix(in srgb, var(--color-danger) 12%, transparent);
  color: var(--color-danger);
}
.demo-card-result {
  font-size: 0.8rem;
}
.understand {
  display: grid;
  grid-template-columns: minmax(260px, 380px) 1fr;
  gap: 18px;
  align-items: start;
}
.wheel-card {
  padding: 14px;
}
.season-breakdown {
  display: grid;
  gap: 10px;
}
.season-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-left: 6px solid var(--season-pre);
}
.season-row.season-1 {
  border-left-color: var(--season-mon);
}
.season-row.season-2 {
  border-left-color: var(--season-win);
}
.season-row strong {
  display: block;
  font-family: var(--font-display);
  font-size: 1.3rem;
  font-weight: 500;
}
.season-row-label {
  color: var(--color-ink-muted);
  font-size: 0.8rem;
  font-weight: 600;
}
.season-row-range {
  display: grid;
  text-align: right;
  font-weight: 600;
}
.season-row.season-0 .season-row-range {
  color: var(--season-pre-text);
}
.season-row.season-1 .season-row-range {
  color: var(--season-mon-text);
}
.season-row.season-2 .season-row-range {
  color: var(--season-win-text);
}
.season-row-range small {
  color: var(--color-ink-muted);
  font-weight: 500;
}
.rest-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 0.8rem;
}
.rest-row i {
  width: 26px;
  height: 8px;
  border-radius: 4px;
  background: repeating-linear-gradient(45deg, var(--color-line) 0 3px, transparent 3px 6px);
  box-shadow: inset 0 0 0 1px var(--color-line);
}
.choice-summary {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 22px;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-1);
}
.demo-next-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}
.calendar-board {
  display: grid;
  gap: 12px;
}
.crop-bar {
  border-radius: var(--radius-control);
  font-size: 0.8rem;
}
.save-bar .year-field {
  max-width: 420px;
}
.save-bar .year-field input {
  max-width: 160px;
}
.field-stage {
  border-radius: var(--radius-card);
  background: radial-gradient(ellipse 80% 70% at 30% 0%, color-mix(in srgb, var(--stage-bg) 70%, #1d7a55), var(--stage-bg) 70%);
  color: var(--stage-ink);
  box-shadow: inset 0 0 0 1px var(--stage-line);
  padding: 20px;
}
.field-stage h2,
.field-stage h3,
.field-stage strong {
  color: var(--stage-ink);
}
.field-stage p,
.field-stage small,
.field-stage .field-model-note {
  color: var(--stage-muted);
}
.field-stage .eyebrow {
  color: var(--stage-accent);
}
.field-stage .button.secondary,
.field-stage .field-view-tabs button,
.field-stage .month-navigation button {
  background: color-mix(in srgb, var(--stage-ink) 10%, transparent);
  color: var(--stage-ink);
  box-shadow: inset 0 0 0 1px var(--stage-line);
}
.field-stage .field-view-tabs button[aria-pressed='true'] {
  background: var(--stage-ink);
  color: var(--stage-bg);
}
.field-stage select {
  background: color-mix(in srgb, var(--stage-ink) 10%, transparent);
  color: var(--stage-ink);
}
.field-stage .field-viewport {
  border-radius: var(--radius-card);
  overflow: hidden;
  box-shadow: inset 0 0 0 1px var(--stage-line);
}
.field-stage .field-camera-controls {
  border-radius: var(--radius-control);
  background: color-mix(in srgb, var(--stage-bg) 60%, transparent);
  backdrop-filter: blur(8px);
  box-shadow: inset 0 0 0 1px var(--stage-line);
}
@media (prefers-reduced-transparency: reduce) {
  .field-stage .field-camera-controls,
  .action-bar.sticky {
    background: var(--stage-bg);
    backdrop-filter: none;
  }
  .action-bar.sticky {
    background: var(--color-surface);
  }
}
.field-stage .month-water,
.field-stage .month-warning {
  border-radius: var(--radius-control);
  background: color-mix(in srgb, var(--stage-accent) 12%, transparent);
  color: var(--stage-ink);
}
@media (max-width: 1023px) {
  .rotation-picker,
  .understand {
    grid-template-columns: 1fr;
  }
}
```

Read `season-explorer.tsx` and `field-viewport.tsx`, and port the layout rules for `.explorer-layout`, `.explorer-heading`, `.explorer-months`, `.explorer-selection`, `.month-detail`, `.month-activity`, `.field-figure`, `.field-canvas`, `.field-fallback`, `.field-orbit-toggle` and `.field-camera-controls` from `src/styles/legacy.css` into this file inside `.field-stage`, rewritten with tokens. Keep `.month-activity small` at least 0.8rem and `.explorer-selection select` at least 1rem (both are tested). Do not edit `legacy.css` itself.

- [ ] **Step 4: Un-fixme and run the wheel test**

In `tests/e2e/redesign.spec.ts`, change `test.fixme(` back to `test(` for "the year wheel is keyboard operable…".

- [ ] **Step 5: Verify**

Run: `npm run format && npm run lint && npm run typecheck && npm test && npm run build`
Then: `npx playwright test tests/e2e/planner.spec.ts tests/e2e/demo-planning.spec.ts tests/e2e/motion.spec.ts tests/e2e/redesign.spec.ts tests/e2e/tours.spec.ts tests/e2e/tour-layout.spec.ts tests/e2e/reading.spec.ts`
Expected: all pass on both projects. That includes the canvas screenshot comparisons in `planner.spec.ts:120-135` and `:195-202`, which compare frames to each other rather than to fixed colours.

Screenshot `/plan` with the field view open at 1440 and 390px in light and dark. Check that the stage looks deep green in both themes, that its text is legible, and that the sticky save bar does not cover the explorer controls when scrolled.

- [ ] **Step 6: Commit**

```bash
git add src/components/compare-view.tsx src/components/season-explorer.tsx src/components/field-scene.ts src/styles/pages/calendar.css tests/e2e/redesign.spec.ts
git commit -m "Redesign the calendar page with the year wheel and a deep-green 3D stage"
```

---

### Task 11: Insights page

**Files:**
- Modify: `src/components/insights-view.tsx` (JSX only)
- Modify: `src/styles/pages/insights.css`

**Interfaces:**
- Consumes: `StatusPill` (Task 6), `.page`, `.card`, `.disclosure` (Task 3).
- Produces: nothing new. Keeps `.missing-card`, `.check-row` / `.check-disclosure` details, `.model-references`, every string, and the link names "Back to comparison" and "Review my farm inputs".

- [ ] **Step 1: Restructure the JSX**

1. Root `<div className="page insights-page">`. Header `<header className="page-header">`, with the `3 · REVIEW THE REASONS` eyebrow removed and the h1, p and back link kept.
2. Wrap `.insight-summary` together with `<DemoPlanReasons …/>` in `<div className="insights-grid">`. The `.checks-card` section moves into that grid as its second column: grid order is summary + reasons on the left, checks on the right.
3. Inside `.checks-card`, replace the `<span>{…state text…}</span>` in each `<summary>` with:
```tsx
                <StatusPill
                  state={check.state === 'pass' ? 'checked' : check.state === 'block' ? 'conflict' : 'unassessed'}
                >
                  {check.state === 'pass'
                    ? t('Entry checked', 'তথ্য মিলেছে')
                    : check.state === 'block'
                      ? t('Conflict', 'সংঘাত')
                      : t('Not assessed', 'যাচাই বাকি')}
                </StatusPill>
```
   and remove the leading `<Icon size={20} />` (the pill carries the icon). Remove the now-unused icon imports only if lint flags them.
4. `.next-step-card` gets the extra class `adviser-banner`.
5. Wrap the four `<details className="disclosure">` in `<div className="insights-more">…</div>`.

- [ ] **Step 2: Write the page CSS**

Fill `src/styles/pages/insights.css` inside `@layer pages { … }`:

```css
.option-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.option-tabs button {
  min-height: 44px;
  padding: 0 16px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--color-surface);
  box-shadow: inset 0 0 0 1.5px var(--color-line);
  color: var(--color-ink);
  font-weight: 600;
  cursor: pointer;
}
.option-tabs button[aria-pressed='true'] {
  background: var(--color-ink);
  color: var(--color-bg);
  box-shadow: none;
}
.insights-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
}
.insights-grid > :first-child,
.insights-grid > .demo-reasons {
  grid-column: 1;
}
.insights-grid > .checks-card {
  grid-column: 2;
  grid-row: 1 / span 2;
}
.insight-summary,
.checks-card,
.demo-reasons {
  padding: 20px 22px;
  border-radius: var(--radius-card);
  background: var(--color-surface);
  box-shadow: var(--shadow-1);
}
.insight-summary h2 {
  font-size: 1.6rem;
}
.check-row > summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 52px;
  border-bottom: 1px solid var(--color-line);
  cursor: pointer;
  list-style: none;
}
.check-row > summary::-webkit-details-marker {
  display: none;
}
.demo-metrics {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}
.demo-metrics > * {
  padding: 12px 14px;
  border-radius: var(--radius-control);
  background: var(--color-soft);
}
.adviser-banner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 20px 22px;
  border-radius: var(--radius-card);
  background: var(--stage-bg);
  color: var(--stage-ink);
}
.adviser-banner h2 {
  color: var(--stage-ink);
}
.adviser-banner p {
  color: var(--stage-muted);
}
.adviser-banner .button.primary {
  background: var(--stage-ink);
  color: var(--stage-bg);
}
.insights-more {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  align-items: start;
}
@media (max-width: 1023px) {
  .insights-grid,
  .insights-more {
    grid-template-columns: 1fr;
  }
  .insights-grid > .checks-card {
    grid-column: 1;
    grid-row: auto;
  }
}
@media (max-width: 767px) {
  .demo-metrics {
    grid-template-columns: 1fr;
  }
}
```

Read `demo-planning.tsx` (`DemoPlanReasons`) and port the remaining needed rules for `.demo-reasons`, `.demo-check`, `.demo-label` and `.demo-section-heading` from `legacy.css` into this file with tokens. The metric value is shown as text only: if `DemoPlanReasons` renders any bar with a background track, hide the track (`background: none`) and keep the fill as a short inline mark (design rule). Do not change `demo-planning.tsx` JSX.

- [ ] **Step 3: Verify**

Run: `npm run format && npm run lint && npm run typecheck && npm test && npm run build`
Then: `npx playwright test tests/e2e/demo-planning.spec.ts tests/e2e/reading.spec.ts tests/e2e/tours.spec.ts`
Expected: all pass. That includes the axe scan of `/insights` with every `details` open (`reading.spec.ts:98-112`).

- [ ] **Step 4: Commit**

```bash
git add src/components/insights-view.tsx src/styles/pages/insights.css
git commit -m "Redesign insights as a scorecard with status pills"
```

---

### Task 12: Tour, scenario simulator, dialogs, 404 and error pages

**Files:**
- Modify: `src/styles/pages/tour.css`
- Modify: `src/styles/pages/calendar.css` (append the scenario simulator styles)
- Modify: `src/app/not-found.tsx`, `src/app/error.tsx` (class names only)

**Interfaces:**
- Consumes: tokens and components.
- Produces: nothing new. Keeps `.tour-card`, `.tour-card-actions`, `.tour-dialog`, `.tour-spotlight`, `.stream-word`, `#tour-title`, `#tour-description .sr-only` and `[data-tour-layout]` behaviour.

- [ ] **Step 1: Port and restyle the tour**

Read `src/components/tour-guide.tsx` and the two tour sections of `src/styles/legacy.css`: the block that starts with the comment `/* Guided missions use the native modal top layer` and the one that starts with `/* A reserved guide rail prevents tour instructions`.

Copy every rule from those sections into `src/styles/pages/tour.css` inside `@layer pages { … }`. Change only colours, radii, shadows and fonts to tokens:
- card background `var(--color-surface-raised)`, radius `var(--radius-card)`, shadow `var(--shadow-2)`;
- primary buttons use `.button.primary`;
- the spotlight ring is `0 0 0 4px var(--season-pre)`;
- the dimming shade is `color-mix(in srgb, var(--color-bg) 30%, rgba(0, 0, 0, 0.55))`.

Keep every size, position, `z-index` relationship and media query from the legacy rules, because `tour-layout.spec.ts` measures them. Use `var(--z-tour)` as the base layer for the tour, and add the legacy offsets on top of it.

- [ ] **Step 2: Scenario simulator**

Append to `src/styles/pages/calendar.css` inside `@layer pages { … }`:
- `.scenario-simulator` (the `details#scenario-simulator`) gets the `.disclosure` look;
- `.demo-simulator`, `.scenario-comparison` and `.demo-table-scroll` are ported from legacy with tokens.

`.demo-table-scroll` must keep its own horizontal scroll (`overflow-x: auto`), so the document never overflows at 320px.

- [ ] **Step 3: 404 and error pages**

In both files, change `<div className="page-heading">` to `<div className="page"><section className="card not-found">`, close the new elements correctly, and keep all text and links. In `not-found.tsx`, remove the `PAGE NOT FOUND` eyebrow span. Its text is not referenced by tests; confirm with `grep -rn "PAGE NOT FOUND" tests src`. If a test references it, keep the span.

- [ ] **Step 4: Verify**

Run: `npm run format && npm run lint && npm run typecheck && npm test && npm run build`
Then: `npx playwright test tests/e2e/tours.spec.ts tests/e2e/tour-layout.spec.ts tests/e2e/motion.spec.ts tests/e2e/demo-planning.spec.ts`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/styles/pages/tour.css src/styles/pages/calendar.css src/app/not-found.tsx src/app/error.tsx
git commit -m "Restyle the tour, scenario simulator and fallback pages"
```

---

### Task 13: Retire the legacy layer

**Files:**
- Delete: `src/styles/legacy.css`
- Modify: `src/app/layout.tsx` (remove its import), `src/app/globals.css` (remove `legacy` from the layer list)
- Modify: whichever `src/styles/**/*.css` files need rules ported

**Interfaces:** none.

- [ ] **Step 1: Find the classes still styled only by legacy**

```bash
grep -rhoE 'className=\{?[`"][^`"]*[`"]' src/components src/app | grep -oE '[a-z][a-z0-9-]+' | sort -u > /tmp/used-classes.txt
grep -hoE '\.[a-z][a-z0-9-]+' src/styles/tokens.css src/styles/base.css src/styles/layout.css src/styles/components.css src/styles/year-wheel.css src/styles/pages/*.css | tr -d . | sort -u > /tmp/new-classes.txt
comm -23 /tmp/used-classes.txt /tmp/new-classes.txt
```

Expected: a list of classes used in components that have no rule in the new CSS. For each one, read its legacy rule. If the element still needs that styling, port the rule, rewritten with tokens, into the CSS file of the owning page or component. If it doesn't, leave it unstyled; examples are `calm-page` and `page-enter`, which are replaced by `.page`, and dead classes.

- [ ] **Step 2: Remove legacy**

```bash
git rm src/styles/legacy.css
```

Remove `import '../styles/legacy.css';` from `layout.tsx`, and change the first line of `globals.css` to `@layer tokens, base, layout, components, pages;`.

- [ ] **Step 3: Verify everything**

Run: `npm run format && npm run lint && npm run typecheck && npm test && npm run build && npm run test:browser`
Expected: the full suite passes on both projects.

Then screenshot all five pages plus the open field view, the tour welcome card and the Reading & sound dialog:
- at 1440, 390 and 320px;
- in English and Bangla;
- in light and dark.

Compare them with the Task 7–12 screenshots. Anything that lost styling gets its rule ported. No `rgb(` or `#` colour may appear outside `tokens.css`: check with `grep -nE '#[0-9a-fA-F]{3,6}\b|rgba?\(' src/styles --include=*.css | grep -v tokens.css`. The only allowed hits are the `rgba(0, 0, 0, …)` values inside the backdrop and shade `color-mix` expressions.

- [ ] **Step 4: Commit**

```bash
git add -A src/styles src/app
git commit -m "Remove the legacy stylesheet layer"
```

---

### Task 14: Final verification matrix, docs and spec amendments

**Files:**
- Modify: `tests/e2e/redesign.spec.ts` (append the matrix test)
- Modify: `README.md` (the "Readable layout" bullet), `CONTRIBUTING.md` (file ownership table: add `src/styles/` under Mahia with Abid; conventions: tokens only), `docs/BRAND_ASSETS.md` (navigation logo now on the header chip)
- Modify: `docs/superpowers/specs/2026-10-12-ritu-redesign-design.md` (record the §0 amendments and the "Season" string)

- [ ] **Step 1: Add the overflow and clipping matrix test**

Append to `tests/e2e/redesign.spec.ts`:

```ts
for (const theme of ['light', 'dark'] as const)
  for (const language of ['en', 'bn'] as const)
    test(`no overflow or clipping at 320px · ${language} · ${theme} · extra large`, async ({
      page,
    }) => {
      await seedPlan(page);
      await page.addInitScript(
        ({ theme, language }) => {
          localStorage.setItem(
            'ritu-display-v1',
            JSON.stringify({ text: 'larger', motion: false, sound: false, theme }),
          );
          const saved = JSON.parse(localStorage.getItem('ritu-preview-v1') ?? '{}');
          localStorage.setItem('ritu-preview-v1', JSON.stringify({ ...saved, language }));
        },
        { theme, language },
      );
      await page.setViewportSize({ width: 320, height: 800 });
      for (const route of ['/farm', '/crops', '/plan', '/insights']) {
        await page.goto(route);
        await page.evaluate(() => document.fonts.ready);
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          route,
        ).toBe(true);
        const clipped = await page
          .locator('.nav-text strong, .button, .tool-button, .season-chip, .tracker-slot')
          .evaluateAll((els) =>
            els
              .filter((el) => el.getBoundingClientRect().width > 0)
              .filter((el) => el.scrollWidth > el.clientWidth + 1)
              .map((el) => el.textContent),
          );
        expect(clipped, route).toEqual([]);
      }
    });
```

Before running, confirm in `src/lib/storage.ts` that `language` is a top-level key of the `ritu-preview-v1` state. If it is not, set the language by clicking the `বাংলা` button after the first `goto` instead.

- [ ] **Step 2: Run the whole suite**

Run: `npm run format:check && npm run lint && npm run typecheck && npm test && npm run build && npm run test:browser`
Expected: everything passes on both projects. Paste the summary lines (the Vitest totals and the Playwright `passed` count) into the commit body.

- [ ] **Step 3: Update the docs**

1. `README.md`: replace the "Readable layout" bullet with one describing the Golden Hour light and Deep Forest dark themes. It should say the theme follows the system with a Light/Dark/Auto choice in Reading & sound, that there is a top step bar on desktop and a bottom tab bar on phones, the 20px/24px text options, English/Bangla, and device-local persistence.
2. `CONTRIBUTING.md`: in the ownership table, change the "Colors, typography, original field art" row's files to `src/styles/tokens.css`, `src/styles/**`, `field-art.tsx`, `crop-glyph.tsx`. Add a convention bullet: "Use the semantic tokens in `src/styles/tokens.css`; never raw colours in components or page CSS. `npm test` checks token contrast in both themes."
3. `docs/BRAND_ASSETS.md`: the navigation logo row now reads "Header logo chip (`.brand-chip`, white in light theme, ivory in dark), `public/website_logo.jpg` unchanged."
4. Spec: add a section "13. Amendments during planning" containing the four §0 items from this plan, plus "New string: 'Season' (crops filter group label)".

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/redesign.spec.ts README.md CONTRIBUTING.md docs/BRAND_ASSETS.md docs/superpowers/specs/2026-10-12-ritu-redesign-design.md
git commit -m "Add redesign layout matrix test and update docs"
```

---

## Self-review record

- **Spec coverage:**
  - §5 visual system → Tasks 1 and 3; §5.6 motion → Tasks 1, 3 and 5; §6.1 styles → Tasks 1 and 13; §6.2 components → Tasks 2, 3, 5 and 6; §6.3 data flow → Tasks 5, 6, 9 and 10.
  - §7 frame → Task 3; §7.3 theme → Task 2; §7.4 caveats → Tasks 3 and 7–11.
  - §8.1–8.5 pages → Tasks 7–11; §8.6 → Task 12.
  - §9 strings → Global Constraints and Task 14; §10 testing → each task plus Task 14.
  - Logo unchanged → Task 3 (`.brand-chip`, file untouched).
  - 3D kept → Task 10 (clear colour plus CSS only).
- **Placeholders:** none. The "port from legacy" steps name the exact classes and source sections, the rewrite rule (tokens only) and the verification.
- **Type consistency:**
  - `YearWheelProps`, `wheelSegments` / `progressSector` / `monthHitPath` / `monthLabelPoint` / `cropAtMonth` / `seasonOfMonth` (Tasks 4, 5, 9, 10);
  - `seasonCoverage` → `[CoverageState ×3]` (Tasks 6, 8);
  - `ActionBar` props `sticky`, `status`, `className`, `tour` (Tasks 6, 7, 10);
  - `StatusPill` `state` values (Tasks 6, 11);
  - `Theme` / `parseTheme` (Task 2);
  - `StepItem` (Task 3).
- **Review Focus:** all five lines map to tests: Task 14 matrix, Task 2 unit and e2e, the tour-layout reruns in Tasks 3, 7 and 10, Task 4 unit plus Task 9 e2e, and Task 5 e2e.
