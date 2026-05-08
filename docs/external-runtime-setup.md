# External Runtime Setup

BlendOps is a workflow/product layer and does **not** ship its own BlendOps-owned CLI/MCP/addon runtime.

Active runtime guidance uses the 4-route model in [Runtime stack strategy](./runtime-stack-strategy.md).

> [!IMPORTANT]
> Importing BlendOps skills, laws, packs, or docs does not install Blender runtime, the Anthropic Blender Connector, any MCP server (Blender Foundation `bpype/blender_mcp` or community `ahujasid/blender-mcp`), or any Blender add-on.

## Blender version requirements per route

| Route | Min Blender | Source |
|---|---|---|
| **Route A** Anthropic Blender Connector | **4.2+** (4.5 LTS recommended) | Anthropic tutorial, [claude.com/.../using-the-blender-connector-in-claude](https://claude.com/resources/tutorials/using-the-blender-connector-in-claude) |
| **Route B** Blender Foundation MCP Server (`bpype/blender_mcp`) | **5.1+** | `blender_manifest.toml: blender_version_min = "5.1.0"` ([blender.org/lab/mcp-server](https://www.blender.org/lab/mcp-server/)) |
| **Route C** Community Blender MCP (`ahujasid/blender-mcp`) | **3.0+** | Uses stable `bpy` available since 3.0 ([github.com/ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp)) |
| **Route D** Official Blender CLI | 4.2+ recommended | [Blender CLI docs](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html) |

> [!WARNING]
> The 5.1+ requirement applies **only to Route B** (Blender Foundation MCP Server, `bpype/blender_mcp`). Earlier BlendOps drafts incorrectly applied 5.1+ to all of "Stack 1", which conflated Routes A and B. Users picking Route A (Anthropic Connector) only need Blender 4.2+. Users picking Route C (community `ahujasid/blender-mcp`) only need Blender 3.0+.

---

## Route A — Anthropic Blender Connector

Use this route if the user is on Claude Desktop and wants the lowest-friction setup.

Runtime chain:

```txt
Claude Desktop with Anthropic "Blender" Connector enabled
  → local Anthropic helper
  → Blender (3.0+ supported, 4.2+ per Anthropic tutorial)
```

Source link: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude

Required setup guidance (defer to upstream tutorial for canonical UI flow):

1. Install Blender (4.2+ per Anthropic tutorial; 4.5 LTS recommended).
2. In Claude Desktop, open Settings → Connectors → Browse, find Blender, click Enable.
3. Approve the local helper launch.
4. Open Blender, confirm the BlenderMCP panel is visible in the 3D View sidebar (`N` to toggle), confirm the status pill reads Connected.
5. Run a read-only request first.

Notes:

- Route A's helper handles the Blender-side bridge for you; you do **not** separately install `bpype/blender_mcp` for this route. If you also install Route B, do not run both concurrently against the same Blender instance.
- Tool surface includes `create_object`, `delete_object`, `run_blender_code`. (Different from Route B's `get_blendfile_summary_*` and Route C's `get_scene_info` / `execute_blender_code`.)

Current BlendOps evidence: **Not Verified** (no fresh evidence record exists for Route A).

---

## Route B — Blender Foundation MCP Server (`bpype/blender_mcp`)

Use this route if you are on Blender 5.1+ and want the Blender Foundation's own MCP server. Works with any MCP client.

Runtime chain:

```txt
Any MCP client (Claude Desktop, Cursor, Codex, OpenCode, Cline, VS Code)
  → MCP transport
  → bpype/blender_mcp server
  → Blender 5.1+ session (with Lab MCP add-on installed)
```

Source links:

- Blender Lab MCP page: https://www.blender.org/lab/mcp-server/
- Source repo: https://projects.blender.org/lab/blender_mcp

Required setup guidance:

1. Install Blender 5.1+ (the add-on will not load on earlier versions).
2. Drag-drop the add-on install link from blender.org/lab/mcp-server into Blender twice (first registers the Blender Lab repository, second installs the add-on), or download and install from disk.
3. Install the MCP server itself either as an `.mcpb` bundle (clients that support it) or from source.
4. Configure your MCP client to point at the server.
5. Open Blender's BlenderMCP panel and start/connect the server.
6. Run a read-only request (e.g., `get_blendfile_summary_path_info`) before any mutation.

Current BlendOps evidence: **Ambiguous attribution.** The 2026-04-29 smoke test ([`docs/evals/blender-connector-read-only-smoke-test.md`](./evals/blender-connector-read-only-smoke-test.md)) recorded tool names that match Route B's tool surface, but the labeled runtime path was Route A. The record now reflects this ambiguity. A fresh evidence record explicitly naming Route B is needed.

---

## Route C — Community Blender MCP (`ahujasid/blender-mcp`)

Use this route if you are on a non-Claude MCP client (Cursor, Codex, OpenCode, Cline, VS Code) or specifically want the prior-art community path. Works with any MCP client including Claude Desktop via manual MCP config.

Runtime chain:

```txt
Any MCP client
  → MCP transport
  → ahujasid/blender-mcp server (uvx blender-mcp)
  → Blender 3.0+ session (with addon.py installed)
```

Source link: https://github.com/ahujasid/blender-mcp

Required setup guidance (defer to upstream README for exact current commands):

1. Install `uv` per upstream instructions.
2. In your MCP client config, register a `blender` MCP server with `command: uvx, args: [blender-mcp]`. For Claude Desktop this is Settings → Developer → Edit Config.
3. Download `addon.py` from the upstream repo, install it in Blender via Edit → Preferences → Add-ons → Install, and enable it.
4. Open the BlenderMCP tab in Blender's 3D View sidebar (`N`) and click Connect to your client.
5. Restart your MCP client so it discovers the new server.

Caveats:

- Third-party software; review the upstream repo, license, issue tracker, and security posture before use.
- `execute_blender_code` runs LLM-generated Python with no sandbox. Save before destructive operations and prefer disposable scenes for first runs.
- Port conflicts: do not run Route B and Route C concurrently against the same Blender instance unless you intentionally change ports.

Current BlendOps evidence: **User-reported verified** (2026-05-08 statement). No formal evidence record file exists yet for this route. For longer caveat write-up see [`unofficial-runtime-bridges.md`](./unofficial-runtime-bridges.md).

---

## Route D — Official Blender CLI fallback

Use this route when no MCP route is available, when scripted batch processing fits the task, or as a deterministic fallback.

Runtime chain:

```txt
Agent or shell with permission to invoke an explicit Blender executable
  → blender --background --python script.py ...
  → Blender process
```

Source link: https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

Required setup/eval guidance:

- Blender must be installed and reachable via an explicit executable path or verified `PATH` entry.
- The operator/agent must record the exact Blender command, input script, output paths, generated files, exit status, logs, and validation evidence.
- No artifact claim is allowed without evidence.
- CLI fallback does not need MCP or Claude Desktop.

Current BlendOps evidence: Full CLI eval is `Not Run`. Preview/render/GLB artifacts are `Not Produced`.

---

## Single-client constraint

Blender accepts a single MCP client per session. Do not run Route A + Route B + Route C concurrently against the same Blender instance — the second connection will silently fail. Pick one route per session.

---

## Return to BlendOps

Once one route is working, continue with BlendOps workflow docs:

- Runtime stack strategy: `./runtime-stack-strategy.md`
- Product direction: `./product-direction.md`
- First user journey: `./first-user-journey.md`
- Architecture: `./architecture.md`
- Golden path example: `./golden-path-cyberpunk-shoe.md`
- Workflow contract: `./workflow-contract.md`
- Safety model: `./safety-model.md`

BlendOps role:

`natural-language intent` → `scene/workflow plan` → `validation` → `render/export handoff` → `web-ready guidance`

---

## Safety boundary

Runtime integrations expose powerful Blender capabilities (Routes A, B, and C all allow LLM-generated Python execution).

BlendOps safety stance:

- Keep user-facing behavior constrained by workflow + validation + evidence.
- Avoid using arbitrary execution primitives as the final product interface.
- Prefer explicit assumptions, explicit checks, and clear pass/partial/fail reporting.
- Save before destructive operations regardless of route.
