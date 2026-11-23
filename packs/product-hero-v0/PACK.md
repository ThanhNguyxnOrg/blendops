# PACK: product-hero-v0

> [!NOTE]
> Status: 1.0.0. This pack composes laws and skills for product-hero planning, validation, and handoff under official-runtime-only boundaries (retaining canonical pack identifier `product-hero-v0`).

## Pack status

| Field | Value |
|---|---|
| Pack name | `product-hero-v0` |
| Version | `1.0.0` |
| Release posture | Production (`v1.0.0`) |
| Runtime posture | Official-runtime-only |
| Runtime install | Not included |
| Runtime execution guarantee | Not claimed |
| Artifact guarantee | Not claimed without evidence |

## Intended workflow

Compose the included skills to plan, validate, and communicate product-hero Blender/web-3D outcomes under official-runtime-only boundaries.

| Stage | Skill family | Output |
|---|---|---|
| Help | Next-step routing skill | Safe entrypoint and skill/doc handoff |
| Setup | Runtime setup and readiness skills | Prerequisites, confidence labels, blockers |
| Planning | Product, camera, lighting, and material planners | Structured scene/workflow plan |
| Quality | Scene quality and render/export evidence skills | Pass/warn/fail readiness verdict and artifact truth labels |
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
| Help / routing | `../../skills/blendops-start/SKILL.md` | 1.0.0 |
| Process / discipline (Superpowers + BMad inspired) | `../../skills/blendops-brief/SKILL.md` | 1.0.0 |
| Process / discipline | `../../skills/blendops-brief/SKILL.md` | 1.0.0 |
| Process / discipline | `../../skills/blendops-assets/SKILL.md` | 1.0.0 |
| Setup / readiness | `../../skills/blendops-connect-blender/SKILL.md` | 1.0.0 |
| Setup / readiness | `../../skills/blendops-connect-blender/SKILL.md` | 1.0.0 |
| Setup / readiness | `../../skills/blendops-connect-blender/SKILL.md` | 1.0.0 |
| Planning | `../../skills/blendops-product-shot/SKILL.md` | 1.0.0 |
| Planning | `../../skills/blendops-camera/SKILL.md` | 1.0.0 |
| Planning | `../../skills/blendops-lighting-materials/SKILL.md` | 1.0.0 |
| Quality / eval | `../../skills/blendops-final-check/SKILL.md` | 1.0.0 |
| Quality / debugging | `../../skills/blendops-fix-problems/SKILL.md` | 1.0.0 |
| Quality / evidence | `../../skills/blendops-final-check/SKILL.md` | 1.0.0 |
| Quality / pre-handoff | `../../skills/blendops-final-check/SKILL.md` | 1.0.0 |
| Handoff / communication | `../../skills/blendops-glb-web-handoff/SKILL.md` | 1.0.0 |
| Handoff / communication | `../../skills/blendops-start/SKILL.md` | 1.0.0 |

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
| Per-skill evals | Each included skill ships `SKILL.md`, `contract.json`, `EVAL.md`, `evals/suites/<id>.eval.json`, and 3+ `references/` files. |
| Automated deterministic evals | Verified across all 16 catalog skills (`280/280` deterministic cases via `npm run evals:run`). |
| Runtime blockers | Must be recordable without overclaims. |
| Depth audit | Tracked in `skill-reviews/reports/v0-skill-depth-audit.md`. |
| Gate review | Tracked in `skill-reviews/reports/v0-skill-gate-review.md`. |

## Release readiness checklist

- [ ] all included skills pass review gates or have explicit warnings
- [ ] no uncaveated Path 2 references; CLI appendix never a peer path
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
| Artifact status | Use `Produced`, `Not Produced`, `Verified`, or `Failed` (`Not Run` is reserved exclusively for Runtime/Eval status). |
| Plain language | Preserve non-Blender-user clarity. |

## Release gates

Review gates (`Gate 0` through `Gate 8`), `npm run ci`, and deterministic behavioral evaluations must remain green across every skill and pack change; live runtime/artifact claims remain gated on recorded evidence under `docs/evals/`.
