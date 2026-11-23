
# blendops-start (reference for `blendops-start`)

> Detailed playbook carried over from the former `blendops-start` skill. Load it from [`../SKILL.md`](../SKILL.md) when this part of the job is in scope.

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

## Trigger phrases

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
- single immediate next skill from the locked precedence order + why (or escalation to the precedence owner if a multi-skill clash lacks a locked order, or immediate exit to `blendops-final-check` on any failed gate / blocked mode)
- preconditions checklist for advancing

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Produced | Produced | Verified | Failed (defaults to Not Produced; downgrade-only, never upgrade)
Evidence used: <inventory references>
Limitations: <unknown state>
```

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Routing only — no Python and no Blender execution (`execute_blender_code` is never invoked here). If the next step requires runtime selection or configuration, route to `blendops-connect-blender`, or `blendops-connect-blender` with these locked boundaries:

- **Path 1 (Official Blender Lab MCP):** Requires Blender 5.1+ (`blender_version_min = "5.1.0"`), hosted via Anthropic Connector in Claude Desktop or a manually configured MCP client. The Connector is not standalone and never replaces the Lab MCP add-on inside Blender (even though the Anthropic tutorial prerequisite text says "Blender 4.2 or later", the binding minimum is 5.1+).
- **Path 2 (Community `mcp-for-blender`):** Renamed from `ahujasid/blender-mcp`, third-party, Blender 3.0+. Use only with caveats and never as release evidence.
- **CLI fallback (`blender --background --python`):** Appendix only (`blendops-connect-blender`), never a peer path without an evaluation record.

## Operating procedure

1. Normalize the artifact inventory and runtime state against `references/milestone-model.md`. Default any missing or unverified artifact status to `Not Produced`; apply truth states as downgrade-only (never upgrade).
2. Enforce the locked precedence rules without re-deciding cross-skill precedence locally:
   - **Evidence beats assumption**
   - **Geometry lock before look-dev**
   - **Export waits for validation**
3. If any gate has failed or the workflow is in blocked mode, exit immediately to `blendops-final-check` — never route forward.
4. Walk `references/routing-decision-tree.md` to select the single immediate next skill. If multiple skills clash without a locked precedence order, stop and escalate to the precedence owner rather than picking a skill locally.
5. Emit `references/stage-handoff-template.md`.

## Decision tree

```txt
Is the initial goal vague or are recipe/preflight gates still incomplete?
  Goal vague / no entry context → route to blendops-start (Rank 1)
  Goal clear, no recipe/pack selected → route to blendops-brief (Rank 2)
  Recipe selected, pack preflight not completed → route to blendops-done-criteria (Rank 3)
Has any quality gate failed, is an evidence contradiction present, or is the workflow in blocked mode?
  Active MCP port 9876 / dual-bridge conflict → route to blendops-connect-blender
  Any other failed gate, evidence contradiction, or blocked mode → exit immediately to blendops-final-check (never route forward)
Does the user request mid-workflow scope expansion or an unapproved extra deliverable?
  Yes → route to blendops-done-criteria before advancing
  No → walk the locked milestone precedence order (`references/routing-decision-tree.md`):
    1. Unverified render/export files claimed as done → blendops-final-check (evidence beats assumption)
    2. Runtime mutation requested while Runtime status is Not Run → blendops-connect-blender
    3. Scene/geometry/asset plan incomplete → domain scene planner or blendops-assets (geometry lock before look-dev)
    4. Geometry locked, camera/composition or lighting/materials needed → blendops-camera / blendops-lighting-materials
    5. Plans complete, pre-export quality validation needed → blendops-final-check or narrow quality checker (export waits for validation)
    6. Evidence verified and stakeholder summary needed → blendops-glb-web-handoff or blendops-start
    7. Multi-skill clash with no locked precedence order → stop and escalate to the precedence owner
```

## Playbooks

### Playbook A: Mid-planning progression (`Geometry lock before look-dev`)

- Inspect the inventory snapshot (`references/milestone-model.md`): locked brief and scene/camera composition plan exist, `Runtime status: Not Run`, `Artifact status: Not Produced`.
- Apply locked precedence (`geometry lock before look-dev`) to select `../blendops-lighting-materials/SKILL.md` as the single immediate next skill.
- Emit `references/stage-handoff-template.md` with explicit preconditions (composition plan consumed; no runtime mutation claimed).

### Playbook B: Unverified artifact claim interception (`Evidence beats assumption`)

- When the user claims a render or GLB is "done" and asks to jump straight to stakeholder handoff (`blendops-start`) without an evidence ledger, enforce **evidence beats assumption**.
- Keep unverified artifacts downgraded (`Not Produced` or `Produced`, never `Verified`) and route immediately to `../blendops-final-check/SKILL.md`.

### Playbook C: Failed gate or mid-stream scope creep (`Stop & gate`)

- If a quality checker (`blendops-final-check`, `blendops-glb-budget`) returned `Fail` or runtime is blocked, halt forward progression and exit immediately to `../blendops-final-check/SKILL.md`.
- If the user injects new deliverables mid-workflow, route to `../blendops-done-criteria/SKILL.md` before loading any downstream planner.

## Mode handling

### Text-only mode

Do not upgrade unverified claims: evidence beats assumption. Keep unverified artifacts at `Not Produced` (downgrade-only, never upgrade) and flag all unverified claims before routing.

### Runtime-ready mode

Route to `blendops-connect-blender` before any scene planning or mutation-dependent workflow stage when the inventory shows `Runtime status: Not Run` and the user wants runtime changes.

### Blocked runtime mode

Do not route forward to planning or execution skills. Exit immediately to `blendops-final-check` (or route strictly to `blendops-connect-blender` when the block is an active MCP bridge conflict on port 9876).

## Validation checklist

- [ ] Stage named
- [ ] Single immediate next skill selected from locked precedence (no local cross-skill precedence re-decision)
- [ ] Multi-skill clashes without locked order escalated to precedence owner
- [ ] Any failed gate or blocked mode exits to `blendops-final-check` (never forward)
- [ ] Preconditions listed (`evidence beats assumption; geometry lock before look-dev; export waits for validation`)
- [ ] Truth states preserved as downgrade-only with artifacts defaulting to `Not Produced`

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Single next skill selected from locked precedence order with clear preconditions and downgrade-only truth states |
| Warn | Multi-skill clash has no locked precedence order — escalated to precedence owner instead of guessing locally |
| Fail | Failed gate, blocked mode, or evidence contradiction encountered — mandatory immediate exit to `blendops-final-check` (never forward) |

## Failure handling

- On any failed validation gate, blocked runtime mode (other than a port `9876` bridge collision routed to `../blendops-connect-blender/SKILL.md`), or contradicted evidence claim, exit immediately to `../blendops-final-check/SKILL.md` — never route forward to downstream planning or export skills.
- If two candidate skills clash and no locked precedence rule resolves them, stop and escalate to the precedence owner instead of inventing local tie-breaking rules.
- If the user attempts to expand deliverables mid-stream, pause stage progression and route to `../blendops-done-criteria/SKILL.md`.
- Preserve downgrade-only truth states (`Artifact status` defaults to `Not Produced`; never upgrade states during routing).

## Troubleshooting

| Symptom | Cause | Safe resolution |
|---|---|---|
| Agent tries to load camera, lighting, material, and quality skills all at once | Skill-choice fan-out without milestone gating | Enforce `references/routing-decision-tree.md`: pick **one** immediate next skill from the locked precedence order and list any others only as future milestones. |
| User wants to export GLB before `blendops-final-check` or `blendops-glb-budget` has run | Violates `export waits for validation` | Route to the required validator skill first and list validation pass as a precondition for export/handoff. |
| User asks "what's next?" when no recipe or brief exists yet | Request arrived at Rank 4 router before Ranks 1–3 completed | Delegate back to `../blendops-start/SKILL.md`, `../blendops-brief/SKILL.md`, or `../blendops-done-criteria/SKILL.md` per `When not to use`. |

## Best practices

- Always enforce the three locked ordering invariants in every stage handoff: **evidence beats assumption**, **geometry lock before look-dev**, and **export waits for validation**.
- Recommend **exactly one** immediate next skill and list 2–3 concrete preconditions before opening that skill (`references/stage-handoff-template.md`).
- Keep `Runtime status` and `Artifact status` explicit and downgrade-only on every routing response.
- Exit to `../blendops-final-check/SKILL.md` immediately whenever a gate fails rather than trying to "route around" the failure.

## Good examples

- "`Current stage: Planning (Look-dev boundary)`. Inventory: Brief locked, composition plan present, `Runtime status: Not Run`, `Artifact status: Not Produced`. `Primary next skill`: `../blendops-lighting-materials/SKILL.md`. Preconditions: (1) geometry/camera framing locked (`geometry lock before look-dev`); (2) target render engine noted; (3) runtime readiness checked via `../blendops-connect-blender/SKILL.md` if live Blender mutation is next."
- "`Current stage: Blocked gate`. `blendops-glb-budget` returned `Fail` (180k triangles vs 50k mobile budget). Forward routing halted (`export waits for validation`). `Primary next skill`: `../blendops-final-check/SKILL.md`. `Runtime status: Not Run`. `Artifact status: Not Produced`."

## Bad examples

- "Next skills: run `blendops-lighting-materials`, `blendops-render-settings`, `blendops-final-check`, and `blendops-glb-web-handoff` in parallel." — causes multi-skill fan-out and skips validation gates.
- "Your quality check failed, so let's skip ahead to `blendops-start` and mark `Artifact status: Verified`." — routes forward on a failed gate and fabricates `Verified` status.
- "I executed `execute_blender_code` to check your scene objects and advance the stage." — violates the routing-only boundary (`laws/no-arbitrary-python-interface.md`).

## User-facing response template

```txt
Current stage: <Intent | Fit & prerequisites | Planning | Quality planning | Execution prep | Evidence | Handoff>
Inventory snapshot:
  - Brief: <present / absent>
  - Plans & checks: <completed planning or validation outputs>
  - Runtime status: <Not Run | Attempted | Produced | Verified | Failed>
  - Artifact status: <Not Produced | Produced | Verified | Failed>

Primary next skill: <single catalog skill path>
Why this skill: <1–2 sentences anchored in locked precedence: evidence beats assumption / geometry lock before look-dev / export waits for validation>
Preconditions before advancing:
  1. <precondition 1>
  2. <precondition 2>
Stop conditions: <when to return to blendops-start or exit to blendops-final-check>
Evidence used: <artifact inventory and stage records>
Limitations: <unverified state or pending checks>
```

## Anti-patterns

- Routing forward after a failed quality gate or blocked runtime state instead of exiting immediately to `../blendops-final-check/SKILL.md`.
- Re-inventing cross-skill precedence locally when multiple skills clash without a locked order, instead of escalating to the precedence owner.
- Upgrading unverified user claims to `Produced` or `Verified` (violating **evidence beats assumption**), or writing `Artifact status: Not Run` instead of `Artifact status: Not Produced`.
- Routing to look-dev (`blendops-lighting-materials`) before scene/geometry planning is locked, or routing to export/handoff before validation passes.
- Invoking Blender, generating Python (`execute_blender_code`), or duplicating `blendops-start` / `blendops-brief` / `blendops-done-criteria` entry gates.

## Cross-skill handoff

## Non-goals

- Initial entry triage when the user's goal is unclear (use `../blendops-start/SKILL.md`).
- Selecting a recipe/pack (`../blendops-brief/SKILL.md`) or running initial pack preflight (`../blendops-done-criteria/SKILL.md`).
- Executing domain scene planning, running Blender or Python, or verifying artifact files directly.
- Writing final stakeholder-facing delivery copy (use `../blendops-start/SKILL.md` after verification).

## References

- `references/milestone-model.md`
- `references/routing-decision-tree.md`
- `references/stage-handoff-template.md`
- `../../docs/workflows/full-non-blender-user-workflow.md`
