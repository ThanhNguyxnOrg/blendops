# 🧱 Inheritance Foundation

> 📚 Docs: [Index](./README.md) · [Inheritance Foundation](./inheritance-foundation.md) · [Blender CLI Reference](./blender-cli-reference.md)

This document explains BlendOps' architectural foundation and how it inherits from official Blender CLI behavior.

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│  AI Tools (Claude, Cursor, OpenCode, etc.)     │
│  Use BlendOps MCP/CLI for typed operations     │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│  BlendOps MCP Server / CLI                      │
│  Typed operations, safety gates, validation    │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│  BlendOps Managed Bridge                        │
│  Lifecycle management, HTTP server, receipts   │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│  Official Blender CLI                           │
│  blender --python <script> [--background]      │
│  Upstream runtime primitive                    │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│  Blender Python API (bpy)                       │
│  Scene manipulation, rendering, export         │
└─────────────────────────────────────────────────┘
```

## Design Principles

### 1. Official Blender CLI is the Foundation

BlendOps does not replace or bypass Blender's official CLI. Instead:

- BlendOps uses standard `blender --python <script>` for addon bootstrap
- GUI mode follows official Blender launch patterns
- Background mode (`--background`) is supported but limited for persistent bridge runtime
- Process lifecycle aligns with non-blocking automation workflows

See [Official Blender CLI Reference](./blender-cli-reference.md) for detailed alignment notes.

### 2. Typed Operations, Not Arbitrary Python

**BlendOps intentionally avoids exposing arbitrary Python execution to AI agents.**

Why:
- **Security**: Arbitrary code execution is a security risk
- **Predictability**: Typed operations have known inputs/outputs
- **Auditability**: Each operation has a manifest entry and receipt
- **Safety**: Destructive operations require explicit confirmation tokens

What this means:
- AI agents call typed operations like `object.create`, `material.apply`, `render.preview`
- Each operation has a schema, validation, and safety checks
- No `eval()`, no `exec()`, no raw Blender CLI flags exposed to agents
- Future prompt-to-scene features will compile natural language into safe typed operations

### 3. Community Prior Art Informs Lifecycle Patterns

BlendOps lifecycle management draws from community Blender MCP implementations:

- **Stale-readiness diagnostics**: Detect port conflicts and stale processes
- **Clearer startup/timeout recovery**: Explicit readiness polling and error messages
- **Log discoverability**: Persistent logs at `.tmp/blendops/bridge.stdout.log` and `.tmp/blendops/bridge.stderr.log`
- **Process detachment**: `bridge start` returns when startup succeeds; Blender GUI remains open

See [Bridge Lifecycle Prior Art](./bridge-lifecycle-prior-art.md) for implementation mining notes.

### 4. Future: Prompt-to-Scene Compiles to Safe Operations

BlendOps is designed to support future prompt-to-scene workflows:

```
User: "Create a red cube with soft lighting"
       ▼
Prompt-to-Scene Compiler (future)
       ▼
Recipe JSON / Typed Batch Operations
       ▼
BlendOps batch.execute (safe, validated)
       ▼
Blender Scene
```

This approach ensures:
- Natural language requests are validated before execution
- Each step is auditable and reversible
- No arbitrary Python injection from prompts
- AI agents work with safe, typed primitives

## What BlendOps Is NOT

- **Not a Blender replacement**: BlendOps wraps Blender, does not replace it
- **Not a general-purpose Python executor**: No arbitrary code execution
- **Not a Blender CLI bypass**: Uses official `blender --python` patterns
- **Not a standalone renderer**: Requires Blender installation

## What BlendOps IS

- **A safe automation layer**: Typed operations with validation and safety gates
- **A managed bridge**: Lifecycle management for persistent Blender runtime
- **An AI-native toolkit**: MCP + CLI surfaces for AI agents
- **A foundation for prompt-to-scene**: Designed to support future natural language workflows

## Comparison with Raw Blender CLI

| Aspect | Raw Blender CLI | BlendOps |
|--------|-----------------|----------|
| Execution | `blender --python script.py` | `blendops object create --type cube` |
| Safety | No validation | Typed schemas, confirmation tokens |
| Auditability | Script contents | Operation manifest, receipts |
| AI Integration | Manual scripting | MCP tools, CLI commands |
| Lifecycle | Manual process management | Managed bridge with readiness polling |
| Arbitrary Python | Full access | Intentionally not exposed |

## Next Steps

- [Official Blender CLI Reference](./blender-cli-reference.md) for alignment details
- [Bridge Lifecycle Prior Art](./bridge-lifecycle-prior-art.md) for implementation patterns
- [AI-agent usage guide](./ai-agent-usage.md) for typed operation workflows
