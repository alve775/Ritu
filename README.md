# Ritu — grow with the seasons

A bilingual crop-rotation concept preview for Rajshahi, Bangladesh. **One farm. Three seasons. Up to three compatible rotation options.** Built with Next.js App Router, React and TypeScript for the team's agriculture project.

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

**Farm → suggested crops → automatic calendar → tracking.** The home page starts at Your farm. See [the workflow and timing contract](docs/JOURNEY_WORKFLOW.md).

- **Your farm** (/farm): enter soil, drainage, irrigation and optional household, help-month, priority and previous-crop information. Location/weather select built-in example environments. Unknown inputs are never guessed.
- **Suggested crops** (/crops): select only crops with passing planting windows. The 43-entry sourced crop library is read-only; 13 entries have planner rules/windows, and only matches are selectable.
- **Your calendar** (/plan): compare up to three generated sequences from selected crops. Crop-specific planting windows are assigned automatically, locked, checked for overlap and completed with explicit rest months. Missing/conflicting choices produce no plan. Seven planner/entry checks explain each plan at /insights.
- **Scenario simulator**: preview water/priority/weather changes without modifying the saved farm. Apply is available only for a complete compatible draft. Reset discards the draft.
- **Tracking** (/track): save one March–February calendar snapshot, mark planting/harvest and record notes. Reload retains progress. Farm edits preserve the snapshot; replacement/clear/reset asks before removing records.
- **Guided missions**: Mati the original duck guides a 28-step full tour and six section replays. Tours show temporary examples without changing inputs or records. Smooth travel, streamed words, section arrows, keyboard controls and reduced motion remain.
- **Three.js anatomy**: optional on-demand field, close-up and cutaway, manual crop/structure selector, camera buttons/drag, shared calendar month and linked model limits. Five entries have source-informed schematic anatomy; unsupported entries have an identified placeholder. Geometry is not measured cultivar growth or surveyed land.
- **Readable layout**: white main body, dark green navigation/top bar, 20px or 24px text, English/Bangla and device-local persistence. Optional detail is disclosed gradually. Farm sounds offer Play/Stop, morning/evening synthesis, volume/mute and optional click feedback, with no autoplay.

## Data boundary

All environmental numbers, crop suitability rules, indices, drainage categories and planting windows are authored example values, not observations. No real data API, forecasts, yield predictions, measured water savings or validated farm recommendations are supplied. Source links support crop identity/anatomy only. Real water/soil/drainage suitability remains unassessed, separately from passing planner checks.

The locked calendar guarantees no overlapping **month intervals**. It does not validate actual growing durations, crop transitions or field suitability. Reviewed dated crop/variety calendars and NASA provenance are future integration work; see [the integration handoff](docs/DATA_INTEGRATION.md) and [the description audit](docs/PROJECT_DESCRIPTION_AUDIT.md).

Inputs/records stay in this browser's versioned local storage. There is no account, database, cloud sync, analytics or server collection. Reset preserves language but clears saved calendar/progress/notes after confirmation. This is not an installable offline PWA.

## Team

Start continuation work with [the detailed requirements and working checklist](docs/WORK_TRACKER.md). [The QA matrix](docs/QA_MATRIX.md) records coverage and outstanding physical-device/farmer checks.

| Member | Responsibility |
| --- | --- |
| Kamruzzaman Khan Alve | Research, NASA data, crop evidence, verified comparison rules and methodology |
| Abid Al Hossain Swakkhar | Architecture, calendar, integration, testing and preview application |
| Mahia Ribahna | Visual design, graphics, storytelling and presentation assets |

See [CONTRIBUTING.md](CONTRIBUTING.md) for file ownership, conventions and checks. Dependencies are pinned in the lockfile. [The supplied plan](docs/PROJECT_PLAN.md) is preserved verbatim; Abid's subsequent instruction on October 2 authorizes this pre-event concept preview and selects Next.js. This preview does not establish official challenge eligibility or replace the full challenge brief.

Repository: [alve775/Ritu](https://github.com/alve775/Ritu). Publishing, project licensing and the final hosting account remain team decisions. No project license has been assumed.
