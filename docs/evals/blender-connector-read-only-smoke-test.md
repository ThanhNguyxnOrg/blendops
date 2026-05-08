# Blender Connector Read-Only Smoke Test

Status: **Ambiguous attribution** / Read-only access through some MCP server occurred / Originally labeled Route A, tool names match Route B, user statement points at Route C  
Date: 2026-04-29 (original); attribution corrected 2026-05-08  
Originally labeled runtime path: "Official Claude Desktop Blender Connector"  
Corrected runtime path: **Unknown — see attribution discrepancy below**  
Scope: Read-only smoke test, not full official runtime manual eval

> [!CAUTION]
> **This record has an attribution discrepancy and must not be cited as evidence for any specific runtime route until re-verified.**
>
> The original record claimed the runtime path was Route A (Anthropic Blender Connector). The recorded tool names (`get_blendfile_summary_path_info`, `get_blendfile_summary_datablocks`, `get_objects_summary`) belong to Route B (`bpype/blender_mcp`, the Blender Foundation MCP Server). The repo owner stated on 2026-05-08 that the only verified runtime path is Route C (`ahujasid/blender-mcp`).
>
> Three plausible explanations:
> 1. The smoke test was actually against Route B (matches tool names) and was misattributed in writing.
> 2. The smoke test was against Route A but the tool names listed here were copy-pasted from another source.
> 3. The smoke test was against an earlier ad-hoc setup that has since been replaced by Route C.
>
> Until a fresh smoke test is recorded with the runtime path, Blender version, MCP server source, and observed tool names all explicit and consistent, this record is **not** counted as evidence for Route A, Route B, or Route C.

---

## Original (uncorrected) summary

The original 2026-04-29 record stated:

> The official Claude Desktop Blender Connector responded to safe read-only tool calls against a live Blender session.

| Original check | Original status | Original evidence | Corrected interpretation |
|---|---|---|---|
| Official connector used | Available | Claude Desktop Blender Connector read-only tools. | **Mis-attributed** — tool names below are Route B's, not Route A's. |
| Real Blender session responded | Available | All three read-only tools returned `status: ok`. | Still credible — some MCP server reached Blender. |
| Blender-side MCP bridge | Available for read-only session access | Session, datablock, and object summaries returned. | Still credible — but bridge identity (Route A helper vs. Route B add-on vs. ad-hoc) cannot be confirmed from this record. |
| Full official runtime manual eval | Not Run | No BlendOps recipe, mutation, render, export, or artifact validation was attempted. | Still correct. |
| Preview/render/GLB artifacts | Not Produced | No preview, render, GLB, or artifact file was created. | Still correct. |
| Stable release readiness | Not Ready | Read-only access is not sufficient for stable readiness. | Still correct. |
| v0.1.0 tag | Not Ready | Do not tag yet. | Still correct. |

---

## Tools recorded as used (Route B tool surface)

Only safe read-only tools were used:

1. `get_blendfile_summary_path_info`
2. `get_blendfile_summary_datablocks`
3. `get_objects_summary`

All three returned `status: ok`.

These tool names match the Blender Foundation MCP Server (`bpype/blender_mcp`) tool surface as documented at https://www.blender.org/lab/mcp-server/ and the `bpype/blender_mcp` repo. They do **not** match the Anthropic Connector tool surface (`create_object`, `delete_object`, `run_blender_code`) or the community `ahujasid/blender-mcp` tool surface (`get_scene_info`, `execute_blender_code`).

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
| Blender version | Not returned by the read-only tools (would have disambiguated Route A 4.2+ vs. Route B 5.1+) |

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

## Result boundary (corrected)

This smoke test no longer upgrades any specific route's verification status:

```txt
Route A — Anthropic Blender Connector: Not Verified
Route B — Blender Foundation MCP Server: Ambiguous (tool names match this route, but cannot be confirmed)
Route C — Community Blender MCP: User-reported verified (separate evidence; not from this test)
Route D — Official Blender CLI: Not Run

Full official runtime manual eval: Not Run
Runtime artifacts: Not Produced
Stable release readiness: Not Ready
v0.1.0 tag: Do not tag yet
```

---

## What a clean re-verification would record

To upgrade any route from "Not Verified" or "Ambiguous" or "User-reported verified" to documented "Verified", a fresh smoke test record must include:

1. **Route name and version**: e.g., "Route C — `ahujasid/blender-mcp` v1.x.y, addon.py from commit `<sha>`".
2. **Blender version**: from `blender --version`, captured verbatim.
3. **MCP server source**: URL, repo, commit SHA, install command.
4. **MCP client**: Claude Desktop / Cursor / Codex / OpenCode / etc., with version.
5. **Exact tool names called**: e.g., `get_scene_info` for Route C, `get_blendfile_summary_*` for Route B.
6. **Exact tool responses**: status + payload summary.
7. **Single-client constraint check**: confirm only one MCP client connected to that Blender session.
8. **No-mutation guarantee**: explicit list of read-only tools used and confirmation that no `execute_blender_code` / `run_blender_code` / `create_object` was called.

Save the new record under `docs/evals/` with a filename that names the route, e.g., `route-c-ahujasid-readonly-eval-YYYY-MM-DD.md`.
