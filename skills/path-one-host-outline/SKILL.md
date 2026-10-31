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
<!-- blendops:generated:start exclusions -->
- choosing between Path 1, Path 2, or CLI → use `../runtime-path-picker/SKILL.md` (Delegates out-of-scope requests to runtime-path-picker)
- step-by-step host or add-on installation and configuration → use `../official-runtime-setup-guide/SKILL.md` (Delegates out-of-scope requests to official-runtime-setup-guide)
- probing live runtime readiness → use `../official-runtime-readiness-checker/SKILL.md` (Delegates out-of-scope requests to official-runtime-readiness-checker)
- resolving conflicts between official and unofficial bridges → use `../runtime-bridge-conflict-resolver/SKILL.md` (Delegates out-of-scope requests to runtime-bridge-conflict-resolver)
- Path 2 community bridge specifics → use `../runtime-path-picker/SKILL.md` (Delegates out-of-scope requests to runtime-path-picker)
- CLI appendix job outlining → use `../cli-appendix-job-outline/SKILL.md` (Delegates out-of-scope requests to cli-appendix-job-outline)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "Connector vs Cursor MCP"
- "how do I host Lab MCP"
- "Claude Desktop Connector vs manual MCP client"
- "what hosts work with Path 1"
<!-- blendops:generated:end triggers -->

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
Artifact status: Not Produced | Produced | Verified | Failed (default: Not Produced)
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

## Decision tree

```txt
Is the user still deciding between Path 1 (Lab MCP), Path 2 (`mcp-for-blender`), or the CLI appendix?
  Yes → stop and route to runtime-path-picker
  No (Path 1 selected) → continue
Can the target environment run Blender 5.1+ (`blender_version_min = "5.1.0"`) with the Lab MCP add-on installed inside Blender?
  No → Path 1 is not viable; route back to runtime-path-picker for Path 2 (`Blender 3.0+`) or CLI appendix evaluation
  Yes → continue
Which Path 1 host surface is the user targeting (`references/connector-vs-manual-matrix.md`)?
  Host (a) Claude Desktop with Anthropic Blender Connector →
    1. Require Blender 5.1+ and Lab MCP add-on inside Blender first
    2. State explicitly that the Anthropic Connector is NEVER standalone
    3. Point to `docs/install/claude-desktop.md` and `official-runtime-setup-guide`
  Host (b) Manually configured MCP client (Cursor, Claude Code, Codex, OpenCode, Zed, Windsurf, etc.) →
    1. Require Blender 5.1+ and Lab MCP add-on inside Blender first
    2. Outline host MCP server entry pointing at the Blender Lab MCP server
    3. Point to `docs/external-runtime-setup.md`, `docs/install/<target>.md`, and `official-runtime-setup-guide`
  Host unknown / comparing both →
    Emit side-by-side Host (a) vs Host (b) outline sharing the mandatory Blender 5.1+ Lab add-on invariant
```

## Playbooks

### Playbook A: Claude Desktop user asking how the Anthropic Connector works (`Host (a)`)

- Lead with the shared Path 1 invariant from `references/lab-addon-reminders.md`: **Blender 5.1+** (`blender_version_min = "5.1.0"`) and the **Official Blender Lab MCP add-on** inside Blender must be installed and enabled first.
- Explain that **Host (a)** (Anthropic Connector in Claude Desktop) is a host-side convenience layer that attaches to the Lab MCP add-on after Blender-side setup — the Connector is **never standalone**.
- Emit the 5-step outline from `references/host-checklist-template.md` and route step-by-step installation to `../official-runtime-setup-guide/SKILL.md`.

### Playbook B: Coding agent user (Cursor, Claude Code, Codex, OpenCode) on Path 1 (`Host (b)`)

- Confirm the **Blender 5.1+** and Blender-side **Lab MCP add-on** prerequisite (`references/connector-vs-manual-matrix.md`).
- Outline **Host (b)**: the coding agent acts as a manually configured MCP client connecting to the Lab MCP server surface exposed by Blender 5.1+, with no Anthropic Connector involved.
- Remind the user of the single-bridge rule (do not attach Path 2 `mcp-for-blender` to the same Blender instance on port `9876`) and point to `../../docs/install/claude-desktop.md` or the target agent's install doc.

### Playbook C: Side-by-side comparison of Host (a) vs Host (b)

- Present the comparison table from `references/connector-vs-manual-matrix.md` showing what stays identical inside Blender 5.1+ (the Lab MCP add-on and single-bridge rule) vs what changes on the host (Connector UI linkage in Claude Desktop vs MCP client config in other agents).
- Keep `Runtime status: Not Run` and `Artifact status: Not Produced`.

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

## Failure handling

- If the user's environment is pinned below **Blender 5.1** (for example, Blender 4.2 LTS or 3.6 LTS), state clearly that Path 1 (both Host (a) and Host (b)) is unavailable because the Lab MCP add-on requires `blender_version_min = "5.1.0"`, and route to `../runtime-path-picker/SKILL.md`.
- If the user asks this skill to write live MCP client JSON configs, edit system credential files, or execute Blender, decline and route setup execution to `../official-runtime-setup-guide/SKILL.md`.
- If both Path 1 Lab MCP and Path 2 `mcp-for-blender` (formerly `ahujasid/blender-mcp`) are active on the same Blender instance, route immediately to `../runtime-bridge-conflict-resolver/SKILL.md`.
- Preserve downgrade-only truth states (`Runtime status: Not Run`, `Artifact status: Not Produced`).

## Troubleshooting

| Symptom | Cause | Safe resolution |
|---|---|---|
| User enabled Anthropic Connector in Claude Desktop but nothing connects | Lab MCP add-on was never installed/enabled inside Blender 5.1+ (Anthropic tutorial step 2 skipped) | Reiterate that the Anthropic Connector is **never standalone**; require installing and enabling the Lab MCP add-on inside Blender 5.1+ first, then route to `../official-runtime-setup-guide/SKILL.md`. |
| User cites Anthropic tutorial prerequisite "Blender 4.2 or later" for Path 1 | Upstream tutorial text lags the Lab add-on manifest floor | Explain that the binding floor in the Lab MCP add-on manifest is `blender_version_min = "5.1.0"` (**Blender 5.1+**), which governs both Host (a) and Host (b). |
| User confuses Path 1 Host (b) with Path 2 `mcp-for-blender` | Both use manual MCP client configuration in coding agents | Clarify that Path 1 Host (b) connects to the official Blender Lab MCP add-on in Blender 5.1+, whereas Path 2 connects to the third-party `mcp-for-blender` (`ahujasid/blender-mcp`) add-on (`../../docs/unofficial-runtime-bridges.md`). |

## Best practices

- Always state the Blender-side prerequisite (**Blender 5.1+** + **Lab MCP add-on** inside Blender) **before** describing either Host (a) or Host (b).
- Include the explicit reminder that **the Anthropic Connector is never standalone** whenever Host (a) or Claude Desktop is mentioned.
- Cite the community Path 2 bridge as `mcp-for-blender` (formerly `ahujasid/blender-mcp`), never bare `blender-mcp`.
- Keep this skill strictly at the architectural outline level and hand off step-by-step installation to `../official-runtime-setup-guide/SKILL.md` and live checks to `../official-runtime-readiness-checker/SKILL.md`.

## Good examples

- "For Path 1 on Claude Desktop (**Host (a)**): 1) Install **Blender 5.1+** (`blender_version_min = \"5.1.0\"`). 2) Install and enable the **Official Blender Lab MCP add-on** inside Blender. 3) Connect the Anthropic Blender Connector in Claude Desktop — the Connector is **never standalone** and depends on the Lab add-on running inside Blender 5.1+. `Runtime status: Not Run`. `Artifact status: Not Produced`."
- "For Path 1 in Cursor or Claude Code (**Host (b)**): Both Host (a) and Host (b) require the **Lab MCP add-on inside Blender 5.1+**. On the host side, configure your agent's manual MCP client to point at the Lab MCP server and ensure no Path 2 (`mcp-for-blender`, formerly `ahujasid/blender-mcp`) bridge is attached to the same Blender instance. Hand off to `../official-runtime-setup-guide/SKILL.md`."

## Bad examples

- "In Claude Desktop, just toggle on the Anthropic Blender Connector — no Blender add-on installation is needed." — false standalone Connector claim.
- "Use Host (b) manual MCP client to run Path 1 on Blender 4.2 LTS." — violates the binding Blender 5.1+ floor (`blender_version_min = "5.1.0"`) for Path 1.
- "Path 1 Host (b) uses `blender-mcp`." — confuses Path 1 with Path 2 and uses the ambiguous bare name `blender-mcp`.

## User-facing response template

```txt
Path 1 host outline: <Host (a) Anthropic Connector in Claude Desktop | Host (b) Manual MCP client | (a) vs (b) comparison>
Mandatory Path 1 prerequisite: Both Host (a) and Host (b) require Blender 5.1+ (`blender_version_min = "5.1.0"`) with the Official Blender Lab MCP add-on installed and enabled inside Blender. The Anthropic Connector is never standalone.

Component split:
1. Blender-side (shared by (a) and (b)): <Blender 5.1+ + Lab MCP add-on enabled + single-bridge check on port 9876>
2. Host-side wiring: <Host (a) Anthropic Connector linkage after step 1 | Host (b) manual MCP client server entry>

Blockers: <none or version/host constraints>
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <docs/runtime-stack-strategy.md, docs/install/claude-desktop.md, skill references>
Limitations: <outline only — does not configure hosts or run Blender>
Next skill: <official-runtime-setup-guide | official-runtime-readiness-checker | runtime-path-picker>
```

## Anti-patterns

- Describing the Anthropic Blender Connector as standalone or implying it works without installing the Lab MCP add-on inside Blender 5.1+.
- Claiming Path 1 Host (b) bypasses the **Blender 5.1+** floor (`blender_version_min = "5.1.0"`).
- Referring to the former Path 2 repository as bare `blender-mcp` instead of `mcp-for-blender` (`ahujasid/blender-mcp`).
- Writing `Artifact status: Not Run` or upgrading `Runtime status` / `Artifact status` from a host outline.
- Turning a conceptual host outline into live configuration execution or Python scripts.

## Cross-skill handoff
<!-- blendops:generated:start handoffs -->
- [upstream_reference] Path selection → `../runtime-path-picker/SKILL.md`
- [upstream_reference] Detailed setup and configuration → `../official-runtime-setup-guide/SKILL.md`
- [progression] Readiness probing → `../official-runtime-readiness-checker/SKILL.md`
- [fallback] Bridge conflicts → `../runtime-bridge-conflict-resolver/SKILL.md`
- [progression] CLI appendix workflows → `../cli-appendix-job-outline/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Choosing between Path 1, Path 2, and the CLI appendix (owned by `../runtime-path-picker/SKILL.md`).
- Performing step-by-step installation or editing host MCP configuration files (owned by `../official-runtime-setup-guide/SKILL.md`).
- Probing whether a live Blender MCP session is currently connected (owned by `../official-runtime-readiness-checker/SKILL.md`).
- Documenting Path 2 community bridge internals or headless CLI batch scripts.

## References

- `references/connector-vs-manual-matrix.md`
- `references/lab-addon-reminders.md`
- `references/host-checklist-template.md`
- `../../docs/install/claude-desktop.md`
