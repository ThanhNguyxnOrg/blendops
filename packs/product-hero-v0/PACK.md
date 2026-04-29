# PACK: product-hero-v0

> [!NOTE]
> Status: Draft v0. This pack composes laws and skills for product-hero planning, validation, and handoff under official-runtime-only boundaries.

## Pack status

| Field | Value |
|---|---|
| Pack name | `product-hero-v0` |
| Version | `0.1.0-draft` |
| Release posture | Draft v0, not stable |
| Runtime posture | Official-runtime-only |
| Runtime install | Not included |
| Runtime execution guarantee | Not claimed |
| Artifact guarantee | Not claimed without evidence |

## Intended workflow

Compose the included skills to plan, validate, and communicate product-hero Blender/web-3D outcomes under official-runtime-only boundaries.

| Stage | Skill family | Output |
|---|---|---|
| Setup | Runtime setup and readiness skills | Prerequisites, confidence labels, blockers |
| Planning | Product, camera, lighting, and material planners | Structured scene/workflow plan |
| Quality | Scene quality checker | Pass/warn/fail readiness verdict |
| Handoff | GLB/web and response writer skills | Plain-language status and web handoff notes |

## Included laws

| Law | Path |
|---|---|
| Official runtime only | `../../laws/official-runtime-only.md` |
| No arbitrary Python interface | `../../laws/no-arbitrary-python-interface.md` |
| Evidence before done | `../../laws/evidence-before-done.md` |
| Non-Blender-user language | `../../laws/non-blender-user-language.md` |

## Included skills

| Category | Skill path | Status |
|---|---|---|
| Setup / readiness | `../../skills/official-runtime-setup-guide/SKILL.md` | Expanded Draft v0 |
| Setup / readiness | `../../skills/official-runtime-readiness-checker/SKILL.md` | Expanded Draft v0 |
| Planning | `../../skills/product-hero-scene-planner/SKILL.md` | Expanded Draft v0 |
| Planning | `../../skills/blender-composition-camera-planner/SKILL.md` | Expanded Draft v0 |
| Planning | `../../skills/blender-lighting-material-planner/SKILL.md` | Expanded Draft v0 |
| Quality / eval | `../../skills/blender-scene-quality-checker/SKILL.md` | Expanded Draft v0 |
| Handoff / communication | `../../skills/glb-web-handoff/SKILL.md` | Expanded Draft v0 |
| Handoff / communication | `../../skills/non-blender-user-response-writer/SKILL.md` | Expanded Draft v0 |

## Recipe scenario

| Scenario | Status |
|---|---|
| Cyberpunk shoe hero planning and handoff | Text-only and planning flow supported; runtime output not claimed |

## Activation prompt

```txt
Use the product-hero-v0 pack to plan a cyberpunk shoe web hero. Do not run Blender unless official runtime is available.
```

## Required review gates

This pack expects included skills to pass Gate 0 through Gate 8 in `skill-reviews/review-gates.md`.

## Eval expectations

| Expectation | Status language |
|---|---|
| Per-skill evals | Each included skill has `EVAL.md`. |
| Text-only eval | Baseline checks should pass before runtime eval. |
| Runtime blockers | Must be recordable without overclaims. |
| Depth audit | Tracked in `skill-reviews/reports/v0-skill-depth-audit.md`. |
| Gate review | Tracked in `skill-reviews/reports/v0-skill-gate-review.md`. |

## Release readiness checklist

- [ ] all included skills pass review gates or have explicit warnings
- [ ] no non-official runtime setup references
- [ ] no artifact overclaims without evidence
- [ ] install dry-run in disposable fixture succeeds
- [ ] rollback instructions validated
- [ ] runtime eval findings integrated

## Non-goals

| Non-goal | Meaning |
|---|---|
| No runtime installation | The pack doesn't install Blender or runtime connectors. |
| No runtime execution guarantees | The pack doesn't claim Blender execution works. |
| No custom CLI/MCP/addon runtime ownership | BlendOps remains a product/workflow layer. |

## Verification expectations

| Expectation | Required behavior |
|---|---|
| Law compliance | All outputs follow included laws. |
| Evidence before done | No artifact or runtime success claims without evidence. |
| Artifact status | Use `Produced`, `Not Produced`, or `Not Run`. |
| Plain language | Preserve non-Blender-user clarity. |

## Promotion criteria

Promote from draft only when the release readiness checklist is complete and evaluation evidence is recorded.
