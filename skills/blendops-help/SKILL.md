---
name: blendops-help
description: Help users and agents choose the next safe BlendOps action across skills, docs, runtime readiness, evals, packaging, and Draft v0 release boundaries.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# blendops-help

## Purpose

Help an agent or user decide what to do next in BlendOps without overclaiming runtime, artifacts, packaging, or release readiness.

Use this as the first stop when the goal is unclear, the current status is unknown, or multiple BlendOps skills/docs could apply.

## Quick start

1. Ask for the current goal and status if missing.
2. Identify whether the next step is planning, readiness, evidence, install/package, or release review.
3. Route to the smallest safe skill or doc.
4. Preserve Draft v0, runtime, and artifact truth in the recommendation.

## When to use

Use this skill when:

- the user asks “what should I do next?”
- the user is unsure which BlendOps skill/doc applies
- runtime, artifact, packaging, or release status is unclear
- a task spans multiple BlendOps layers and needs safe routing
- an agent needs a concise next-step recommendation before acting

## When not to use

Do not use this skill when:

- a narrower skill clearly applies and the next action is obvious
- the user explicitly asks for a scene plan; use the planner stack
- the user asks for render/export evidence; use `render-export-evidence`
- the user asks for runtime preflight; use `official-runtime-readiness-checker`
- the request would require claiming artifacts, runtime eval, package, or marketplace completion without evidence

## Trigger phrases

- “What should I do next?”
- “Which BlendOps skill should I use?”
- “Is this ready?”
- “Can I run the runtime eval?”
- “How do I package/install BlendOps?”
- “What is blocked?”

## Prerequisites / readiness

- Know whether the user wants planning, runtime readiness, artifact evidence, install/package work, or release readiness.
- If status is unknown, ask for current goal and known evidence first.
- Treat runtime eval as `Not Run` and preview/render/GLB as `Not Produced` unless evidence says otherwise.

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
Runtime status: Not Run | Attempted | Produced | Verified | Failed | Blocked / Not Run
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <links/paths or none>
Why this is safe: <reason>
```

## Required laws

- `../../laws/official-runtime-only.md`
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`

## Official runtime boundary

Before runtime work, point to `../../docs/runtime-stack-strategy.md` and the readiness checklist.

BlendOps public runtime guidance uses:

1. Stack 1 — Claude Desktop official connector stack.
2. Stack 2 — Official Blender CLI fallback.
3. Stack 3 — Optional unofficial third-party bridge stack.

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

This skill does not run Blender, mutate scenes, render, export, install runtimes, or claim artifacts.

## Operating procedure

1. Classify the user goal:
   - help/triage
   - planning
   - runtime readiness
   - render/export evidence
   - install/package/adaptor
   - release readiness
2. Identify known evidence:
   - docs only
   - dry-run evidence
   - read-only connector smoke evidence
   - full runtime evidence
   - artifact evidence
3. Pick the next safe skill/doc.
4. State the blocker if no safe active step exists.
5. Return a concise recommendation with runtime/artifact status.

## Decision tree

```txt
Goal unclear?
  → ask for current goal/status
Need runtime?
  → docs/runtime-stack-strategy.md + official-runtime-readiness-checker
Need plan?
  → product-hero-scene-planner + domain planners
Need artifact proof?
  → render-export-evidence
Need GLB/web handoff?
  → glb-web-handoff
Need install/package?
  → docs/agent-install.md + docs/distribution-strategy.md
Need release readiness?
  → docs/release-readiness.md + docs/release-readiness-rollup-v0.md
```

## Playbooks

### Playbook A: First-time user

- Recommend reading `docs/README.md`, `docs/skill-system.md`, and `docs/external-runtime-setup.md`.
- Keep runtime status `Not Run`.
- Suggest planning mode unless runtime is explicitly available.

### Playbook B: Runtime request

- Route to `official-runtime-readiness-checker`.
- Require read-only smoke test before mutation/render/export.
- Do not treat readiness as runtime success.

### Playbook C: Artifact claim request

- Route to `render-export-evidence`.
- Require command/tool, input/scene, output path, file existence, validation notes, and limitations.
- If missing, mark `Not Produced` or `Attempted`.

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
- [ ] Recommended exactly one safest next action.
- [ ] Runtime status is explicit.
- [ ] Artifact status is explicit.
- [ ] No unsupported runtime route is recommended.
- [ ] No artifact/package/release success is claimed without evidence.
- [ ] Handoff skill/doc is named.

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Recommendation is specific, safe, evidence-bound, and points to the right skill/doc. |
| Warn | Recommendation is useful but depends on missing status or user confirmation. |
| Fail | Recommendation claims unsupported runtime/artifact/package readiness or routes to an unsupported path. |

## Failure handling

- If status is unknown, ask for goal/status instead of guessing.
- If user asks for unsupported direct official MCP, route to future research/unverified note.
- If user asks for artifacts with no evidence, route to `render-export-evidence` and keep `Not Produced`.
- If user asks for release/tag, route to release readiness docs and current blockers.

## Troubleshooting

| Problem | Safe response |
|---|---|
| User says “make it ready” | Ask which layer: skill install, runtime readiness, artifact evidence, or release readiness. |
| User says “runtime works” | Ask for eval evidence and route to readiness/evidence docs. |
| User says “package it” | Keep package/listing as future unless verified. |

## Best practices

- Keep recommendations short.
- Prefer one next action over a long plan.
- Preserve conservative Draft v0 status.
- Treat read-only connector access as scoped evidence only.

## Good examples

- “Next safe action: run runtime readiness checklist for Stack 1. Runtime status: Not Run. Artifact status: Not Produced.”
- “Next safe action: use scene planner; no runtime is needed for this request.”

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

- Turning a help response into implementation without confirmation.
- Treating install docs as runtime evidence.
- Treating future packaging tasks as completed.
- Recommending unsupported direct official MCP as active route.

## Cross-skill handoff

- Runtime readiness → `../official-runtime-readiness-checker/SKILL.md`
- Scene planning → `../product-hero-scene-planner/SKILL.md`
- Render/export evidence → `../render-export-evidence/SKILL.md`
- GLB handoff → `../glb-web-handoff/SKILL.md`
- Final response → `../non-blender-user-response-writer/SKILL.md`

## Non-goals

- Install Blender.
- Run Blender.
- Create scene data.
- Render/export artifacts.
- Publish packages or marketplace listings.

## References

- `../../docs/skill-system.md`
- `../../docs/runtime-stack-strategy.md`
- `../../docs/evals/runtime-availability-checklist.md`
- `../../docs/release-readiness-rollup-v0.md`
- `../../docs/distribution-strategy.md`
