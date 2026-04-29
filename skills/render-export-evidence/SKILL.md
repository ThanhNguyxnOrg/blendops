---
name: render-export-evidence
description: Verify preview/render/GLB artifact truth by recording commands, inputs, output paths, file existence, validation notes, limitations, and conservative status labels.
version: 0.1.0-draft
status: draft
tags:
  - blender
  - official-runtime
  - blendops
---

# render-export-evidence

## Purpose

Create a conservative evidence ledger for preview, render, export, and GLB claims. Use this skill to decide whether an artifact is `Not Run`, `Attempted`, `Produced`, `Verified`, or `Failed`.

This skill verifies evidence; it does not run Blender or create artifacts by itself.

## Quick start

1. Identify the claimed artifact or runtime action.
2. Collect command/tool, input/script/scene, output path, file existence, validation notes, and limitations.
3. Assign the most conservative valid status.
4. Hand off to `glb-web-handoff` or response writer only after evidence is clear.

## When to use

Use this skill when:

- a user asks whether preview/render/GLB/export succeeded
- an agent needs to summarize artifact evidence
- a runtime eval produced or attempted files
- a report needs artifact truth labels
- a handoff needs proof before user-facing claims

## When not to use

Do not use this skill when:

- the user only needs a scene plan with no runtime/artifact evidence
- runtime readiness has not been checked and the user wants execution
- the task is GLB web integration language after evidence is already summarized; use `glb-web-handoff`
- the request asks to run Blender, render, or export; use runtime/eval flow first

## Trigger phrases

- “Did the render produce?”
- “Can I claim the GLB exists?”
- “Verify export evidence.”
- “What artifact status should this have?”
- “Summarize preview/render/GLB evidence.”

## Prerequisites / readiness

- The claimed artifact type is known: preview, render, Blender file, GLB/export, or handoff record.
- Any runtime action is already completed or explicitly `Not Run` / `Attempted`.
- Evidence sources are available or can be marked missing.
- No artifact claim is accepted from intent, prompt text, or transcript alone.

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Artifact type | Status is scoped per artifact. |
| Runtime stack or mode | Separates Stack 1, Stack 2, Stack 3, or text-only mode. |
| Command/tool/action used | Proves how the artifact was attempted. |
| Input/script/scene | Connects output to a specific run. |
| Output path | Required for file-based claims. |
| File existence or visible evidence | Required before `Produced` or `Verified`. |
| Validation notes | Required before `Verified`. |
| Limitations/failures | Prevents overclaiming. |

### Optional inputs

| Input | Use |
|---|---|
| File size/hash | Strengthens generated-file evidence. |
| Screenshot/render thumbnail path | Supports visible-output claims. |
| Logs/exit status | Supports CLI or failed-attempt analysis. |
| User-facing target | Shapes handoff language. |

### Assumptions to confirm

- Runtime eval remains `Not Run` unless an actual runtime action was recorded.
- Preview/render/GLB remains `Not Produced` unless concrete output evidence exists.
- `Produced` is not `Verified` until validation notes exist.

## Output schema

### Primary output

An artifact evidence ledger.

### Secondary output

- status per artifact type
- missing evidence list
- next safe action
- handoff recommendation

### Evidence / caveat output

```txt
Artifact type: <preview | render | blend | GLB/export | handoff>
Status: Not Run | Attempted | Produced | Verified | Failed
Runtime stack: <Stack 1 | Stack 2 | Stack 3 | text-only | unknown>
Command/tool/action: <recorded or missing>
Input/script/scene: <recorded or missing>
Output path: <path or Not Produced>
File existence: <yes/no/unknown>
Validation notes: <notes or missing>
Limitations: <caveats>
Next safe action: <action>
```

## Required laws

- `../../laws/official-runtime-only.md`
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`

## Official runtime boundary

This skill can evaluate evidence from:

1. Stack 1 — Claude Desktop official connector stack.
2. Stack 2 — Official Blender CLI fallback.
3. Stack 3 — Optional unofficial third-party bridge stack, local/experimental only.

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

This skill must not run Blender, render, export GLB, mutate scenes, install runtimes, or promote optional local bridge evidence as official release-eval evidence.

## Operating procedure

1. Name every artifact type in scope.
2. For each artifact, collect:
   - command/tool/action used
   - input/script/scene
   - output path
   - file existence or visible-output evidence
   - validation notes
   - limitations/failures
3. Assign status using the decision tree.
4. List missing evidence before any handoff.
5. Recommend next safe action.

## Decision tree

```txt
No runtime action recorded?
  → Not Run
Runtime action recorded but output missing/incomplete?
  → Attempted or Failed
Output path/visible evidence exists but validation missing?
  → Produced
Output exists and validation notes pass?
  → Verified
Runtime/action failed or artifact absent when required?
  → Failed or Not Produced with reason
```

## Playbooks

### Playbook A: Text-only planning output

- Runtime status: `Not Run`.
- Artifact status: `Not Produced`.
- Next action: runtime readiness or eval packet.

### Playbook B: CLI fallback output

Require:

- exact Blender command
- script/input path
- output folder
- generated file paths
- exit status/logs
- validation notes

Without generated files, do not claim artifacts.

### Playbook C: Connector output

Require:

- connector action/tool name or UI action
- Blender-side action notes
- generated file paths or screenshot/render evidence
- validation notes
- permission/session caveats

Read-only smoke evidence is not render/export evidence.

### Playbook D: Optional local bridge output

- Label as Stack 3 local/experimental.
- Keep separate from official release-eval evidence.
- Record host/port and arbitrary code execution caveats if relevant.

## Mode handling

### Text-only mode

Use to mark artifacts `Not Run` / `Not Produced` and prepare evidence checklist.

### Runtime-ready mode

Use after the runtime/eval action has happened or when reviewing a captured eval record.

### Blocked runtime mode

Use when runtime was unavailable; record blockers and keep artifacts `Not Produced`.

## Validation checklist

- [ ] Artifact type is named.
- [ ] Runtime stack/mode is named.
- [ ] Command/tool/action is recorded or explicitly missing.
- [ ] Input/script/scene is recorded or explicitly missing.
- [ ] Output path is recorded or explicitly `Not Produced`.
- [ ] File existence or visible evidence is recorded.
- [ ] Validation notes exist before `Verified`.
- [ ] Limitations/failures are listed.
- [ ] No unsupported route is treated as official.
- [ ] No artifact success is claimed from transcript alone.

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Status labels match evidence, output paths/validation are clear, and limitations are explicit. |
| Warn | Some evidence exists but validation, provenance, or scope is incomplete. |
| Fail | Artifact success is claimed without evidence, or labels contradict the recorded facts. |

## Failure handling

- Missing output path → status cannot exceed `Attempted`.
- Missing file existence/visible evidence → status cannot exceed `Attempted`.
- Missing validation notes → status cannot exceed `Produced`.
- Failed command/export → record `Failed` or `Not Produced` with reason.
- Pre-existing file only → do not claim current run produced it unless provenance links it to the run.

## Troubleshooting

| Problem | Conservative handling |
|---|---|
| Screenshot exists but no render file | Mark preview evidence separately from render file. |
| GLB file exists but no validation | `Produced`, not `Verified`. |
| CLI log says success but file missing | `Attempted` or `Failed`, not `Produced`. |
| Output path unknown | `Attempted`; request path evidence. |
| Read-only connector smoke passed | Runtime access scoped to read-only; artifacts `Not Produced`. |

## Best practices

- Track each artifact type separately.
- Prefer paths and validation notes over prose claims.
- Use exact status words.
- Keep user-facing summary understandable for non-Blender users.
- Hand off to `glb-web-handoff` only after GLB/export status is known.

## Good examples

- “Render status: Produced. Output path: `out/hero.png`. Validation: camera framing checked; material fidelity not yet verified.”
- “GLB status: Not Produced. Runtime action was Not Run; no export path exists.”

## Bad examples

- “GLB produced” with no file path.
- “Render verified” with no validation notes.
- “Runtime eval passed” from read-only smoke evidence only.

## User-facing response template

```txt
Artifact evidence summary
- Runtime stack/mode: <state>
- Preview: <status + path/evidence>
- Render: <status + path/evidence>
- GLB/export: <status + path/evidence>
- Validation: <notes or missing>
- Limitations: <caveats>
- Next safe action: <action>
```

## Anti-patterns

- Treating a planned output as a produced artifact.
- Treating a prompt transcript as file evidence.
- Merging preview, render, and GLB into one vague status.
- Calling optional local bridge evidence official release evidence.

## Cross-skill handoff

- Runtime readiness → `../official-runtime-readiness-checker/SKILL.md`
- Scene validation → `../blender-scene-quality-checker/SKILL.md`
- GLB/web handoff → `../glb-web-handoff/SKILL.md`
- User-facing explanation → `../non-blender-user-response-writer/SKILL.md`

## Non-goals

- Run Blender.
- Render images.
- Export GLB.
- Modify scene data.
- Install runtime bridges.
- Publish artifacts.

## References

- `../../docs/skill-system.md`
- `../../docs/runtime-stack-strategy.md`
- `../../docs/evals/official-runtime-verification-criteria.md`
- `../../docs/evals/official-runtime-manual-eval-packet.md`
- `../../laws/evidence-before-done.md`
