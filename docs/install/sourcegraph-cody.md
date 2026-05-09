# Install target: Sourcegraph Cody

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Sourcegraph Cody supports **MCP through its agentic context fetching feature** (opt-in, runs MCP tools locally). BlendOps install for Cody follows the same project-local pattern as other coding agents (write `BLENDOPS.md` per [`docs/install-scopes.md`](../install-scopes.md)) plus optional **MCP server config via Cody's agentic context fetching settings** when the user wants Blender runtime through Cody.

For Blender execution, Cody acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`). It does not replace the Blender-side install.

## Copy/paste prompt

```txt
Install BlendOps for Sourcegraph Cody using a reversible project-local approach.

Requirements:
- Treat Cody as project-local-first.
- Verify Cody-specific project paths before writing tool-native files.
- If unverified, use generic project-local fallback (BLENDOPS.md / AGENTS.md).
- For Blender runtime via Cody as MCP host:
  - Enable Cody's agentic context fetching feature (opt-in per upstream docs).
  - Add Blender MCP server entry (Path 1 Lab MCP via .mcpb bundle, OR Path 2 ahujasid/blender-mcp via uvx).
  - Single-bridge constraint: do not run two Blender MCP servers concurrently against the same Blender instance.
- Do not install Blender, do not run Blender, do not configure connectors automatically.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

- Cody supports MCP through agentic context fetching. Source: https://sourcegraph.com/docs/cody/capabilities/agentic-context-fetching and https://sourcegraph.com/changelog/mcp-context-gathering.
- Original announcement: https://sourcegraph.com/blog/cody-supports-anthropic-model-context-protocol.
- MCP tools run **locally** and require explicit user opt-in.
- Cody's agentic flow auto-decides which MCP tools to invoke; that means Blender MCP exposes its tools to Cody's context loop.
- Compatible with Path 2 (`ahujasid/blender-mcp`) and Path 1 Lab MCP via manual config.
- Single-bridge constraint applies.

## Expected files/folders

- Project-local `BLENDOPS.md` (generic fallback) when adapter path unverified.
- Cody-managed agentic context fetching config (no project file written by BlendOps; consumer owns the config storage per upstream docs).
- No global system writes from BlendOps unless explicitly approved.

## Example MCP config snippet (linked-only)

```json
{
  "mcpServers": {
    "blender": {
      "command": "uvx",
      "args": ["blender-mcp"]
    }
  }
}
```

For Path 1 Lab MCP: install the `.mcpb` bundle per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/) and reference it in Cody's MCP config instead of `uvx blender-mcp`.

## Rollback notes

- Remove `BLENDOPS.md` if BlendOps created it.
- Disable agentic context fetching, OR remove the Blender entry from Cody's MCP config per upstream docs.
- Restart Cody.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via Cody as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server. Anthropic Connector is Claude Desktop only.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp`.
- **CLI fallback (appendix)** — Documented upstream as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- Native Cody BlendOps Skills loader (none exists yet beyond MCP).
- That Cody's agentic context fetching guarantees deterministic Blender tool calls (it is agentic — Cody decides when to invoke).
- Runtime success without an evidence file.
- Marketplace / plugin distribution for Cody.
