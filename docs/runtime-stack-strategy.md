

# Runtime Stack Strategy

Status: Draft v0 stack decision  
Scope: Runtime path selection for future BlendOps evals, not runtime execution

> [!CAUTION]
> This document does not install Blender, run Blender, mutate a scene, render, export GLB, or claim runtime artifacts. Full BlendOps runtime eval remains `Not Run`, and preview/render/GLB artifacts remain `Not Produced` until an eval record captures evidence.

---

## Why this doc exists (history of corrections)

Earlier drafts of BlendOps documented a "3-stack" then a "4-route" model that mis-described how the official Blender + LLM stack actually works. Direct upstream reading on 2026-05-08 corrected those mistakes:

- **Anthropic's Claude Desktop "Blender" Connector is not standalone.** The Anthropic Connector is not standalone: the Anthropic tutorial ([claude.com/.../using-the-blender-connector-in-claude](https://claude.com/resources/tutorials/using-the-blender-connector-in-claude)) explicitly says: "First, add the Blender connector in Claude Desktop, **then install an add-on inside Blender** so the two can communicate." The "add-on" is the Blender Lab MCP add-on from [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/). So Anthropic Connector is a **host** option for the same Blender-side stack — not a parallel runtime.
- **Blender 5.1+ is the practical floor for the official MCP path.** Anthropic's tutorial mentions "Blender 4.2 or later" as a prerequisite, but the Lab add-on it tells you to install ships as `mcp-1.0.3.zip?...&blender_version_min=5.1.0`, and the add-on manifest declares the same literal. The 5.1+ floor governs the whole official MCP path (verified 2026-10-13).
- **The 2026-04-29 read-only smoke test is consistent with Path 1.** The recorded tools (`get_blendfile_summary_path_info`, `get_blendfile_summary_datablocks`, `get_objects_summary`) match the Lab MCP tool surface. Since Anthropic Connector talks through Lab MCP anyway, the original "Claude Desktop Connector" attribution is likely correct — the tool names are *not* a contradiction. The smoke test simply does not cover mutation/render/export.
- **Blender CLI is documented upstream as a first-class Blender CLI surface, but BlendOps tracks it as an appendix.** The Blender CLI (`blender --background --python ...`, render flags, `--factory-startup`, etc.) is documented in the official Blender Manual; BlendOps read the command-line sections in the current Blender 5.2 LTS Manual and does not assert stability beyond that. BlendOps simply has **no in-repo evidence file yet** capturing a CLI-fallback eval. CLI is therefore an **appendix / fallback escape hatch** — not because it is unstable, but because BlendOps has not produced a per-recipe captured eval record for it.

The model below uses **two MCP execution paths** (which differ by Blender-side stack) plus a **CLI fallback appendix**. Within Path 1, you pick one of two **MCP host** options.

---

## Path summary

BlendOps recognizes **two MCP execution paths** plus a **CLI fallback appendix**:

| Path | Blender-side stack | MCP host (your choice within the path) | Practical min Blender | BlendOps verification |
|---|---|---|---|---|
| **Path 1 — Official Blender Lab MCP** | **Lab MCP add-on + Lab MCP server** from blender.org/lab/mcp-server (`bpype/blender_mcp`) | (a) Anthropic Blender Connector in Claude Desktop (one-click toggle); OR (b) any other MCP client (Claude Code, Cursor, Codex, OpenCode, Cline, VS Code) configured manually using the `.mcpb` bundle or source. | **5.1+** (Lab install-link parameter `blender_version_min=5.1.0` + add-on manifest literal `5.1.0`, both re-verified 2026-10-13) | **User-reported verified** by repo owner (operator statement, does not promote eval scope; 2026-04-29 read-only smoke + 2026-05-09 operator confirms full Path 1 works in their environment). No formal in-repo evidence file with mutation/render/export tool calls yet. |
| **Path 2 — Community `mcp-for-blender` (formerly `ahujasid/blender-mcp`)** | Different `addon.py` + server started via `uvx mcp-for-blender` (legacy `uvx blender-mcp` still works; third-party, 30.7k stars as of 2026-10-13) | Any MCP client (Claude Desktop with manual `mcpServers` config, Cursor, Codex, OpenCode, Cline, VS Code) | **3.0+** (per upstream) | **User-reported verified** by repo owner (operator statement, does not promote eval scope; 2026-05-08, reconfirmed 2026-05-09). No formal in-repo evidence file with Path 2 tool names yet. |
| **CLI fallback (appendix)** | None — direct `blender` executable | Shell / agent invokes `blender --background --python` | 4.2+ recommended ([Blender CLI docs](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html), command-line sections read in the current Blender 5.2 LTS Manual) | Documented upstream as a first-class Blender CLI surface. No in-repo evidence file yet. |

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
  → Blender Lab MCP add-on inside Blender 5.1+ (mcp-1.0.3.zip from blender.org/lab)
  → live Blender session
```

**Blender-side install (always required, host-independent):**

1. Install **Blender 5.1+** (Lab add-on will not load on earlier versions).
2. Open `blender.org/lab/mcp-server` in a browser alongside Blender.
3. Drag the install link into Blender (first time registers the Blender Lab repository, second time installs the add-on). Or download the `.zip` and Install from Disk.
4. Install/start the **MCP server** part: either the `.mcpb` MCP Bundle (newer clients; Lab page: "For newer clients that support `.mcpb` files…") or from source per upstream Setup wiki (wiki not directly re-read; manual check pending).

**Host-side install — pick exactly one option per Blender session:**

- **Host option (a) — Anthropic Blender Connector (Claude Desktop only):**
  1. Claude Desktop → Customize → Connectors → search "Blender" → Add.
  2. Start the connection either via Edit → Preferences → Add-ons → BlenderMCP → "start MCP server" (Anthropic tutorial Step 3, primary) or via the 3D Viewport `N` → BlenderMCP tab → "Connect to Claude" (client-docs flow; Lab-side primary confirmation pending).
  3. Tool surface appears under the connector icon in the Claude Desktop chat input.
- **Host option (b) — Manual MCP client (any other MCP-capable client, including Claude Desktop's own Developer config):**
  1. Register the Lab MCP server in your client's MCP config (`mcpServers` JSON or equivalent UI). Use the `.mcpb` bundle or source-installed entrypoint per the Lab Setup wiki.
  2. Restart your client so it discovers the new server.
  3. Start the connection either via Edit → Preferences → Add-ons → BlenderMCP → "start MCP server" or via the 3D Viewport `N` → BlenderMCP tab → connect.

**Tool surface (Lab MCP):** `get_blendfile_summary_path_info`, `get_blendfile_summary_datablocks`, `get_blendfile_summary_missing_files`, `get_blendfile_summary_of_linked_libraries`, `get_objects_summary`, plus the equivalent `*_for_cli` variants and Python execution tools. Same set regardless of which host you pick. (Full surface read directly from `readme_tools.rst` on 2026-10-13: 20 distinct tools — the six above plus object-detail, API/manual search, screenshot, view-jump, and render-to-path tools, plus 6 `*_for_cli` background-mode duplicates. Note for future "read-only" evals: `render_viewport_to_path` and `render_thumbnail_to_path` write files.)

**BlendOps evidence:** The 2026-04-29 read-only smoke test recorded `get_blendfile_summary_*` and `get_objects_summary` calls — these are consistent with Lab MCP (see qualifier above). The original "Claude Desktop Connector" attribution is consistent with host option (a). On 2026-05-09 the repo owner verbally reconfirmed Path 1 works in their environment for full execution. **However, no formal in-repo evidence file with mutation/render/export tool calls exists yet**, so full Path 1 eval remains `Not Run` per BlendOps evidence rules — verbal confirmation is recorded as "User-reported verified" but does not promote to a formal eval record.

---

## Path 2 — Community `mcp-for-blender` (formerly `ahujasid/blender-mcp`)

**Source:** https://github.com/ahujasid/mcp-for-blender (30.7k stars as of 2026-10-13; predates Path 1 by ~1 year, pioneered the Blender + MCP pattern).

**Conceptual chain:**

```txt
MCP client (any)
  → MCP transport
  → mcp-for-blender server (uvx mcp-for-blender; legacy blender-mcp name still works)
  → upstream addon.py inside Blender 3.0+
  → live Blender session
```

**Setup (defer to upstream README for exact current commands):**

1. Install Blender 3.0+.
2. Install `uv` per upstream instructions.
3. Preferred: `uvx mcp-for-blender setup` or the one-line `install.sh` / `install.ps1` from the upstream README (handles `install-addon` + `.bak` backup). Manual alternative: in your MCP client's MCP config (e.g. Claude Desktop → Settings → Developer → Edit Config) register: `command: uvx, args: [mcp-for-blender]` (legacy `blender-mcp` name still works).
4. Blender add-on: auto-installed by `setup`/`install-addon`, or manual fallback — download `addon.py` from the upstream repo. Blender → Edit → Preferences → Add-ons → Install → enable.
5. In Blender's 3D Viewport press `N` → "MCP for Blender" tab → connect.
6. Restart your MCP client so it discovers the new server.

**Tool surface (community):** the upstream README lists nine tools — `execute_blender_code`, `look`, `get_scene_info`, `generate_3d`, `search_assets` / `import_asset`, `get_addon_status`, `disable_telemetry`, `record_trajectory_feedback` (read 2026-10-13; optional integrations for Hyper3D / Hunyuan3D / Poly Haven / Sketchfab are enabled per the upstream README, so defer there for the exact current list). **Different** from Lab MCP's tool surface. Defer to upstream README for exact current commands.

**BlendOps evidence:** User-reported verified by repo owner (2026-05-08 statement, reconfirmed 2026-05-09). No formal evidence record file with Path 2 tool names yet.

**Caveats:** [`docs/unofficial-runtime-bridges.md`](./unofficial-runtime-bridges.md). Third-party from both Anthropic and Blender Foundation. `execute_blender_code` runs LLM-generated Python with no sandbox.

---

## CLI fallback (appendix)

**Source:** https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

**What it is:** Direct `blender --background`, `--python script.py`, render flags, etc. No MCP, no LLM-side tool calls, agent-agnostic, deterministic.

**Maturity note:** Blender's CLI is an upstream-documented surface (render/Cycles/format/Python sections read in the current Blender 5.2 LTS Manual). Stability beyond the current LTS is not asserted. The CLI flags `--background`, `--python`, `--render-output`, `--render-frame`, `--factory-startup`, etc. are documented in the current Manual.

**BlendOps evidence:** No in-repo eval record file yet. Operators who use shell `blender` should still record the exact command, inputs, output paths, exit code, and validation evidence per `docs/evals/official-runtime-verification-criteria.md` before any artifact claim — this is for **provenance**, not because the CLI itself is unstable.

**Evidence status:** `Not Run` / `Not Produced` until an in-repo eval record exists. The path itself is upstream-documented.

### CLI compatibility considerations (from upstream research, 2026-05-09)

The CLI fallback is fully compatible with batch-style BlendOps workflows (plan → execute as one Python script → render → export → validate). Operators picking this path should know the following operational caveats sourced from upstream Blender / glTF docs:

| Topic | Notes |
|---|---|
| **GLB export in `--background` mode** | `bpy.ops.export_scene.gltf(filepath=...)` works in Blender 4.5+. The historical headless-mode bug ([KhronosGroup/glTF-Blender-IO #1281](https://github.com/KhronosGroup/glTF-Blender-IO/issues/1281), `on_export_format_changed()` accessing `context.space_data` which is None) was fixed upstream by adding a null check. Recommended invocation: `blender -b file.blend --python-expr "import bpy; bpy.ops.export_scene.gltf(filepath='out.glb')"` or `-P script.py`. |
| **Add-on enablement under `--factory-startup`** | Add-ons are not auto-loaded when `--factory-startup` is used. Re-enable explicitly inside the Python script (e.g. `bpy.ops.preferences.addon_enable(module='io_scene_gltf2')`) (and similarly for any other add-on the recipe depends on). |
| **GPU rendering** | Headless GPU rendering is supported via `--cycles-device CUDA \| OPTIX \| HIP \| ONEAPI \| METAL`. Append `+CPU` to render on both (e.g. `OPTIX+CPU`). Example: `blender -b file.blend -P script.py -- --cycles-device OPTIX`. |
| **Camera renders vs viewport screenshots** | `bpy.ops.render.render(write_still=True)` works in `--background` mode (camera-based rendering). GUI-bound viewport ops need a window/OpenGL context (community reports); prefer camera renders headless — recipes that need viewport captures should target Path 1/Path 2 instead. |
| **Stateless invocation** | Each `blender -b ...` run starts fresh and exits when the script completes. Iterative back-and-forth refinement workflows ("now make it more red → now move the camera up") fit the **MCP paths (Path 1 / Path 2)** better, where Blender stays alive across tool calls. CLI is best for single-shot recipes (cyberpunk shoe hero end-to-end as one script) and CI/render-farm batch jobs. |
| **Output flag ordering** | Blender CLI args execute in the order given. Render flags (`-f` / `-a`) must come **after** `-o` (output path) and `-F` (format). Wrong ordering silently uses defaults. |
| **Engine + threads** | `-E CYCLES \| BLENDER_EEVEE \| WORKBENCH` selects render engine; `-t N` sets thread count. Version note: the Eevee token was `BLENDER_EEVEE` on Blender 4.0–4.1, renamed to `BLENDER_EEVEE_NEXT` on 4.2–4.x, and renamed back to `BLENDER_EEVEE` on 5.x (4.2/5.x rename corroborated 2026-10-14 via the third-party compat matrix in `RobLe3/cc-blender-skill`; the Blender 5.2 API docs list only `BLENDER_EEVEE`). Scripts targeting 4.x should try one name, then the other; run `blender -E help` on the installed version for its exact tokens. |
| **Script args separator** | Use `--` to separate Blender args from your Python script's own args: `blender -b file.blend -P script.py -- --my-arg value`. |
| **Script auto-execution** | `-y` / `--enable-autoexec` enables automatic Python script execution; `-Y` / `--disable-autoexec` disables it (`advanced/scripting/security.html`). |

**Verdict:** CLI is **compatible** with BlendOps batch recipes (plan → render → GLB → validate) on Blender 4.5+ when the script handles add-on enablement, uses the GLB export pattern above, and avoids GUI-only ops. CLI is **not compatible** with iterative session-based workflows — those need Path 1 or Path 2.

---

## Single-bridge constraint

Blender accepts **one MCP bridge session** per Blender instance on the default port. Do not run **Path 1 (Lab MCP) + Path 2 (community)** concurrently against the same Blender instance on `localhost:9876` — the second connection silently fails. Side-by-side on separate Blender instances is supported upstream via per-instance `--port 9877` (+ matching port in the add-on panel). Pick one path + host per Blender session.

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
3. **Blender-side add-on identity** (Lab MCP add-on version vs `mcp-for-blender` `addon.py` commit).
4. **MCP server source** (`.mcpb` bundle filename / source commit / `uvx mcp-for-blender` version).
5. **MCP host product + version** (Claude Desktop build, Cursor build, etc.).
6. **Exact tool names** invoked + responses.
7. **Single-bridge check** confirming only one MCP host connected.
8. Save under `docs/evals/` with a name like `path-1-anthropic-connector-readonly-YYYY-MM-DD.md` or `path-2-mcp-for-blender-readonly-YYYY-MM-DD.md`.

Until such in-repo records exist, BlendOps documentation labels runtime status `Not Run` / `Not Produced` for full eval scope. The repo owner has user-reported confirmed Path 1 + Path 2 work in their environment, but BlendOps does not promote that to a formal eval record without a captured `docs/evals/...` file.

---

## Non-claims preserved

This document does not:

- install Blender or any MCP server,
- run Blender,
- claim Path 1 is fully verified with an in-repo evidence file (only user-reported verified by repo owner),
- claim Path 2 is fully verified with an in-repo evidence file (only user-reported verified by repo owner),
- claim CLI fallback has an in-repo evidence file (the CLI surface itself is upstream-documented; this only flags absence of a captured eval record),
- elevate any path to "stable" or "release-ready",
- recommend running multiple bridges against one Blender instance.
