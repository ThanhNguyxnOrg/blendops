
# blendops-connect-blender (reference for `blendops-connect-blender`)

> Detailed playbook carried over from the former `blendops-connect-blender` skill. Load it from [`../SKILL.md`](../SKILL.md) when this part of the job is in scope.

## Purpose

Structure **CLI fallback appendix** jobs (batch render, batch export, scripted scene setup) using Blender's documented command-line interface — without presenting arbitrary Python as the user-facing product surface.

## Quick start

- classify job type via `references/job-type-matrix.md`
- capture ordering cautions `references/flag-order-reminders.md`
- state limitations `references/stateless-limitations.md`
- point user to upstream CLI manual for exact flags

## When to use

- CI / render farm / repeatable exports
- MCP unavailable or disallowed by policy
- deterministic batch operations vs exploratory modeling

## When not to use

## Trigger phrases

## Prerequisites / readiness

- user accepts stateless job model
- Blender executable accessible to shell running job

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Job intent (batch render vs batch export vs scripted job) | Chooses matrix row (routeMCP vs CLI selection to `blendops-connect-blender` first) |
| Output artifact expectations | Drives validation hooks (route format selection to `blendops-render-settings`) |

### Optional inputs

| Input | Use |
|---|---|
| GPU availability | Device flags category note |
| Mixture of Windows/Linux paths | Quote escaping caution |

## Output schema

### Primary output

- Phased job outline: startup, load, process, save
- Flag categories to look up in the upstream Blender manual (plain language only; no copy-paste Python dumps, no execution)
- Validation and logging hooks (stdout tail, expected output paths)

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Produced | Produced | Verified | Failed (default: Not Produced)
Rule: Downgrade-only, never upgrade. Outlining a job never executes Blender (Runtime remains Not Run; Artifact remains Not Produced).
Blockers: <separate line>
Evidence used: <none during outlining; route actual CLI logs/outputs to blendops-final-check>
Limitations: Stateless execution, no interactive viewport
```

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Planning outline only — BlendOps never executes Blender and never presents arbitrary Python as the product surface. This CLI workflow is an **appendix only**, not a peer MCP path; see the [scoped mech-prop CLI eval](https://github.com/ThanhNguyxnOrg/blendops/blob/main/docs/evals/cli-fallback-mech-prop.md). Point users to the upstream Blender manual for exact CLI flags.

## Operating procedure

1. Verify `blendops-connect-blender` confirmed MCP is ill-fit; if interactive MCP is needed, hand off to `blendops-connect-blender`.
2. Verify target formats are settled via `blendops-render-settings`.
3. Select the job-type matrix row and outline phases (`blender --background` startup, load, process, save), flag categories, and validation/logging hooks in plain language without Python dumps.
4. Direct the user to verify exact flags against the upstream Blender manual.
5. Keep truth states at `Not Run` (Runtime) and `Not Produced` (Artifact); hand off actual CLI execution logs and outputs to `blendops-final-check`.

## Decision tree

```txt
Does the user need interactive viewport look-dev or live chat steering?
  Yes → do NOT use CLI appendix; route to blendops-connect-blender
  No → continue
Has MCP vs CLI path selection already been decided?
  No → route to blendops-connect-blender first to confirm CLI appendix fits constraints
  Yes → continue
Are target output formats and resolutions settled?
  No → route to blendops-render-settings / blendops-camera before outlining batch stages
  Yes → continue
Which batch job pattern applies (`references/job-type-matrix.md`)?
  Batch still render → outline startup, .blend load, engine/camera/output flag categories, and render log hooks
  Batch GLB export → outline startup, .blend load, collection visibility/export check categories, and GLB size/validator hooks
  Scripted scene hygiene / prep → outline factory-startup caution, `--python` ordering reminder, and file diff/hash hooks
Did the operator already run the CLI job and produce logs or files?
  Yes → route logs to blendops-final-check and output files to blendops-final-check
  No → emit planning outline with Runtime status: Not Run and Artifact status: Not Produced
```

## Playbooks

### Playbook A: CI or render-farm headless still render outline

- Select the **Batch still render** row from `references/job-type-matrix.md`.
- Structure the 4 phases (background startup, scene file load, render execution flags category, output verification hooks) and attach flag-ordering cautions from `references/flag-order-reminders.md`.
- Direct the operator to the upstream Blender CLI manual for exact version-matched flags and keep `Runtime status: Not Run` and `Artifact status: Not Produced`.

### Playbook B: Nightly headless GLB batch export outline

- Select the **Batch GLB export** row from `references/job-type-matrix.md` after confirming format rules via `blendops-render-settings`.
- Highlight stateless limitations (`references/stateless-limitations.md`), extension/add-on enablement differences under factory startup profiles, and argument-separator (`--`) cautions.
- Specify downstream evidence hooks for `blendops-final-check` and `blendops-glb-web-handoff`.

### Playbook C: Restricted IT environment where MCP ports are blocked

- Acknowledge the policy blocker on a separate `Blockers:` line when MCP bridges (port `9876`) are disallowed.
- Frame the `blender --background` workflow strictly as the **CLI fallback appendix** (documented upstream as a first-class Blender CLI surface; see the [scoped mech-prop CLI eval](https://github.com/ThanhNguyxnOrg/blendops/blob/main/docs/evals/cli-fallback-mech-prop.md)).
- Provide the phased job outline and logging hooks without pasting executable Python scripts.

## Mode handling

### Text-only mode

Provide the phased CLI job outline, flag categories, and stateless limitations. Runtime is `Not Run`; Artifact is `Not Produced`.

### Runtime-ready mode

Specify validation and logging hooks (where logs and output files should land), then hand off post-run verification to `blendops-final-check`. Outlining never upgrades truth states.

### Blocked runtime mode

Outline the intended phased job structure and record blockers on a separate line with Runtime `Not Run` and Artifact `Not Produced`.

## Validation checklist

* [ ] Framed strictly as an appendix, never a peer path without an eval record
* [ ] Stateless, no-viewport limitations acknowledged
* [ ] Upstream Blender CLI manual cited for exact flags
* [ ] No copy-paste Python dumps and no implication that BlendOps executes Blender
* [ ] Truth states respect downgrade-only rule (default `Not Produced` for artifacts; outlining never runs anything)
* [ ] Role boundaries preserved with `blendops-connect-blender`, `blendops-render-settings`, and `blendops-final-check`

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Coherent phased outline + flag categories + validation/logging hooks + accurate downgrade-only truth states |
| Warn | GPU or OS path environment uncertain — dual-branch caution noted |
| Fail | Includes copy-paste Python dumps, treats CLI as a peer path, blurs roles with path/format/evidence skills, or upgrades truth states without verified evidence |

## Failure handling

- If the user asks for a copy-paste Python script or raw `bpy` batch code, refuse the code dump per `laws/no-arbitrary-python-interface.md` and provide a plain-language phased job outline plus upstream manual pointers instead.
- If the user wants live interactive viewport adjustments through the CLI appendix, stop and route back to `blendops-connect-blender`.
- If a prior CLI run failed silently (for example, flags placed after the scene filename were ignored before load), keep `Runtime status: Failed` (or `Attempted`), keep `Artifact status: Not Produced`, and route the log capture to `blendops-final-check`.
- Never promote the CLI fallback appendix to a peer MCP runtime path based on the [scoped mech-prop CLI eval](https://github.com/ThanhNguyxnOrg/blendops/blob/main/docs/evals/cli-fallback-mech-prop.md) or a new CLI-only record.

## Troubleshooting

| Symptom | Cause | Safe resolution |
|---|---|---|
| CLI job renders default cube or wrong settings | Flag order error in `blender --background` (settings placed after render trigger or scene file) | Review `references/flag-order-reminders.md` and verify exact flag ordering in the upstream Blender command-line manual for the installed Blender version. |
| Custom script arguments disappear in headless run | Missing `--` argument separator after `--python` script path | Note the argument-separator check prompt from `references/flag-order-reminders.md` and consult upstream CLI docs. |
| Export add-on or GPU device missing on CI runner | Factory startup or headless runner profile differs from artist workstation | Flag the environment gap under `Limitations` (`references/stateless-limitations.md`) and require stdout/stderr device capture in `blendops-final-check`. |

## Best practices

- Always label `blender --background` workflows as the **CLI fallback appendix** — documented upstream as a first-class Blender CLI surface; see the [scoped mech-prop CLI eval](https://github.com/ThanhNguyxnOrg/blendops/blob/main/docs/evals/cli-fallback-mech-prop.md).
- Express job steps as phased operational checkpoints (`Startup → Load → Process → Save & Verify`) rather than raw shell one-liners or Python code blocks.
- Remind operators that argument order in Blender's CLI is positional and must be verified against the exact Blender manual version running on the host.
- Pair every CLI outline with explicit stdout/stderr log paths and output file checks consumed by `blendops-final-check`.

## Good examples

- "CLI appendix job outline (Batch GLB export): Phase 1 Background startup (headless mode, verify extension profile) → Phase 2 Load `.blend` source → Phase 3 Trigger GLB export step with `--` argument boundary checked against upstream Blender CLI manual → Phase 4 Capture exit code, stdout/stderr log path, and exported `.glb` byte size for `blendops-final-check`. Runtime status: Not Run. Artifact status: Not Produced."
- "Because interactive viewport look-dev is required, `blendops-connect-blender` is not the right surface (`references/stateless-limitations.md`); hand off to `blendops-connect-blender` to evaluate Path 1 (Blender 5.1+ Lab MCP) or Path 2 (`mcp-for-blender`)."

## Bad examples

- "Run this 120-line Python script with `blender -b scene.blend -P export_all.py` and your GLBs are Verified." — violates `laws/no-arbitrary-python-interface.md` and `laws/evidence-before-done.md`.
- "Path 3 (Blender CLI) is a verified peer runtime in BlendOps." — misrepresents the CLI appendix as a peer path and fabricates in-repo eval evidence.
- " Blender 5.1+ is required to run `blender --background`." — falsely applies Path 1's Lab MCP add-on version floor to the CLI appendix.

## User-facing response template

```txt
Job classification: <Batch still render | Batch GLB export | Scripted scene prep | Hygiene pass> (CLI fallback appendix — not a peer MCP path)
Upstream reference: Verify exact positional flags in the official Blender Command Line Manual for your Blender version.

Phased job outline:
1. Startup: <headless background mode + startup profile checks>
2. Load: <target .blend input + path quoting cautions>
3. Process: <render/export/script flag category + ordering reminders>
4. Save & logging hooks: <expected output path + stdout/stderr log capture>

Stateless limitations: <no interactive viewport; factory-startup/GPU caveats>
Blockers: <none or specific environment/policy blockers>
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <none during outlining>
Next skill: <blendops-final-check | blendops-final-check | blendops-render-settings>
```

## Anti-patterns

- Dumping copy-paste Python (`bpy`) scripts or claiming BlendOps ships a CLI wrapper binary.
- Presenting the CLI fallback appendix as a peer path to Path 1 / Path 2 without an in-repo evaluation record under `docs/evals/`.
- Applying the Path 1 **Blender 5.1+** floor (`blender_version_min = "5.1.0"`) to `blender --background` CLI jobs.
- Writing `Artifact status: Not Run` or upgrading `Runtime status` / `Artifact status` merely from outlining a batch job.
- Skipping `blendops-render-settings` or `blendops-final-check` when planning deliverable verification.

## Cross-skill handoff

## Non-goals

- Generating or debugging user-facing Python (`bpy`) scripts.
- Executing `blender --background` jobs or inspecting output files directly.
- Selecting between MCP Path 1, Path 2, and CLI (owned by `blendops-connect-blender`).
- Certifying rendered frames or exported GLBs (owned by `blendops-final-check`).

## References

- `references/job-type-matrix.md`
- `references/flag-order-reminders.md`
- `references/stateless-limitations.md`
- `../../docs/runtime-stack-strategy.md`
