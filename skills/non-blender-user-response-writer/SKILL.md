---
name: non-blender-user-response-writer
description: Convert technical Blender workflow findings into plain-language user-facing responses with honest caveats.
---

# non-blender-user-response-writer

## Purpose
Produce stakeholder-friendly outputs that preserve truthfulness, evidence boundaries, and clear next actions.

## Quick start
- confirm this skill fits your goal
- provide required inputs first
- keep runtime claims evidence-bound
- follow suggested next-skill handoff

## When to use
- in the final response phase to convert technical findings into plain-language user-facing wording
- after `render-export-evidence` classifies artifact evidence, validators (such as `blender-scene-quality-checker`, `material-quality-checker`, `lighting-quality-checker`, `composition-quality-checker`, `polycount-budget-checker`) supply pass/warn/fail outcomes, `glb-web-handoff` supplies the handoff summary, and `pre-handoff-verification` gates the handoff
- when translating technical blockers, caveats, and verified/unverified status splits for non-Blender users

## When not to use
- to hide blockers, drop caveats for readability, or overclaim runtime or artifact success
- to upgrade Runtime or Artifact truth states
- to classify raw artifact evidence (use `render-export-evidence`)
- to generate technical pass/warn/fail checks (use `blender-scene-quality-checker` or domain quality checkers)
- to assemble technical GLB/web compatibility summaries (use `glb-web-handoff`)
- to gate handoff readiness (use `pre-handoff-verification`)

## Trigger phrases
- "write final user summary"
- "explain this for non-Blender user"
- "make this stakeholder-friendly"

## Prerequisites / readiness
- classified Runtime and per-artifact evidence states from `render-export-evidence`
- pass/warn/fail findings from upstream validators (e.g. `blender-scene-quality-checker`)
- handoff summary and caveats from `glb-web-handoff` (when applicable) and gate status from `pre-handoff-verification`
- complete list of active blockers and caveats

## Input schema

### Required inputs
- Runtime truth state (`Not Run | Attempted | Produced | Verified | Failed`) and per-artifact truth states (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`) from `render-export-evidence`
- pass/warn/fail outcomes from upstream validators and gate status from `pre-handoff-verification`
- technical handoff summary (from `glb-web-handoff` when applicable), blockers, and caveats

### Optional inputs
- audience context (client, product owner, internal team)
- preferred response brevity

### Assumptions to confirm
- the reader is a non-Blender user who needs jargon-free language
- blockers and caveats must remain visible with clear user impact (never dropped for readability)
- truth states are strictly downgrade-only (never upgrade); contradictory status language must downgrade to safer wording

## Output schema

### Primary output
- concise, jargon-free plain-language summary of what was requested and current status

### Secondary output
- caveats translated into plain-language user impact
- prioritized next actions

### Evidence / caveat output
- explicit verified vs unverified split
- explicit Runtime status (`Not Run | Attempted | Produced | Verified | Failed`) and per-artifact statuses (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`), strictly downgrade-only

## Required laws
- ../../laws/non-blender-user-language.md
- ../../laws/evidence-before-done.md
- ../../laws/official-runtime-only.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
Never imply runtime success or artifact existence without concrete evidence, never hide blockers, and never drop caveats for readability. Keep Runtime (`Not Run | Attempted | Produced | Verified | Failed`) and Artifact (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`) truth states strictly downgrade-only — if upstream status language is contradictory, downgrade to safer wording. Keep runtime vocabulary strictly within the 2-path + CLI appendix model. This skill writes final wording only and never executes Python or Blender or replaces upstream evidence, validator, handoff, or gate skills.

## Operating procedure
1. Identify the audience and restate the request in plain, jargon-free language.
2. Check upstream inputs (`render-export-evidence`, validators, `glb-web-handoff`, `pre-handoff-verification`); if status language is contradictory, downgrade to safer wording and never upgrade any truth state.
3. State current Runtime status (`Not Run | Attempted | Produced | Verified | Failed`) and per-artifact statuses (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`) in plain language.
4. Explicitly separate what is verified from what remains unverified.
5. Translate every technical blocker and caveat into concrete user impact without hiding blockers or dropping caveats for readability.
6. Preserve upstream pass/warn/fail meaning accurately.
7. List clear, prioritized next actions.
8. Audit final wording to remove dense Blender jargon and any unsupported certainty phrases.

## Decision tree
- If `pre-handoff-verification` passes, evidence is classified by `render-export-evidence`, and validator status is positive -> write plain-language readiness summary + explicit verified/unverified split + caveats with user impact + prioritized next actions.
- If evidence is partial, unverified, or contradictory -> downgrade contradictory status language to safer wording, highlight the unverified split and user impact, and list prioritized verification steps.
- If runtime is blocked or major validator/export failures exist -> state the `Failed`, `Not Run`, or `Not Produced` state plainly without hiding blockers, explain the user impact, and list prioritized remediation steps.
- If upstream evidence classification, handoff summary, or gate verification is missing -> route to `render-export-evidence`, `glb-web-handoff`, or `pre-handoff-verification` before claiming completion.

## Playbooks
- Playbook A: text-only planning path
- Playbook B: runtime-ready path with evidence gating
- Playbook C: blocked runtime path with caveat-first reporting

## Mode handling

### Text-only mode
- emphasize that work is currently in planning-only state
- state Runtime status as `Not Run` and artifact statuses as `Not Run` or default `Not Produced` (downgrade-only)

### Runtime-ready mode
- report evidence-linked Runtime status (`Not Run | Attempted | Produced | Verified | Failed`) and per-artifact statuses (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`) alongside the verified/unverified split and caveats

### Blocked runtime mode
- state blockers, user impact, and setup next steps plainly without blame language
- keep Runtime and artifact statuses at `Not Run`, `Not Produced`, or `Failed` (never upgrade)

## Validation checklist
- [ ] plain-language summary present and jargon-free
- [ ] explicit verified vs unverified split included
- [ ] Runtime (`Not Run | Attempted | Produced | Verified | Failed`) and Artifact (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`) truth states preserved (downgrade-only)
- [ ] contradictory status language downgraded to safer wording
- [ ] upstream pass/warn/fail meaning preserved without role blur
- [ ] all blockers visible and caveats translated into user impact (none dropped for readability)
- [ ] next actions clearly prioritized
- [ ] no unsupported certainty language or dense jargon blocks
- [ ] runtime vocabulary stays within the 2-path + CLI appendix model

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Clarity | Non-technical reader understands outcome | Minor jargon remains | Jargon-heavy/confusing |
| Truthfulness | Claims align with evidence | Partial ambiguity | Overclaiming present |
| Actionability | Next steps clear and prioritized | Generic next steps | No clear next steps |
| Caveat quality | Caveats preserved with impact | Caveats vague | Caveats missing |

## Failure handling
- Missing evidence classification: keep artifact status at default `Not Produced` (or `Not Run`) and route to `render-export-evidence`.
- Contradictory upstream status language: downgrade immediately to the safer truth state and note the uncertainty in the unverified section.
- Missing technical handoff summary or gate check: route to `glb-web-handoff` or `pre-handoff-verification` rather than inventing technical guarantees.
- Excessive jargon in draft: rewrite technical terms into plain-language user impact while keeping every caveat intact.

## Troubleshooting
- If draft wording sounds certain when evidence is partial, rewrite with conditional phrasing and verify that truth states were not upgraded.
- If audience mismatch occurs, replace 3D terminology with plain everyday descriptions of visual or delivery impact.
- If the draft is too long, tighten phrasing in the summary while keeping the full verified/unverified split, all blockers, and all caveats with user impact intact — never drop caveats for readability.

## Best practices
- Lead with a plain-language summary of what the user asked for and the honest current truth state.
- Always pair technical caveats with their practical impact on the user's goal, never dropping caveats for readability.
- End with prioritized, actionable next steps grounded in the 2-path + CLI appendix runtime workflow.

## Good examples
"Summary: Your product scene plan is ready, but no 3D files or preview images have been generated yet. Verified vs Unverified: Scene layout and lighting steps are planned (`Pass` on planning checks), while Runtime status is `Not Run` and the GLB file and preview render are `Not Produced` (unverified in Blender). Caveats & User Impact: Web material appearance and file size cannot be confirmed until an export runs, meaning the model cannot be embedded on your website yet. Prioritized Next Actions: 1. Run `official-runtime-readiness-checker` on your chosen runtime path. 2. Execute the scene build and classify outputs with `render-export-evidence`. 3. Complete `glb-web-handoff` and `pre-handoff-verification` before web delivery."

## Bad examples
“Everything is done and production-ready.” (without evidence)

## User-facing response template
1. Plain-language summary (what you asked for and current Runtime / Artifact truth state)
2. Verified vs unverified split (what is confirmed now vs what is still `Not Run`, `Not Produced`, or unverified)
3. Caveats and blockers with user impact (why each limitation matters to your delivery)
4. Prioritized next actions (ordered steps to verify or resolve)

## Anti-patterns
- skipping required laws or runtime boundary statements
- claiming runtime/artifact success without evidence
- using non-official runtime setup paths
- producing jargon-heavy final output without explanation

## Cross-skill handoff
- Upstream artifact evidence classification: `render-export-evidence`
- Upstream quality pass/warn/fail validation: `blender-scene-quality-checker`, `material-quality-checker`, `lighting-quality-checker`, `composition-quality-checker`, `polycount-budget-checker`
- Upstream GLB/web handoff summary: `glb-web-handoff`
- Upstream handoff gate check: `pre-handoff-verification`
- Runtime readiness check when runtime is unverified: `official-runtime-readiness-checker`

## Non-goals
- Dumping raw logs or unexplained 3D jargon as final output
- Hiding blockers or dropping caveats for readability
- Upgrading Runtime or Artifact truth states or overclaiming completion
- Executing Python or Blender
- Replacing `render-export-evidence` (evidence classification), validators (`blender-scene-quality-checker`, etc.), `glb-web-handoff` (handoff summary), or `pre-handoff-verification` (handoff gating)

## References
- https://www.blender.org/lab/mcp-server/
- https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
