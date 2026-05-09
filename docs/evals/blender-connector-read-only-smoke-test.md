

# Blender Connector Read-Only Smoke Test

Status: **Path 1 read-only access verified (likely via Anthropic Connector host)** / Mutation/render/export not attempted / Full Path 1 eval `Not Run`  
Date: 2026-04-29 (original); attribution corrected 2026-05-08; corrected again 2026-05-08 after upstream re-read  
Runtime path: **Path 1 — Official Blender Lab MCP** (see [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md))  
Likely host within Path 1: **Anthropic Blender Connector** (Claude Desktop), based on the original recorder's note  
Scope: Read-only smoke test, not full official runtime manual eval

> [!CAUTION]
> **Earlier "ambiguous attribution" framing was wrong.** The 2026-04-29 record originally said "Official Claude Desktop Blender Connector". A previous correction (commit `ac04686`) labeled this as ambiguous because the recorded tool names looked like they belonged to "Route B Blender Foundation MCP" — implying Routes A and B were independent and the tools could only come from B. After re-reading the upstream Anthropic tutorial and Blender Lab MCP page, that framing was wrong:
>
> - The Anthropic Connector is **not** a separate runtime. Anthropic's tutorial step 2 explicitly tells you to install the Blender Lab MCP add-on inside Blender. The Connector is just the Claude-Desktop-specific MCP host on top of the same Lab stack.
> - Therefore the recorded tool names (`get_blendfile_summary_*`, `get_objects_summary`) **are exactly what the Anthropic Connector exposes**, because they come from Lab MCP that the Connector talks to.
> - The original "Claude Desktop Connector" attribution is **consistent** with the recorded tool names.
>
> The ambiguity was a documentation modeling error, not an evidence problem. This record is now treated as **Path 1 read-only smoke evidence, host most likely Anthropic Connector**.

---

## Summary (corrected)

The Blender Lab MCP add-on responded to safe read-only tool calls against a live Blender session, hosted from Claude Desktop's Anthropic Blender Connector.

| Check | Status | Evidence |
|---|---|---|
| Path 1 Lab MCP add-on present in Blender | Available | Tool calls returned `status: ok`. |
| Anthropic Blender Connector host responding | Available (most likely host on the recorder's machine) | Original record labeled the run "Claude Desktop Blender Connector". |
| Real Blender session responded | Available | All three read-only tools returned `status: ok`. |
| Full official runtime manual eval | **Not Run** | No BlendOps recipe, mutation, render, export, or artifact validation was attempted. |
| Preview/render/GLB artifacts | **Not Produced** | No file was created. |
| Stable release readiness | **Not Ready** | Read-only access is not sufficient for stable readiness. |
| v0.1.0 tag | **Not Ready** | Do not tag yet. |

---

## Tools recorded as used (Lab MCP tool surface)

Only safe read-only tools were used:

1. `get_blendfile_summary_path_info`
2. `get_blendfile_summary_datablocks`
3. `get_objects_summary`

All three returned `status: ok`.

These tool names are part of the **Blender Lab MCP** tool surface (`bpype/blender_mcp` at `blender.org/lab/mcp-server`). They are reachable from any host on Path 1 — both the Anthropic Connector (host option a) and any manually-configured MCP client (host option b). They are **not** part of the community `ahujasid/blender-mcp` Path 2 surface (which uses `get_scene_info`, `execute_blender_code`).

---

## Session data returned

| Field | Value |
|---|---|
| Filepath | Empty / unsaved file |
| Saved | `false` |
| Dirty | `true` from the default unsaved session; not caused by this test |
| Scene name | `Scene` |
| Active workspace | `Layout` |
| Active object | `Cube` |
| Mode | `OBJECT` |
| Render engine | `BLENDER_EEVEE` |
| Blender version | Not returned by the read-only tools (a future eval should record `blender --version` explicitly) |

Objects returned:

| Object | Type | Visibility |
|---|---|---|
| Cube | MESH | Visible |
| Camera | CAMERA | Visible |
| Light | LIGHT | Visible |

---

## Non-actions preserved

- No objects were created.
- No scene data was modified.
- No Python was run to change the file.
- No render was run.
- No GLB export was run.
- No preview, render, GLB, or artifact file was created.
- No BlendOps recipe was run.
- No runtime artifact claim is made.

---

## Result boundary

This smoke test only upgrades the Path 1 read-only access signal:

```txt
Path 1 read-only Lab MCP access (likely via Anthropic Connector host): Pass / Available
Path 1 mutation/render/export eval: Not Run
Path 2 (community ahujasid/blender-mcp): User-reported verified separately; no formal eval file
CLI fallback: Not Run; documented upstream as first-class Blender CLI (stable across LTS releases); no in-repo evidence file yet
Full official runtime manual eval: Not Run
Runtime artifacts: Not Produced
Stable release readiness: Not Ready
v0.1.0 tag: Do not tag yet
```

---

## What a clean re-verification would record

To upgrade Path 1 from "read-only smoke" to documented full eval, or to upgrade Path 2 from "user-reported" to documented "Verified", a fresh smoke test record must include:

1. **Path** (1 or 2) and (for Path 1) **host option** (a — Anthropic Connector, b — manual MCP client).
2. **`blender --version`** verbatim.
3. **Blender-side add-on identity** (Lab add-on version vs `ahujasid/blender-mcp` `addon.py` commit).
4. **MCP server source** (`.mcpb` bundle filename / source commit / `uvx blender-mcp` version).
5. **MCP host product + version** (Claude Desktop build, Cursor build, etc.).
6. **Exact tool names** invoked + responses.
7. **Single-bridge check** confirming only one MCP host connected.
8. **No-mutation guarantee** (explicit list of read-only tools used; no `execute_blender_code` / `run_blender_code`).

Save the new record under `docs/evals/` with a filename that names the path + host, e.g. `path-1-anthropic-connector-readonly-YYYY-MM-DD.md` or `path-2-ahujasid-readonly-YYYY-MM-DD.md`.
