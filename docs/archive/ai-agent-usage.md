# 🧠 AI-Agent Usage Guide

> 📚 Docs: [Index](./README.md) · [Install](./install.md) · [AI usage](./ai-agent-usage.md) · [Manual test](./manual-test.md) · [Observability](./observability.md)

This guide describes how AI agents should use BlendOps safely and deterministically across MCP and CLI surfaces.

## 🛡️ Safety rules

- Use typed BlendOps tools/commands only
- Never request arbitrary Python execution (BlendOps does not expose arbitrary Blender CLI flags or Python to agents)
- Start bridge first, then verify readiness (`bridge.status` / `start_bridge` follow-up)
- Do not wait for Blender GUI process exit after successful bridge start; GUI remaining open is expected
- Call `list_operations` before guessing tool availability
- Inspect scene before destructive or stateful edits
- `scene.clear` is destructive and requires exact confirmation token `CLEAR_SCENE`
- Never call `scene.clear` unless the user explicitly requests clearing the scene
- Prefer `scene.clear` with `dry_run: true` before executing the real clear to preview what would be removed
- Use `undo_last` only when reverting the latest typed operation is intended
- Treat `No undo step available` as safe failure (not a successful undo)
- Validate before render/export when applicable
- Use GUI bridge for Blender 4.2 GLB/GLTF workflows
- Preserve `request_id` + `receipt` for correlation
- Do not commit generated artifacts (`exports/`, `renders/`, `.tmp/`)
- Use `plan_batch` for multi-step requests before executing individual typed operations
- Inspect `validation_errors` from `batch.plan` before executing any individual typed operation
- Never treat `batch.plan` as execution; it is plan-only and never mutates scene
- Preserve `plan_fingerprint` from `batch.plan` responses for future real execution correlation
- `execute_batch` supports dry-run preview and a guarded first real execution slice (non-destructive operations only)
- AI should run `execute_batch` with `dry_run: true` first, then preserve `plan_fingerprint` + `dry_run_id`
- Real execution requires all three gates: `confirm: "EXECUTE_BATCH"`, `dry_run_id`, and `plan_fingerprint`
- Real execution requires `dry_run_id` to exist in the current bridge session's in-memory registry
- Bridge restart invalidates all prior `dry_run_id` values; agents must run dry-run and real execution in the same bridge session
- AI must ensure real batch steps are non-destructive only in first release (`scene.inspect`, `object.create`, `material.create`, `material.apply`, `lighting.setup`, `camera.set`, `validate.scene`)
- AI must not include `scene.clear`, `undo.last`, `render.preview`, `export.asset`, bridge lifecycle/status, or nested batch operations in real batch execution
- On fingerprint mismatch, missing gates, or missing registry entry, execution is rejected before mutation
- Real execution behavior must satisfy the [batch execution safety contract](./batch-execute-safety-contract.md)

## 🚀 Recommended AI workflow

1. Run install checks: `npm run doctor`
2. Prefer automated UAT runner before feature changes: `npm run uat` (or `powershell -ExecutionPolicy Bypass -File scripts/run-uat.ps1`)
3. Start bridge (`start_bridge`)
4. Check capabilities (`list_operations`)
5. Inspect scene (`inspect_scene`)
6. Apply typed operations
7. Validate (`validate_scene`)
8. Render/export (`render_preview` / `export_asset`)
9. Collect logs on failure (`get_bridge_logs`)
10. Stop bridge (`stop_bridge`) when done

For full smoke coverage, agents should use the UAT runner instead of manually orchestrating each step.

Agent command preference:
- Prefer `blendops` command if installed (`npm link`)
- Fallback to `node apps/cli/dist/index.js` when `blendops` is not linked
- Use MCP config examples from [MCP Setup Guide](./mcp-setup.md)
- Never use raw Blender CLI/Python unless explicitly working on bridge lifecycle internals.

## 🧠 MCP tool flow

AI should call `start_bridge` first when using MCP.
AI should call `list_operations` before guessing tools.

### MCP tools (supported)

- `start_bridge`
- `stop_bridge`
- `get_bridge_logs`
- `list_operations`
- `inspect_scene`
- `clear_scene` (requires `confirm: "CLEAR_SCENE"`)
- `undo_last`
- `create_object`
- `transform_object`
- `create_material`
- `apply_material`
- `setup_lighting`
- `set_camera`
- `render_preview`
- `validate_scene`
- `export_asset`
- `plan_batch` (plan-only validation; does not execute)
- `execute_batch` (dry-run preview + guarded first real execution slice with mandatory safety gates)

### Minimal MCP flow

- `start_bridge`
- `list_operations`
- `inspect_scene`

## 🧰 CLI fallback flow

When MCP integration is unavailable, use direct CLI:

Preferred (after `npm link`):

```bash
blendops bridge start --mode gui --verbose
blendops bridge status --verbose
blendops bridge operations --verbose
blendops scene inspect --verbose
blendops validate scene --preset basic --verbose
blendops bridge stop
```

Fallback (node path):

```bash
node apps/cli/dist/index.js bridge start --mode gui --verbose
node apps/cli/dist/index.js bridge status --verbose
node apps/cli/dist/index.js bridge operations --verbose
node apps/cli/dist/index.js scene inspect --verbose
node apps/cli/dist/index.js validate scene --preset basic --verbose
node apps/cli/dist/index.js bridge stop
```

For long JSON outputs, redirect to `.tmp/stabilize/*.json` and summarize only key fields (`ok`, `operation`, `request_id`, `warnings`, `next_steps`) instead of pasting full payloads.

## 🎛️ Bridge lifecycle

Primary: automated managed bridge lifecycle (`bridge start --mode gui`).

```bash
node apps/cli/dist/index.js bridge start --mode gui --verbose
node apps/cli/dist/index.js bridge status --verbose
node apps/cli/dist/index.js bridge logs --tail 120
node apps/cli/dist/index.js bridge stop
```

A successful `bridge start` returns `ok: true` and exits cleanly. Blender GUI should remain open while bridge serves commands.

If `bridge start` outputs `ok: true` but does not return control, that is a process detachment bug.

## 🧩 Blender addon fallback

If `start_bridge` fails, surface fallback steps to the user:

```txt
Blender → Edit → Preferences → Add-ons → Install...
Select: apps/blender-addon/blendops_addon
Enable: BlendOps Bridge
Confirm: node apps/cli/dist/index.js bridge status --verbose
```

Manual addon install is fallback only; automated bridge start remains primary.

## 🔎 request_id + receipt correlation

Each response can include:

- top-level `request_id`
- top-level `receipt`
  - `receipt.request_id`
  - `receipt.operation`
  - `receipt.ok`
  - `receipt.duration_ms`

Agents should retain and surface these fields in traces and troubleshooting summaries.

## 🧯 Error recovery

1. Capture structured failure (`ok: false`)
2. Read `message`, `warnings`, `next_steps`
3. Run `get_bridge_logs` (MCP) or `bridge logs` (CLI)
4. Re-run with corrected inputs
5. If bridge remains unhealthy, stop/start bridge
6. If startup still fails, use manual addon fallback and report steps

## Next step

- Continue with [Manual test guide](./manual-test.md) for reproducible runtime validation.
