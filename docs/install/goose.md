# Install target: goose (Block's open AI agent)

Status/confidence: Draft v0, linked-only — but goose has a **dedicated upstream Blender MCP tutorial**

## Recommended near-term install mode

goose is an **open-source AI agent from Block, Inc.** that runs locally and connects to tools via MCP. Crucially, **goose has an official upstream Blender MCP tutorial** ([block.github.io/goose/docs/mcp/blender-mcp](http://block.github.io/goose/docs/mcp/blender-mcp)) covering the community `ahujasid/blender-mcp` (Path 2) installation.

BlendOps install for goose is **docs-only / reference** + **MCP server config via Standard IO extension**.

For Blender execution, goose acts as the **MCP host** (Path 1 host b — manual MCP, or Path 2 — community `ahujasid/blender-mcp` with goose's documented path).

## Copy/paste prompt

```txt
I want to use BlendOps content with goose (Block's open agent, has dedicated Blender MCP tutorial).

Requirements:
- Treat goose as docs-only / reference; goose itself manages its config.
- Provide BlendOps planning/readiness/evidence/handoff guidance for goose sessions.
- For Blender runtime via goose as MCP host:
  - Path 2 (community ahujasid/blender-mcp) is the upstream-documented path: add Blender MCP as an extension in goose with command uvx blender-mcp, type Standard IO. See block.github.io/goose/docs/mcp/blender-mcp.
  - Path 1 (Lab MCP) is also possible via Standard IO extension pointing at the Lab .mcpb bundle.
  - Single-bridge constraint: do not run Path 1 + Path 2 against the same Blender session.
- Do not install Blender, do not run Blender.

Report changed files (likely none on goose side, just docs).
Runtime status: Not Run.
Artifact status: Not Produced.
```

## MCP host evidence (verified-read)

- Official goose Blender MCP tutorial: http://block.github.io/goose/docs/mcp/blender-mcp.
- Tutorial PR: https://github.com/block/goose/pull/2122 (merged).
- Documented setup: install Blender + goose Desktop, add Blender MCP as Standard IO extension with command `uvx blender-mcp`.
- This documents Path 2 (community `ahujasid/blender-mcp`) explicitly.

## Expected files/folders

- goose-managed config (location per upstream).
- No project-local writes from BlendOps.
- No global writes from BlendOps.

## Setup sketch (linked-only, defer to upstream tutorial for current commands)

1. Install Blender (Path 2 needs 3.0+; Path 1 needs 5.1+).
2. Install goose Desktop.
3. In goose: Add Extension → Standard IO. Command: `uvx blender-mcp`.
4. Per Path 2: install `addon.py` from [`github.com/ahujasid/blender-mcp`](https://github.com/ahujasid/blender-mcp) into Blender. Per Path 1: install Lab MCP add-on per [`blender.org/lab/mcp-server`](https://www.blender.org/lab/mcp-server/).
5. Restart goose so it discovers the extension.

## Rollback notes

- goose: remove the `blender-mcp` extension.
- Optional: uninstall the Blender-side add-on (`addon.py` or Lab MCP) per upstream Blender preferences UI.

## Runtime boundary

Skill install != runtime setup.

For Blender runtime via goose as MCP host:
- **Path 1 (Lab MCP)** — Blender 5.1+ + Lab add-on + Lab server.
- **Path 2 (community `ahujasid/blender-mcp`)** — **upstream-documented**: Blender 3.0+ + `addon.py` + `uvx blender-mcp`. This is the tutorial path.
- **CLI fallback (appendix)** — Documented upstream as a first-class Blender CLI surface (stable across LTS releases); no in-repo evidence file yet.

See [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md).

## What not to claim

- Native goose BlendOps Skills loader (none exists; BlendOps is content + MCP).
- That goose's tutorial implies Path 2 is "official" for BlendOps purposes — it is "official from goose's perspective", but Path 2 remains third-party from Anthropic and Blender Foundation. See [`docs/unofficial-runtime-bridges.md`](../unofficial-runtime-bridges.md).
- Runtime success without an evidence file.
- Marketplace / plugin distribution for goose.
