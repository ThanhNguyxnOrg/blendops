---
name: official-runtime-readiness-checker
description: Check whether official runtime appears ready before any execution claim is made.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# official-runtime-readiness-checker

## Purpose
Assess runtime readiness and classify status as Ready / Blocked / Unknown.

## When to use
- before runtime eval/execution attempts
- before any preview/render/GLB claim

## When not to use
- as a substitute for real runtime evidence
- to claim successful runtime execution by itself

## Inputs
- local environment checks
- runtime config presence checks
- source confidence context

## Outputs
- readiness status (Ready / Blocked / Unknown)
- check table with evidence
- blockers and next steps

## Required laws
- ../../laws/official-runtime-only.md
- ../../laws/evidence-before-done.md
- ../../laws/no-arbitrary-python-interface.md
- ../../laws/non-blender-user-language.md

## Official runtime boundary
Check only official runtime paths and references.

## Workflow steps
1. Check Blender install/path availability.
2. Check official connector/MCP config availability.
3. Record confidence and evidence.
4. Produce readiness verdict and blockers.

## Validation checklist
- [ ] Blender check recorded
- [ ] connector/MCP check recorded
- [ ] evidence attached
- [ ] readiness verdict justified

## Failure handling
If checks cannot confirm readiness, set Blocked or Unknown and list explicit blockers.

## User-facing response template
- Runtime status
- Evidence seen
- What is missing
- Next setup step

## Non-goals
- runtime execution
- artifact generation claims

## References
- ../../laws/evidence-before-done.md
- ../../docs/external-runtime-setup.md
