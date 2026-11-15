# Core Skill Depth Audit (16-Skill Baseline Snapshot)

Status: Historical baseline audit covering the original 16 core skills (catalog later expanded to 48 skills in `skills/README.md`)  
Date: 2026-04-29 (original 8-skill snapshot) · 2026-05-09 (refresh covering all 16 core skills)

## Scope

This historical snapshot covers the original 16 core skills at `skills/<name>/SKILL.md` (the 6 Superpowers + BMad-inspired process/discipline skills and 2 additional baseline skills `blendops-help` and `render-export-evidence` alongside the 8 originals).

| Skill | Group |
|---|---|
| skills/blendops-help/SKILL.md | Help / routing |
| skills/blender-brainstorming/SKILL.md | Process / discipline |
| skills/intent-to-3d-brief-writer/SKILL.md | Process / discipline |
| skills/blender-asset-discovery-planner/SKILL.md | Process / discipline |
| skills/official-runtime-setup-guide/SKILL.md | Setup / readiness |
| skills/official-runtime-readiness-checker/SKILL.md | Setup / readiness |
| skills/runtime-bridge-conflict-resolver/SKILL.md | Setup / readiness |
| skills/product-hero-scene-planner/SKILL.md | Planning |
| skills/blender-composition-camera-planner/SKILL.md | Planning |
| skills/blender-lighting-material-planner/SKILL.md | Planning |
| skills/blender-scene-quality-checker/SKILL.md | Quality / eval |
| skills/blender-troubleshooting/SKILL.md | Quality / debugging |
| skills/render-export-evidence/SKILL.md | Quality / evidence |
| skills/pre-handoff-verification/SKILL.md | Quality / pre-handoff |
| skills/glb-web-handoff/SKILL.md | Handoff |
| skills/non-blender-user-response-writer/SKILL.md | Handoff |

## Summary table (refreshed)

| Skill | Required-headings | Section completeness | Has `references/` | Reference count | EVAL.md | Verdict |
|---|---|---|---:|---:|---|---|
| blendops-help | All present | High | Yes | 3 | Yes | Production 1.0.0 |
| blender-brainstorming | All present | High | Yes | 3 | Yes | Production 1.0.0 |
| intent-to-3d-brief-writer | All present | High | Yes | 3 | Yes | Production 1.0.0 |
| blender-asset-discovery-planner | All present | High | Yes | 3 | Yes | Production 1.0.0 |
| official-runtime-setup-guide | All present | High | Yes | 3 | Yes | Production 1.0.0 |
| official-runtime-readiness-checker | All present | High | Yes | 3 | Yes | Production 1.0.0 |
| runtime-bridge-conflict-resolver | All present | High | Yes | 3 | Yes | Production 1.0.0 |
| product-hero-scene-planner | All present | High | Yes | 4 | Yes | Production 1.0.0 |
| blender-composition-camera-planner | All present | High | Yes | 4 | Yes | Production 1.0.0 |
| blender-lighting-material-planner | All present | High | Yes | 5 | Yes | Production 1.0.0 |
| blender-scene-quality-checker | All present | High | Yes | 4 | Yes | Production 1.0.0 |
| blender-troubleshooting | All present | High | Yes | 3 | Yes | Production 1.0.0 |
| render-export-evidence | All present | High | Yes | 3 | Yes | Production 1.0.0 |
| pre-handoff-verification | All present | High | Yes | 3 | Yes | Production 1.0.0 |
| glb-web-handoff | All present | High | Yes | 4 | Yes | Production 1.0.0 |
| non-blender-user-response-writer | All present | High | Yes | 4 | Yes | Production 1.0.0 |

## Findings

### Strengths

- All 9 required structural sections present in every skill (`Purpose`, `When to use`, `When not to use`, `Trigger phrases`, `Official runtime boundary`, `Mode handling`, `Validation checklist`, `Pass / Warn / Fail rubric`, `Cross-skill handoff`).
- Anthropic Skills frontmatter spec compliance: `name` ≤ 64 chars (kebab-case), `description` ≤ 200 chars, no `version` / `status` / `tags` keys.
- 2-path + CLI appendix runtime model preserved consistently across every skill that touches runtime.
- Anthropic Connector framed correctly as Path 1 host (a) (not standalone) in every relevant skill.
- Plain-language anti-jargon discipline preserved across all user-facing skills (`non-blender-user-response-writer`, `blender-brainstorming`, `intent-to-3d-brief-writer`).
- Evidence-before-done discipline preserved by `render-export-evidence`, `pre-handoff-verification`, and the runtime-readiness skills.
- Every skill ships with an `EVAL.md` text-only baseline.
- Every skill ships with a `references/` folder containing 3-5 reusable templates / playbooks / patterns.

### Gaps vs benchmark-grade target

- Reference counts vary 3-5 per skill. The 6 process/discipline skills have 3 each; some originals have 4-5. Consider adding 1-2 more references if specific reusable patterns emerge from real runs.
- No skill has been verified against actual runtime evidence (full eval). All depth assessments here are docs-only.
- Edge-case examples are evenly spread across most skills and expanded further across the 48-skill catalog.

## Next actions

1. Run a fresh per-path runtime eval and record evidence under `docs/evals/path-X-...md` (gated on operator).
2. After at least one successful runtime eval, add Blender-specific eval skills if patterns emerge that the current skills don't cover.
3. After process/discipline skills are exercised in real runs, consider adding 1-2 more references per skill.

## Compared to the original 2026-04-29 snapshot

The original audit covered 8 of 10 skills and noted gaps:
- "Per-skill reference libraries are currently uneven" → **resolved**: every skill now has a `references/` folder.
- "Add per-skill reference sets for all 8 root skills" → **completed for all 16 core skills (8 originals + 6 process/discipline + 2 final baselines), later scaled to 48**.
- "Run gate review and produce pass/warn/fail report per skill" → **completed**: see [`v0-skill-gate-review.md`](./v0-skill-gate-review.md).

The previous WARNING ("snapshot of 8 of 10 skills, partially outdated") is now obsolete and is removed by this refresh.
