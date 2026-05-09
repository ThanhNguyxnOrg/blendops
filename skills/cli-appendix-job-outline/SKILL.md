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
- "--background --python"
- "render farm outline"

## Prerequisites / readiness

- user accepts stateless job model
- Blender executable accessible to shell running job

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Job intent (render vs export vs scripted pipeline) | Chooses matrix row |
| Output artifact expectations | Drives validation hooks |

### Optional inputs

| Input | Use |
|---|---|
| GPU availability | Device flags note |
| Mixture of Windows/Linux paths | Quote escaping caution |

## Output schema

### Primary output

- job outline: phases (startup, load, process, save)
- flag categories to research upstream (not copy-paste dumps unless user explicitly maintains scripts)
- validation / logging expectations

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed | Blocked / Not Run
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <CLI logs when available>
Limitations: no viewport Grab; script args via `--` separator per upstream docs
```

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Planning outline — BlendOps does not execute Blender. CLI fallback appendix is documented upstream as a **first-class** Blender CLI surface; BlendOps has **no in-repo evidence file yet**. Stay truthful: MCP paths remain Path 1 / Path 2 when interactivity matters.

## Operating procedure

1. Confirm MCP ill-fit reason documented.
2. Pick matrix row.
3. List phases + evidence hooks (stdout tail, written output paths).
4. Tell user to verify flags against current Blender manual.

## Mode handling

### Text-only mode

Abstract outline only.

### Runtime-ready mode

Allow attaching sample log locations — still no success claim without artifacts.

### Blocked runtime mode

Describe intended future job pack.

## Validation checklist

- [ ] Stateless limits acknowledged
- [ ] Upstream CLI manual cited generically (URL in docs/runtime-stack-strategy.md chain)
- [ ] No "BlendOps runs Blender" implication

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Coherent phased outline + evidence hooks |
| Warn | GPU device uncertain — dual-branch note |
| Fail | Presents giant opaque Python as deliverable |

## Cross-skill handoff

- Pick MCP vs CLI → `../runtime-path-picker/SKILL.md`
- Export format choices → `../output-format-decision/SKILL.md`
- Evidence recording → `../render-export-evidence/SKILL.md`

## References

- `references/job-type-matrix.md`
- `references/flag-order-reminders.md`
- `references/stateless-limitations.md`
- `../../docs/runtime-stack-strategy.md`
