# Farm animation movement repairs — 5 November 2026

The harvest bundle and watering can were siblings of the worker rather than children of the moving arm. This let the hands slide away from their props. Seeds and droplets also began at fixed scene coordinates independently of the gestures. The earlier animation checks verified chapter selection, playback and reduced motion; they did not verify these contacts.

The first contact repair still left an anatomical defect: the shirt covered the reaching upper arm, so the forearm appeared to emerge from the waist. Moving it across the shirt exposed the shoulder but made the arms intersect. Separating the outlines then left the arms with unequal lengths. The harvest arms now share one articulated drawing: each upper arm is 20 illustration units and each forearm 18, with the existing hand size retained. These are artwork proportions, not anatomical measurements. Shoulder, elbow and wrist rotations produce the pose without extending either limb. The grain hand keeps the bundle upright as it lifts; the other hand carries the sickle below it. The approach, cut, lift and rest views were inspected as whole figures and compared with sowing and watering at the same scale. Passing grip-coordinate checks alone had not established a readable, proportionate pose.

## Changes

- Grain travels with the holding arm, with visible stems converging inside the grip. The other hand holds the sickle and sweeps its blade below the stems. The stalks remain in position during the approach, lift after the cut, then settle. Harvest completes one action instead of repeatedly swinging through the same bundle.
- The watering can shares the arm's movement and the stream originates at its rose. The handle is drawn behind the fingers. Water falls from the moving outlet rather than appearing at a fixed point beside it.
- Sowing now has a reach, open-hand hold and recovery. Seeds are released during the hold and travel independently of the returning arm. The basket follows the supporting hand and torso.
- Chapter-relative start times keep the gestures consistent when selecting a chapter, playing through a transition or replaying. The growth artwork's stem bases remain at ground level as the plants scale upward.
- The existing 2D characters, background, sequential chapters, controls, pause behavior and motion preferences remain. This is an illustrative sequence, not an agronomic instruction or growth forecast.

## Verification

The focused desktop and phone suite checks playback, chapter boundaries, replay and reduced motion, plus 81 time samples per activity. Three hand/prop pairs across two viewports give **486 contact measurements**, with less than 0.01 screen-pixel separation at each grip. Separate checks require actual object movement, blade contact before lifting, a settled final harvest pose and seed release at the open fingers. [Browser results](../output/audit/motion-repair-2026-11-05/browser-tests.json).

An additional regression rasterizes the actual arm, sleeve and hand SVG paths into separate masks. It reproduced **500 intersecting pixels** in the rejected pose at 23 seconds. After the pose change it found **zero intersections at 81 times on each of two viewports**, while verifying both masks contain painted geometry. A further regression measures the shoulder-to-elbow and elbow-to-wrist distances in each of those poses, requiring equal, unchanged segment lengths for both arms. The full focused suite now passes **12/12 cases**. These checks address intersections and stretching; they do not certify all aspects of anatomical realism. The initial failing result remains in `research/motion-repair-2026-11-05/overlap-before.json`.

**32 timed frames** were captured across all four scenes on desktop and phone, with no browser page errors. The contact sheet uses a fixed illustration crop so changes in automatic framing do not masquerade as character movement. [Frame ledger](../output/audit/motion-repair-2026-11-05/frames.json), [contact sheet](../output/audit/motion-repair-2026-11-05/motion-contact-sheet.png).

The [same-scale figure comparison](../output/audit/motion-repair-2026-11-05/worker-proportions.png) uses the same actor-local crop and output dimensions for sowing, watering and harvest, preserving their relative proportions. Sowing and watering drawings were preserved in this proportion correction.

The optimized production build, TypeScript, focused ESLint, formatting and Git whitespace checks passed. Tests cover Chromium desktop and phone emulation; they do not establish physical-device or every-browser behavior. Changes are local and have not been committed or pushed in this follow-up.
