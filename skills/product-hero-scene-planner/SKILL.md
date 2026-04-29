---
name: product-hero-scene-planner
description: Turn non-Blender-user creative intent into a structured product-hero scene plan.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# product-hero-scene-planner

## Purpose
Produce a clear, structured scene plan before runtime execution.

## When to use
- user asks for product hero scene planning
- workflow is in planning phase

## When not to use
- to claim runtime artifacts already exist
- to skip clarification when prompt is ambiguous

## Inputs
- user prompt
- output target
- style/performance constraints

## Outputs
- intent summary
- clarifying questions
- scene plan (subject/composition/camera/lighting/material/environment)
- validation plan

## Required laws
- ../../laws/official-runtime-only.md
- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
Planning only. Runtime execution remains external.

## Workflow steps
1. Normalize intent.
2. Ask minimal necessary clarifications.
3. Build structured hero-scene plan.
4. Define validation and caveat expectations.

## Validation checklist
- [ ] all planning sections present
- [ ] assumptions explicit
- [ ] no runtime overclaims

## Failure handling
If prompt is unclear, request clarification or proceed with explicit assumptions and lower confidence.

## User-facing response template
- What you asked for
- Proposed plan
- What remains unverified
- Next action

## Non-goals
- runtime commands
- artifact success claims without evidence

## References
- ../../workflows/product-hero-v0/PACK.md (if attached)
- ../../laws/evidence-before-done.md
