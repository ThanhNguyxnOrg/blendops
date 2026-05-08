# Unofficial Runtime Bridges (Route C)

Status: Mature third-party / User-managed / Per-client manual config / Not yet covered by a formal BlendOps eval evidence record / Not used for Draft v0 release-readiness claims

> [!CAUTION]
> This page is the longer write-up for **Route C — Community Blender MCP (`ahujasid/blender-mcp`)** in the [4-route runtime model](./runtime-stack-strategy.md). Route C is unofficial from both Anthropic's and Blender Foundation's perspective, but it is **not** experimental in the engineering-maturity sense — it is a 21K+ star project that pioneered the Blender + MCP pattern and remains the canonical path for non-Claude MCP clients. The "unofficial" label here is about provenance, not maturity. Read this page before choosing Route C, especially the safety section.

BlendOps public runtime guidance uses the 4-route model in [runtime-stack-strategy.md](./runtime-stack-strategy.md):

1. Route A — Anthropic Blender Connector.
2. Route B — Blender Foundation MCP Server (`bpype/blender_mcp`).
3. Route C — Community Blender MCP (`ahujasid/blender-mcp`).
4. Route D — Official Blender CLI.

This page documents Route C details only. Use [external-runtime-setup.md](./external-runtime-setup.md), [reference-runtime.md](./reference-runtime.md), and [runtime-stack-strategy.md](./runtime-stack-strategy.md) for the authoritative cross-route runtime posture.

---

## Why a separate page

`ahujasid/blender-mcp` predates both Route A (Anthropic, April 2026) and Route B (Blender Foundation Lab) by roughly a year. It pioneered the entire Blender + MCP pattern that the official entries later adopted. For many MCP clients (Cursor, Codex, OpenCode, Cline, VS Code) it remains the most straightforward path because Route A is Claude Desktop only and Route B is newer and Blender-5.1+ only.

The repo is **third-party from both Anthropic and the Blender Foundation**. That fact, plus the LLM-controlled Python execution surface, are the reasons this page keeps a longer safety section than the other three routes.

[Repo: `github.com/ahujasid/blender-mcp`](https://github.com/ahujasid/blender-mcp)

---

## When Route C makes sense

| Scenario | Route C fit |
|---|---|
| You use Claude Desktop and want zero config | Use Route A instead. |
| You are on Blender 5.1+ and want the Blender Foundation's own server | Use Route B instead. |
| You are on Cursor / Codex / OpenCode / Cline / VS Code | **Route C** (Routes A and B may not have first-class client paths yet). |
| You are on Claude Desktop but want extras like Hyper3D / Hunyuan3D / Poly Haven / Sketchfab | **Route C** (those are Route C-only integrations). |
| You are still on Blender 3.x or 4.x and need MCP | **Route C** (Route B requires 5.1+; Route A's tutorial states 4.2+). |

---

## Runtime bridge model

Route C has the same MCP-server-plus-Blender-add-on shape as Route B, but with different upstream code:

| Layer | Responsibility |
|---|---|
| MCP client/host | Claude Code, OpenCode, Cursor, VS Code, Cline, Claude Desktop (with manual MCP config), or another MCP-capable tool. |
| MCP server | `ahujasid/blender-mcp` server process, started via `uvx blender-mcp`. |
| Blender-side add-on | `addon.py` from the upstream repo, installed in Blender via Edit → Preferences → Add-ons → Install. |
| Blender app/session | Blender 3.0+ process and the open scene. |

All four layers must be compatible and connected before a Route C session works.

---

## Per-client configuration

Each MCP-capable client needs its own configuration.

- Claude Desktop config does **not** automatically configure Claude Code, OpenCode, Cursor, or VS Code.
- Claude Code, OpenCode, Cursor, and VS Code must each be configured separately if you want Blender tools in that client.
- The Blender-side add-on or session bridge must also be installed, running, and connected for the selected client session.
- **Single-client constraint:** Blender accepts a single MCP client per session. Do not run Route A + Route B + Route C concurrently against the same Blender instance.

---

## High-level setup guidance

This page does not copy the upstream tutorial verbatim and does not make Route C part of BlendOps install. Defer to the upstream README for exact current commands.

If you choose Route C:

1. Read the upstream README, security notes, and license first.
2. Install `uv` (the fast Python package runner) per upstream instructions.
3. In your MCP client config, register a `blender` MCP server with `command: uvx, args: [blender-mcp]`. For Claude Desktop this is Settings → Developer → Edit Config.
4. Download `addon.py` from the upstream repo and install it in Blender (Edit → Preferences → Add-ons → Install), then enable it.
5. Open the BlenderMCP tab in Blender's 3D View sidebar (`N`) and click Connect to your client.
6. Restart your MCP client so it discovers the new server.
7. Run a read-only request (e.g., `get_scene_info`) before any mutation.
8. Save the file before any destructive operation; prefer disposable scenes for first runs.

---

## Safety notes

Route C exposes powerful operations inside Blender, including LLM-controlled Python execution.

Before use:

- Inspect the upstream repository, issue history, license, terms, telemetry behavior, and security posture.
- Assume arbitrary Python or code execution inside Blender is possible — `execute_blender_code` runs LLM-generated Python with no sandbox.
- Avoid important Blender files for first tests; use disposable scenes.
- Disable telemetry if desired and if supported upstream.
- Avoid running multiple Blender MCP servers at once — Blender accepts one MCP client per session, and ports commonly collide around `localhost:9876`.
- Do not claim preview, render, GLB, or Blender artifacts without generated evidence.
- Record failures, caveats, prompts, actions, and generated file paths if you later use this route experimentally.

---

## Evidence status

| Item | Status |
|---|---|
| User-reported verified by repo owner | Yes (2026-05-08 statement) |
| Formal BlendOps evidence record file naming Route C | **No — not yet** |
| Tools used in 2026-04-29 smoke test | `get_blendfile_summary_path_info`, `get_blendfile_summary_datablocks`, `get_objects_summary` — these match Route B, **not** Route C |
| Route C tool surface | `get_scene_info`, `execute_blender_code`, viewport screenshots, optional Hyper3D / Hunyuan3D / Poly Haven / Sketchfab |

Until a fresh evidence record exists with Route C tool names, BlendOps documentation labels Route C as "user-reported verified, no formal eval evidence file" and runtime status remains `Not Run` for release-eval purposes.

---

## BlendOps boundary

BlendOps can still provide for Route C runs:

- workflow plans
- validation gates
- artifact truth rules
- user-facing handoff language
- safety and evidence expectations

BlendOps does **not** own, ship, support, audit, maintain, or validate `ahujasid/blender-mcp`. A run through Route C must be labeled with the route, the upstream commit, and explicit evidence — and must not be counted as an official runtime eval or as release-eval evidence until the formal eval flow records it that way.

This page is **not a substitute for the official runtime manual eval**.

The phrase "**user-managed**" in this page means: you, the operator, are responsible for the upstream code, security, telemetry, and artifact evidence — BlendOps does not manage Route C for you.

The phrase "**not part of the BlendOps official runtime path**" used in earlier drafts is dropped: Route C is one of the four canonical BlendOps runtime routes. What is correct is that Route C is **not endorsed** by Anthropic or Blender Foundation, and BlendOps does not claim Route C runs are equivalent to Routes A or B for "official" purposes.
