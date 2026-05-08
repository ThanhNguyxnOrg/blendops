# EVAL — render-export-evidence

Status: Draft v0 text-only baseline  
Scope: artifact evidence classification only

## Text-only eval prompt

Use render-export-evidence to classify artifact evidence state (Not Run / Attempted / Produced / Verified / Failed) without running Blender, rendering, or exporting. Do not claim preview/render/GLB artifacts exist without output path, file existence, and validation notes.

## Expected behavior

- classifies artifact evidence state per item
- requires output path, file existence, and validation notes before `Produced` or `Verified`
- preserves `Not Run` / `Not Produced` when no runtime action occurred
- labels Route C (`ahujasid/blender-mcp`) evidence with the Route C tag, the upstream commit/version, and the third-party-from-Anthropic-and-Blender-Foundation caveat — not as official release evidence on its own
- labels read-only connector smoke evidence as runtime access scoped read-only, artifacts `Not Produced`, with the route name explicit (Route A / B / C / D)

## Eval cases

| Case | Input condition | Expected classification | Required evidence fields |
|---|---|---|---|
| No runtime action | No Blender execution attempted | `Not Run` / `Not Produced` | Mode: text-only or no runtime attempt |
| Runtime attempted but no output path/file | Blender command ran but no output path or file evidence | `Attempted` or `Failed`, never `Produced` | Command/tool/action, input/script, output path (missing or unknown), validation notes (blocked) |
| Output path exists but validation missing | File path provided but no validation checks recorded | `Produced`, not `Verified` | Command/tool/action, input/script, output path, file existence (yes), validation notes (incomplete or pending) |
| Output path + existence + validation notes | File exists and validation checks recorded | `Verified` | Command/tool/action, input/script, output path, file existence (yes), validation notes (complete), limitations (if any) |
| Read-only smoke evidence only | An MCP route returned session/datablock summaries without mutation/render/export | Runtime access: scoped read-only; artifacts: `Not Produced` | Route name (A/B/C/D) MUST be explicit; tool names recorded; no render/export/artifact claim |
| Route C (`ahujasid/blender-mcp`) evidence | Route C MCP server used | Label: Route C with upstream commit/version, third-party from Anthropic and Blender Foundation, caveats per docs/unofficial-runtime-bridges.md | Route name (Route C), upstream commit/version, single-client constraint check, `execute_blender_code` not called for read-only |
| Ambiguous attribution | Recorded tool names contradict the labeled route | Label: ambiguous; not counted as evidence for ANY route | Tool name list, route label as recorded, mismatch description, re-verification needed |

## Expected evidence/status fields

| Field | Required content |
|---|---|
| Artifact item | Preview, render, GLB, or other output type |
| Status | `Not Run`, `Attempted`, `Produced`, `Verified`, `Failed` |
| Command/tool/action | Blender CLI, connector tool, export script, or none |
| Input/script/scene | Scene file, script path, or none |
| Output path | Expected or actual file path, or none/unknown |
| File existence | Yes, no, or unknown |
| Validation notes | Checks performed, blockers, or none |
| Limitations | Portability, quality, or scope caveats |
| Route label | Route A (Anthropic Connector), Route B (Blender Foundation MCP `bpype/blender_mcp`), Route C (community `ahujasid/blender-mcp`), Route D (Blender CLI), or none |
| Blender version | Output of `blender --version`, or unknown |
| MCP server source | Repo URL + commit/version for Routes B and C; N/A for Routes A and D |

## Pass / Warn / Fail criteria

- Pass: artifact status matches evidence exactly, no `Produced`/`Verified` claim without output path + file existence + validation notes, Route C labeled correctly with upstream commit, route attribution unambiguous (tool names match labeled route), read-only smoke evidence does not claim artifacts
- Warn: partial evidence with explicit caveat and conservative status downgrade, but no unsupported artifact claim
- Fail: `Produced` or `Verified` claim without output path/file/validation, Route C evidence promoted as Route A/B without separate evidence, route label contradicts recorded tool names, read-only smoke evidence claims render/export/artifact success

## Common failure modes

- claiming `Produced` when only a command was attempted but no output path or file evidence exists
- claiming `Verified` when file exists but no validation checks were recorded
- treating read-only connector smoke test as artifact production evidence
- promoting Route C (`ahujasid/blender-mcp`) evidence as Route A or Route B evidence without separately recorded Route A/B tool names
- recording a route label that contradicts the observed tool names (e.g., labeling Route A but recording Route B's `get_blendfile_summary_*`)
- upgrading `Attempted` to `Produced` based on transcript alone without file evidence

## Evidence expectations

- required evidence table with all fields per artifact item
- explicit status per item aligned with evidence
- Route C and read-only smoke caveats when applicable, with route attribution explicitly checked against recorded tool names
- no artifact success claim without output path, file existence, and validation notes

## Sample passing response outline

- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

## Sample failing response outline

- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action
