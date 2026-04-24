# BlendOps TODO

**Last Updated:** 2026-04-24  
**Status:** MVP scaffolding in progress

---

## Phase 1: Repository Setup ✅

- [x] Create directory structure (apps/, packages/, examples/, docs/)
- [x] Write README.md with architecture and examples
- [x] Create docs/prior-art.md with comparison matrix
- [x] Add package.json with workspace configuration
- [x] Add tsconfig.base.json
- [x] Add .gitignore
- [x] Create packages/schemas with Zod schemas

---

## Phase 2: Shared Schemas & Core

### packages/schemas
- [x] Define BlendOpsResponse schema
- [x] Define SceneInspectRequest schema
- [x] Define SceneInspectData schema
- [ ] Add ObjectCreateRequest schema
- [ ] Add TransformObjectRequest schema
- [ ] Add MaterialCreateRequest schema
- [ ] Add MaterialApplyRequest schema
- [ ] Add ValidateSceneRequest schema
- [ ] Add ExportAssetRequest schema
- [ ] Export all schemas from index.ts

### packages/core
- [ ] Create package.json
- [ ] Create BridgeClient class (HTTP/stdio transport)
- [ ] Add connection management
- [ ] Add request/response handling
- [ ] Add error handling utilities
- [ ] Add retry logic
- [ ] Export public API

---

## Phase 3: Blender Bridge/Addon

### apps/blender-addon
- [ ] Create bl_info metadata
- [ ] Create addon __init__.py
- [ ] Implement HTTP server (port 8765)
- [ ] Add bpy.app.timers routing for thread safety
- [ ] Implement scene.inspect handler
- [ ] Add parameter validation
- [ ] Add error handling
- [ ] Create addon installation instructions
- [ ] Add security module (allowlist, validation)
- [ ] Test in Blender 3.6+

---

## Phase 4: CLI Application

### apps/cli
- [ ] Create package.json
- [ ] Add commander.js dependency
- [ ] Create main CLI entry point (bin/blendops.js)
- [ ] Implement `blendops scene inspect` command
- [ ] Add --json flag for raw output
- [ ] Add --dry-run flag (architecture support)
- [ ] Add connection error handling
- [ ] Add formatted output (tables, colors)
- [ ] Create help text and examples
- [ ] Test CLI end-to-end

---

## Phase 5: MCP Server

### apps/mcp-server
- [ ] Create package.json
- [ ] Add @modelcontextprotocol/sdk dependency
- [ ] Create MCP server entry point
- [ ] Implement inspect_scene tool
- [ ] Add tool schema definitions
- [ ] Add stdio transport
- [ ] Add error handling
- [ ] Create MCP configuration example
- [ ] Test with Claude Desktop
- [ ] Document tool usage

---

## Phase 6: Scene Operations

### Implement Core Commands
- [ ] scene.inspect (MVP priority)
- [ ] object.create (MVP priority)
- [ ] object.transform
- [ ] object.delete (requires --confirm)
- [ ] scene.clear (requires --confirm)
- [ ] material.create
- [ ] material.apply
- [ ] lighting.setup
- [ ] camera.set
- [ ] render.preview
- [ ] validate.scene
- [ ] export.asset
- [ ] undo.last

### Add to CLI
- [ ] Implement each command as CLI subcommand
- [ ] Add argument parsing
- [ ] Add validation
- [ ] Add formatted output

### Add to MCP
- [ ] Implement each command as MCP tool
- [ ] Add tool schemas
- [ ] Add parameter validation
- [ ] Test with AI agents

---

## Phase 7: Validation System

### Validation Presets
- [ ] Define game-asset preset
  - [ ] Check object count
  - [ ] Check missing materials
  - [ ] Check unapplied scale
  - [ ] Estimate polycount
  - [ ] Check object naming
  - [ ] Check origin/scale warnings
  - [ ] Check export readiness
- [ ] Define 3d-print preset
- [ ] Define animation preset
- [ ] Add custom validation rules API

### Implementation
- [ ] Create validation engine
- [ ] Add preset loader
- [ ] Add validation report formatter
- [ ] Test validation presets

---

## Phase 8: Safety & Dry-Run

### Safety Features
- [ ] Implement --confirm flag for destructive ops
- [ ] Add operation allowlist
- [ ] Add rate limiting per session
- [ ] Add audit logging
- [ ] Add operation receipts
- [ ] Document security model

### Dry-Run Design
- [ ] Add --dry-run flag to CLI
- [ ] Return CANCELLED-equivalent responses
- [ ] Preview operations without execution
- [ ] Add dry-run to MCP tools
- [ ] Test dry-run mode

---

## Phase 9: Undo System

### Undo Implementation
- [ ] Track operation batches
- [ ] Implement undo checkpointing
- [ ] Add `blendops undo` command
- [ ] Add undo_last MCP tool
- [ ] Add undo history inspection
- [ ] Test undo functionality

---

## Phase 10: Export & Validation

### Export Support
- [ ] Implement GLB export (MVP priority)
- [ ] Add FBX export
- [ ] Add STL export
- [ ] Add USD export
- [ ] Add path validation
- [ ] Add export readiness checks

### Pre-Export Validation
- [ ] Check file extension
- [ ] Check directory exists
- [ ] Check path is within allowed tree
- [ ] Validate scene before export
- [ ] Add export warnings

---

## Phase 11: Documentation

### User Documentation
- [ ] Installation guide
- [ ] CLI usage guide
- [ ] MCP configuration guide
- [ ] Blender addon installation
- [ ] Troubleshooting guide
- [ ] FAQ

### Developer Documentation
- [ ] Architecture overview
- [ ] Contributing guide
- [ ] API reference
- [ ] Schema documentation
- [ ] Security model documentation
- [ ] Testing guide

---

## Phase 12: Testing & Evaluation

### Unit Tests
- [ ] Schema validation tests (50+)
- [ ] Core utilities tests (50+)
- [ ] Bridge client tests (30+)
- [ ] CLI command tests (30+)
- [ ] MCP tool tests (30+)
- [ ] Validation preset tests (20+)

### Integration Tests
- [ ] CLI → Bridge → Blender (20+)
- [ ] MCP → Bridge → Blender (20+)
- [ ] Error handling tests (10+)

### E2E Tests
- [ ] Full workflow tests (10+)
- [ ] AI agent evaluation prompts (5+)

### Security Tests
- [ ] Injection attempt tests (5+)
- [ ] Bypass attempt tests (5+)

---

## Phase 13: Examples & Demos

### Example Prompts
- [ ] "Create a red cube on a plane with studio lighting and render preview"
- [ ] "Inspect this scene and tell me what can be exported as a game asset"
- [ ] "Create a low-poly treasure chest style blockout and export GLB"
- [ ] "Validate the scene and suggest fixes"
- [ ] "Set up a product photography scene with proper lighting"

### Demo Workflows
- [ ] Game asset creation workflow
- [ ] Product visualization workflow
- [ ] 3D print preparation workflow
- [ ] Animation setup workflow

---

## Phase 14: Polish & Release

### Pre-Release Checklist
- [ ] All MVP features working
- [ ] Documentation complete
- [ ] Tests passing (>90% coverage)
- [ ] Security audit complete
- [ ] Performance benchmarks run
- [ ] Cross-platform testing (Windows, macOS, Linux)
- [ ] Blender version testing (3.6, 4.0, 4.1)

### Release Preparation
- [ ] Choose license (MIT recommended)
- [ ] Add LICENSE file
- [ ] Add CONTRIBUTING.md
- [ ] Add CODE_OF_CONDUCT.md
- [ ] Create GitHub repository
- [ ] Set up CI/CD
- [ ] Publish to npm (CLI + MCP server)
- [ ] Create release notes

---

## Future Roadmap (Post-MVP)

### Advanced Features
- [ ] Scene diff visualization
- [ ] Multi-scene management
- [ ] Asset library integration
- [ ] Procedural generation tools
- [ ] Animation timeline tools
- [ ] Geometry nodes integration
- [ ] Shader nodes integration
- [ ] Batch operations
- [ ] Remote Blender support
- [ ] Multi-DCC integration (Unreal, Unity)

### Performance
- [ ] Optimize large scene handling
- [ ] Add caching layer
- [ ] Parallel operation execution
- [ ] Lazy loading for large tool sets

### Developer Experience
- [ ] VSCode extension
- [ ] Blender addon UI panel
- [ ] Interactive CLI mode
- [ ] Web-based inspector
- [ ] GraphQL API option

---

## Current Sprint (Week 1)

**Goal:** Minimal vertical slice working end-to-end

- [x] Scaffold repository structure
- [x] Create README.md
- [x] Create docs/prior-art.md
- [x] Create TODO.md
- [x] Add base configuration files
- [x] Create packages/schemas with initial schemas
- [ ] Create packages/core with BridgeClient
- [ ] Create apps/blender-addon with scene.inspect handler
- [ ] Create apps/cli with scene inspect command
- [ ] Test end-to-end: `blendops scene inspect`

**Success Criteria:**
- CLI command runs without errors
- Connects to Blender bridge
- Returns structured JSON response
- Displays formatted output

---

## Notes

### Architecture Decisions
- **Transport:** stdio for MCP, HTTP for Blender bridge (port 8765)
- **Schemas:** Zod for TypeScript, Pydantic for Python
- **Safety:** No arbitrary Python execution, typed operations only
- **Thread Safety:** Use bpy.app.timers for main-thread routing
- **Validation:** JSON Schema validation before reaching Blender

### Prior Art Learnings
- Adopt: Thread-safe routing, comprehensive test coverage, goal-first validation
- Avoid: Arbitrary code execution, unclear licensing, HTTP-only transport
- Differentiate: CLI-first, safety-first, schema-first design

### Open Questions
- [ ] Should we support Blender 3.3+ or 3.6+ minimum?
- [ ] Should bridge use HTTP or stdio for local communication?
- [ ] Should we add WebSocket transport for real-time updates?
- [ ] Should we support multiple Blender instances?
- [ ] Should we add a GUI inspector tool?

---

**Next Action:** Implement packages/core BridgeClient and apps/blender-addon scene.inspect handler
