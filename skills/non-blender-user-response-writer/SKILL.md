---
name: non-blender-user-response-writer
description: Convert technical findings into plain-language user responses with honest caveats.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# non-blender-user-response-writer

## Purpose
Deliver clear non-jargon final responses aligned to evidence state.

## When to use
- final response phase
- eval summaries
- handoff communication

## When not to use
- to hide blockers
- to overclaim runtime/artifact success

## Inputs
- technical findings
- evidence state
- blockers/caveats

## Outputs
- plain-language summary
- readiness statement
- prioritized next actions

## Required laws
- ../../laws/non-blender-user-language.md
- ../../laws/evidence-before-done.md
- ../../laws/official-runtime-only.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
Do not imply runtime execution success unless evidence exists.

## Workflow steps
1. Translate technical state to user-facing language.
2. Preserve pass/warn/fail semantics.
3. State unverified items clearly.
4. Provide clear next actions.

## Validation checklist
- [ ] plain-language output
- [ ] no jargon overload
- [ ] evidence-aligned status
- [ ] clear caveats and next steps

## Failure handling
If confidence is low or evidence missing, state that explicitly and avoid overclaims.

## User-facing response template
1. What you asked for
2. What is ready now
3. What is not fully verified yet
4. What to do next

## Non-goals
- raw runtime logs as final message
- unsupported certainty

## References
- ../../examples/cyberpunk-shoe-output-template.md
