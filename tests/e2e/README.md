# Browser acceptance tests

The active suite is selected by `playwright.config.ts`: `season-*.spec.ts`, `farm-audio.spec.ts`, `finalization-animation.spec.ts` and `finalization-edge.spec.ts`. It covers the one-crop/multiple-farm workflow, records, recovery, providers, crop screening, navigation, tours, audio, scientific tools and responsive rendering. Run `npm run test:browser` (desktop and mobile).

`season-full-sweep.spec.ts` adds the 5 November regressions for cross-tab resets, storage deletion, unsaved-draft export, map metadata, late GPS callbacks, local soil dates, Bangla categories, photo retries and measured bottom-navigation spacing. Its test fixtures stay inside isolated browser contexts.

`season-fields-calendar.spec.ts` covers the 6 November field registry and calendar: multiple countries, inherited locations and local clocks, subdivisions and area limits, resizing without journal loss, recovery of pending fields, live task/draft feedback, growing-period shading and temporary date preview. It verifies byte-for-byte preservation of saved records during preview, including early harvest and continuing perennial crops. These activities are QA inputs in isolated contexts, not shipped farm data.

Other spec files preserve the earlier experimental workflow's tests and investigation history. They are excluded by `testMatch` because those prototype screens, sample calendars and invented ranking rules are no longer production features. Their historical passing counts are not current acceptance evidence. Do not quietly reactivate their sample-data contracts.

Provider responses intercepted by the current browser tests are test fixtures only. Separate live-provider smoke checks are required to establish upstream connectivity; browser tests do not prove field efficacy.

Avoid editing application modules during a development-server acceptance run: Fast Refresh can deliberately reload a page while a test is reloading it. Preserve the trace, inspect the collision, then verify the affected case on a production build; do not conceal it with retries or a longer timeout.
