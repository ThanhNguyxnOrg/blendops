# EVAL — render-export-evidence

Status: Draft v0 text-only baseline  
Scope: artifact evidence classification only

## Text-only eval prompt

Use render-export-evidence to classify artifact evidence state (Not Run / Attempted / Produced / Verified / Failed) without running Blender, rendering, or exporting. Do not claim preview/render/GLB artifacts exist without output path, file existence, and validation notes.

## Expected behavior

- classifies artifact evidence state per item
- requires output path, file existence, and validation notes before `Produced` or `Verified`
- preserves `Not Run` / `Not Produced` when no runtime action occurred
- labels Stack 3 unofficial bridge evidence as local/experimental, not official release evidence
- labels read-only connector smoke evidence as runtime access scoped read-only, artifacts `Not Produced`

## Eval cases

| Case | Input condition | Expected classification | Required evidence fields |
|---|---|---|---|
| No runtime action | No Blender execution attempted | `Not Run` / `Not Produced` | Mode: text-only or no runtime attempt |
| Runtime attempted but no output path/file | Blender command ran but no output path or file evidence | `Attempted` or `Failed`, never `Produced` | Command/tool/action, input/script, output path (missing or unknown), validation notes (blocked) |
| Output path exists but validation missing | File path provided but no validation checks recorded | `Produced`, not `Verified` | Command/tool/action, input/script, output path, file existence (yes), validation notes (incomplete or pending) |
| Output path + existence + validation notes | File exists and validation checks recorded | `Verified` | Command/tool/action, input/script, output path, file existence (yes), validation notes (complete), limitations (if any) |
| Read-only connector smoke evidence only | Claude Desktop Blender Connector returned session/datablock summaries without mutation/render/export | Runtime access: scoped read-only; artifacts: `Not Produced` | Connector evidence type (read-only smoke), no render/export/artifact claim |
| Optional unofficial bridge evidence | Stack 3 local/experimental bridge used | Label: Stack 3 local/experimental, not official release evidence | Bridge type (Stack 3), confidence label (user-managed/experimental), not counted as official runtime eval |

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
| Stack label | Stack 1 (official connector), Stack 2 (CLI), Stack 3 (unofficial), or none |

## Pass / Warn / Fail criteria

- Pass: artifact status matches evidence exactly, no `Produced`/`Verified` claim without output path + file existence + validation notes, Stack 3 labeled correctly, read-only connector evidence does not claim artifacts
- Warn: partial evidence with explicit caveat and conservative status downgrade, but no unsupported artifact claim
- Fail: `Produced` or `Verified` claim without output path/file/validation, Stack 3 evidence promoted as official, read-only connector evidence claims render/export/artifact success

## Common failure modes

- claiming `Produced` when only a command was attempted but no output path or file evidence exists
- claiming `Verified` when file exists but no validation checks were recorded
- treating read-only connector smoke test as artifact production evidence
- promoting Stack 3 unofficial bridge evidence as official release-eval evidence
- upgrading `Attempted` to `Produced` based on transcript alone without file evidence

## Evidence expectations

- required evidence table with all fields per artifact item
- explicit status per item aligned with evidence
- Stack 3 and read-only connector caveats when applicable
- no artifact success claim without output path, file existence, and validation notes

## Sample passing response outline

- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

## Sample failing response outline

- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action
