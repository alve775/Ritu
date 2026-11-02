# Full source catalogue and automatic plant-image API

> **Expanded audit, 2 November:** [Worldwide source and setup verification](GLOBAL_AUDIT_2026-11-01.md) supersedes the narrower test and image counts in this checkpoint. All 2,562 retained records, six distant environmental points, all 60 supported land profiles and 731 start dates were checked. Read that report and the exported per-entry ledger for current results, repaired source/image defects and remaining scientific limits.

Updated 1 November 2026. This supersedes the 23-species subset and the short-lived observation-photo/manual-image approaches. Earlier reports remain historical.

## User requirements retained

- Worldwide field setup, one chosen planting per farm, multiple independently saved farms.
- Include vegetables, fruits, nuts/peanuts, grains, pulses, roots, forage and other source-supported plants.
- Expose the full available catalogue without an arbitrary species/result cap.
- Use real sources. Missing evidence must not become invented dates, suitability claims or photographs.
- Fetch photos automatically through APIs; do not maintain a manually assigned production image list.
- Preserve existing records, the logo, navigation, farmer-facing simplicity and prior finished work.

## Catalogue and growing plans

The pinned [OpenCLIM distribution of FAO ECOCROP](https://github.com/OpenCLIM/ecocrop/blob/f13577f4237604b15d85d8e43741714a2d1eb2d4/EcoCrop_DB.csv) has 2,568 records. All 2,562 non-retired records are imported. Six Sorghum records remain excluded because the user previously removed sorghum. Scientific names, source IDs, source use categories, life forms, life spans, source aliases and missing numeric fields are retained. Existing crop IDs stay stable.

[FAO describes ECOCROP](https://www.fao.org/geospatial/data-and-tools/data-portals/ecocrop/en) as a limited environmental-characteristic database covering over 2,568 species. It is not a complete catalogue of every cultivar or every locally legal crop. RITU does not claim otherwise.

The default search shows food-use records that pass the current screen. Farmers can search common/scientific names, choose source use groups, filter life cycles and switch to the entire source catalogue. Pages contain twelve entries; all pages remain available. Incomplete/non-matching entries explain why they are not selectable. Peanut aliases find groundnut.

Matching runs server-side. Month-overlap arithmetic replaces per-day loops so the full source can be screened without shipping the large numeric requirement file or rendering thousands of cards in the browser. NASA POWER climate, known texture/drainage conflicts and available unextrapolated Sacks calendars remain the evidence inputs. Annual rainfall is not measured crop-season root-zone water.

Annual/biennial crop records with usable source periods keep the seasonal workflow. Perennial records get an explicitly labelled **365-day care/review horizon**, which is an application planning interval, not an ECOCROP time-to-first-harvest claim. Perennial harvesting does not close the planting; daily observation/water/weather checks continue. Actual observed stages can include harvested. Missing/zero growing periods are never replaced with an invented harvest date.

[University of Minnesota Extension's apple guide](https://extension.umn.edu/garden-and-home/yard-and-garden/gardening-in-minnesota/growing-apples) illustrates why first bearing cannot be inferred from a generic growing period: it depends on rootstock and establishment. Its Minnesota cultivar guidance is not applied worldwide. Local cultivar, chilling, rootstock, pollination, establishment and fruiting season still require regional evidence.

## Image delivery: API calls, not manual placement

Every current crop card and retained `CropPhoto` component requests the same live API. No active component reads the retired local image manifest. There is no observation-photo fallback, manual per-plant filename table, generated crop photograph or keyword-first image-search fallback.

1. Visible cards batch up to twelve catalogue IDs into `/api/plant-photo?plants=...`. The server accepts known catalogue IDs only; clients cannot supply a URL or arbitrary external query.
2. Wikipedia is queried by the stored **scientific name**, following its explicit normalization/redirect chain.
3. Wikidata records establish botanical identity through scientific taxon name `P225`. Exact scientific aliases and explicit scientific-name Wikipedia redirects support accepted-name changes. A fruit article without a scientific taxon is not sufficient: the service searches and validates the exact taxon. A variety must not silently become its parent species.
4. Candidate files come from the matched taxon's `P18` statements and its verified article lead image. The first fuzzy search hit or a photograph attached to an observation is never used.
5. Commons `imageinfo` returns the exact file description, image MIME, source URL, photographer and license. The parser verifies source/image hosts and matching file identity. It accepts public-domain, CC0, CC BY and CC BY-SA photographs; unsupported, missing, NC/ND and GFDL-only licenses are rejected.
6. Obvious drawings, herbarium plates, distribution graphics, drains, fences, signboards and cooked dishes are filtered. Available raw fruit/seed/pod/bulb/root references rank above seedling/flowering views. This ranking is a practical heuristic, not a claim of a validated computer-vision classifier.
7. The card displays the API's image URL directly, author, original Commons file, license and botanical identity link. `object-fit: contain` preserves the full image. Captions describe species references; they do not promise the farmer's cultivar or growth stage.

Requests are paced, deduplicated, cached and queued within bounds. `429`/`503` responses trigger provider backoff instead of repeated immediate requests. Client cards share batches and load near the viewport. Source outages show a retry action without disabling crop selection or modifying farm records. A missing reusable source image remains unavailable.

Primary API documentation: [MediaWiki PageImages](https://www.mediawiki.org/wiki/Extension:PageImages#API), [Commons imageinfo](https://www.mediawiki.org/wiki/API:Imageinfo), [Wikidata API](https://www.wikidata.org/wiki/Wikidata:Data_access).

## The rejected image approaches

The original iNaturalist fallback correctly matched an observation's taxon but did not establish that each attached photograph clearly showed the plant. That allowed a drain and a fence into the UI. Merely checking a license, taxonomy ID or content hash did not catch the visual defect.

That fallback has been removed. The interim manual-download workflow, manual manifest and its public assets are retired to ignored local research evidence. The user's latest instruction requires automatic API delivery. Older untouched image assets remain only as historical source/test evidence; the rendering components now use the API.

Source metadata and community curation cannot guarantee perfect identification of every cultivar or every photograph. RITU must not claim that all 2,562 images were manually reviewed or that every plant has an available photograph. This implementation removes the known wrong-source mechanism and supplies traceable API identities; unusual source mistakes remain reportable defects.

## Repeatable checks and evidence

`npm run audit:images` (or `node scripts/audit-plant-images.mjs`) checks API provenance/coverage for the original crops and representative fruits/nuts. `--all` iterates every retained source identity, respecting provider backoff. This is automated source/coverage checking, not manual visual verification of every plant. It writes an incremental evidence file under ignored `research/plant-catalogue-2026-11-01/` and distinguishes unavailable images from provider failures and invalid provenance.

Current live evidence:

- All **32** representative plant requests returned matching scientific identities, Commons source links, botanical-record links and license/credit metadata. No missing/error/invalid-provenance result in that run.
- Twelve actual remote images decoded in Chromium. A contact sheet records tomato, pepper, papaya, cabbage, cotton, radish, garlic, mango, apple, wild strawberry, plum and spinach.
- The actual crop UI loaded real NASA growing context, then real API tomato, pepper and papaya photos. Desktop/card/phone screenshots and the browser's image-API request log were saved. No local crop-image fallback and no page errors occurred.
- Deterministic regression tests cover exact scientific redirects, varieties, rejection of a fuzzy first result, drain/fence/non-photo filtering, bad licenses/hosts/file identities, caching, endpoint bounds and retry after a source failure.
- Desktop/phone tests cover catalogue pagination/search, incomplete records, perennial care, source credits, contained image framing and image failures without blocking farm creation.

Evidence files: `api-coverage-sample.json`, `live-api-images.json`, `live-api-photo-review.png`, `actual-card-*.png`, `live-browser-image-audit.json`, unit/browser/build result files. Test replays are identified as fixtures; they are not production mock data.

## Production boundaries to keep visible

- This is preliminary species screening, not an agronomist-validated best-crop, yield, irrigation-dose or profitability model.
- Soil chemistry, cultivar choice, pests, legal/invasive status, perennial hardiness/fruiting and actual field effectiveness need additional local evidence.
- Farms remain browser-local with export/recovery, not cloud account synchronization.
- A multi-instance deployment needs shared cache/egress coordination; current in-memory pacing is per server process. Public provider quotas and availability cannot be guaranteed.
- Continue to preserve older farm/rotation records and do not silently fill missing facts, dates or photographs.

## Earlier verification checkpoint

Current full results: **469 unit/API tests passed; 280 season-workflow browser tests passed**, including 256 complete land-input flows across eight real-climate fixtures and desktop/phone projects. The eight additional layout/animation browser checks also passed: **288 browser checks total**, no failures, skips or flaky outcomes. **The production build passed**, and a temporary production server returned real API tomato/cabbage photos and a NASA-backed mango search against all 2,562 catalogue records. The temporary server was stopped; the existing development preview remains running. The deterministic browser matrix replays recorded climate and photo metadata; the separate live image run uses actual online API/CDN requests. Initial failures included a scientific-name case-sensitivity bug, an overriding `object-fit: cover` rule, tests that expected off-screen lazy images to load, and a test setup hook that returned a mock as a teardown. Fixes and final reruns distinguish application defects from test-harness defects.


## Continuation checklist

- [x] Import all non-retired source records; preserve existing farm identities.
- [x] Search and paginate source uses, vegetables, fruit/nuts and life cycles.
- [x] Keep missing growing periods non-selectable rather than inventing harvest dates.
- [x] Distinguish perennial care reviews from first-fruit predictions.
- [x] Replace observation/manual images with live API delivery in all crop-photo components.
- [x] Batch/cache/pacing, source credits, licenses, identity links and retry/unavailable states.
- [x] 32 live source/provenance checks; 12 actual CDN images decoded; actual UI captures.
- [x] 469 unit/API tests; 288 browser checks; TypeScript, scoped lint/formatting and production build.
- [x] Live production image and real-NASA-backed search smoke test.
- [x] Full 2,562-record API identity coverage and subsequent file/subject review now have durable evidence in the expanded audit linked above. Use its current completion status and per-entry image results rather than this earlier sample count.
- [ ] Farmer usability/field effectiveness validation and cultivar-specific regional evidence.
- [ ] Shared provider pacing/cache if deployed across multiple server instances; account/cloud sync if required.
