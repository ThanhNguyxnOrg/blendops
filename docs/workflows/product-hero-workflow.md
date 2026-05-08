# Workflow: product-hero-workflow

Status: Draft v0

## Trigger

Use this workflow when a non-Blender user asks for a product hero 3D output with web-ready handoff expectations.

## Inputs

- natural-language user prompt
- target output context (web/app/game/render)
- optional visual/style/performance constraints

## Laws applied

- [../../laws/official-runtime-only.md](../../laws/official-runtime-only.md)
- [../../laws/no-arbitrary-python-interface.md](../../laws/no-arbitrary-python-interface.md)
- [../../laws/evidence-before-done.md](../../laws/evidence-before-done.md)
- [../../laws/non-blender-user-language.md](../../laws/non-blender-user-language.md)

## Skills composed

- [../../skills/official-runtime-setup-guide/SKILL.md](../../skills/official-runtime-setup-guide/SKILL.md)
- [../../skills/product-hero-scene-planner/SKILL.md](../../skills/product-hero-scene-planner/SKILL.md)
- [../../skills/blender-scene-quality-checker/SKILL.md](../../skills/blender-scene-quality-checker/SKILL.md)
- [../../skills/glb-web-handoff/SKILL.md](../../skills/glb-web-handoff/SKILL.md)
- [../../skills/non-blender-user-response-writer/SKILL.md](../../skills/non-blender-user-response-writer/SKILL.md)

## Stages

> [!NOTE]
> These are workflow stages (per-run pipeline steps), not project roadmap phases.
> Project phases live in [`TODO.md`](../../TODO.md). They are unrelated.

### Stage 1 — Runtime readiness gate
- Confirm official runtime path selection.
- Capture source confidence (`verified-read` or `linked-only`).
- Block workflow if official runtime prerequisites are not acknowledged.

### Stage 2 — Intent and plan
- Normalize intent.
- Ask minimal clarification questions.
- Build scene plan: composition, lighting, materials, camera, handoff intent.

### Stage 3 — Quality gate
- Apply pass/warn/fail checks against requested intent.
- Identify blockers and unresolved risks.

### Stage 4 — GLB/web handoff gate
- Prepare handoff expectation report.
- Record compatibility assumptions and caveats.

### Stage 5 — Final non-Blender-user response
- Produce plain-language status and next actions.

## Outputs

- intent summary
- scene plan
- quality gate report
- GLB/web handoff report
- final user-facing plain-language response

## Validation gates

- Gate A: official runtime-only references present
- Gate B: scene plan completeness
- Gate C: quality checklist status assigned
- Gate D: handoff caveat transparency
- Gate E: non-Blender-user readability check

## Failure modes

- runtime prerequisites unclear
- prompt ambiguity unresolved
- insufficient evidence for readiness claims
- handoff compatibility uncertainty

## Runtime evidence expectations

Every run must capture:
- selected official runtime path
- source confidence level
- what was verified vs what remains linked-only
- text-only dry-eval marker when runtime is not executed (`Not Run` artifact status)

## Final response format

1. What you asked for
2. What is ready now
3. What is not fully verified yet
4. Recommended next step
