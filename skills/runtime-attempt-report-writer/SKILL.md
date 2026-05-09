---
name: runtime-attempt-report-writer
description: Produce an evidence-bound runtime attempt report with truth labels and next steps; does not certify upstream stack success.
---

# runtime-attempt-report-writer

## Purpose

Standardize how operators record what happened during a Path 1, Path 2, or CLI appendix attempt so claims stay aligned with BlendOps evidence rules.

## Quick start

- gather timestamps, commands/config surfaces touched (no secrets)
- choose blocks from `references/truth-label-blocks.md`
- fill `references/attempt-record-template.md`
- route improvements via `references/triage-next-steps.md`

## When to use

- after any Blender connect attempt (success or failure)
- preparing notes for `docs/evals/` style provenance
- teaching non-technical stakeholders what actually occurred

## When not to use

- replacing `render-export-evidence` visual artifact ledger (different scope)
- troubleshooting systematic defects (`blender-troubleshooting`)

## Trigger phrases

- "write up what we tried"
- "runtime attempt log"
- "postmortem blender connect"
- "evidence report template"

## Prerequisites / readiness

- honest list of actions attempted (even partial)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Path attempted | Frames disclaimers |
| Symptom outcome | Selects labels |

### Optional inputs

| Input | Use |
|---|---|
| Logs / screenshots references | Strengthen Produced states |
| Versions | Blender + add-on + host |

## Output schema

### Primary output

- structured Markdown report sections A–F

### Evidence / caveat output

Embedded template includes explicit Runtime + Artifact states.

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Documentation skill — does not execute Blender. Must preserve Path 1 / Path 2 / CLI appendix distinctions; Path 2 references remain community third-party; CLI appendix references remain **first-class** upstream with **no in-repo evidence file yet** unless this report becomes one.

## Operating procedure

1. Identify path + host.
2. Record actions chronologically.
3. Assign truth labels without upgrading unjustified.
4. Emit next steps (retry, doc link, skill route).

## Mode handling

### Text-only mode

Hypothetical scenario exercises labels.

### Runtime-ready mode

Expect partial logs — still no automatic Verified.

### Blocked runtime mode

Document blockers explicitly.

## Validation checklist

- [ ] Labels match definitions in evidence-before-done law
- [ ] No upstream vendor blame language — factual only
- [ ] Secrets redacted

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Complete template + honest labels |
| Warn | Missing version stamps |
| Fail | Declares Verified without artifacts |

## Cross-skill handoff

- Readiness before attempt → `../official-runtime-readiness-checker/SKILL.md`
- Bridge errors → `../runtime-bridge-conflict-resolver/SKILL.md`
- Path pick context → `../runtime-path-picker/SKILL.md`

## References

- `references/truth-label-blocks.md`
- `references/attempt-record-template.md`
- `references/triage-next-steps.md`
- `../../laws/evidence-before-done.md`
