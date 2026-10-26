# RITU landing animation: original 2D storyboard

Current requirement: **detailed 2D, chronological actions, one scene at a time**. This supersedes the earlier three-worker montage and the abandoned Three.js landing scene. Do not restore those versions while continuing the project.

## Research and interpretation

Primary professional sources checked October 26, 2026:

- [Walt Disney Animation Studios: Story](https://www.disneyanimation.com/process/story/) describes planning narrative, expression, timing, staging and framing with storyboards.
- [Disney: Layout and Final Layout](https://www.disneyanimation.com/process/layout/) describes shot-by-shot staging and reviewing continuity, composition and clarity between shots.
- [Adobe: Principles of Animation](https://www.adobe.com/creativecloud/animation/discover/principles-of-animation.html) explains staging attention, anticipation, follow-through, and easing between poses.
- [W3C WCAG 2.2: Pause, Stop, Hide](https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html) supports a way to stop ongoing decorative motion.
- [MDN: SVG animateTransform](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/animateTransform) documents the native SVG transform animation used in the illustration.

These are professional production and accessibility guidelines. They do not establish a universal rule that all animation must be sequential, nor prove farmer comprehension. We chose a sequential storyboard for this crop-cycle narrative and the user's explicit request. Its pacing needs user feedback; no scientifically optimal duration is claimed.

## Story and timing

| Chapter | Playback interval | Focal action                                                                           |
| ------- | ----------------- | -------------------------------------------------------------------------------------- |
| Sow     | 0–7 seconds       | One farmer scatters seed over prepared soil.                                           |
| Care    | 7–14 seconds      | The same farmer waters young cereal plants.                                            |
| Grow    | 14–23 seconds     | Plants develop, then the grain changes from green to gold. No competing worker action. |
| Harvest | 23–31 seconds     | The same farmer gathers grain beside cut stubble.                                      |

The Bengal homestead, canal, tree, bridge and framing persist between chapters. Clothing stays consistent. Only the active chapter is mounted. A 450 ms fade-out precedes the handoff, followed by a 450 ms fade-in: two farmer actions never crossfade over each other. Background movement remains subordinate.

This is an original editorial illustration, **not NASA imagery, a measured sowing-spacing diagram, a growth forecast, or a demonstration of a specific recommended cultivar or irrigation method**. The compressed seconds are unrelated to biological growing days.

## Controls and lifecycle

- Chapter buttons select a shot and hold it paused for inspection.
- Play continues from the selected chapter; Replay starts at sowing.
- Pause preserves the SVG clock, chapter and character pose.
- Reduced motion and the site's motion preference stop automatic playback; chapter buttons remain usable.
- Motion stops offscreen and in a hidden browser tab, then resumes from the preserved clock.
- Compact controls and the brief caption remain below the artwork.
- The SVG is present in the rendered page: it requires no WebGL, downloaded 3D model, external image API or autoplay audio.

## Implementation and verification

### Responsive framing repair

Latest clarified target: the pale canal-to-soil band is removed by matching the field surface/clip to the canal's lower contour. `FIELD_SURFACE` is shared by soil, texture and clip; the bridge is painted above them. See the exact before/after crops and targeted seam regression in [the correction record](EDGE_CORRECTION_2026-10-26.md). This is distinct from outer layout gutters.

Follow-up: [the edge correction](EDGE_CORRECTION_2026-10-26.md) also removes the landing's outer padding/gap and fills the final row on tall tablets. SVG sizing alone did not establish that the surrounding layout was free of gutters. Keep both the outer-layout and pixel checks when changing this scene.

The reported pale strips had two causes: letterboxing from a fixed SVG aspect ratio and paths that stopped inside the visible frame. A ResizeObserver now derives the camera width from the actual illustration width/height, retaining uniform scaling. Background sky, terrain, water and foreground furrows extend beyond the view; the sun, house, hay, banana and large tree are positioned within the responsive composition. Worker proportions and the single-active-shot handoff remain intact. The external toolbar is intentional, not an uncovered strip in the artwork.

Narrow or tall viewports use one column so a portrait tablet does not clip the farmer inside a desktop half-column. Frame/worker/landmark geometry is exercised across all four chapters at nine viewport sizes, including wide/shallow layouts, tall tablets and a 320px phone. See [the current audit](USABILITY_AUDIT_2026-10-26.md) for source research, accepted screenshots and verification accounting. Do not infer universal artistic or agronomic correctness from those checks.

- `src/components/landing/farm-illustration.tsx`: original vector artwork and mutually exclusive shots.
- `growing-scene.tsx`: playback, accessibility and lifecycle.
- `farm-story.ts`: chapter timing and fade calculation.
- `src/styles/pages/farm-scene.css`: layout and external controls.
- `farm-story.test.ts`: boundaries, wraparound and fade behavior.
- `tests/e2e/finalization-animation.spec.ts`: automatic sequencing, one active action, pause/replay, direct chapter selection and reduced motion on desktop/mobile.

Record actual completed checks in `FINALIZATION_2026-10-26.md`; screenshots or a passing build alone do not validate every farming method.
