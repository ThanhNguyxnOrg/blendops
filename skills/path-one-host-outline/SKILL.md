---
name: path-one-host-outline
description: Outline Path 1 hosting options — Anthropic Blender Connector vs manual MCP client — both need Blender Lab MCP add-on in Blender 5.1+.
---

# path-one-host-outline

## Purpose

Explain **Path 1 host surfaces** without implying any host replaces the Blender-side Lab MCP installation.

## Quick start

- confirm Blender 5.1+ target
- choose host category using `references/connector-vs-manual-matrix.md`
- apply reminders from `references/lab-addon-reminders.md`
- emit checklist `references/host-checklist-template.md`

## When to use

- user on Claude Desktop asking about Connector
- coding agent needs generic MCP JSON/YAML pattern for Lab MCP
- comparing "tutorial path" vs "bring your own client"

## When not to use

- Path 2 community bridge specifics (`docs/unofficial-runtime-bridges.md`)
- CLI appendix batch planning
- readiness probing without host context

## Trigger phrases

- "Connector vs Cursor MCP"
- "how do I host Lab MCP"
- "Claude Desktop blender setup"
- "manual MCP for Path 1"

## Prerequisites / readiness

- user acknowledges Blender-side add-on requirement

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

- host-specific outline (not executable code dump — point to install docs)
- explicit Lab MCP add-on prerequisite line

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed | Blocked / Not Run
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <doc references>
Limitations: <unknown host version>
```

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Outline only. Path 1 == Blender Lab MCP inside Blender **plus** MCP server wiring from a host. Anthropic Blender Connector can be host **(a)**; any configured MCP client can be host **(b)** — Connector is **not standalone**. Path 2 (`ahujasid/blender-mcp`) is out of scope here.

## Operating procedure

1. Verify Path 1 versioning gate.
2. Pick host row.
3. Emit checklist with links to `docs/install/claude-desktop.md` vs other install targets.

## Mode handling

### Text-only mode

References only; no credential paths.

### Runtime-ready mode

Suggest pairing with `official-runtime-readiness-checker`.

### Blocked runtime mode

Still explain host conceptual split.

## Validation checklist

- [ ] Lab add-on mentioned as Blender-side requirement
- [ ] Connector not standalone phrasing present when Connector discussed
- [ ] Host (a)/(b) framing used

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Correct prerequisite ordering |
| Warn | Host version uncertain |
| Fail | Implies Connector installs Blender internals automatically |

## Cross-skill handoff

- Path decision → `../runtime-path-picker/SKILL.md`
- Install depth → `../official-runtime-setup-guide/SKILL.md`
- Bridge confusion → `../runtime-bridge-conflict-resolver/SKILL.md`

## References

- `references/connector-vs-manual-matrix.md`
- `references/lab-addon-reminders.md`
- `references/host-checklist-template.md`
- `../../docs/install/claude-desktop.md`
