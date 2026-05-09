# Evidence Record Templates

Use these templates when filling `docs/evals/path-X-...md`. Copy the relevant template, fill every field, save under `docs/evals/`.

## Template A — Path 1 (Lab MCP) read-only smoke

```md
# Path 1 Read-Only Smoke Test (<host option a/b>) — YYYY-MM-DD

Status: Pass / Available — Path 1 read-only access via <host>
Date: <YYYY-MM-DD>
Operator: <name or handle>

## Identity

| Field | Value |
|---|---|
| Path | Path 1 — Official Blender Lab MCP |
| Host option | (a) Anthropic Connector OR (b) manual MCP client |
| MCP host product + version | <e.g. Claude Desktop X.Y.Z> |
| Blender version (`blender --version`) | <verbatim> |
| Lab MCP add-on version | <e.g. mcp-1.0.0> |
| Lab MCP server source | <`.mcpb` filename or commit> |

## Tools called (read-only only)

| # | Tool name | Status | Notes |
|---|---|---|---|
| 1 | get_blendfile_summary_path_info | ok | |
| 2 | get_blendfile_summary_datablocks | ok | |
| 3 | get_objects_summary | ok | |

## No-mutation guarantee

- [x] No `run_blender_code` was called with mutating Python.
- [x] No render was triggered.
- [x] No GLB export was triggered.
- [x] No `.blend` file save.

## Verdict

```txt
Path 1 read-only access via <host>: Pass / Available
Path 1 mutation / render / export: Not Run
Other paths: unchanged
Full runtime manual eval: Not Run
Runtime artifacts: Not Produced
v0.1.0 tag: depends on full eval
```
```

## Template B — Path 2 (community `ahujasid/blender-mcp`) read-only smoke

See `docs/evals/path-2-ahujasid-readonly-template.md` (canonical template). Copy it, fill, save.

## Template C — Full runtime eval (mutation / render / export)

```md
# <Path> Full Runtime Eval — <recipe name> — YYYY-MM-DD

Status: Verified / Produced / Failed (per truth-label-decision-tree)
Date: <YYYY-MM-DD>
Operator: <name or handle>

## Identity
(same fields as Template A or B per chosen path)

## Recipe
- Source recipe: `docs/recipes/<recipe>.md`
- Brief: `<link to brief or quote>`

## Actions executed

| # | Action | Tool / command | Result |
|---|---|---|---|
| 1 | <e.g. create scene> | <tool name> | ok / fail |
| ... | | | |

## Generated artifacts

| Artifact | Output path | File exists | File size | Validation notes | Truth label |
|---|---|---|---|---|---|
| Render preview | `renders/preview-<date>.png` | yes / no | <bytes> | <subject framing centered, mood visible, …> | Verified |
| GLB | `exports/<name>-<date>.glb` | yes / no | <bytes> | <gltf-validator pass, web import test pass> | Verified |

## Validation against acceptance criteria

For each acceptance criterion in the brief:

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | <e.g. subject centered with negative space> | Pass | <screenshot + brief reference> |
| 2 | <e.g. GLB ≤ 10MB> | Pass | <file size> |

## Failure / caveat log

- <any errors, warnings, environment notes>

## Pre-handoff verification

- [ ] Ran `pre-handoff-verification` 7-point gate
- [ ] Verdict: Pass / Warn / Fail
- [ ] Downgrades applied (if any)

## Verdict

```txt
<Path> full runtime eval for <recipe>: Verified / Produced / Failed
v0.1.0 tag: <upgrade decision>
```
```

## Template D — Failed run

```md
# <Path> Failed Runtime Attempt — <recipe> — YYYY-MM-DD

Status: Failed
Date: <YYYY-MM-DD>

## What was attempted
<brief description>

## Where it failed (Phase from `blender-troubleshooting`)
- Phase 1 reproducibility: <count>
- Phase 2 narrowed input: <minimum reproducing case>
- Phase 3 root cause: <one-sentence>
- Phase 4 proposed fix: <one-sentence + handoff skill>

## Truth labels
- Render: Failed (or Attempted if no output)
- GLB: Failed
- Overall: Failed

## Next action
<route to which skill, with what>
```

## Saving conventions

- Filename: `path-<N>-[host-]-<recipe>-<YYYY-MM-DD>.md` under `docs/evals/`.
- Append the new file to the "Evidence and result index" in `docs/evals/README.md`.
- If the new evidence changes a verdict, update `docs/release-readiness.md` + `docs/release-readiness-rollup-v0.md`.
