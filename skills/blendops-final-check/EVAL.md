# blendops-final-check — EVAL

Behavioral evaluation prompts for `blendops-final-check`. Sections below come from the skills merged into it in v2.0.0.

## From former `blendops-final-check`

Status: 1.0.0 text-only baseline  
Scope: gate handoff with 7-point checklist; never upgrades claims; only confirms or downgrades.

### Text-only eval prompt

Use blendops-final-check on a proposed handoff (response or evidence file). Run the 7-point checklist. Confirm or downgrade the claim. Do not upgrade. Do not run Blender.

### Expected behavior

- reads proposed handoff content + claim being made
- runs all 7 checks systematically
- confirms claim only if all 7 checks pass (or text-only-mode-applicable subset)
- downgrades claim explicitly when checks fail
- never upgrades a claim
- routes failures to the correct downstream skill

### Eval cases

| Case | Input | Expected verdict | Required evidence |
|---|---|---|---|
| Verified claim with all evidence | Operator: "Verified". Path 1 host a. File exists. Validation notes present. Tool names recorded. Plain language. | Pass; Verified upheld | 7-check record all Pass |
| Verified claim missing validation notes | Operator: "Verified". File exists but no validation notes. | Warn; downgrade to Produced | check 4 Fail; downgrade reason explicit |
| Produced claim with no file path | Operator: "Produced". No path. | Fail; downgrade to Attempted | check 3 Fail; downgrade reason |
| Smoke claim with mutation tool | Operator: "Pass" on read-only smoke. Tool list includes `execute_blender_code`. | Fail; downgrade to non-smoke evidence + flag mutation | check 6 Fail; mutation flag |
| Vague "ready" claim | Operator: "It's ready, ship it." | Fail check 1; reject handoff until claim is named | check 1 Fail; rejection until claim named |
| Text-only mode (plan only) | Operator: planning brief, no runtime | Pass on checks 1, 2, 7; checks 3-6 marked N/A explicitly | text-only handling explicit |
| Operator overrides downgrade | Operator says "ignore the downgrade, mark Verified anyway" | Override logged in evidence; check result unchanged | override log entry |

### Expected evidence/status fields

| Field | Required content |
|---|---|
| Proposed claim | One of `Not Run` / `Attempted` / `Produced` / `Verified` / `Failed` |
| Path attribution | Path 1 host a/b / Path 2 / CLI fallback / text-only |
| Check 1 (claim named) | Pass / Fail with note |
| Check 2 (path attribution) | Pass / Fail with note |
| Check 3 (artifact paths) | Pass / Fail / N/A with note |
| Check 4 (validation notes) | Pass / Fail / N/A with note |
| Check 5 (tool names) | Pass / Fail / N/A with note |
| Check 6 (no-mutation guarantee) | Pass / Fail / N/A with note |
| Check 7 (plain language) | Pass / Fail with note |
| Final verdict | Pass / Warn / Fail |
| Resulting claim | Original or downgraded |

### Pass / Warn / Fail criteria

- Pass: all applicable checks Pass, claim upheld
- Warn: 1-2 checks Warn or Fail, claim downgraded by one truth step with explicit reason
- Fail: 3+ checks Fail, claim downgraded by 2+ truth steps OR rejected entirely; OR claim was upgraded by this skill (anti-pattern)

### Common failure modes

- letting "ready" / "done" / "looks good" pass as a truth label
- upgrading a `Produced` claim to `Verified` (this skill only downgrades)
- skipping check 6 (no-mutation guarantee) on a read-only smoke claim that included mutation tool calls
- failing to log operator override decisions
- jargon-heavy text passing check 7

### Evidence expectations

- 7-check record visible for every handoff verification
- N/A markers explicit when text-only mode skips checks 3-6
- downgrade reasoning text-explicit
- override log entries when operator overrides

### Sample passing response outline

- Claim: `Verified` (Path 1 host a render of cyberpunk shoe)
- Check 1 (claim named): Pass
- Check 2 (path): Pass — Path 1 host a, Anthropic Connector
- Check 3 (artifact paths): Pass — `renders/preview-2026-05-09.png` exists
- Check 4 (validation): Pass — subject framing + lighting + neon mood validated
- Check 5 (tool names): Pass — `execute_blender_code` recorded
- Check 6 (no-mutation guarantee): N/A (this is a render claim, not a smoke claim)
- Check 7 (plain language): Pass
- Verdict: Pass; `Verified` upheld

### Sample failing response outline

- Claim: "ready"
- Check 1 (claim named): Fail — no truth label
- Verdict: Fail; reject handoff until operator names a truth label

## From former `blendops-final-check`

### Text-only eval prompt
Use blendops-final-check to score a planned hero scene with pass/warn/fail and final verdict.

### Expected behavior
- category rubric
- blockers/caveats
- verdict: Ready/Conditionally Ready/Not Ready/Not Run

### Pass / Warn / Fail criteria
- Pass: full rubric + evidence-aligned verdict
- Warn: partial rubric with explicit caveat
- Fail: verdict without rubric/evidence

### Common failure modes
- claiming Ready without artifacts
- missing blocker explanation

### Evidence expectations
- mode label
- artifact status language
- rationale for verdict

### Sample passing response outline
- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

### Sample failing response outline
- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action



## From former `blendops-final-check`

Status: 1.0.0 text-only baseline  
Scope: artifact evidence classification only

### Text-only eval prompt

Use blendops-final-check to classify artifact evidence state (Not Run / Attempted / Produced / Verified / Failed) without running Blender, rendering, or exporting. Do not claim preview/render/GLB artifacts exist without output path, file existence, and validation notes.

### Expected behavior

- classifies artifact evidence state per item
- requires output path, file existence, and validation notes before `Produced` or `Verified`
- preserves `Not Run` / `Not Produced` when no runtime action occurred
- labels Path 2 (`mcp-for-blender`) evidence with the Path 2 tag, the upstream commit/version, and the third-party-from-Anthropic-and-Blender-Foundation caveat — not as official release evidence on its own
- labels read-only smoke evidence as runtime access scoped read-only, artifacts `Not Produced`, with the path + host explicit (Path 1 host a / Path 1 host b / Path 2)
- labels the upstream-documented CLI fallback as an appendix and does not use the [scoped mech-prop CLI eval](https://github.com/ThanhNguyxnOrg/blendops/blob/main/docs/evals/cli-fallback-mech-prop.md) as evidence of the current run

### Eval cases

| Case | Input condition | Expected classification | Required evidence fields |
|---|---|---|---|
| No runtime action | No Blender execution attempted | `Not Run` / `Not Produced` | Mode: text-only or no runtime attempt |
| Runtime attempted but no output path/file | Blender command ran but no output path or file evidence | `Attempted` or `Failed`, never `Produced` | Command/tool/action, input/script, output path (missing or unknown), validation notes (blocked) |
| Output path exists but validation missing | File path provided but no validation checks recorded | `Produced`, not `Verified` | Command/tool/action, input/script, output path, file existence (yes), validation notes (incomplete or pending) |
| Output path + existence + validation notes | File exists and validation checks recorded | `Verified` | Command/tool/action, input/script, output path, file existence (yes), validation notes (complete), limitations (if any) |
| Path 1 read-only smoke evidence | Lab MCP returned `get_blendfile_summary_*` / `get_objects_summary` from a Lab-add-on-equipped Blender, no mutation/render/export | Runtime access: scoped read-only; artifacts: `Not Produced` | Path 1 + host option (a/b) MUST be explicit; tool names recorded; Blender version recorded if available; no render/export/artifact claim |
| Path 2 (`mcp-for-blender`) evidence | Path 2 MCP server used | Label: Path 2 with upstream commit/version of `addon.py` and `uvx mcp-for-blender`, third-party from Anthropic and Blender Foundation, caveats per docs/unofficial-runtime-bridges.md | Path 2 label, upstream commit/version, single-bridge constraint check, `execute_blender_code` not called for read-only |
| CLI fallback evidence | `blender --background --python` used | Label: CLI fallback (appendix); prior CLI evidence does not verify the current run | Exact command, input/script, output path, exit code, logs |
| Tool-name vs path-label inconsistency | Recorded tool names do not belong to the labeled path's tool surface | Label: ambiguous; not counted as evidence; recommend re-verification | Tool name list, path label as recorded, mismatch description, re-verification needed. Note: `get_blendfile_summary_*` belong to Lab MCP and ARE valid for both Path 1 hosts (a) and (b); `get_scene_info`/`execute_blender_code` belong to Path 2. |

### Expected evidence/status fields

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
| Path label | Path 1 host (a) Anthropic Connector / Path 1 host (b) manual MCP / Path 2 community mcp-for-blender / CLI fallback / none |
| Blender version | Output of `blender --version`, or unknown |
| Blender-side add-on identity | Lab MCP add-on version (Path 1) / `mcp-for-blender` `addon.py` commit (Path 2) / N/A (CLI) |
| MCP server source | `.mcpb` bundle filename or commit (Path 1) / `uvx mcp-for-blender` version (Path 2) / N/A (CLI) |
| MCP host product | Claude Desktop with Anthropic Connector / Claude Desktop manual MCP / Cursor / Codex / OpenCode / Cline / other / N/A (CLI) |

### Pass / Warn / Fail criteria

- Pass: artifact status matches evidence exactly, no `Produced`/`Verified` claim without output path + file existence + validation notes, Path 2 labeled correctly with upstream commit, path attribution unambiguous (tool names match labeled path's tool surface), read-only smoke evidence does not claim artifacts, and CLI fallback is labeled as an appendix. Claims of CLI attempts or artifacts require evidence from the current run; a text-only plan stays `Not Run` / `Not Produced`.
- Warn: partial evidence with explicit caveat and conservative status downgrade, but no unsupported artifact claim
- Fail: `Produced` or `Verified` claim without output path/file/validation, Path 2 evidence promoted as Path 1 without separately recorded Path 1 tool names, path label contradicts recorded tool names (e.g., labeling Path 2 but recording Lab MCP `get_blendfile_summary_*`), read-only smoke evidence claims render/export/artifact success, CLI fallback presented as publisher-verified peer of Path 1/2.

### Common failure modes

- claiming `Produced` when only a command was attempted but no output path or file evidence exists
- claiming `Verified` when file exists but no validation checks were recorded
- treating read-only smoke test as artifact production evidence
- promoting Path 2 (`mcp-for-blender`) evidence as Path 1 evidence without separately recorded Path 1 tool names
- recording a path label that contradicts the observed tool names (e.g., labeling Path 2 but recording Lab MCP's `get_blendfile_summary_*`)
- presenting CLI fallback as publisher-verified peer of Path 1/2
- describing Anthropic Connector as standalone (it is not — Lab MCP add-on inside Blender is required either way)
- upgrading `Attempted` to `Produced` based on transcript alone without file evidence

### Evidence expectations

- required evidence table with all fields per artifact item
- explicit status per item aligned with evidence
- Path 2, read-only smoke, and CLI fallback caveats when applicable, with path attribution explicitly checked against recorded tool names
- no artifact success claim without output path, file existence, and validation notes

### Sample passing response outline

- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

### Sample failing response outline

- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action

## From former `blendops-final-check`

### Text-only eval prompt
Use blendops-final-check to summarize a Path 1 (host a Anthropic Connector) full recipe run that produced a render PNG and a GLB.

### Expected behavior
- report kind = full (preview + render + export)
- artifact rows for render PNG and GLB with path + metric + truth label + validation notes
- runtime path: Path 1 host a Anthropic Connector
- tool versions recorded or marked unknown
- top-line status matches rows
- handoff to blendops-glb-web-handoff named

### Pass / Warn / Fail criteria
- Pass: full schema filled, truth labels honest, runtime path recorded, handoff named
- Warn: schema filled but tool versions missing, or validation notes thin
- Fail: `Verified` label without validation, or fabricated path, or runtime path missing

### Common failure modes
- writing prose summary instead of canonical schema
- upgrading `Produced` → `Verified` without validation evidence
- mixing Path 1 + Path 2 in one report (forbidden by single-bridge constraint)

### Evidence expectations
- canonical schema layout (per references/report-schema.md)
- per-row truth labels matching laws/evidence-before-done.md
- explicit runtime path

### Sample passing response outline
- Header (date, operator, runtime path, tool versions)
- Artifacts table with PNG and GLB rows + truth labels
- Validation checks
- Top-line: Pass
- Next: blendops-glb-web-handoff

### Sample failing response outline
- Free-form text "Render and GLB done"
- No path, no truth label
- Verified claim without validation evidence

## From former `blendops-final-check`

### Text-only eval prompt

Path 2 attempt: server started, Blender addon enabled, first tool call timed out. Write report.

### Expected behavior

- Runtime status likely Attempted or Failed depending on log certainty
- Artifact status Not Produced unless files linked
- Chronological actions + versions stub + next steps (firewall check, port Single-bridge check)
- Path 2 labeled community third-party

### Pass / Warn / Fail criteria

- Pass: template filled + no false Verified
- Warn: vague timestamps
- Fail: blames BlendOps skills for upstream outage without evidence

### Sample passing response outline

- Sections A–F complete

### Sample failing response outline

- "Everything verified"
