# Release Readiness Rollup v0

Status: Draft v0, pre-runtime rollup  
Date: 2026-04-29

> [!CAUTION]
> Exact draft tag decision: **do not tag v0.1.0 yet; defer tag until official runtime manual eval evidence exists, or until missing runtime evidence is explicitly accepted as a documented limitation.**

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

Current runtime evidence status is **Read-only connector access available; full runtime eval Not Run**. Stack selection is defined in [docs/runtime-stack-strategy.md](./runtime-stack-strategy.md).

Verified read-only access:

- Stack 1 — Claude Desktop official connector stack read-only smoke test: Pass / Available. Evidence report: [docs/evals/blender-connector-read-only-smoke-test.md](./evals/blender-connector-read-only-smoke-test.md).
- Blender-side official MCP bridge/add-on: Available for read-only session access only inside the Claude Desktop connector stack; this is not direct official MCP success for Claude Code/OpenCode/Cursor/Codex/Gemini and not Stack 3 support.

Prepared but not run:

- Official runtime verification criteria.
- Runtime availability checklist.
- Official runtime manual eval packet.
- Stack 1 mutation/render/export eval.
- Stack 2 official CLI fallback eval.

Not produced:

- Official runtime manual eval evidence.
- Preview evidence.
- Render evidence.
- GLB evidence.
- Runtime artifact handoff record.

No current repository doc should claim official runtime compatibility confirmed, stable readiness, production readiness, or completed official runtime manual eval.

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
| Runtime stack strategy | Drafted / Stack 1 preferred first eval |
| Runtime availability checklist | Prepared / Not Run |
| Claude Desktop Blender connector read-only smoke test | Pass / Available |
| Official runtime manual eval | Not Run |
| Runtime artifacts | Not Produced |
| Stable release readiness | Not Ready |

---

## Current blockers

| Blocker | Why it blocks release confidence | Required change |
|---|---|---|
| Official runtime manual eval not run | Stack 1 read-only connector access has been evidenced, but recipe execution, mutation, render/export, validation, and artifact capture have not been run. | Run the official runtime manual eval packet and capture evidence, starting with Stack 1. |
| Runtime artifacts not produced | No preview, render, GLB, or artifact handoff can be claimed. | Produce and record artifacts only through official runtime eval, or document missing artifacts as an accepted limitation. |
| Runtime availability incomplete | Stack 1 read-only connector access is available, but full runtime availability and artifact capture remain untested; Stack 2 fallback has not been attempted. | Run the runtime availability checklist in a real environment before full eval. |
| Adapter confidence remains scoped | Install confidence is dry-run/docs based and environment-dependent. | Keep warnings visible or document a narrowed support scope. |
| Stable release criteria unmet | A stable or production claim needs repeated runtime and install evidence. | Keep Draft v0 posture. |

---

## Current warnings

1. Adapter install dry-run is useful but not universal install proof.
2. Manual install beta remains Warn, not full Pass.
3. Runtime availability checklist is Prepared / Not Run.
4. Runtime stack strategy prefers Stack 1 for the first real eval and Stack 2 as the next official fallback if Stack 1 fails during mutation/render/export.
5. Claude Desktop Blender connector read-only smoke test is Pass / Available, but it does not cover recipe execution, mutation, render, export, or artifact validation.
6. Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.
7. Stack 3 remains optional unofficial/user-managed/experimental-local and not a release path.
8. Official runtime manual eval is Not Run.
9. Runtime artifacts are Not Produced.
6. Stable release readiness is Not Ready.
7. Any release note must avoid implying runtime compatibility is confirmed.

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
- This rollup does not claim official runtime compatibility is confirmed.
- This rollup does not claim official runtime manual eval is complete.
- This rollup does not claim stable or production readiness.
