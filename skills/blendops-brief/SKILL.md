---
name: blendops-brief
description: Turn a 3D idea into a locked brief and a recipe. Use when the goal is vague, has no recipe yet, or needs to be split into stages, or to check whether BlendOps fits it.
---

# blendops-brief

## Purpose

Turn a vague or clear 3D goal into a locked brief, pick or decompose a recipe, and say whether the goal fits BlendOps.

This skill merges `recipe-fit-assessor`, `intent-to-3d-brief-writer`, `blender-brainstorming`, `blender-recipe-decomposer` (v2.0.0). The detailed playbook for each part lives in `references/`; load only the one the current step needs.

## Quick start

1. Confirm the user's goal and the current runtime and artifact state.
2. Pick the branch in the decision tree below.
3. Load only that branch's reference file and follow it.
4. Reply with the user-facing template, keeping truth states honest.

## When to use

- The user has an idea but no written brief.
- The goal is clear but no recipe is selected yet.
- A large goal needs to be split into recipe stages.
- You need to say honestly whether BlendOps fits the request.

## When not to use
<!-- blendops:generated:start exclusions -->
- General entry routing across BlendOps when the goal itself is unclear → use `../blendops-start/SKILL.md` (Handles ambiguous entry triage at precedence Rank 1)
- Checking whether a selected pack's preflight prerequisites are met → use `../blendops-done-criteria/SKILL.md` (Evaluates preflight readiness once the recipe/pack is already selected)
- Picking the next workflow stage after preflight passed and artifacts already exist → use `../blendops-start/SKILL.md` (Routes active in-flight workflows at precedence Rank 4)
- Detailed scene planning once a domain and brief are locked → use `../blendops-product-shot/SKILL.md` (Builds the domain-specific scene plan after preflight passes)
- Runtime setup, path selection, or bridge conflict troubleshooting → use `../blendops-connect-blender/SKILL.md` (Handles MCP runtime selection and setup outside recipe scoring)
- Legal or asset license verification → use `../blendops-assets/SKILL.md` (Audits asset provenance and license compatibility)
- the user is mid-execution and asks for a re-brief → use `../blendops-fix-problems/SKILL.md` (route to blendops-fix-problems instead)
- the user pushes for immediate execution → use `../blendops-connect-blender/SKILL.md` (route to blendops-connect-blender)
- the user pushes for immediate execution rather than exploration → use `../blendops-connect-blender/SKILL.md` (route to blendops-connect-blender)
- after recipes are already split or running → use `../blendops-done-criteria/SKILL.md` (use blendops-done-criteria for added scope or blendops-done-criteria to evaluate completion)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "what recipe should I use"
- "does product hero fit"
- "closest workflow for X"
- "which pack"
- "lock the brief"
- "write the brief from this conversation"
- "what's the formal scope?"
- "before planning, write the spec"
- "I want a 3D render of..." (vague)"
- "Make me something cool with..."
- "Help me plan a Blender scene" (no constraints given)"
- "I'm not sure what I want exactly..."
- "Brainstorm with me about..."
- "I want all of these"
- "this is a lot"
- "we'll need several outputs"
- "across these scenes"
<!-- blendops:generated:end triggers -->

## Prerequisites / readiness

- Runtime state is one of `Not Run`, `Attempted`, `Produced`, `Verified`, `Failed`; artifacts default to `Not Produced`.
- Runtime install is separate from skill install; check readiness with `blendops-connect-blender` before any runtime step.

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

- Idea still fuzzy → brainstorm options first ([brainstorming](references/blender-brainstorming.md)).
- Idea clear → fill the 8-slot brief ([brief writer](references/intent-to-3d-brief-writer.md)).
- Brief locked → assess recipe fit ([recipe fit](references/recipe-fit-assessor.md)).
- No single recipe fits → decompose into stages ([decomposer](references/blender-recipe-decomposer.md)).

## Playbooks

- [recipe-fit-assessor](references/recipe-fit-assessor.md) — Match a locked brief to a recipe or say it does not fit.
- [intent-to-3d-brief-writer](references/intent-to-3d-brief-writer.md) — Write and lock the 8-slot brief.
- [blender-brainstorming](references/blender-brainstorming.md) — Explore directions before locking anything.
- [blender-recipe-decomposer](references/blender-recipe-decomposer.md) — Split a goal into ordered recipe stages.

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

- If output looks wrong after a runtime step, hand off to `blendops-fix-problems`.
- If the runtime path is unclear or failing, hand off to `blendops-connect-blender`.

## Best practices

- One next step per reply.
- Cite evidence paths for every Produced or Verified claim.
- Explain unavoidable Blender terms in a few words.

## Good examples

"A sneaker showcase for our site" → ask the missing brief slots, lock the brief, then match it to product-hero-v0 with an explicit fit verdict.

## Bad examples

Jumping straight to camera or lighting choices before the brief is locked. Doing this skips the checks this skill owns and leaves the user without evidence for the result.

## User-facing response template

```txt
Step: goal-brainstorm-brief-writer-and-recipe-fit
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
- [boundary_delegation] General entry routing → `../blendops-start/SKILL.md`
- [progression] Pack prerequisite verification → `../blendops-done-criteria/SKILL.md`
- [conditional] Post-artifact stage routing → `../blendops-start/SKILL.md`
- [alternative] Domain scene planner (product hero) → `../blendops-product-shot/SKILL.md`
- [alternative] Domain scene planner (product grid) → `../blendops-product-shot/SKILL.md`
- [alternative] Domain scene planner (character portrait) → `../blendops-scene-plan/SKILL.md`
- [alternative] Domain scene planner (environment establishing shot) → `../blendops-scene-plan/SKILL.md`
- [alternative] Domain scene planner (interior architectural) → `../blendops-scene-plan/SKILL.md`
- [progression] Consuming skills (blendops-done-criteria) → `../blendops-done-criteria/SKILL.md`
- [progression] Consuming skills (blendops-camera) → `../blendops-camera/SKILL.md`
- [progression] Consuming skills (blendops-lighting-materials) → `../blendops-lighting-materials/SKILL.md`
- [conditional] If execution is requested → `../blendops-connect-blender/SKILL.md`
- [fallback] If mid-execution re-briefing occurs → `../blendops-fix-problems/SKILL.md`
- [conditional] Explain blocked runtime status to user → `../blendops-start/SKILL.md`
- [progression] Pinning formal done conditions per recipe → `../blendops-done-criteria/SKILL.md`
- [progression] Workflow stage gates per recipe → `../blendops-done-criteria/SKILL.md`
- [progression] Handling scope added after splitting → `../blendops-done-criteria/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Does not install Blender, configure an MCP bridge, or own a runtime; it points to upstream paths only.
- Does not claim render, export, preview, or GLB results without evidence.
- Does not hand the user Python as the final interface.

## References

- [acceptance-criteria-patterns.md](references/acceptance-criteria-patterns.md)
- [alternative-scoping-templates.md](references/alternative-scoping-templates.md)
- [blender-brainstorming.md](references/blender-brainstorming.md)
- [blender-recipe-decomposer.md](references/blender-recipe-decomposer.md)
- [clarification-patterns.md](references/clarification-patterns.md)
- [dependency-patterns.md](references/dependency-patterns.md)
- [eight-slot-template.md](references/eight-slot-template.md)
- [intent-summary-style-guide.md](references/intent-summary-style-guide.md)
- [intent-to-3d-brief-writer.md](references/intent-to-3d-brief-writer.md)
- [mixed-audience-handling.md](references/mixed-audience-handling.md)
- [recipe-catalog.md](references/recipe-catalog.md)
- [recipe-fit-assessor.md](references/recipe-fit-assessor.md)
- [recipe-grouping-rules.md](references/recipe-grouping-rules.md)
- [recipe-naming-rules.md](references/recipe-naming-rules.md)
- [scope-gap-rules.md](references/scope-gap-rules.md)
- [workflow-recommendation-template.md](references/workflow-recommendation-template.md)
