# v0 Skill Depth Audit

Status: Refreshed audit covering all 16 root skills  
Date: 2026-04-29 (original 8-skill snapshot) · 2026-05-09 (refresh covering all 16)

## Scope

This audit covers every active root skill at `skills/<name>/SKILL.md`. The 6 Phase 4 process / discipline skills (Superpowers + BMad inspired) and the 2 final baseline skills (`blendops-help`, `render-export-evidence`) are now included alongside the 8 originals.

| Skill | Group |
|---|---|
| skills/blendops-help/SKILL.md | Help / routing |
| skills/blender-brainstorming/SKILL.md | Process / discipline (Phase 4) |
| skills/intent-to-3d-brief-writer/SKILL.md | Process / discipline (Phase 4) |
| skills/blender-asset-discovery-planner/SKILL.md | Process / discipline (Phase 4) |
| skills/official-runtime-setup-guide/SKILL.md | Setup / readiness |
| skills/official-runtime-readiness-checker/SKILL.md | Setup / readiness |
| skills/runtime-bridge-conflict-resolver/SKILL.md | Setup / readiness (Phase 4) |
| skills/product-hero-scene-planner/SKILL.md | Planning |
| skills/blender-composition-camera-planner/SKILL.md | Planning |
| skills/blender-lighting-material-planner/SKILL.md | Planning |
| skills/blender-scene-quality-checker/SKILL.md | Quality / eval |
| skills/blender-troubleshooting/SKILL.md | Quality / debugging (Phase 4) |
| skills/render-export-evidence/SKILL.md | Quality / evidence |
| skills/pre-handoff-verification/SKILL.md | Quality / pre-handoff (Phase 4) |
| skills/glb-web-handoff/SKILL.md | Handoff |
| skills/non-blender-user-response-writer/SKILL.md | Handoff |

## Summary table (refreshed)

| Skill | Required-headings | Section completeness | Has `references/` | Reference count | EVAL.md | Verdict |
|---|---|---|---:|---:|---|---|
| blendops-help | All present | High | Yes | 3 | Yes | Expanded Draft v0 |
| blender-brainstorming | All present | High | Yes | 3 | Yes | Expanded Draft v0 |
| intent-to-3d-brief-writer | All present | High | Yes | 3 | Yes | Expanded Draft v0 |
| blender-asset-discovery-planner | All present | High | Yes | 3 | Yes | Expanded Draft v0 |
| official-runtime-setup-guide | All present | High | Yes | 3 | Yes | Expanded Draft v0 |
| official-runtime-readiness-checker | All present | High | Yes | 3 | Yes | Expanded Draft v0 |
| runtime-bridge-conflict-resolver | All present | High | Yes | 3 | Yes | Expanded Draft v0 |
| product-hero-scene-planner | All present | High | Yes | 4 | Yes | Expanded Draft v0 |
| blender-composition-camera-planner | All present | High | Yes | 4 | Yes | Expanded Draft v0 |
| blender-lighting-material-planner | All present | High | Yes | 5 | Yes | Expanded Draft v0 |
| blender-scene-quality-checker | All present | High | Yes | 4 | Yes | Expanded Draft v0 |
| blender-troubleshooting | All present | High | Yes | 3 | Yes | Expanded Draft v0 |
| render-export-evidence | All present | High | Yes | 3 | Yes | Expanded Draft v0 |
| pre-handoff-verification | All present | High | Yes | 3 | Yes | Expanded Draft v0 |
| glb-web-handoff | All present | High | Yes | 4 | Yes | Expanded Draft v0 |
| non-blender-user-response-writer | All present | High | Yes | 4 | Yes | Expanded Draft v0 |

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

- Reference counts vary 3-5 per skill. The 6 Phase 4 skills have 3 each; some originals have 4-5. Consider adding 1-2 more references to the Phase 4 skills if specific reusable patterns emerge from real runs.
- No skill has been verified against actual runtime evidence (full eval). All depth assessments here are docs-only.
- Edge-case examples are evenly spread across most skills but could expand for the Phase 4 process skills as they get exercised.

## Next actions

1. Run a fresh per-path runtime eval and record evidence under `docs/evals/path-X-...md` (gated on operator).
2. After at least one successful runtime eval, add Blender-specific eval skills if patterns emerge that the existing 16 don't cover.
3. After Phase 4 skills are exercised in real runs, consider adding 1-2 more references per skill.

## Compared to the original 2026-04-29 snapshot

The original audit covered 8 of 10 skills and noted gaps:
- "Per-skill reference libraries are currently uneven" → **resolved**: every skill now has a `references/` folder.
- "Add per-skill reference sets for all 8 root skills" → **completed for all 16 (8 originals + 6 Phase 4 + 2 final baselines)**.
- "Run Phase 2.8 gate review and produce pass/warn/fail report per skill" → **completed**: see [`v0-skill-gate-review.md`](./v0-skill-gate-review.md).

The previous WARNING ("snapshot of 8 of 10 skills, partially outdated") is now obsolete and is removed by this refresh.
