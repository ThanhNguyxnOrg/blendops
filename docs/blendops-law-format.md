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

## Canonical file placement

- Laws → `docs/laws/`
- Skills → `docs/skills/`
- Workflows → `docs/workflows/`
- Recipes → `docs/recipes/`
- Packs → `docs/packs/`

Each artifact should be linked from its directory `README.md` index.

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

- explicit runtime dependencies (official sources only in active strategy)
- version assumptions (if known)
- what BlendOps does **not** control

This section is mandatory to prevent runtime-scope confusion.

## Official runtime references

Each law/skill must list official runtime references used by that artifact:

- Official Blender MCP Server: https://www.blender.org/lab/mcp-server/
- Official Claude Blender Connector tutorial: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- Official Blender CLI docs: https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

Rules:
- active docs should prefer official sources only
- if a source cannot be fully fetched, keep link + “follow upstream official docs for exact/current setup”
- do not invent setup details

## Source confidence label

Each law/skill should include a source-confidence declaration, e.g.:

- `verified-read` (source fetched/read directly)
- `linked-only` (source link confirmed but full content inaccessible)
- `mixed` (combination of verified-read and linked-only references)

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
- next-step recovery guidance

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

## Runtime verification evidence

Every law/skill output should include runtime-evidence fields:

- runtime path selected (official Blender MCP / Claude Connector / Blender CLI reference)
- which official source links were used
- verification outcome summary (pass / partial / fail)
- unresolved runtime-risk notes

If runtime evidence is incomplete, the response must explicitly say so.

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
official_runtime_references:
  - https://www.blender.org/lab/mcp-server/
  - https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
  - https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
runtime_verification_evidence:
  - <evidence-item>
source_confidence_label: verified-read | linked-only | mixed
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
