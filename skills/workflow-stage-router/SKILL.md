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
- single immediate next skill from the locked precedence order + why (or escalation to the precedence owner if a multi-skill clash lacks a locked order, or immediate exit to `pre-handoff-verification` on any failed gate / blocked mode)
- preconditions checklist for advancing

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed (defaults to Not Produced; downgrade-only, never upgrade)
Evidence used: <inventory references>
Limitations: <unknown state>
```

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Routing only — no Python and no Blender execution (`execute_blender_code` is never invoked here). If the next step requires runtime selection or configuration, route to `runtime-path-picker`, `official-runtime-setup-guide`, `official-runtime-readiness-checker`, `path-one-host-outline`, or `cli-appendix-job-outline` with these locked boundaries:

- **Path 1 (Official Blender Lab MCP):** Requires Blender 5.1+ (`blender_version_min = "5.1.0"`), hosted via Anthropic Connector in Claude Desktop or a manually configured MCP client. The Connector is not standalone and never replaces the Lab MCP add-on inside Blender (even though the Anthropic tutorial prerequisite text says "Blender 4.2 or later", the binding minimum is 5.1+).
- **Path 2 (Community `mcp-for-blender`):** Renamed from `ahujasid/blender-mcp`, third-party, Blender 3.0+. Use only with caveats and never as release evidence.
- **CLI fallback (`blender --background --python`):** Appendix only (`cli-appendix-job-outline`), never a peer path without an evaluation record.

## Operating procedure

1. Normalize the artifact inventory and runtime state against `references/milestone-model.md`. Default any missing or unverified artifact status to `Not Produced`; apply truth states as downgrade-only (never upgrade).
2. Enforce the locked precedence rules without re-deciding cross-skill precedence locally:
   - **Evidence beats assumption**
   - **Geometry lock before look-dev**
   - **Export waits for validation**
3. If any gate has failed or the workflow is in blocked mode, exit immediately to `pre-handoff-verification` — never route forward.
4. Walk `references/routing-decision-tree.md` to select the single immediate next skill. If multiple skills clash without a locked precedence order, stop and escalate to the precedence owner rather than picking a skill locally.
5. Emit `references/stage-handoff-template.md`.

## Mode handling

### Text-only mode

Do not upgrade unverified claims: evidence beats assumption. Keep unverified artifacts at `Not Produced` (downgrade-only, never upgrade) and flag all unverified claims before routing.

### Runtime-ready mode

Route to `official-runtime-readiness-checker` before any scene planning or mutation-dependent workflow stage when the inventory shows `Runtime status: Not Run` and the user wants runtime changes.

### Blocked runtime mode

Do not route forward to planning or execution skills. Exit immediately to `pre-handoff-verification` (or route strictly to `runtime-bridge-conflict-resolver` when the block is an active MCP bridge conflict on port 9876).

## Validation checklist

- [ ] Stage named
- [ ] Single immediate next skill selected from locked precedence (no local cross-skill precedence re-decision)
- [ ] Multi-skill clashes without locked order escalated to precedence owner
- [ ] Any failed gate or blocked mode exits to `pre-handoff-verification` (never forward)
- [ ] Preconditions listed (`evidence beats assumption; geometry lock before look-dev; export waits for validation`)
- [ ] Truth states preserved as downgrade-only with artifacts defaulting to `Not Produced`

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Single next skill selected from locked precedence order with clear preconditions and downgrade-only truth states |
| Warn | Multi-skill clash has no locked precedence order — escalated to precedence owner instead of guessing locally |
| Fail | Failed gate, blocked mode, or evidence contradiction encountered — mandatory immediate exit to `pre-handoff-verification` (never forward) |

## Cross-skill handoff

- Pack entry → `../pack-prerequisite-checker/SKILL.md`
- Runtime readiness check → `../official-runtime-readiness-checker/SKILL.md`
- Evidence updates → `../render-export-evidence/SKILL.md`
- Failed gate / blocked mode exit / final gate → `../pre-handoff-verification/SKILL.md`

## References

- `references/milestone-model.md`
- `references/routing-decision-tree.md`
- `references/stage-handoff-template.md`
- `../../docs/workflows/full-non-blender-user-workflow.md`
