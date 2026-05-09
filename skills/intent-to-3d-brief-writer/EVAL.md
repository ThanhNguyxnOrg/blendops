# EVAL — intent-to-3d-brief-writer

Status: Draft v0 text-only baseline  
Scope: produces 8-slot structured brief; no runtime; no artifacts.

## Text-only eval prompt

Use intent-to-3d-brief-writer to convert a confirmed intent into the 8-slot brief. Echo the brief to the user. Hand off to the relevant planner.

## Expected behavior

- fills all 8 slots (subject, mood, deliverables, constraints, evidence, acceptance, audience, owner)
- batches any missing-slot questions in one turn
- echoes the brief to the user for confirmation
- lists decisions explicitly deferred to planners
- runtime status remains `Not Run`; artifact status `Not Produced`
- hands off to the relevant planner after confirmation

## Eval cases

| Case | Input | Expected output | Required evidence |
|---|---|---|---|
| Fully specified intent | Confirmed intent paragraph covers all 8 slots | Brief written, echoed, handed off | 8-slot markdown, deferred-decisions list |
| Half-specified intent | 5 of 8 slots present | Batch 3 missing-slot questions; write brief; echo | 8-slot markdown with `Unknown` filled where needed, questions answered |
| 4+ slots missing | Intent is too vague | Route back to `blender-brainstorming` | explicit re-route message, no brief written yet |
| Conflicting deliverable + constraint | "GLB for web AND 50MB poly budget" | Flag conflict in slot 4; ask user to resolve | conflict flag, resolution prompt |
| Mixed audience | Audience: marketing team + tech artist | Two sections (technical + plain-language); user-facing always plain-language | both sections present |
| User edits brief | After echo, user changes mood | Update brief, re-echo, await second confirmation | versioned brief, second confirmation |
| Iteration loop request | User wants text-only plan first, runtime later | Brief deliverables = text-only plan; evidence expectations = `Not Run` | brief explicitly text-only |

## Expected evidence/status fields

| Field | Required content |
|---|---|
| Subject | Plain language; no Blender jargon |
| Mood / style | Tone, references, brand notes if any |
| Deliverables | Exhaustive list (image / GLB / preview / response / combinations) |
| Constraints | Performance, scope, time, brand |
| Evidence expectations | Truth labels acceptable + required evidence fields |
| Acceptance criteria | Observable, not subjective |
| Audience | Named (e.g. "marketing team — non-Blender") |
| Owner | Named (operator / agent / human) |
| Decisions deferred | Explicit list with target skill |
| Runtime status | `Not Run` |
| Artifact status | `Not Produced` |

## Pass / Warn / Fail criteria

- Pass: all 8 slots filled or marked `Unknown` explicitly, plain language, acceptance criteria observable, brief echoed and confirmed by user
- Warn: 1-2 slots `Unknown` without follow-up, OR partly subjective acceptance criteria, OR brief written but not echoed
- Fail: 3+ slots missing without acknowledgment, OR jargon-heavy, OR claimed runtime / artifact production, OR brief invented slots not confirmed

## Common failure modes

- writing the brief without echoing to user
- inventing mood / constraint values
- using Blender jargon ("subsurf scattering", "BSDF", "topology") in the brief
- letting planners re-negotiate after handoff
- skipping owner slot (breaks accountability later)

## Evidence expectations

- 8-slot markdown brief visible
- echo + confirm cycle visible
- deferred-decisions list explicit
- handoff target named with reason

## Sample passing response outline

- TL;DR: <one line>
- Brief (8 slots in markdown)
- Decisions deferred: <list with target skill>
- Confirm or edit prompt
- After confirmation, handoff: `product-hero-scene-planner`

## Sample failing response outline

- Brief written without echo
- Subject slot has jargon
- 4 slots missing, no acknowledgment
- Skipped owner slot
- Claimed "runtime ready" when status is Not Run
