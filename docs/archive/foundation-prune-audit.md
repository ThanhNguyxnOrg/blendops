# Foundation Prune Audit

| Area/File | Keep/Freeze/Archive/Delete | Reason | Action |
|---|---|---|---|
| `apps/cli/src/index.ts` | KEEP | Required runtime entrypoint and lifecycle controls; includes minimal foundation commands | Keep; de-emphasize non-foundation commands in product messaging |
| `apps/mcp-server/src/index.ts` | KEEP | Required MCP runtime entrypoint for AI tool-calling | Keep; prioritize minimal tools in docs |
| `apps/blender-addon/blendops_addon/__init__.py` | KEEP | Core bridge + main-thread dispatch + typed operation handlers | Keep; avoid arbitrary execution exposure |
| `packages/core/src/index.ts` | KEEP | Bridge client + lifecycle API used by CLI/MCP | Keep |
| `packages/core/src/bridgeLifecycle.ts` | KEEP | Managed start/status/log/stop foundation | Keep |
| `packages/schemas/src/index.ts` | KEEP | Response envelope + typed contracts + request correlation | Keep |
| `scripts/doctor.ps1` | KEEP | Required diagnostics surface in foundation | Keep |
| `scripts/run-uat.ps1` | KEEP | Required end-to-end foundation verification path | Keep |
| `scripts/check-operation-manifest.mjs` | FREEZE | Strongly coupled to expanded operation surface; still useful for current stability | Keep for now; do not market as product breadth promise |
| `scripts/check-docs.mjs` | FREEZE | Enforces historical docs consistency; still useful as quality gate | Keep; adjust only when foundation docs evolve |
| `README.md` | KEEP | Primary product promise; currently needs recentering | Rewrite to minimal foundation positioning |
| `TODO.md` | KEEP | Roadmap communication artifact | Replace with phased pivot roadmap |
| `docs/product-direction.md` | KEEP | New canonical direction for pivot | Add |
| `docs/runtime-foundation-parity.md` | KEEP | Clarifies official CLI + prior-art + BlendOps relationship | Add |
| `docs/foundation-prune-audit.md` | KEEP | Explicit keep/freeze/archive/delete decision log | Add |
| `docs/README.md` | KEEP | Docs index entrypoint | Recenter index around foundation first |
| `docs/install.md` | KEEP | Core onboarding and runtime startup guidance | Keep |
| `docs/mcp-setup.md` | KEEP | Core AI client configuration guidance | Keep |
| `docs/observability.md` | KEEP | Core readiness/log/status troubleshooting | Keep |
| `docs/blender-cli-reference.md` | KEEP | Documents runtime primitive alignment | Keep |
| `docs/prior-art.md` | KEEP | Prior-art rationale for non-clone direction | Keep |
| `docs/ai-agent-usage.md` | FREEZE | Contains broad operation guidance beyond immediate product promise | Keep but de-emphasize in top-level positioning |
| `docs/manual-test.md` | FREEZE | Useful operationally but broad-surface oriented | Keep for internal/runtime validation |
| `docs/evals.md` | FREEZE | Broader capability eval set than foundation promise | Keep as non-primary artifact |
| `docs/batch-execute-safety-contract.md` | FREEZE | Valuable safety artifact, not immediate user-facing foundation promise | Keep |
| `docs/bridge-lifecycle-prior-art.md` | FREEZE | Implementation deep-dive useful for maintainers | Keep |
| `docs/prior-art-implementation-patterns.md` | FREEZE | Detailed mining doc; not product entrypoint | Keep |
| `docs/implementation-mining.md` | ARCHIVE | Historical research deep dive; not core product narrative | Keep file, remove from primary path emphasis |
| `docs/roadmap.md` | ARCHIVE | Superseded by updated `TODO.md` phases | Keep as historical snapshot, de-emphasize |
| `docs/runtime-smoke-test-installability.md` | KEEP | Foundation install/start evidence | Keep |
| `docs/runtime-smoke-test-onboarding.md` | KEEP | Foundation onboarding evidence | Keep |
| `docs/runtime-smoke-test.md` | ARCHIVE | Early broad MVP snapshot; superseded by focused foundation framing | Keep historical; de-emphasize |
| `docs/runtime-smoke-test-request-correlation.md` | ARCHIVE | Historical failed run in background mode; context is stale for product narrative | Keep historical; de-emphasize |
| `docs/runtime-smoke-test-object-transform.md` | FREEZE | Non-foundation breadth evidence | Keep |
| `docs/runtime-smoke-test-material.md` | FREEZE | Non-foundation breadth evidence | Keep |
| `docs/runtime-smoke-test-lighting.md` | FREEZE | Non-foundation breadth evidence | Keep |
| `docs/runtime-smoke-test-camera.md` | FREEZE | Non-foundation breadth evidence | Keep |
| `docs/runtime-smoke-test-render.md` | FREEZE | Non-foundation breadth evidence | Keep |
| `docs/runtime-smoke-test-validate.md` | FREEZE | Non-foundation breadth evidence | Keep |
| `docs/runtime-smoke-test-export.md` | FREEZE | Non-foundation breadth evidence | Keep |
| `docs/runtime-smoke-test-undo.md` | FREEZE | Non-foundation breadth evidence | Keep |
| `docs/runtime-smoke-test-scene-clear.md` | FREEZE | Non-foundation breadth evidence | Keep |
| `docs/runtime-smoke-test-batch-plan.md` | FREEZE | Non-foundation breadth evidence | Keep |
| `docs/runtime-smoke-test-batch-execute-dry-run.md` | FREEZE | Non-foundation breadth evidence | Keep |
| `docs/runtime-smoke-test-batch-execute-real.md` | FREEZE | Non-foundation breadth evidence | Keep |
| `examples/batch/basic-scene.json` | FREEZE | Useful for runtime tests; beyond immediate product promise | Keep |
| `examples/batch/invalid-*.json` | FREEZE | Safety/validation fixtures; not product entrypoint | Keep |
| `examples/prompts/README.md` | FREEZE | Creative prompt catalog is premature for current promise | Keep, de-emphasize |
| `IMPLEMENTATION_SUMMARY.md` | DELETE | Historical bootstrap doc from initial scaffold; stale/misleading | Delete after dependency check (no references found) |
| `exports/test_scene.glb` | DELETE | Generated artifact, not source-of-truth product file | Not tracked in git in this workspace; keep ignored locally |
| `exports/test_scene.fbx` | DELETE | Generated artifact, not source-of-truth product file | Not tracked in git in this workspace; keep ignored locally |
| `renders/preview.png` | DELETE | Generated artifact, not source-of-truth product file | Not tracked in git in this workspace; keep ignored locally |

## Minimal Foundation Path (Primary Product Path)

- `blendops --help`
- `blendops doctor`
- `bridge start/status/logs/stop`
- `scene inspect`
- `object create` (minimal)
- MCP server startup
- MCP tools: `list_operations`/`start_bridge`/`stop_bridge`/`get_bridge_logs`/`inspect_scene`/`create_object`
- Response envelope: `request_id` + `receipt`
- Bridge readiness/status/logs and addon main-thread dispatch
