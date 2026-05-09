

# External Runtime Setup

BlendOps is a workflow/product layer and does **not** ship its own BlendOps-owned CLI/MCP/addon runtime.

Active runtime guidance uses the **2-path + CLI appendix** model in [Runtime stack strategy](./runtime-stack-strategy.md).

> [!IMPORTANT]
> Importing BlendOps skills, laws, packs, or docs does not install Blender, the **Blender Lab MCP add-on inside Blender**, the Anthropic Blender Connector, the community `ahujasid/blender-mcp`, or any MCP server process.

---

## Blender version table

| Path | Practical min Blender | Why |
|---|---|---|
| **Path 1** Official Blender Lab MCP (Lab add-on + Lab server, hosted from Anthropic Connector OR manual MCP client) | **5.1+** | Lab add-on `mcp-1.0.0.zip?...&blender_version_min=5.1.0` ([blender.org/lab/mcp-server](https://www.blender.org/lab/mcp-server/)) and Lab page lists "Blender 5.1 or newer" as requirement #1. Anthropic's tutorial says "Blender 4.2 or later" but the add-on it tells you to install requires 5.1+, so **5.1+ is the binding floor**. |
| **Path 2** Community `ahujasid/blender-mcp` | **3.0+** | Upstream targets stable `bpy` ([github.com/ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp)). |
| **CLI fallback (appendix)** | 4.2+ recommended | [Blender CLI docs](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html). **Documented upstream** as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet. |

> [!WARNING]
> The **Anthropic Connector path is not a separate "Blender 4.2+ enough" route.** Anthropic's tutorial step 2 explicitly tells you to install the Blender Lab MCP add-on inside Blender. That add-on requires **Blender 5.1+**. So anyone using Anthropic Connector to drive Blender via MCP is also on Path 1 and bound by the 5.1+ floor.

---

## Path 1 — Official Blender Lab MCP

Same Blender-side stack regardless of which MCP host you pick. Pick exactly one host per Blender session.

### Blender-side install (always required)

1. Install **Blender 5.1+** so the Lab add-on can load.
2. Open `blender.org/lab/mcp-server` in a browser alongside Blender.
3. Drag the install link into Blender twice — first registers the Blender Lab repository, second installs the Lab MCP add-on. Or download `mcp-1.0.0.zip` and Install from Disk.
4. Install/start the **MCP server** part:
   - **MCP Bundle (`.mcpb`)** for clients that support it (recommended for newer hosts), OR
   - From source per the upstream Setup wiki.

### Host option (a) — Anthropic Blender Connector (Claude Desktop only)

Source: [claude.com/.../using-the-blender-connector-in-claude](https://claude.com/resources/tutorials/using-the-blender-connector-in-claude).

1. Claude Desktop → Customize → Connectors → search "Blender" → Add.
2. In Blender's 3D Viewport: press `N` → BlenderMCP tab → "Connect to Claude".
3. The Blender tools appear under the connector icon in the chat input.
4. Read-only request first before mutation/render/export.

The Connector toggle automates the agent-side MCP wiring, but you still installed the Lab add-on in the Blender-side step above. There is no Anthropic-only Blender component.

### Host option (b) — Manual MCP client (Claude Code, Cursor, Codex, OpenCode, etc., or Claude Desktop's Developer config)

Source: Lab Setup wiki + your MCP client's MCP config docs.

1. Register the Lab MCP server in your client's MCP config (`mcpServers` JSON or equivalent UI).
2. Restart your client so it discovers the new server.
3. In Blender: press `N` → BlenderMCP tab → connect.

Same Lab tool surface (`get_blendfile_summary_*`, `get_objects_summary`, etc.) as host option (a).

### Tool surface

`get_blendfile_summary_path_info`, `get_blendfile_summary_datablocks`, `get_blendfile_summary_missing_files`, `get_blendfile_summary_of_linked_libraries`, `get_objects_summary`, plus `*_for_cli` variants and Python execution tools. Same regardless of host option.

### BlendOps evidence

Read-only smoke test 2026-04-29 ([`docs/evals/blender-connector-read-only-smoke-test.md`](./evals/blender-connector-read-only-smoke-test.md)) recorded `get_blendfile_summary_*` and `get_objects_summary` calls. Tool names match Lab MCP exactly. The original "Claude Desktop Connector" attribution is consistent with host option (a). Mutation/render/export not attempted — full Path 1 eval remains `Not Run`. Repo owner verbally reconfirmed 2026-05-09 that Path 1 + Path 2 both work in their environment for full execution; recorded as "User-reported verified" but not promoted to formal eval record without a captured in-repo evidence file.

---

## Path 2 — Community `ahujasid/blender-mcp`

Source: https://github.com/ahujasid/blender-mcp.

### Setup (defer to upstream README for exact current commands)

1. Install Blender 3.0+.
2. Install `uv` per upstream instructions.
3. In your MCP client config register: `command: uvx, args: [blender-mcp]`.
4. Download `addon.py` from upstream → install in Blender via Edit → Preferences → Add-ons → Install → enable.
5. In Blender: press `N` → BlenderMCP tab → connect.
6. Restart your MCP client so it discovers the new server.

### Tool surface

`get_scene_info`, `execute_blender_code`, viewport screenshots, plus optional Hyper3D / Hunyuan3D / Poly Haven / Sketchfab integrations. **Different** from Path 1's Lab MCP surface.

### BlendOps evidence

User-reported verified (2026-05-08 statement). No formal evidence record file with Path 2 tool names yet.

### Caveats

See [`unofficial-runtime-bridges.md`](./unofficial-runtime-bridges.md). Third-party from both Anthropic and Blender Foundation. `execute_blender_code` runs LLM-generated Python with no sandbox.

---

## CLI fallback (appendix)

Direct `blender --background`, `--python`, render flags. Source: [Blender CLI docs](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html).

**Maturity note:** Blender's CLI is a **first-class, decades-stable surface** documented in the official Blender Manual (continuous coverage from 1.x through 5.2 LTS) and used widely in render farms, HPC clusters, CI pipelines, and scripted automation — it is **not experimental**. The `--background`, `--python`, `--render-output`, `--render-frame`, `--factory-startup` flags are stable across LTS releases. **BlendOps simply has no in-repo evidence file yet** capturing a per-recipe CLI-fallback eval. Operators who use shell `blender` should still record the exact command, inputs, output paths, exit code, and validation evidence per `docs/evals/official-runtime-verification-criteria.md` before any artifact claim — for **provenance**, not because the CLI itself is unstable.

**Evidence:** `Not Run` / `Not Produced` until a future eval record exists.

---

## Single-bridge constraint

One MCP bridge session per Blender instance. Do not run **Path 1 (Lab MCP) + Path 2 (community)** concurrently against the same Blender instance. Within Path 1, do not run host option (a) Anthropic Connector and host option (b) manual MCP client both pointed at the same Blender instance.

---

## Return to BlendOps

Once one path is working, continue with BlendOps workflow docs:

- Runtime stack strategy: `./runtime-stack-strategy.md`
- Reference runtime: `./reference-runtime.md`
- Product direction: `./product-direction.md`
- First user journey: `./first-user-journey.md`
- Architecture: `./architecture.md`
- Golden path example: `./golden-path-cyberpunk-shoe.md`
- Workflow contract: `./workflow-contract.md`
- Safety model: `./safety-model.md`

BlendOps role: `natural-language intent` → `scene/workflow plan` → `validation` → `render/export handoff` → `web-ready guidance`

---

## Safety boundary

Both Path 1 and Path 2 expose Blender's Python API to LLM-generated code. Save before destructive operations and prefer disposable scenes for first runs, regardless of path.
