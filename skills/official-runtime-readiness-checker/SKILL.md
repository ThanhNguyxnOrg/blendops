---
name: official-runtime-readiness-checker
description: Evaluate whether official runtime appears ready using evidence-bound checks and explicit readiness states.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# official-runtime-readiness-checker

## Purpose
Assess runtime readiness before any attempt to claim runtime execution outcomes.

## Quick start
- confirm this skill fits your goal
- provide required inputs first
- keep runtime claims evidence-bound
- follow suggested next-skill handoff

## When to use
- before runtime manual eval
- before any preview/render/GLB readiness claim

## When not to use
- as proof that runtime execution succeeded
- as substitute for actual runtime artifacts

## Trigger phrases
- “check runtime readiness”
- “is runtime available”
- “can we run this now”
- “verify connector and MCP availability”

## Prerequisites / readiness
- non-destructive local environment access
- ability to read config/path signals
- clear distinction between readiness and execution

## Input schema

### Required inputs
- expected runtime path(s)
- target harness context

### Optional inputs
- known executable paths
- known config file locations
- prior blocker records

### Assumptions to confirm
- no Blender run required for readiness-only pass
- no non-official runtime path should be used

## Output schema

### Primary output
- readiness matrix + final status

### Secondary output
- blocker list + retry steps

### Evidence / caveat output
- per-check evidence lines
- confidence label per check: verified / linked-only / unknown / blocked

## Required laws
- ../../laws/official-runtime-only.md
- ../../laws/evidence-before-done.md
- ../../laws/no-arbitrary-python-interface.md
- ../../laws/non-blender-user-language.md

## Official runtime boundary
- This skill can check local readiness signals.
- This skill must not claim runtime artifact production.
- This skill must not claim execution success without execution evidence.

## Operating procedure
1. Confirm official runtime scope and user intent.
2. Check Blender executable availability (command/path evidence).
3. Check official connector config presence indicators.
4. Check official MCP config presence indicators.
5. Check artifact/output location readiness for future run.
6. Assign confidence label to each check.
7. Populate readiness matrix table.
8. Derive final status (Ready / Partially Ready / Blocked / Unknown).
9. Produce blocker summary and next actions.
10. Route to planner or setup skill based on status.

## Decision tree
- Blender missing + no connector/MCP evidence → Blocked.
- Blender found but connector/MCP uncertain → Partially Ready or Unknown.
- Blender found + connector/MCP signals sufficient → Ready candidate (still no artifact claim).

## Playbooks
- Playbook A: text-only planning path
- Playbook B: runtime-ready path with evidence gating
- Playbook C: blocked runtime path with caveat-first reporting

## Mode handling

### Text-only mode
- readiness checks only
- no runtime execution claims

### Runtime-ready mode
- status Ready/Partially Ready with explicit caveats
- handoff to planning/execution workflows

### Blocked runtime mode
- status Blocked
- explicit blockers + setup next steps

## Validation checklist
- [ ] Blender check recorded
- [ ] connector check recorded
- [ ] MCP check recorded
- [ ] artifact path readiness recorded
- [ ] confidence labels assigned
- [ ] final status assigned
- [ ] blocker list included
- [ ] no execution success claim
- [ ] no non-official path reference
- [ ] next actions clear

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Blender availability | Verified with local evidence | Partial path evidence | Missing/not found |
| Connector/MCP checks | Clear signal per path | Unknown signal with caveat | Claimed available without evidence |
| Confidence labeling | Every check labeled | Partial labels | No labels |
| Status logic | Matches matrix evidence | Minor ambiguity | Contradicts evidence |

## Failure handling
- Unknown state: mark Unknown, not Ready.
- Missing config path: mark Blocked and provide exact next check.
- Conflicting signals: choose safer status with caveat.

## Troubleshooting
- Blender not on PATH: check absolute path.
- Config file exists but missing runtime entries: mark unknown/blocked.
- Existing artifacts found: treat as pre-existing unless run-specific evidence ties them to current eval.

## Best practices
- keep checks reproducible and non-destructive
- include exact evidence lines in report
- separate readiness from artifact claims

## Good examples
“Status: Blocked. Blender binary exists, but official connector/MCP runtime path is not confirmed in this environment.”

## Bad examples
“Looks good; runtime should work.” (no matrix, no evidence)

## User-facing response template
- Current runtime status
- Evidence observed
- Missing readiness signals
- Next setup action

## Anti-patterns
- skipping required laws or runtime boundary statements
- claiming runtime/artifact success without evidence
- using non-official runtime setup paths
- producing jargon-heavy final output without explanation

## Cross-skill handoff
- If Ready/Partially Ready: `product-hero-scene-planner`
- If Blocked/Unknown: `official-runtime-setup-guide`

## Non-goals
- runtime execution
- artifact generation claims
- unofficial runtime fallback

## References
- https://www.blender.org/lab/mcp-server/
- https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
