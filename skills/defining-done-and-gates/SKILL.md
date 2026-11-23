---
name: defining-done-and-gates
description: Define what done means before work starts. Use when checking pack prerequisites, writing done criteria or stage gates, or when new requests threaten the locked scope.
---

# defining-done-and-gates

## Purpose

Check pack prerequisites, write measurable done criteria and stage gates, and guard the locked scope against creep.

This skill merges `pack-prerequisite-checker`, `done-criteria`, `stage-gates`, `acceptance-criteria-builder`, `scope-guard` (v2.0.0). The detailed playbook for each part lives in `references/`; load only the one the current step needs.

## Quick start

1. Confirm the user's goal and the current runtime and artifact state.
2. Pick the branch in the decision tree below.
3. Load only that branch's reference file and follow it.
4. Reply with the user-facing template, keeping truth states honest.

## When to use

- A recipe is selected and its prerequisites have not been checked.
- Done criteria or acceptance criteria are missing or vague.
- Stage gates need to be written or evaluated.
- The user asks to add something mid-project.

## When not to use
<!-- blendops:generated:start exclusions -->
- Goal or entry point is ambiguous and no pack is chosen yet → use `../using-blendops/SKILL.md` (Triages ambiguous entry requests at precedence Rank 1)
- Evaluating which recipe or pack fits the user's goal → use `../scoping-3d-briefs/SKILL.md` (Scores candidate recipes/packs at precedence Rank 2 before preflight)
- Workflow is already past preflight with existing stage or artifact inventory → use `../using-blendops/SKILL.md` (Routes in-flight workflows at precedence Rank 4)
- Detailed Blender MCP runtime connection preflight → use `../setting-up-blender-runtime/SKILL.md` (Inspects Path 1 or Path 2 runtime readiness in detail)
- Active MCP bridge port or add-on session conflicts → use `../setting-up-blender-runtime/SKILL.md` (Resolves port 9876 and dual-bridge conflicts)
- Debugging Blender scene or runtime execution errors → use `../troubleshooting-blender-output/SKILL.md` (Diagnoses runtime or scene failures)
- Auditing external 3D asset license compliance → use `../sourcing-assets/SKILL.md` (Performs dedicated asset license and provenance verification)
- pure exploration or brainstorming → use `../scoping-3d-briefs/SKILL.md` (use scoping-3d-briefs; goal is divergence)
- tiny single-shot requests → use `../scoping-3d-briefs/SKILL.md` (Delegates out-of-scope requests to scoping-3d-briefs)
- splitting a broad multi-recipe request beforehand → use `../scoping-3d-briefs/SKILL.md` (use scoping-3d-briefs first)
- performing the final verification gate before delivery → use `../verifying-before-handoff/SKILL.md` (use verifying-before-handoff)
- single-step requests → use `../scoping-3d-briefs/SKILL.md` (Delegates out-of-scope requests to scoping-3d-briefs)
- pure exploratory brainstorming → use `../scoping-3d-briefs/SKILL.md` (use scoping-3d-briefs)
- decomposing a brief into stages → use `../scoping-3d-briefs/SKILL.md` (use scoping-3d-briefs)
- selecting which skill runs next across the workflow → use `../using-blendops/SKILL.md` (use using-blendops)
- fixing repeated stage failures or broken renders → use `../troubleshooting-blender-output/SKILL.md` (use troubleshooting-blender-output)
- executing the final 7-point handoff gate → use `../verifying-before-handoff/SKILL.md` (use verifying-before-handoff)
- pure exploration without a locked deliverable → use `../scoping-3d-briefs/SKILL.md` (use scoping-3d-briefs)
- writing or locking the brief itself → use `../scoping-3d-briefs/SKILL.md` (use scoping-3d-briefs)
- legal or license-permission language → use `../sourcing-assets/SKILL.md` (use sourcing-assets)
- classifying artifact evidence → use `../verifying-before-handoff/SKILL.md` (use verifying-before-handoff)
- pure brainstorming with no active recipe → use `../scoping-3d-briefs/SKILL.md` (use scoping-3d-briefs)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "are we ready to start"
- "pre-flight for the pack"
- "what's missing before we build"
- "check prerequisites"
- "when are we done"
- "let's set the bar"
- "what does done look like"
- "let's do this step by step"
- "what's done before we move on"
- "checklist for this work"
- "I want to make sure each stage is solid"
- "acceptance criteria"
- "measurable checklist rows"
- "evidence hooks for brief"
- "sign-off checklist table"
- "can you also"
- "while you're at it"
- "actually let's also"
- "one more thing"
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

- Prerequisites unchecked → [pack prerequisites](references/pack-prerequisite-checker.md).
- No measurable done definition → [done criteria](references/done-criteria.md) then [acceptance criteria](references/acceptance-criteria-builder.md).
- Stage boundaries unclear → [stage gates](references/stage-gates.md).
- New request after brief lock → [scope guard](references/scope-guard.md).

## Playbooks

- [pack-prerequisite-checker](references/pack-prerequisite-checker.md) — Check the pack prerequisites before any stage work.
- [done-criteria](references/done-criteria.md) — Write measurable done criteria.
- [stage-gates](references/stage-gates.md) — Define and evaluate gates between stages.
- [acceptance-criteria-builder](references/acceptance-criteria-builder.md) — Turn done criteria into checkable acceptance items.
- [scope-guard](references/scope-guard.md) — Classify change requests and defer, split, or reopen.

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

Stakeholder adds 4 color variants mid-render → classify as out of scope, show impact on the locked budget, offer a follow-up brief.

## Bad examples

Quietly expanding the render queue, or judging done by feel instead of written criteria. Doing this skips the checks this skill owns and leaves the user without evidence for the result.

## User-facing response template

```txt
Step: prerequisites-done-criteria-stage-gates-and-scope-guard
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
- [upstream_reference] Recipe selection → `../scoping-3d-briefs/SKILL.md`
- [fallback] Brief completeness → `../scoping-3d-briefs/SKILL.md`
- [conditional] Runtime detail → `../setting-up-blender-runtime/SKILL.md`
- [fallback] Bridge conflicts → `../setting-up-blender-runtime/SKILL.md`
- [fallback] Runtime debugging → `../troubleshooting-blender-output/SKILL.md`
- [conditional] License checks → `../sourcing-assets/SKILL.md`
- [alternative] Domain planner (product hero when Go) → `../planning-product-scenes/SKILL.md`
- [alternative] Domain planner (product grid when Go) → `../planning-product-scenes/SKILL.md`
- [alternative] Domain planner (character portrait when Go) → `../planning-scenes/SKILL.md`
- [alternative] Domain planner (environment establishing shot when Go) → `../planning-scenes/SKILL.md`
- [alternative] Domain planner (interior architectural when Go) → `../planning-scenes/SKILL.md`
- [upstream_reference] Intent brief → `../scoping-3d-briefs/SKILL.md`
- [boundary_delegation] Scope splitting beforehand → `../scoping-3d-briefs/SKILL.md`
- [progression] Artifact and render evidence → `../verifying-before-handoff/SKILL.md`
- [progression] Final pre-handoff gate → `../verifying-before-handoff/SKILL.md`
- [upstream_reference] Brainstorming → `../scoping-3d-briefs/SKILL.md`
- [conditional] Next-skill routing across stages → `../using-blendops/SKILL.md`
- [progression] Asset discovery → `../sourcing-assets/SKILL.md`
- [progression] Scene planners (planning-camera-and-framing) → `../planning-camera-and-framing/SKILL.md`
- [progression] Scene planners (planning-lighting-and-materials) → `../planning-lighting-and-materials/SKILL.md`
- [alternative] Scene planners (planning-scenes) → `../planning-scenes/SKILL.md`
- [alternative] Scene planners (planning-scenes) → `../planning-scenes/SKILL.md`
- [alternative] Scene planners (planning-scenes) → `../planning-scenes/SKILL.md`
- [alternative] Scene planners (planning-product-scenes) → `../planning-product-scenes/SKILL.md`
- [alternative] Scene planners (planning-product-scenes) → `../planning-product-scenes/SKILL.md`
- [progression] Quality validators (verifying-before-handoff) → `../verifying-before-handoff/SKILL.md`
- [progression] Quality validators (planning-camera-and-framing) → `../planning-camera-and-framing/SKILL.md`
- [progression] Quality validators (planning-lighting-and-materials) → `../planning-lighting-and-materials/SKILL.md`
- [progression] Quality validators (planning-lighting-and-materials) → `../planning-lighting-and-materials/SKILL.md`
- [progression] Quality validators (budgeting-glb-for-web) → `../budgeting-glb-for-web/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Does not install Blender, configure an MCP bridge, or own a runtime; it points to upstream paths only.
- Does not claim render, export, preview, or GLB results without evidence.
- Does not hand the user Python as the final interface.

## References

- [acceptance-criteria-builder.md](references/acceptance-criteria-builder.md)
- [blocked-start-playbook.md](references/blocked-start-playbook.md)
- [brief-to-criteria-mapper.md](references/brief-to-criteria-mapper.md)
- [checklist-patterns.md](references/checklist-patterns.md)
- [done-criteria.md](references/done-criteria.md)
- [done-vs-perfect.md](references/done-vs-perfect.md)
- [evidence-hook-rules.md](references/evidence-hook-rules.md)
- [failed-gate-handling.md](references/failed-gate-handling.md)
- [gate-template.md](references/gate-template.md)
- [options-language-template.md](references/options-language-template.md)
- [out-of-scope-patterns.md](references/out-of-scope-patterns.md)
- [pack-prerequisite-checker.md](references/pack-prerequisite-checker.md)
- [pack-readiness-template.md](references/pack-readiness-template.md)
- [prerequisite-matrix.md](references/prerequisite-matrix.md)
- [recurring-creep-patterns.md](references/recurring-creep-patterns.md)
- [scope-addition-classification.md](references/scope-addition-classification.md)
- [scope-guard.md](references/scope-guard.md)
- [stage-decomposition-patterns.md](references/stage-decomposition-patterns.md)
- [stage-gates.md](references/stage-gates.md)
- [stop-condition-templates.md](references/stop-condition-templates.md)
