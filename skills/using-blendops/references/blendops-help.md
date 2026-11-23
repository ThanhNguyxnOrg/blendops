
# using-blendops (reference for `using-blendops`)

> Detailed playbook carried over from the former `using-blendops` skill. Load it from [`../SKILL.md`](../SKILL.md) when this part of the job is in scope.

## Purpose

Help an agent or user decide the single safest next action in BlendOps when the goal is unclear, current status is unknown, or an entry point into skills, docs, runtime readiness, packaging, or release review is needed.

Once the user's goal is clear and workflow artifacts exist, hand off routing to `using-blendops` rather than duplicating stage precedence logic here.

## Quick start

1. Ask for the current goal and status if missing.
2. If the goal is already clear and artifacts exist, hand off immediately to `using-blendops`.
3. Otherwise, identify whether the entry need is brief/planning setup, runtime readiness, evidence verification, install/package docs, or release review.
4. Route to the single smallest safe skill or doc.
5. Preserve release, runtime, and artifact truth (downgrade-only, never upgrade).

## When to use

Use this skill when:

- the user asks “what should I do next?” and the goal or current state is unclear
- the user is unsure how to enter the BlendOps skill catalog or documentation
- runtime, artifact, packaging, or release status is unknown and needs initial triage
- no workflow artifacts exist yet and the user needs a safe starting skill or doc
- an agent needs a concise entry-point recommendation before starting work

## When not to use

## Trigger phrases

## Prerequisites / readiness

- Know whether the user wants initial planning/briefing, runtime readiness, artifact evidence, install/package work, or release readiness.
- If status is unknown, ask for current goal and known evidence first.
- If the goal is clear and artifacts exist, defer directly to `using-blendops`.
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

Before runtime work, point to `../../docs/runtime-stack-strategy.md`, `setting-up-blender-runtime`, and `setting-up-blender-runtime`.

BlendOps runtime guidance uses **2 MCP execution paths plus a CLI fallback appendix**:

1. **Path 1 — Official Blender Lab MCP** in Blender 5.1+ (add-on manifest literal `blender_version_min = "5.1.0"`), hosted from either (a) Anthropic Connector in Claude Desktop or (b) any manually configured MCP client. The Connector is **not** standalone: Anthropic tutorial step 2 installs the Lab add-on inside Blender, and although the tutorial prerequisite says "Blender 4.2 or later", the binding floor is Blender 5.1+.
2. **Path 2 — Community `mcp-for-blender` (renamed from `ahujasid/blender-mcp`)**, third-party, Blender 3.0+, started via `uvx mcp-for-blender`. Use only with caveats and **never** accepted as release evidence.
3. **CLI fallback (appendix only)** — `blender --background --python` (documented flags: `--background`, `--python`, `-E/--engine`; run `blender -E help` for exact engine tokens). Appendix only, **never** a peer path without an eval record.

Single-bridge constraint: One MCP bridge is allowed per Blender instance (default port 9876; side-by-side on separate instances via per-instance `--port 9877` is supported upstream). If bridge conflicts occur, route to `setting-up-blender-runtime`.

This skill does not run Blender, mutate scenes, render, export, install runtimes, or claim artifacts.

## Operating procedure

1. Check whether the goal is already clear and artifacts exist:
   - if yes, route immediately to `using-blendops`
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
  → using-blendops (exits to verifying-before-handoff on any failed gate)
Need to turn a rough idea into a 3D brief?
  → scoping-3d-briefs
Need an initial scene plan (no artifacts yet)?
  → planning-product-scenes (or planning-scenes / planning-scenes / planning-scenes / planning-product-scenes)
Need runtime path choice, setup, or preflight?
  → setting-up-blender-runtime / setting-up-blender-runtime / setting-up-blender-runtime
Need artifact proof?
  → verifying-before-handoff
Need install/package docs?
  → docs/ai-agent-install-flow.md + docs/distribution-strategy.md
Need release readiness docs?
  → docs/release-readiness.md
```

## Playbooks

### Playbook A: First-time user

- Recommend reading `docs/README.md`, `docs/skill-system.md`, and `docs/external-runtime-setup.md`, or starting with `scoping-3d-briefs`.
- Keep runtime status `Not Run` and artifact status `Not Produced`.
- Suggest planning mode unless runtime is explicitly available.

### Playbook B: Runtime request

- Route to `setting-up-blender-runtime`, `setting-up-blender-runtime`, or `setting-up-blender-runtime`.
- Require read-only inspection smoke test before mutation (`execute_blender_code`), render, or export.
- Do not treat readiness as runtime success; keep states downgrade-only.

### Playbook C: Artifact claim request

- Route to `verifying-before-handoff` (or `verifying-before-handoff` if a workflow gate failed).
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
- [ ] Handed off to `using-blendops` if goal is clear and artifacts exist.
- [ ] Recommended exactly one safest next action using a real catalog skill or doc.
- [ ] Runtime status is explicit (`Not Run | Attempted | Produced | Verified | Failed`).
- [ ] Artifact status is explicit (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`).
- [ ] Truth states follow downgrade-only rules (never upgraded).
- [ ] Runtime boundaries respected (Path 1 5.1+ non-standalone Connector, Path 2 `mcp-for-blender` caveats/never release evidence, CLI appendix-only).
- [ ] Handoff skill/doc is named.

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Recommendation is specific, safe, evidence-bound, defers to `using-blendops` when artifacts exist, and points to a valid skill/doc. |
| Warn | Recommendation is safe but depends on missing status or user confirmation before routing. |
| Fail | Recommendation duplicates `using-blendops` precedence, upgrades truth states, assigns `Attempted` to artifacts, treats Path 2 as release evidence or CLI as a peer path without an eval record, or claims standalone/sub-5.1 Path 1 support. |

## Failure handling

- If status is unknown, ask for goal/status instead of guessing.
- If the goal is clear and artifacts exist, stop entry triage and route to `using-blendops`.
- If the user asks to run Path 1 on Blender below 5.1 or via Anthropic Connector without the Lab add-on installed in Blender, explain that the binding floor is `blender_version_min = "5.1.0"` and the Connector is not standalone.
- If the user asks to use Path 2 (`mcp-for-blender`, renamed from `ahujasid/blender-mcp`) for release evidence or CLI (`blender --background --python`) as a peer path without an eval record, block the claim and state the upstream boundary.
- If the user asks for artifacts with no evidence, route to `verifying-before-handoff` and keep artifact status `Not Produced`.
- If the user asks for release/tag, route to release readiness docs and current blockers.

## Troubleshooting

| Problem | Safe response |
|---|---|
| User says “make it ready” | Ask which layer: skill install, runtime readiness, artifact evidence, or release readiness. |
| User says “runtime works” | Ask for eval evidence and route to readiness/evidence docs. |
| User says “package it” | Keep package/listing as future unless verified. |

## Best practices

- Keep recommendations short and pick one primary action.
- Defer to `using-blendops` as soon as the goal is clear and artifacts exist.
- Preserve conservative 1.0.0 status and downgrade-only truth states.
- Treat read-only MCP inspection access as scoped smoke evidence only, never artifact evidence.

## Good examples

- “Next safe action: run `setting-up-blender-runtime` for Path 1 (Official Blender Lab MCP 5.1+, host (a) Anthropic Connector in Claude Desktop with Lab add-on installed). Runtime status: Not Run. Artifact status: Not Produced.”
- “Next safe action: use `planning-product-scenes` to plan the scene; no runtime is needed yet. Runtime status: Not Run. Artifact status: Not Produced.”
- “Next safe action: hand off to `using-blendops` because your goal is clear and scene artifacts already exist.”

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

- Duplicating `using-blendops` stage precedence instead of handing off when the goal is clear and artifacts exist.
- Turning a help response into implementation or Python execution without confirmation.
- Claiming Anthropic Connector works standalone without the Lab add-on or on Blender below 5.1 (`blender_version_min = "5.1.0"`).
- Treating Path 2 (`mcp-for-blender`, renamed from `ahujasid/blender-mcp`) as release evidence or CLI fallback (`blender --background --python`) as a peer path without an eval record.
- Assigning `Attempted` to artifact status or upgrading runtime/artifact truth states without evidence.
- Treating install docs as runtime evidence or future packaging tasks as completed.

## Cross-skill handoff

## Non-goals

- Replace or duplicate `using-blendops` precedence logic once the goal is clear and artifacts exist.
- Install Blender or runtimes.
- Run Blender or execute Python.
- Create or mutate scene data.
- Render/export artifacts.
- Publish packages or marketplace listings.

## References

- `../../docs/skill-system.md`
- `../../docs/runtime-stack-strategy.md`
- `../../docs/evals/runtime-availability-checklist.md`
- `../../docs/release-readiness.md`
- `../../docs/distribution-strategy.md`
