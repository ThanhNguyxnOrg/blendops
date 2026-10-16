---
name: preview-report-template-writer
description: Generate the structured preview-report Markdown that glb-web-handoff and non-blender-user-response-writer consume after a render or export run.
---

# preview-report-template-writer

## Purpose
Standardize how a preview / render / export run's evidence is summarized so that downstream skills (handoff, final response writer) consume a known schema instead of re-parsing free-form text.

## Quick start
- pick the report kind (`preview` / `render` / `export` / `full`)
- copy measured values and truth labels from `render-export-evidence` (downgrade-only, never upgrade)
- attach artifact paths and runtime path (`Path 1 host a` / `Path 1 host b` / `Path 2` / `CLI`) per row verbatim
- mark unmeasured or unproduced fields as `Not Run` / `Not Produced` (no-run reports are full `Not Run` / `Not Produced` placeholders)

## When to use
- after `render-export-evidence` produces measurements
- before `glb-web-handoff` is composed
- before `non-blender-user-response-writer` writes the final summary

## When not to use
- measuring artifacts directly (use `render-export-evidence` instead)
- raw debug logs or crash triage (use `blender-troubleshooting` instead)
- gating handoff readiness (use `pre-handoff-verification` instead)

## Trigger phrases
- "summarize the render"
- "write up the export evidence"
- "what's the preview status"

## Prerequisites / readiness
- runtime evidence (or explicit absence) is known
- output paths are known
- validation notes are written or marked missing

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Report kind (`preview` / `render` / `export` / `full`) | Determines which sections appear |
| Output paths (or explicit `Not Produced`) | Anchors all artifact rows |
| Measurements + source truth labels from `render-export-evidence` | Supplies measured metrics and baseline truth state (downgrade-only, never upgraded; `Not Run` / `Not Produced` if no run) |
| Runtime path per row (`Path 1 host a` / `Path 1 host b` / `Path 2` / `CLI` / `Not Run`) | Records per-row execution provenance |
| Validation notes per artifact | Supports keeping or downgrading the truth label |

### Optional inputs

| Input | Use |
|---|---|
| Tool versions | Helps reproduce (`unknown` if unavailable) |
| Operator name | Useful for multi-operator repos |

### Assumptions to confirm
- Output paths are real on the machine the report was generated; consumers should not assume they exist on other machines without copying artifacts.
- Truth labels (`Not Run`, `Not Produced`, `Attempted`, `Produced`, `Verified`, `Failed`) match `laws/evidence-before-done.md` and `render-export-evidence` output; this skill may only downgrade labels, never upgrade them.

## Output schema

### Primary output
A Markdown file (or block) following the canonical preview-report schema (see `references/report-schema.md`).

### Secondary output
- a top-line truth status (`Pass / Warn / Fail`)
- pointers to next skills (`pre-handoff-verification` to gate handoffs, then `glb-web-handoff` and `non-blender-user-response-writer`)

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

This skill is documentation only. It never runs Blender, renders, exports, or parses logs (`render-export-evidence` supplies measurements; `blender-troubleshooting` owns raw debug logs). It only formats existing evidence into the canonical schema. If the run did not happen, the report is a full placeholder with every artifact at `Not Run` / `Not Produced`.

For runtime path attribution, follow `../../docs/runtime-stack-strategy.md` (`Path 1 host a` / `Path 1 host b` / `Path 2` / `CLI`) — record the runtime path explicitly per artifact row.

## Operating procedure

1. Determine report kind (`preview` / `render` / `export` / `full`) based on what was attempted or requested.
2. Read the canonical schema (see `references/report-schema.md`).
3. Fill artifact rows using measurements and truth labels copied from `render-export-evidence` (or `Not Run` / `Not Produced` for unmeasured/no-run items); never fabricate rows and never upgrade a truth label (downgrade-only).
4. Record the runtime path (`Path 1 host a` / `Path 1 host b` / `Path 2` / `CLI` / `Not Run`) explicitly on every artifact row.
5. Fill validation rows with the checks performed; downgrade the row truth label if validation is missing or thin.
6. Note tool versions if available (or mark `unknown`).
7. Compute top-line `Pass / Warn / Fail` status from the rows.
8. Name the handoff to `pre-handoff-verification` (handoff gate), `glb-web-handoff` (web), or `non-blender-user-response-writer` (final response).

## Decision tree

```txt
No run occurred or field not measured?
  → Runtime: Not Run | Artifact: Not Produced (full placeholder; never fabricate)
Render/export attempted in render-export-evidence but file missing?
  → Artifact: Failed (or Not Produced if never written)
render-export-evidence reports Produced or Verified, but validation is missing/thin?
  → Downgrade/keep Artifact at Produced (never upgrade to Verified)
render-export-evidence reports Verified with validation evidence attached?
  → Copy Verified as-is (never upgrade a lower label to Verified here)
Path 1 + Path 2 mixed in one run?
  → Forbidden by single-bridge constraint; mark Failed and explain
```

## Playbooks

### Playbook A: Preview report (`kind: preview`)

* Preview screenshot path (or `Not Produced`) + dimensions + runtime path (`Path 1 host a` / `Path 1 host b` / `Path 2` / `CLI`) + truth label copied from `render-export-evidence` + validation notes.
* Used for early scene review before render.

### Playbook B: Render report (`kind: render`)

* Render output paths (or `Not Produced`) + resolution + frame range + render time + sample count + engine + runtime path per row + truth label copied from `render-export-evidence` + validation notes.
* Used after `render-export-evidence` capture.

### Playbook C: Export report (`kind: export`)

* GLB output path (or `Not Produced`) + size + Draco status + animation channel count + texture count + runtime path per row + truth label copied from `render-export-evidence` + validation notes.
* Used after a GLB export step without a fresh render.

### Playbook D: Full report (`kind: full`)

* Preview + render + export artifact rows, each with path, metrics, per-row runtime path, truth label from `render-export-evidence` (downgrade-only), and validation notes.
* Used at the end of a complete recipe run.

## Mode handling

### Text-only mode

No-run report: all runtime states are `Not Run` and all artifact rows are `Not Run` / `Not Produced`. Report serves as a full placeholder without fabricated values.

### Runtime-ready mode

Populated from `render-export-evidence` measurements. Truth labels copied honestly per `evidence-before-done` (downgrade-only, never upgraded).

### Blocked runtime mode

Report explicitly notes the blocker; unmeasured and unproduced rows stay `Not Run` / `Not Produced`.

## Validation checklist

* [ ] Report kind chosen (`preview` / `render` / `export` / `full`)
* [ ] Every artifact row has a real path or `Not Produced` (no fabricated rows)
* [ ] Every artifact row has a truth label copied from `render-export-evidence` (or `Not Run` / `Not Produced`)
* [ ] No truth label is upgraded beyond `render-export-evidence` (downgrade-only)
* [ ] Runtime path recorded per artifact row (`Path 1 host a` / `Path 1 host b` / `Path 2` / `CLI` / `Not Run`)
* [ ] Tool versions recorded or marked `unknown`
* [ ] Validation notes included per artifact
* [ ] Top-line status (`Pass / Warn / Fail`) matches the rows
* [ ] Handoff to next skill named (`pre-handoff-verification`, `glb-web-handoff`, or `non-blender-user-response-writer`)

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All applicable rows filled with consistent truth labels; runtime path recorded; handoff named. |
| Warn | Rows filled but tool versions missing, or validation notes thin. |
| Fail | Truth label upgraded beyond evidence (`Verified` without validation), or path not recorded, or rows fabricated. |

## Failure handling

* If artifact path is unknown or unmeasured → mark row `Not Produced` (or `Not Run`) with a note; never fabricate.
* If validation note is missing or thin → downgrade/keep label at `Produced`, never `Verified`.
* If raw debug logs fail or need parsing → route to `blender-troubleshooting` (do not parse logs in this skill).
* If runtime path is unclear or bridges conflict → mark `unknown` and let `runtime-bridge-conflict-resolver` triage.

## Troubleshooting

| Problem | Response |
| --- | --- |
| Asked to write a "summary" without measurements | Output a full placeholder report with all `Not Run` / `Not Produced` rows; do not fabricate. |
| Operator pushes for a `Verified` label without validation or above `render-export-evidence` | Refuse upgrade (downgrade-only rule); explain which validation or measurement step is missing. |
| Handed raw Blender debug logs instead of `render-export-evidence` output | Do not parse logs; route raw logs to `blender-troubleshooting` and request measured inputs from `render-export-evidence`. |
| Multi-path attempt | Record each artifact row with its own runtime path (`Path 1 host a`, `Path 1 host b`, `Path 2`, `CLI`) separately; do not merge into one ambiguous total. |

## Best practices

* Match the canonical schema verbatim; downstream consumers (`glb-web-handoff`, `non-blender-user-response-writer`) rely on it.
* Copy truth labels from `render-export-evidence` and enforce downgrade-only (never upgrade).
* Always anchor every artifact row with both an output path (or `Not Produced`) and a runtime path (`Path 1 host a` / `Path 1 host b` / `Path 2` / `CLI` / `Not Run`).
* Use ISO date in the report filename (`preview-report-YYYY-MM-DD.md`).

## Good examples
- "Render: `out/render-2026-05-09.png`, 1920×1080, Cycles 128 samples, 23s, Path 1 host a, Verified by reference image diff < 2%."

## Bad examples
- "Render done." — no path, no label.
- "Verified GLB." — no validation evidence.

## User-facing response template

```txt
# Preview report (kind: <preview / render / export / full>)
Date: <YYYY-MM-DD>
Operator: <name or unknown>
Runtime path: <Path 1 host a / Path 1 host b / Path 2 / CLI / Not Run>
Tool versions: <blender X / addon Y / mcp host Z / unknown>

## Artifacts
- <kind>: <path or Not Produced> | <metric: e.g. resolution / size or Not Run> | runtime_path: <Path 1 host a / Path 1 host b / Path 2 / CLI / Not Run> | truth: <Not Run / Not Produced / Attempted / Produced / Verified / Failed> | validation: <notes>
- ...

## Validation
- <check>: <pass/fail/skip> | <evidence>

## Top-line
Status: Pass / Warn / Fail
Next: pre-handoff-verification / glb-web-handoff / non-blender-user-response-writer
Limitations: <gaps>
```

## Anti-patterns
- Free-form prose summary that downstream skills cannot parse.
- Upgrading truth labels.
- Mixing artifact paths into a single comma-separated cell.
- Omitting the runtime path.

## Cross-skill handoff

* Measured evidence input (supplies measurements + truth states) → `../render-export-evidence/SKILL.md`
* Handoff gate (gates handoffs before downstream delivery) → `../pre-handoff-verification/SKILL.md`
* Web handoff consumer → `../glb-web-handoff/SKILL.md`
* Final non-Blender user response consumer → `../non-blender-user-response-writer/SKILL.md`
* Raw debug log triage (out of scope here) → `../blender-troubleshooting/SKILL.md`

## Non-goals
- Run Blender.
- Render or export.
- Parse log files (out of scope; consume measurement output of `render-export-evidence`).
- Promote a label without evidence.

## References
- `references/report-schema.md`
- `references/truth-label-rules.md`
- `references/handoff-recipients.md`
- `../../laws/evidence-before-done.md`
- `../../docs/skill-system.md`
