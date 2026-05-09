---
name: preview-report-template-writer
description: Generate the structured preview-report Markdown that glb-web-handoff and non-blender-user-response-writer consume after a render or export run.
---

# preview-report-template-writer

## Purpose
Standardize how a preview / render / export run's evidence is summarized so that downstream skills (handoff, final response writer) consume a known schema instead of re-parsing free-form text.

## Quick start
- pick the report kind (preview-only / render-only / export-only / full)
- fill the schema with measured values + truth labels
- attach evidence paths verbatim
- mark fields not measured as `Not Run`

## When to use
- after `render-export-evidence` produces measurements
- before `glb-web-handoff` is composed
- before `non-blender-user-response-writer` writes the final summary

## When not to use
- planning-only flows with no runtime
- raw debug logs (use `blender-troubleshooting` instead)

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
| Report kind | Determines which sections appear |
| Output paths | Anchors all artifact rows |
| Validation notes per artifact | Determines truth label |

### Optional inputs

| Input | Use |
|---|---|
| Tool / runtime path used (Path 1/2/CLI) | Records provenance |
| Tool versions | Helps reproduce |
| Operator name | Useful for multi-operator repos |

### Assumptions to confirm
- Output paths are real on the machine the report was generated; consumers should not assume they exist on other machines without copying artifacts.
- Truth labels (`Not Run`, `Attempted`, `Produced`, `Verified`, `Failed`) match `laws/evidence-before-done.md` exactly.

## Output schema

### Primary output
A Markdown file (or block) following the canonical preview-report schema (see `references/report-schema.md`).

### Secondary output
- a top-line truth status (`Pass / Warn / Fail`)
- pointers to next skills (`glb-web-handoff`, `non-blender-user-response-writer`)

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed | Blocked / Not Run
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

This skill is documentation. It does not run Blender, render, or export. It only formalizes how an existing run's evidence is recorded. If the run did not happen, the report has every artifact at `Not Run` / `Not Produced`.

For runtime path attribution, follow `../../docs/runtime-stack-strategy.md` (Path 1 / Path 2 / CLI fallback) — record the path explicitly per row.

## Operating procedure
1. Determine report kind based on what was attempted.
2. Read the canonical schema (see references).
3. Fill artifact rows with paths + sizes + truth labels.
4. Fill validation rows with the checks performed.
5. Note the runtime path used (Path 1 host a / Path 1 host b / Path 2 / CLI).
6. Note tool versions if available.
7. Compute top-line status from the rows.
8. Hand off to glb-web-handoff (web) or non-blender-user-response-writer (final).

## Decision tree

```txt
Render attempted but file missing?
  → Artifact: Failed
Render produced but no validation?
  → Artifact: Produced (not Verified)
Render produced and validated?
  → Artifact: Verified
Path 1 + Path 2 mixed in one run?
  → Forbidden by single-bridge constraint; mark Failed and explain
```

## Playbooks

### Playbook A: Preview-only report
- One section: preview screenshot path + dimensions + truth label.
- Used for early scene review before render.

### Playbook B: Render-only report
- Render output paths + resolution + frame range + render time + sample count + engine.
- Used after `render-export-evidence` capture.

### Playbook C: Export-only report
- GLB output path + size + Draco status + animation channel count + texture count.
- Used after a GLB export step without a fresh render.

### Playbook D: Full report (preview + render + export)
- All three sections.
- Used at the end of a complete recipe run.

## Mode handling

### Text-only mode
All artifact rows are `Not Run` / `Not Produced`. Report is a planning placeholder.

### Runtime-ready mode
Real measured values. Truth labels honest per `evidence-before-done`.

### Blocked runtime mode
Report explicitly notes the blocker; remaining rows stay `Not Run`.

## Validation checklist
- [ ] Report kind chosen
- [ ] Every artifact row has a path or `Not Produced`
- [ ] Every artifact row has a truth label
- [ ] Runtime path recorded
- [ ] Tool versions recorded or marked unknown
- [ ] Validation notes per artifact
- [ ] Top-line status matches the rows
- [ ] No truth label upgraded beyond evidence
- [ ] Handoff to next skill named

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All applicable rows filled with consistent truth labels; runtime path recorded; handoff named. |
| Warn | Rows filled but tool versions missing, or validation notes thin. |
| Fail | Truth label upgraded beyond evidence (`Verified` without validation), or path not recorded, or rows fabricated. |

## Failure handling
- If artifact path is unknown → row is `Not Produced` with a note.
- If validation note is thin → keep label at `Produced`, not `Verified`.
- If runtime path is unclear → mark `unknown` and let `runtime-bridge-conflict-resolver` triage.

## Troubleshooting

| Problem | Response |
|---|---|
| Asked to write a "summary" without measurements | Output a placeholder report with all `Not Run` rows; do not fabricate. |
| Operator pushes for a `Verified` label without validation | Refuse upgrade; explain which validation step is missing. |
| Multi-path attempt | Record each path's rows separately; do not merge into one ambiguous total. |

## Best practices
- Match the canonical schema verbatim; consumers parse it.
- Keep truth labels strictly per `evidence-before-done`.
- Always anchor a row in a path (even if the path is `<missing>`).
- Use ISO date in the report filename (`preview-report-YYYY-MM-DD.md`).

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
Runtime path: <Path 1 host a / Path 1 host b / Path 2 / CLI fallback>
Tool versions: <blender X / addon Y / mcp host Z>

## Artifacts
- <kind>: <path> | <metric: e.g. resolution / size> | truth: <label> | validation: <notes>
- ...

## Validation
- <check>: <pass/fail/skip> | <evidence>

## Top-line
Status: Pass / Warn / Fail
Next: glb-web-handoff / non-blender-user-response-writer
Limitations: <gaps>
```

## Anti-patterns
- Free-form prose summary that downstream skills cannot parse.
- Upgrading truth labels.
- Mixing artifact paths into a single comma-separated cell.
- Omitting the runtime path.

## Cross-skill handoff
- Render/export evidence input → `../render-export-evidence/SKILL.md`
- Web handoff → `../glb-web-handoff/SKILL.md`
- Final response → `../non-blender-user-response-writer/SKILL.md`
- Pre-handoff verification → `../pre-handoff-verification/SKILL.md`

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
