# EVAL — runtime-bridge-conflict-resolver

Status: Draft v0 text-only baseline  
Scope: diagnose single-bridge constraint conflicts and propose resolutions; no execution.

## Text-only eval prompt

Use runtime-bridge-conflict-resolver to build a bridge state matrix, identify the intended path, name residual bridges, and propose the cheapest resolution. Do not disable add-ons, edit configs, change ports, or run Blender from this skill.

## Expected behavior

- builds a complete bridge state matrix (every MCP client + Blender-side add-ons)
- identifies the intended runtime path explicitly (from brief / readiness checker / user)
- names residual / unintended bridges with reasons
- checks for port collision (or marks unknown if no log access)
- proposes the cheapest resolution step + rationale
- includes explicit "do-not" reminders for the operator
- hands off to `official-runtime-readiness-checker` for re-verification
- never executes the resolution

## Eval cases

| Case | Input | Expected output | Required evidence |
|---|---|---|---|
| Path 1 + Path 2 both installed | Lab MCP add-on AND `ahujasid/blender-mcp` `addon.py` both enabled in Blender | Conflict diagnosis; cheapest fix = disable unintended; do-not reminder; handoff | matrix, intended path, fix, reminder, handoff |
| Two MCP clients pointing at same Blender | Claude Desktop Connector ON + Cursor with manual `uvx blender-mcp` | Conflict diagnosis; pick one client per session; unregister other from this Blender | matrix, single-client decision, fix |
| Port collision | Lab MCP server + community server both on `localhost:9876` | Diagnose port collision; change one server's port; update its client config | matrix, port reasoning, port change proposal |
| Anthropic Connector + manual mcpServers Lab MCP both ON | Claude Desktop has Connector toggle + manual `mcpServers.blender` Lab entry | Diagnose: both are Path 1 host options targeting same Lab stack; pick one host per session | matrix, host decision, do-not reminder |
| Matrix clean but smoke fails | Single intended path, single client, no port collision; smoke still fails | Route to `blender-troubleshooting` | clean matrix, route to troubleshooting |
| No log access for ports | Operator doesn't have netstat output | Mark port check `Unknown`; proceed with config-based diagnosis | unknown port marker, partial diagnosis |
| Operator wants both paths on different Blender instances | Two Blender processes, two ports | Explicit port isolation plan + separate processes; matrix verifies isolation | isolation plan, matrix verifies |

## Expected evidence/status fields

| Field | Required content |
|---|---|
| Bridge state matrix | Per-client + per-Blender-add-on table |
| Intended path | Path 1 host a/b / Path 2 / CLI fallback / text-only |
| Residual bridges | Named with reason |
| Port collision | Pass / Fail / Unknown with note |
| Resolution proposal | Cheapest step + rationale |
| Do-not reminders | Explicit list |
| Handoff target | `official-runtime-readiness-checker` (or `blender-troubleshooting` if matrix clean) |
| Runtime status | Unchanged by this skill |
| Artifact status | Unchanged by this skill |

## Pass / Warn / Fail criteria

- Pass: matrix complete, intended path explicit, residual named with reason, port checked or marked unknown, resolution + rationale, do-not reminders, handoff named
- Warn: matrix partial with notes, OR intended path inferred without confirmation, OR resolution missing rationale
- Fail: no matrix, OR intended path not identified, OR claimed resolution executed by this skill, OR ignored port collision

## Common failure modes

- proposing a fix without the matrix ("just try restarting")
- treating Anthropic Connector and manual MCP as separate paths (both are Path 1 host options)
- skipping port check
- claiming the fix worked from this skill (only readiness checker can verify)
- forgetting do-not reminders so operator re-enables the conflict next session

## Evidence expectations

- markdown matrix visible
- intended path quoted
- conflict reasoning explicit per residual bridge
- resolution rationale text-explicit
- do-not reminder list
- handoff line

## Sample passing response outline

- Bridge state matrix (markdown)
- Intended path: Path 1 host (a) Anthropic Connector
- Conflicts: Lab add-on + ahujasid `addon.py` both enabled; manual `mcpServers.blender` redundant
- Cheapest fix: disable ahujasid `addon.py`; remove manual entry; restart Claude Desktop
- Do-not: keep both Blender-side add-ons enabled simultaneously
- Handoff: `official-runtime-readiness-checker`

## Sample failing response outline

- "Just looks misconfigured, restart everything" (no matrix, no intended path, no rationale)
- Claimed "I disabled the addon" (this skill cannot execute)
- Skipped port check entirely
