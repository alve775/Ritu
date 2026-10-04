Abid's preparation through October 7, 2026

Owner: Abid Al Hossain Swakkhar. This document tracks preparation for his responsibilities in the supplied team plan: architecture, seasonal calendar, integration, testing, and a deployed demo.

**October 2 update:** Abid subsequently requested a working pre-event concept preview and selected Next.js. That instruction supersedes the implementation boundary recorded below. The preview now exists locally; see README.md, DATA_INTEGRATION.md and PREVIEW_VERIFICATION.md for the current state. This document's earlier preparation-only statements are retained as historical context. Registration, hosting and organizer confirmations remain separate from application development.

The October 7 target was confirmed by Abid in this chat. It is a preparation target, not the project's submission deadline. The scope remains one farm, three seasons, and three rotation options. Application implementation remains reserved for the event under the team's current plan.

**Completed locally on October 2**

| Preparation | Verified state |
| --- | --- |
| Local repository | E:\001_RITU, branch main, no commits yet |
| Remote | https://github.com/alve775/Ritu.git |
| Baseline | Supplied PROJECT_PLAN.md preserved verbatim |
| Team roles | Recorded in README.md |
| Node | v22.13.1 runs |
| npm | Normal launcher reports 11.19.0 outside the restricted runner; bundled npm reports 10.9.2 inside it |
| Git | 2.48.1.windows.1 runs; a name and email are configured |
| GitHub connector access | Connected account reports pull and push permissions; no remote write performed |
| Git remote read | Read access verified with the readiness script outside the restricted runner |
| Development check | scripts/check-dev-environment.ps1 provides repeatable, read-only checks |
| Local research | Excluded from Git; preserved on disk |
| Future secrets | .env and .env.* excluded, with .env.example allowed |

These versions describe this machine, not the teammates' machines. Framework compatibility will need validation once the team selects a framework. Configured Git identity has not been assumed to be Abid's identity; review it privately before any commit.

The completed script passed in this runner using bundled npm and passed outside the restriction using the normal npm launcher, including its optional remote read check. Seven documentation/script files were checked for UTF-8 decoding and valid local documentation links. The supplied project-plan file still has the same SHA-256 hash as the attachment. These checks establish preparation readiness only; they do not establish that a future application works.

**Actions that require Abid or the team before October 7**

- [ ] Confirm the applicable local registration process and three-person team acceptance with the Rajshahi Local Lead.
- [ ] Ensure all three teammates are registered and confirmed at the same event; resolve waitlists.
- [ ] Create or join the team's official Space Apps entry and verify its selected challenge.
- [ ] Obtain the organizer's clarification about permitted preparation and any preliminary presentation request.
- [ ] Ask Alve and Mahia to confirm they can access the shared repository. Each person should verify their own account access.
- [ ] Run the environment check on every development machine; record unresolved warnings.
- [ ] Confirm which teammate's hosting account will be used during the event and who will control the final demo URL. Hosting access has not been verified here.
- [ ] Confirm availability for the event, a shared communication channel, and one place for source and design handoffs.

This checklist records required confirmations. It does not claim registration, teammate access, hosting access, or organizer approval has been completed.

**Your coordination before the event**

Keep the supplied team plan as the reference when talking with Alve and Mahia. Ask about evidence availability, asset readiness, and dependencies. Do not quietly replace unknown locality, crop, or review information with invented examples presented as real.

Alve owns the locality/farm evidence, crop sources, environmental processing, comparison rules, and methodology. Your preparation is to know how you will receive that work and identify anything that could prevent integration. Mahia owns visual assets, styling, storytelling, and the video. Your preparation is to establish a clear handoff channel and flag readability or export needs.

At the event's start, agree on the data format, date convention, units, unknown values, status/reason representation, bilingual explanation format, and source references. That agreement belongs to the event-day implementation work; no project schema has been implemented in this preparation package.

Use [TEAM_HANDOFF.md](TEAM_HANDOFF.md) to guide the discussion and record answers after the team agrees. Use [EVENT_DAY_CHECKLIST.md](EVENT_DAY_CHECKLIST.md) as the verification agenda when the application exists.

**Development checks you can run now**

From a PowerShell terminal in the repository:

```powershell
.\scripts\check-dev-environment.ps1
```

To include a read-only connectivity check:

```powershell
.\scripts\check-dev-environment.ps1 -CheckRemote
```

The script installs nothing and does not stage, commit, push, or deploy. It does not read or print credential values. A successful remote read is not proof that a future push will succeed.

The default npm launcher failed inside the restricted Codex runner because Node could not access the npm CLI under the roaming profile. Running the same launcher outside that restriction returned 11.19.0. No system repair was needed or made. Bundled npm is available directly as a fallback on this machine:

```powershell
& 'C:\Program Files\nodejs\node.exe' 'C:\Program Files\nodejs\node_modules\npm\bin\npm-cli.js' --version
```

Use a normal terminal first when diagnosing a runner-only failure. Do not reinstall Node or change global configuration solely because a restricted runner cannot access a file.

**Preparation boundary and outstanding work**

No application scaffold, dependency installation, crop rules, exposure calculations, interactive calendar, deployment project, or submission has been created. Framework choice, project license, and application behavior remain to be agreed and implemented at the appropriate time. The original team plan remains unchanged.
