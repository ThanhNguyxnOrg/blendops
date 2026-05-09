

# EVAL — render-export-evidence

Status: Draft v0 text-only baseline  
Scope: artifact evidence classification only

## Text-only eval prompt

Use render-export-evidence to classify artifact evidence state (Not Run / Attempted / Produced / Verified / Failed) without running Blender, rendering, or exporting. Do not claim preview/render/GLB artifacts exist without output path, file existence, and validation notes.

## Expected behavior

- classifies artifact evidence state per item
- requires output path, file existence, and validation notes before `Produced` or `Verified`
- preserves `Not Run` / `Not Produced` when no runtime action occurred
- labels Path 2 (`ahujasid/blender-mcp`) evidence with the Path 2 tag, the upstream commit/version, and the third-party-from-Anthropic-and-Blender-Foundation caveat — not as official release evidence on its own
- labels read-only smoke evidence as runtime access scoped read-only, artifacts `Not Produced`, with the path + host explicit (Path 1 host a / Path 1 host b / Path 2)
- labels CLI fallback evidence with explicit "no in-repo evidence file yet (Blender CLI itself is upstream-stable)" note

## Eval cases

| Case | Input condition | Expected classification | Required evidence fields |
|---|---|---|---|
| No runtime action | No Blender execution attempted | `Not Run` / `Not Produced` | Mode: text-only or no runtime attempt |
| Runtime attempted but no output path/file | Blender command ran but no output path or file evidence | `Attempted` or `Failed`, never `Produced` | Command/tool/action, input/script, output path (missing or unknown), validation notes (blocked) |
| Output path exists but validation missing | File path provided but no validation checks recorded | `Produced`, not `Verified` | Command/tool/action, input/script, output path, file existence (yes), validation notes (incomplete or pending) |
| Output path + existence + validation notes | File exists and validation checks recorded | `Verified` | Command/tool/action, input/script, output path, file existence (yes), validation notes (complete), limitations (if any) |
| Path 1 read-only smoke evidence | Lab MCP returned `get_blendfile_summary_*` / `get_objects_summary` from a Lab-add-on-equipped Blender, no mutation/render/export | Runtime access: scoped read-only; artifacts: `Not Produced` | Path 1 + host option (a/b) MUST be explicit; tool names recorded; Blender version recorded if available; no render/export/artifact claim |
| Path 2 (`ahujasid/blender-mcp`) evidence | Path 2 MCP server used | Label: Path 2 with upstream commit/version of `addon.py` and `uvx blender-mcp`, third-party from Anthropic and Blender Foundation, caveats per docs/unofficial-runtime-bridges.md | Path 2 label, upstream commit/version, single-bridge constraint check, `execute_blender_code` not called for read-only |
| CLI fallback evidence | `blender --background --python` used | Label: CLI fallback (appendix), with explicit note that no in-repo evidence file yet exists (the Blender CLI is upstream-stable) | Exact command, input/script, output path, exit code, logs |
| Tool-name vs path-label inconsistency | Recorded tool names do not belong to the labeled path's tool surface | Label: ambiguous; not counted as evidence; recommend re-verification | Tool name list, path label as recorded, mismatch description, re-verification needed. Note: `get_blendfile_summary_*` belong to Lab MCP and ARE valid for both Path 1 hosts (a) and (b); `get_scene_info`/`execute_blender_code` belong to Path 2. |

## Expected evidence/status fields

| Field | Required content |
|---|---|
| Artifact item | Preview, render, GLB, or other output type |
| Status | `Not Run`, `Attempted`, `Produced`, `Verified`, `Failed` |
| Command/tool/action | Blender CLI, MCP tool, export script, or none |
| Input/script/scene | Scene file, script path, or none |
| Output path | Expected or actual file path, or none/unknown |
| File existence | Yes, no, or unknown |
| Validation notes | Checks performed, blockers, or none |
| Limitations | Portability, quality, or scope caveats |
| Path label | Path 1 host (a) Anthropic Connector / Path 1 host (b) manual MCP / Path 2 community ahujasid/blender-mcp / CLI fallback / none |
| Blender version | Output of `blender --version`, or unknown |
| Blender-side add-on identity | Lab MCP add-on version (Path 1) / `ahujasid/blender-mcp` `addon.py` commit (Path 2) / N/A (CLI) |
| MCP server source | `.mcpb` bundle filename or commit (Path 1) / `uvx blender-mcp` version (Path 2) / N/A (CLI) |
| MCP host product | Claude Desktop with Anthropic Connector / Claude Desktop manual MCP / Cursor / Codex / OpenCode / Cline / other / N/A (CLI) |

## Pass / Warn / Fail criteria

- Pass: artifact status matches evidence exactly, no `Produced`/`Verified` claim without output path + file existence + validation notes, Path 2 labeled correctly with upstream commit, path attribution unambiguous (tool names match labeled path's tool surface), read-only smoke evidence does not claim artifacts, CLI fallback labeled with "no in-repo evidence file yet" note when used.
- Warn: partial evidence with explicit caveat and conservative status downgrade, but no unsupported artifact claim
- Fail: `Produced` or `Verified` claim without output path/file/validation, Path 2 evidence promoted as Path 1 without separately recorded Path 1 tool names, path label contradicts recorded tool names (e.g., labeling Path 2 but recording Lab MCP `get_blendfile_summary_*`), read-only smoke evidence claims render/export/artifact success, CLI fallback presented as publisher-verified peer of Path 1/2.

## Common failure modes

- claiming `Produced` when only a command was attempted but no output path or file evidence exists
- claiming `Verified` when file exists but no validation checks were recorded
- treating read-only smoke test as artifact production evidence
- promoting Path 2 (`ahujasid/blender-mcp`) evidence as Path 1 evidence without separately recorded Path 1 tool names
- recording a path label that contradicts the observed tool names (e.g., labeling Path 2 but recording Lab MCP's `get_blendfile_summary_*`)
- presenting CLI fallback as publisher-verified peer of Path 1/2
- describing Anthropic Connector as standalone (it is not — Lab MCP add-on inside Blender is required either way)
- upgrading `Attempted` to `Produced` based on transcript alone without file evidence

## Evidence expectations

- required evidence table with all fields per artifact item
- explicit status per item aligned with evidence
- Path 2, read-only smoke, and CLI fallback caveats when applicable, with path attribution explicitly checked against recorded tool names
- no artifact success claim without output path, file existence, and validation notes

## Sample passing response outline

- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

## Sample failing response outline

- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action
