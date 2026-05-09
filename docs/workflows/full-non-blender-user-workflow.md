# Workflow: full-non-blender-user-workflow

Status: Draft v0

> [!NOTE]
> This is the **canonical full-lifecycle workflow** that chains all 16 BlendOps skills for a complete non-Blender-user run. It is the most general workflow; `product-hero-workflow.md` is the narrower product-hero-specific subset.

## Trigger

Use this workflow when a non-Blender user requests **any 3D scene + handoff** and the scope is broad enough to span intent exploration → planning → runtime execution → evidence → handoff.

If the user already has a confirmed brief, jump in at Stage 2. If runtime is not in scope (text-only iteration), stop after Stage 5.

## Inputs

- natural-language user prompt (any specificity)
- target deliverable hint (image / GLB / web hero / iteration / docs)
- target audience (non-Blender-technical / mixed / technical-OK)
- optional brand / mood / reference notes
- optional performance / time / scope constraints

## Laws applied

- [`../../laws/official-runtime-only.md`](../../laws/official-runtime-only.md)
- [`../../laws/no-arbitrary-python-interface.md`](../../laws/no-arbitrary-python-interface.md)
- [`../../laws/evidence-before-done.md`](../../laws/evidence-before-done.md)
- [`../../laws/non-blender-user-language.md`](../../laws/non-blender-user-language.md)

## Skills composed (all 16, in canonical run order)

```txt
Stage 1 — Intent
  blender-brainstorming                 (Socratic, when intent is vague)
  intent-to-3d-brief-writer             (8-slot structured brief)

Stage 2 — Asset planning
  blender-asset-discovery-planner       (per-asset strategy + license + budget)

Stage 3 — Runtime readiness
  official-runtime-setup-guide          (path + host prerequisites)
  official-runtime-readiness-checker    (matrix + verdict)
  runtime-bridge-conflict-resolver      (only if readiness signals are inconsistent)

Stage 4 — Scene planning
  product-hero-scene-planner            (subject + scene structure)
  blender-composition-camera-planner    (framing + camera)
  blender-lighting-material-planner     (mood + lookdev + portability)

Stage 5 — Quality gate
  blender-scene-quality-checker         (Pass / Warn / Fail readiness verdict)
  blender-troubleshooting               (only if output diverges from intent)

Stage 6 — Evidence + verification
  render-export-evidence                (classify each artifact's truth label)
  pre-handoff-verification              (7-point gate before any "ready" claim)

Stage 7 — Handoff + final response
  glb-web-handoff                       (web/GLB framing if in scope)
  non-blender-user-response-writer      (plain-language final response)

Routing utility (always available)
  blendops-help                         (load when next safe action is unclear)
```

## Stages

> [!NOTE]
> These are workflow stages (per-run pipeline steps), not project roadmap phases. Project phases live in [`TODO.md`](../../TODO.md).

### Stage 1 — Intent

Goal: confirmed user intent + 8-slot structured brief.

- If user request is vague: load `blender-brainstorming` first. Ask 3-5 batched clarifying questions, propose 2-3 alternative scopings, end with one-paragraph confirmed intent summary.
- Once intent is confirmed: load `intent-to-3d-brief-writer`. Fill the 8 slots (Subject, Mood, Deliverables, Constraints, Evidence expectations, Acceptance criteria, Audience, Owner). Echo to user. Confirm before proceeding.

Exit gate: brief locked. Runtime status `Not Run`. Artifact status `Not Produced`.

### Stage 2 — Asset planning

Goal: per-asset acquisition strategy with license + confidence + budget reconciliation.

- Load `blender-asset-discovery-planner`. Walk the 5-step decision tree (brand-restricted? specific? tight budget? iteration? mood-specific?).
- Per asset class, record strategy (procedural / library / generative / photogrammetry) + source candidate + license + confidence label + risk.
- Sum poly / GLB-size budget vs Slot 4 of the brief. Surface conflicts.
- If generative is chosen: flag with Path 2 caveat; route through Stage 3 readiness check before runtime.

Exit gate: asset plan reconciled with brief. Runtime status unchanged.

### Stage 3 — Runtime readiness

Goal: ONE selected runtime path that's actually ready, OR explicit "stay text-only" decision.

- Load `official-runtime-setup-guide` to choose Path 1 host (a or b), Path 2, or CLI fallback per client + Blender version + brief preferences.
- Load `official-runtime-readiness-checker` to build the readiness matrix (Blender version, MCP host product, Blender-side add-on, MCP server source, output path readiness, single-bridge constraint).
- If readiness signals are inconsistent (e.g. tool surface doesn't match labeled path, two MCP clients targeting same Blender, port `9876` collision): load `runtime-bridge-conflict-resolver`. Build the bridge state matrix. Propose the cheapest resolution. Operator executes. Re-run readiness checker.

Exit gate: readiness verdict `Ready` or `Partially Ready` (with documented caveats), OR explicit "stay text-only — runtime out of scope for this run".

### Stage 4 — Scene planning

Goal: structured scene plan ready for runtime mutation.

- Load `product-hero-scene-planner` (subject, scene scope, hero placement, support elements).
- Load `blender-composition-camera-planner` (framing, focal length, negative space, hero centering).
- Load `blender-lighting-material-planner` (mood lookdev, light placement, material portability per deliverable target).

Exit gate: plans reviewable in plain language; no jargon leak. Runtime status still `Not Run`.

### Stage 5 — Quality gate

Goal: Pass / Warn / Fail readiness verdict before any runtime mutation.

- Load `blender-scene-quality-checker`. Score the plan against the rubric.
- If verdict is Pass: proceed to Stage 6.
- If verdict is Warn: record explicit caveats; user decides whether to proceed.
- If verdict is Fail: route back to the relevant Stage 4 planner.
- If post-runtime output diverges from intent (loop-back from Stage 6): load `blender-troubleshooting` for 4-phase root-cause; then route the proposed fix to the correct upstream stage.

Exit gate: explicit Pass or Warn-with-caveats. Runtime status still `Not Run`.

### Stage 6 — Evidence + verification

Goal: honest evidence record per artifact + 7-point pre-handoff gate before "ready" claim.

- Load `render-export-evidence`. For each artifact item (preview / render / GLB / blend), walk the truth-label decision tree (`Not Run` → `Attempted` → `Produced` → `Verified` / `Failed`). Save evidence file under `docs/evals/path-X-...md` using the templates in `skills/render-export-evidence/references/evidence-record-templates.md`.
- Load `pre-handoff-verification`. Run all 7 checks (claim named, path attribution, artifact paths exist, validation notes, tool names, no-mutation guarantee for read-only smoke, plain language). Confirm or downgrade the claim. Never upgrade.

Exit gate: evidence file exists + 7-point gate verdict (Pass / Warn / Fail) recorded. Truth label finalized.

### Stage 7 — Handoff + final response

Goal: plain-language response to non-Blender stakeholders.

- If GLB / web is in scope: load `glb-web-handoff`. Add R3F / Three.js snippets, performance caveats, artifact-status language per the bundled references.
- Always: load `non-blender-user-response-writer`. Produce final user-facing response. Cite truth labels (`Not Run` / `Verified` etc.) explicitly. No Blender jargon without inline explanation.

Exit gate: response confirmed plain-language by check 7 of `pre-handoff-verification` (which already ran in Stage 6).

## Outputs

| Output | Source stage |
|---|---|
| confirmed intent paragraph | Stage 1 |
| 8-slot 3D brief | Stage 1 |
| per-asset acquisition plan | Stage 2 |
| runtime readiness matrix | Stage 3 |
| (optional) bridge state matrix + resolution | Stage 3 |
| structured scene plan | Stage 4 |
| composition + lighting + material plans | Stage 4 |
| quality gate verdict | Stage 5 |
| (optional) 4-phase troubleshooting record | Stage 5 |
| per-artifact evidence file under `docs/evals/path-X-...md` | Stage 6 |
| 7-point pre-handoff verification verdict | Stage 6 |
| (if GLB / web) handoff caveats + snippets | Stage 7 |
| plain-language final response | Stage 7 |

## Validation gates

- Gate A: brief echoed and confirmed (Stage 1)
- Gate B: asset budget reconciled (Stage 2)
- Gate C: runtime path selected and ready, OR explicit text-only decision (Stage 3)
- Gate D: scene + composition + lighting plans reviewable (Stage 4)
- Gate E: quality gate Pass or Warn-with-caveats (Stage 5)
- Gate F: evidence file + pre-handoff verification verdict recorded (Stage 6)
- Gate G: final response passes plain-language check 7 (Stage 7)

## Failure modes

- intent ambiguity unresolved → loop back to Stage 1
- license unknown / TBD on a hero asset → loop back to Stage 2 + brief slot 4
- runtime path unavailable / blocked → either choose different path in Stage 3 or stay text-only
- quality gate Fail → loop back to relevant Stage 4 planner
- runtime output diverges from intent → load `blender-troubleshooting`; route fix upstream per `divergence-routing-table.md`
- pre-handoff verification Fail (3+ checks) → route to `blender-troubleshooting`; do not let the deliverable through

## Runtime evidence expectations

Every run that reaches Stage 6 must capture:

- selected path + host option (Path 1 host a, Path 1 host b, Path 2, CLI fallback, or text-only)
- `blender --version` verbatim
- Blender-side add-on identity (Lab MCP add-on version OR `ahujasid/blender-mcp` `addon.py` commit)
- MCP server source (`.mcpb` filename / source commit / `uvx blender-mcp` version)
- MCP host product + version
- exact tool names called + responses
- single-bridge constraint check
- no-mutation guarantee (for read-only smoke claims)

## Final response format

1. What you asked for (one-paragraph restatement)
2. What is ready now (per-artifact truth label)
3. What is not fully verified yet (per-artifact downgrades + reasons)
4. Recommended next action (next-skill or operator action named)

## Relationship to other workflows

- [`product-hero-workflow.md`](./product-hero-workflow.md) is a narrower product-hero-specific subset. Use it when the request is specifically a product hero scene; use this full workflow when the request is broader.
- Recipes under `docs/recipes/` are scenario-specific instantiations of this workflow.

## Skipping stages

| Scenario | Skip |
|---|---|
| User provides a complete structured brief | Stage 1 brainstorming (jump to brief writer) |
| User supplies all assets | Stage 2 |
| Runtime not in scope | Stage 3, 6 (mutation/render/export); stop after Stage 5 |
| Iteration on existing scene | Stages 1, 2 (jump to relevant planner or troubleshooting) |
| Read-only smoke run only | Stop after Stage 3 with smoke evidence record |
