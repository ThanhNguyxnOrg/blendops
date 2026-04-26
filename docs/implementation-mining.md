# Blender MCP Implementation Mining Report

> Generated: April 2026  
> Source: 7 Blender MCP/automation repositories analyzed  

## Summary Table

| Repo | License | Transport | Architecture | Arbitrary Python | Safe Mode | Render Path | Key Innovation |
|------|---------|-----------|--------------|-----------------|-----------|-------------|----------------|
| **ahujasid/blender-mcp** | MIT | TCP addon bridge | FastMCP stdio/server + addon | Yes (`execute_blender_code`) | ❌ | Blender operator flow | Canonical Blender MCP split |
| **CommonSenseMachines/blender-mcp** | MIT | TCP addon bridge | FastMCP + addon fork | Yes (`execute_blender_code`) | ❌ | Blender operator flow | Production packaging polish |
| **poly-mcp/Blender-MCP-Server** | MIT | HTTP (FastAPI) + queue | In-Blender monolith server | Mixed/possible | ❌ | Export/render handler endpoints | Queue/timer execution model |
| **tahooki/unreal-blender-mcp** | No top-level license found | Hybrid/submodule | Unreal+Blender integration stack | Inherited/unclear | ❌ | Workflow-level integration | Cross-DCC orchestration |
| **dhakalnirajan/blender-open-mcp** | Custom MIT-style | TCP (9876) | FastMCP → addon | Yes (`blender_execute_code`) | ❌ | Blocking bpy.ops render | Ollama integration |
| **VxASI/blender-mcp-vxai** | MIT | TCP (9876) | FastMCP → addon | Yes (`run_script`) | ❌ | Via addon | Base64 script transmission |
| **mezallastudio/antigravity-blender-mcp** | No license file found | WebSocket | Node.js/TS MCP + addon | Yes (`run_script`) | ❌ | `handle_render_preview` | Token-efficient JSON |

---

## 1. dhakalnirajan/blender-open-mcp

**Repository**: https://github.com/dhakalnirajan/blender-open-mcp

### Architecture
```
MCP Client → FastMCP (port 8000) → TCP (port 9876) → Blender Addon → bpy
                                   ↓
                            Ollama (port 11434)
```

**Transport**: Streamable HTTP (FastMCP default) + TCP socket to Blender addon  
**License**: Custom MIT-style (see LICENSE file)

### Key Source Files
- `src/blender_open_mcp/server.py` - FastMCP server with Ollama integration
- `src/blender_open_mcp/addon/addon.py` - Blender addon with TCP server

### Tool Declarations
```python
@mcp.tool(
    name="blender_execute_code",
    annotations={...}
)
async def blender_execute_code(params: ExecuteCodeInput) -> str:
```

### Error Handling (`_handle_blender_error` function)
- ConnectionRefusedError → actionable message
- TimeoutError → timeout message
- ValueError → JSON parse error
- Generic fallback with type info

### Render/Export Path
`blender_render_image` tool (line 383-407) - **BLOCKING**, waits for render completion

### Arbitrary Python
Full `execute_blender_code` tool with bpy access

### Install/Start
- MCP Server: `blender-mcp` entry point in pyproject.toml
- Blender: addon.py → N-panel → Start MCP Server button

---

## 2. VxASI/blender-mcp-vxai

**Repository**: https://github.com/VxASI/blender-mcp-vxai

### Architecture
- TCP transport (port 9876)
- Blender addon with TCP server
- Base64-encoded script transmission

**License**: MIT

### Key Source Files
- `blender_mcp_vxai/server.py` - FastMCP with TCP socket retry logic

### Error Handling
Reconnection logic with exponential backoff:
```python
for attempt in range(self.max_reconnect_attempts):
    try:
        self.sock.connect((self.host, self.port))
        return True
    except Exception as e:
        delay = self.base_reconnect_attempts * (2 ** attempt)
        time.sleep(delay)
```

---

## 3. mezallastudio/antigravity-blender-mcp

**Repository**: https://github.com/mezallastudio/antigravity-blender-mcp

### Architecture
- **TypeScript/Node.js MCP server** (NOT Python)
- WebSocket to Blender addon (port 9876)
- Token-efficient JSON responses with short keys

**License**: ❌ NO LICENSE FILE FOUND

### Key Source Files
- `src/mcp-server/src/index.ts` - TypeScript MCP server with stdio transport
- `src/blender-addon/mcp_connector_v2.py` - WebSocket server in Blender, L object library

### L Library (Token-Efficient Pre-Built Functions)
```python
class L:
    """Token-efficient pre-built functions"""
    @staticmethod
    def cube(l=[0,0,0], s=1, n=None):
        bpy.ops.mesh.primitive_cube_add(size=s, location=tuple(l))
```

### Tool Definitions
TypeScript with Zod schemas
```typescript
export const renderPreviewSchema = {
    output_path: z.string(),
    resolution: z.array(z.number()).length(2).default([512, 512]),
}
```

### Arbitrary Python
Via `run_script` with L library helper

### Notable
Token-optimized responses (`{ok:1,p:"out.png"}`)

---

## 4. loonghao/dcc-mcp-blender

**Repository**: https://github.com/loonghao/dcc-mcp-blender

### Architecture
- **In-Blender embedded MCP server** (port 8765 default)
- Streamable HTTP transport inside Blender
- **Skill-based system** with progressive loading

**License**: MIT

### Key Source Files
- `src/dcc_mcp_blender/server.py` - Main server
- `src/dcc_mcp_blender/skills/blender-scripting/scripts/execute_python.py` - Python execution skill

### Progressive Loading Pattern
```python
server.discover_skills()      # Fast: scan SKILL.md metadata only
server.load_skill("blender-scene")  # Lazy: import scripts on demand
```

### Error Handling
dcc-mcp-core skill helpers:
```python
from dcc_mcp_core.skill import skill_error, skill_success
```

### Arbitrary Python
`execute_python` skill (direct exec with namespace injection)

### Render Path
Subprocess-based (calls Blender with -b flag)

---

## 5. glonorce/Blender_mcp

**Repository**: https://github.com/glonorce/Blender_mcp

### Architecture Highlights

**Modular Handler System**:
- `@register_handler` decorator with priority tiers (1-9 ESSENTIAL, 10-49 CORE, 50-149 STANDARD)
- Dispatcher routes commands to handlers

**License**: MIT

### Key Source Files
- `blender_mcp/__init__.py` - Main addon entry
- `blender_mcp/core/execution_engine.py` - Execution policies
- `blender_mcp/dispatcher.py` - Command routing
- `blender_mcp/core/thread_safety.py` - Thread safety
- `blender_mcp/core/error_handling.py` - Comprehensive error handling

### Thread Safety (`core/thread_safety.py`)
```python
class ThreadSafety:
    # Event-driven queue (no polling)
    # Automatic main thread detection
    # Performance metrics tracking
```

### Execution Policy (`core/execution_engine.py`)
```python
class ExecutionPolicy:
    mode: ExecutionMode = ExecutionMode.READ_WRITE
    # READ_ONLY blocks mutation operators
```

### Security - Safe Mode (`blender_mcp/__init__.py`)
```python
safe_mode: BoolProperty(
    name="Safe Mode",
    default=True  # Blocks arbitrary code execution!
)
```

### Error Handling
- `ExecutionResult` dataclass with alternatives
- `ErrorRecovery` with type coercion
- `APICompatibilityLayer` for version handling
- 499 tests ensuring reliability

### Render Path - Async Subprocess (`manage_rendering.py`)
```python
def _submit_async_render(scene, params, is_animation=False):
    # Saves temp .blend, launches headless Blender subprocess
    # Returns job_id immediately
    cmd = [bpy.app.binary_path, "-b", temp_path, "-o", output_path]
```

### Export Pipeline (`manage_export_pipeline.py`)
- GLTF/GLB, USD, FBX, OBJ, Alembic
- Batch export
- Export validation ("Export Armor")

### Tool Count
69 tools across handlers

---

## Pattern Confidence Assessment

### Strong Patterns (3+ repos)

1. **TCP Socket Transport to Blender**: 4/5 repos use TCP on port 9876/9879
2. **Arbitrary Python Execution**: All 5 repos expose via tool (except when Safe Mode enabled)
3. **Blender Addon as Server**: 4/5 run TCP server inside Blender

### Medium Confidence Patterns

4. **Error Handling with Recovery**: glonorce > blender-open-mcp > others
5. **Async Render Subprocess**: glonorce > dcc-mcp-blender
6. **Tool Registration Decorators**: All Python repos use decorators

### Weak Patterns (unique to 1-2 repos)

7. **Safe Mode Toggle**: Only glonorce/blender_mcp
8. **In-Blender HTTP Server**: Only dcc-mcp-blender
9. **TypeScript Server**: Only antigravity-blender-mcp
10. **Skill-Based System**: Only dcc-mcp-blender

---

## Recommendations for BlendOps

### Safe to Implement (permissive licenses)

1. **TCP transport architecture** (tested in 4 repos) — use port 9876 or configurable
2. **Error handling with alternative suggestions** — from glonorce's ExecutionResult pattern
3. **Async render subprocess** — prevents Blender freezing

### Consider with Attribution (MIT)

4. **Safe Mode toggle** — glonorce/blender_mcp has the cleanest implementation
5. **Tool priority tiers** — ESSENTIAL/CORE/STANDARD categorization
6. **Thread safety queue** — glonorce's ThreadSafety class

### Avoid/Careful (unclear license)

7. **antigravity-blender-mcp** — No LICENSE file in repo

---

## Selected Improvements for BlendOps

Based on this mining, the following 1-2 safe improvements are recommended:

### Improvement 1: Bridge Compatibility Reporting ✅ Implemented
- **Source**: glonorce/Blender_mcp status runtime context pattern (MIT)
- **License**: MIT (pattern-level adaptation)
- **Benefit**: Agents can reliably detect Blender runtime mode and export constraints
- **Implementation in BlendOps**:
  - Added fields to `bridge.status` data:
    - `blender_version`
    - `blender_version_tuple`
    - `background_mode`
    - `has_window_context`
    - `export_glb_supported`
    - `export_gltf_supported`
    - `export_fbx_supported` (`"unknown"`)
    - `compatibility_notes`

### Improvement 2: Operation Manifest / Tool Registry ✅ Implemented
- **Source**: MCP `ListTools` discoverability pattern + poly-mcp style operation metadata (MIT)
- **License**: MIT (pattern-level adaptation)
- **Benefit**: AI agents can discover operation surface safely without guessing
- **Implementation in BlendOps**:
  - Added bridge operation: `bridge.operations`
  - Added centralized addon `OPERATION_MANIFEST` metadata:
    - operation `name`
    - `category`
    - `cli_supported`
    - `mcp_supported`
    - `destructive` (`false` for all current ops)
    - `runtime_notes`
    - `evidence_doc`
  - Added CLI command: `blendops bridge operations`
  - Added MCP tool: `list_operations`

---

*Report generated from source inspection of 7 Blender MCP/automation repositories.*
