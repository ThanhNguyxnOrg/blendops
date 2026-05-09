# Install target: Blackbox AI (VS Code extension)

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Blackbox AI is a **popular VS Code AI coding extension** (`Blackboxapp.blackbox` / `Blackboxapp.blackboxagent`) with **native MCP server support**. BlendOps install for Blackbox AI follows the same project-local pattern as other coding agents (write `BLENDOPS.md` per [`docs/install-scopes.md`](../install-scopes.md)) plus optional **MCP server config via the Blackbox AI extension MCP Servers panel** when the user wants Blender runtime through Blackbox AI.

For Blender execution, Blackbox AI acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`). It does not replace the Blender-side install.

## Copy/paste prompt

```txt
Install BlendOps for Blackbox AI (VS Code) using a reversible project-local approach.

Requirements:
- Treat Blackbox AI as project-local-first.
- Verify Blackbox-specific project paths before writing tool-native files.
- If unverified, use generic project-local fallback (BLENDOPS.md / AGENTS.md).
- For Blender runtime via Blackbox AI as MCP host:
  - Open the Blackbox AI panel → MCP Servers → add a new server entry.
  - Add Blender MCP server (Path 1 Lab MCP via .mcpb bundle, OR Path 2 ahujasid/blender-mcp via uvx).
  - Restart the Blackbox AI session after adding.
  - Single-bridge constraint: do not run two Blender MCP servers concurrently against the same Blender instance.
- Do not install Blender, do not run Blender, do not configure connectors automatically.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

- Blackbox AI supports MCP servers natively. Source: https://docs.blackbox.chat/blackbox-ai-1/extensions/blackbox-ai-on-vscode/vscode-extension/mcp-servers and https://docs.blackbox.ai/features/vscode-agent/getting-started.
- The extension also bundles 15+ coding agent integrations (Claude Code, Codex, Gemini, Goose, OpenCode, …) with an orchestration layer; BlendOps treats those as separate consumers each with their own install doc.
- Compatible with Path 2 (`ahujasid/blender-mcp`) and Path 1 Lab MCP via manual config.
- Single-bridge constraint applies.

## Expected files/folders

- Project-local `BLENDOPS.md` (generic fallback) when adapter path unverified.
- Blackbox AI MCP entries (managed through the extension UI; no project file written by BlendOps).
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

For Path 1 Lab MCP: install the `.mcpb` bundle per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/) and reference it in Blackbox AI's MCP config instead of `uvx blender-mcp`.

## Rollback notes

- Remove `BLENDOPS.md` if BlendOps created it.
- Open the Blackbox AI panel → MCP Servers → remove the Blender entry.
- Restart the Blackbox AI session.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via Blackbox AI as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server. Anthropic Connector is Claude Desktop only.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp`.
- **CLI fallback (appendix)** — Documented upstream as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- Native Blackbox AI BlendOps Skills loader (none exists yet beyond MCP).
- That Blackbox AI's bundled "15+ coding agent" integrations are official BlendOps targets (they are separate consumers; BlendOps lists them individually under [`docs/install/`](./README.md)).
- Runtime success without an evidence file.
- Marketplace / plugin distribution for Blackbox AI.
