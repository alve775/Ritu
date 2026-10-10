# Ritu app footage — 7 October 2026

Recorded from the running local production build using Computer Use in Chrome. These are real interactions with the prototype. The source app was not changed for recording.

## Ready to import

- `RITU_WHAT_Demo_60s.mp4`: six consecutive 10-second app scenes.
- `RITU_HOW_Climate_Decisions_20s.mp4`: two consecutive 10-second scenario scenes.
- `clips/`: nine individual 10-second MP4s, including an additional soil/water take.
- Original uncut recordings: `ritu-computer-walkthrough.webm` and `ritu-scenario-take.webm`.

MP4 exports: 1920 × 1080, 30 fps, H.264, silent. Aspect ratio is preserved with narrow green padding where necessary. Narration below is suggested text, not recorded audio. Keep the visible prototype/simulation notices when editing.

## WHAT narration — 60 seconds

| Time | File | Suggested narration |
| --- | --- | --- |
| 0–10 | `clips/01-farm.mp4` | “Ritu begins with the farmer’s field. A simple profile captures the conditions that matter for planning the next season.” |
| 10–20 | `clips/02-crop-choices.mp4` | “Farmers explore crop choices and select what they want to grow. Ritu uses those choices to build illustrative seasonal options.” |
| 20–30 | `clips/03-seasonal-calendars.mp4` | “Compare crop rotations across the year. See planting windows, harvest periods, and rest intervals together in one calendar.” |
| 30–40 | `clips/04-explain-the-choice.mp4` | “Each option explains its reasoning and uncertainties. These demo rules help farmers ask better questions before making a decision.” |
| 40–50 | `clips/05-track-progress.mp4` | “Save a calendar, mark planting and harvesting, and keep notes. A seasonal plan becomes a record farmers can review.” |
| 50–60 | `clips/06-bangla-access.mp4` | “With English and Bangla interfaces, Ritu makes the same planning workflow available in a language farmers can understand.” |

## HOW scenario narration — 20 seconds

| Time | File | Suggested narration |
| --- | --- | --- |
| 0–10 | `clips/07-water-scenario.mp4` | “As climate conditions change, farmers need to examine alternatives. Ritu’s prototype lets them test different water and climate scenarios.” |
| 10–20 | `clips/08-drier-scenario-result.mp4` | “In this simulated dry example, the chosen crops have no compatible calendar. Ritu flags the problem while preserving the saved farm.” |

This demonstrates a decision-support interaction, not a climate forecast or a validated farming recommendation. Under rainfall-only irrigation alone, the sample calendars remain compatible; adding the drier example removes them. The saved farm remains unchanged, and resetting the draft restores its original comparison.

## Remaining HOW scenes for the planned 60-second chapter

Use the 20-second scenario footage above first, then four 10-second illustration/title scenes in your editor or Flow. These future-work scenes were not screen-recorded because they are project goals.

| Time | Visual | Suggested narration |
| --- | --- | --- |
| 20–30 | Seasonal calendar beside a farmer discussing options | “Our goal is to support climate adaptation through clearer seasonal planning, with local knowledge guiding every practical decision.” |
| 30–40 | Earth observation, local field checks, and review icons | “Next, we plan to connect NASA environmental data and work with agricultural experts to review the rules and planting windows.” |
| 40–50 | Rajshahi farmers and an agricultural partner reviewing a plan | “We need pilot partners, farmer feedback, and field evidence to test usefulness, understand limitations, and improve the tool.” |
| 50–60 | Ritu logo, farmer, and seasonal calendar | “Ritu’s vision is informed decisions for a changing climate—helping farmers plan with greater clarity, one season at a time.” |

## Claims to preserve

The current environment, climate scenarios, crop matching, and planting windows use authored mock data. NASA data is planned, not connected. Water savings, improved yield or income, soil benefits, and climate adaptation outcomes have not been demonstrated by this recording. Present them as goals to test, not measured results.

## Recording details

The app was served at `http://127.0.0.1:3107`. A temporary loopback-only Chrome tab recorder saved the source footage locally. No microphone or system audio was captured. Browser controls and other apps are excluded from the captured tab. Idle time and failed UI attempts were cut from the MP4s. `capture-cuts.json` records the source offsets.
