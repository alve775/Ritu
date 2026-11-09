<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Ritu: working notes for coding agents

Ritu is Alve's NASA Space Apps 2026 entry (challenge: Field Shift). It is a Next.js crop-rotation planner for the Rajshahi region of Bangladesh, built on NASA POWER climate data, in English and Bangla. Alve does all data and app work; Mahia makes the video.

## Working rules (from Alve)

- Show a preview (a static HTML mock or a screenshot) and get approval before changing any screen's design. Small fixes he asks for explicitly can go straight in.
- Do not commit or push unless Alve asks. Never commit under someone else's name (the last commit is Abid-Al-Hossain's) and never guess a git identity.
- NASA Earthdata credentials stay in `~/.netrc` on Alve's Mac. Never put them in the repo, in `.env` files that get committed, or in chat.
- All app text goes through `t('English', 'বাংলা')`. Plot and land names are shown exactly as saved (Bangla stays Bangla).
- No research-citation or "not reviewed" labels inside the app; sources live in code comments and docs.
- Write plainly: no filler, no emojis. Say what is fact, what is inference.
- Before testing in the browser, back up localStorage (`ritu-season-farms-v1`, `ritu-evidence-v2`, `ritu-field-log-v1`) and restore it afterwards. Note photos live in IndexedDB `ritu-note-photos`.

## Checks before handing back

`npm run typecheck`, `npm run lint`, `npm test` (647 tests passing at handoff), `npx prettier --check` on changed files, then `npm run build`. Dev server: `npm run dev` (127.0.0.1:3000).

## State at handoff (9 Nov 2026)

About 100 files are **staged, not committed**. Suggested first step: Alve reviews `git diff --cached --stat` and commits a checkpoint himself.

Where things are:
- Year plans: `src/domain/rotation/` (schedule, assess, crop-weeks, day-plan, crop-end) and `src/data/rotation-crops.ts` (12 crops, 24 suggested patterns), `src/data/crop-jobs.ts`.
- Plan page: `src/components/rotation/rotation-plans.tsx`. Calendar page: `src/components/rotation/rotation-calendar.tsx` (Today card, week, month, day sheet, Fix it box, ended-crop card, end sheet). Plan sequence on tiles: `plot-plan.tsx`.
- Plots and lands: `src/components/plot-setup.tsx`, `src/domain/plot.ts`, store `src/lib/season-store.ts`. Notes and reminders: `src/components/notes/`, `src/lib/field-log-store.ts`.

Built in the last sessions (all staged):
- Calendar page redesign: today card with weather, week strip, month calendar with irrigation, day sheet with weather, notes, tags, photos, reminders.
- "Your notes" page with land/plot selectors; reminder popup and phone notifications.
- Plan confirmation, "Your plan" view, sown seasons locked when the plan changes.
- Demo date removed. Sowing and harvest can be recorded for any valid day; days after today are saved as planned (`plannedSowDate`, `plannedHarvestDate`) and the card asks on the day.
- Deadlines (`src/domain/rotation/crop-end.ts`): last sowing day = earlier of 45 days after the best time or the last day that fits before the next crop's best time ends; last harvest day likewise. Late and last-chance warnings, automatic cancel, direct cancel with reason and restore, crop lost (with note) and sow again, harvested early (from 14 days after sowing), closed when no harvest is entered.
- Plots can be deleted (nothing recorded) or stopped (records kept) and used again, from "Edit or remove plot".
- New crops in suggested plans: tomato (transplant 1 Oct to 30 Nov, about 110 days) and maize (sow 1 Nov to 15 Dec, 112 days), plus sesame plans. Tomato after potato scores lower (same family, bacterial wilt).
- Per-plot water and drainage overrides ("This plot is different from the land"), default "Same as the land". Soil texture and pH stay on the land by Alve's choice.

## Open items, in priority order

1. **NASA IMERG and SMAP** (next task). Alve is creating his Earthdata Login and approving "NASA GESDISC DATA ARCHIVE", then running `earthaccess.login(strategy='interactive', persist=True)` on his Mac. Then: write `scripts/fetch-nasa-rajshahi.py` that pulls only a small box around Rajshahi from IMERG Final daily V07 (`GPM_3IMERGDF`) and SMAP L4 V8 (`SPL4SMGP`), and saves a small processed JSON into `src/data/` with product, version, period, grid and retrieval date. The app reads that file; it never logs in to NASA. Planned uses: dry-spell risk in each crop's weeks (IMERG), typical root-zone wetness by week, e.g. at sowing (SMAP, a model estimate, not a plot measurement). Preview any screen change first.
2. Values not yet checked against a source: tomato and maize heat limits and soil fits, maize sowing window (estimated from the DAE calendar's start week). Tomato and maize have no field-job reminders until a BARI guide is found.
3. Not yet seen in a browser because today's date can't reach them: the late-sowing, last-chance and automatic-cancel cards (their dates are covered by `crop-end.test.ts`).
4. Known behaviours: a plot created and stopped on the same day stays on the dashboard until the next day; picking a water/drainage value equal to the land's still saves it as the plot's own.
5. Offered to Alve, not decided: show the crop progress bar greyed before sowing; an "Another day" date button on the sow card; a per-plot history of cancelled and lost crops in Your notes.
