# Install target: Claude Desktop

Status/confidence: Draft v0, linked-only/manual

## Recommended near-term install mode

Claude Desktop can use the concise prompt from [`README.md`](../../README.md#-use-in-30-seconds), which points the assistant to [`AI Agent Quickstart`](../ai-agent-quickstart.md). Expected selected mode is usually **multiple Skills ZIP preparation**, because Claude Desktop-style chats often lack target project write access.

This is not a normal coding-agent install target. Project-local install is only appropriate if the assistant is actually operating inside a writable target project.

## Prompt behavior in Claude Desktop

When the prompt runs in Claude Desktop / Claude.ai / chat-only context, the assistant should prepare one downloadable ZIP per canonical skill from:

```txt
skills/*/SKILL.md
```

If Claude cannot fetch repository subpaths, ask the user to upload the repository files or provide direct source access. Do not invent file contents.

## Multiple ZIP requirements

Expected ZIP files (16 total — 10 domain skills + 6 process / discipline skills inspired by Superpowers + BMad):

```txt
# Help / routing
blendops-help.zip

# Process / discipline (Superpowers + BMad inspired)
blender-brainstorming.zip
intent-to-3d-brief-writer.zip
blender-asset-discovery-planner.zip
blender-troubleshooting.zip
pre-handoff-verification.zip
runtime-bridge-conflict-resolver.zip

# Runtime
official-runtime-setup-guide.zip
official-runtime-readiness-checker.zip

# Scene planning (domain)
product-hero-scene-planner.zip
blender-composition-camera-planner.zip
blender-lighting-material-planner.zip
blender-scene-quality-checker.zip

# Evidence + handoff
render-export-evidence.zip
glb-web-handoff.zip
non-blender-user-response-writer.zip
```

Each ZIP must contain:

```txt
skill-name/
  SKILL.md
```

Packaging rules:

- Create one ZIP per skill directory under `skills/`.
- Do not include `skills/_template/`.
- Do not use `bundles/skill-package/blendops/` when the user wants multiple skills; that bundle is a one-skill umbrella fallback.
- Each ZIP must contain exactly one top-level skill folder and exactly one `SKILL.md`.
- Upload/import remains a manual user action.

If running inside this repo, use:

```sh
npm run skills:export
```

Outputs:

```txt
dist/claude-skills/desktop-zips/*.zip
dist/claude-skills/claude-code-skills/*/SKILL.md
```

## Fallbacks

If downloadable ZIP files cannot be created, the assistant should output the exact per-skill folder tree plus file contents/instructions and clearly say this is fallback only.

If Claude returns only `skill.zip`, `blendops.md`, or `BLENDOPS_SINGLE_FILE.md`, treat that as an umbrella/manual fallback only. Ask it to create separate ZIP files from `skills/*/SKILL.md` when multiple recognized skills are required.

Native Claude Desktop import paths are environment-specific and need user verification.

## Runtime boundary

Skill import/package prep is separate from runtime setup. It does not configure Claude Desktop Connector, install Blender, configure the Blender-side official MCP bridge/add-on, run Blender, run runtime eval, render, export, or produce artifacts.

Runtime status remains `Not Run`. Artifact status remains `Not Produced`.

## After importing BlendOps skills — actually running Blender

Importing BlendOps skills into Claude Desktop only loads the BlendOps content layer. To **actually drive Blender from Claude Desktop**, follow [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md). Claude Desktop sits on **Path 1 (Lab MCP)** with two host options, **Path 2 (community `ahujasid/blender-mcp`)**, or the **CLI fallback** (Blender's first-class CLI surface, documented upstream; no in-repo evidence file yet).

### Path 1 — Official Blender Lab MCP (recommended for Claude Desktop)

**Blender-side install (always required, regardless of host option):**

1. Install **Blender 5.1+** (Lab add-on declares `blender_manifest.toml: blender_version_min = "5.1.0"` — earlier Blender will not load it).
2. Open `blender.org/lab/mcp-server` in a browser alongside Blender.
3. Drag the install link into Blender **twice**: first registers the Blender Lab repository, second installs the Lab MCP add-on. Or download the `.zip` and Install from Disk.
4. Install/start the **MCP server** part: either the `.mcpb` MCP Bundle (recommended for newer hosts), or from source per the upstream Setup wiki.

> [!IMPORTANT]
> **Anthropic Connector is not standalone.** Anthropic's tutorial step 2 explicitly tells you to install this same Lab MCP add-on inside Blender. The Connector toggle automates the agent-side MCP wiring — it does **not** replace the Blender-side install above. The "Blender 4.2+" line in Anthropic's prerequisites is contradicted by the add-on it tells you to install (which needs **5.1+**), so the binding floor for Path 1 is **Blender 5.1+**.

**Then pick exactly one host option for Path 1:**

#### Path 1, host (a) — Anthropic Blender Connector (Claude Desktop one-click)

Source: [claude.com/.../using-the-blender-connector-in-claude](https://claude.com/resources/tutorials/using-the-blender-connector-in-claude).

1. Claude Desktop → Customize → Connectors → search "Blender" → Add.
2. In Blender's 3D Viewport press `N` → BlenderMCP tab → "Connect to Claude".
3. Blender tools appear under the connector icon in the chat input. Read-only request first before mutation/render/export.

#### Path 1, host (b) — Manual MCP client config (Claude Desktop's Developer JSON, or any other MCP client)

1. Claude Desktop → Settings → Developer → Edit Config → register the Lab MCP server in `mcpServers` (use the `.mcpb` entry per the Lab Setup wiki).
2. Restart Claude Desktop so it discovers the new server.
3. In Blender press `N` → BlenderMCP tab → connect.

Same Lab tool surface (`get_blendfile_summary_*`, `get_objects_summary`, …) as host (a). Use this when you do not want the Connector toggle, or when you are on a non-Claude-Desktop MCP client.

### Path 2 — Community `ahujasid/blender-mcp` (mature third-party)

Use this if you want the prior-art community path, want Hyper3D / Hunyuan3D / Poly Haven / Sketchfab integrations, or are on Blender 3.x / 4.x.

1. Install Blender 3.0+ (uses stable `bpy`).
2. Install `uv` per upstream instructions.
3. Claude Desktop → Settings → Developer → Edit Config → add:
   ```json
   {
     "mcpServers": {
       "blender": { "command": "uvx", "args": ["blender-mcp"] }
     }
   }
   ```
4. Download `addon.py` from [`github.com/ahujasid/blender-mcp`](https://github.com/ahujasid/blender-mcp), install in Blender via Edit → Preferences → Add-ons → Install, enable it.
5. Restart Claude Desktop so it discovers the new MCP server.

Caveats for Path 2 live in [`docs/unofficial-runtime-bridges.md`](../unofficial-runtime-bridges.md). Read them before use.

### CLI fallback (appendix)

`blender --background --python script.py` per [Blender CLI docs](https://docs.blender.org/manual/en/latest/advanced/command_line/index.html). **Documented upstream** as a first-class Blender CLI surface (stable across LTS releases, used widely in render farms / HPC / CI); BlendOps has no in-repo evidence file yet.

### Single-bridge constraint

Blender accepts a single MCP bridge session per Blender instance. **Do not run Path 1 + Path 2 concurrently** against the same Blender instance — the second connection silently fails. Within Path 1, do not run host (a) Anthropic Connector and host (b) manual MCP client both pointed at the same Blender instance. Pick one path + host per Blender session.

### Blender version summary for Claude Desktop users

| Path | Min Blender | Notes |
|---|---|---|
| **Path 1** (Lab MCP, host = Anthropic Connector OR manual MCP) | **5.1+** | Same Lab add-on regardless of host. Anthropic's "4.2+" prerequisite is misleading — the add-on it requires is 5.1+. |
| **Path 2** (community `ahujasid/blender-mcp`) | 3.0+ | Different stack from Path 1. |
| **CLI fallback** | 4.2+ recommended | Documented upstream as first-class Blender CLI; no in-repo evidence file yet. |

See [`docs/external-runtime-setup.md`](../external-runtime-setup.md) for the complete per-path setup walkthrough.

## Report contract

Every Claude Desktop prep attempt should report:

- mode selected: `multiple Skills ZIP preparation` or `blocked-needs-input`
- reason: Claude Desktop / Claude.ai / chat-only / no project write access, or blocker
- ZIP filenames generated, or fallback files/instructions
- SKILL.md count if ZIP mode: `1` per ZIP
- global files touched: `No`
- runtime status: `Not Run`
- artifact status: `Not Produced`
- limitations

## What not to claim

- No claim of automated Claude Desktop UI import.
- No claim that connector/bridge is configured.
- No claim that runtime eval passed.
- No claim that preview/render/GLB was produced.
