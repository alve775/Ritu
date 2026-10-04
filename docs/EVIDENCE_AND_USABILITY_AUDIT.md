# Evidence and usability audit

Reviewed October 4, 2026. This audit separates published requirements, research, implementation choices and outcomes that have not been validated. The application is a planning preview. It is not a scientifically validated farm adviser, and no farmer usability sessions have been conducted.

## Does Ritu meet the NASA challenge?

October 4 extension: Abid explicitly requested mock data instead of any real data API. [PROJECT_DESCRIPTION_AUDIT.md](PROJECT_DESCRIPTION_AUDIT.md) maps the new functional demo to the intended product. Location/climate fixtures, generated candidates and draft scenarios now exist; their invented crop rules and numbers are not scientific evidence and do not satisfy real NASA-integration requirements. The prior real-world checks below remain unassessed.

The official [Field Shift: Adapting Farms with NASA Data summary](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/) asks for decision support combining NASA Earth observations, local soil information, crop characteristics and farmer priorities to explore rotations that could support soil health and adaptation. The official page's indexed summary was verified; the complete challenge requirements have not been reviewed. An [official Ramallah event page](https://www.spaceappschallenge.org/2026/local-events/ramallah/) identifies October 28, 2026 as the full-statement release. This is an event listing, not independent confirmation of every global rule or Rajshahi deadline.

| Summary component | Current preview | Outstanding work |
| --- | --- | --- |
| Rotation exploration | Up to three generated mock calendars, locked non-overlapping windows, month inspection and saved tracking | Locally reviewed crop windows, varieties and day-based transitions |
| Farmer priorities | Reported irrigation, family crop groups, available help and priorities are saved | Intended-user interviews and an agreed comparison method |
| Local soil | Reported texture and drainage are separate inputs | Verified field conditions and reviewed crop-specific rules |
| Crop characteristics | Botanical family counts and source-informed schematic anatomy | Local crop stages, water/heat response, management and applicability |
| NASA Earth observations | Source links and explicit missing-evidence messages | Actual observations, provenance, units, temporal/spatial coverage, quality handling and calculations |
| Soil health and resilience | Clearly marked as unassessed | Reviewed indicators and validation; crop diversity alone cannot establish a soil outcome |

**Conclusion: the concept aligns with the published summary; it does not yet fulfill the NASA-data or validated decision-support requirements.** No claim of submission eligibility, judging compliance, NASA endorsement or full-brief compliance is made.

NASA data does not begin existing on October 28. [POWER's public documentation](https://power.larc.nasa.gov/docs/faqs/data/) and [IMERG's product page](https://gpm.nasa.gov/data/imerg) already describe accessible data. The challenge statement/resources release and public data availability are different things. Ritu currently connects neither product.

## Readability, color and interaction

The sources below support constraints and design direction. They do not prove a single optimal font size, green palette or animation duration for Rajshahi farmers.

| Topic | Verified source and its scope | Implemented choice | Limit |
| --- | --- | --- | --- |
| Text contrast | [WCAG 2.2 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html): ordinary text needs 4.5:1; qualifying large text 3:1 | Dark text and darker secondary text on light surfaces; explicit text/icons for status | Accessibility contrast is not a measurement of outdoor readability or eye fatigue |
| Color meaning | [WCAG 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html): color must not be the only visual information channel | Conflict, confirmation and checked-entry labels; selected controls also have shapes/checks and pressed state | No claim that green inherently improves farmer decisions or prevents eye strain |
| Text size | [WCAG 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html): text can be resized to 200% without loss; [GOV.UK type scale](https://design-system.service.gov.uk/styles/type-scale/) uses a 19px desktop body default | Relative units, 20px default body at a normal 16px browser base, optional 24px; secondary labels normally at least 16px | 20/24px are project choices. GOV.UK is practice guidance, not a farmer trial. Physical size depends on the device and zoom |
| Reflow | [WCAG 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html): content reflows at 320 CSS px with limited exceptions | Wrapping navigation/labels, single-column phone forms, internally scrollable calendars | A calendar is a two-dimensional exception, but the surrounding page still must fit |
| User spacing | [WCAG 1.4.12](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html): user overrides of 1.5 line height, 2em paragraph spacing, .12em letter and .16em word spacing must not lose content | Fluid-height controls and wrapping; default body line height 1.65 and Bangla 1.8 | These WCAG values describe supported overrides, not mandatory default typography |
| Touch controls | [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) is the AA minimum, with exceptions; [2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced.html) describes 44×44 CSS px at AAA | Important buttons, month and camera controls have a 44px minimum height; form choices use larger labels | No claim that every inline link meets AAA or that 44px is experimentally optimal for this audience |
| Congestion | [W3C cognitive guidance: simplify content](https://www.w3.org/WAI/WCAG2/supplemental/patterns/o8p03-complexity/) recommends essential features first, with less essential content available on request | Farm → example → reasons; calendars, secondary inputs, evidence and 3D opened on demand; removed ornamental panels | Supplemental guidance is not a normative WCAG criterion. The revised flow still needs farmer testing |
| Keyboard/dialogs | [W3C modal pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) covers focus placement, containment, Escape and restoration | Native dialogs, full accessible tour text, Back/Next/Skip and section replay | Automated checks do not establish compatibility with every screen reader |

The [Bangladeshi agriculture-app study by Shams et al.](https://arxiv.org/abs/2110.05150) reports interviews with 13 practitioners and four focus groups involving 20 female farmers; accessibility and accuracy were among the identified concerns. This is an author-hosted research preprint in a particular context, not evidence that every Bangladeshi farmer shares the same needs. It supports involving intended users; it does not validate this app's design.

English and Bangla are available without login. Fonts are bundled locally. Inputs, explanations and controls use visible text alongside icons; the application does not assume an icon is universally understood. Agricultural Bangla still needs the team's terminology review. Audio narration, illiterate-user usability and physical-device sunlight visibility have not been validated or implemented.

## Streamed tour text and motion

[WCAG 2.3.3](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions.html) supports disabling nonessential interaction animation (AAA). The user can disable animation in **Reading & sound**; the operating system's reduced-motion setting takes precedence. **Show text instantly** bypasses the word reveal for the current tour.

Tour headings and descriptions reveal whole word segments with a short opacity fade. [Intl.Segmenter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Segmenter) supports locale-sensitive segmentation; the fallback preserves complete whitespace-separated strings, instead of slicing Unicode code units. The text occupies its final space throughout, so revealing it does not push controls downward. A single full-text version is exposed to assistive technology; visual word spans are hidden from it. There is no word-by-word live announcement or automatic next step. Closing a tour does not wait for an animation.

Spotlight/card/page travel is 900ms; each word fades over 180ms, with stagger bounded so the word sequence finishes within about 830ms. Camera travel is 520ms and finite. **Those timings are product tuning, not scientifically established reading thresholds.** They are cancellable; rapid Next presses cannot skip missions. The full tour now has 25 steps, including mock planning/scenarios, crop studies, the catalogue and reading/sound controls. All five scopes can be replayed. Tours restore only the disclosures they opened.

The reported overlap was repaired by reserving a guide rail at widths of 1200px and above and a bottom dock at smaller widths. The calendar spotlight includes months and crop rows; the camera step includes the rendered field. Arrows explore long sections and wide calendars while the modal guide is open. This applies a project rule stronger than [WCAG 2.4.11's unobscured-focus minimum](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html): settled tour cards must not overlap spotlights. Meaningful visible context and navigation are checked separately from card bounds.

Mati is an original duck companion wearing a straw hat. It guides navigation without claiming scientific authority. The finite greeting/wave obeys reduced motion. Its design is an experience choice with no claimed agricultural or cognitive benefit.

Crop inspection retains the browser's native modal behavior described in [MDN's dialog documentation](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog). Screenshot review found that disclosure styles accidentally changed dialog margins/padding; those selectors now exclude dialogs. Centering and close-control visibility are checked for every crop on desktop and emulated phone.

## Sound

[Cheah et al.'s 2022 systematic review](https://journals.sagepub.com/doi/10.1177/20592043221134392) finds that effects of background music vary by task, music and population, with detrimental reading effects among its findings. It does not establish a farming-app benefit from ambient sound. In response to Abid's explicit request, the preview now provides optional synthesized farm ambience. It is off by default and begins only with a Play action. No improved attention, farmer performance or health outcome is claimed.

Click feedback is separately optional and off by default. Every result also has text. The [WCAG audio criterion](https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html) concerns control of automatically playing audio; [MDN Web Audio guidance](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices) supports user-initiated playback and controls. Reading & sound offers morning/evening scenes, a 0–100% master level, Stop and Mute all. Preferences persist separately from farm inputs; ambience never starts automatically after reload.

Original generated noise provides wind; finite enveloped oscillator calls resemble birds or insects. These are not field recordings or species-accurate acoustic models. The noise buffer loops only while requested. Scene changes and mute/zero stop the previous graph and cancel scheduled calls. A hidden tab pauses and resumes only a previously requested ambience. Unmount closes the context. Click tones stop after 65ms. No external recordings, music, downloads or trackers are used. Denied playback reports a visible status and leaves planning usable.

Frequency, envelope and gain are design settings, not evidence of better task performance or a calibrated safe sound-pressure level. Actual loudness depends on the user's hardware/volume; it has not been measured. Browser playback behavior was checked; listening on the user's physical speaker/headphones remains untested.

## Scientific-content corrections

The earlier preview included unsupported minimum-water categories and water-demand rankings. They were removed, including their tour descriptions. A self-reported category such as “Reliable” cannot establish crop irrigation suitability. Soil texture or drainage selection cannot establish local crop suitability without reviewed rules. **All three agronomic checks remain unknown, even when an input is supplied.** The UI explains the difference between recording an entry and assessing it.

[FAO Irrigation and Drainage Paper 56](https://www.fao.org/4/X0490E/x0490e00.htm) distinguishes reference/crop evapotranspiration, crop stages, soil water availability, weather and management. These require a reviewed method and appropriate inputs. This publication's contents were inspected as integration guidance; its equations and coefficients are not implemented or claimed to validate these examples.

What the preview can calculate is limited: recurring monthly overlap/gaps, the presence of a requested household crop group, and conflicts between entered unavailable-help months and sample first/last crop months. This does not establish household quantity sufficiency, actual labor demand or real planting/harvest timing. Known entry conflicts remain visible ahead of unknown suitability. No option is currently recommended or marked suitable.

The three broad month bands follow the cropping calendar in [FAO's historical NW Bangladesh livelihood study, section 3.14](https://www.fao.org/4/ag257e/AG257E06.htm): Kharif I March–June, Kharif II July–October, Rabi November–February. These are approximate agricultural groups, not exact daily season boundaries or present weather observations. Labels show the month groups rather than treating agricultural seasons as fixed meteorological seasons. The old study does not validate any 2026 farm, rainfall trend or crop window.

Botanical family classification was checked against Kew: [rice](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A316812-2/general-information) and [wheat](https://powo.science.kew.org/taxon/332110-2) are Poaceae; [mung bean](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A525492-1) is Fabaceae; [potato](https://powo.science.kew.org/taxon/urn%3Alsid%3Aipni.org%3Anames%3A821337-1/general-information) is Solanaceae. The example family counts are descriptive, not soil-health scores. The [BRRI rice-profile portal](https://riceprofile.brri.gov.bd/) is a local institutional starting point, not validation of this preview's dates or every crop's water needs.

Plant structures and original Three.js geometry have separate [anatomy references and limitations](UX_AND_MODEL_RESEARCH.md). Rice panicles, wheat spikes, mung leaflets/pods and potato stolons/tubers are schematic. The user selects young/mature examples; a sample month does not infer observed growth. Hectares do not scale the pictured field. Roots, spacing, density and soil dimensions are artistic. No satellite measurement, forecast, yield, profit, fertilizer rate, irrigation depth, water saving or soil-health improvement is fabricated.

Future NASA integration must preserve product/version, units, dates, grid footprint, missing values, processing and uncertainty. POWER grids are not parcel measurements; IMERG precipitation products have different aggregation and latency. Historical exposure is not a forecast. See [the data handoff](DATA_INTEGRATION.md).

## QA and remaining evidence

The expanded [42-entry crop catalogue](CROP_CATALOGUE.md) cites BARC/FAO crop identity and groups. These do not establish local suitability. The additional 37 entries mark taxonomy as unreviewed and are excluded from reviewed-family counts. Unsupported anatomy renders no substitute plant. This makes missing evidence explicit without preventing calendar editing.

The current reproducible checks and their results are in [PREVIEW_VERIFICATION.md](PREVIEW_VERIFICATION.md). Automated accessibility and browser tests are necessary implementation checks, not proof of universal accessibility, agronomic reliability or farmer usefulness.

Before claiming ease of use, conduct consent-based task observation with intended Rajshahi users on their own phones. Include varying reading proficiency, age and farming experience. Ask them to enter what they know, leave an uncertain soil/water input unknown, select an example, find an entry conflict and explain why no option is yet recommended. Observe unaided completion, mistakes, requests for help, interpretation of unknowns and ability to return to editing. Compare large/extra-large text and motion off/on without suggesting a preferred answer. Record actual feedback and revise the flow. This protocol is proposed; no participant counts, completion rates or satisfaction scores have been invented.

No source establishes that this is the “best ever” interface. The defensible outcome is a simpler, testable preview with documented evidence and explicit limits.

## October 4 farm-first flow

[W3C multi-page forms](https://www.w3.org/WAI/tutorials/forms/multi-page/) was rechecked October 4. It recommends logical stages, visible progress, optional-stage identification and retaining earlier inputs. The four-step farm → suggested crops → locked calendar → tracking workflow follows this guidance. This is a design basis, not a farmer usability study. See JOURNEY_WORKFLOW.md for current behavior; previous manual-calendar descriptions are historical. All new windows and drainage rules remain explicitly invented mocks; no scientific timing suitability is claimed.
