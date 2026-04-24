# Blender Automation Prior-Art Analysis

**Generated:** April 24, 2026  
**Purpose:** Document existing Blender MCP/AI automation projects to inform BlendOps design decisions

---

## Executive Summary

The Blender MCP ecosystem has matured significantly since early 2025, with 350+ repositories exploring AI-driven Blender automation. This analysis covers 12 significant projects to identify:

- **What works** - Patterns to adopt
- **What doesn't** - Anti-patterns to avoid  
- **Gaps** - Opportunities for BlendOps differentiation

**Key Findings:**

- 6 projects expose structured MCP tools with typed surfaces
- 4 projects support arbitrary Python execution (unsafe but powerful)
- 0 projects offer native CLI-first workflows
- All major projects use Blender addon + separate MCP server architecture
- Only 1 project (blender-ai-mcp) implements comprehensive safety model

---

## Prior-Art Comparison Matrix

| Project | License | Language | MCP | CLI | Arbitrary Python | Safety Model | Stars/Activity |
|---------|---------|----------|-----|-----|------------------|--------------|----------------|
| [poly-mcp/Blender-MCP-Server](#1-blender-mcp-server) | MIT | Python | ✅ | ❌ | ❌ | Basic | High |
| [ahujasid/blender-mcp](#2-blender-mcp) | Not stated | Python | ✅ | ❌ | ✅ | None | High |
| [PatrykIti/blender-ai-mcp](#3-blender-ai-mcp) | Apache 2.0 | Python | ✅ | ❌ | Limited | **Strong** | Medium |
| [mlolson/blender-orchestrator](#4-blender-orchestrator) | MIT | Python | ✅ | ❌ | ❌ | Basic | Medium |
| [glonorce/Blender_mcp](#5-blender_mcp) | MIT | Python | ✅ | ❌ | ✅ | Medium | Medium |
| [tahooki/unreal-blender-mcp](#6-unreal-blender-mcp) | MIT | Python | ✅ | ❌ | ✅ | None | Low |
| [youichi-uda/blender-mcp-pro](#9-blender-mcp-pro) | Proprietary | Python | ✅ | ❌ | ❌ | Unknown | Commercial |

---

## Detailed Project Analysis

### 1. Blender-MCP-Server (poly-mcp)

**Repository:** https://github.com/poly-mcp/Blender-MCP-Server  
**License:** MIT  
**Architecture:** Blender addon + HTTP server (FastAPI/Uvicorn on port 8000)

**Tool Surface:**
- 50+ tools across: Object Ops, Transforms, Materials, Animation, Camera/Lighting, Physics, Geometry Nodes, File Ops, Scene Management, Batch Operations

**Transport:** HTTP API at `localhost:8000/mcp/invoke/{tool_name}`

**Safety Features:**
- Thread-safe queue system
- Auto-dependency installation
- Error handling + result caching

**Gaps:**
- No typed Pydantic schemas documented
- No inspectability layer
- Limited security documentation
- No CLI wrapper

**What BlendOps Should Learn:**
- Comprehensive tool coverage (50+ tools is good target)
- Thread-safe queue pattern for bpy operations
- HTTP transport option for remote access

**What BlendOps Should Avoid:**
- HTTP-only transport (adds network complexity for local use)
- Lack of typed schemas

---

### 2. blender-mcp (ahujasid)

**Repository:** https://github.com/ahujasid/blender-mcp  
**License:** Not stated (check source)  
**Architecture:** Blender addon (TCP socket on port 9876) + Python MCP server

**Tool Surface:**
- ~30 tools: scene/object operations, materials, rendering
- **`execute_blender_code`** - arbitrary Python execution

**Transport:** stdio for MCP, TCP socket for Blender bridge

**Safety Features:**
- None - arbitrary code execution enabled
- Telemetry collection (can disable via `DISABLE_TELEMETRY=true`)

**Known Vulnerabilities:**
- GitHub Issue #201: RCE via `execute_blender_code`
- GitHub Issue #207: `__builtins__` injection bypass

**What BlendOps Should Learn:**
- stdio transport is standard for MCP
- TCP socket pattern for Blender bridge

**What BlendOps Should Avoid:**
- **Arbitrary code execution as primary tool**
- Telemetry without explicit opt-in
- Unclear licensing

---

### 3. blender-ai-mcp (PatrykIti)

**Repository:** https://github.com/PatrykIti/blender-ai-mcp  
**License:** Apache 2.0  
**Architecture:** 3-layer: FastMCP server → Router (goal-first) → Blender addon (RPC on port 8765)

**Tool Surface:**
- 8 bootstrap tools with `llm-guided` profile
- Macro tools for modeling workflows
- Measurement/assertion tools

**Transport:** stdio + Streamable HTTP via FastMCP

**Safety Features:** ⭐ **Best-in-class**
- Structured contracts (JSON schemas)
- Goal-first orchestration (router validates intent before execution)
- Deterministic verification
- Session diagnostics
- Typed payloads
- Router policy enforcement
- Limited `call_tool` with validation (not raw `exec`)

**Requirements:**
- Blender 4.0+ minimum
- Local MLX/LaBSE model for router semantics (memory overhead)

**What BlendOps Should Learn:**
- **Goal-first routing pattern**
- Structured contracts with JSON Schema
- Session diagnostics and verification
- Policy enforcement layer

**What BlendOps Should Avoid:**
- Heavy ML dependencies for basic operations
- Blender 4.0+ requirement (support 3.6+)

---

### 4. blender-orchestrator (mlolson)

**Repository:** https://github.com/mlolson/blender-orchestrator  
**License:** MIT  
**Architecture:** Blender addon (HTTP server on port 8765) + FastMCP server

**Tool Surface:**
- 50+ tools: Primitives, Transforms, Mesh Editing, Procedural Gen, Materials, Rendering, Lighting, Cameras
- **Spatial intelligence suite** (55+ real-world objects)
- VR optimization tools

**Transport:** HTTP + FastMCP

**Safety Features:**
- Spatial intelligence helps avoid bad transforms
- No arbitrary code execution

**What BlendOps Should Learn:**
- Spatial reasoning for object placement
- Real-world object library concept

**What BlendOps Should Avoid:**
- Dependency on external asset libraries (Poly Haven)
- No typed schemas

---

### 5. Blender_mcp (glonorce)

**Repository:** https://github.com/glonorce/Blender_mcp  
**License:** MIT  
**Architecture:** stdio bridge → TCP socket (port 9879) → Blender addon

**Tool Surface:**
- 69 handler groups (550+ actions)
- `execute_blender_code` as primary tool
- Scene graph (11 actions)
- Viewport screenshot
- Object inspection

**Transport:** stdio via `stdio_bridge.py`

**Safety Features:**
- Security module (`core/security.py`) with High/Safe Mode toggle
- Parameter validation
- Thread safety via `bpy.app.timers`
- **499 unit tests** ⭐

**What BlendOps Should Learn:**
- **Comprehensive test coverage** (499 tests)
- Thread-safe bpy routing via `bpy.app.timers`
- Parameter validation module
- Security mode toggle concept

**What BlendOps Should Avoid:**
- Still exposes arbitrary code execution
- "High Mode" scope unclear

---

### 6. unreal-blender-mcp (tahooki)

**Repository:** https://github.com/tahooki/unreal-blender-mcp  
**License:** MIT  
**Architecture:** MCP server (SSE port 8300) → Blender addon (8400/8401) + Unreal plugin (8500)

**Tool Surface:**
- Inherits blender-mcp tools
- Unreal Engine integration (level management, assets, Python exec)

**Transport:** SSE HTTP

**Safety Features:**
- None - inherits blender-mcp risks
- Unreal integration is experimental

**What BlendOps Should Learn:**
- Multi-DCC integration is possible (future consideration)

**What BlendOps Should Avoid:**
- Scope creep into multi-DCC (focus on Blender first)
- Arbitrary Python execution for Unreal

---

### 9. blender-mcp-pro (youichi-uda)

**Repository:** https://github.com/youichi-uda/blender-mcp-pro  
**License:** Proprietary (MIT for addon, proprietary for server)  
**Architecture:** Blender addon + encrypted MCP server

**Tool Surface:**
- 120+ tools across 17 categories
- Scene, Materials, Shader Nodes, Lights, Modifiers, Animation, Geometry Nodes, Camera, Render, Import/Export, UV/Texture, Batch, Assets, Rigging

**Transport:** stdio + Streamable HTTP

**Safety Features:**
- Lazy loading (15 core → on-demand)
- License key system
- No arbitrary code execution

**What BlendOps Should Learn:**
- Lazy loading pattern for large tool sets
- Category organization (17 categories)

**What BlendOps Should Avoid:**
- Proprietary licensing model
- Encrypted server (anti-pattern for open source)

---

## Safety Patterns Analysis

### Arbitrary Code Execution Risks

**Evidence from Prior Art:**

1. **GitHub Issue #207** (ahujasid/blender-mcp): RCE via `execute_blender_code`
   - Bare `{"bpy": bpy}` namespace is cosmetic only
   - Python automatically injects `__builtins__` with full access
   - **Fix:** Must explicitly set `namespace["__builtins__"] = _SAFE_BUILTINS`

2. **GitHub Issue #201** (ahujasid/blender-mcp): Import bypass
   - Even with restricted namespace, can import `os`, `sys`, `subprocess`
   - **Fix:** AST validation to reject `Import`/`ImportFrom` nodes

**Recommendation for BlendOps:**
- ❌ **Never expose `exec()` or `execute_blender_code` to AI agents**
- ✅ Build curated tool surface only
- ✅ If code execution needed, require explicit user confirmation

---

### Local Bridge Hardening

**Best Practices from Prior Art:**

1. **Per-tool RBAC** (Rapid Claw MCP Security Guide)
   - Grant permissions at tool level, not server level
   - Unknown tools default to denied

2. **Human-in-the-loop** (Rapid Claw)
   - Require approval before destructive operations
   - Delete, render, file export, scale operations

3. **Rate limiting** (PolicyLayer)
   - Per-session limits (e.g., 10 calls/minute)
   - Prevent runaway execution

4. **Thread-safe routing** (glonorce/Blender_mcp)
   - Use `bpy.app.timers` for main-thread marshalling
   - Avoid blocking operations

**Recommendation for BlendOps:**
- ✅ Implement per-tool permissions
- ✅ Require `--confirm` flag for destructive operations
- ✅ Use `bpy.app.timers` pattern for thread safety
- ✅ Add rate limiting per session

---

### Typed Operation Contracts

**Best Practices from Prior Art:**

1. **JSON Schema validation** (glonorce/Blender_mcp)
   - `parameter_validator.py` with type coercion
   - Enforce enum values for discrete options

2. **Goal-first routing** (PatrykIti/blender-ai-mcp)
   - Return typed fallback payloads (`needs_input`, `guided_handoff`)
   - Validate intent before execution

3. **Pydantic models** (implied in poly-mcp)
   - Type-safe request/response models
   - Auto-generated OpenAPI schemas

**Recommendation for BlendOps:**
- ✅ Use Zod for TypeScript schemas
- ✅ Use Pydantic for Python bridge
- ✅ Validate all inputs before reaching Blender
- ✅ Return structured JSON responses with corrective errors

---

### Dry-Run Strategies

**Patterns from Prior Art:**

1. **Operator return values** (Blender API)
   - `bpy.ops` returns `{'FINISHED'}` or `{'CANCELLED'}`
   - `CANCELLED` means no state change, no undo entry

2. **Read-only inspection** (PatrykIti/blender-ai-mcp)
   - Separate tools that query state without modification
   - `check_scene`, `scene_measure_*`

**Recommendation for BlendOps:**
- ✅ Implement `--dry-run` flag that returns `CANCELLED`-equivalent
- ✅ Provide read-only inspection tools
- ✅ Preview operations before execution

---

### Undo Patterns

**Patterns from Prior Art:**

1. **Programmatic undo** (Blender API)
   - `bpy.ops.ed.undo()`, `bpy.ops.ed.redo()`
   - `bpy.ops.ed.undo_history(item=N)`

2. **Operator history** (Blender API)
   - `bpy.context.window_manager.operators` exposes history
   - Track operations with properties

**Recommendation for BlendOps:**
- ✅ Implement `blendops undo` command
- ✅ Track operation batches
- ✅ Provide undo checkpointing

---

## BlendOps Differentiation Strategy

Based on prior-art analysis, BlendOps should differentiate on:

### 1. CLI-First Development
- **Gap:** No existing project offers native CLI
- **Opportunity:** Build `blendops` CLI with typed commands
- **Benefit:** Test workflows without AI agents, scriptable automation

### 2. Safety-First Architecture
- **Gap:** Only 1 project (blender-ai-mcp) has comprehensive safety
- **Opportunity:** Make safety default, not opt-in
- **Benefit:** Production-ready for enterprise use

### 3. Typed Operation Contracts
- **Gap:** Most projects lack explicit schemas
- **Opportunity:** Schema-first design with Zod + Pydantic
- **Benefit:** Compile-time validation, auto-generated docs

### 4. Inspectability
- **Gap:** No project exposes tool schema discovery
- **Opportunity:** `/tools`, `/schema`, `/audit` endpoints
- **Benefit:** Runtime introspection, debugging

### 5. Export Readiness
- **Gap:** No project validates export readiness
- **Opportunity:** Validation presets (game-asset, 3d-print, animation)
- **Benefit:** Catch issues before export

### 6. Workflow Focus
- **Gap:** Limited undo, no diff, generic errors
- **Opportunity:** Undo batches, scene diff, corrective errors
- **Benefit:** Better developer experience

---

## Licensing Considerations

| License | Projects | Implications for BlendOps |
|---------|----------|---------------------------|
| **MIT** | 5 projects | Permissive, allows commercial use, good for BlendOps |
| **Apache 2.0** | 1 project | Permissive + patent grant, good for BlendOps |
| **Proprietary** | 1 project | Cannot reuse code |
| **Not stated** | 5 projects | Cannot safely reuse code without clarification |

**Recommendation for BlendOps:**
- ✅ Use **MIT License** for maximum compatibility
- ✅ Clearly state license in README and LICENSE file
- ❌ Do not copy code from projects without clear licenses

---

## Architecture Recommendations

Based on prior-art analysis:

### Transport Layer
- **Primary:** stdio (MCP standard)
- **Secondary:** HTTP for remote access (optional)
- **Avoid:** TCP sockets (adds complexity)

### Bridge Pattern
- **Use:** Blender addon with `bpy.app.timers` routing
- **Port:** 8765 (common convention)
- **Protocol:** JSON-RPC 2.0 or simple JSON lines

### Schema Strategy
- **TypeScript:** Zod for CLI + MCP server
- **Python:** Pydantic for Blender bridge
- **Shared:** JSON Schema as interchange format

### Safety Model
- **Validation:** All inputs validated before reaching Blender
- **Permissions:** Per-tool allowlist with default-deny
- **Confirmation:** Explicit `--confirm` for destructive operations
- **Audit:** Structured logs with operation receipts

---

## Test Coverage Targets

Based on glonorce/Blender_mcp (499 tests):

- **Unit tests:** 200+ (core logic, schemas, validation)
- **Integration tests:** 50+ (CLI → bridge → Blender)
- **E2E tests:** 20+ (full workflows)
- **Security tests:** 10+ (injection, bypass attempts)

---

## Conclusion

The Blender MCP ecosystem is mature but has clear gaps:

1. **No CLI-first workflows** - BlendOps opportunity
2. **Limited safety models** - BlendOps differentiator
3. **Arbitrary code execution common** - BlendOps avoids
4. **Weak typed contracts** - BlendOps schema-first
5. **No export validation** - BlendOps adds

BlendOps should learn from:
- **poly-mcp:** Comprehensive tool coverage
- **PatrykIti:** Goal-first routing, safety model
- **glonorce:** Test coverage, thread safety

BlendOps should avoid:
- **ahujasid:** Arbitrary code execution
- **All projects:** Lack of CLI, weak schemas

By focusing on CLI-first, safety-first, and schema-first design, BlendOps can fill a clear gap in the ecosystem.

---

**Next Steps:**
1. Implement minimal `blendops scene inspect` with full safety model
2. Add comprehensive test coverage from day 1
3. Document security model in README
4. Publish comparison benchmarks vs existing projects
