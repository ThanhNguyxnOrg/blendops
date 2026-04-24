# BlendOps

**Safe Blender automation for AI agents: MCP tools, CLI workflows, scene inspection, preview, validation, and export.**

---

## What is BlendOps?

BlendOps is a **CLI-first, AI-safe workflow layer** for Blender automation. It provides:

- **MCP server** for AI agents (Claude, etc.)
- **CLI** for humans and developers
- **Blender bridge/addon** for executing typed commands in Blender
- **JSON schemas** for safe, validated operations
- **Scene inspection, dry-run, preview, undo, validation, and export**

BlendOps is **not** a generic "run arbitrary Python in Blender" tool. It's a practical, inspectable automation toolkit with safety built in.

---

## Why Not Just Arbitrary Blender Python?

Existing Blender automation approaches often expose arbitrary Python execution, which creates security and reliability risks for AI-driven workflows:

- **Security**: Arbitrary code execution is a vector for malicious or unintended operations
- **Reliability**: Untyped commands lead to runtime errors and unpredictable behavior
- **Inspectability**: No structured way to preview, validate, or undo operations
- **Workflow**: No CLI-first development experience or dry-run capabilities

BlendOps addresses these gaps with:

- **Typed command schemas** (JSON Schema / Zod)
- **Explicit confirmation** for destructive operations
- **Structured JSON responses** with corrective error messages
- **Scene inspection and validation presets**
- **Export readiness checks**
- **Undo support** (where Blender API allows)

---

## Architecture

```
CLI                          MCP Server
 ↓                              ↓
 └─→ Shared Schemas/Core ←─────┘
           ↓
    Blender Bridge/Addon
           ↓
    Blender Python API
```

### Components

- **`apps/cli/`** - Command-line interface with subcommands
- **`apps/mcp-server/`** - MCP server exposing tools for AI agents
- **`apps/blender-addon/`** - Blender addon/bridge (Python) for local command execution
- **`packages/core/`** - Shared core logic and client for bridge communication
- **`packages/schemas/`** - JSON Schema / Zod definitions for all operations
- **`examples/`** - Example workflows and AI agent prompts
- **`docs/`** - Documentation and prior-art analysis

---

## Prior Art & Differentiation

Several Blender MCP projects already exist. BlendOps is **not** trying to be just another generic Blender MCP server.

**BlendOps differentiates by:**

- **CLI-first development** - Build and test workflows without AI agents
- **Typed operations** - No arbitrary Python execution by default
- **Safety model** - Confirm flags, dry-run design, structured validation
- **Inspectability** - Scene inspection, preview, validation presets
- **Export readiness** - Validate assets before export (polycount, materials, naming, etc.)
- **Workflow focus** - Undo, diff, corrective error messages

See [`docs/prior-art.md`](./docs/prior-art.md) for detailed comparison with existing projects.

---

## Installation

> **Note**: MVP is under active development. Installation instructions will be added as components stabilize.

### Prerequisites

- Node.js 18+ (for CLI and MCP server)
- Python 3.10+ (for Blender addon)
- Blender 3.6+ (for bridge execution)

### Install CLI

```bash
# Coming soon
npm install -g blendops
```

### Install Blender Addon

```bash
# Coming soon
# Copy apps/blender-addon to Blender addons directory
```

### Configure MCP Server

```json
{
  "mcpServers": {
    "blendops": {
      "command": "npx",
      "args": ["blendops-mcp"],
      "env": {
        "BLENDER_BRIDGE_URL": "http://localhost:8765"
      }
    }
  }
}
```

---

## Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/blendops.git
cd blendops

# Install dependencies
npm install

# Build packages
npm run build

# Start Blender bridge (in Blender)
# Open Blender → Scripting → Run bridge script

# Test CLI
npm run cli -- scene inspect

# Test MCP server
npm run mcp-server
```

---

## CLI Examples

### Scene Inspection

```bash
blendops scene inspect
```

**Output:**
```json
{
  "ok": true,
  "operation": "scene_inspect",
  "message": "Scene inspection complete",
  "data": {
    "objects": [
      {
        "name": "Cube",
        "type": "MESH",
        "location": [0, 0, 0],
        "rotation": [0, 0, 0],
        "scale": [1, 1, 1],
        "materials": ["Material"]
      }
    ],
    "cameras": ["Camera"],
    "lights": ["Light"],
    "materials": ["Material"],
    "active_camera": "Camera"
  },
  "warnings": [],
  "next_steps": ["Use 'blendops object create' to add objects"]
}
```

### Create Object

```bash
blendops object create --type cube --name crate_01 --location 0,0,1 --scale 1,1,1
```

### Apply Material

```bash
blendops material create --name red_plastic --color "#ff0000" --roughness 0.5
blendops material apply --object crate_01 --material red_plastic
```

### Validate Scene

```bash
blendops validate --preset game-asset
```

### Export

```bash
blendops export --format glb --output ./exports/scene.glb
```

---

## MCP Tools

The MCP server exposes the following tools for AI agents:

- `inspect_scene()` - Get structured scene data
- `clear_scene(confirm: boolean)` - Clear all objects (requires confirmation)
- `create_object(type, name, location, rotation, scale)` - Create mesh object
- `transform_object(name, location?, rotation?, scale?)` - Transform existing object
- `create_material(name, color, roughness?, metallic?)` - Create PBR material
- `apply_material(object_name, material_name)` - Apply material to object
- `setup_lighting(preset)` - Set up lighting (studio, outdoor, etc.)
- `set_camera(target?, location?, rotation?, distance?)` - Configure camera
- `render_preview(width?, height?)` - Render preview image
- `validate_scene(preset)` - Run validation checks
- `export_asset(format, path)` - Export scene to file
- `undo_last()` - Undo last operation

---

## MVP Scope

The first milestone focuses on proving the end-to-end flow:

1. ✅ Scaffold repository structure
2. ⏳ Implement `blendops scene inspect` (CLI + MCP)
3. ⏳ Implement `blendops object create` (CLI + MCP)
4. ⏳ Implement basic validation preset
5. ⏳ Document install and dev workflow

**Not in MVP:**
- Full command set (lighting, camera, materials)
- Dry-run implementation
- Undo history
- Advanced validation presets
- Export format support beyond GLB

See [`TODO.md`](./TODO.md) for detailed implementation checklist.

---

## Safety Requirements

- ❌ **No arbitrary Python execution** in MVP
- ✅ **Typed command schemas** (JSON Schema / Zod)
- ✅ **Explicit confirmation** for destructive operations (`--confirm` flag)
- ✅ **Structured JSON responses** with corrective error messages
- ✅ **Dry-run design** (architecture support, implementation TBD)
- ✅ **Scene inspection** before and after operations

---

## Roadmap

- [ ] MVP: `scene inspect` and `object create` working end-to-end
- [ ] Add material, lighting, camera commands
- [ ] Implement dry-run mode
- [ ] Add undo history
- [ ] Expand validation presets (game-asset, 3d-print, animation)
- [ ] Support multiple export formats (FBX, STL, USD)
- [ ] Add scene diff visualization
- [ ] Performance optimization for large scenes

---

## Contributing

Contributions welcome! Please see [`CONTRIBUTING.md`](./CONTRIBUTING.md) for guidelines.

---

## License

MIT License - see [`LICENSE`](./LICENSE) for details.

---

## Acknowledgments

BlendOps is inspired by existing Blender automation projects. See [`docs/prior-art.md`](./docs/prior-art.md) for detailed analysis and attribution.
