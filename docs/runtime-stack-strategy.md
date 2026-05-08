# Runtime Stack Strategy

Status: Draft v0 stack decision  
Scope: Runtime route selection for future BlendOps evals, not runtime execution

> [!CAUTION]
> This document does not install Blender, run Blender, mutate a scene, render, export GLB, or claim runtime artifacts. Full BlendOps runtime eval remains `Not Run`, and preview/render/GLB artifacts remain `Not Produced` until an eval record captures evidence.

---

## Why this doc exists

For most of 2026 BlendOps documented a "3-stack" runtime model that conflated three distinct products into Stack 1 ("Claude Desktop official connector stack"):

1. Anthropic's one-click "Blender" Connector inside Claude Desktop.
2. The Blender Foundation's standalone MCP Server (`bpype/blender_mcp`) at [blender.org/lab/mcp-server/](https://www.blender.org/lab/mcp-server/).
3. The community `ahujasid/blender-mcp` project at [github.com/ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp).

These are three independent products from three different organizations. Conflating them produced two documented overclaims, both of which are corrected here:

- The 2026-04-29 read-only smoke test was attributed to "Official Claude Desktop Blender Connector", but the recorded tools (`get_blendfile_summary_path_info`, `get_blendfile_summary_datablocks`, `get_objects_summary`) match Route B (`bpype/blender_mcp`), not Route A (Anthropic Connector). See [`docs/evals/blender-connector-read-only-smoke-test.md`](./evals/blender-connector-read-only-smoke-test.md) for the corrected attribution.
- The "Blender 5.1+" requirement was applied to all of Stack 1, but it is a property of Route B only. Route A (Anthropic Connector) is documented by Anthropic at Blender 4.2+ with 4.5 LTS recommended.

The new 4-route model below makes each path independently selectable, with its own provenance, Blender-version requirement, install steps, and BlendOps verification status.

---

## Route summary

BlendOps runtime guidance uses four runtime routes:

1. **Route A — Anthropic Blender Connector** (one-click, Claude Desktop only)
2. **Route B — Blender Foundation MCP Server** (`bpype/blender_mcp`, manual install, any MCP client)
3. **Route C — Community Blender MCP** (`ahujasid/blender-mcp`, manual install, any MCP client)
4. **Route D — Official Blender CLI** (no MCP, deterministic fallback)

| Route | Provenance | Min Blender | Install model | Works with | BlendOps verification |
|---|---|---|---|---|---|
| **A** Anthropic Blender Connector | Anthropic, built with Blender devs | 4.2+ (Anthropic tutorial) / 4.5 LTS recommended | One-click toggle in Claude Desktop Settings → Connectors | Claude Desktop only | **Not Verified** |
| **B** Blender Foundation MCP Server (`bpype/blender_mcp`) | Blender Foundation Lab | **5.1+** (`blender_manifest.toml: blender_version_min = "5.1.0"`) | Drag-drop add-on into Blender + `.mcpb` install or manual MCP config in client | Any MCP client | **Ambiguous** (2026-04-29 smoke test tool names match Route B, but no fresh eval) |
| **C** Community Blender MCP (`ahujasid/blender-mcp`) | Community / `ahujasid` (21K+ stars, prior art) | 3.0+ (uses stable `bpy`) | `uvx blender-mcp` (or pip) + addon.py from repo, plus per-client MCP config | Any MCP client | **User-reported verified** (2026-05-08 statement); no formal eval record yet |
| **D** Official Blender CLI | Blender Foundation | 4.2+ recommended | Just install Blender + invoke `blender` executable | No MCP needed | **Not Run** |

> [!IMPORTANT]
> **No route currently has a clean fresh BlendOps evidence record.** Route B has a 2026-04-29 smoke test record but tool names contradict the labeled runtime path. Route C is user-reported as working but has no evidence file. Routes A and D have no evidence at all. The next runtime eval should produce a fresh evidence record naming the exact route, exact tool names, exact Blender version, and exact MCP server source.

---

## Route A — Anthropic Blender Connector

Use this route if the user has Claude Desktop and wants the lowest-friction setup.

Source links:

- Anthropic tutorial: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- Anthropic launch post: https://www.anthropic.com/news/claude-for-creative-work

What this route is:

- An Anthropic-shipped Blender Connector in Claude Desktop's Connectors directory, released April 28 2026 as part of Claude for Creative Work.
- Built by Blender developers in coordination with Anthropic.
- Speaks MCP, exposes tools like `create_object`, `delete_object`, `run_blender_code`.
- The Anthropic helper handles the bridge to a running Blender process; the user does not separately install a `bpype/blender_mcp` add-on for this route.

Required setup guidance (do not invent steps; defer to the upstream tutorial for the current canonical UI flow):

1. Update Blender to a supported version (Anthropic tutorial states 4.2+, community guides recommend 4.5 LTS).
2. In Claude Desktop, open Settings → Connectors → Browse, find Blender, click Enable.
3. Approve the local helper launch.
4. Open Blender, confirm the BlenderMCP panel is visible in the 3D View sidebar (`N` to toggle), confirm the status pill reads Connected.

Current BlendOps evidence:

- No fresh evidence record exists for Route A.
- The 2026-04-29 smoke test was previously labeled this route but its tool names match Route B; that record is no longer counted as Route A evidence.

---

## Route B — Blender Foundation MCP Server (`bpype/blender_mcp`)

Use this route if the user wants Blender's own MCP server (not Anthropic's connector) and is on Blender 5.1+.

Source links:

- Blender Lab MCP page: https://www.blender.org/lab/mcp-server/
- Source repo: https://projects.blender.org/lab/blender_mcp

What this route is:

- A standalone official MCP server published by the Blender Foundation Lab.
- Requires Blender 5.1+ because `blender_manifest.toml: blender_version_min = "5.1.0"`.
- Tool surface includes `get_blendfile_summary_path_info`, `get_blendfile_summary_datablocks`, `get_objects_summary`, plus Python execution.
- Works with any MCP client because it is just an MCP server. Claude Desktop, Cursor, Codex, OpenCode, Cline, etc., can all connect by registering it in their MCP config.

Required setup guidance:

1. Install Blender 5.1+ (the add-on will not load on earlier versions).
2. Drag-drop the add-on install link from blender.org/lab/mcp-server into Blender twice (first registers the Blender Lab repository, second installs the add-on), or download and install from disk.
3. Install the MCP server itself either as an `.mcpb` bundle (clients that support it) or from source.
4. Configure your MCP client to point at the server.
5. Open Blender's BlenderMCP panel and start/connect the server.
6. Run a read-only test (e.g., `get_blendfile_summary_path_info`) before any mutation.

Current BlendOps evidence:

- The 2026-04-29 smoke test tool names match this route's tool surface.
- That record was previously mis-labeled as Route A; it is now annotated as **likely-but-not-confirmed Route B**, pending a fresh re-verification by the user that explicitly names the runtime path.
- No mutation, render, export, preview, or GLB artifact was produced under any interpretation of that test.

---

## Route C — Community Blender MCP (`ahujasid/blender-mcp`)

Use this route if the user is on a non-Claude MCP client (Cursor, Codex, OpenCode, Cline, VS Code) or specifically wants the prior-art community path.

Source link:

- Source repo: https://github.com/ahujasid/blender-mcp

What this route is:

- The original community Blender MCP server (21K+ GitHub stars, predates both Route A and Route B by ~1 year). It pioneered the pattern that Anthropic and Blender Foundation later adopted.
- Mature, widely demoed, the canonical "Blender + AI" path for non-Claude MCP clients.
- Tool surface includes `get_scene_info`, `execute_blender_code`, viewport screenshots, and optional integrations (Hyper3D, Hunyuan3D, Poly Haven, Sketchfab).
- Third-party from both Anthropic's and Blender Foundation's perspective; not endorsed by either organization.

Required setup guidance (defer to upstream for exact current commands):

1. Install `uv` (the fast Python package runner) per upstream instructions.
2. In your MCP client config, register a `blender` MCP server with `command: uvx, args: [blender-mcp]`. For Claude Desktop this is Settings → Developer → Edit Config.
3. Download `addon.py` from the upstream repo, install it in Blender via Edit → Preferences → Add-ons → Install, and enable it.
4. Open the BlenderMCP tab in Blender's 3D View sidebar (`N`) and click Connect to Claude (or your client).
5. Restart your MCP client so it discovers the new server.

Current BlendOps evidence:

- User reports verifying this route as working (2026-05-08 statement).
- No formal evidence record file with this route's tool names (`get_scene_info`, `execute_blender_code`) exists yet.
- A fresh evidence record is needed to upgrade verification status from "user-reported" to documented "Verified".

Caveats:

- Third-party software; review the upstream repo, license, issue tracker, and security posture before use.
- `execute_blender_code` runs LLM-generated Python with no sandbox. Save before destructive operations and prefer disposable scenes for first runs.
- Port conflicts: do not run Route B and Route C concurrently against the same Blender instance unless you intentionally change ports — both default to commonly the same `localhost:9876` range.
- Configure each MCP client separately; Claude Desktop config does not configure Cursor / Codex / OpenCode.

For the longer caveat write-up see [`docs/unofficial-runtime-bridges.md`](./unofficial-runtime-bridges.md).

---

## Route D — Official Blender CLI

Use this route when no MCP route is available, when scripted batch processing fits the task, or as a deterministic fallback.

Source link:

- Blender CLI docs: https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

What this route is:

- Direct invocation of the Blender executable with `--background`, `--python script.py`, `--render-output`, etc.
- No MCP, no Claude Desktop, no LLM-side tool calls. Agent-agnostic.
- Deterministic: the same script + same `.blend` file produces the same result.

Required setup guidance:

- Blender must be installed and reachable via an explicit executable path or a verified `PATH` entry.
- The operator/agent must record the exact Blender command, input script, output paths, generated files, exit status, logs, and validation evidence.
- No artifact claim is allowed without evidence.

Current BlendOps evidence:

- Full CLI eval is `Not Run`.
- Preview/render/GLB artifacts are `Not Produced`.

---

## Single-client constraint

Blender accepts a single MCP client per session. If two clients try to connect to the same Blender instance via MCP simultaneously, the second one silently fails. Pick one route per session, or quit one before starting the other.

This applies across routes too: do not run Route A + Route B + Route C concurrently against the same Blender instance.

---

## Mapping routes to clients

| Client | Route A | Route B | Route C | Route D |
|---|---|---|---|---|
| Claude Desktop | ✅ One-click | ✅ Manual MCP config | ✅ Manual MCP config | ✅ (via shell) |
| Claude Code | ❌ Not applicable | ✅ Manual MCP config | ✅ Manual MCP config | ✅ |
| Cursor / Codex / OpenCode / Cline / VS Code | ❌ Not applicable | ✅ Manual MCP config | ✅ Manual MCP config | ✅ |
| ChatGPT (OpenAI Skills UI) | ❌ Not applicable | ❌ No MCP host yet | ❌ No MCP host yet | ✅ (via shell handoff) |

Route A is **Claude Desktop only** because it is an Anthropic Connector, not a portable MCP server. Routes B, C, D are portable across clients.

---

## What the next runtime eval should look like

For the next real runtime eval, the operator should:

1. Pick exactly **one** route and name it explicitly.
2. Record the exact Blender version (`blender --version`).
3. Record the exact MCP server source (URL or repo + commit).
4. Record the exact tool names called and the exact responses.
5. Capture mutation/render/export evidence only after a read-only test passes.
6. Save the record under `docs/evals/` with a filename that names the route (e.g., `route-c-ahujasid-readonly-eval-YYYY-MM-DD.md`).

Until that exists, BlendOps documentation must continue to label runtime status `Not Run` and artifact status `Not Produced` for all routes.

---

## Non-claims preserved

This document does not:

- install Blender or any MCP server,
- run Blender,
- claim Route A is verified (no fresh evidence),
- claim Route B is verified (smoke test attribution is ambiguous),
- claim Route C is verified (user-reported only, no evidence file),
- claim Route D is verified (`Not Run`),
- elevate any route to "stable" or "release-ready",
- recommend running multiple routes concurrently against the same Blender instance.
