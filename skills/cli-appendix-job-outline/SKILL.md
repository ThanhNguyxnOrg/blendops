---
name: cli-appendix-job-outline
description: Plan headless blender --background export or render jobs when MCP chat control is a poor fit; cite upstream Blender CLI docs only.
---

# cli-appendix-job-outline

## Purpose

Structure **CLI fallback appendix** jobs (batch render, batch export, scripted scene setup) using Blender's documented command-line interface — without presenting arbitrary Python as the user-facing product surface.

## Quick start

- classify job type via `references/job-type-matrix.md`
- capture ordering cautions `references/flag-order-reminders.md`
- state limitations `references/stateless-limitations.md`
- point user to upstream CLI manual for exact flags

## When to use

- CI / render farm / repeatable exports
- MCP unavailable or disallowed by policy
- deterministic batch operations vs exploratory modeling

## When not to use

- interactive viewport iteration primary goal
- user expects Connector chat loop

## Trigger phrases

- "headless blender"
- "batch render CLI"
- "blender --background"
- "render farm outline"

## Prerequisites / readiness

- user accepts stateless job model
- Blender executable accessible to shell running job

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Job intent (batch render vs batch export vs scripted job) | Chooses matrix row (routeMCP vs CLI selection to `runtime-path-picker` first) |
| Output artifact expectations | Drives validation hooks (route format selection to `output-format-decision`) |

### Optional inputs

| Input | Use |
|---|---|
| GPU availability | Device flags category note |
| Mixture of Windows/Linux paths | Quote escaping caution |

## Output schema

### Primary output

- Phased job outline: startup, load, process, save
- Flag categories to look up in the upstream Blender manual (plain language only; no copy-paste Python dumps, no execution)
- Validation and logging hooks (stdout tail, expected output paths)

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed (default: Not Produced)
Rule: Downgrade-only, never upgrade. Outlining a job never executes Blender (Runtime remains Not Run; Artifact remains Not Produced).
Blockers: <separate line>
Evidence used: <none during outlining; route actual CLI logs/outputs to render-export-evidence>
Limitations: Stateless execution, no interactive viewport
```

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Planning outline only — BlendOps never executes Blender and never presents arbitrary Python as the product surface. This CLI workflow is an **appendix only**, never a peer path without an eval record, and BlendOps has **no in-repo CLI evidence file yet**. Point users to the upstream Blender manual for exact CLI flags.

## Operating procedure

1. Verify `runtime-path-picker` confirmed MCP is ill-fit; if interactive MCP is needed, hand off to `path-one-host-outline`.
2. Verify target formats are settled via `output-format-decision`.
3. Select the job-type matrix row and outline phases (`blender --background` startup, load, process, save), flag categories, and validation/logging hooks in plain language without Python dumps.
4. Direct the user to verify exact flags against the upstream Blender manual.
5. Keep truth states at `Not Run` (Runtime) and `Not Produced` (Artifact); hand off actual CLI execution logs and outputs to `render-export-evidence`.

## Mode handling

### Text-only mode

Provide the phased CLI job outline, flag categories, and stateless limitations. Runtime is `Not Run`; Artifact is `Not Produced`.

### Runtime-ready mode

Specify validation and logging hooks (where logs and output files should land), then hand off post-run verification to `render-export-evidence` and `runtime-attempt-report-writer`. Outlining never upgrades truth states.

### Blocked runtime mode

Outline the intended phased job structure and record blockers on a separate line with Runtime `Not Run` and Artifact `Not Produced`.

## Validation checklist

* [ ] Framed strictly as an appendix, never a peer path without an eval record
* [ ] Stateless, no-viewport limitations acknowledged
* [ ] Upstream Blender CLI manual cited for exact flags
* [ ] No copy-paste Python dumps and no implication that BlendOps executes Blender
* [ ] Truth states respect downgrade-only rule (default `Not Produced` for artifacts; outlining never runs anything)
* [ ] Role boundaries preserved with `runtime-path-picker`, `output-format-decision`, and `render-export-evidence`

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Coherent phased outline + flag categories + validation/logging hooks + accurate downgrade-only truth states |
| Warn | GPU or OS path environment uncertain — dual-branch caution noted |
| Fail | Includes copy-paste Python dumps, treats CLI as a peer path, blurs roles with path/format/evidence skills, or upgrades truth states without verified evidence |

## Cross-skill handoff

* Pick MCP vs CLI → `../runtime-path-picker/SKILL.md`
* Interactive MCP host outline → `../path-one-host-outline/SKILL.md`
* Export format choices → `../output-format-decision/SKILL.md`
* Actual CLI output evidence recording → `../render-export-evidence/SKILL.md`
* Runtime attempt reporting → `../runtime-attempt-report-writer/SKILL.md`

## References

- `references/job-type-matrix.md`
- `references/flag-order-reminders.md`
- `references/stateless-limitations.md`
- `../../docs/runtime-stack-strategy.md`
