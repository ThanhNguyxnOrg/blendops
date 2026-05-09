

# Unofficial Runtime Bridges (Path 2)

Status: Mature third-party / User-managed / Per-client manual config / Not yet covered by a formal BlendOps eval evidence record / Not used for Draft v0 release-readiness claims

> [!CAUTION]
> This page is the longer write-up for **Path 2 — Community Blender MCP (`ahujasid/blender-mcp`)** in the [2-path runtime model](./runtime-stack-strategy.md). Path 2 is unofficial from both Anthropic's and Blender Foundation's perspective, but it is **not** experimental in the engineering-maturity sense — it is a 21K+ star project that pioneered the Blender + MCP pattern. The "unofficial" label here is about provenance, not maturity. Read this page before choosing Path 2, especially the safety section.

BlendOps runtime guidance uses the 2-path model in [runtime-stack-strategy.md](./runtime-stack-strategy.md):

1. Path 1 — Official Blender Lab MCP (Lab add-on + Lab server, hosted from Anthropic Connector or manual MCP client).
2. Path 2 — Community Blender MCP (`ahujasid/blender-mcp`).
3. CLI fallback (appendix) — direct Blender CLI, no MCP; documented upstream as first-class Blender CLI, no in-repo evidence file yet.

This page documents Path 2 details only. Use [external-runtime-setup.md](./external-runtime-setup.md), [reference-runtime.md](./reference-runtime.md), and [runtime-stack-strategy.md](./runtime-stack-strategy.md) for the authoritative cross-path runtime posture.

---

## Why a separate page

`ahujasid/blender-mcp` predates Path 1 (Anthropic Connector + Blender Lab MCP, both publicly released around April 2026) by roughly a year. It pioneered the entire Blender + MCP pattern that the official entries later adopted. For many MCP clients (Cursor, Codex, OpenCode, Cline, VS Code) it remains the most straightforward path, especially if the user is on Blender 3.x or 4.x.

The repo is **third-party from both Anthropic and the Blender Foundation**. That fact, plus the LLM-controlled Python execution surface, are the reasons this page keeps a longer safety section than Path 1.

[Repo: `github.com/ahujasid/blender-mcp`](https://github.com/ahujasid/blender-mcp)

---

## When Path 2 makes sense

| Scenario | Path 2 fit |
|---|---|
| You are on Blender 5.1+ and want the Blender Foundation's own server | Use Path 1 (Lab MCP) instead. |
| You are on Claude Desktop and want Anthropic's one-click toggle | Use Path 1 host option (a) — the Anthropic Connector. (Note: Connector still requires Lab add-on in Blender 5.1+.) |
| You are still on Blender 3.x or 4.x and need MCP | **Path 2** (Path 1 requires 5.1+). |
| You want extras like Hyper3D / Hunyuan3D / Poly Haven / Sketchfab integrations | **Path 2** (those are Path 2-only integrations). |
| You are on Cursor / Codex / OpenCode / Cline / VS Code and want minimum config | **Path 2** is often the easiest single command. Path 1 host option (b) is also valid. |

---

## Runtime bridge model

Path 2 has the same MCP-server-plus-Blender-add-on shape as Path 1, but with different upstream code:

| Layer | Responsibility |
|---|---|
| MCP client/host | Claude Code, OpenCode, Cursor, VS Code, Cline, Claude Desktop (with manual MCP config), or another MCP-capable tool. |
| MCP server | `ahujasid/blender-mcp` server process, started via `uvx blender-mcp`. |
| Blender-side add-on | `addon.py` from the upstream repo, installed in Blender via Edit → Preferences → Add-ons → Install. |
| Blender app/session | Blender 3.0+ process and the open scene. |

All four layers must be compatible and connected before a Path 2 session works.

---

## Per-client configuration

Each MCP-capable client needs its own configuration.

- Claude Desktop config does **not** automatically configure Claude Code, OpenCode, Cursor, or VS Code.
- Each client must be configured separately if you want Blender tools in that client.
- The Blender-side add-on or session bridge must also be installed, running, and connected for the selected client session.
- **Single-bridge constraint:** Blender accepts a single MCP bridge session per Blender instance. Do not run Path 1 + Path 2 concurrently against the same Blender instance.

---

## High-level setup guidance

This page does not copy the upstream tutorial verbatim and does not make Path 2 part of BlendOps install. Defer to the upstream README for exact current commands.

If you choose Path 2:

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

Path 2 exposes powerful operations inside Blender, including LLM-controlled Python execution.

Before use:

- Inspect the upstream repository, issue history, license, terms, telemetry behavior, and security posture.
- Assume arbitrary Python or code execution inside Blender is possible — `execute_blender_code` runs LLM-generated Python with no sandbox.
- Avoid important Blender files for first tests; use disposable scenes.
- Disable telemetry if desired and if supported upstream.
- Avoid running multiple Blender MCP servers at once — Blender accepts one MCP client per session, and ports commonly collide around `localhost:9876`.
- Do not claim preview, render, GLB, or Blender artifacts without generated evidence.
- Record failures, caveats, prompts, actions, and generated file paths if you later use this path experimentally.

---

## Evidence status

| Item | Status |
|---|---|
| User-reported verified by repo owner | Yes (2026-05-08 statement) |
| Formal BlendOps evidence record file naming Path 2 | **No — not yet** |
| Tools used in 2026-04-29 smoke test | `get_blendfile_summary_path_info`, `get_blendfile_summary_datablocks`, `get_objects_summary` — these are **Path 1** Lab MCP tools, **not** Path 2 |
| Path 2 tool surface | `get_scene_info`, `execute_blender_code`, viewport screenshots, optional Hyper3D / Hunyuan3D / Poly Haven / Sketchfab |

Until a fresh evidence record exists with Path 2 tool names, BlendOps documentation labels Path 2 as "user-reported verified, no formal eval evidence file" and runtime status remains `Not Run` for full eval scope.

---

## BlendOps boundary

BlendOps can still provide for Path 2 runs:

- workflow plans
- validation gates
- artifact truth rules
- user-facing handoff language
- safety and evidence expectations

BlendOps does **not** own, ship, support, audit, maintain, or validate `ahujasid/blender-mcp`. A run through Path 2 must be labeled with the path, the upstream commit, and explicit evidence — and must not be counted as an official runtime eval or as release-eval evidence until the formal eval flow records it that way.

This page is **not a substitute for the official runtime manual eval**.

The phrase "**user-managed**" in this page means: you, the operator, are responsible for the upstream code, security, telemetry, and artifact evidence — BlendOps does not manage Path 2 for you.

The phrase "**not part of the BlendOps official runtime path**" used in earlier drafts is dropped: Path 2 is one of the two canonical BlendOps MCP runtime paths. What is correct is that Path 2 is **not endorsed** by Anthropic or Blender Foundation, and BlendOps does not claim Path 2 runs are equivalent to Path 1 for "official-from-Blender" purposes.
