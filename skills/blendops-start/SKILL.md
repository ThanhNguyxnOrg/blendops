---
name: blendops-start
description: Start here for any BlendOps 3D task. Use when unsure which step comes next, when resuming work, or before writing a status reply to a non-Blender user.
---

# blendops-start

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
- Goal is clear but no recipe or pack has been chosen yet → use `../blendops-brief/SKILL.md` (Selects the fitting recipe/pack at precedence Rank 2)
- Pack is selected and brief exists, but pack preflight has not completed yet → use `../blendops-done-criteria/SKILL.md` (Executes preflight readiness verification at precedence Rank 3 before stage routing)
- Active MCP runtime bridge conflict on port 9876 → use `../blendops-connect-blender/SKILL.md` (Resolves port and dual add-on conflicts before advancing)
- The goal is clear and the user wants to select the right recipe or pack → use `../blendops-brief/SKILL.md` (Scores candidate recipes/packs and detects multi-deliverable scope)
- A recipe or pack is already selected and needs preflight readiness verification → use `../blendops-done-criteria/SKILL.md` (Evaluates the preflight matrix across brief completeness, runtime posture, and asset readiness)
- The user explicitly asks to turn an idea into a structured 3D brief → use `../blendops-brief/SKILL.md` (Locks the canonical 8-slot 3D brief before scene planning)
- The user asks to plan a product-hero scene directly → use `../blendops-product-shot/SKILL.md` (Handles domain-specific scene planning once brief and recipe are known)
- The user asks for render or export artifact verification → use `../blendops-final-check/SKILL.md` (Classifies artifact truth states from on-disk paths and validation notes)
- The user asks for Blender MCP runtime preflight verification → use `../blendops-connect-blender/SKILL.md` (Verifies Path 1 or Path 2 runtime readiness without claiming execution)
- to hide blockers, drop caveats for readability, or overclaim runtime or artifact success → use `../blendops-final-check/SKILL.md` (Delegates out-of-scope requests to blendops-final-check)
- to upgrade Runtime or Artifact truth states → use `../blendops-final-check/SKILL.md` (Delegates out-of-scope requests to blendops-final-check)
- to classify raw artifact evidence → use `../blendops-final-check/SKILL.md` (use blendops-final-check)
- to generate technical pass/warn/fail checks → use `../blendops-final-check/SKILL.md` (use blendops-final-check or domain quality checkers)
- to assemble technical GLB/web compatibility summaries → use `../blendops-glb-web-handoff/SKILL.md` (use blendops-glb-web-handoff)
- to gate handoff readiness → use `../blendops-final-check/SKILL.md` (use blendops-final-check)
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

- Goal unclear or no recipe chosen → `blendops-brief`.
- Recipe chosen but prerequisites or done criteria missing → `blendops-done-criteria`.
- Recipe and prerequisites ready, stage inventory known → pick the earliest stage whose gate is not met (see [stage routing](references/workflow-stage-router.md)).
- Something already looks wrong → `blendops-fix-problems`.
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

- If output looks wrong after a runtime step, hand off to `blendops-fix-problems`.
- If the runtime path is unclear or failing, hand off to `blendops-connect-blender`.

## Best practices

- One next step per reply.
- Cite evidence paths for every Produced or Verified claim.
- Explain unavoidable Blender terms in a few words.

## Good examples

User: "I have a brief and the product-hero recipe; the camera plan is done." → Route to lighting and materials as the earliest unmet stage, Runtime: Not Run, Artifact: Not Produced.

## Bad examples

Telling the user "your render is done" because a plan exists, or listing all 16 skills instead of naming one next step. Doing this skips the checks this skill owns and leaves the user without evidence for the result.

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
- [upstream_reference] Pack entry preflight gate → `../blendops-done-criteria/SKILL.md`
- [conditional] Runtime readiness check → `../blendops-connect-blender/SKILL.md`
- [fallback] Active MCP bridge conflict on port 9876 → `../blendops-connect-blender/SKILL.md`
- [boundary_delegation] Mid-workflow scope expansion or unapproved deliverable addition → `../blendops-done-criteria/SKILL.md`
- [progression] Evidence updates for render or export outputs → `../blendops-final-check/SKILL.md`
- [fallback] Failed gate / blocked mode exit / final gate → `../blendops-final-check/SKILL.md`
- [progression] Recipe or pack selection when goal becomes clear → `../blendops-brief/SKILL.md`
- [conditional] Pack preflight readiness check when recipe is already chosen → `../blendops-done-criteria/SKILL.md`
- [progression] Initial 3D brief creation → `../blendops-brief/SKILL.md`
- [conditional] Runtime path selection → `../blendops-connect-blender/SKILL.md`
- [conditional] Official runtime setup → `../blendops-connect-blender/SKILL.md`
- [conditional] Runtime readiness preflight → `../blendops-connect-blender/SKILL.md`
- [alternative] Scene planning → `../blendops-product-shot/SKILL.md`
- [conditional] Render/export evidence → `../blendops-final-check/SKILL.md`
- [fallback] Failed workflow gate / pre-handoff check → `../blendops-final-check/SKILL.md`
- [conditional] GLB handoff → `../blendops-glb-web-handoff/SKILL.md`
- [fallback] Upstream quality pass/warn/fail validation (blendops-final-check) → `../blendops-final-check/SKILL.md`
- [fallback] Upstream quality pass/warn/fail validation (blendops-camera) → `../blendops-camera/SKILL.md`
- [fallback] Upstream quality pass/warn/fail validation (blendops-lighting-materials) → `../blendops-lighting-materials/SKILL.md`
- [fallback] Upstream quality pass/warn/fail validation (blendops-lighting-materials) → `../blendops-lighting-materials/SKILL.md`
- [fallback] Upstream quality pass/warn/fail validation (blendops-glb-budget) → `../blendops-glb-budget/SKILL.md`
- [upstream_reference] Upstream GLB/web handoff summary → `../blendops-glb-web-handoff/SKILL.md`
- [upstream_reference] Upstream handoff gate check → `../blendops-final-check/SKILL.md`
- [upstream_reference] Runtime readiness check when runtime is unverified → `../blendops-connect-blender/SKILL.md`
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
