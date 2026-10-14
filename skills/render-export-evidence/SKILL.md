---
name: render-export-evidence
description: Verify preview/render/GLB artifact truth by recording commands, inputs, output paths, file existence, validation notes, limitations, and conservative status labels.
---

# render-export-evidence

## Purpose

Classify preview, render, `.blend`, and GLB/export evidence into a conservative, one-row-per-artifact-type evidence ledger.

- **Runtime truth states:** `Not Run | Attempted | Produced | Verified | Failed`
- **Artifact truth states:** `Not Run | Not Produced | Produced | Verified | Failed` (default `Not Produced`; never use `Attempted` for an artifact)
- **Direction:** Downgrade-only, never upgrade.

Role boundary: `render-export-evidence` classifies artifact evidence into a ledger; `pre-handoff-verification` gates handoffs (confirm-or-downgrade); `preview-report-template-writer` renders the report Markdown; `glb-web-handoff` owns web handoff. This skill does not run Blender or create artifacts.

## Quick start

1. Identify the runtime state (`Not Run | Attempted | Produced | Verified | Failed`) and list one ledger row per claimed artifact type.
2. Collect command/tool (plus exact command and exit code for CLI), input/script/scene, output path, current-run provenance, file existence, validation notes, and limitations.
3. Assign the most conservative valid artifact status (`Not Run | Not Produced | Produced | Verified | Failed`, defaulting to `Not Produced`, downgrade-only) and label any Path 2 evidence as `non-release`.
4. Pass the classified ledger to `pre-handoff-verification` to gate handoffs, `preview-report-template-writer` to render report Markdown, `glb-web-handoff` for web integration, or `non-blender-user-response-writer` for plain-language user responses.

## When to use

Use this skill when:

- a user asks whether a preview, render, `.blend`, or GLB/export was actually produced or verified
- an agent needs to classify raw runtime outputs into a structured, one-row-per-artifact-type evidence ledger
- a runtime attempt (`runtime-attempt-report-writer`) recorded commands, tools, or output files that need artifact status labels
- `pre-handoff-verification` or `preview-report-template-writer` requires classified artifact truth labels as input

## When not to use

Do not use this skill when:

- the user only needs a scene plan with no runtime or artifact evidence
- runtime readiness or path selection has not been completed and the user wants setup or routing; use `official-runtime-readiness-checker` or `runtime-path-picker`
- the task is gating a handoff via confirm-or-downgrade rules; use `pre-handoff-verification`
- the task is rendering the formatted preview/eval report Markdown; use `preview-report-template-writer`
- the task is GLB web integration after evidence is already classified and gated; use `glb-web-handoff`

## Trigger phrases

- “Did the render produce?”
- “Can I claim the GLB exists?”
- “Verify export evidence.”
- “What artifact status should this have?”
- “Summarize preview/render/GLB evidence.”

## Prerequisites / readiness

- Each claimed artifact type is identified (`preview`, `render`, `blend`, or `GLB/export`) with one ledger row per artifact type.
- Runtime state is explicitly known (`Not Run | Attempted | Produced | Verified | Failed`).
- Evidence sources are available or explicitly marked missing.
- No artifact claim is accepted from intent, prompt text, transcript, or executed Python code alone.
- Any pre-existing file has verifiable provenance linking it to the current run; otherwise it cannot support `Produced` or `Verified`.

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Artifact type | One ledger row is required per artifact type (`preview`, `render`, `blend`, `GLB/export`). |
| Runtime path and status | Separates Path 1 (host a or b), Path 2 (`non-release`), CLI fallback (appendix), or text-only mode, and records runtime state (`Not Run | Attempted | Produced | Verified | Failed`). |
| Command/tool/action used | Proves how the artifact was attempted (for CLI fallback, exact command and exit code are required). |
| Input/script/scene | Connects output to a specific run. |
| Output path and current-run provenance | Required for file-based claims and to prove pre-existing files were written by the current run. |
| File existence or visible evidence | Required before an artifact can be `Produced` or `Verified`. |
| Validation notes | Required before an artifact can be `Verified`. |
| Limitations/failures and release label | Prevents overclaiming and enforces `non-release` labeling on Path 2 evidence. |

### Optional inputs

| Input | Use |
|---|---|
| File size/hash or modification timestamp | Strengthens current-run provenance for generated files. |
| Screenshot/render thumbnail path | Supports visible-output claims as a `preview` artifact row. |
| Detailed stdout/stderr logs | Supplements failed-attempt or warning analysis alongside required CLI exit codes. |
| User-facing target | Informs downstream handoff to `pre-handoff-verification`, `preview-report-template-writer`, or `non-blender-user-response-writer`. |

### Assumptions to confirm

- Runtime status (`Not Run | Attempted | Produced | Verified | Failed`) and artifact status (`Not Run | Not Produced | Produced | Verified | Failed`) are tracked separately.
- Every artifact defaults to `Not Produced` unless concrete output evidence and current-run provenance exist.
- Status transitions are strictly downgrade-only, never upgrade.
- `Produced` is never upgraded to `Verified` without passing validation notes.
- Path 2 evidence is always labeled `non-release` and never used as release evidence.

## Output schema

### Primary output

A one-row-per-artifact-type evidence ledger separating runtime truth from artifact truth.

### Secondary output

- runtime status and stack identity
- per-artifact conservative status (`Not Run | Not Produced | Produced | Verified | Failed`)
- missing evidence and provenance gaps
- next safe skill handoff (`pre-handoff-verification`, `preview-report-template-writer`, `glb-web-handoff`, or `non-blender-user-response-writer`)

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Runtime path: <Path 1 host a | Path 1 host b | Path 2 (non-release) | CLI fallback (appendix) | text-only | unknown>
Release eligibility: <release-eligible | non-release | N/A>
Blender version: <output of `blender --version` or unknown>
Blender-side add-on identity: <Lab MCP add-on version | mcp-for-blender addon.py commit | N/A for CLI>
MCP server source: <Lab .mcpb bundle filename or commit | uvx mcp-for-blender version | N/A for CLI>
MCP host product: <Claude Desktop (Connector or manual MCP) | Cursor | Codex | OpenCode | Cline | other | N/A for CLI>

Artifact ledger (one row per artifact type):
| Artifact type | Artifact status (Not Run | Not Produced | Produced | Verified | Failed) | Command / tool (+ CLI exit code) | Output path + current-run provenance | Validation notes | Limitations |
|---|---|---|---|---|---|
| <preview | render | blend | GLB/export> | <status> | <exact command + exit code, or MCP tool> | <path + provenance> | <notes or missing> | <caveats> |

Next safe action: <pre-handoff-verification | preview-report-template-writer | glb-web-handoff | non-blender-user-response-writer>
```

## Required laws

- `../../laws/official-runtime-only.md`
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`

## Official runtime boundary

This skill classifies evidence from the 2-path + CLI appendix runtime model (see `../../docs/runtime-stack-strategy.md`):

1. **Path 1 — Official Blender Lab MCP** in Blender 5.1+ (add-on manifest literal `blender_version_min = "5.1.0"`), hosted from either (a) Anthropic Connector in Claude Desktop or (b) any manually configured MCP client. The Connector is NOT standalone (Anthropic tutorial step 2 installs the Lab add-on inside Blender; the tutorial prerequisite says "Blender 4.2 or later" but the binding floor is 5.1+). One MCP bridge runs per Blender instance (default port 9876). The 20-tool surface includes `get_blendfile_summary_path_info`, `get_blendfile_summary_datablocks`, `get_objects_summary`, `*_for_cli` variants, and `execute_blender_code`.
2. **Path 2 — Community `mcp-for-blender` (renamed from `ahujasid/blender-mcp`)**, third-party, Blender 3.0+, nine tools including `get_scene_info` and `execute_blender_code`, one bridge per Blender instance (default port 9876). Allowed only with caveats and **never release evidence** — every Path 2 ledger row must be labeled `non-release`.
3. **CLI fallback (appendix)** — direct `blender --background --python`, appendix only, never a peer path without an eval record. Documented flags: `--background`, `--python`, `-E/--engine` (run `blender -E help` for exact engine tokens; Eevee token is `BLENDER_EEVEE` on 4.0–4.1 and 5.x, and `BLENDER_EEVEE_NEXT` on 4.2–4.x). CLI evidence requires the exact command and exit code.

This skill must not run Blender, render, export GLB, mutate scenes, install runtimes, gate handoffs (`pre-handoff-verification`), or promote Path 2 evidence as release evidence.

## Operating procedure

1. Record the runtime status (`Not Run | Attempted | Produced | Verified | Failed`) and runtime path/host identity.
2. Create one ledger row per artifact type in scope (`preview`, `render`, `blend`, `GLB/export`).
3. For each artifact row, collect:
   - exact command + exit code (required for CLI) or MCP tool name
   - input/script/scene
   - output path
   - file existence and provenance linking the file to the current run
   - validation notes
   - limitations, failures, and `non-release` label if Path 2
4. Assign conservative artifact status (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`) using the decision tree (downgrade-only, never upgrade).
5. Hand the ledger to `pre-handoff-verification` before any user-facing handoff or to `preview-report-template-writer` for Markdown report rendering.

## Decision tree

```txt
No runtime action recorded?
  → Runtime: Not Run | Artifact: Not Run (or default Not Produced)
Runtime action recorded, but command failed or required artifact is absent/corrupt?
  → Runtime: Attempted or Failed | Artifact: Failed or Not Produced (never Attempted)
Transcript/code exists, or file is pre-existing without current-run provenance, or CLI lacks exact command + exit code?
  → Runtime: Attempted | Artifact: Not Produced (downgrade-only)
Output file/visible evidence exists with current-run provenance, but validation notes are missing or incomplete?
  → Artifact: Produced (label non-release if Path 2)
Output file exists with current-run provenance AND validation notes pass?
  → Artifact: Verified (label non-release if Path 2; never release evidence)
```

## Playbooks

### Playbook A: Text-only planning output

- Runtime status: `Not Run`.
- Artifact status: `Not Produced` (default).
- Next action: `official-runtime-readiness-checker` or `runtime-path-picker`.

### Playbook B: CLI fallback (appendix) output

Require:

- eval record context (CLI is appendix-only, never a peer path without an eval record)
- exact `blender --background --python` command (and `-E/--engine` token if specified: `BLENDER_EEVEE` on 4.0–4.1 and 5.x, `BLENDER_EEVEE_NEXT` on 4.2–4.x)
- CLI exit code (mandatory) and logs
- script/input path and output path
- generated file existence with current-run provenance
- validation notes

Without the exact command, exit code, and generated file provenance, keep artifact status at `Not Produced` or `Failed`.

### Playbook C: Path 1 (Official Blender Lab MCP — host a Connector or host b manual MCP) output

Require:

- Blender 5.1+ (`blender_version_min = "5.1.0"`) and non-standalone Lab add-on + server identity
- host identity: (a) Anthropic Connector in Claude Desktop or (b) manually configured MCP client
- recorded Lab MCP tool call (from the 20-tool surface, e.g., `get_blendfile_summary_path_info`, `get_blendfile_summary_datablocks`, `get_objects_summary`, `*_for_cli` variants, or `execute_blender_code`)
- generated file paths or visible preview/render evidence with current-run provenance
- validation notes and session/port caveats (single bridge per Blender instance, default port 9876)

Read-only summary tool calls or `execute_blender_code` transcripts alone are not artifact evidence; keep artifacts `Not Produced` until output files are verified.

### Playbook D: Path 2 (community `mcp-for-blender`, formerly `ahujasid/blender-mcp`) output

- Label every ledger row as `Path 2 (non-release)` — Path 2 is third-party (Blender 3.0+, 9-tool surface including `get_scene_info` and `execute_blender_code`) and is **never release evidence**.
- Record `addon.py` commit/version, `uvx mcp-for-blender` version, single-bridge port (default 9876), and `execute_blender_code` unsandboxed execution caveats.
- Require the same file existence, current-run provenance, and validation notes before marking `Produced (non-release)` or `Verified (non-release)`.
- See `../../docs/unofficial-runtime-bridges.md` for full Path 2 caveats.

## Mode handling

### Text-only mode

Use to mark artifacts `Not Run` / `Not Produced` and prepare evidence checklist.

### Runtime-ready mode

Use after the runtime/eval action has happened or when reviewing a captured eval record.

### Blocked runtime mode

Use when runtime was unavailable; record blockers and keep artifacts `Not Produced`.

## Validation checklist

- [ ] One ledger row is recorded per artifact type (`preview`, `render`, `blend`, `GLB/export`).
- [ ] Runtime status (`Not Run | Attempted | Produced | Verified | Failed`) is separated from artifact status (`Not Run | Not Produced | Produced | Verified | Failed`).
- [ ] Artifact status defaults to `Not Produced`, never uses `Attempted`, and only moves via downgrade-only rules.
- [ ] Runtime path/host is named (Path 1 host a/b in Blender 5.1+, Path 2 `non-release`, CLI appendix, or text-only).
- [ ] CLI evidence includes both exact command and exit code.
- [ ] Path 2 evidence is explicitly labeled `non-release` and excluded from release evidence.
- [ ] Transcript or `execute_blender_code` code alone is never accepted as artifact evidence.
- [ ] Pre-existing files have provenance to the current run before `Produced` or `Verified`.
- [ ] Validation notes exist before any artifact is marked `Verified`.

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Status labels match evidence, output paths/validation are clear, and limitations are explicit. |
| Warn | Some evidence exists but validation, provenance, or scope is incomplete. |
| Fail | Artifact success is claimed without evidence, or labels contradict the recorded facts. |

## Failure handling

- Missing output path or missing file/visible evidence → runtime may be `Attempted`, but artifact status cannot exceed `Not Produced` (or `Failed` if the command errored).
- Transcript or executed code only → artifact status remains `Not Produced`.
- Pre-existing file without current-run provenance → downgrade artifact status to `Not Produced`.
- CLI run missing exact command or exit code → downgrade artifact status to `Not Produced` (or `Failed`).
- Missing validation notes → artifact status cannot exceed `Produced` (downgrade any `Verified` claim to `Produced`).
- Path 2 evidence presented for release → label `non-release` and block release promotion.

## Troubleshooting

| Problem | Conservative handling |
|---|---|
| Screenshot exists but no render file | Record two ledger rows: `preview` (`Produced`/`Verified`) and `render` (`Not Produced`). |
| GLB file exists with provenance but no validation | Mark GLB artifact `Produced`, not `Verified`. |
| CLI log says success but file is missing | Runtime `Attempted` or `Failed`; artifact `Not Produced` or `Failed` (never `Attempted`). |
| CLI output file exists but command or exit code is missing | Downgrade artifact to `Not Produced` until exact command and exit code are provided. |
| Output path unknown | Runtime `Attempted`; artifact `Not Produced`; request path and provenance evidence. |
| Pre-existing file found at output path | Artifact `Not Produced` unless timestamp/hash/log provenance proves current run wrote it. |
| Read-only Lab MCP summary or smoke passed | Runtime scoped to read-only; all output artifacts `Not Produced`. |
| Path 2 (`mcp-for-blender`) produced valid files | Mark `Produced (non-release)` or `Verified (non-release)`; never treat as release evidence. |

## Best practices

- Maintain strictly one ledger row per artifact type (`preview`, `render`, `blend`, `GLB/export`).
- Keep runtime states (`Not Run | Attempted | Produced | Verified | Failed`) distinct from artifact states (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`).
- Apply downgrade-only status changes; never upgrade an upstream status claim.
- Require exact command + exit code for CLI fallback and label all Path 2 rows `non-release`.
- Route classified ledgers to `pre-handoff-verification` to gate handoffs and `preview-report-template-writer` to format Markdown reports before calling `glb-web-handoff` or `non-blender-user-response-writer`.

## Good examples

- “Render status: Produced. Output path: `out/hero.png`. Validation: camera framing checked; material fidelity not yet verified.”
- “GLB status: Not Produced. Runtime action was Not Run; no export path exists.”

## Bad examples

- “GLB produced” with no file path.
- “Render verified” with no validation notes.
- “Runtime eval passed” from read-only smoke evidence only.

## User-facing response template

```txt
Artifact evidence ledger
- Runtime stack/mode: <Path 1 host a | Path 1 host b | Path 2 (non-release) | CLI fallback (appendix) | text-only>
- Runtime status: <Not Run | Attempted | Produced | Verified | Failed>
- Release eligibility: <release-eligible | non-release | N/A>

| Artifact type | Artifact status | Command / tool (+ CLI exit code) | Output path + current-run provenance | Validation notes | Limitations |
|---|---|---|---|---|---|
| preview | <Not Run | Not Produced | Produced | Verified | Failed> | <cmd/exit or tool> | <path + provenance> | <notes> | <caveats> |
| render | <Not Run | Not Produced | Produced | Verified | Failed> | <cmd/exit or tool> | <path + provenance> | <notes> | <caveats> |
| blend | <Not Run | Not Produced | Produced | Verified | Failed> | <cmd/exit or tool> | <path + provenance> | <notes> | <caveats> |
| GLB/export | <Not Run | Not Produced | Produced | Verified | Failed> | <cmd/exit or tool> | <path + provenance> | <notes> | <caveats> |

- Next safe action: <pre-handoff-verification | preview-report-template-writer | glb-web-handoff | non-blender-user-response-writer>
```

## Anti-patterns

- Assigning the runtime state `Attempted` to an artifact row instead of `Not Produced` or `Failed`.
- Upgrading an artifact or runtime status instead of enforcing downgrade-only transitions.
- Accepting a prompt transcript or `execute_blender_code` snippet alone as artifact evidence.
- Accepting a pre-existing file without provenance linking it to the current run.
- Accepting CLI fallback evidence without both the exact command and exit code.
- Treating Path 2 (`mcp-for-blender`) output as official release evidence or omitting the `non-release` label.
- Merging `preview`, `render`, `blend`, and `GLB/export` into a single status instead of one row per artifact type.
- Blurring boundaries with `pre-handoff-verification` (gating handoffs), `preview-report-template-writer` (rendering report Markdown), or `glb-web-handoff` (web handoff).

## Cross-skill handoff

- Runtime readiness → `../official-runtime-readiness-checker/SKILL.md`
- Runtime attempt recording → `../runtime-attempt-report-writer/SKILL.md`
- Scene validation → `../blender-scene-quality-checker/SKILL.md`
- Handoff gating (confirm-or-downgrade) → `../pre-handoff-verification/SKILL.md`
- Report Markdown rendering → `../preview-report-template-writer/SKILL.md`
- GLB/web handoff → `../glb-web-handoff/SKILL.md`
- User-facing explanation → `../non-blender-user-response-writer/SKILL.md`

## Non-goals

- Run Blender, render images, export GLB, or modify scene data.
- Install or configure runtime bridges.
- Gate handoffs or perform confirm-or-downgrade release decisions (`pre-handoff-verification`).
- Render the formatted preview or evaluation report Markdown (`preview-report-template-writer`).
- Own GLB web integration handoffs (`glb-web-handoff`).

## References

- `../../docs/skill-system.md`
- `../../docs/runtime-stack-strategy.md`
- `../../docs/evals/official-runtime-verification-criteria.md`
- `../../docs/evals/official-runtime-manual-eval-packet.md`
- `../../laws/evidence-before-done.md`
