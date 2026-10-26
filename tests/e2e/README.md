# Browser acceptance tests

`finalization*.spec.ts` cover the current real-only route contract, responsive layout, animation, tours and retained-help behavior. Run `npm run test:browser` (desktop and mobile).

Other spec files in this directory preserve the earlier experimental workflow's tests and investigation history. They are excluded by `testMatch` because those prototype screens, sample calendars and invented ranking rules are no longer production features. Their historical passing counts are not current acceptance evidence. Do not quietly reactivate their sample-data contracts.

Provider responses intercepted by the current browser tests are test fixtures only. Separate live-provider smoke checks are required to establish upstream connectivity; browser tests do not prove field efficacy.
