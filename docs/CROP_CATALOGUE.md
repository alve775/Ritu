# Crop catalogue and evidence boundary

Updated October 5, 2026. The preview has **42 named crop entries plus rest/fallow**. Boro, Aman and Aus are rice cropping-season entries, not three botanical species. The catalogue is searchable and expandable; the first screen starts with farm conditions; only eligible mock crops are selectable in Step 2.

The official [Field Shift summary](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/) requests crop characteristics alongside NASA observations, local soil and farmer priorities. It does not prescribe this crop list. Inclusion is not NASA endorsement or confirmation of Rajshahi suitability.

## Sources and supported claims

- [BARC crop-zoning portal](https://apps.barc.gov.bd/cropzoning/): identifies Aman, Aus, Boro, maize, wheat, gram, mung/black gram, lentil, groundnut, mustard, chilli, onion/garlic, potato, jute and sugarcane. No zoning-map suitability is extracted or applied.
- [FAO / Directorate of Agricultural Extension: Crop diversification in Bangladesh](https://www.fao.org/4/X6906E/x6906e04.htm), sections 2.3–2.5: identifies additional cereals, pulses, oilseeds and other crops. This historical document discusses the 1997–2002 planning period. Its statistics, yields and recommendations are not reused as current facts.
- [BARC: Research Priorities in Bangladesh Agriculture, 2011](https://objectstorage.ap-dcc-gazipur-1.oraclecloud15.com/n/axvjbnqprylg/b/V2Ministry/o/office-barc/2024/12/50b5f466c2f44ed2af49b1bff23d516a.pdf), printed pages 32–36 and 48: identifies oilseed and vegetable groups. The newer upload path does not make this a 2024/2026 study. Only crop identity/group inclusion is used.

| Group | Entries |
| --- | --- |
| Cereals | Boro rice, Aman rice, Aus rice, wheat, maize, barley |
| Pulses | Mung bean, lentil, chickpea, black gram, pigeon pea, grass pea/khesari, cowpea |
| Oilseeds | Mustard, groundnut, soybean, sunflower, sesame, linseed |
| Roots/tubers | Potato, sweet potato |
| Spices | Onion, garlic, chilli |
| Fibre | Jute, cotton |
| Sugar | Sugarcane |
| Vegetables | Tomato, brinjal/eggplant, cabbage, cauliflower, okra, pumpkin, bottle gourd, cucumber, radish, country bean, yard long bean, bitter gourd, ash gourd, amaranth greens, Indian spinach |

These are catalogue groups, not botanical families. Each crop opens its reference link. Names are bilingual; regional terminology still needs team review.

## Calendar and model behavior

- Search either language, filter groups, paginate and inspect sources. The library is read-only: no manual start/duration or crop injection.
- Farmer choices are limited to passing mock suggestions. The generator assigns crop-specific windows, rejects conflicting/unknown options, and inserts explicit rest gaps.
- Generated calendars stay within twelve March–February months. Longer crops and actual day-based transitions require a future dated engine; no compressed duration is suggested. Legacy recurring fixtures are retained in domain tests only.
- Schematic anatomy currently covers Boro/Aman rice, wheat, mung bean and potato. The other 37 entries show **model unavailable** and render no substitute plant geometry. Calendar controls still work.
- Botanical family evidence covers the original five crop entries. Extra entries explicitly show **taxonomy not reviewed** and are excluded from reviewed-family counts. Catalogue group is not a proxy for botanical family. This is unfinished evidence work, not proof that a sequence contains no legumes.
- Irrigation, soil and drainage suitability remain unassessed for every crop. No consumption, pesticide, fertilizer, yield, profit, water-saving or soil-improvement prescription is supplied.

Implementation: `src/data/crop-catalogue.ts`, `src/data/preview.ts`, `src/components/crop-catalogue.tsx`. Storage uses the shared crop-ID list. Tests enumerate all IDs and inspect every crop through the browser.

The optional mock generator has **12 invented crop records**, separate from the source-backed catalogue. Only passing windows among the 12 mock records are selectable preferences. The other identities remain research references and can be recorded as previous crops; they cannot enter a generated calendar. Mock seasons, water/drought indices, temperatures and soil-texture rules are demonstration fixtures, not sourced crop knowledge. Their presence does not supply missing taxonomy or 3D anatomy. See [the description audit](PROJECT_DESCRIPTION_AUDIT.md).

## Remaining evidence work

- [ ] Source taxonomy for the 37 additional entries, resolving broad names such as mustard, pumpkin and amaranth.
- [ ] Obtain local cultivar, timing, stage and management evidence before supplying crop-specific suitability or dates.
- [ ] Build and review individual anatomy models.
- [ ] Add multi-year planning before claiming support for longer crop cycles.
- [ ] Validate Bangla terminology with the team and intended users.
