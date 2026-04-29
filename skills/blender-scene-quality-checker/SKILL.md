---
name: blender-scene-quality-checker
description: Evaluate scene readiness with pass/warn/fail and evidence-bound verdicts.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# blender-scene-quality-checker

## Purpose
Assess readiness using explicit pass/warn/fail checks.

## When to use
- before readiness/export claims
- during text-only or runtime eval reporting

## When not to use
- to replace evidence collection
- to fabricate artifact claims

## Inputs
- scene plan
- available evidence
- quality criteria

## Outputs
- category rubric
- readiness verdict (Ready / Conditionally Ready / Not Ready / Not Run)
- blockers/caveats

## Required laws
- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md
- ../../laws/official-runtime-only.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
Quality checker may run in text-only mode; must not imply runtime execution occurred.

## Workflow steps
1. Confirm evidence state.
2. Score categories pass/warn/fail.
3. Compute readiness verdict.
4. Report blockers and next actions.

## Validation checklist
- [ ] rubric complete
- [ ] evidence state explicit
- [ ] verdict justified
- [ ] caveats and next actions included

## Failure handling
If evidence is missing, mark Not Run/Conditionally Ready and list required evidence.

## User-facing response template
- Current status
- What passed
- What is uncertain
- What to do next

## Non-goals
- runtime execution
- evidence-free readiness claims

## References
- ../../references/blender-quality-checklist.md
