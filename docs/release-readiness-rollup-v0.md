# Release Readiness Rollup v0

Status: Draft v0, pre-runtime rollup  
Date: 2026-04-29 (original); runtime-evidence section corrected 2026-05-08; corrected again 2026-05-08 after upstream re-read

> [!CAUTION]
> Exact draft tag decision: **do not tag v0.1.0 yet; defer tag until a fresh per-path runtime eval evidence record covers mutation/render/export, or until missing runtime evidence is explicitly accepted as a documented limitation.**
>
> The 2026-04-29 rollup claimed "Stack 1 — Claude Desktop official connector stack read-only smoke test: Pass / Available". A previous correction (commit `ac04686`) called this attribution ambiguous because it framed Anthropic Connector and Blender Lab MCP as independent routes. After re-reading the upstream Anthropic tutorial and Blender Lab page, that framing was wrong: Anthropic Connector is **not** standalone — the Lab MCP add-on inside Blender is required either way. The original "Claude Desktop Connector" attribution is **consistent** with the recorded Lab MCP tool names (`get_blendfile_summary_*`, `get_objects_summary`). The runtime-evidence section below is rewritten under the 2-path + CLI appendix model.

This rollup summarizes the current pre-runtime release position for BlendOps. It does not claim stable readiness, production readiness, official runtime compatibility confirmation, official runtime manual eval completion, or generated runtime artifacts.

---

## Product identity

BlendOps is a Draft v0 product/workflow layer for AI-assisted Blender work. It helps a non-Blender user turn plain-language 3D intent into constrained workflow plans, validation expectations, safety boundaries, and web handoff guidance.

BlendOps keeps runtime execution outside this repository. Runtime setup and execution belong to official Blender-supported paths, while this repository provides docs, laws, skills, recipes, and installable draft pack materials.

BlendOps is not a custom runtime, a custom Blender addon, a stable release channel, or a verified artifact pipeline.

---

## Completed phases

| Phase | Status | Summary |
|---|---|---|
| Phase 0, Product reset | Complete | Old custom runtime implementation removed and active docs rewritten around external runtime boundaries. |
| Phase 1, First golden path spec | Complete | First non-Blender-user journey, workflow contract, golden path, and safety model documented. |
| Phase 1.5, Research foundation | Complete | Skill systems, Blender workflow, web handoff, quality checklist, and synthesis docs recorded. |
| Phase 1.6, Official runtime strategy alignment | Complete | Active docs aligned to official-runtime-only references. |
| Phase 2, Workflow design | Complete | Scene plan, validation, safety, user-facing language, and render/export expectations defined. |
| Phase 2.5, v0 pack review and manual eval | In progress | Text-only dry eval and blocker record exist; official runtime manual eval remains open. |
| Phase 2.6, Installable skill pack layout | Complete | Root and pack-local skills, laws, workflow, recipe, references, and docs links created. |
| Phase 2.7, Skill depth and review gates | Complete | Benchmarking, canonical template, review gates, expanded skills, eval prompts, and pack manifest updates completed. |
| Phase 2.8, Skill depth audit and enrichment | Complete | Root skill depth audit, standards, skill enrichment, eval enrichment, and indexes completed. |
| Phase 2.9, Skill gate review eval | Complete | Skill review gates run, report produced, weak skills fixed, adapter dry-run queued and then completed. |
| Phase 2.10, Adapter install dry-run eval | Complete | Generic-root and Claude Code dry-runs, docs-only setup walkthrough, rollback checks, and agent-install updates completed. |
| Phase 2.11, Public repo polish and release-readiness cleanup | Complete | README milestones, manual install instructions, cleanup, and conservative tag decision recorded. |
| Phase 2.12, Manual install beta | Complete | Manual install beta evidence documented without runtime execution. |
| Phase 3.0, Official runtime verification criteria | Complete | Official runtime verification criteria prepared without claiming runtime execution. |
| Phase 3.1, Official runtime manual eval packet | Complete | Manual eval packet prepared without claiming runtime execution. |
| Phase 3.2, Runtime availability checklist | Complete | Runtime availability checklist prepared without claiming runtime execution. |
| Phase 3.3, Pre-runtime release readiness rollup | Complete | This rollup records the pre-runtime decision and remaining blockers. |

---

## Current install and adoption confidence

Current install/adoption confidence is **Warn**.

What supports confidence:

- Project-local install remains the default stance.
- User-global install remains opt-in only.
- Root `skills/`, `laws/`, and `packs/` collections exist for Draft v0 evaluation.
- Adapter install dry-run and manual install beta evidence are documented.
- Install docs state that BlendOps does not install Blender runtime and does not run Blender.

What limits confidence:

- Claude Code native path confidence remains environment-dependent.
- Manual install beta is a dry-run/docs-only confidence signal, not runtime confirmation.
- Adoption should remain Draft v0 until environment-scoped install confidence and runtime eval evidence improve.

---

## Current runtime evidence status

Current runtime evidence status is **Path 1 read-only smoke verified; full runtime eval Not Run for any path**. Path selection is defined in [docs/runtime-stack-strategy.md](./runtime-stack-strategy.md) using the 2-path + CLI appendix model.

Per-path status (corrected 2026-05-08):

| Path | Verification status | Evidence |
|---|---|---|
| **Path 1** Official Blender Lab MCP (host: Anthropic Connector OR manual MCP client; Blender 5.1+) | Read-only smoke verified (likely via Anthropic Connector host); mutation/render/export `Not Run` | The 2026-04-29 smoke test recorded `get_blendfile_summary_*` and `get_objects_summary` calls — these are Lab MCP tools, reachable from both Path 1 hosts. The original "Claude Desktop Connector" attribution is consistent with host option (a). See [`docs/evals/blender-connector-read-only-smoke-test.md`](./evals/blender-connector-read-only-smoke-test.md). |
| **Path 2** Community Blender MCP (`ahujasid/blender-mcp`) | User-reported verified (2026-05-08) | No formal evidence record file with Path 2 tool names (`get_scene_info`, `execute_blender_code`) yet. |
| **CLI fallback (appendix)** | **Publisher has not verified** in this repo | Documented for completeness only; not a peer of Path 1/2. |

Prepared but not run:

- Official runtime verification criteria.
- Runtime availability checklist.
- Official runtime manual eval packet.
- Per-path mutation/render/export eval (both Path 1 hosts and Path 2).
- CLI fallback eval.

Not produced:

- Per-route runtime manual eval evidence file.
- Preview evidence.
- Render evidence.
- GLB evidence.
- Runtime artifact handoff record.

No current repository doc should claim runtime compatibility confirmed, stable readiness, production readiness, or completed runtime manual eval for any route.

---

## Status table

| Area | Status |
|---|---|
| Docs polish | Pass |
| Skill/law/pack collection | Draft Pass |
| Adapter install dry-run | Warn |
| Manual install beta | Warn |
| Multi-agent install strategy | Drafted |
| Distribution strategy | Drafted / no marketplace claim |
| Runtime path strategy | Drafted / 2-path + CLI appendix model; Path 1 read-only smoke verified; mutation/render/export `Not Run` for both paths |
| Runtime availability checklist | Prepared / Not Run |
| 2026-04-29 read-only smoke test | Recorded as Path 1 read-only (likely Anthropic Connector host); mutation/render/export `Not Run` |
| Official runtime manual eval | Not Run |
| Runtime artifacts | Not Produced |
| Stable release readiness | Not Ready |

---

## Current blockers

| Blocker | Why it blocks release confidence | Required change |
|---|---|---|
| No path has full mutation/render/export evidence | Path 1 has read-only smoke evidence only (likely Anthropic Connector host); Path 2 is user-reported only with no formal file; CLI fallback is publisher-not-verified. | Run a fresh per-path eval covering recipe execution, mutation, render/export, validation, and artifact capture. Record path + host (for Path 1), `blender --version`, Blender-side add-on identity, MCP server source/commit, MCP host product, exact tool names, and tool responses. Save under `docs/evals/path-1-...md` or `docs/evals/path-2-...md`. |
| Runtime manual eval not run for any route | Read-only smoke test (under any interpretation) does not cover recipe execution, mutation, render/export, validation, and artifact capture. | Run the runtime manual eval packet against the chosen route and capture evidence. |
| Runtime artifacts not produced | No preview, render, GLB, or artifact handoff can be claimed under any route. | Produce and record artifacts only through a recorded runtime eval, or document missing artifacts as an accepted limitation. |
| Runtime availability incomplete | Per-route availability checklist has not been run end-to-end in a fresh, attribution-clean environment. | Run the runtime availability checklist for the chosen route. |
| Adapter confidence remains scoped | Install confidence is dry-run/docs based and environment-dependent. | Keep warnings visible or document a narrowed support scope. |
| Stable release criteria unmet | A stable or production claim needs repeated runtime and install evidence. | Keep Draft v0 posture. |

---

## Current warnings

1. Adapter install dry-run is useful but not universal install proof.
2. Manual install beta remains Warn, not full Pass.
3. Runtime availability checklist is Prepared / Not Run.
4. Runtime path strategy uses the 2-path + CLI appendix model. Path 1 = Official Blender Lab MCP (host: Anthropic Connector OR manual MCP, both require Blender 5.1+). Path 2 = community `ahujasid/blender-mcp` (Blender 3.0+). CLI fallback is appendix only and publisher-not-verified.
5. The 2026-04-29 read-only smoke test is consistent with Path 1, host (a) Anthropic Connector. It does not cover mutation/render/export, so full Path 1 eval remains `Not Run`.
6. The Blender 5.1+ floor applies to **all** of Path 1 (whichever host) because the Lab MCP add-on inside Blender requires it. Path 2 needs only Blender 3.0+.
7. Path 2 (`ahujasid/blender-mcp`) is mature 21K+ stars third-party prior art, not "experimental" — but BlendOps has no formal evidence file with Path 2 tool names yet.
8. Anthropic Connector is **not** standalone — Anthropic's tutorial step 2 explicitly tells you to install the Lab MCP add-on inside Blender. Docs that imply "Connector only, no Blender-side add-on" are wrong.
9. Single-bridge constraint: Path 1 + Path 2 must not run concurrently against the same Blender instance.
10. Runtime manual eval is Not Run for all paths.
11. Runtime artifacts are Not Produced.
12. Stable release readiness is Not Ready.
13. Any release note must avoid implying runtime compatibility is confirmed for full eval scope.

---

## What is ready

- Draft v0 product identity and scope.
- Official-runtime-only documentation stance.
- Root skill/law/pack collection for evaluation.
- Workflow contract, safety model, first user journey, and golden path docs.
- Skill depth and review gate docs.
- Adapter install dry-run report.
- Manual install beta report.
- Multi-agent install strategy and distribution strategy drafts.
- Runtime verification criteria.
- Runtime stack strategy.
- Runtime availability checklist.
- Official runtime manual eval packet.
- Claude Desktop Blender connector read-only smoke test evidence.
- Conservative draft tag decision.

---

## What is not ready

- v0.1.0 draft tag.
- Stable release readiness.
- Production readiness.
- Official runtime compatibility confirmation beyond scoped read-only connector access.
- Official runtime manual eval completion.
- Runtime artifact claims.
- Preview/render/GLB evidence claims.
- Broad install confidence across environments.
- Packaged skill bundle, tool-native package, or official marketplace listing.

A canonical package-source upload-readiness eval exists for `bundles/skill-package/blendops/`, but this is limited to source-level readiness evidence. Actual Claude Desktop/ChatGPT UI upload/import execution remains Not Tested.

---

## Draft tag decision

**Decision: do not tag v0.1.0 yet; defer tag until official runtime manual eval evidence exists, or until missing runtime evidence is explicitly accepted as a documented limitation.**

Rationale:

- Draft v0 docs, install evidence, and read-only connector smoke evidence are useful, but full runtime eval evidence is still missing.
- Runtime artifacts are not produced.
- The official runtime manual eval packet is prepared, not executed.
- A tag now could be mistaken for runtime readiness unless the limitation is explicitly accepted and documented.

---

## Remaining official runtime work

1. When a runtime-available environment exists, run the runtime availability checklist.
2. If readiness is available, run the official runtime manual eval packet.
3. Capture evidence before claiming any artifact.
4. Update release-readiness after eval evidence exists.

---

## Non-claims preserved

- This rollup does not claim Blender was run.
- This rollup does not claim runtime artifacts exist.
- This rollup does not claim full runtime compatibility is confirmed for Path 1, Path 2, or CLI fallback.
- This rollup does not claim runtime manual eval is complete.
- This rollup does not claim stable or production readiness.
- This rollup does not promote the 2026-04-29 read-only smoke test to mutation/render/export evidence for any path.
