---
name: workflow-stage-router
description: Given current artifacts and intent, name the next BlendOps skill or workflow stage and preconditions to advance.
---

# workflow-stage-router

## Purpose

Reduce skill-choice paralysis by mapping **current state → next narrow skill** across BlendOps workflows while preserving evidence and runtime boundaries.

## Quick start

- capture what exists now (brief, plan, renders, GLB, evidence logs)
- compare against `references/milestone-model.md`
- emit route via `references/routing-decision-tree.md`
- fill `references/stage-handoff-template.md`

## When to use

- user asks "what skill next" after partial progress
- agent risks loading too many skills at once
- resume after interruption

## When not to use

- initial goal vague (use `blendops-help` / `blender-brainstorming`)
- runtime bridge errors (use `runtime-bridge-conflict-resolver`)
- final stakeholder wording (use `non-blender-user-response-writer`)

## Trigger phrases

- "where are we in the workflow"
- "what's next"
- "resume from here"
- "next skill"

## Prerequisites / readiness

- honest inventory of artifacts + truth labels
- user goal unchanged or explicitly revised

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Current artifact inventory | Determines stage |
| Active intent | Prevents wrong branch |

### Optional inputs

| Input | Use |
|---|---|
| Target pack/recipe | Narrows milestone track |

## Output schema

### Primary output

- current stage name
- next skill + why
- preconditions checklist for advancing

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed | Blocked / Not Run
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <inventory references>
Limitations: <unknown state>
```

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Routing only. If next step is runtime configuration, point to Path 1 / Path 2 / CLI appendix docs — never imply Connector replaces Lab MCP.

## Operating procedure

1. Normalize inventory against milestone model.
2. Walk decision tree.
3. If multiple equally valid skills, pick narrowest.
4. Emit handoff template.

## Mode handling

### Text-only mode

Assume stated inventory is truthful; flag unverified claims.

### Runtime-ready mode

Prefer readiness checker before mutation skills when inventory shows no runtime attempt yet user wants mutation.

### Blocked runtime mode

Route to planning/evidence skills only.

## Validation checklist

- [ ] Stage named
- [ ] Next skill singular primary recommendation
- [ ] Preconditions listed
- [ ] Evidence labels preserved

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Clear next skill + preconditions |
| Warn | Multiple branches — user must choose priority |
| Fail | Next skill contradicts evidence state |

## Cross-skill handoff

- Pack entry → `../pack-prerequisite-checker/SKILL.md`
- Evidence updates → `../render-export-evidence/SKILL.md`
- Final gate → `../pre-handoff-verification/SKILL.md`

## References

- `references/milestone-model.md`
- `references/routing-decision-tree.md`
- `references/stage-handoff-template.md`
- `../../docs/workflows/full-non-blender-user-workflow.md`
