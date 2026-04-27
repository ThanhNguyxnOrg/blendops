# 🧠 AI-Agent Usage Guide

> 📚 Docs: [Index](./README.md) · [Install](./install.md) · [AI usage](./ai-agent-usage.md) · [Manual test](./manual-test.md) · [Observability](./observability.md)

This guide describes how AI agents should use BlendOps safely and deterministically across MCP and CLI surfaces.

## 🛡️ Safety rules

- Use typed BlendOps tools/commands only
- Never request arbitrary Python execution
- Start bridge first, then verify readiness
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

## 🚀 Recommended AI workflow

1. Start bridge (`start_bridge`)
2. Check capabilities (`list_operations`)
3. Inspect scene (`inspect_scene`)
4. Apply typed operations
5. Validate (`validate_scene`)
6. Render/export (`render_preview` / `export_asset`)
7. Collect logs on failure (`get_bridge_logs`)
8. Stop bridge (`stop_bridge`) when done

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

### Minimal MCP flow

- `start_bridge`
- `list_operations`
- `inspect_scene`

## 🧰 CLI fallback flow

When MCP integration is unavailable, use direct CLI:

```bash
node apps/cli/dist/index.js bridge start --mode gui --verbose
node apps/cli/dist/index.js bridge operations --verbose
node apps/cli/dist/index.js scene inspect --verbose
node apps/cli/dist/index.js validate scene --preset basic --verbose
node apps/cli/dist/index.js bridge stop
```

## 🎛️ Bridge lifecycle

Primary: automated managed bridge lifecycle (`bridge start --mode gui`).

```bash
node apps/cli/dist/index.js bridge start --mode gui --verbose
node apps/cli/dist/index.js bridge status --verbose
node apps/cli/dist/index.js bridge logs --tail 120
node apps/cli/dist/index.js bridge stop
```

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
