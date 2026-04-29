# BlendOps Roadmap (Product-Layer Rebuild)

_Last updated: 2026-04-28_

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
- [x] define external runtime assumptions using Blender + reference MCP
- [x] document first golden path in `docs/golden-path-cyberpunk-shoe.md`
- [x] define workflow contract in `docs/workflow-contract.md`
- [x] define product-layer safety model in `docs/safety-model.md`

## Phase 2 — Workflow design

- [ ] scene plan format
- [ ] safety model
- [ ] validation checklist
- [ ] user-facing language
- [ ] render/export expectations

## Phase 3 — Prototype integration decision

- [ ] decide whether BlendOps wraps `ahujasid/blender-mcp`
- [ ] or uses it as an external requirement
- [ ] or later rebuilds a small custom adapter
- [ ] no arbitrary Python as final BlendOps user-facing workflow

## Phase 4 — Minimal product implementation

- [ ] build only from product requirements
- [ ] avoid rebuilding low-level CLI/MCP out of inertia

## Phase 5 — Web-ready 3D output

- [ ] GLB handoff
- [ ] preview report
- [ ] React Three Fiber / Three.js usage guidance
