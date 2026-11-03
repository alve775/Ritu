# Navigation, first-visit guides and audio repairs — 3 November 2026

This follow-up supersedes the access and legacy-tour migration assumptions in [the earlier page-tour update](PAGE_TOURS_AND_DASHBOARD_2026-11-03.md). Existing farm records are preserved. These changes remain local; the previously published checkpoint is still `367b9cf`.

## Reproduced problems and repairs

### Calendar access was based on the wrong evidence

A stored `activeId` was enough to unlock page 4, even when page 3 was locked for the current setup. This reproduces the reported screenshot: an older farm can coexist with an unconfirmed new land draft.

The store now separates the remembered farm ID from `calendarAccessId`. Only **Create my farm** or explicitly **Open farm** on the dashboard (or switch to another saved farm inside an already opened workspace) grants access. Old records without the new field stay valid but do not silently grant access. Entering land or crop setup immediately disables the calendar and revokes the old grant. Opening `/plan` or `/track` directly obeys the same check, including after reload. A completed saved farm can still be resumed deliberately from the dashboard; creating a new plan still requires confirming land and choosing a crop.

### An old global flag suppressed the new land guide

The earlier migration interpreted `ritu-tour-v1=seen` as proof that the new page-2 guide had already been seen. That inference was wrong. The new page guides now acknowledge only their own `ritu-page-tours-v1` records or their page-specific session fallback. Old global flags suppress none of them. Guides actually completed or dismissed under the new per-page system remain acknowledged; farm records are not cleared to repair tour history.

### Muted playback and missing spoken narration

Clicking Play while a saved volume of zero remained in force produced silence. An explicit Play action, or enabling quiet clicks while muted, now restores volume to 35%. Deliberately setting the slider back to zero still mutes output. Synthesized farm/click levels were increased within available headroom. Unsupported/blocked audio reports an unavailable status, rather than silently failing. The audio engine supports the prefixed Web Audio constructor where available. The Reading & sound launcher stays disabled until client state is ready, avoiding a dead click on a server-rendered button before its handler attaches.

Spoken tour narration did not exist before this repair. Each guide step now offers **Read this step aloud**, a choice among available matching voices, and **Stop speaking**. Playback requires an explicit click. Speech stops on step/language changes, tour closure, global mute or a hidden tab. The spoken text is the actual visible title and description. A missing matching-language voice, blocked start or engine error is exposed instead of being reported as successful playback.

Browser voice discovery and asynchronous voice availability follow [the browser speech API](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices); speech submission uses [speak](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/speak). Web Audio startup checks the result of [AudioContext.resume](https://developer.mozilla.org/en-US/docs/Web/API/AudioContext/resume). No external paid speech service, arbitrary sound file or fabricated voice is substituted.

## Real runtime evidence

The unmocked Web Audio graph probe measured:

| State | Maximum absolute sample |
|---|---:|
| Farm sound, after explicit Play restored volume | 0.0368067 |
| Muted | 0 |
| Quiet click after explicit re-enable | 0.0206699 |

One real audio context was used and no page errors were reported. These are browser graph measurements, not measurements of physical speaker output. [Raw evidence](../output/audit/navigation-repairs-2026-11-03/native-audio.json) and [controls screenshot](../output/audit/navigation-repairs-2026-11-03/working-audio-controls.png).

The browser's real speech engine exposed Microsoft David, Mark and Zira, all English (US), and no Bangla voice. An actual user click started Microsoft David through the native speech API, producing a real start event and no speech/page error before deliberate Stop. [Native speech evidence](../output/audit/navigation-repairs-2026-11-03/native-speech.json) and [narration screenshot](../output/audit/navigation-repairs-2026-11-03/native-tour-narration.png). Bangla voice routing is tested with an explicitly synthetic browser adapter; native Bangla playback cannot be claimed on this machine because the browser exposes no matching voice. The interface states that limitation and allows checking voices again.

## Test record

All eight initial bug reproductions failed before the repairs: four observed/absent behaviors on desktop and phone. Traces and reports are retained in `research/navigation-repairs-2026-11-03/before/` and `before.json`.

The first follow-ups identified cold page-load waits, an outdated farm-name selector, and a click before the Reading launcher hydrated. The label/readiness fixes and explicit browser readiness resolved those. The focused native graph, mute, scene-change, hidden-tab, persisted mute and blocked-context cases subsequently passed 4/4. The full run also revealed that polling after a 65 ms click can miss its waveform; the final sampler records during the click instead of weakening the nonzero-output assertion.

The broad development-server run finished **109/114 passed**. Its five failed cases included the short-click sampling problem, page-load/interaction stalls and a recorded Windows `UNKNOWN ... write` runner error. Initial failures are preserved; no assertion or timeout was removed to declare success.

After correcting the short-click measurement window, the final **production-server follow-up passed 28/28**, including all five formerly failing cases, both complete first-visit journeys, direct URL checks, stale/explicit old-record revocation, native farm/click graph checks, speech-adapter failure/language/cancellation checks and multiple-farm isolation. All 114 distinct broad cases therefore have a passing result across the broad run and focused follow-up; this is not a single uninterrupted 114/114 run. Reports: `research/navigation-repairs-2026-11-03/regression.json` and `production-followup.json`.

The complete unit/API suite passed **566/566**. The final production build, TypeScript, ESLint, scoped formatting and diff checks passed. The verified production build is serving `http://127.0.0.1:3000`. The earlier exhaustive crop-screening matrices were not rerun because the recommendation algorithm is unchanged. Native Bangla audio remains unavailable in this browser; synthetic voice-adapter tests establish routing behavior, not the existence of an installed voice.
