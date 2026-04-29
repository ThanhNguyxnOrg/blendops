---
name: <skill-name>
description: <One sentence: what this skill does and the exact situations that should trigger it.>
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# <skill-name>

## Purpose

State the skill's narrow job in one or two sentences. Keep it composable; do not make this skill own unrelated planning, runtime, evidence, and handoff work at the same time.

## Quick start

1. Confirm the user's goal and current evidence state.
2. Select the correct runtime stack posture, if runtime is relevant.
3. Follow the workflow below.
4. Return the output contract with explicit evidence/caveat status.

## When to use

Use this skill when:

- <trigger condition 1>
- <trigger condition 2>
- <trigger condition 3>

## When not to use

Do not use this skill when:

- The request belongs to a narrower existing skill.
- The user asks for runtime execution but readiness has not been checked.
- The task would require claiming preview/render/GLB artifacts without evidence.
- The task would promote unofficial bridge setup as an official path.

## Trigger phrases

- “<example trigger>”
- “<example trigger>”
- “<example trigger>”

## Prerequisites / readiness

- Current BlendOps status is known: Draft v0 unless a newer release-readiness doc says otherwise.
- Runtime state is one of: `Not Run`, `Attempted`, `Produced`, `Verified`, `Failed`, or `Blocked / Not Run`.
- If runtime is needed, identify the intended stack before execution.
- If artifacts are discussed, evidence source and output paths must be available or marked missing.

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| User goal | Defines scope and prevents overwork. |
| Current runtime/artifact state | Prevents unsupported success claims. |
| Relevant target surface or workflow | Determines handoff and constraints. |

### Optional inputs

| Input | Use |
|---|---|
| Runtime stack | Needed only when runtime work is in scope. |
| Output target | Helps shape render/export/evidence requirements. |
| Existing evidence links | Lets the skill verify rather than speculate. |

### Assumptions to confirm

- Runtime install is separate from skill install.
- No Blender mutation/render/export occurs unless explicitly requested and readiness passes.
- Missing evidence means the output remains conservative.

## Output schema

### Primary output

- <main deliverable>

### Secondary output

- next recommended skill/doc
- blockers or caveats
- user-facing status line

### Evidence / caveat output

Always include:

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed | Blocked / Not Run
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

## Required laws

- `../../laws/official-runtime-only.md`
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`

## Official runtime boundary

BlendOps public runtime guidance uses exactly three stacks:

1. Stack 1 — Claude Desktop official connector stack.
2. Stack 2 — Official Blender CLI fallback.
3. Stack 3 — Optional unofficial third-party bridge stack.

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

This skill must not install Blender, run Blender, configure a runtime bridge, mutate a scene, render, export GLB, or claim artifacts unless the user explicitly requested that work and evidence exists.

## Runtime stack requirements

| Stack | Requirement before use |
|---|---|
| Stack 1 | Read-only connector smoke test before mutation/render/export. |
| Stack 2 | Exact Blender executable/CLI command, input/script, output paths, logs, and validation evidence. |
| Stack 3 | Explicit user opt-in, third-party caveats, host/port risk, and no release-eval claim. |

## Operating procedure

1. Identify user goal and current phase.
2. Check whether this skill is the narrowest applicable skill.
3. Confirm required inputs and assumptions.
4. Apply relevant laws.
5. Execute the workflow steps for this skill.
6. Produce the output contract.
7. Hand off to the next skill or doc when needed.

## Decision tree

```txt
Need help choosing next step?
  → blendops-help
Need runtime readiness?
  → official-runtime-readiness-checker
Need scene plan?
  → product-hero-scene-planner and domain planners
Need render/export proof?
  → render-export-evidence
Need GLB/web handoff wording?
  → glb-web-handoff
Need final non-Blender-user summary?
  → non-blender-user-response-writer
```

## Playbooks

### Playbook A: Text-only mode

- Keep runtime status `Not Run`.
- Produce planning/checklist output only.
- State that preview/render/GLB artifacts are `Not Produced` unless evidence exists.

### Playbook B: Runtime-ready mode

- Verify runtime stack and preflight evidence.
- Record exact actions, tools, inputs, output paths, and limitations.
- Do not upgrade status beyond the evidence.

### Playbook C: Blocked mode

- Identify blocker.
- Keep runtime/artifact status conservative.
- Recommend the next safe readiness or planning step.

## Mode handling

### Text-only mode

Use when Blender is not available or not requested. Do not imply runtime execution.

### Runtime-ready mode

Use only when the user explicitly requests runtime work and readiness is documented.

### Blocked runtime mode

Use when requirements are missing. Report blockers and next safe action.

## Validation checklist

- [ ] Skill scope fits the user request.
- [ ] Required laws were applied.
- [ ] Runtime stack status is explicit.
- [ ] Artifact evidence status is explicit.
- [ ] No unsupported runtime route is presented as supported.
- [ ] No preview/render/GLB claim appears without evidence.
- [ ] Handoff names the next skill/doc.

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Output satisfies scope, evidence state is explicit, and no overclaim appears. |
| Warn | Output is useful but has missing inputs, partial evidence, or scoped uncertainty. |
| Fail | Output claims unsupported runtime/artifact success, ignores laws, or routes to an unsupported path. |

## Failure handling

- If evidence is missing, downgrade status instead of guessing.
- If runtime readiness is unknown, hand off to readiness skill.
- If a user asks for unsupported direct official MCP usage, mark it future research/unverified.
- If an unofficial bridge appears, keep it optional/local and outside release evidence.

## Troubleshooting

| Problem | Response |
|---|---|
| User wants “done” without evidence | Explain missing evidence and use `Not Run` / `Not Produced`. |
| User conflates skill install with runtime install | Separate skill install, runtime setup, and eval evidence. |
| User asks for marketplace/package claim | Keep as future until verified. |

## Best practices

- Prefer operational checklists over essays.
- Keep examples short and evidence-bound.
- Link docs instead of copying large reference content.
- Use precise status words.
- Hand off instead of expanding scope.

## Good examples

- “Runtime status: Not Run. Artifact status: Not Produced. Next safe action: run runtime readiness checklist for Stack 1.”
- “Produced evidence exists at `<path>`, but validation is incomplete; status remains Produced, not Verified.”

## Bad examples

- “Everything is ready” without evidence.
- “GLB produced” without file path and validation notes.
- “Use official direct MCP from Claude Code” as a supported route.

## User-facing response template

```txt
Status: <Pass/Warn/Fail or scoped status>
Runtime: <state>
Artifacts: <state>
Evidence: <paths/links/logs or none>
Next safe action: <skill/doc/action>
Limitations: <gaps>
```

## Anti-patterns

- Turning a planning skill into a runtime executor.
- Treating third-party bridge setup as official.
- Treating read-only connector access as full runtime eval.
- Treating install success as artifact success.

## Cross-skill handoff

- Runtime readiness → `../official-runtime-readiness-checker/SKILL.md`
- Scene planning → `../product-hero-scene-planner/SKILL.md`
- Render/export evidence → `../render-export-evidence/SKILL.md`
- GLB handoff → `../glb-web-handoff/SKILL.md`
- Final response → `../non-blender-user-response-writer/SKILL.md`

## Non-goals

- Install Blender.
- Run Blender.
- Configure connector/MCP/CLI runtime.
- Create scene data.
- Render or export GLB.
- Claim marketplace/package availability.

## References

- `../../docs/skill-system.md`
- `../../docs/runtime-stack-strategy.md`
- `../../docs/evals/runtime-availability-checklist.md`
- `../../docs/evals/official-runtime-verification-criteria.md`
- `../../docs/distribution-strategy.md`
