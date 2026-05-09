# v0 Skill Gate Review

Status: Refreshed gate review covering all 16 root skills  
Date: 2026-04-29 (original 8-skill snapshot) · 2026-05-09 (refresh covering all 16)  
Scope: Root installable skills (`skills/*/SKILL.md`)

## Summary

- Skills reviewed: **16** (was 8 in the 2026-04-29 snapshot)
- Pass: **13**
- Warn: **3** (Gate 0 source-confidence policy warns; runtime-touching skills carry "linked-only" upstream provenance until in-repo evidence exists)
- Fail: 0

The previous WARNING ("snapshot of 8 of 10 skills, partially outdated") is now obsolete and is removed by this refresh.

## Gate definitions

| Gate | Name | What it checks |
|---|---|---|
| 0 | Source / license | Source provenance documented; license labels present |
| 1 | Runtime boundary | Skill respects 2-path + CLI appendix model; doesn't claim runtime ownership |
| 2 | Laws | Required laws linked and respected |
| 3 | Format / depth | Required headings present; sections substantive |
| 4 | Blender quality | Domain claims accurate per upstream Blender / Anthropic / community sources |
| 5 | Evidence truth | No artifact / runtime claim without recorded evidence |
| 6 | UX | Plain-language for user-facing outputs; no Blender jargon |
| 7 | Pack consistency | Skill plays well in the v0 product-hero pack composition |
| 8 | Eval readiness | Has `EVAL.md` baseline; evidence schema explicit |

## Gate review table (refreshed)

| Skill | G0 | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | Verdict | Required fixes |
|---|---|---|---|---|---|---|---|---|---|---|---|
| blendops-help | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | **Pass** | None |
| blender-brainstorming | Warn | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | **Warn** | Source-provenance note (Superpowers `/brainstorming` analog) is linked-only |
| intent-to-3d-brief-writer | Warn | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | **Warn** | Source-provenance note (BMad analysis-phase analog) is linked-only |
| blender-asset-discovery-planner | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | **Pass** | None |
| official-runtime-setup-guide | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | **Pass** | None (refreshed 2026-05-08 to 2-path + CLI appendix model; corrects earlier G0 Warn) |
| official-runtime-readiness-checker | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | **Pass** | None (refreshed 2026-05-08) |
| runtime-bridge-conflict-resolver | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | **Pass** | None |
| product-hero-scene-planner | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | **Pass** | None |
| blender-composition-camera-planner | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | **Pass** | None |
| blender-lighting-material-planner | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | **Pass** | None |
| blender-scene-quality-checker | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | **Pass** | None |
| blender-troubleshooting | Warn | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | **Warn** | Source-provenance note (Superpowers `/systematic-debugging` analog) is linked-only |
| render-export-evidence | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | **Pass** | None |
| pre-handoff-verification | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | **Pass** | None |
| glb-web-handoff | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | **Pass** | None |
| non-blender-user-response-writer | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | Pass | **Pass** | None |

## Notes

- **G0 Warn for Phase 4 process skills** (`blender-brainstorming`, `intent-to-3d-brief-writer`, `blender-troubleshooting`): each carries a "Inspired by Anthropic Superpowers / BMad-Method" source line. The pattern provenance is linked, not the skill content itself. We treat this as the conservative policy default rather than a real concern. The skills do not copy any Superpowers / BMad code or protected wording.
- **G0 was Warn for the 8 originals in the 2026-04-29 snapshot** because of conservative source-provenance policy. After the 2026-05-08 runtime-model refresh, the 8 originals' source claims are tied directly to Anthropic + Blender Foundation upstream — verified-read for upstream URLs — so G0 lifted to Pass for those 8.
- **G3 (Format / depth)** is now Pass for all 16 skills; every skill has all 9 required headings + a `references/` folder.
- **G4 (Blender quality)** depends on upstream sources; for runtime-touching skills, claims are anchored to Anthropic tutorial + Blender Lab page (read 2026-05-08).
- **G5 (Evidence truth)** is enforced by `render-export-evidence` + `pre-handoff-verification` working together. No skill upgrades a claim by itself.

## Conclusion

All 16 root skills pass the gate review (3 Warn / 13 Pass / 0 Fail). The 3 Warn verdicts are policy-conservative source-provenance notes, not blocking issues.

The skill collection is ready to remain Draft v0 with confidence that:

- structure and depth are consistent across all 16 skills
- runtime model is correctly applied
- evidence-before-done is enforced
- plain-language discipline is preserved for user-facing output

Promotion beyond Draft v0 still depends on **runtime evidence** (operator-supplied), not on docs gate review. See [`docs/release-readiness.md`](../../docs/release-readiness.md).
