---
name: intent-to-3d-brief-writer
description: Convert a non-Blender-user's natural-language request into a structured 3D brief (subject, mood, deliverables, constraints, evidence expectations). Use as first step before any planner.
---

# intent-to-3d-brief-writer

## Purpose

Translate a confirmed user intent (from `blender-brainstorming` or a clear initial request) into a structured 3D brief that downstream planners and `acceptance-criteria-builder` can consume without re-asking. Inspired by the "Analysis phase" pattern in BMad-Method (PRD / project brief), adapted for 3D scene work and non-Blender users.

This skill produces **a brief, not a plan**. The brief has 8 fixed slots: subject, mood, deliverables, constraints, evidence expectations, acceptance criteria, audience, and owner. Planners consume the brief; they do not negotiate with it.

## Quick start

- read confirmed intent from prior step (`blender-brainstorming` or original request)
- fill the 8 brief slots (mark unconfirmed items as `Unknown`, never invent)
- echo the brief to the user for confirmation
- hand off to downstream planners (e.g., `product-hero-scene-planner`) and `acceptance-criteria-builder` once confirmed

## When to use

- right after `blender-brainstorming` confirms user intent
- when the user provides a structured request that just needs format normalization
- before any planner skill (`product-hero-scene-planner`, `blender-composition-camera-planner`, `blender-lighting-material-planner`)
- before `acceptance-criteria-builder` consumes brief rows to build criteria
- when multiple planners need to share the same source-of-truth brief

## When not to use

- intent is still ambiguous (run `blender-brainstorming` first)
- the user is mid-execution and asks for a re-brief (route to `blender-troubleshooting` instead)
- the user pushes for immediate execution (route to `official-runtime-readiness-checker`)
- the request is iteration on existing output ("make it darker") — that's a planner-level edit, not a new brief

## Trigger phrases

- "lock the brief"
- "write the brief from this conversation"
- "what's the formal scope?"
- "before planning, write the spec"

## Prerequisites / readiness

- confirmed intent from prior step
- no Blender runtime required
- works in text-only mode

## Input schema

### Required inputs

- confirmed intent paragraph (from brainstorming or user)
- target deliverable type (image / GLB / web hero / iteration loop / docs)
- audience (non-Blender-technical user / mixed / technical-OK)

### Optional inputs

- brand / mood / reference notes
- performance / time / scope constraints
- prior similar briefs to match style

### Assumptions to confirm

- the user accepts a structured brief format
- the brief slots are exhaustive (subject, mood, deliverables, constraints, evidence, acceptance, audience, owner)
- runtime status is `Not Run` and may stay so

## Output schema

### Primary output — the 8-slot brief

```md
# 3D Brief: <short title>

1. Subject. <what the scene is about>
2. Mood / style. <visual mood, tone, references>
3. Deliverables. <render image / GLB / preview / response>
4. Constraints. <performance, scope, time, brand>
5. Evidence expectations. <which truth labels acceptable; required evidence fields>
6. Acceptance criteria. <how we know the deliverable matches intent>
7. Audience. <who reads the final response>
8. Owner. <who runs and verifies>
```

### Secondary output

* list of decisions explicitly deferred to planners
* explicit unknowns flagged

### Evidence / caveat output

* runtime status: `Not Run` (downgrade-only, never upgrade)
* artifact status: `Not Produced` (downgrade-only, never upgrade)
* brief is a contract; planners should not silently expand scope

## Required laws

- ../../laws/non-blender-user-language.md
- ../../laws/evidence-before-done.md
- ../../laws/no-arbitrary-python-interface.md
- ../../laws/official-runtime-only.md

## Official runtime boundary

This skill does not install Blender, run Blender, configure MCP, or claim artifacts. Output is a structured text brief.

## Operating procedure

1. Read confirmed intent (from `blender-brainstorming` or original request).
2. Pull each of the 8 slots one at a time. If a slot is missing, ask one targeted question per missing slot in a single batch.
3. Write the brief in markdown using the 8-slot template.
4. List decisions deferred to planners (e.g. "lighting style left to `blender-lighting-material-planner` per mood").
5. Echo the brief to the user. Ask for confirm or edit.
6. After confirmation, hand off to the relevant planner (e.g., `product-hero-scene-planner`) and `acceptance-criteria-builder`.

## Decision tree

- intent is fully covered by 8 slots → write brief, no questions
- 1-3 slots missing → batch missing-slot questions, then write
- 4+ slots missing → route back to `blender-brainstorming` (intent isn't actually confirmed)
- audience is mixed (technical + non-technical) → write twice (one technical paragraph, one plain-language) — but final user-facing response always plain-language

## Playbooks

- Playbook A: "Product hero brief" — subject = product, mood = brand-aligned, deliverable = render + GLB, audience = marketing team
- Playbook B: "Web hero brief" — deliverable = GLB + preview image, constraint = poly budget for web
- Playbook C: "Iteration loop brief" — deliverable = text-only plan first, runtime later
- Playbook D: "Mixed audience brief" — write technical + plain-language sections

## Mode handling

### Text-only mode

- text only, no runtime calls
- runtime status: `Not Run` (downgrade-only, never upgrade)
- artifact status: `Not Produced` (downgrade-only, never upgrade)

### Runtime-ready mode

- still text-only for this skill (brief is always text)
- runtime status remains `Not Run`
- execution pushes route to `official-runtime-readiness-checker`

### Blocked runtime mode

- still produces brief
- adds explicit note that downstream planning may be blocked too
- runtime status remains `Not Run`

## Validation checklist

- [ ] all 8 slots filled or marked `Unknown` explicitly
- [ ] subject is non-jargon plain language
- [ ] deliverables list is exhaustive (no implicit "and other things")
- [ ] evidence expectations name truth labels
- [ ] acceptance criteria observable, not subjective
- [ ] audience is named explicitly
- [ ] owner is named (operator / agent / human)
- [ ] decisions deferred listed
- [ ] runtime status remains `Not Run`
- [ ] no Blender jargon in user-facing brief

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Slot coverage | All 8 filled or `Unknown` | 1-2 slots missing without note | 3+ slots missing |
| Plain language | No jargon | Minor jargon explained | Jargon-heavy |
| Acceptance criteria | Observable | Partly subjective | Fully subjective |
| Confirmation | User reviewed and confirmed | Echoed but not confirmed | Not echoed |

## Failure handling

- user changes intent mid-brief: pause, mark intent as not-confirmed, route back to `blender-brainstorming`
- conflicting deliverables (e.g. "GLB and 50MB poly budget"): flag conflict in slot 4, ask user to resolve
- user wants the brief to skip slots: explicit `Unknown` markers, never invent

## Troubleshooting

- if the brief feels too long, write a "TL;DR" line at top but keep all 8 slots
- if the user pushes for execution, route to `official-runtime-readiness-checker`; brief stays as locked contract
- if the user requests mid-execution re-briefing, route to `blender-troubleshooting`

## Best practices

- 8 slots, every time, every brief
- echo the brief to the user before handoff
- name the owner explicitly; ambiguity here breaks accountability

## Good examples

- "Brief: Cyberpunk Shoe Web Hero. Subject: floating cyberpunk sneaker. Mood: neon-lit, glossy dark floor, dramatic. Deliverables: preview image + GLB for web. Constraints: poly budget for mobile web; brand neon palette. Evidence: `Verified` requires render path + GLB path + validation notes. Acceptance: subject framing centered, neon visible, web GLB ≤ 10MB. Audience: marketing team (non-Blender). Owner: <user>. Deferred: exact lighting placement to `blender-lighting-material-planner`; exact camera angle to `blender-composition-camera-planner`."

## Bad examples

- "Brief: shoe render. Make it cool. Hand off to planner." (5 slots missing, jargon-leaning, no acceptance criteria, no owner)

## User-facing response template

- One-line TL;DR
- 8-slot structured brief in markdown
- Decisions deferred to planners
- Confirmation prompt: "echo back any edits or confirm to proceed"

## Anti-patterns

- writing a brief without echoing to user
- inventing slots that weren't confirmed (especially mood and constraints)
- letting planners re-negotiate the brief after handoff
- using Blender jargon

## Cross-skill handoff

- Preceding step: `blender-brainstorming` confirms user intent before brief writing.
- Consuming skills: hand off to relevant scene planners (`product-hero-scene-planner`, `blender-composition-camera-planner`, `blender-lighting-material-planner`) and `acceptance-criteria-builder` (which consumes brief rows).
- If execution is requested: route to `official-runtime-readiness-checker`.
- If mid-execution re-briefing occurs: route to `blender-troubleshooting`.
- If brief reveals intent ambiguity: route back to `blender-brainstorming`.

## Non-goals

- making the plan (planner's job)
- running Blender
- setting up runtime
- writing the final user response (`non-blender-user-response-writer`'s job)

## References

- Inspired by BMad-Method "Analysis phase" pattern (https://docs.bmad-method.org/reference/commands/)
- BlendOps law: ../../laws/non-blender-user-language.md
- BlendOps law: ../../laws/evidence-before-done.md
- Skill system: ../../docs/skill-system.md
