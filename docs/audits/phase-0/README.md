# Phase 0 — Full Repository Audit (`v0.8.0-draft` @ `3ea3c35`)

> [!NOTE]
> This directory contains the empirical, source-backed **Phase 0 Full Repository Audit** of `ThanhNguyxnOrg/blendops` at commit `3ea3c35c6b8a6e5e915bab9f63333d4a1c09bd4d`. No runtime execution or artifact generation is claimed (`Runtime: Not Run`, `Artifacts: Not Produced`).

## Audit Deliverables in This Folder

| File | Format | Contents & Purpose |
| :--- | :---: | :--- |
| [`skill-inventory.json`](./skill-inventory.json) | JSON | Complete structural inventory of all **48 `SKILL.md` files** and **151 `references/*.md` files**, including frontmatter metrics, heading completeness against `skills/_template/SKILL.md`, trigger phrases (191 total), handoff notation style, graph in/out degrees, truth-state consistency flags, and `KEEP` / `IMPROVE` dispositions. |
| [`handoff-inventory.json`](./handoff-inventory.json) | JSON | Complete graph inventory of **373 cross-skill edges** extracted from all 48 skills, classified across 7 edge types (`progression`, `conditional`, `alternative`, `fallback`, `retry`, `upstream_reference`, `boundary_delegation`), notation styles (`relative_path` vs `bare_id`), cycle analysis, and per-skill degree statistics. |
| [`eval-inventory.json`](./eval-inventory.json) | JSON | Complete evaluation inventory of all **48 `EVAL.md` files**, separating the **8 Tier-A structured table evals** (52 test case rows total) from the **40 Tier-B single-prompt prose evals**. |
| [`routing-overlap.md`](./routing-overlap.md) | Markdown | Deep-dive analysis of the 4 routing & governance skills (`blendops-help`, `recipe-fit-assessor`, `pack-prerequisite-checker`, `workflow-stage-router`), the 7 quality/evidence validators, the 5 macro scene planners, and workflow graph reachability/cycle properties. |
| [`baseline-scorecard.json`](./baseline-scorecard.json) | JSON | Provisional baseline scorecard (**54.5 / 100**) across the 9 quality pillars, with explicit sub-criteria, file-level evidence links, and active P0 zero-compensation blockers. |
| [`findings-and-roadmap.md`](./findings-and-roadmap.md) | Markdown | Consolidated technical debt register (**F-01 through F-10**), per-skill disposition breakdown (`3 KEEP`, `45 IMPROVE`, `0 MERGE`, `0 SPLIT`, `0 REWRITE`), and the phased engineering roadmap from Phase 1 to Phase 5. |

## Related Documentation

- Documentation Hub: [`docs/README.md`](../../README.md)
- Skill Catalog: [`skills/README.md`](../../../skills/README.md)
- Evaluation Index: [`docs/evals/README.md`](../../evals/README.md)
- Adapter Registry: [`docs/adapter-registry.md`](../../adapter-registry.md)
