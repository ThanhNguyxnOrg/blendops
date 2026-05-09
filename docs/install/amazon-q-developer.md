# Install target: Amazon Q Developer CLI

Status/confidence: Draft v0, linked-only

## Recommended near-term install mode

Amazon Q Developer CLI is **AWS's terminal AI coding agent with native MCP server support** (`qchat mcp add/remove/list/import/status`). BlendOps install for Amazon Q Developer follows the same project-local pattern as other coding agents (write `BLENDOPS.md` per [`docs/install-scopes.md`](../install-scopes.md)) plus optional **MCP server config via `qchat mcp add` or directly editing the agent config under `~/.aws/amazonq/cli-agents`** when the user wants Blender runtime through Amazon Q.

For Blender execution, Amazon Q Developer CLI acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp`). It does not replace the Blender-side install.

## Copy/paste prompt

```txt
Install BlendOps for Amazon Q Developer CLI using a reversible project-local approach.

Requirements:
- Treat Amazon Q Developer CLI as project-local-first.
- Verify Amazon Q-specific project paths before writing tool-native files.
- If unverified, use generic project-local fallback (BLENDOPS.md / AGENTS.md).
- For Blender runtime via Amazon Q Developer CLI as MCP host, choose ONE of:
  - CLI: qchat mcp add blender --command uvx --args blender-mcp
  - File: edit the agent config under ~/.aws/amazonq/cli-agents (JSON, mcpServers field).
  - Import: qchat mcp import <path-to-config>
- Add Blender MCP server (Path 1 Lab MCP via .mcpb bundle, OR Path 2 ahujasid/blender-mcp via uvx).
- After adding, verify with qchat mcp status and /tools.
- Single-bridge constraint: do not run two Blender MCP servers concurrently against the same Blender instance.
- Do not install Blender, do not run Blender, do not configure connectors automatically.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (linked-only)

- Amazon Q Developer CLI supports MCP via `qchat mcp` subcommands and agent config files. Sources:
  - https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/command-line-mcp-config-CLI.html
  - https://docs.aws.amazon.com/amazonq/latest/qdeveloper-ug/qdev-mcp.html
  - https://aws.github.io/amazon-q-developer-cli/agent-format.html
- Config location: `~/.aws/amazonq/cli-agents`.
- Subcommands: `qchat mcp add`, `qchat mcp remove`, `qchat mcp list`, `qchat mcp import`, `qchat mcp status`.
- Supports both **local** (process) and **remote** (HTTP, optional OAuth) MCP servers.
- Servers load in the background; tools become available progressively (`/tools` shows status).
- Initialization timeout is configurable via `q settings mcp.initTimeout`.
- Compatible with Path 2 (`ahujasid/blender-mcp`) and Path 1 Lab MCP via manual config.
- Single-bridge constraint applies.

## Expected files/folders

- Project-local `BLENDOPS.md` (generic fallback) when adapter path unverified.
- User-level agent config under `~/.aws/amazonq/cli-agents` (managed by `qchat mcp ...` subcommands).
- No global system writes from BlendOps unless explicitly approved.

## Example MCP config snippet (linked-only)

CLI form:

```bash
qchat mcp add blender --command uvx --args blender-mcp
qchat mcp status blender
```

JSON form (agent config snippet, illustrative — verify against upstream agent format):

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

For Path 1 Lab MCP: install the `.mcpb` bundle per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/) and reference its launcher in place of `uvx blender-mcp`.

## Rollback notes

- Remove `BLENDOPS.md` if BlendOps created it.
- Run `qchat mcp remove blender`, OR delete the Blender entry from the agent config under `~/.aws/amazonq/cli-agents`.
- Restart the Amazon Q Developer CLI session.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via Amazon Q Developer CLI as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server. Anthropic Connector is Claude Desktop only.
- **Path 2 (community `ahujasid/blender-mcp`)** — Blender 3.0+ + `addon.py` + `uvx blender-mcp`.
- **CLI fallback (appendix)** — Documented upstream as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- Native Amazon Q BlendOps Skills loader (none exists yet beyond MCP).
- That AWS-managed remote MCP servers in the Amazon Q ecosystem are BlendOps deliverables (they are AWS-side; BlendOps redirects to Path 1 / Path 2 / CLI for Blender).
- Runtime success without an evidence file.
- Marketplace / plugin distribution for Amazon Q Developer.
