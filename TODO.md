# BlendOps Roadmap (Product-Layer Rebuild)

_Last updated: 2026-04-29_

> [!NOTE]
> Current focus: Phase 3, official runtime verification criteria and runtime eval readiness. BlendOps remains Draft v0 and does not claim stable release, runtime eval completion, or generated preview/render/GLB artifacts.

## Status snapshot

| Area | Status | Notes |
|---|---|---|
| Product reset | ✅ Complete | Old custom runtime implementation removed and active docs rewritten. |
| Golden path spec | ✅ Complete | Cyberpunk shoe hero workflow and safety expectations documented. |
| Research foundation | ✅ Complete | Skill systems, Blender workflow, and web handoff research recorded. |
| Official runtime strategy | ✅ Complete | Active docs aligned to official-runtime-only references. |
| Workflow design | ✅ Complete | Scene plan, validation, safety, and user-facing language defined. |
| v0 pack eval | 🚧 In progress | Text-only dry eval done, runtime manual eval still open. |
| Installable skill pack | ✅ Complete | Root `skills/`, `laws/`, and `packs/` layout created. |
| Skill review gates | ✅ Complete | Root skills expanded, reviewed, and indexed. |
| Duplicate docs/root cleanup | ✅ Complete | docs/skills, docs/laws, docs/packs removed; root skills/laws/packs are canonical and docs navigation updated. |
| Adapter install dry-run | ✅ Complete | Dry-run and rollback findings recorded without runtime execution. |
| Manual install beta | ✅ Complete | Generic-root, Claude Code fallback, and docs-only walkthrough completed. |
| Runtime verification | 🎯 Current focus | Verification criteria, manual eval packet, runtime availability checklist, release readiness rollup, read-only connector smoke evidence, and install/distribution strategy docs prepared; full official-runtime eval remains Not Run. |

## Current blockers

| Blocker | Impact | Next action |
|---|---|---|
| Official runtime manual eval not run | Cannot claim recipe execution, render/export behavior, or artifact production | Run manual eval after read-only connector access and runtime availability are sufficient |
| Runtime output not inspected | Cannot validate non-Blender-user artifact handoff from real output | Keep artifact status as Not Produced until evidence exists |
| Stable release not justified | Draft v0 must remain the posture | Defer tag or release claim until evidence is recorded |

## ✅ Phase 0: Product reset

- [x] remove old custom runtime implementation
- [x] rewrite docs truthfully
- [x] define external runtime assumption
- [x] define first non-Blender-user journey
- [x] add external runtime setup overview docs (`docs/external-runtime-setup.md`)

## ✅ Phase 1: First non-Blender-user golden path spec

- [x] user asks for a simple 3D product hero
- [x] define AI workflow
- [x] define expected artifacts
- [x] define acceptance criteria
- [x] define external runtime assumptions using official runtime hierarchy
- [x] document first golden path in `docs/golden-path-cyberpunk-shoe.md`
- [x] define workflow contract in `docs/workflow-contract.md`
- [x] define product-layer safety model in `docs/safety-model.md`

## ✅ Phase 1.5: Research foundation

- [x] research skill/workflow systems and source-verify claims
- [x] produce skill/law pattern synthesis
- [x] produce decision matrix for BlendOps v0 direction
- [x] research Blender production workflow with source confidence labels
- [x] research Blender to GLB to web handoff pipeline
- [x] define Blender quality checklist categories and gate format
- [x] draft BlendOps synthesis docs (design, law format, first skill pack)

## ✅ Phase 1.6: Official runtime strategy alignment

- [x] remove non-official runtime references from active strategy
- [x] adopt official-only runtime references in active docs
- [x] research official Blender MCP source accessibility
- [x] research official Claude Blender Connector source accessibility
- [x] update v0 skill pack runtime assumptions to official-only

## ✅ Phase 2: Workflow design

- [x] scene plan format
- [x] safety model
- [x] validation checklist
- [x] user-facing language
- [x] render/export expectations

## 🚧 Phase 2.5: v0 pack review and manual eval

- [x] create cyberpunk shoe v0 manual eval protocol
- [x] run text-only dry eval before runtime manual eval
- [x] create runtime eval result/blocker record
- [ ] run cyberpunk shoe recipe through official runtime manually
- [ ] inspect if output stays non-Blender-user-friendly
- [ ] refine validation gates
- [ ] decide whether to package installable skills later

## ✅ Phase 2.6: Installable skill pack layout

- [x] create root `skills/` multi-skill entrypoints
- [x] create pack-local laws
- [x] create pack-local skills
- [x] create pack-local workflow
- [x] create pack-local recipe
- [x] create references/examples/harness notes
- [x] update docs to point to installable pack

## ✅ Phase 2.7: Skill depth and review gates

- [x] benchmark Blender skill repos
- [x] create canonical skill template
- [x] create review gates
- [x] expand 8 root skills
- [x] add per-skill eval prompts
- [x] update pack manifest

## ✅ Phase 2.8: Skill depth audit and enrichment

- [x] audit every root skill for depth
- [x] define depth standard
- [x] enrich all root SKILL.md files
- [x] add per-skill references
- [x] enrich per-skill EVAL files
- [x] update pack/readme indexes

## ✅ Phase 2.9: Skill gate review eval

- [x] run every root skill through review gates
- [x] produce pass/warn/fail report
- [x] fix remaining weak skills
- [x] then run adapter install dry-run

## ✅ Phase 2.10: Adapter install dry-run eval

- [x] test generic-root fallback in a disposable fixture project
- [x] test Claude Code adapter in a disposable fixture if safe
- [x] test Claude app setup docs text-only
- [x] verify no runtime is installed/run
- [x] verify rollback instructions
- [x] update agent-install guide from findings

## ✅ Phase 2.11: Public repo polish and release-readiness cleanup

- [x] update GitHub About/topics if needed
- [x] cleanup stale duplicate docs only after dry-run findings
- [x] update README milestones
- [x] prepare v0 manual install instructions
- [x] decide whether to tag draft release (Decision: do not tag yet; defer until official runtime manual eval evidence exists or limitation is explicitly accepted)

## ✅ Phase 2.12: Manual install beta

- [x] run generic-root install dry-run in disposable fixture project
- [x] run Claude Code project-local fallback dry-run
- [x] run Claude app/Desktop docs-only/reference walkthrough
- [x] verify no runtime was installed/run
- [x] verify rollback clarity in fixture reports
- [x] document beta findings in `docs/evals/manual-install-beta-v0.md`

## ✅ Phase 2.13: Portable skill system architecture

- [x] create canonical skill system guide (`docs/skill-system.md`)
- [x] create reusable root skill template (`skills/_template/SKILL.md`)
- [x] add BlendOps next-step helper skill (`skills/blendops-help/SKILL.md`)
- [x] add BlendOps next-step helper baseline eval (`skills/blendops-help/EVAL.md`)
- [x] add render/export evidence skill (`skills/render-export-evidence/SKILL.md`)
- [x] add render/export evidence baseline eval (`skills/render-export-evidence/EVAL.md`)
- [x] document canonical aliases for runtime readiness and scene planning without duplicating skills
- [x] document AI agent paste-command install flow (`docs/ai-agent-install-flow.md`)
- [x] create per-target AI agent install docs (`docs/install/`)
- [ ] create Claude Desktop skill bundle without claiming connector/runtime success
- [ ] package a project-local skill bundle with rollback notes
- [ ] research OpenCode, Cursor, Codex, and Gemini adapters with confidence labels
- [ ] add Blender-specific eval skills only after runtime evidence needs are clearer
- [ ] create skill packaging fixture and validation script
- [ ] keep packaged skill, plugin listing, and marketplace listing unchecked until verified
- [ ] keep runtime eval unchecked / Not Run until execution evidence exists
- [ ] keep preview/render/GLB artifact evidence unchecked / Not Produced until generated evidence exists

## 🎯 Phase 3: Official runtime readiness

Focus: official runtime verification criteria and runtime eval readiness, not custom runtime implementation.

- [x] document official runtime compatibility assumptions without confirming them until evidence exists (Blender MCP + Claude connector + Blender CLI)
- [x] define runtime verification criteria for official integration paths
- [x] prepare official runtime manual eval packet without claiming runtime execution
- [x] prepare runtime availability checklist without claiming runtime execution
- [x] prepare Phase 3.3 pre-runtime release readiness rollup (`docs/release-readiness-rollup-v0.md`)
- [x] record Claude Desktop Blender connector read-only smoke test without claiming full runtime eval or artifacts
- [x] draft runtime stack strategy with Stack 1 first eval, Stack 2 CLI fallback, Stack 3 unofficial caveat, and direct official MCP for non-Claude agents kept as future research only
- [x] update eval docs for Stack 1 first, Stack 2 fallback, Stack 3 non-release path, and direct official MCP for non-Claude agents unsupported/unverified
- [x] draft and link multi-agent install and distribution strategy docs without claiming package or marketplace availability
- [x] complete runtime stack model cleanup across public docs
- [ ] package a project-local generic BlendOps bundle with rollback notes
- [ ] prepare Claude Desktop Personal Skill import bundle without claiming connector/runtime success
- [ ] research OpenCode installation options after source-backed path verification
- [ ] research and draft Cursor, Codex, and Gemini adapters with confidence labels
- [ ] define evidence gates for any future tool-native package, extension, or marketplace listing
- [ ] defer any product implementation decision until official runtime evidence exists
- [ ] no arbitrary Python as final BlendOps user-facing workflow

## 🧱 Phase 4: Minimal product implementation

- [ ] build only from product requirements
- [ ] avoid rebuilding low-level CLI/MCP out of inertia
- [ ] do not mark packaged skill, plugin, or marketplace distribution complete until evidence exists

## 🌐 Phase 5: Web-ready 3D output

- [ ] GLB handoff
- [ ] preview report
- [ ] React Three Fiber / Three.js usage guidance
