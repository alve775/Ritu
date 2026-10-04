# Ritu — grow with the seasons

A bilingual crop-rotation concept preview for Rajshahi, Bangladesh. **One farm. Three seasons. Three rotation options.** Built with Next.js App Router, React and TypeScript for the team's agriculture project.

## Run the preview

Node.js 22.13 or newer (Node 22 LTS recommended) and npm are required. From the repository:

```sh
npm ci
npm run dev
```

Open **http://localhost:3000**. No API keys, database, account or NASA download is needed. Fonts and the original field illustration are served locally. After loading, the planner interactions do not depend on external APIs; this is not an offline-installable PWA.

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm start
```

For browser checks, install the matching test browser once:

```sh
npx playwright install chromium
npm run test:browser
```

The browser suite starts a dev server if one is not already running. See [verification details](docs/PREVIEW_VERIFICATION.md).

## What works

- **Mati, the farm guide**: an original duck mascot accompanies a 20-step tour. A reserved desktop rail or phone dock keeps the instructions clear of the highlighted section; guide arrows explore long sections and wide calendars.
- **Farm ambience**: Reading & sound offers synthesized morning/evening wind and calls, volume, stop, mute and independent click feedback. Ambience starts with an explicit Play action and pauses while the tab is hidden.
- **43 crop entries**: search English/Bangla names, filter groups, inspect sources and add crops using your own dates. Unavailable anatomy and unreviewed taxonomy are identified. See [catalogue evidence and limits](docs/CROP_CATALOGUE.md).

- **Your farm** (`/farm`): edit name, hectares, water access, soil texture, drainage, household crops, labor restrictions and current crop/rest periods.
- **Compare rotations** (`/`): inspect three calendars on a shared March–February cycle, select an option, filter to the selection and explore individual crops.
- **Interactive seasonal field** (`/#field`): choose a rotation and month, inspect its crop/rest period, planting or harvest window and applicable constraints. The Three.js scene offers camera buttons and optional drag rotation; the calendar and field share the same month selection.
- **Guided missions**: a first-visit tour spotlights farm inputs, comparison controls, the field and explanations. **Take a tour** at the top of every page replays the full tour or any section, in English or Bangla. Instructions enter progressively while the spotlight, card and page travel smoothly. Back/Next cannot queue accidental skips; Close, Skip and Escape remain available. The tour preserves farm inputs and respects reduced motion.
- **Fluid exploration**: finite page/dialog entrances, planning-control feedback, gentle field loading and camera travel. The 3D scene stops rendering when settled and reuses shadows during camera motion; reduced motion makes transitions immediate.
- **Crop structure studies**: switch between field layout, crop close-up and soil cutaway. Rice panicles, wheat spikes, mung leaflets/pods and potato stolons/tubers use distinct schematic geometry with linked references. Young/mature examples are manually selected, independent of the month.
- **Your choice, explained** (`/insights`): six checks with reasons, explicit conflicts and unknowns, sample tradeoffs and the evidence still needed.
- Entry conflicts update immediately. Water, drainage and soil suitability remain unassessed even when recorded; priorities are saved without recommending an option.
- Bangla/English, responsive layouts, keyboard-operable controls, native focus-trapped dialogs, reduced-motion support and versioned device-local persistence.
- A simpler three-task flow, 20px base text, optional 24px text, streamed tour instructions and user-controlled motion/sound. Calendars, secondary inputs and 3D open on request. The field renders on demand and releases graphics resources when closed; month details work without WebGL.

## Data boundary

**Farm examples and crop windows are fictional, editable fixtures.** No water-demand ranking or unsupported irrigation/drainage rule is applied. Water, soil, drainage, rainfall, heat exposure and local suitability remain unassessed. The app checks entered calendar overlap, household crop presence and sample planting/harvest-help conflicts; these are not validated farming recommendations or yield estimates. Read the [evidence and usability audit](docs/EVIDENCE_AND_USABILITY_AUDIT.md) for the challenge coverage, corrections, primary sources and validation limits.

The 3D field is a schematic illustration. Young/mature structure examples are selected manually and never inferred from the calendar month. The parcel dimensions, planting density, roots and soil cutaway are artistic; they do not represent entered hectares, a surveyed farm, actual soil horizons or predicted yield. Planting and harvest labels still come from the first and last sample calendar months. See [research and design notes](docs/UX_AND_MODEL_RESEARCH.md) for the evidence behind the interaction and anatomy choices.

The current sample lives in `src/data/preview.ts`. Constraint logic is isolated in `src/domain/evaluate.ts`; shared types are in `src/domain/types.ts`. [The integration handoff](docs/DATA_INTEGRATION.md) explains how reviewed data can replace these assumptions without rebuilding the interface.

Inputs are saved in this browser's local storage only. There is no server collection, analytics or cloud sync. A visible notice appears if storage is unavailable. Reset requires a deliberate confirmation and preserves the language choice.

Tour dismissal is stored separately under `ritu-tour-v1`. Reopening a section tour does not reset the farm. If storage is unavailable, the tour remembers its automatic prompt for the current loaded tab only.

## Team

Start continuation work with [the detailed requirements and working checklist](docs/WORK_TRACKER.md). [The QA matrix](docs/QA_MATRIX.md) records coverage and outstanding physical-device/farmer checks.

| Member | Responsibility |
| --- | --- |
| Kamruzzaman Khan Alve | Research, NASA data, crop evidence, verified comparison rules and methodology |
| Abid Al Hossain Swakkhar | Architecture, calendar, integration, testing and preview application |
| Mahia Ribahna | Visual design, graphics, storytelling and presentation assets |

See [CONTRIBUTING.md](CONTRIBUTING.md) for file ownership, conventions and checks. Dependencies are pinned in the lockfile. [The supplied plan](docs/PROJECT_PLAN.md) is preserved verbatim; Abid's subsequent instruction on October 2 authorizes this pre-event concept preview and selects Next.js. This preview does not establish official challenge eligibility or replace the full challenge brief.

Repository: [alve775/Ritu](https://github.com/alve775/Ritu). Publishing, project licensing and the final hosting account remain team decisions. No project license has been assumed.
