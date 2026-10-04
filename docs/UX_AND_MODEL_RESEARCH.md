# Guided missions and crop models — research notes

Reviewed October 3, 2026. Sources inform the interaction and plant anatomy. They do not establish local crop suitability or validate the sample calendar.

The later [evidence and usability audit](EVIDENCE_AND_USABILITY_AUDIT.md) documents the simpler layout, larger text, streamed words, opt-in sound, season references and removal of unsupported water/drainage conclusions. Use it for the current evidence boundary.

## Guided tour interaction

The [W3C modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) specifies initial focus inside the dialog, Tab/Shift+Tab containment, Escape dismissal and focus restoration. [W3C technique H102](https://www.w3.org/WAI/WCAG22/Techniques/html/H102) explains the browser support supplied by native `dialog`.

Implementation: native modal tour, readable mission card, a visible outline around the real control, explicit keyboard cycling, Back/Next/Skip, progress and section replay. The page outside the tour is inert. Route changes are deliberate steps and do not edit farm inputs. Tour copy describes the control; a visitor exits the tour to use the actual form. English/Bangla can be changed inside the tour. First-visit prompting and dismissal use a separate versioned browser key. Desktop and phone positions are recalculated on route, language and viewport changes.

The four mission groups and the choice of spotlight navigation are project design decisions, not findings from a farmer usability study. They still need review by intended users. Tour completion records that the interface was shown; it does not certify a farming decision.

## Anatomy used in original schematic geometry

| Crop | Source-supported structure | Primary source |
| --- | --- | --- |
| Rice | Narrow leaves and branched panicles with spikelets; distinct from a compact wheat spike | [UC Davis rice anatomy](https://labs.plb.ucdavis.edu/rost/rice/stems/panicle.html) |
| Rice development | Vegetative, reproductive and ripening are different phases | [IRRI-hosted Principles and Practices of Rice Production, chapter 5](https://books.irri.org/0471097608_content.pdf) |
| Wheat | Leaves, tillers and an emerging spike; awns and spikelets are shown as an example, with variety differences acknowledged | [University of Arizona, Wheat Development Stages](https://extension.arizona.edu/publication/wheat-development-stages) |
| Mung bean | Trifoliate leaves and pods; cultivar development varies | [University of Queensland, Mungbeans unmasked](https://qaafi.uq.edu.au/article/2021/02/mungbeans-unmasked), [Journal of Integrated Pest Management, mungbean morphology](https://academic.oup.com/jipm/article/13/1/4/6524412) |
| Potato | Compound foliage; tubers arise on underground stems called stolons | [International Potato Center, How Potato Grows](https://cipotato.org/potato/how-potato-grows/) |

`crop-geometry.ts` draws these structures procedurally; no source illustrations or photographs were copied. Models simplify geometry and relative proportions. The young/mature selector is an educational example, independent of the selected calendar month. Roots, tuber counts, plant spacing and cutaway dimensions are artistic, not estimates of actual growth, density, soil horizons or yield. The soil view is an open schematic section, not a map of a sampled profile. No irrigation depth, water requirement, fertilizer or pesticide rate is inferred.

Design inference: sample month positions alone do not establish an observed biological stage. Therefore the app keeps calendar activities and plant-structure examples separate. The IRRI PDF phase descriptions were verified through the indexed official-source excerpt; the full PDF fetch timed out. Anatomy details also use the accessible UC Davis, university extension and crop-research pages linked above.

## Three.js implementation

[Three.js rendering on demand](https://threejs.org/manual/pages/rendering-on-demand.html) describes drawing when controls or data change. [Three.js cleanup](https://threejs.org/manual/pages/cleanup.html) explains explicit disposal of graphics resources. [InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html) supports repeated geometry in a small number of draw calls.

The field batches plant components by geometry/material, updates only when the crop/form/view changes, and uses no idle animation loop. Camera changes and resizes request a draw. Switching to a study view changes the camera target and reset position. Drag rotation remains opt-in. Scene closure disposes instances, geometry, materials, controls, shadows and the renderer; context loss exposes the planning fallback. These choices have been checked in Chromium, but physical-device GPU coverage and energy consumption have not been measured.

## Evidence that remains outstanding

No cultivar-specific Rajshahi stage observations, validated planting dates, NASA measurements, surveyed parcel boundary, soil profile or real farmer usability study is included. Integrate these separately with provenance. Keep anatomy references, sample calendar assumptions and future measurements visibly distinct.

## Fluid exploration and motion

Reviewed October 3 using [MDN Element.animate](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate), [MDN reduced-motion media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion), [W3C Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) and [web.dev animation performance guidance](https://web.dev/articles/animations-guide). Native Web Animations provide cancellable transitions. Transform and opacity animate the card, spotlight and copy; geometry is measured at the start of a step, rather than recalculated through React on every animation frame.

Project timing choices: outgoing instructions fade over 160ms; page travel and the floating focus transition take 900ms; instruction blocks enter over 340ms while whole words fade in over a bounded stagger (up to about 830ms total). Navigation unlocks after travel and block entry settle. The focus title contains the full accessible text. Card positions are clamped; short phone viewports scroll instruction content while navigation stays visible. These timings are design choices, not usability-study results. Back/Next cannot queue accidental steps; Skip, Close and Escape remain available. Exit cancels outstanding animation, page travel and callbacks. System or app reduced motion settles the current transition; Show text instantly bypasses word animation.

Pages, dialogs, field opening, month details and controls share finite entrance/feedback transitions. Camera controls interpolate position/target over 520ms; pointer interaction interrupts camera travel. No camera animation runs at idle. [Three.js shadow-map documentation](https://threejs.org/docs/pages/WebGLRenderer.html#ShadowMap) supports manual shadow refresh for static lighting: the preview reuses shadows during camera travel and regenerates them when crop geometry or the study view changes.

Normal-motion browser checks sample intermediate scroll positions, spotlight animation, instruction opacity and card bounds; they exercise repeated clicks, mid-travel Escape and changes to reduced motion. WebGL draw instrumentation checks intermediate camera renders and verifies drawing stops after settling, including a motion-preference change. These are behavior checks, not an FPS benchmark or a guarantee across physical devices.
