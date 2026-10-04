Abid's event-day verification and release checklist

This is a planned verification agenda derived from the supplied team plan. Every item is currently untested because the application has not been implemented. Read the complete challenge and local submission requirements before using it.

**Architecture and integration**

- [ ] Agree on the data format and date convention with Alve before building dependent components.
- [ ] Agree on the framework the team can operate and deploy; validate the selected dependency versions.
- [ ] Keep one farm profile and one consistent time axis across the three screens.
- [ ] Ensure changing a constraint refreshes affected comparisons and explanations together.
- [ ] Keep method/source information accessible in the demonstration.
- [ ] Package processed environmental data with provenance as required by the team plan.

**Calendar behavior**

- [ ] A crop sequence crossing December-January appears in the correct order.
- [ ] Planting and harvest windows retain their intended dates across display changes.
- [ ] Overlaps and blocking windows are visible and explained.
- [ ] All options use the same months so comparisons are meaningful.
- [ ] A partially known date/window is not silently displayed as a precisely known one.

**Farm constraints and explanations**

- [ ] An unknown soil input remains unknown.
- [ ] An unsupported requirement is shown as needing confirmation.
- [ ] A known blocking constraint stays visible even when other information is missing.
- [ ] Required household crops and supported irrigation constraints affect results correctly.
- [ ] A preference change does not override a hard constraint.
- [ ] Bangla and English explanations express the same result and limitation.
- [ ] Sensitivity is described as sensitivity, not statistical confidence or predicted performance.

**Environmental evidence: review together with Alve**

- [ ] Manually reproduce at least one displayed exposure calculation from its inputs.
- [ ] Check units, source origin, period, missing values, and usable-year denominator.
- [ ] Show historical exposure as historical exposure, not a next-season forecast.
- [ ] Document any rainfall fallback and affected limitations.
- [ ] Record agricultural review accurately, including unreviewed portions.

**Usability and presentation**

- [ ] Test the complete journey on a narrow mobile viewport and desktop.
- [ ] Verify Bangla rendering, labels, wrapping, and calendar readability.
- [ ] Verify keyboard access, visible focus, and non-color status explanations.
- [ ] Show a meaningful constraint change without inconsistent or stale explanations.
- [ ] Record the video only after checking the actual format and duration requirements.

**Deployment and submission**

- [ ] Select and validate the project license and third-party reuse documentation with the team.
- [ ] Review the files to publish for secrets, private farm details, and inappropriate personal information.
- [ ] Run the selected framework's required checks and production build.
- [ ] Test the deployed three-screen journey in a signed-out browser.
- [ ] Verify the demonstration works with packaged data and handle unavailable services honestly.
- [ ] Open the repository, demo, evidence, and video links as a judge would.
- [ ] Complete the official Project tab and local submission steps before their respective deadlines.
- [ ] Verify submitted status; saving a draft is not proof of submission.

Commit, push, deployment, and submission should be performed when explicitly authorized. This preparation package performs none of those actions.
