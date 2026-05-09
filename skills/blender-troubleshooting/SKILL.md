---
name: blender-troubleshooting
description: Structured 4-phase root-cause analysis when Blender output looks wrong. Use when render, export, scene, or handoff doesn't match intent and you need disciplined debug, not guesses.
---

# blender-troubleshooting

## Purpose

Run a structured 4-phase root-cause analysis when a Blender output (render, export, GLB, preview, or final response) does not match the confirmed intent. Surface the actual cause before proposing any fix. Inspired by the `/systematic-debugging` skill in Anthropic Superpowers, adapted for Blender / non-Blender-user domain.

This skill **does not run Blender**. It guides the operator through a disciplined diagnostic procedure that preserves evidence and avoids speculative fixes.

## Quick start

- collect the symptom statement, expected outcome, and observed outcome
- run the 4 phases: reproduce → narrow → identify root cause → propose fix
- gate every conclusion on observable evidence
- hand off the fix proposal to the relevant planner / readiness / evidence skill

## When to use

- a render came out black, blown out, missing assets, or just "wrong"
- a GLB export is empty, mis-scaled, or fails validation
- the non-Blender-user response sounds wrong (jargon-heavy, contradicted by evidence)
- the runtime smoke test passed but the recipe failed
- intent was clear but result diverges in a specific, reproducible way

## When not to use

- the user has not yet stated a clear expected outcome (run `intent-to-3d-brief-writer` first)
- runtime has never been attempted (run `official-runtime-readiness-checker` first)
- the request is creative iteration ("can we make it more dramatic"), not debugging
- the user wants a one-shot fix without diagnostic discipline

## Trigger phrases

- "the render looks wrong"
- "the GLB doesn't open / looks empty / is wrong scale"
- "the output doesn't match what I asked for"
- "why did it produce X instead of Y?"
- "debug this Blender output"

## Prerequisites / readiness

- expected outcome is documented (from intent brief or planner)
- observed outcome has explicit evidence (file path, screenshot, error message, response text)
- ability to ask the operator for evidence; no Blender execution required from this skill

## Input schema

### Required inputs

- expected outcome (from prior brief or planner)
- observed outcome (file path, screenshot, log, or response text)
- runtime path used (Path 1 host a/b, Path 2, CLI fallback, or text-only)
- last successful step in the workflow (where did it stop matching intent?)

### Optional inputs

- prior runtime evidence record (`docs/evals/path-X-...md`)
- Blender version, MCP host product, add-on identity (helps narrow)
- prior fix attempts that did not work

### Assumptions to confirm

- expected outcome is real (not user re-imagining mid-debug)
- observed outcome is reproducible (not transient)
- the operator can pause and gather evidence before any new action

## Output schema

### Primary output

- root cause statement (one sentence)
- proposed fix with explicit pass criteria

### Secondary output

- 4-phase diagnostic record (reproduce / narrow / identify / propose)
- alternative root causes considered and rejected with evidence

### Evidence / caveat output

- list of evidence collected per phase
- explicit `cannot determine` if a phase blocked
- runtime status updated only by re-running readiness or evidence skill

## Required laws

- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md
- ../../laws/no-arbitrary-python-interface.md
- ../../laws/official-runtime-only.md

## Official runtime boundary

This skill does not install Blender, run Blender, mutate scenes, render, export, or claim artifacts. It guides diagnosis. Any actual re-run goes through the relevant runtime skill (`official-runtime-readiness-checker`, `render-export-evidence`).

## Operating procedure

### Phase 1 — Reproduce

1. Confirm the symptom is reproducible. Ask: "if you re-run the same prompt with the same Blender file, does the same wrong output appear?"
2. If yes: lock the inputs (prompt, scene file, Blender version, MCP host, add-on commit).
3. If no (transient): record as "intermittent — needs ≥2 reproductions before continuing".

### Phase 2 — Narrow

1. Identify the smallest input set that still reproduces the symptom.
2. Strip away non-essential parts of the prompt or scene.
3. Record what was removed and whether the symptom persisted.

### Phase 3 — Identify root cause

1. Compare expected vs. observed at each workflow stage (intent → brief → plan → execution → output → response).
2. Find the first stage where they diverge. That stage is the root-cause boundary.
3. Within that stage, list 2-3 candidate root causes ranked by evidence weight.
4. Pick the highest-evidence candidate. Mark others as "considered, rejected because <reason>".

### Phase 4 — Propose fix

1. Write a one-sentence proposed fix targeting the identified root cause.
2. Define explicit pass criteria for the fix (what would prove it worked).
3. Hand off the proposed fix to the relevant skill: planner, readiness checker, evidence skill, or response writer.

## Decision tree

- symptom not reproducible → mark intermittent, do not propose fix
- divergence at intent / brief stage → fix is upstream, route to brainstorming or brief writer
- divergence at plan stage → fix is in scene/composition/lighting/material planner
- divergence at execution stage → fix is in runtime readiness or path setup
- divergence at output stage → fix is in render-export-evidence or GLB handoff
- divergence at response stage → fix is in non-blender-user-response-writer

## Playbooks

- Playbook A: "Render is black / blown out" — narrow to lighting plan or render settings
- Playbook B: "GLB is empty / mis-scaled" — narrow to export plan or GLB handoff
- Playbook C: "Final response uses jargon" — narrow to response writer
- Playbook D: "Recipe blocked despite smoke pass" — narrow to runtime path conflict (route to `runtime-bridge-conflict-resolver`)

## Mode handling

### Text-only mode

- diagnostic conversation only, no runtime calls
- runtime status: unchanged from input
- artifact status: unchanged from input

### Runtime-ready mode

- diagnostic plus optional re-run via the relevant runtime skill
- this skill itself never re-runs; it hands off

### Blocked runtime mode

- diagnose what's possible from existing evidence
- mark phases blocked when evidence is missing

## Validation checklist

- [ ] expected outcome documented
- [ ] observed outcome documented with evidence
- [ ] all 4 phases completed or explicitly marked blocked
- [ ] root cause statement is one sentence
- [ ] alternative causes considered and rejected with reasons
- [ ] proposed fix has explicit pass criteria
- [ ] handoff target named
- [ ] no Blender execution claimed by this skill
- [ ] no jargon in the user-facing summary

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Reproduce phase | Symptom locked or marked intermittent | Reproducibility unclear, still proposed fix | Skipped reproduction |
| Narrow phase | Minimum reproducing input found | Partial narrowing | No narrowing attempted |
| Root cause | One-sentence cause + 1-2 rejected alternatives | Cause stated without rejected alternatives | Multiple causes claimed simultaneously |
| Fix proposal | Targeted, with pass criteria + handoff | Targeted, no pass criteria | Speculative, no handoff |

## Failure handling

- evidence missing: mark phase blocked, do not invent
- two equally plausible causes: rank by evidence weight, mark second as "alternative pending more evidence"
- operator wants to skip phases: explicitly note skipped phases in the diagnostic record

## Troubleshooting

- if Phase 1 keeps failing (symptom not reproducible), suggest a fresh runtime smoke test first
- if Phase 3 finds the divergence is at intent / brief, route upstream and stop
- if all 4 phases blocked by missing evidence, hand off to readiness checker before continuing

## Best practices

- evidence-first; do not propose fixes without observable evidence
- one root cause statement, not a list
- always name the handoff skill

## Good examples

- "Render came out black. Phase 1: reproducible (3/3). Phase 2: narrowed to 'no key light in lighting plan'. Phase 3: root cause = lighting plan missing required key light placement. Phase 4: fix = update lighting plan via `blender-lighting-material-planner`. Pass criteria: re-render shows visible key-light contribution."

## Bad examples

- "Render is black, probably needs more lights and maybe HDRI and also check the camera." (multiple speculative causes, no narrowing, no pass criteria)

## User-facing response template

- What you expected
- What we observed (evidence)
- What I tried to reproduce (Phase 1)
- What I narrowed to (Phase 2)
- Most likely cause (Phase 3)
- Proposed fix (Phase 4) — with pass criteria
- Next skill to run

## Anti-patterns

- listing many possible causes without ranking by evidence
- proposing fixes before completing Phase 3
- claiming runtime success or failure from this skill (it diagnoses, it doesn't execute)
- using Blender jargon in the operator-facing summary

## Cross-skill handoff

- If divergence at intent → `blender-brainstorming` or `intent-to-3d-brief-writer`
- If divergence at planning → relevant planner skill
- If divergence at execution → `official-runtime-readiness-checker` or `runtime-bridge-conflict-resolver`
- If divergence at output → `render-export-evidence` or `glb-web-handoff`
- If divergence at response → `non-blender-user-response-writer`

## Non-goals

- running Blender
- writing fix code
- guessing without evidence
- replacing the runtime evidence skill

## References

- Inspired by Anthropic Superpowers `/systematic-debugging` skill (https://github.com/anthropics/skills)
- BlendOps law: ../../laws/evidence-before-done.md
- BlendOps law: ../../laws/non-blender-user-language.md
- Skill system: ../../docs/skill-system.md
