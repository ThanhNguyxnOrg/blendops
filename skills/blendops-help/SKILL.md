---
name: blendops-help
description: Help users and agents choose the next safe BlendOps action across skills, docs, runtime readiness, evals, packaging, and Draft v0 release boundaries.
---

# blendops-help

## Purpose

Help an agent or user decide the single safest next action in BlendOps when the goal is unclear, current status is unknown, or an entry point into skills, docs, runtime readiness, packaging, or release review is needed.

Once the user's goal is clear and workflow artifacts exist, hand off routing to `workflow-stage-router` rather than duplicating stage precedence logic here.

## Quick start

1. Ask for the current goal and status if missing.
2. If the goal is already clear and artifacts exist, hand off immediately to `workflow-stage-router`.
3. Otherwise, identify whether the entry need is brief/planning setup, runtime readiness, evidence verification, install/package docs, or release review.
4. Route to the single smallest safe skill or doc.
5. Preserve Draft v0, runtime, and artifact truth (downgrade-only, never upgrade).

## When to use

Use this skill when:

- the user asks “what should I do next?” and the goal or current state is unclear
- the user is unsure how to enter the BlendOps skill catalog or documentation
- runtime, artifact, packaging, or release status is unknown and needs initial triage
- no workflow artifacts exist yet and the user needs a safe starting skill or doc
- an agent needs a concise entry-point recommendation before starting work

## When not to use
<!-- blendops:generated:start exclusions -->
- The goal is clear, preflight is passed, and stage or artifact inventory already exists → use `../workflow-stage-router/SKILL.md` (Selects the single immediate next skill from a locked precedence order and exits to pre-handoff-verification on any failed gate)
- The goal is clear and the user wants to select the right recipe or pack → use `../recipe-fit-assessor/SKILL.md` (Scores candidate recipes/packs and detects multi-deliverable scope)
- A recipe or pack is already selected and needs preflight readiness verification → use `../pack-prerequisite-checker/SKILL.md` (Evaluates the preflight matrix across brief completeness, runtime posture, and asset readiness)
- The user explicitly asks to turn an idea into a structured 3D brief → use `../intent-to-3d-brief-writer/SKILL.md` (Locks the canonical 8-slot 3D brief before scene planning)
- The user asks to plan a product-hero scene directly → use `../product-hero-scene-planner/SKILL.md` (Handles domain-specific scene planning once brief and recipe are known)
- The user asks for render or export artifact verification → use `../render-export-evidence/SKILL.md` (Classifies artifact truth states from on-disk paths and validation notes)
- The user asks for Blender MCP runtime preflight verification → use `../runtime-readiness/SKILL.md` (Verifies Path 1 or Path 2 runtime readiness without claiming execution)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "What should I do next?"
- "Which BlendOps skill should I use?"
- "Is this ready?"
- "Can I run the runtime eval?"
- "How do I package/install BlendOps?"
- "What is blocked?"
<!-- blendops:generated:end triggers -->

## Prerequisites / readiness

- Know whether the user wants initial planning/briefing, runtime readiness, artifact evidence, install/package work, or release readiness.
- If status is unknown, ask for current goal and known evidence first.
- If the goal is clear and artifacts exist, defer directly to `workflow-stage-router`.
- Treat runtime status as `Not Run` and artifacts as `Not Produced` by default unless verified evidence says otherwise; apply downgrade-only rules and never upgrade states.

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Current goal | Determines route. |
| Known status | Prevents unsupported readiness or artifact claims. |
| Target surface | Needed for install/adaptor/package questions. |

### Optional inputs

| Input | Use |
|---|---|
| Runtime stack | Routes to readiness or stack docs. |
| Existing evidence | Enables evidence-aware recommendation. |
| Desired output | Helps choose planning, validation, export, or handoff skill. |

### Assumptions to confirm

- Skill install is separate from runtime install.
- Runtime readiness is separate from full runtime eval.
- Read-only connector smoke evidence is not artifact evidence.

## Output schema

### Primary output

A short next-step recommendation with one safe primary action.

### Secondary output

- applicable skill/doc
- blocker/caveat
- evidence state
- optional follow-up action

### Evidence / caveat output

```txt
Recommended next action: <skill/doc/action>
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Produced | Produced | Verified | Failed
Evidence used: <links/paths or none>
Why this is safe: <reason>
```

## Required laws

- `../../laws/official-runtime-only.md`
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`

## Official runtime boundary

Before runtime work, point to `../../docs/runtime-stack-strategy.md`, `runtime-path-picker`, and `runtime-readiness`.

BlendOps runtime guidance uses **2 MCP execution paths plus a CLI fallback appendix**:

1. **Path 1 — Official Blender Lab MCP** in Blender 5.1+ (add-on manifest literal `blender_version_min = "5.1.0"`), hosted from either (a) Anthropic Connector in Claude Desktop or (b) any manually configured MCP client. The Connector is **not** standalone: Anthropic tutorial step 2 installs the Lab add-on inside Blender, and although the tutorial prerequisite says "Blender 4.2 or later", the binding floor is Blender 5.1+.
2. **Path 2 — Community `mcp-for-blender` (renamed from `ahujasid/blender-mcp`)**, third-party, Blender 3.0+, started via `uvx mcp-for-blender`. Use only with caveats and **never** accepted as release evidence.
3. **CLI fallback (appendix only)** — `blender --background --python` (documented flags: `--background`, `--python`, `-E/--engine`; run `blender -E help` for exact engine tokens). Appendix only, **never** a peer path without an eval record.

Single-bridge constraint: One MCP bridge is allowed per Blender instance (default port 9876; side-by-side on separate instances via per-instance `--port 9877` is supported upstream). If bridge conflicts occur, route to `bridge-conflicts`.

This skill does not run Blender, mutate scenes, render, export, install runtimes, or claim artifacts.

## Operating procedure

1. Check whether the goal is already clear and artifacts exist:
   - if yes, route immediately to `workflow-stage-router`
2. If goal or status is unclear, classify the entry request:
   - entry help / initial triage
   - intent brief or initial scene planning
   - runtime path selection or readiness
   - render/export evidence check
   - install/package/adaptor docs
   - release readiness docs
3. Identify known evidence and assign conservative truth states (downgrade-only):
   - Runtime: `Not Run | Attempted | Produced | Verified | Failed`
   - Artifacts: `Not Run | Not Produced | Produced | Verified | Failed` (default `Not Produced`)
4. Pick the single safest entry skill or doc.
5. State the blocker if no safe active step exists and return the recommendation.

## Decision tree

```txt
Goal unclear or status unknown?
  → ask for current goal/status
Goal clear and artifacts already exist?
  → workflow-stage-router (exits to pre-handoff-verification on any failed gate)
Need to turn a rough idea into a 3D brief?
  → intent-to-3d-brief-writer
Need an initial scene plan (no artifacts yet)?
  → product-hero-scene-planner (or character-portrait / environment-shot / interior-scene / product-grid-scene-planner)
Need runtime path choice, setup, or preflight?
  → runtime-path-picker / runtime-setup / runtime-readiness
Need artifact proof?
  → render-export-evidence
Need install/package docs?
  → docs/ai-agent-install-flow.md + docs/distribution-strategy.md
Need release readiness docs?
  → docs/release-readiness.md + docs/release-readiness-rollup-v0.md
```

## Playbooks

### Playbook A: First-time user

- Recommend reading `docs/README.md`, `docs/skill-system.md`, and `docs/external-runtime-setup.md`, or starting with `intent-to-3d-brief-writer`.
- Keep runtime status `Not Run` and artifact status `Not Produced`.
- Suggest planning mode unless runtime is explicitly available.

### Playbook B: Runtime request

- Route to `runtime-path-picker`, `runtime-setup`, or `runtime-readiness`.
- Require read-only inspection smoke test before mutation (`execute_blender_code`), render, or export.
- Do not treat readiness as runtime success; keep states downgrade-only.

### Playbook C: Artifact claim request

- Route to `render-export-evidence` (or `pre-handoff-verification` if a workflow gate failed).
- Require command/tool, input/scene, output path, file existence, validation notes, and limitations.
- If evidence is missing, keep artifact status at `Not Produced` (or `Failed` if a run failed; never use `Attempted` for artifacts) and downgrade any unsupported claim.

### Playbook D: Packaging request

- Route to `docs/multi-agent-install-strategy.md` and `docs/distribution-strategy.md`.
- Keep packaged skill, plugin listing, and marketplace listing as future until verified.

## Mode handling

### Text-only mode

Recommend planning, docs, or eval prep only. Runtime remains `Not Run`.

### Runtime-ready mode

Recommend readiness preflight and evidence capture before any mutation/render/export.

### Blocked runtime mode

Name blocker and suggest the next non-runtime planning or documentation step.

## Validation checklist

- [ ] Current goal/status identified.
- [ ] Handed off to `workflow-stage-router` if goal is clear and artifacts exist.
- [ ] Recommended exactly one safest next action using a real catalog skill or doc.
- [ ] Runtime status is explicit (`Not Run | Attempted | Produced | Verified | Failed`).
- [ ] Artifact status is explicit (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`).
- [ ] Truth states follow downgrade-only rules (never upgraded).
- [ ] Runtime boundaries respected (Path 1 5.1+ non-standalone Connector, Path 2 `mcp-for-blender` caveats/never release evidence, CLI appendix-only).
- [ ] Handoff skill/doc is named.

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Recommendation is specific, safe, evidence-bound, defers to `workflow-stage-router` when artifacts exist, and points to a valid skill/doc. |
| Warn | Recommendation is safe but depends on missing status or user confirmation before routing. |
| Fail | Recommendation duplicates `workflow-stage-router` precedence, upgrades truth states, assigns `Attempted` to artifacts, treats Path 2 as release evidence or CLI as a peer path without an eval record, or claims standalone/sub-5.1 Path 1 support. |

## Failure handling

- If status is unknown, ask for goal/status instead of guessing.
- If the goal is clear and artifacts exist, stop entry triage and route to `workflow-stage-router`.
- If the user asks to run Path 1 on Blender below 5.1 or via Anthropic Connector without the Lab add-on installed in Blender, explain that the binding floor is `blender_version_min = "5.1.0"` and the Connector is not standalone.
- If the user asks to use Path 2 (`mcp-for-blender`, renamed from `ahujasid/blender-mcp`) for release evidence or CLI (`blender --background --python`) as a peer path without an eval record, block the claim and state the upstream boundary.
- If the user asks for artifacts with no evidence, route to `render-export-evidence` and keep artifact status `Not Produced`.
- If the user asks for release/tag, route to release readiness docs and current blockers.

## Troubleshooting

| Problem | Safe response |
|---|---|
| User says “make it ready” | Ask which layer: skill install, runtime readiness, artifact evidence, or release readiness. |
| User says “runtime works” | Ask for eval evidence and route to readiness/evidence docs. |
| User says “package it” | Keep package/listing as future unless verified. |

## Best practices

- Keep recommendations short and pick one primary action.
- Defer to `workflow-stage-router` as soon as the goal is clear and artifacts exist.
- Preserve conservative Draft v0 status and downgrade-only truth states.
- Treat read-only MCP inspection access as scoped smoke evidence only, never artifact evidence.

## Good examples

- “Next safe action: run `runtime-readiness` for Path 1 (Official Blender Lab MCP 5.1+, host (a) Anthropic Connector in Claude Desktop with Lab add-on installed). Runtime status: Not Run. Artifact status: Not Produced.”
- “Next safe action: use `product-hero-scene-planner` to plan the scene; no runtime is needed yet. Runtime status: Not Run. Artifact status: Not Produced.”
- “Next safe action: hand off to `workflow-stage-router` because your goal is clear and scene artifacts already exist.”

## Bad examples

- “Proceed to render” before readiness.
- “Artifacts are ready” without paths and validation.
- “Publish the package” without install/listing evidence.

## User-facing response template

```txt
Next safe action: <action>
Use: <skill/doc>
Runtime status: <state>
Artifact status: <state>
Evidence used: <evidence or none>
Why: <short reason>
```

## Anti-patterns

- Duplicating `workflow-stage-router` stage precedence instead of handing off when the goal is clear and artifacts exist.
- Turning a help response into implementation or Python execution without confirmation.
- Claiming Anthropic Connector works standalone without the Lab add-on or on Blender below 5.1 (`blender_version_min = "5.1.0"`).
- Treating Path 2 (`mcp-for-blender`, renamed from `ahujasid/blender-mcp`) as release evidence or CLI fallback (`blender --background --python`) as a peer path without an eval record.
- Assigning `Attempted` to artifact status or upgrading runtime/artifact truth states without evidence.
- Treating install docs as runtime evidence or future packaging tasks as completed.

## Cross-skill handoff
<!-- blendops:generated:start handoffs -->
- [progression] Recipe or pack selection when goal becomes clear → `../recipe-fit-assessor/SKILL.md`
- [conditional] Pack preflight readiness check when recipe is already chosen → `../pack-prerequisite-checker/SKILL.md`
- [conditional] In-flight workflow routing (clear goal + existing artifacts) → `../workflow-stage-router/SKILL.md`
- [progression] Initial 3D brief creation → `../intent-to-3d-brief-writer/SKILL.md`
- [conditional] Runtime path selection → `../runtime-path-picker/SKILL.md`
- [conditional] Official runtime setup → `../runtime-setup/SKILL.md`
- [conditional] Runtime readiness preflight → `../runtime-readiness/SKILL.md`
- [fallback] MCP bridge port/session conflict → `../bridge-conflicts/SKILL.md`
- [alternative] Scene planning → `../product-hero-scene-planner/SKILL.md`
- [conditional] Render/export evidence → `../render-export-evidence/SKILL.md`
- [fallback] Failed workflow gate / pre-handoff check → `../pre-handoff-verification/SKILL.md`
- [conditional] GLB handoff → `../glb-web-handoff/SKILL.md`
- [progression] Final response → `../plain-language-response/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Replace or duplicate `workflow-stage-router` precedence logic once the goal is clear and artifacts exist.
- Install Blender or runtimes.
- Run Blender or execute Python.
- Create or mutate scene data.
- Render/export artifacts.
- Publish packages or marketplace listings.

## References

- `../../docs/skill-system.md`
- `../../docs/runtime-stack-strategy.md`
- `../../docs/evals/runtime-availability-checklist.md`
- `../../docs/release-readiness-rollup-v0.md`
- `../../docs/distribution-strategy.md`
