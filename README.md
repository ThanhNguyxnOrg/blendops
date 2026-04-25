# BlendOps

<p align="left">
  <img alt="MVP Status" src="https://img.shields.io/badge/status-MVP%20in%20progress-0ea5e9">
  <img alt="Safety" src="https://img.shields.io/badge/safety-no%20arbitrary%20python-success">
  <img alt="CLI First" src="https://img.shields.io/badge/workflow-CLI--first-7c3aed">
  <img alt="License" src="https://img.shields.io/badge/license-MIT-16a34a">
</p>

**Safe Blender automation for AI agents: MCP tools, CLI workflows, scene inspection, validation, and export readiness.**

BlendOps is a **workflow layer** on top of Blender automation. It is not a “run arbitrary Python in Blender” tool.

---

## Why BlendOps?

Most Blender+AI integrations focus on direct execution power. BlendOps focuses on **safe, typed, inspectable workflows**:

- ✅ Typed command schemas (Zod / JSON schema-compatible)
- ✅ Structured JSON responses for every command
- ✅ CLI-first development loop (humans can test flows before agent use)
- ✅ MCP wrapper over same core operations
- ❌ No arbitrary Python execution exposed by default

---

## Current Status (v0.1)

### Implemented vertical slices

- `blendops bridge status`
- `blendops scene inspect`
- `blendops object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1`
- `blendops object transform --name test_cube --location 1,0,1`
- `blendops material create --name red_plastic --color "#ff0000" --roughness 0.5 --metallic 0`
- `blendops material apply --object test_cube --material red_plastic`
- `blendops lighting setup --preset studio --target test_cube`

### MCP tools implemented

- `inspect_scene()`
- `create_object(type, name, location?, rotation?, scale?)`
- `transform_object(name, location?, rotation?, scale?)`
- `create_material(name, color, roughness?, metallic?)`
- `apply_material(object_name, material_name)`
- `setup_lighting(preset, target?)`

### Planned (not implemented yet)

- `clear_scene(confirm: boolean)`
- `camera.set` / `render.preview`
- `validate_scene(preset)`
- `export_asset(format, path)`
- `undo_last()`

---

## Architecture

```text
CLI                          MCP Server
 ↓                              ↓
 └─→ Shared Schemas/Core ←─────┘
           ↓
    Blender Bridge/Addon
           ↓
    Blender Python API
```

### Repo layout

```text
blendops/
  apps/
    cli/
    mcp-server/
    blender-addon/
  packages/
    core/
    schemas/
  docs/
  examples/
```

---

## Quick Start (Dev)

### 1) Clone + install

```bash
git clone https://github.com/ThanhNguyxnOrg/blendops.git
cd blendops
npm install
```

### 2) Clean, typecheck + build

```bash
npm run clean
npm run typecheck
npm run build
```

### 3) Start Blender bridge addon

Load and enable addon from:

- `apps/blender-addon/blendops_addon`

### 4) Run CLI examples

```bash
npm run cli -- bridge status
npm run cli -- scene inspect
npm run cli -- object create --type cube --name test_cube --location 0,0,1 --scale 1,1,1
npm run cli -- object transform --name test_cube --location 1,0,1
npm run cli -- material create --name red_plastic --color "#ff0000" --roughness 0.5 --metallic 0
npm run cli -- material apply --object test_cube --material red_plastic
npm run cli -- lighting setup --preset studio --target test_cube
```

---

## Response Envelope

All commands return this structure:

```json
{
  "ok": true,
  "operation": "scene.inspect",
  "message": "Scene inspection complete",
  "data": {},
  "warnings": [],
  "next_steps": []
}
```

---

## Prior Art & Differentiation

BlendOps is inspired by existing Blender MCP projects but intentionally takes a different stance:

- **CLI-first + MCP-second**
- **Safety-first contracts**
- **No default arbitrary execution path**

See detailed analysis:
- [`docs/prior-art.md`](./docs/prior-art.md)

---

## Documentation

- [Manual test guide](./docs/manual-test.md)
- [Agent eval prompts](./docs/evals.md)
- [Runtime smoke test: object transform](./docs/runtime-smoke-test-object-transform.md)
- [Runtime smoke test: material slice](./docs/runtime-smoke-test-material.md)
- [Contributing guide](./CONTRIBUTING.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Security policy](./SECURITY.md)
- [Support](./SUPPORT.md)
- [Project TODO](./TODO.md)

---

## Contributing

Contributions are welcome. Start here:

- [`CONTRIBUTING.md`](./CONTRIBUTING.md)

Please keep changes incremental and align with the safety model.

---

## License

MIT — see [`LICENSE`](./LICENSE).
