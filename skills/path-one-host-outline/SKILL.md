---
name: path-one-host-outline
description: Outline Path 1 hosting options — Anthropic Blender Connector vs manual MCP client — both need Blender Lab MCP add-on in Blender 5.1+.
---

# path-one-host-outline

## Purpose

Outline **Path 1 host surfaces** — **(a)** Anthropic Connector in Claude Desktop vs **(b)** any manually configured MCP client — while making clear that both require the Lab MCP add-on inside **Blender 5.1+** and that the Connector is **never standalone**. This skill provides an outline only; it never configures hosts and never runs Blender.

## Quick start

- confirm Blender 5.1+ target
- choose host category using `references/connector-vs-manual-matrix.md`
- apply reminders from `references/lab-addon-reminders.md`
- emit checklist `references/host-checklist-template.md`

## When to use

- user on Claude Desktop asking what the Anthropic Connector does vs the Blender-side add-on
- user or agent comparing Path 1 host surfaces: **(a)** Anthropic Connector in Claude Desktop vs **(b)** a manually configured MCP client
- outlining which components live on the host side vs inside Blender 5.1+ before setup begins

## When not to use

- choosing between Path 1, Path 2, or CLI → use `runtime-path-picker`
- step-by-step host or add-on installation and configuration → use `official-runtime-setup-guide`
- probing live runtime readiness → use `official-runtime-readiness-checker`
- resolving conflicts between official and unofficial bridges → use `runtime-bridge-conflict-resolver`
- Path 2 community bridge specifics → see `docs/unofficial-runtime-bridges.md`
- CLI appendix job outlining → use `cli-appendix-job-outline`

## Trigger phrases

- "Connector vs Cursor MCP"
- "how do I host Lab MCP"
- "Claude Desktop Connector vs manual MCP client"
- "what hosts work with Path 1"

## Prerequisites / readiness

- target environment plans for **Blender 5.1+** with the Blender-side Lab MCP add-on required for both Host **(a)** and Host **(b)** (the Anthropic Connector is never standalone)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Host product name | Select matrix row |
| Blender version plan | Confirms Path 1 viability |

### Optional inputs

| Input | Use |
|---|---|
| OS | Install nuance pointers |

## Output schema

### Primary output

- host-specific outline using **(a)** Anthropic Connector in Claude Desktop vs **(b)** manually configured MCP client framing (outline only — never configure hosts or dump executable setup scripts; hand off setup details to `official-runtime-setup-guide`)
- explicit prerequisite line stating that both Host **(a)** and Host **(b)** require the Lab MCP add-on inside **Blender 5.1+**
- explicit statement that the Anthropic Connector is **never standalone** whenever Connector is discussed

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed (default: Not Produced)
Rule: Downgrade-only, never upgrade. Outlining hosts never configures hosts or runs Blender.
Blockers: <separate line>
Evidence used: <doc references>
Limitations: <unknown host version>
```

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Outline only; never configures hosts and never runs Blender. Path 1 requires the Lab MCP add-on inside **Blender 5.1+** plus a host surface: **(a)** Anthropic Connector in Claude Desktop or **(b)** any manually configured MCP client. The Connector is **never standalone**. Path 2 (`mcp-for-blender`, formerly `ahujasid/blender-mcp`; see `docs/unofficial-runtime-bridges.md`) and CLI workflows (`cli-appendix-job-outline`) are out of scope here.

## Operating procedure

1. Verify the **Blender 5.1+** version floor for Path 1 (route path selection questions to `runtime-path-picker`).
2. Identify the target host surface as **(a)** Anthropic Connector in Claude Desktop or **(b)** a manually configured MCP client using `references/connector-vs-manual-matrix.md`.
3. State explicitly that the Lab MCP add-on inside Blender 5.1+ is required for both **(a)** and **(b)**, and reiterate that the Connector is **never standalone** (`references/lab-addon-reminders.md`).
4. Emit the conceptual checklist (`references/host-checklist-template.md`) with pointers to `docs/install/claude-desktop.md` or `official-runtime-setup-guide` without performing host configuration.

## Mode handling

### Text-only mode

References only; no credential paths.

### Runtime-ready mode

Suggest pairing with `official-runtime-readiness-checker`.

### Blocked runtime mode

Still explain host conceptual split.

## Validation checklist

* [ ] Host **(a)** (Anthropic Connector in Claude Desktop) vs Host **(b)** (manually configured MCP client) framing is used
* [ ] Lab MCP add-on inside **Blender 5.1+** is stated as a prerequisite on the outline
* [ ] "Connector is never standalone" phrasing is present whenever the Connector is discussed
* [ ] No host configuration, Python, or Blender execution is performed
* [ ] Former Path 2 repo is cited as `ahujasid/blender-mcp` (never bare `blender-mcp`)
* [ ] Truth states use the full allowed enums with default `Not Produced` for artifacts and downgrade-only enforcement

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Uses Host (a)/(b) framing, requires Lab MCP add-on in Blender 5.1+, states Connector is never standalone, keeps strictly to outlining, and uses exact truth-state enums. |
| Warn | Host product or version is ambiguous, requiring a general (a) vs (b) comparison with documented limitations. |
| Fail | Implies Connector is standalone or installs Blender internals automatically, omits Blender 5.1+ Lab add-on prerequisite, uses bare `blender-mcp`, configures hosts/runs Blender, or upgrades truth states. |

## Cross-skill handoff

* Path selection → `../runtime-path-picker/SKILL.md`
* Detailed setup and configuration → `../official-runtime-setup-guide/SKILL.md`
* Readiness probing → `../official-runtime-readiness-checker/SKILL.md`
* Bridge conflicts → `../runtime-bridge-conflict-resolver/SKILL.md`
* CLI appendix workflows → `../cli-appendix-job-outline/SKILL.md`
* Path 2 community bridge reference → `../../docs/unofficial-runtime-bridges.md`

## References

- `references/connector-vs-manual-matrix.md`
- `references/lab-addon-reminders.md`
- `references/host-checklist-template.md`
- `../../docs/install/claude-desktop.md`
