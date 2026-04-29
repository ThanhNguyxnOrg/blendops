# BlendOps Law/Skill Format (Proposed, Not Final)

Status: **Proposed draft**
Date: 2026-04-29

> This format is a proposal for v0 design. It is not yet final policy.

---

## Law / Skill name

- Canonical identifier (kebab-case preferred)
- Human-readable title

Example:
- `glb-web-handoff`
- “GLB Web Handoff”

---

## Purpose

- One concise statement of intended outcome.
- Must focus on user-visible value, not internal implementation detail.

---

## When to use

- Trigger conditions in plain language.
- Include example intent phrases.
- Include explicit non-trigger conditions.

---

## Inputs

Required inputs:
- list of mandatory inputs
- accepted formats
- minimum quality/availability assumptions

Optional inputs:
- helpful but non-blocking context

---

## Outputs

- expected artifact list
- expected report/summary format
- success criteria for each output artifact

Example output classes:
- plan
- checklist report
- export/handoff package
- caveat report

---

## External runtime assumptions

- explicit runtime dependencies (e.g., Blender CLI, external MCP)
- version assumptions (if known)
- what BlendOps does **not** control

This section is mandatory to prevent runtime-scope confusion.

---

## Workflow steps

- numbered sequence
- each step has:
  - objective
  - action
  - evidence/checkpoint

Guideline:
- steps should be concise and auditable
- avoid giant monolithic paragraphs

---

## Safety rules

Two required blocks:

### Must do
- explicit required safety behaviors

### Must not do
- explicit prohibited behaviors

Include blocking conditions that halt progression.

---

## Validation checklist

- pass/warn/fail items
- blocking vs non-blocking criteria
- minimum required evidence for “pass”

Rule:
- No “done” status without checklist outcome.

---

## Failure handling

- failure classes (input failure, runtime failure, quality failure)
- required user-facing failure message style
- fallback or next-best-action guidance

---

## User-facing response template

Standard response structure:
1. Goal summary
2. What was checked
3. What passed
4. Warnings/failures
5. Recommended next step

Tone requirements:
- plain language
- no hidden caveats
- no overclaiming

---

## Examples

- one happy-path example
- one edge/failure-path example

Examples must include expected evidence format.

---

## Non-goals

- what this law/skill explicitly does not attempt
- out-of-scope runtime ownership statements

---

## Verification

Required verification block at end:

- verification timestamp
- evidence summary
- unresolved risk summary
- final status:
  - Ready
  - Conditionally Ready
  - Not Ready

---

## Suggested frontmatter (proposed)

```yaml
name: <id>
type: law | skill | workflow | recipe
status: proposed | draft | active | deprecated
purpose: <one-line purpose>
when_to_use:
  - <trigger>
inputs:
  required:
    - <input>
  optional:
    - <input>
outputs:
  - <artifact>
runtime_assumptions:
  - <dependency>
safety_level: strict | moderate | advisory
verification_level: required | recommended
references:
  - <source-url>
```

---

## Review checklist for this format

- [ ] Runtime assumptions are explicit
- [ ] Safety rules are unambiguous
- [ ] Validation is testable
- [ ] Failure handling is user-readable
- [ ] Non-goals prevent scope creep
- [ ] References are source-linked

---

## Change control

Because this format is proposed (not final):
- revisions should be tracked in research/design docs first
- only after v0 pilot validation should it be promoted to active standard
