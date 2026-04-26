# AI-Agent Usage Guide

This guide describes how AI agents should use BlendOps safely and deterministically.

## Safety rules

- Never request arbitrary Python execution
- Start/check bridge before issuing scene operations
- Use typed operations only
- Call `bridge.operations` or MCP `list_operations` before guessing capabilities
- Inspect scene state before modifying it
- Read `next_steps` whenever an operation fails
- Validate scene before render/export when applicable
- Use GUI bridge for Blender 4.2 GLB/GLTF workflows
- Do not commit generated artifacts (`exports/`, `renders/`, `.tmp/`)
- Use `request_id` + `receipt` for correlation in logs and responses
- Stop managed bridge when done

## Recommended AI-agent workflow

1. `bridge.start` (or manual fallback if bootstrap fails)
2. `bridge.status`
3. `bridge.operations`
4. `scene.inspect`
5. perform typed operations (`object.*`, `material.*`, `lighting.setup`, `camera.set`)
6. `validate.scene`
7. `render.preview` or `export.asset`
8. `bridge.logs` for troubleshooting
9. `bridge.stop`

## Minimal inspect flow

CLI:

```bash
node apps/cli/dist/index.js bridge start --mode gui --verbose
node apps/cli/dist/index.js bridge status --verbose
node apps/cli/dist/index.js bridge operations --verbose
node apps/cli/dist/index.js scene inspect --verbose
```

MCP tool flow:

- `start_bridge`
- `list_operations`
- `inspect_scene`

## Create red cube flow

CLI:

```bash
node apps/cli/dist/index.js object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1
node apps/cli/dist/index.js material create --name red_plastic --color "#ff0000" --roughness 0.5 --metallic 0
node apps/cli/dist/index.js material apply --object test_cube --material red_plastic
node apps/cli/dist/index.js lighting setup --preset studio --target test_cube
node apps/cli/dist/index.js camera set --target test_cube --distance 5 --focal-length 50
```

MCP equivalent:

- `create_object`
- `create_material`
- `apply_material`
- `setup_lighting`
- `set_camera`

## Render/export flow

```bash
node apps/cli/dist/index.js validate scene --preset game_asset --verbose
node apps/cli/dist/index.js render preview --output renders/preview.png --width 512 --height 512 --samples 16 --verbose
node apps/cli/dist/index.js export asset --format glb --output exports/test_scene.glb --verbose
```

For Blender 4.2 GLB/GLTF export validation, use GUI bridge mode.

## Error recovery flow

1. Capture structured failure response (`ok: false`)
2. Read `message`, `warnings`, and `next_steps`
3. Check bridge health:

```bash
node apps/cli/dist/index.js bridge status --verbose
node apps/cli/dist/index.js bridge logs --tail 120
```

4. Re-run with corrected args
5. If bridge is unhealthy, restart with `bridge.stop` then `bridge.start`

## Correlation guidance

Each response can include:

- top-level `request_id`
- top-level `receipt`
  - `receipt.request_id`
  - `receipt.operation`
  - `receipt.ok`
  - `receipt.duration_ms`

Agents should preserve and surface these fields in traces and troubleshooting output.
