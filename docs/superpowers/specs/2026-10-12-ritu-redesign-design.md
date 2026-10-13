# Ritu redesign: Golden Hour (light) and Deep Forest (dark)

Date: 2026-10-12. Status: awaiting review. Mockups were produced during design review (not committed).

## 1. Goal and success criteria

Redesign every page of Ritu so it feels **minimal, easy to use, premium and visually catchy**, without changing what the app does.

Success means:

- Each screen has one obvious next step (one primary action), and optional detail is tucked away.
- The app has a distinctive signature, the **Ritu year wheel**, that carries real information.
- Light and dark themes both pass WCAG AA for every text and graphic pair (Section 5.4).
- The planner, data, storage, tours, sounds and the **3D field model** behave exactly as before.
- All existing English and Bangla copy is unchanged, apart from the handful of new labels in Section 9.
- The full Playwright suite passes on the desktop and mobile (Pixel 7) projects, along with lint, type-check, unit tests and build.

## 2. Decisions already made (do not reopen)

| Topic | Decision |
|---|---|
| Phone tools | No "More" sheet. Tour and Reading & sound stay as icon buttons in the phone header (Section 7.2). |
| Scope | Restyle and simplify: new visual system plus reorganised pages. Same four-step flow; every feature still reachable. |
| 3D model | Kept. Restyled into a deep-green "stage"; geometry, materials and controls unchanged. |
| Logo | `public/website_logo.jpg` is unchanged. It is shown on a rounded chip (white in light theme, ivory `#efe8d6` in dark theme). No recolouring, cropping changes or replacement. |
| Visual direction | **D · Golden Hour**, refined by a design audit and an accessibility audit (Section 5). |
| English type | **Newsreader** (display) + **Geist** (UI and body). |
| Bangla | Copy and font stay as they are: **Noto Sans Bengali**, existing translations only. No decorative Bangla lines are added under English headlines. |
| Dark mode | Shipped now. **A · Deep Forest**. Follows the system setting by default, with a manual Light / Dark / Auto switch. |
| Styling approach | Plain CSS split into ordered files with cascade layers. No Tailwind, no CSS Modules, no new UI library. |

## 3. Constraints carried over from the repository

- Read `node_modules/next/dist/docs/` for Next.js 16 conventions before writing code (`AGENTS.md`). The CSS guide says global CSS belongs in the root layout and that production CSS is ordered by import order. Keep **all** CSS imports in one entry (Section 6.1).
- `CONTRIBUTING.md`: the 20px body baseline and the 24px larger option stay; semantic inputs and visible labels; keyboard support; calendars scroll inside their panel on small screens and the document must never overflow horizontally; the Three.js canvas keeps an equivalent keyboard-accessible inspection path and a usable WebGL fallback, renders only on change, disposes GPU resources, and keeps drag rotation opt-in.
- Unknown input must never become a successful check by default. "Not assessed" stays amber everywhere and never turns green.
- Do not label example values as measured, forecast or validated.
- The versioned storage keys stay. The display preference gains one field (Section 7.3) with backward-compatible parsing.
- File ownership (`CONTRIBUTING.md`): colours, typography and art are Mahia's area. Share this spec with Mahia before merge.
- Commits must not contain AI co-author trailers or generated-by lines. Credit only the team (Alve, Abid, Mahia).

## 4. Out of scope

New landing page; changes to routes, data, domain logic, crop rules or storage keys; logo changes; copy rewrites (including removing existing em-dashes or middle dots, which is a possible follow-up); new animation libraries; analytics.

## 5. Visual system

### 5.1 Principles (from the design and accessibility audits)

1. One primary action per screen. Secondary actions are outlined or plain links.
2. Colour carries meaning: the three season colours are data colours. Interface chrome stays neutral, and deep green is the only action colour.
3. No "STEP X OF 4" eyebrow labels. The stitched progress line shows the step. At most one small uppercase label per page section group.
4. Italic emphasis appears only in the Calendar page headline ("Choose your *automatic calendar*"). The other headlines are plain.
5. No decorative illustrations. The year wheel is the visual signature.
6. Grain texture is a single fixed, `pointer-events: none` overlay (opacity about 0.05), never on scrolling containers.
7. Never convey meaning by colour alone: label every wheel arc directly, hatch rest months, and pair status colours with an icon and text.

### 5.2 Colour tokens

Components use semantic tokens only, never raw hex. Each season colour has a **graphic** token (arcs, bars, dots: 3:1 minimum) and a **text** token (4.5:1 minimum).

| Token | Light · Golden Hour | Dark · Deep Forest |
|---|---|---|
| `--color-bg` | `#f4f5ef` | `#0f1d17` |
| `--color-surface` (cards) | `#fdfdfa` | `#16271f` |
| `--color-surface-raised` (popovers, sheets) | `#ffffff` | `#1b2e25` |
| `--color-ink` | `#10241b` | `#f1ede2` |
| `--color-ink-muted` | `#4f6457` | `#a9b6aa` |
| `--color-line` | `#e1e4d8` | `rgba(241,237,226,.09)` |
| `--color-soft` (input and tile fill) | `#eaece2` | `rgba(241,237,226,.07)` |
| `--color-primary` | `#0e5a3a` | `#efe8d6` |
| `--color-on-primary` | `#f6f8f2` | `#0f3324` |
| `--color-accent` (Calendar italic, active step) | `#c27a12` (large text only) | `#f1ede2` |
| `--color-warn-bg` / `--color-warn-ink` | `#fbefd6` / `#7a4c0d` | `rgba(214,162,78,.12)` / `#e6c48c` |
| `--color-danger` | `#a3401f` | `#f0a08a` |
| `--season-pre` / `--season-pre-text` | `#bb7310` / `#8f5a0b` | `#d6a14f` / `#d6a14f` |
| `--season-mon` / `--season-mon-text` | `#2f7fc1` / `#24659f` | `#6fa3cf` / `#6fa3cf` |
| `--season-win` / `--season-win-text` | `#557f24` / `#4a7121` | `#97b46c` / `#97b46c` |
| `--wheel-track` | `#e6e8dd` | `rgba(241,237,226,.08)` |
| `--stage-bg` (3D stage) | `#0b3a28` | `#0a2a1d` with a 1px `--color-line` edge |
| `--stage-ink` | `#eef0e6` | `#f1ede2` |
| `--logo-chip` | `#ffffff` | `#efe8d6` |

`--color-danger` measures 6.2:1 (light) and 7.5:1 (dark) on `--color-surface`. Shadows are tinted to the background hue. In dark mode, elevation uses a 1px inner light edge instead of a drop shadow.

### 5.3 Typography

- Packages: `@fontsource-variable/newsreader` and `@fontsource-variable/geist` replace `@fontsource/dm-sans` and `@fontsource/fraunces`. Keep `@fontsource/noto-sans-bengali` (400, 600). All fonts stay self-hosted with `font-display: swap`.
- Stacks: display `'Newsreader Variable', 'Noto Sans Bengali', Georgia, serif`; UI and body `'Geist Variable', 'Noto Sans Bengali', system-ui, sans-serif`.
- Scale (rem at 20px root): body 1rem; label 0.8rem (16px minimum, nothing smaller); h3 1.1rem; h2 1.5rem; h1 2.2rem desktop, 1.6rem mobile. The "larger" text setting keeps scaling the root to 24px.
- Weights: display 500 (italic 400); UI 400 body, 500 labels, 600 buttons and headings.
- Numbers use tabular figures (`font-variant-numeric: tabular-nums`).
- Bangla (`:lang(bn)`): line-height 1.4 for headings and 1.75 for body; no negative letter-spacing.
- Italic display words get `line-height` ≥ 1.1 and a little bottom padding so descenders never clip.

### 5.4 Contrast (measured)

The audit lives in `src/styles/contrast.test.ts` (run by `npm test`). With the tokens above, all 14 checked pairs pass in both themes:

- Light: body text 14.9, muted 5.8, button 7.7, season text 5.6 to 6.0, arcs 3.0 to 3.8.
- Dark: body text 13.4, button 11.3, season text 5.8 or higher, arcs 4.7 or higher.

Every new token pair gets added to the script before use.

### 5.5 Shape, spacing, elevation, layers

- **Shape:** interactive controls (buttons, chips, pills, tab items) are full pill; cards and sheets 18px; inputs, tiles and inner panels 12px. No other radii.
- **Spacing:** 4px base scale (4, 8, 12, 16, 20, 24, 32, 40, 56). Page max width 1180px with side padding of 28px on desktop and 16px on mobile.
- **Elevation:** level 0 flat; level 1 card (`0 1px 2px` plus a soft tinted shadow); level 2 overlay (popover, sheet, dialog).
- **Z-index scale:** content 0 · sticky action bar 20 · header 30 · bottom tab bar 30 · popover 40 · sheet and dialog 50 · tour 60 · grain overlay 70 (pointer-events none).
- **Touch:** every interactive element has a hit area of at least 44×44px and at least 8px between targets. Small visuals get invisible padding.

### 5.6 Motion

- Tokens: `--ease-out: cubic-bezier(.16,1,.3,1)`; enter 240ms; exit 160ms; micro-interactions 150ms.
- Allowed animations: page content fade-up on route change; one-time draw-in of the year-wheel arcs; button press scale to 0.98; popover and sheet slide; tracker slot fill.
- At most two animated elements per view. Only `transform` and `opacity` are animated.
- Everything is disabled when `prefers-reduced-motion: reduce` or the app's motion setting is off (`data-motion="off"`, existing `prefersReducedMotion()`).

## 6. Architecture

### 6.1 Styles

Replace the 4,335-line `src/app/globals.css` with ordered files under `src/styles/`, all imported from `src/app/globals.css` (the only CSS entry, imported once in `layout.tsx`):

```
@layer reset, tokens, base, layout, components, pages, utilities;
src/styles/tokens.css      light tokens on :root; dark tokens under
                           @media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }
                           and :root[data-theme="dark"]
src/styles/base.css        element defaults, typography, focus ring, forms
src/styles/layout.css      shell, header, tab bar, action bar, page container
src/styles/components.css  buttons, chips, cards, tiles, disclosure, dialog, popover, sheet, wheel
src/styles/pages/*.css     farm, crops, calendar (incl. 3D stage), track, insights, tour
```

Class names that tests and tours select must be kept on the equivalent element (Section 10.2).

### 6.2 New shared components (`src/components/ui/`)

| Component | Responsibility | Used by |
|---|---|---|
| `StepProgress` | Stitched four-step progress line; links with `aria-current="page"`; done/current/upcoming states. Keeps the link names "Your farm", "Crops", "Calendar", "Track" and the `.nav-text strong` structure. | Header (desktop) |
| `BottomTabBar` | Four step links with icon and label, `aria-current`, safe-area padding. | Phone (< 768px) |
| `ActionBar` | Sticky bottom bar with status content on the left and one primary button on the right; reserves page padding equal to its height plus `env(safe-area-inset-bottom)`. | Farm, Crops, Calendar |
| `YearWheel` | SVG 12-month ring (March to February) built from `periods: {crop, start, duration}`. Season-coloured arcs with direct crop labels, hatched rest months, selected-month marker and centre label. Each month is a focusable button with an invisible full-ring tap wedge (≥ 44px). Props: `periods`, `selectedMonth?`, `onSelectMonth?`, `progress?` (per-crop 0–1 for Track), `size: 'mini' | 'full'`. Has an `aria-label` summary; the Months grid is the equivalent table view. | Plan cards (mini), Calendar, Track |
| `SeasonChip` | Season-coloured chip "Pre-monsoon Mar → Apr" using text tokens. | Crops, Calendar |
| `StatusPill` | `Entry checked` (green and tick), `Not assessed` / `Needs confirmation` (amber and question icon). | Calendar, Insights |
| `ThemeSwitch` | Light / Dark / Auto segmented radio group bound to the display store. | Reading & sound dialog |

Existing components keep their roles and are restyled, not replaced:

- `ReadingControls` keeps its "Reading & sound" launch button (class `reading-launch`) and its `Dialog`. The dialog gains a "Theme" fieldset (`ThemeSwitch`). On phones the dialog is styled as a bottom sheet.
- `TourGuide` keeps its "Take a tour" button (`data-tour-launch`) and chooser dialog.
- `ResetDataControl` keeps both its compact (footer) and in-page placements.

Icons: keep `lucide-react` (already a dependency), at stroke width 2 throughout. No hand-drawn icon paths, and no emoji in the interface.

### 6.3 Data flow

No new application state. Every new visual is derived from existing stores:

- The wheel uses `rotation.periods`.
- The Crops "Your year" tracker uses the same derivation as today's "Choose a suggested crop for: …" hint.
- The Track progress ring uses `tracked.records`.
- The selected month stays the single shared value already used by the calendar and the 3D explorer, so the wheel, the Months grid and the 3D stage stay in sync.

## 7. App frame (all pages)

### 7.1 Desktop (≥ 768px)

- Sticky header, 64px tall, on one line: logo chip (links home), `StepProgress` in the centre, and on the right "Take a tour" (pill with Mati's face), "Reading & sound" (pill with sliders icon), the EN/বাংলা switch, and About (?).
- Between 768 and 1023px the two tool pills become icon-only. Their accessible names stay "Take a tour" and "Reading & sound" via `aria-label`, and a tooltip shows the same text.
- The sidebar is removed.
- Footer: "Saved on this device" with the Reset all data link (left), and one amber "Illustrative preview · not farming advice" badge that opens About (right).
- The breadcrumb is removed.

### 7.2 Phone (< 768px)

- Header (single row, 56px): logo chip, then icon-only "Take a tour" (Mati) and "Reading & sound" buttons (same accessible names as desktop), then the EN/বাংলা switch. This fits at 320px: about 74 + 44 + 44 + 80px plus gaps.
- About and Reset all data are reached from the footer (footer badge and compact reset), which stays on phones above the tab bar's safe area.
- `BottomTabBar` for the four steps.
- Deviation from the Section 1 mockup: the mockup's "⋯ More" sheet is dropped. It would have hidden "Take a tour" and "Reading & sound" behind an extra tap, broken their focus-return behaviour and the existing tests, and added a component.
- Each page's `ActionBar` sits directly above the tab bar.
- The layout never overflows horizontally at 320px.

### 7.3 Theme preference

- Add `theme: 'auto' | 'light' | 'dark'` (default `'auto'`) to `DisplayPreferences` in `src/lib/display-store.ts`.
- Missing or invalid stored values parse to `'auto'`; the storage key `ritu-display-v1` is unchanged.
- `apply()` sets `document.documentElement.dataset.theme` for `'light'` and `'dark'` and removes it for `'auto'`.
- Auto relies on CSS `prefers-color-scheme`, so system-dark users never see a flash. A manual override applies on hydration; a brief flash for manual-override users is acceptable.
- Add `<meta name="color-scheme" content="light dark">` and a `themeColor` that matches each theme.

### 7.4 Caveats

The scattered evidence banners collapse into:

1. The footer badge.
2. In-context amber notes next to the decision they qualify, such as the water-access warning on Calendar, the "not verified observations" line on Track, and "Rules, not farming advice" on Insights.

Existing caveat copy is reused verbatim. None is deleted without an equivalent visible placement.

## 8. Pages

Mockups: `pages-farm-crops.html`, `page-calendar.html`, `pages-track-insights.html`, `dark-options.html` (not committed). Where a mockup and this spec disagree, the spec wins. Mockups still show the eyebrows, which are removed per Section 5.1.

### 8.1 Farm (`/farm`)

- Heading "Start with your farm" and subline "Tell us about soil and water.", inside `.planner-heading`, which keeps the in-page "Reset all data" button as a quiet outlined button (a test checks it and its focus return).
- Card **Your field**: Farm name and Field area side by side; existing validation and error copy.
- Quiet dashed row **Location & environment** (existing `DemoEnvironment`), with a summary chip of the current selection, expandable.
- Card **Water & soil**: irrigation as five large tiles (selected = solid primary fill with a tick, still radio inputs), then Soil texture and Drainage selects (still `<select>` with the same labels).
- Two quiet `<details>` rows: "Your priorities, household & help" and "Previous crops · optional", with unchanged contents and behaviour.
- `ActionBar`: three-segment indicator for soil, drainage and irrigation confirmed, or the existing "Confirm soil, drainage and irrigation…" message when missing; primary "See suggested crops →".

### 8.2 Crops (`/crops`)

- Heading "Choose from your farm’s matches" plus the existing subline; "Edit farm" is an outlined button.
- Season filter pills (All · Pre-monsoon · Monsoon · Winter). Filtering is visual only and never changes selections.
- Grid of crop cards: one real checkbox per crop (accessible name unchanged: "Consider Mung bean"), its windows as `SeasonChip`s, and a "Why suggested?" disclosure.
- "Browse 42 crops" library as one quiet `<details>` row (contents unchanged).
- `ActionBar`: the **"Your year" tracker** with three slots that fill as the chosen crops cover each season (derived state), plus primary "Build my calendar". Disabled until complete, with `aria-describedby` pointing to the tracker text.

### 8.3 Calendar (`/plan`)

- Heading "Choose your *automatic calendar*" (the only italic). Header actions: outlined "Explore 3D crops" (cube icon; scrolls to and opens the stage) and outlined "Edit farm".
- **Choose**: up to three plan cards (mini wheel, name, sequence, status pill), still `.option-card` with the existing select control.
- **Understand**: the full `YearWheel` in a card, with a **Wheel | Months** switch (Months is the existing `.calendar-board` grid, kept intact), beside the season breakdown (one row per crop with a season bar, crop name, months and duration, plus hatched rest rows), the water-access amber note, the "Model: 0 conflicts · 0 unknowns" line, and links to Understand this choice, Change my crop choices and Try a water-shortage scenario.
- **3D stage**: the existing `SeasonExplorer` restyled on `--stage-bg`. Canvas on the left with floating camera controls (blur with a solid fallback under `prefers-reduced-transparency`) and the drag-to-rotate toggle; on the right the month stepper and the "In this month" panel (crop, activity, water check, Inspect this month, Model sources & limits). Mode tabs (Field view, Crop close-up, Soil cutaway), crop selector, structure select and all notes are kept. Collapsed by default as today ("Open field view"). The Three.js renderer clear colour changes from `#f6f8fa` to the stage colour; geometry and materials are untouched.
- **Act**: `ActionBar` with "Cycle starts in March of [year]" and primary "Save calendar & track". The scenario simulator opens from the bar as the existing disclosure, styled as a sheet. The replace-calendar confirmation dialog is unchanged.

### 8.4 Track (`/track`)

- Heading "Your saved calendar" with the existing subline; outlined "Review calendar options".
- One amber line with the existing "Generated plan, farmer-entered progress…" copy; the stale-snapshot note stays amber.
- Summary card: `YearWheel` with `progress` (each crop's arc fills as its tasks are marked), plan name and sequence, "March [year] → February [year+1]", "X / Y planting and harvest tasks marked", the native `<progress>`, and a Wheel/Months switch (Months is the existing timeline).
- Crop cards (still `.tracking-crops > section`) with a season top border and a two-step **Planted → Harvested** control. Both remain real checkboxes with the existing enable/disable rules. Notes use a textarea that starts compact ("+ Add a note") and grows.
- "Clear saved calendar & progress" is a danger-coloured link with the existing confirmation dialog.
- Empty state (no saved calendar): a centred illustration-free card with the existing copy and a primary "Review calendar options".

### 8.5 Insights (`/insights`)

- Heading "Know the why." (no italic) and subline; outlined "← Back to comparison".
- Left card: plan name, sequence, status pill; "Why this plan?" with the existing "RULES · not farming advice" label; the three indices shown as **value plus a small inline mark with no background track** (design rule); the existing explanatory sentence.
- Right card: "Check this selection" as a status list (`StatusPill`s), with rows still expanding to show their reasons.
- The seven planner checks in a compact grid.
- "Ask a local agricultural adviser" banner on the stage colour with "Review my farm inputs →".
- Sequence details, Evidence & sources, Saved priorities and See the full year as quiet `<details>` rows.

### 8.6 Other surfaces

- **Tour (Mati):** cards, spotlight and dialog restyled to the new tokens (surface-raised, 18px radius, primary buttons). Behaviour, steps, copy, focus trapping and stream-text unchanged. Selectors in `src/data/tours.ts` must resolve (Section 10.2).
- **Dialogs, 404, error page:** restyled with tokens; copy unchanged.
- **About dialog:** unchanged content; opened from the header (?) and the footer badge.

## 9. New user-facing strings

Each new string gets a draft Bangla translation, flagged for team review in the pull request:

- Wheel / Months (view switch)
- Theme: Light / Dark / Auto
- "+ Add a note"
- "Your year" (Crops tracker label)
- Season filter "All"

Existing strings are reused wherever possible.

## 10. Testing and verification

### 10.1 Commands (every phase)

`npm run format:check`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm run test:browser` (desktop and mobile projects, including the axe checks).

### 10.2 Selectors that must keep resolving

- **Tests:** `.calendar-actions > .button`, `.calendar-board .rotation-row`, `.calendar-board .timeline`, `.timeline .crop-bar`, `.catalogue-crop`, `.choice-summary .button`, `.demo-card-result`, `.demo-check`, `.field-canvas canvas`, `.field-model-title`, `.field-viewport`, `.labor-months`, `.nav-text strong`, `.form-field`, `.disclosure > summary`, `.option-card`, `.option-card .status.confirm`, `.option-card-select`, `.planner-heading`, `.previous-crop-remove`, `.stream-word`, `.suggested-crop`, `.tour-card`, `.tour-card-actions > div > button`, `.tour-dialog`, `.tour-spotlight`, `.tracking-crops > section`, `[data-tour-launch]`, `#tour-title`, `#tour-description .sr-only`, `main details > summary`, `main details[open]`.
- **Tours:** `.calendar-board .calendar-scroll`, `.catalogue-controls`, `.choice-summary`, `.crop-study-selector`, `.demo-controls`, `.demo-reasons`, `.field-study-controls`, `.field-viewport`, `.household-control`, `.labor-control`, `.missing-card`, `.priority-control`, `.reading-launch`, `.soil-fields`, `.water-control`, and the `data-tour` values `build-calendar`, `farm-basics` (with an inner `.form-grid`), `farm-continue`, `farm-history` (with an inner `section`), `field-months`, `save-calendar`, `suggested-crops`, `suggestion-summary`, `tracking-calendar`, `tracking-crops`, `tracking-progress`.
- **Accessible names used by tests:** "Take a tour", "Reading & sound", "Reset all data" (inside `.planner-heading` on Farm), "Keep my data", "See suggested crops", "Consider <crop>", "Build my calendar", "Open field view", "Farm name", "Field area (hectares)", "Soil texture", "Previous crop to add", "Add previous crop", "Search crops". All must stay unchanged on both the desktop and mobile projects.
- If a selector must change, update the test or tour in the same task and say so in the PR.

### 10.3 New tests

- `YearWheel`: arc angles match `periods`; rest months rendered; keyboard month selection; `aria-label` summary (vitest plus a Playwright check).
- Theme: Auto follows emulated `prefers-color-scheme`; manual override persists across reload; invalid stored theme falls back to Auto.
- The Crops tracker enables "Build my calendar" only when all three seasons are covered.
- No horizontal overflow at 320, 390 and 1440px in English and Bangla, at both text sizes, in both themes.
- axe runs in both themes.

### 10.4 Visual review

Before/after screenshots of all five pages at 1440, 390 and 320px, in English and Bangla, in light and dark, reviewed by the team. The contrast test passes.

## 11. Delivery plan (summary; the detailed plan follows in writing-plans)

| Phase | Work | Parallel? |
|---|---|---|
| 1 | Fonts, tokens and layered CSS skeleton, theme preference and ThemeSwitch, app frame (header, StepProgress, BottomTabBar, footer, restyled Reading & sound dialog) | Sequential |
| 2 | Shared components: ActionBar, YearWheel, SeasonChip, StatusPill | Partly parallel |
| 3 | Pages: Farm · Crops · Calendar and 3D stage · Track · Insights | Parallel (one implementer each) |
| 4 | Tour, dialogs, 404/error restyle; selector and test updates; screenshot review | Sequential |

The work happens on a feature branch, and nothing is merged to `main` without the team's review.

## 12. Amendments during planning and implementation

Where these amendments conflict with earlier sections, the amendments win.

- No Wheel/Months switch: the YearWheel is shown alongside the months grid on Calendar and Track (tests require the grid visible).
- Crops action panel stays in normal flow (not sticky).
- Single CSS entry is `src/app/layout.tsx` importing ordered stylesheets; `globals.css` only declares the layer order.
- Year-wheel crop names are curved text outside the ring in season text colours; month names sit inside; wheel month buttons are named "Year wheel: <Mon>" / "বছরের চক্র: <মাস>".
- Layer order is `tokens, base, layout, components, pages` (a temporary `legacy` layer sat between base and layout during migration and was removed).
- The tab bar (phone navigation) is used at 1023px and below (tablets included); StepProgress shows at 1024px and above. Tool-button labels are icon-only below 1280px and at the larger text size, so the header fits on one line at a 20/24px root.
- The phone bottom sheet applies only to the Reading & sound dialog; other dialogs stay centred.
- Footer: ResetDataControl sits beside the save indicator (not nested in it).
- Farm: on phones the sticky action bar is one compact row; when it shows the "Confirm soil, drainage and irrigation…" message it is not sticky.
- Calendar: "Explore 3D crops" and "Understand this choice" are secondary buttons; "Save calendar & track" is the only primary. The save bar is not sticky at the larger text size, and its helper text is a visible line linked via `aria-describedby`.
- Calendar: the scenario simulator remains the existing disclosure (not a sheet opened from the bar); the water note, Model line and links sit with the choice summary; the explorer's month stepper keeps its component layout.
- Crop bars and the crop-detail icon are coloured by the season of the crop window's start month.
- 3D field: the renderer clear colour and the scene's floor plane colour changed to the stage green; field and crop model geometry, materials, lights and camera are unchanged.
- New token `--stage-glow` (light `#1d7a55`, dark `#1d5c42`).
- Insights: index values are shown as text only (no inline mark); the seven planner checks use a two-column grid on desktop.
- Crops: season filter pills for seasons with no available windows are disabled; "Build my calendar" has `aria-describedby` pointing to the status message.
- 404 page: the "PAGE NOT FOUND" eyebrow was removed (consistent with the no-eyebrow rule).
- One-month periods display a single month (e.g. "Feb", not "Feb → Feb").
- New string beyond §9: "Season" (মৌসুম), the crops filter group label.
- Theme preference lives in the existing Reading & sound dialog (ThemeSwitch); `themeColor` follows the system scheme only (a manual theme does not change the browser chrome colour).
- Bangla headings use weight 600 (Noto Sans Bengali is loaded at 400 and 600).
- The contrast audit lives in `src/styles/contrast.test.ts` (run by `npm test`), not in a `contrast.py` script.
- §9's "Wheel / Months" strings were dropped; "Year wheel" (বছরের চক্র) was added instead.
- §10.3's overflow matrix is implemented at 320px with the larger text size in both languages and both themes; wider widths are covered by the focus and frame tests.
- The active step dot, tab indicator, tour spotlight/card/progress accents and the 404 border use `--season-pre` (amber) as the brand accent in both themes (deviation from §5.1 rule 2 and §5.2, which had the active step use `--color-accent`).
- "Take a tour" keeps the compass icon (§7.1 mentioned Mati's face).
- axe checks run in both themes (§10.3), covering /farm, /crops, /plan, /track and /insights.
