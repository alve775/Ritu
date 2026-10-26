# RITU — grow with the seasons

A bilingual crop-rotation planning and field-record application for the Rajshahi region of Bangladesh. The active application uses actual NASA POWER history, online weather and published government crop calendars. It starts with an empty farm profile and contains no synthetic sample farm, generated weather fallback or invented suitability score.

Current continuation record: [Main-branch release check](docs/RELEASE_CHECK_2026-10-26.md), followed by [conservative simplification](docs/SIMPLIFICATION_AUDIT_2026-10-26.md), [compact typography and original logo](docs/UI_DENSITY_AND_LOGO_2026-10-26.md), [the usability audit](docs/USABILITY_AUDIT_2026-10-26.md) and [real-only finalization](docs/FINALIZATION_2026-10-26.md). Older preview documents describe superseded prototypes.

Latest visual repair: [canal-to-soil seam correction](docs/EDGE_CORRECTION_2026-10-26.md), with matching before/after crops and contour/pixel checks. The user clarified that the pale band inside the illustration was the target; earlier outer-layout changes addressed the wrong area.

## Run

Node.js 22.13 or newer and npm are required.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. No account, database or API key is needed. Location search, map tiles, weather and new NASA requests need internet. Google fonts download during the build and are served locally afterward. This is not an offline-installable PWA.

```sh
npm run lint
npm run typecheck
npm test
npx playwright install chromium
npm run test:browser
npm run build
npm start
```

## Farmer workflow

1. **Your farm:** search and disambiguate a place, position the farm pin, then enter measured area (hectares, m² or decimal/shotok), district, planning start, soil/drainage and water access. Weather loads automatically, with details expandable; previous crops, household needs and help availability are optional. Unknown soil stays unknown. The first-visit tour covers setup before later screens.
2. **Crops:** explore one season at a time, select from nine official DAE/BAMIS regional calendars, inspect original PDFs and credited crop photos, or explicitly leave a reference season unplanted. Source-backed mung drainage/Boro irrigation-access checks and named-method mung seed/germination tools are included. An unavailable calendar explains its exact conflicts.
3. **Calendar:** compare up to three non-overlapping sequences with full published maximum durations, actual year boundaries and explicit unallocated intervals. Review why they match the entered constraints and dated NASA history for each crop's most recently completed reference interval. Confirm the regional timing limits before saving.
4. **Track:** retain a snapshot of the saved farm pin and calendar, see current weather and observation prompts, and record actual planting, harvest and notes. Farm edits preserve saved records. Export, replacement, clear and full reset are explicit.

Crop-calendar coverage is limited to Rajshahi, Chapainawabganj, Naogaon and Natore, with a conservative product coverage gate. Global weather does not imply global crop recommendations. Nursery time is included conservatively; a separate nursery plot is not assumed. Dates derived from weekly regional references are a transparent display convention, **not optimal sowing-day prescriptions**. A reference interval that starts next year does not establish that planting this year is impossible.

The source library covers mung, Aman, Boro, Aus, wheat, winter maize, potato, mustard and lentil. The exact crop, source duration, source upload date, nursery caveat and original PDF remain visible. Household requirements and unavailable-help months are not silently removed. Help is checked at interval start/end; all intermediate labor or nursery-transplant tasks are not modeled.

## Data and evidence

- **NASA POWER:** actual historical daily temperature, corrected precipitation and modeled surface wetness. APIs validate dates, location, units and complete daily coverage. The seasonal endpoint uses continuous historical intervals across year boundaries. History is not a forecast; GWETTOP is a dimensionless surface-wetness index, not measured field moisture or SMAP. The locally pinned Rajshahi 2025 record is authentic dated data.
- **Open-Meteo / GeoNames:** current model conditions, seven-day forecasts and global place suggestions. Timestamps, missing values and provider failures remain visible. Weather refreshes online while visible; stale conditions do not produce weather-derived prompts.
- **OpenStreetMap / Leaflet:** attributed map tiles and a draggable/touch/keyboard farm pin. The pin is not a surveyed farm boundary. No bulk tile download is included.
- **DAE/BAMIS:** original regional crop-weather calendars. Sources provide reference timing and duration; no fabricated soil, drought or irrigation score is inferred. BARC zoning, IRAS and bulletin links are reference services, not ingested datasets.
- **CIMMYT/CSISA:** named 2016 Bangladesh mung guide for drainage cautions, variety-specific broadcast seed arithmetic and a 50-seed germination test. Current cultivar/seed-label/local guidance still matters.
- **Crop photographs:** independently credited public-domain/CC0 species references, not NASA satellite images. See [photo credits](docs/CROP_PHOTO_CREDITS.md).

IMERG and SMAP are **not integrated**. No synthetic climate perturbations, rainfall credits, yield forecasts, measured water savings or proven soil-health gains are presented. Family/pulse/familiarity rankings are literal counts with botanical references. Local cultivar dates, soil chemistry, irrigation engineering and field effectiveness still need agricultural review and farmer trials.

## Interface and animation

The white workspace has four large desktop sidebar steps and mobile navigation, English/Bangla, comfortable/larger text, replayable Mati tours, opt-in synthesized farm ambience, volume/mute and click feedback. No sound autoplays. Tours explain actual screens and setup gates without injecting fictional data.

The original **2D** landing illustration follows one farm through **sow → care → grow → harvest**. Only one activity is mounted at a time. Chapter selection pauses for inspection; Play continues and Replay starts at sowing. Motion pauses offscreen, in hidden tabs and under reduced-motion settings. Controls stay outside the artwork. See [research and storyboard](docs/FARM_ANIMATION_STORYBOARD.md). The art is decorative, not a growth/spacing model or NASA imagery; no WebGL is required.

## Records and test boundaries

Inputs and actual observations stay in versioned browser local storage; there is no cloud sync, account system or analytics. Old experimental records are retained for export, not silently treated as validated advice. Invalid newer records are backed up for recovery; no sample farm replaces them. Full reset removes device records only after confirmation and retains language/reading/sound preferences. Export first if records matter.

Only environmental coordinates and necessary dates/crop reference identifiers go through the environmental APIs. Farm names, notes and household details are not sent to NASA or weather providers. Open-Meteo's free endpoint has non-commercial/rate-limit terms; production hosting and service capacity need deployment review.

The current browser contract is in finalization spec files. Older prototype specs are retained and explicitly excluded; their passing counts are historical. Provider fixtures in tests are not shipped as live data. Automated software checks and screenshots do not establish field effectiveness or universal bug freedom.

## Team

Start continuation work with [the detailed requirements and working checklist](docs/WORK_TRACKER.md). [The QA matrix](docs/QA_MATRIX.md) records coverage and outstanding physical-device/farmer checks.

| Member                   | Responsibility                                                                |
| ------------------------ | ----------------------------------------------------------------------------- |
| Kamruzzaman Khan Alve    | Research, NASA data, crop evidence, verified comparison rules and methodology |
| Abid Al Hossain Swakkhar | Architecture, calendar, integration, testing and preview application          |
| Mahia Ribahna            | Visual design, graphics, storytelling and presentation assets                 |

See [CONTRIBUTING.md](CONTRIBUTING.md) for file ownership, conventions and checks. Dependencies are pinned in the lockfile. [The supplied plan](docs/PROJECT_PLAN.md) is preserved verbatim; Abid's subsequent instruction on October 2 authorizes this pre-event concept preview and selects Next.js. This preview does not establish official challenge eligibility or replace the full challenge brief.

Repository: [alve775/Ritu](https://github.com/alve775/Ritu). Publishing, project licensing and the final hosting account remain team decisions. No project license has been assumed.
