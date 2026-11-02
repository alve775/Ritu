# Worldwide crop, setup and source audit — 1–2 November 2026

The exhaustive date matrix uses a frozen reference start of 1 November 2026. Subsequent source/image review and final regression checks continued on 2 November; dated screenshots and forecasts remain labelled with their original capture times.

This audit covers every **2,562 retained ECOCROP catalogue entry**, not only the first page of results. Six Sorghum records remain excluded at the user's request. Verification is against identified source records and the implemented screening contract. It is **not field validation of every species, cultivar or farming method**.

## Scope and reproducible evidence

| Location                     | Coordinates        | Genuine environmental evidence                     |
| ---------------------------- | ------------------ | -------------------------------------------------- |
| Manikganj, Bangladesh        | 23.86186, 90.00273 | NASA POWER 1991–2020 baseline; dated live forecast |
| Washington DC, United States | 38.9072, −77.0369  | Same providers, independently requested point      |
| Novosibirsk, Russia          | 55.0084, 82.9357   | Same providers, independently requested point      |
| São Paulo, Brazil            | −23.5505, −46.6333 | Same providers, independently requested point      |
| Griffith, Australia          | −34.2892, 146.0509 | Same providers, independently requested point      |
| Nairobi, Kenya               | −1.2864, 36.8172   | Same providers, independently requested point      |

These coordinates are QA locations, not surveyed farms. Entered soil, drainage, water supply, field names and area are **test assumptions**, not NASA measurements. Actual original NASA responses, URLs, capture timestamps and SHA-256 hashes are retained in `research/global-audit-2026-11-01/`. Browser matrix tests replay those real responses to avoid repeatedly consuming public-provider quotas. They do not inject mock environmental data into production.

- **Finite setup space:** 4 soil choices × 3 drainage choices × 5 water choices = 60 land profiles at each point.
- **Date space:** every day from 1 November 2026 through 1 November 2028, inclusive: 731 start dates, including leap day. This produces 263,160 screening calls when complete.
- **Independent reference:** a daily temperature-prefix and sparse-range oracle checks eligibility, ordering, next planting window, season mean, source-derived durations, calendar end dates and uncertainty messages. Production uses month-overlap arithmetic. Per-crop/month/profile saved records and daily actions are also exercised.
- **Browser coverage:** all 60 profiles × 6 points × desktop and phone = 720 complete input workflows. A legitimate empty result must remain non-selectable. Separate tests cover multiple farms, notes, observations, export, recovery, tours, search, pagination, accessibility and source outages.
- **Continuous inputs:** deterministic range/property checks and explicit boundaries cover area units, invalid numbers, coordinate wrapping, Unicode names, leap dates, corrupt storage, forecast age and wrong-farm weather. Infinite possible numeric/text inputs cannot literally all be enumerated.

Live progress and final counts are generated, never estimated: `summary.json`, `matrix-{country}.json`, `exhaustive-matrix-tests.json`, `browser-world-results.jsonl`, `unit-api-results.json`, and `every-plant-coverage.csv` in that research directory. The CSV has a row for every retained species, including records that cannot produce a defensible plan. A zero country count means not returned by the tested screen/date range, **not proof that the species cannot grow anywhere in that country**.

Reviewable exports: [all-plant CSV](../output/audit/RITU_Plant_Audit.csv), [current JSON summary](../output/audit/RITU_Audit_Summary.json) and [screenshot walkthrough PDF](../output/pdf/RITU_Worldwide_Verification_and_Farm_Walkthrough.pdf). The CSV includes scientific identity, first planning blocker, six-point coverage, final image status and source/license/credit links. Large original-source captures remain in the ignored research directory; the exported ledger is suitable for sharing with teammates.

## Source integrity results

All 2,562 retained entries match the pinned raw CSV across **43,554 field comparisons**, with zero mismatches. A further **7,686 normalized name/lifespan/life-form comparisons** passed after removing missing-value labels from the interface. Source SHA-256: `4187e8846336e185c4583165211c5981855e95adfbefd897bd2bd481de48d106`.

Every cell in all 14 packed, unextrapolated Sacks grids was compared with its original NetCDF file: **3,628,800 cells**, **184,218 populated cells**, and **1,289,526 populated field comparisons** passed. All original file hashes matched. The compact format's documented two-decimal rounding was applied to the independent comparison.

Incomplete source data is retained as a visible catalogue record, without invented suitability or harvest timing. The raw source contains 499 entries with missing temperature bounds and 688 with missing/zero growing-period values; these groups overlap. `every-plant-coverage.csv` records the first blocking gap per entry, so its exclusive categories should not be added to overlapping raw-source counts.

## Completed application verification

| Check                                 | Verified outcome                                                                                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Six-country date/setup matrix         | **263,160 calls passed**; 43,860 per point                                                                                                                                                       |
| Returned selections                   | **213,914,870** eligibility/order/date/temperature outputs checked against the independent oracle                                                                                                |
| Saved-record/daily-action checks      | **7,025,205** cases checked, including no invented planting and continuing perennial care                                                                                                        |
| Unit/API suite                        | **495 passed**, zero final failures                                                                                                                                                              |
| Complete browser input flows          | **720 unique desktop/phone cases passed after serial reruns**                                                                                                                                    |
| Additional feature/tour/layout checks | **32 passed**; English/Bangla full tours, storage recovery/export, multiple farms, source outages, accessibility, catalogue search/pagination, perennial handling, photos and 2D animation/seams |
| Production build and types            | Passed; development type imports restored after building                                                                                                                                         |
| Live production smoke                 | **8 passed**, including real NASA-backed wheat search and actual API tomato-photo metadata; temporary production server stopped                                                                  |
| Updated walkthrough                   | **10-page PDF** with one actual online input/output capture; every final page rendered and visually inspected                                                                                    |

The 720-case browser sweep initially had four timeout/loading failures while the large matrix ran concurrently. All four affected profiles were rerun on both projects: **8/8 serial checks passed**. One archived rotation-domain test also timed out under the combined load; subsequent complete suites passed, including the final **495-test** suite. The final missing-label catalogue check also passed on desktop and phone. Original failures remain in `browser-world-results.jsonl` and `unit-api-concurrent-timeout.json`; clean reruns are separate evidence. These results do not prove the exact cause of each initial stall or establish performance on every farmer's device.

The source has **714 records blocked from planning** under the declared policy: 281 unspecified life cycles, 236 additional missing temperature records, 9 inconsistent temperature ranges and 188 missing/unsupported growing periods. Those are exclusive first-gap counts. No source rain or pH min/max inversions or implausible temperature extremes were found; the one reversed growing-period range (Lotus creticus, 90 to 0) is already blocked. Numeric data is not silently repaired.

Walkthrough: `output/pdf/RITU_Worldwide_Verification_and_Farm_Walkthrough.pdf`. Its example is one hectare of assumed clay/rainfed land at Manikganj, with drainage explicitly unknown. Actual online source responses produce wheat's historical planning window **11 November 2026**, a **120-day reference duration**, and a reference end **11 March 2027**. The actual planting date remains blank. Raw screenshots, API responses and the saved example are in the audit's `walkthrough/` directory. Field inputs are not misrepresented as measured farm facts.

## Defects reproduced and repaired

1. **Rice excluded on known soil:** source texture `wide` was being treated as if it excluded light, medium and heavy textures. Rice and other broad-texture records now respect that source category.
2. **Wrong drainage acceptance:** a species recorded only for excessive drainage could pass a waterlogged field. The poor-drainage exclusion now recognizes excessive as well as well-drained requirements, while preserving explicitly recorded poor-drainage tolerance.
3. **New Year calendar loss:** valid circular-mean planting dates such as 0.5 were dropped by the importer. The corrected source mask restores **943 grid cells** across rice, maize and sunflower.
4. **Unsupported image delivery:** the image resolver now requests documented standard thumbnails through Commons `imageinfo`, including a smaller standard size when the original is smaller than the initial request. It does not construct media URLs or hotlink unscaled originals. Full provider Retry-After values, including HTTP dates, are honored. The API User-Agent now includes the repository's full HTTPS contact URL, following Wikimedia's current identification guidance; successful higher-quota classification is not assumed.
5. **Cross-location stored evidence:** saved records now require the farm, context and NASA requested point to agree. Negative rainfall, source-host imitations and invalid source paths are rejected. Existing recovery/export behavior preserves rejected originals.
6. **Inconsistent area boundary:** the screen now applies the same 1,000-hectare product limit as the form and stored-record validator.
7. **Genus redirects and non-photo files:** a scientific-name redirect could land on a genus rather than the requested species, and a raster botanical plate could pass a MIME-only photo check. The resolver now requires a species-or-more-specific scientific name, does not collapse a variety through a redirect alone, and rejects known plate titles and illustration/drawing metadata. Exact taxon search runs when a genus redirect is rejected. Visual review of all 34 initial contact sheets exposed additional abbreviated `DistMap` names, misspelled `herbaium` specimen labels, absent descriptions and book credits. Those are now rejected. Ambiguous GBIF/Kew occurrence-record credits are also excluded because their metadata does not establish a live-plant photograph; this deliberately withholds some potentially valid files rather than treating every collection image as a crop photo. All previously accepted images receive a fresh subject-metadata pass, with original metadata saved for reproducible review. No production species-to-photo assignments were added.
8. **Missing metadata shown as a plant name:** source `NA` values could appear as “Na” or as a lifespan. The importer now treats them as missing, uses the scientific name when no common name exists, and leaves absent descriptors empty. Scientific numeric requirements, source soil/drainage categories, stable IDs and plan types remain unchanged. The original-source comparison was repeated after regeneration; this display-only cleanup does not invalidate the completed numeric screening matrix.

A performance refactor was separately verified against **1,440 exact pre-refactor output hashes** before the intentional source-policy repairs above. That historical equivalence check must not be represented as requiring the old incorrect soil/calendar results to persist.

## Image audit and its limits

**Completed 2 November:** all **2,562** retained plant identities were queried. The final combined ledger has **1,752 available image entries** and **810 unavailable entries**, with **zero unresolved provider, provenance or image-file errors**. Unavailable means this resolver found no acceptable reference under its stated policy; it does not prove that no photograph exists anywhere. The 1,924-file delivery pass and subsequent 1,834-file subject review are separate checkpoints, not additional plants to add to the catalogue count. Rejected files were retried through the actual taxon resolver for alternatives. All 34 initial contact sheets and two further sheets of 85 replacement entries were visually inspected for gross irrelevant subjects. Every final accepted image was rehashed and fully pixel-decoded against its retained evidence. The [artifact verification result](../output/audit/RITU_Artifact_Verification.json) also checks all exported rows and the final PDF.

All images remain API-delivered. There is no production hand-written species-to-photo manifest. Checks include scientific identity, Wikimedia entity/file links, allowed license and credit metadata, HTTPS media hosts, standard thumbnail policy, HTTP availability, actual image decoding, dimensions and SHA-256 evidence. The resumable full audit stores status for each plant, including unavailable, provider failure and invalid evidence; missing imagery is not replaced with a random observation or a scene photograph.

`api-coverage-full.json` now has its final completion timestamp. The subject-review file retains original Commons metadata; its last multilingual-rule check reused that captured metadata without pretending to be a new network response. `summary.json` merges the newest identity, delivery and subject-review result per entry; raw older query counts alone must not be treated as final photo coverage. An API identity match and a decodable photo do **not** certify cultivar identity, disease status, crop growth stage or botanical visual identification. Clear species reference photos can show leaves, flowers, fruit, seeds or the whole plant depending on the source. Exact reuse rights and attribution accompany each displayed result.

## Scientific and production boundaries

- NASA POWER provides long-term regional environmental context; it does not supply a farmer's soil texture, irrigation entitlement, cultivar, field boundaries or a crop recommendation.
- Open-Meteo supplies dated model weather/forecasts. Forecasts are not guarantees or root-zone soil measurements. No stale or different-farm forecast is used to issue weather actions.
- ECOCROP offers broad species requirements. A monthly-normal temperature match cannot establish night-frost safety, local legal/invasive status, food safety, soil chemistry, salinity, pests, chilling, photoperiod, yield, profit or cultivar suitability.
- FAO states that ECOCROP was discontinued around 2015 and is now accessible through GAEZ. Its published historical descriptors must not be presented as continuously updated agronomic advice.
- Sacks grids are historical regional calendar observations at 0.5° resolution. They are not field-scale, current-season optimum planting dates. Missing local calendar coverage stays explicitly climate-based.
- A perennial 365-day plan is a **care/review horizon**, never a predicted first-fruit date. A recorded perennial harvest does not end the planting.
- Matching a perennial growing season does not establish winter hardiness. The source growing-temperature range is not treated as a verified lethal dormant-season temperature.
- Daily directions are sourced inspection and recordkeeping checks. Precise fertilizer, pesticide and irrigation doses require additional crop-specific evidence and actual field measurements; the app must not fabricate them.
- Farms are browser-local with export/recovery. Cloud accounts, shared deployment-level provider throttling and farmer field trials remain distinct production work.

The honest release claim is a **source-backed preliminary decision-support and farm-record system**. Passing this matrix cannot turn it into an agronomist-validated autonomous farming system for every plant worldwide.

## Commands

These record the audit commands, not permission to overwrite its original captures. Preserve this completed evidence directory before starting a new dated capture; use a separate directory for a new comparison run. The metadata revalidation command below is offline and uses retained original API responses.

```powershell
node scripts/capture-world-audit.mjs
& 'D:/python app/python.exe' -X utf8 scripts/audit-packed-calendars.py
$env:RITU_AUDIT_DAYS='731'
node node_modules/vitest/vitest.mjs run --config scripts/world-audit.config.ts scripts/exhaustive-world.test.ts --reporter=json --outputFile=research/global-audit-2026-11-01/exhaustive-matrix-tests.json
$env:RITU_WORLD_AUDIT='1'
node node_modules/@playwright/test/cli.js test tests/e2e/season-workflow.spec.ts --grep 'land profile' --workers=2 --reporter=./scripts/world-browser-reporter.mjs
node scripts/audit-plant-images.mjs --all --resume --refresh-policy --decode --out research/global-audit-2026-11-01
node scripts/audit-plant-images.mjs --all --resume --recheck-risky --decode --out research/global-audit-2026-11-01
node node_modules/vitest/vitest.mjs run --config scripts/world-audit.config.ts scripts/refresh-world-photo-delivery.test.ts
$env:RITU_IMAGE_SUBJECT_REVIEW='1'
node node_modules/vitest/vitest.mjs run --config scripts/world-audit.config.ts scripts/refresh-world-photo-delivery.test.ts
Remove-Item Env:RITU_IMAGE_SUBJECT_REVIEW
node node_modules/vitest/vitest.mjs run --config scripts/world-audit.config.ts scripts/revalidate-world-photo-metadata.test.ts
node scripts/audit-plant-images.mjs --all --resume --recheck-delivery --batch-size 3 --decode --out research/global-audit-2026-11-01
node scripts/summarize-world-audit.mjs
& 'D:/python app/python.exe' -X utf8 scripts/verify-world-audit-artifacts.py
```

The photo audit honors a persisted media cooldown. To stop cooperatively, create `research/global-audit-2026-11-01/pause-images`; remove that exact file before resuming. Keep original evidence/checkpoints. Never overwrite the historical optimization baseline to make a changed implementation appear equivalent.

## Primary references

- [FAO ECOCROP overview](https://www.fao.org/geospatial/data-and-tools/data-portals/ecocrop/en), [GAEZ ECOCROP portal](https://gaez.fao.org/pages/ecocrop), [pinned source CSV](https://raw.githubusercontent.com/OpenCLIM/ecocrop/f13577f4237604b15d85d8e43741714a2d1eb2d4/EcoCrop_DB.csv).
- [Sacks source README](https://sage-public-files.s3.amazonaws.com/crop-calendar-dataset/crop-readme.txt), [published dataset](https://sage.nelson.wisc.edu/data-and-models/datasets/crop-calendar-dataset/).
- [NASA POWER climatology documentation](https://power.larc.nasa.gov/docs/services/api/temporal/climatology/), [Open-Meteo forecast documentation](https://open-meteo.com/en/docs).
- [Wikimedia standard thumbnail policy](https://www.mediawiki.org/wiki/Common_thumbnail_sizes), [Commons imageinfo API](https://www.mediawiki.org/wiki/API:Imageinfo).
- [Wikimedia API rate limits and identification guidance](https://www.mediawiki.org/wiki/Wikimedia_APIs/Rate_limits): quotas depend on client identity and may change; concurrency, identification and Retry-After requirements were checked on 2 November 2026.
