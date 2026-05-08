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

Expected ZIP files:

```txt
blendops-help.zip
product-hero-scene-planner.zip
official-runtime-readiness-checker.zip
official-runtime-setup-guide.zip
render-export-evidence.zip
glb-web-handoff.zip
blender-composition-camera-planner.zip
blender-lighting-material-planner.zip
blender-scene-quality-checker.zip
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

Importing BlendOps skills into Claude Desktop only loads the BlendOps content layer. To **actually run Blender from Claude Desktop**, you must also choose one of the four runtime routes documented in [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md). For Claude Desktop users, three of the four routes apply:

### Route A — Anthropic Blender Connector (recommended for Claude Desktop, lowest friction)

Anthropic shipped a one-click Blender Connector in April 2026 as part of Claude for Creative Work.

1. Update Blender to a supported version (Anthropic tutorial states **4.2+**, community guides recommend **4.5 LTS**). Route A does **not** require Blender 5.1+.
2. In Claude Desktop, open Settings → Connectors → Browse, find **Blender**, click Enable.
3. Approve the local helper launch.
4. Open Blender, confirm the BlenderMCP panel is visible in the 3D View sidebar (`N` to toggle), confirm the status pill reads **Connected**.
5. Run a read-only request first.

Source: [claude.com/.../using-the-blender-connector-in-claude](https://claude.com/resources/tutorials/using-the-blender-connector-in-claude). The Anthropic helper handles the Blender-side bridge; you do **not** separately install the Blender Foundation MCP add-on for this route.

### Route B — Blender Foundation MCP Server (`bpype/blender_mcp`, requires Blender 5.1+)

Use this if you want Blender's own official MCP server instead of Anthropic's connector. **This is the route whose 5.1+ requirement is real** — `blender_manifest.toml: blender_version_min = "5.1.0"`.

1. Install **Blender 5.1+** (the add-on will not load on earlier versions).
2. Drag-drop the install link from [blender.org/lab/mcp-server](https://www.blender.org/lab/mcp-server/) into Blender twice (first registers the Blender Lab repository, second installs the add-on).
3. Install the MCP server itself either as an `.mcpb` bundle or from source.
4. In Claude Desktop, open Settings → Developer → Edit Config and register the server in `mcpServers`.
5. Open Blender's BlenderMCP panel and start/connect the server.

### Route C — Community Blender MCP (`ahujasid/blender-mcp`, mature third-party)

Use this if you want the prior-art community path or want Hyper3D / Hunyuan3D / Poly Haven / Sketchfab integrations layered on top.

1. Install Blender 3.0+ (uses stable `bpy`).
2. Install `uv` per upstream instructions.
3. In Claude Desktop, open Settings → Developer → Edit Config and add:
   ```json
   {
     "mcpServers": {
       "blender": { "command": "uvx", "args": ["blender-mcp"] }
     }
   }
   ```
4. Download `addon.py` from [`github.com/ahujasid/blender-mcp`](https://github.com/ahujasid/blender-mcp), install in Blender via Edit → Preferences → Add-ons → Install, enable it.
5. Restart Claude Desktop so it discovers the new MCP server.

Caveats for Route C live in [`docs/unofficial-runtime-bridges.md`](../unofficial-runtime-bridges.md). Read them before use.

### Single-client constraint

Blender accepts a single MCP client per session. **Do not run Routes A + B + C concurrently** against the same Blender instance — the second connection silently fails. Pick one route per Blender session.

### Blender version summary for Claude Desktop users

| Route | Min Blender | Notes |
|---|---|---|
| Route A (Anthropic Connector) | 4.2+ (4.5 LTS recommended) | Blender 5.1+ NOT required for this route. |
| Route B (Blender Foundation MCP) | **5.1+** | The 5.1+ requirement applies only here. |
| Route C (community `ahujasid/blender-mcp`) | 3.0+ | Lowest version requirement. |

See [`docs/external-runtime-setup.md`](../external-runtime-setup.md) for the complete per-route setup walkthrough and the corrected attribution history.

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
