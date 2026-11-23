---
name: using-blendops
description: Start here for any BlendOps 3D task. Use when unsure which step comes next, when resuming work, or before writing a status reply to a non-Blender user.
---

# using-blendops

## Purpose

Entry point for BlendOps: pick the next stage from current artifacts and evidence, and keep every user-facing reply in plain language with honest truth states.

This skill merges `workflow-stage-router`, `blendops-help`, `plain-language-response` (v2.0.0). The detailed playbook for each part lives in `references/`; load only the one the current step needs.

## Quick start

1. Confirm the user's goal and the current runtime and artifact state.
2. Pick the branch in the decision tree below.
3. Load only that branch's reference file and follow it.
4. Reply with the user-facing template, keeping truth states honest.

## When to use

- The user is new to BlendOps or unsure which step comes next.
- Work is resuming and the next stage depends on which artifacts and evidence already exist.
- Any reply to the user needs to explain status, truth states, or Blender terms in plain language.

## When not to use
<!-- blendops:generated:start exclusions -->
- Goal is clear but no recipe or pack has been chosen yet → use `../scoping-3d-briefs/SKILL.md` (Selects the fitting recipe/pack at precedence Rank 2)
- Pack is selected and brief exists, but pack preflight has not completed yet → use `../defining-done-and-gates/SKILL.md` (Executes preflight readiness verification at precedence Rank 3 before stage routing)
- Active MCP runtime bridge conflict on port 9876 → use `../setting-up-blender-runtime/SKILL.md` (Resolves port and dual add-on conflicts before advancing)
- The goal is clear and the user wants to select the right recipe or pack → use `../scoping-3d-briefs/SKILL.md` (Scores candidate recipes/packs and detects multi-deliverable scope)
- A recipe or pack is already selected and needs preflight readiness verification → use `../defining-done-and-gates/SKILL.md` (Evaluates the preflight matrix across brief completeness, runtime posture, and asset readiness)
- The user explicitly asks to turn an idea into a structured 3D brief → use `../scoping-3d-briefs/SKILL.md` (Locks the canonical 8-slot 3D brief before scene planning)
- The user asks to plan a product-hero scene directly → use `../planning-product-scenes/SKILL.md` (Handles domain-specific scene planning once brief and recipe are known)
- The user asks for render or export artifact verification → use `../verifying-before-handoff/SKILL.md` (Classifies artifact truth states from on-disk paths and validation notes)
- The user asks for Blender MCP runtime preflight verification → use `../setting-up-blender-runtime/SKILL.md` (Verifies Path 1 or Path 2 runtime readiness without claiming execution)
- to hide blockers, drop caveats for readability, or overclaim runtime or artifact success → use `../verifying-before-handoff/SKILL.md` (Delegates out-of-scope requests to verifying-before-handoff)
- to upgrade Runtime or Artifact truth states → use `../verifying-before-handoff/SKILL.md` (Delegates out-of-scope requests to verifying-before-handoff)
- to classify raw artifact evidence → use `../verifying-before-handoff/SKILL.md` (use verifying-before-handoff)
- to generate technical pass/warn/fail checks → use `../verifying-before-handoff/SKILL.md` (use verifying-before-handoff or domain quality checkers)
- to assemble technical GLB/web compatibility summaries → use `../handing-off-glb-to-web/SKILL.md` (use handing-off-glb-to-web)
- to gate handoff readiness → use `../verifying-before-handoff/SKILL.md` (use verifying-before-handoff)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "where are we in the workflow"
- "what's next"
- "resume from here"
- "next skill"
- "What should I do next?"
- "Which BlendOps skill should I use?"
- "Is this ready?"
- "Can I run the runtime eval?"
- "How do I package/install BlendOps?"
- "What is blocked?"
- "write final user summary"
- "explain this for non-Blender user"
- "make this stakeholder-friendly"
<!-- blendops:generated:end triggers -->

## Prerequisites / readiness

- Runtime state is one of `Not Run`, `Attempted`, `Produced`, `Verified`, `Failed`; artifacts default to `Not Produced`.
- Runtime install is separate from skill install; check readiness with `setting-up-blender-runtime` before any runtime step.

## Required laws

- [`../../laws/official-runtime-only.md`](../../laws/official-runtime-only.md)
- [`../../laws/evidence-before-done.md`](../../laws/evidence-before-done.md)
- [`../../laws/non-blender-user-language.md`](../../laws/non-blender-user-language.md)
- [`../../laws/no-arbitrary-python-interface.md`](../../laws/no-arbitrary-python-interface.md)

## Official runtime boundary

BlendOps runtime guidance uses **2 MCP execution paths plus a CLI fallback appendix** (replaces older 3-stack and 4-route drafts — see `../../docs/runtime-stack-strategy.md` for the corrected attribution history):

1. **Path 1 — Official Blender Lab MCP** (Lab add-on + Lab server installed in Blender 5.1+, hosted from either (a) Anthropic Blender Connector in Claude Desktop, or (b) any other MCP client configured manually). Anthropic Connector is **not** standalone — Anthropic's tutorial step 2 tells you to install the Lab add-on inside Blender.
2. **Path 2 — Community `mcp-for-blender` (formerly `blender-mcp`)** (different `addon.py` + server via `uvx mcp-for-blender`, mature third-party, Blender 3.0+).
3. **CLI fallback (appendix)** — direct `blender --background --python`, no MCP. **Documented upstream** as a first-class Blender CLI surface; see the [scoped mech-prop CLI eval](https://github.com/ThanhNguyxnOrg/blendops/blob/main/docs/evals/cli-fallback-mech-prop.md).

Blender 5.1+ floor applies to all of Path 1 (whichever host). Single-bridge constraint: Blender accepts one MCP bridge session per Blender instance.

This skill must not install Blender, run Blender, configure a runtime bridge, mutate a scene, render, export GLB, or claim artifacts unless the user explicitly requested that work and evidence exists.

## Runtime route requirements

| Path | Requirement before use |
|---|---|
| Path 1 (Blender-side, always required) | Blender 5.1+ + Lab MCP add-on installed in Blender + Lab MCP server (`.mcpb` bundle or source) reachable. |
| Path 1, host (a) Anthropic Connector | Connector enabled in Claude Desktop → Customize → Connectors; read-only request first. |
| Path 1, host (b) manual MCP client | Lab MCP server registered in client's `mcpServers` JSON or equivalent UI; read-only request first. |
| Path 2 (community `mcp-for-blender` (formerly `blender-mcp`)) | `uvx mcp-for-blender` registered in client config + `addon.py` installed/enabled in Blender 3.0+; read `../../docs/unofficial-runtime-bridges.md` first; explicit user opt-in for `execute_blender_code` (no sandbox). |
| CLI fallback (appendix) | Exact Blender executable/CLI command, input/script, output paths, logs, validation evidence; see the [scoped mech-prop CLI eval](https://github.com/ThanhNguyxnOrg/blendops/blob/main/docs/evals/cli-fallback-mech-prop.md) as an example, not as evidence of the current run. |

## Decision tree

- Goal unclear or no recipe chosen → `scoping-3d-briefs`.
- Recipe chosen but prerequisites or done criteria missing → `defining-done-and-gates`.
- Recipe and prerequisites ready, stage inventory known → pick the earliest stage whose gate is not met (see [stage routing](references/workflow-stage-router.md)).
- Something already looks wrong → `troubleshooting-blender-output`.
- Before any reply → apply the [plain-language rules](references/plain-language-response.md).

## Playbooks

- [workflow-stage-router](references/workflow-stage-router.md) — Route to the earliest unmet stage from the artifact inventory.
- [blendops-help](references/blendops-help.md) — Answer "what should I do next?" and explain the BlendOps lifecycle.
- [plain-language-response](references/plain-language-response.md) — Rewrite status and results for non-Blender users with truth states kept intact.

## Mode handling

### Text-only mode
Plan and advise only. Runtime stays `Not Run` and artifacts stay `Not Produced`.

### Runtime-ready mode
Readiness has passed. Runtime work happens only when the user asked for it; record evidence for every state you report.

### Blocked runtime mode
Keep planning. Report the blocker in plain language and never upgrade truth states.

## Validation checklist

- [ ] The branch chosen matches the user's goal and current stage.
- [ ] Only the needed reference file was loaded.
- [ ] Runtime and artifact states are explicit and backed by evidence.
- [ ] Next step names exactly one skill, doc, or action.
- [ ] The reply avoids unexplained Blender jargon and does not hand the user Python.

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Output satisfies scope, evidence state is explicit, and no overclaim appears. |
| Warn | Output is useful but has missing inputs, partial evidence, or scoped uncertainty. |
| Fail | Output claims unsupported runtime/artifact success, ignores laws, or routes to an unsupported path. |

## Failure handling

- Missing inputs: ask for them, or proceed with labelled assumptions and a Warn verdict.
- Missing evidence: keep or downgrade truth states; never upgrade.
- Wrong skill: hand off through the cross-skill handoff list below.

## Troubleshooting

- If output looks wrong after a runtime step, hand off to `troubleshooting-blender-output`.
- If the runtime path is unclear or failing, hand off to `setting-up-blender-runtime`.

## Best practices

- One next step per reply.
- Cite evidence paths for every Produced or Verified claim.
- Explain unavoidable Blender terms in a few words.

## Good examples

User: "I have a brief and the product-hero recipe; the camera plan is done." → Route to lighting and materials as the earliest unmet stage, Runtime: Not Run, Artifact: Not Produced.

## Bad examples

Telling the user "your render is done" because a plan exists, or listing all 14 skills instead of naming one next step. Doing this skips the checks this skill owns and leaves the user without evidence for the result.

## User-facing response template

```txt
Step: entry-router-stage-router-and-plain-language-output
Status: <Pass/Warn/Fail or scoped status>
Runtime: <state>
Artifacts: <state>
Evidence: <paths/links/logs or none>
Next safe action: <skill/doc/action>
Limitations: <gaps>
```

## Anti-patterns

- Claiming render, export, or GLB results without evidence.
- Recommending "paste this Python" as the user's fix.
- Describing Anthropic Connector as standalone.
- Loading every reference file instead of the one the step needs.

## Cross-skill handoff
<!-- blendops:generated:start handoffs -->
- [upstream_reference] Pack entry preflight gate → `../defining-done-and-gates/SKILL.md`
- [conditional] Runtime readiness check → `../setting-up-blender-runtime/SKILL.md`
- [fallback] Active MCP bridge conflict on port 9876 → `../setting-up-blender-runtime/SKILL.md`
- [boundary_delegation] Mid-workflow scope expansion or unapproved deliverable addition → `../defining-done-and-gates/SKILL.md`
- [progression] Evidence updates for render or export outputs → `../verifying-before-handoff/SKILL.md`
- [fallback] Failed gate / blocked mode exit / final gate → `../verifying-before-handoff/SKILL.md`
- [progression] Recipe or pack selection when goal becomes clear → `../scoping-3d-briefs/SKILL.md`
- [conditional] Pack preflight readiness check when recipe is already chosen → `../defining-done-and-gates/SKILL.md`
- [progression] Initial 3D brief creation → `../scoping-3d-briefs/SKILL.md`
- [conditional] Runtime path selection → `../setting-up-blender-runtime/SKILL.md`
- [conditional] Official runtime setup → `../setting-up-blender-runtime/SKILL.md`
- [conditional] Runtime readiness preflight → `../setting-up-blender-runtime/SKILL.md`
- [alternative] Scene planning → `../planning-product-scenes/SKILL.md`
- [conditional] Render/export evidence → `../verifying-before-handoff/SKILL.md`
- [fallback] Failed workflow gate / pre-handoff check → `../verifying-before-handoff/SKILL.md`
- [conditional] GLB handoff → `../handing-off-glb-to-web/SKILL.md`
- [fallback] Upstream quality pass/warn/fail validation (verifying-before-handoff) → `../verifying-before-handoff/SKILL.md`
- [fallback] Upstream quality pass/warn/fail validation (planning-camera-and-framing) → `../planning-camera-and-framing/SKILL.md`
- [fallback] Upstream quality pass/warn/fail validation (planning-lighting-and-materials) → `../planning-lighting-and-materials/SKILL.md`
- [fallback] Upstream quality pass/warn/fail validation (planning-lighting-and-materials) → `../planning-lighting-and-materials/SKILL.md`
- [fallback] Upstream quality pass/warn/fail validation (budgeting-glb-for-web) → `../budgeting-glb-for-web/SKILL.md`
- [upstream_reference] Upstream GLB/web handoff summary → `../handing-off-glb-to-web/SKILL.md`
- [upstream_reference] Upstream handoff gate check → `../verifying-before-handoff/SKILL.md`
- [upstream_reference] Runtime readiness check when runtime is unverified → `../setting-up-blender-runtime/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Does not install Blender, configure an MCP bridge, or own a runtime; it points to upstream paths only.
- Does not claim render, export, preview, or GLB results without evidence.
- Does not hand the user Python as the final interface.

## References

- [blendops-help-routing-decision-tree.md](references/blendops-help-routing-decision-tree.md)
- [blendops-help.md](references/blendops-help.md)
- [caveat-language.md](references/caveat-language.md)
- [lifecycle-phases.md](references/lifecycle-phases.md)
- [milestone-model.md](references/milestone-model.md)
- [plain-language-patterns.md](references/plain-language-patterns.md)
- [plain-language-response.md](references/plain-language-response.md)
- [quick-start-prompts.md](references/quick-start-prompts.md)
- [routing-decision-tree.md](references/routing-decision-tree.md)
- [stage-handoff-template.md](references/stage-handoff-template.md)
- [stakeholder-friendly-examples.md](references/stakeholder-friendly-examples.md)
- [status-summary-templates.md](references/status-summary-templates.md)
- [workflow-stage-router.md](references/workflow-stage-router.md)
