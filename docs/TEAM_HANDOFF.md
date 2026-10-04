Team handoff agenda

**October 2 update:** A Next.js concept preview is now available locally, following Abid's updated instruction. `DATA_INTEGRATION.md` describes the implemented preview boundary and future evidence handoff. The questions below still apply to reviewed data and team confirmations; they no longer imply that no application exists.

This agenda translates the supplied plan into coordination questions. It is not a finalized implementation specification. Abid should use it with Alve and Mahia without reopening the agreed scope.

**Confirm before October 7**

| Item | Owner | Current answer |
| --- | --- | --- |
| Current registration channel and accepted team size | Team / Local Lead | Unconfirmed |
| All teammates confirmed at the same event | Each teammate | Unverified |
| Locality and farm or published case | Alve / team | Not selected in the supplied plan |
| Current crop sequence and supported alternatives | Alve | Not specified in the supplied plan |
| Farmer contact or qualified review | Alve / team | Unconfirmed |
| Shared communications and file handoff | Team | Not recorded |
| Personal repository access | Each teammate | Only the current connector's permissions have been inspected |
| Hosting account access | Abid / team | Unverified |

**Alve to Abid: discuss at the event before integration**

- What locality and farm case do the supplied records represent, and which inputs are unknown?
- Which sources support each crop's planting window, duration, irrigation constraints, and supported exposure thresholds?
- Which data period, units, missing-value rules, and usable-year criteria were used?
- How are rainfall and temperature origins labelled, including any documented fallback?
- What status and reasons should the interface display when a blocking constraint and unknown inputs coexist?
- Which checks lack evidence and therefore need confirmation?
- Which changes affect calculations, which affect eligibility, and which affect preference only?
- How will source references and sensitivity statements reach the explanation screen?

Record the agreed format during the event. Do not make interface developers infer missing units or thresholds from a number alone. Synthetic practice examples must not be represented as a reviewed farm or real agricultural evidence.

**Mahia to Abid: coordinate readability and asset delivery**

- Identify the common seasonal-calendar visual conventions across the three screens.
- Confirm how crops, environmental exposure, conflicts, unknown information, and selection will remain distinguishable without relying on color alone.
- Identify who reviews Bangla terminology and text readability.
- Agree on asset formats, licensing information, export dimensions, and the shared handoff location.
- Confirm how the interface and video will follow the same farm story.
- Check the actual event's presentation requirements before setting video duration or final delivery format.

Create the project-specific assets and interface during the event under the current plan. Learning design tools and reviewing general accessibility practices can be part of preparation.

**Keep a decision record**

When an item is agreed, record the date, decision, owner, supporting source if relevant, and anything still unverified. A suggestion becomes an implementation assumption only after the team agrees. Do not label an unanswered question as approved.
