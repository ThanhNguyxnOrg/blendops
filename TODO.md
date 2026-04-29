# BlendOps Roadmap (Product-Layer Rebuild)

_Last updated: 2026-04-29_

## Phase 0 — Product reset

- [x] remove old custom runtime implementation
- [x] rewrite docs truthfully
- [x] define external runtime assumption
- [x] define first non-Blender-user journey
- [x] add external runtime setup overview docs (`docs/external-runtime-setup.md`)

## Phase 1 — First non-Blender-user golden path spec

- [x] user asks for a simple 3D product hero
- [x] define AI workflow
- [x] define expected artifacts
- [x] define acceptance criteria
- [x] define external runtime assumptions using official runtime hierarchy
- [x] document first golden path in `docs/golden-path-cyberpunk-shoe.md`
- [x] define workflow contract in `docs/workflow-contract.md`
- [x] define product-layer safety model in `docs/safety-model.md`

## Phase 1.5 — Research foundation (completed)

- [x] research skill/workflow systems and source-verify claims
- [x] produce skill/law pattern synthesis
- [x] produce decision matrix for BlendOps v0 direction
- [x] research Blender production workflow with source confidence labels
- [x] research Blender→GLB→web handoff pipeline
- [x] define Blender quality checklist categories and gate format
- [x] draft BlendOps synthesis docs (design, law format, first skill pack)

## Phase 1.6 — Official runtime strategy alignment (completed)

- [x] remove non-official MCP runtime references from active strategy
- [x] adopt official-only runtime references in active docs
- [x] research official Blender MCP source accessibility
- [x] research official Claude Blender Connector source accessibility
- [x] update v0 skill pack runtime assumptions to official-only

## Phase 2 — Workflow design (completed)

- [x] scene plan format
- [x] safety model
- [x] validation checklist
- [x] user-facing language
- [x] render/export expectations

## Phase 2.5 — v0 pack review and manual eval

- [x] create cyberpunk shoe v0 manual eval protocol
- [x] run text-only dry eval before runtime manual eval
- [x] create runtime eval result/blocker record
- [ ] run cyberpunk shoe recipe through official runtime manually
- [ ] inspect if output stays non-Blender-user-friendly
- [ ] refine validation gates
- [ ] decide whether to package installable skills later

## Phase 2.6 — Installable skill pack layout (completed)

- [x] create root `skills/` multi-skill entrypoints
- [x] create pack-local laws
- [x] create pack-local skills
- [x] create pack-local workflow
- [x] create pack-local recipe
- [x] create references/examples/harness notes
- [x] update docs to point to installable pack

## Phase 2.7 — Agent install strategy and dry-run

- [x] update/repair agent-install guide to install root `skills/` collection
- [ ] run agent-install guide in a disposable fixture project
- [ ] verify project-local files created correctly
- [ ] verify no runtime was installed/run
- [ ] verify rollback instructions work
- [ ] refine install guide

## Phase 3 — Prototype integration decision

- [ ] confirm official runtime compatibility assumptions (Blender MCP + Claude connector + Blender CLI)
- [ ] define runtime verification criteria for official integration paths
- [ ] evaluate whether a later custom adapter is product-justified
- [ ] no arbitrary Python as final BlendOps user-facing workflow

## Phase 4 — Minimal product implementation

- [ ] build only from product requirements
- [ ] avoid rebuilding low-level CLI/MCP out of inertia

## Phase 5 — Web-ready 3D output

- [ ] GLB handoff
- [ ] preview report
- [ ] React Three Fiber / Three.js usage guidance
