# setting-up-blender-runtime — EVAL

Behavioral evaluation prompts for `setting-up-blender-runtime`. Sections below come from the skills merged into it in v2.0.0.

## From former `setting-up-blender-runtime`

### Text-only eval prompt
Use setting-up-blender-runtime to produce readiness matrix and final status (Ready/Partially Ready/Blocked/Unknown) without running Blender scene operations.

### Expected behavior
- readiness checks with evidence
- confidence label per check
- conservative final status

### Pass / Warn / Fail criteria
- Pass: matrix complete + evidence-aligned status
- Warn: partial evidence with explicit caveat
- Fail: readiness claim without evidence

### Common failure modes
- confusing readiness with execution success
- missing blocker details

### Evidence expectations
- check table with evidence lines
- final status rationale
- blocker list when not ready

### Sample passing response outline
- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

### Sample failing response outline
- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action

## From former `setting-up-blender-runtime`

### Text-only eval prompt
Use setting-up-blender-runtime to determine official runtime options and confidence labels for this workspace. Do not run Blender.

### Expected behavior
- outputs official runtime hierarchy
- includes confidence labels
- avoids runtime success claims

### Pass / Warn / Fail criteria
- Pass: official refs + confidence + safe boundary
- Warn: partial confidence labels, no overclaims
- Fail: non-official runtime path or runtime claim without evidence

### Common failure modes
- guessing setup commands
- mixing install and runtime execution claims

### Evidence expectations
- reference links listed
- confidence labels present
- explicit Not Run runtime state when applicable

### Sample passing response outline
- Scope and mode stated clearly
- Evidence expectations listed
- Pass/warn/fail reasoning tied to checks

### Sample failing response outline
- Overclaims runtime/artifact success
- Missing caveats or blocker details
- No clear next action

## From former `setting-up-blender-runtime`

### Text-only eval prompt

User has Blender 4.2 LTS, wants MCP steering from Cursor. Pick path.

### Expected behavior

- Path 1 unavailable (needs Blender 5.1+ for Lab add-on); explain succinctly
- Path 2 likely fit if user accepts community bridge caveats
- CLI appendix optional note for batch exports only
- Hand off to setup guide + unofficial bridges doc awareness

### Pass / Warn / Fail criteria

- Pass: primary path + version gating explained
- Warn: user vague on headless vs interactive — ask one clarifier
- Fail: recommends Path 1 without 5.1+ guard

### Sample passing response outline

- Conditional matrix + pick

### Sample failing response outline

- "Install Connector" for Blender 4.2 without caveat

## From former `setting-up-blender-runtime`

### Text-only eval prompt

User has Claude Desktop and wants Path 1. Outline hosts.

### Expected behavior

- State Blender Lab MCP add-on inside Blender 5.1+ first
- Describe Connector as hosting Path 1 after Blender-side steps
- Mention manual MCP alternative for other agents
- Link-style pointer to install doc

### Pass / Warn / Fail criteria

- Pass: ordering + (a)/(b) hosts
- Warn: OS unknown — note verify paths
- Fail: Connector-only narrative

### Sample passing response outline

- Numbered Blender-side vs host-side

### Sample failing response outline

- "Enable Connector and you're done"

## From former `setting-up-blender-runtime`

Status: 1.0.0 text-only baseline  
Scope: diagnose single-bridge constraint conflicts and propose resolutions; no execution.

### Text-only eval prompt

Use setting-up-blender-runtime to build a bridge state matrix, identify the intended path, name residual bridges, and propose the cheapest resolution. Do not disable add-ons, edit configs, change ports, or run Blender from this skill.

### Expected behavior

- builds a complete bridge state matrix (every MCP client + Blender-side add-ons)
- identifies the intended runtime path explicitly (from brief / readiness checker / user)
- names residual / unintended bridges with reasons
- checks for port collision (or marks unknown if no log access)
- proposes the cheapest resolution step + rationale
- includes explicit "do-not" reminders for the operator
- hands off to `setting-up-blender-runtime` for re-verification
- never executes the resolution

### Eval cases

| Case | Input | Expected output | Required evidence |
|---|---|---|---|
| Path 1 + Path 2 both installed | Lab MCP add-on AND `mcp-for-blender` `addon.py` both enabled in Blender | Conflict diagnosis; cheapest fix = disable unintended; do-not reminder; handoff | matrix, intended path, fix, reminder, handoff |
| Two MCP clients pointing at same Blender | Claude Desktop Connector ON + Cursor with manual `uvx mcp-for-blender` | Conflict diagnosis; pick one client per session; unregister other from this Blender | matrix, single-client decision, fix |
| Port collision | Lab MCP server + community server both on `localhost:9876` | Diagnose port collision; change one server's port; update its client config | matrix, port reasoning, port change proposal |
| Anthropic Connector + manual mcpServers Lab MCP both ON | Claude Desktop has Connector toggle + manual `mcpServers.blender` Lab entry | Diagnose: both are Path 1 host options targeting same Lab stack; pick one host per session | matrix, host decision, do-not reminder |
| Matrix clean but smoke fails | Single intended path, single client, no port collision; smoke still fails | Route to `troubleshooting-blender-output` | clean matrix, route to troubleshooting |
| No log access for ports | Operator doesn't have netstat output | Mark port check `Unknown`; proceed with config-based diagnosis | unknown port marker, partial diagnosis |
| Operator wants both paths on different Blender instances | Two Blender processes, two ports | Explicit port isolation plan + separate processes; matrix verifies isolation | isolation plan, matrix verifies |

### Expected evidence/status fields

| Field | Required content |
|---|---|
| Bridge state matrix | Per-client + per-Blender-add-on table |
| Intended path | Path 1 host a/b / Path 2 / CLI fallback / text-only |
| Residual bridges | Named with reason |
| Port collision | Pass / Fail / Unknown with note |
| Resolution proposal | Cheapest step + rationale |
| Do-not reminders | Explicit list |
| Handoff target | `setting-up-blender-runtime` (or `troubleshooting-blender-output` if matrix clean) |
| Runtime status | Unchanged by this skill |
| Artifact status | Unchanged by this skill |

### Pass / Warn / Fail criteria

- Pass: matrix complete, intended path explicit, residual named with reason, port checked or marked unknown, resolution + rationale, do-not reminders, handoff named
- Warn: matrix partial with notes, OR intended path inferred without confirmation, OR resolution missing rationale
- Fail: no matrix, OR intended path not identified, OR claimed resolution executed by this skill, OR ignored port collision

### Common failure modes

- proposing a fix without the matrix ("just try restarting")
- treating Anthropic Connector and manual MCP as separate paths (both are Path 1 host options)
- skipping port check
- claiming the fix worked from this skill (only readiness checker can verify)
- forgetting do-not reminders so operator re-enables the conflict next session

### Evidence expectations

- markdown matrix visible
- intended path quoted
- conflict reasoning explicit per residual bridge
- resolution rationale text-explicit
- do-not reminder list
- handoff line

### Sample passing response outline

- Bridge state matrix (markdown)
- Intended path: Path 1 host (a) Anthropic Connector
- Conflicts: Lab add-on + ahujasid `addon.py` both enabled; manual `mcpServers.blender` redundant
- Cheapest fix: disable ahujasid `addon.py`; remove manual entry; restart Claude Desktop
- Do-not: keep both Blender-side add-ons enabled simultaneously
- Handoff: `setting-up-blender-runtime`

### Sample failing response outline

- "Just looks misconfigured, restart everything" (no matrix, no intended path, no rationale)
- Claimed "I disabled the addon" (this skill cannot execute)
- Skipped port check entirely

## From former `setting-up-blender-runtime`

### Text-only eval prompt

CI must nightly export GLBs from `.blend` files on Linux agents without MCP. Outline job.

### Expected behavior

- CLI appendix framing + first-class upstream mention + link to the [scoped mech-prop CLI eval](https://github.com/ThanhNguyxnOrg/blendops/blob/main/docs/evals/cli-fallback-mech-prop.md) without implying verification of the current run
- Phases: background startup, load file, export, verify output path logging
- Stateless limits noted
- Hand off to verifying-before-handoff for ledger expectations

### Pass / Warn / Fail criteria

- Pass: phases + hook points + doc pointer
- Warn: GPU ambiguity
- Fail: drops evidence discipline

### Sample passing response outline

- Numbered phases + caution banner

### Sample failing response outline

- Paste 200-line script as "the solution"
