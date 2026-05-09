# Install target: Aider (terminal AI coding assistant)

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Aider is a **terminal-based AI coding assistant** with **native MCP support merged via LiteLLM** (PR [Aider-AI/aider#3937](https://github.com/Aider-AI/aider/pull/3937)). BlendOps install for Aider follows the same project-local pattern as other coding agents (write `BLENDOPS.md` per [`docs/install-scopes.md`](../install-scopes.md)) plus optional **MCP server config via `aider --mcp-servers '...'` or `.aider.conf.yml`** when the user wants Blender runtime through Aider.

For Blender execution, Aider acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`). It does not replace the Blender-side install.

## Copy/paste prompt

```txt
Install BlendOps for Aider using a reversible project-local approach.

Requirements:
- Treat Aider as project-local-first.
- Verify Aider-specific project paths before writing tool-native files (Aider reads CONVENTIONS.md, README.md, etc.).
- If unverified, use generic project-local fallback (BLENDOPS.md / AGENTS.md).
- For Blender runtime via Aider as MCP host, choose ONE of:
  - Per-invocation flag: aider --mcp-servers '{"mcpServers":{"blender":{"command":"uvx","args":["blender-mcp"]}}}'
  - Separate JSON config file passed via flag (per upstream docs).
  - YAML config in .aider.conf.yml at project or home level.
- Add Blender MCP server (Path 1 Lab MCP via .mcpb bundle, OR Path 2 ahujasid/blender-mcp via uvx).
- Single-bridge constraint: do not run two Blender MCP servers concurrently against the same Blender instance.
- Note: Aider currently supports stdio transport only; remote MCP transports are not supported per upstream PR.
- Do not install Blender, do not run Blender, do not configure connectors automatically.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

- Aider merged MCP support via LiteLLM in PR [#3937](https://github.com/Aider-AI/aider/pull/3937).
- Supported configuration channels: command-line JSON string (`--mcp-servers`), separate JSON config file, or YAML in `.aider.conf.yml`.
- Currently supports **stdio transport only**; remote MCP transports are tracked as future work.
- Tool execution is concurrent across servers, capped at **25 tool calls per reply**.
- Native MCP server / Agent-Mode work for Aider itself is tracked at issue [#4506](https://github.com/aider-ai/aider/issues/4506) and not yet shipped.
- Compatible with Path 2 (`ahujasid/blender-mcp`) and Path 1 Lab MCP via manual config.
- Single-bridge constraint applies.

## Expected files/folders

- Project-local `BLENDOPS.md` (generic fallback) when adapter path unverified.
- `.aider.conf.yml` at project or home level (only when user opts into persistent MCP config).
- No global system writes from BlendOps unless explicitly approved.

## Example config snippets (linked-only)

CLI flag form:

```bash
aider --mcp-servers '{"mcpServers":{"blender":{"command":"uvx","args":["blender-mcp"]}}}'
```

`.aider.conf.yml` form (illustrative; verify against upstream syntax):

```yaml
mcp-servers:
  mcpServers:
    blender:
      command: uvx
      args: ["blender-mcp"]
```

For Path 1 Lab MCP: install the `.mcpb` bundle per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/) and reference its launcher in place of `uvx blender-mcp`.

## Rollback notes

- Remove `BLENDOPS.md` if BlendOps created it.
- Remove the `--mcp-servers` flag from your Aider invocation, OR delete the Blender entry from `.aider.conf.yml` / your separate JSON config file.
- Re-run Aider with no MCP flag to confirm the bridge is gone.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via Aider as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server. Anthropic Connector is Claude Desktop only.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp`.
- **CLI fallback (appendix)** — Documented upstream as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- That Aider exposes BlendOps as a native skill loader (it doesn't beyond MCP).
- Remote MCP transport support for Aider (stdio only at time of writing).
- Native Aider Agent Mode (tracked upstream, not shipped).
- Runtime success without an evidence file.
- Marketplace / plugin distribution for Aider.
