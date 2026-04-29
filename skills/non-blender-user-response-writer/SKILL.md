---
name: non-blender-user-response-writer
description: Convert technical Blender workflow findings into plain-language user-facing responses with honest caveats.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# non-blender-user-response-writer

## Purpose
Produce stakeholder-friendly outputs that preserve truthfulness, evidence boundaries, and clear next actions.

## When to use
- final response phase
- eval report summaries
- handoff communication for non-technical users

## When not to use
- to hide blockers
- to overclaim runtime or artifact success

## Trigger phrases
- "write final user summary"
- "explain this for non-Blender user"
- "make this stakeholder-friendly"

## Prerequisites / readiness
- technical findings available
- evidence state available
- blocker/caveat list available

## Inputs

### Required inputs
- current status and evidence state
- pass/warn/fail outcomes
- blockers/caveats

### Optional inputs
- audience context (client/internal/team)
- preferred response brevity

### Assumptions to confirm
- user has limited Blender knowledge
- caveats must remain visible

## Outputs

### Primary output
- plain-language final summary

### Secondary output
- prioritized next actions

### Evidence / caveat output
- explicit verified vs unverified split
- artifact status references

## Required laws
- ../../laws/non-blender-user-language.md
- ../../laws/evidence-before-done.md
- ../../laws/official-runtime-only.md
- ../../laws/no-arbitrary-python-interface.md

## Official runtime boundary
Never imply runtime success or artifact existence without evidence.

## Operating procedure
1. Identify audience and target clarity level.
2. Restate request in plain language.
3. Summarize current status with evidence-bound wording.
4. Separate what is verified from what is unverified.
5. Translate technical caveats into user impact.
6. Provide prioritized next actions.
7. Ensure no jargon overload.
8. Ensure no overclaiming phrases remain.

## Decision tree
- If evidence complete and status positive → clear readiness + caveats.
- If evidence partial/blocked → explicit uncertainty + next checks.
- If major failures exist → clear fail state + remediation path.

## Mode handling

### Text-only mode
- emphasize planning-only state
- artifacts usually Not Run/Not Produced

### Runtime-ready mode
- include evidence-linked artifact statuses

### Blocked runtime mode
- state blockers and setup next steps without blame language

## Validation checklist
- [ ] plain-language summary present
- [ ] verified/unverified split explicit
- [ ] pass/warn/fail meaning preserved
- [ ] artifact status language included
- [ ] caveats include user impact
- [ ] next actions prioritized
- [ ] no unsupported certainty language
- [ ] no dense jargon blocks
- [ ] runtime boundary respected
- [ ] response is concise and actionable

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Clarity | Non-technical reader understands outcome | Minor jargon remains | Jargon-heavy/confusing |
| Truthfulness | Claims align with evidence | Partial ambiguity | Overclaiming present |
| Actionability | Next steps clear and prioritized | Generic next steps | No clear next steps |
| Caveat quality | Caveats preserved with impact | Caveats vague | Caveats missing |

## Failure handling
- Missing evidence context: request/insert evidence state first.
- Contradictory status language: downgrade to safer wording.
- Excessive jargon: rewrite with plain-language equivalents.

## Troubleshooting
- If output sounds certain but evidence is partial, rewrite with conditional phrasing.
- If audience mismatch, simplify and add short definitions.
- If too long, keep key sections and move details to caveats block.

## Best practices
- lead with what user asked + current status
- always include what remains unverified
- end with one concrete next action

## Good example
“Your planning output is complete, but runtime artifacts were not produced in this pass. Next step: run the official runtime eval and collect export evidence.”

## Bad example
“Everything is done and production-ready.” (without evidence)

## User-facing response template
1. What you asked for
2. What is ready now
3. What is not fully verified yet
4. What to do next

## Cross-skill handoff
- If runtime not ready: `official-runtime-readiness-checker`
- If handoff unclear: `glb-web-handoff`

## Non-goals
- raw log dump as final output
- hiding caveats for readability

## References
- https://www.blender.org/lab/mcp-server/
- https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
