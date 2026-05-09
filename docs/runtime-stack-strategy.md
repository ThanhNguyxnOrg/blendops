

# Runtime Stack Strategy

Status: Draft v0 stack decision  
Scope: Runtime path selection for future BlendOps evals, not runtime execution

> [!CAUTION]
> This document does not install Blender, run Blender, mutate a scene, render, export GLB, or claim runtime artifacts. Full BlendOps runtime eval remains `Not Run`, and preview/render/GLB artifacts remain `Not Produced` until an eval record captures evidence.

---

## Why this doc exists (history of corrections)

Earlier drafts of BlendOps documented a "3-stack" then a "4-route" model that mis-described how the official Blender + LLM stack actually works. Direct upstream reading on 2026-05-08 corrected those mistakes:

- **Anthropic's Claude Desktop "Blender" Connector is not standalone.** The Anthropic Connector is not standalone: the Anthropic tutorial ([claude.com/.../using-the-blender-connector-in-claude](https://claude.com/resources/tutorials/using-the-blender-connector-in-claude)) explicitly says: "First, add the Blender connector in Claude Desktop, **then install an add-on inside Blender** so the two can communicate." The "add-on" is the Blender Lab MCP add-on from [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/). So Anthropic Connector is a **host** option for the same Blender-side stack — not a parallel runtime.
- **Blender 5.1+ is the practical floor for the official MCP path.** Anthropic's tutorial mentions "Blender 4.2 or later" as a prerequisite, but the Lab add-on it tells you to install ships as `mcp-1.0.0.zip?...&blender_version_min=5.1.0`. The Lab page itself lists "Blender 5.1 or newer" as requirement #1. The 5.1+ floor governs the whole official MCP path.
- **The 2026-04-29 read-only smoke test is consistent with Path 1.** The recorded tools (`get_blendfile_summary_path_info`, `get_blendfile_summary_datablocks`, `get_objects_summary`) match the Lab MCP tool surface. Since Anthropic Connector talks through Lab MCP anyway, the original "Claude Desktop Connector" attribution is likely correct — the tool names are *not* a contradiction. The smoke test simply does not cover mutation/render/export.
- **Blender CLI is documented upstream as a first-class surface, but BlendOps tracks it as an appendix.** The Blender CLI (`blender --background --python ...`, render flags, `--factory-startup`, etc.) is documented in the official Blender Manual continuously from 1.x through 5.2 LTS and used widely in render farms, HPC clusters, and CI pipelines. BlendOps simply has **no in-repo evidence file yet** capturing a CLI-fallback eval; the path itself is upstream-stable. CLI is therefore an **appendix / fallback escape hatch** — not because it is unstable, but because BlendOps has not produced a per-recipe captured eval record for it.

The model below uses **two MCP execution paths** (which differ by Blender-side stack) plus a **CLI fallback appendix**. Within Path 1, you pick one of two **MCP host** options.

---

## Path summary

BlendOps recognizes **two MCP execution paths** plus a **CLI fallback appendix**:

| Path | Blender-side stack | MCP host (your choice within the path) | Practical min Blender | BlendOps verification |
|---|---|---|---|---|
| **Path 1 — Official Blender Lab MCP** | **Lab MCP add-on + Lab MCP server** from blender.org/lab/mcp-server (`bpype/blender_mcp`) | (a) Anthropic Blender Connector in Claude Desktop (one-click toggle); OR (b) any other MCP client (Claude Code, Cursor, Codex, OpenCode, Cline, VS Code) configured manually using the `.mcpb` bundle or source. | **5.1+** (Lab add-on `blender_manifest.toml: blender_version_min = "5.1.0"`) | **User-reported verified** by repo owner (2026-04-29 read-only smoke + 2026-05-09 operator confirms full Path 1 works in their environment). No formal in-repo evidence file with mutation/render/export tool calls yet. |
| **Path 2 — Community `ahujasid/blender-mcp`** | Different `addon.py` + server started via `uvx blender-mcp` (third-party, 21K+ stars, prior art) | Any MCP client (Claude Desktop with manual `mcpServers` config, Cursor, Codex, OpenCode, Cline, VS Code) | **3.0+** (per upstream) | **User-reported verified** by repo owner (2026-05-08, reconfirmed 2026-05-09). No formal in-repo evidence file with Path 2 tool names yet. |
| **CLI fallback (appendix)** | None — direct `blender` executable | Shell / agent invokes `blender --background --python` | 4.2+ recommended ([Blender CLI docs](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html), stable across 4.5 LTS / 5.2 LTS) | **Documented upstream as a first-class Blender CLI surface**, stable across decades and used widely in render farms, HPC, and CI pipelines. No in-repo evidence file yet. |

> [!IMPORTANT]
> **Anthropic Connector and Lab MCP are NOT independent products.** Anthropic Connector is the Claude-Desktop-specific host for the same Lab MCP stack. You install the Lab add-on in Blender either way. The Connector toggle just spares you from registering the MCP server in `mcpServers` JSON manually.

---

## Path 1 — Official Blender Lab MCP

**Sources:**
- Anthropic tutorial (host option a): https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- Blender Lab page (canonical for Blender side): https://www.blender.org/lab/mcp-server/
- Lab repo: https://projects.blender.org/lab/blender_mcp

**Conceptual chain:**

```txt
MCP host (Anthropic Blender Connector OR manually-configured MCP client)
  → MCP transport
  → Blender Lab MCP server (.mcpb bundle or source install)
  → Blender Lab MCP add-on inside Blender 5.1+ (mcp-1.0.0.zip from blender.org/lab)
  → live Blender session
```

**Blender-side install (always required, host-independent):**

1. Install **Blender 5.1+** (Lab add-on will not load on earlier versions).
2. Open `blender.org/lab/mcp-server` in a browser alongside Blender.
3. Drag the install link into Blender (first time registers the Blender Lab repository, second time installs the add-on). Or download the `.zip` and Install from Disk.
4. Install/start the **MCP server** part: either the `.mcpb` MCP Bundle (newer clients) or from source per upstream Setup wiki.

**Host-side install — pick exactly one option per Blender session:**

- **Host option (a) — Anthropic Blender Connector (Claude Desktop only):**
  1. Claude Desktop → Customize → Connectors → search "Blender" → Add.
  2. Open Blender, in the 3D Viewport press `N` → BlenderMCP tab → "Connect to Claude".
  3. Tool surface appears under the connector icon in the Claude Desktop chat input.
- **Host option (b) — Manual MCP client (any other MCP-capable client, including Claude Desktop's own Developer config):**
  1. Register the Lab MCP server in your client's MCP config (`mcpServers` JSON or equivalent UI). Use the `.mcpb` bundle or source-installed entrypoint per the Lab Setup wiki.
  2. Restart your client so it discovers the new server.
  3. Open Blender, in the 3D Viewport press `N` → BlenderMCP tab → connect.

**Tool surface (Lab MCP):** `get_blendfile_summary_path_info`, `get_blendfile_summary_datablocks`, `get_blendfile_summary_missing_files`, `get_blendfile_summary_of_linked_libraries`, `get_objects_summary`, plus the equivalent `*_for_cli` variants and Python execution tools. Same set regardless of which host you pick.

**BlendOps evidence:** The 2026-04-29 read-only smoke test recorded `get_blendfile_summary_*` and `get_objects_summary` calls — these match Lab MCP exactly. The original "Claude Desktop Connector" attribution is consistent with host option (a). On 2026-05-09 the repo owner verbally reconfirmed Path 1 works in their environment for full execution. **However, no formal in-repo evidence file with mutation/render/export tool calls exists yet**, so full Path 1 eval remains `Not Run` per BlendOps evidence rules — verbal confirmation is recorded as "User-reported verified" but does not promote to a formal eval record.

---

## Path 2 — Community `ahujasid/blender-mcp`

**Source:** https://github.com/ahujasid/blender-mcp (21K+ stars, predates Path 1 by ~1 year, pioneered the Blender + MCP pattern).

**Conceptual chain:**

```txt
MCP client (any)
  → MCP transport
  → ahujasid/blender-mcp server (uvx blender-mcp)
  → upstream addon.py inside Blender 3.0+
  → live Blender session
```

**Setup (defer to upstream README for exact current commands):**

1. Install Blender 3.0+.
2. Install `uv` per upstream instructions.
3. In your MCP client's MCP config (e.g. Claude Desktop → Settings → Developer → Edit Config) register: `command: uvx, args: [blender-mcp]`.
4. Download `addon.py` from the upstream repo. Blender → Edit → Preferences → Add-ons → Install → enable.
5. In Blender's 3D Viewport press `N` → BlenderMCP tab → connect.
6. Restart your MCP client so it discovers the new server.

**Tool surface (community):** `get_scene_info`, `execute_blender_code`, viewport screenshots, plus optional Hyper3D / Hunyuan3D / Poly Haven / Sketchfab integrations. **Different** from Lab MCP's tool surface.

**BlendOps evidence:** User-reported verified by repo owner (2026-05-08 statement, reconfirmed 2026-05-09). No formal evidence record file with Path 2 tool names yet.

**Caveats:** [`docs/unofficial-runtime-bridges.md`](./unofficial-runtime-bridges.md). Third-party from both Anthropic and Blender Foundation. `execute_blender_code` runs LLM-generated Python with no sandbox.

---

## CLI fallback (appendix)

**Source:** https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

**What it is:** Direct `blender --background`, `--python script.py`, render flags, etc. No MCP, no LLM-side tool calls, agent-agnostic, deterministic.

**Maturity note:** Blender's CLI is a **first-class, decades-stable surface** documented in the official Blender Manual (continuous coverage from 1.x through 5.2 LTS) and used widely in render farms, HPC clusters, CI pipelines, and scripted automation. It is **not experimental**. The CLI flags `--background`, `--python`, `--render-output`, `--render-frame`, `--factory-startup`, etc. are stable across LTS releases.

**BlendOps evidence:** No in-repo eval record file yet. Operators who use shell `blender` should still record the exact command, inputs, output paths, exit code, and validation evidence per `docs/evals/official-runtime-verification-criteria.md` before any artifact claim — this is for **provenance**, not because the CLI itself is unstable.

**Evidence status:** `Not Run` / `Not Produced` until an in-repo eval record exists. The path itself is upstream-documented and reliable.

---

## Single-bridge constraint

Blender accepts **one MCP bridge session** per Blender instance. Do not run **Path 1 (Lab MCP) + Path 2 (community)** concurrently against the same Blender instance — they typically use the same `localhost:9876` range and the second connection silently fails. Pick one path per Blender session.

Within Path 1, you can have only one host option active at a time too — do not run Anthropic Connector and a manual MCP client both pointed at the same Blender instance.

---

## Mapping paths to clients

| Client | Path 1 host (a) Anthropic Connector | Path 1 host (b) manual MCP | Path 2 community | CLI fallback |
|---|---|---|---|---|
| Claude Desktop | ✅ One-click toggle | ✅ Settings → Developer → Edit Config | ✅ Manual MCP config | ✅ via shell |
| Claude Code | ❌ N/A (Desktop-only host) | ✅ Per Claude Code MCP guide | ✅ MCP config | ✅ |
| Cursor / Codex / OpenCode / Cline / VS Code | ❌ N/A | ✅ MCP config | ✅ MCP config | ✅ |
| ChatGPT (OpenAI Skills UI) | ❌ N/A | ❌ no MCP host yet | ❌ no MCP host yet | ✅ doc-only shell handoff |

The Anthropic Connector is **only** the host option for Claude Desktop. All other MCP clients that want Lab MCP must use Path 1 host option (b) — manually register the Lab MCP server.

---

## What the next runtime eval should record

To upgrade any path's verification status from "User-reported verified" to a documented in-repo eval record:

1. **Path** (1 or 2) and **host option** within Path 1 (a vs b).
2. **`blender --version`** verbatim.
3. **Blender-side add-on identity** (Lab MCP add-on version vs `ahujasid/blender-mcp` `addon.py` commit).
4. **MCP server source** (`.mcpb` bundle filename / source commit / `uvx blender-mcp` version).
5. **MCP host product + version** (Claude Desktop build, Cursor build, etc.).
6. **Exact tool names** invoked + responses.
7. **Single-bridge check** confirming only one MCP host connected.
8. Save under `docs/evals/` with a name like `path-1-anthropic-connector-readonly-YYYY-MM-DD.md` or `path-2-ahujasid-readonly-YYYY-MM-DD.md`.

Until such in-repo records exist, BlendOps documentation labels runtime status `Not Run` / `Not Produced` for full eval scope. The repo owner has user-reported confirmed Path 1 + Path 2 work in their environment, but BlendOps does not promote that to a formal eval record without a captured `docs/evals/...` file.

---

## Non-claims preserved

This document does not:

- install Blender or any MCP server,
- run Blender,
- claim Path 1 is fully verified with an in-repo evidence file (only user-reported verified by repo owner),
- claim Path 2 is fully verified with an in-repo evidence file (only user-reported verified by repo owner),
- claim CLI fallback has an in-repo evidence file (the CLI itself is upstream-stable; this only flags absence of a captured eval record),
- elevate any path to "stable" or "release-ready",
- recommend running multiple bridges against one Blender instance.
