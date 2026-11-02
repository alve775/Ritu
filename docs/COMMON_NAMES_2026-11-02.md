# Common names and main-branch publication — 2 November 2026

The recommendation list now uses common names. English mode shows the common source label and an available Bangla name; Bangla mode shows the Bangla name and an available English name. The same formatter is used by the selected-crop summary, saved-farm tiles, calendar headings, image alternative text and image-loading states.

Latin scientific subtitles and parenthetical Latin qualifiers are removed from recommendation labels. Scientific identity remains in the collapsed **Source record** section and in the internal source data, search and photo matching. No taxon ID, suitability rule, calendar calculation or saved farm is rewritten.

Missing names remain missing. The source has 911 records whose original English display value was just the scientific name. Those now have a localized “Common name unrecorded” label with the source record number instead. Records without a verified Bangla name retain their common source label with a visible Bangla translation-gap note. Existing sourced Bangla names are reused only through whole common-name matches; no guessed translations or Latin transliterations are claimed as established Bengali names. No catalogue records are dropped because of naming gaps.

References: the existing [Bangladesh crop-name references](../src/data/crop-catalogue.ts), imported [ECOCROP source](https://github.com/OpenCLIM/ecocrop/blob/f13577f4237604b15d85d8e43741714a2d1eb2d4/EcoCrop_DB.csv), and the official [BAMIS Bangla crop directory](https://www.bamis.gov.bd/thresholds/) / [English directory](https://www.bamis.gov.bd/en/thresholds/), checked on 2 November. These references establish names, not farm suitability.

## Verification

- **499 unit/API tests passed**, including label checks across every retained plant and both languages.
- **20 desktop/phone browser cases passed**: six real-environment locations through farm creation, English/Bangla names, missing-name records, photo framing/source credits and source outages. Browser bulk tests replay recorded real environmental responses; photo render tests use fixtures. Actual-provider image evidence remains in the completed worldwide audit.
- Production build, TypeScript, source/script lint and scoped formatting passed.
- Desktop and phone common-name screenshots were visually reviewed. The one-pixel image fixture tests labels/layout only; it is not a replacement production photo.

The earlier [worldwide audit](GLOBAL_AUDIT_2026-11-01.md), its 495-test result, 752 browser cases, source hashes, per-plant CSV and November 1 screenshot PDF remain frozen historical evidence. The label change does not alter the scientific screening results. Follow-up logs are in `research/common-names-2026-11-02/`; a shareable test summary is in `output/audit/RITU_Common_Names_Verification.json`.

The authorized commit includes the accumulated worldwide single-plant farm workflow, source/image repairs, tests, documentation and PDF/CSV exports. Local provider captures, dependencies, build output, browser traces, credentials and Python caches are excluded by `.gitignore`.
