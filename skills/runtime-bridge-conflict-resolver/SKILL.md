---
name: runtime-bridge-conflict-resolver
description: Diagnose MCP bridge conflicts (Path 1 Official Blender Lab MCP 5.1+ vs Path 2 mcp-for-blender, port 9876 collisions, host mismatch) and hand off to official-runtime-readiness-checker.
---

# runtime-bridge-conflict-resolver

## Purpose

Resolve the single-bridge constraint when more than one MCP runtime path is configured against the same Blender instance (or when ports collide). Blender accepts only one MCP bridge session per instance (default port 9876) — so running Path 1 (Official Blender Lab MCP 5.1+) and Path 2 (community `mcp-for-blender`, renamed from `ahujasid/blender-mcp`) concurrently, connecting two MCP clients to one Blender instance, colliding on port 9876, or enabling both Path 1 host (a) and host (b) on one session causes inconsistent signals.

This skill diagnoses the conflict, names the cheapest resolution, and hands off to `official-runtime-readiness-checker` for re-verification.

This skill is BlendOps-specific, driven by the single-bridge constraint described in `docs/runtime-stack-strategy.md`.

## Quick start

- list every active / configured bridge for the target Blender session
- check for port collision (commonly `localhost:9876`)
- identify which path is intended; which is residual
- propose the cheapest disable / port-isolation step
- hand off to `official-runtime-readiness-checker` to re-verify

## When to use

- `official-runtime-readiness-checker` reports inconsistent signals (e.g. host reports connected but tool calls return the wrong tool surface)
- both Path 1 (Official Blender Lab MCP 5.1+) and Path 2 (community `mcp-for-blender`, renamed from `ahujasid/blender-mcp`) add-ons are enabled in the same Blender instance
- two MCP clients are pointing at the same Blender instance (e.g. Claude Desktop with Connector + Cursor with manual MCP)
- Path 1 host (a) and host (b) are both active on a single session
- log or port output shows a collision on default port `9876`

## When not to use

- no readiness signal yet (run `official-runtime-readiness-checker` first)
- no runtime path has been chosen yet (route to `runtime-path-picker`)
- the user wants to switch or set up a path from scratch (route to `official-runtime-setup-guide`)
- the bridge matrix is clean and only one path is active, but smoke tests still fail (route to `blender-troubleshooting`)
- the user explicitly wants both paths configured for separate Blender instances on different ports (requires explicit port isolation)

## Trigger phrases

- "tool surface looks wrong"
- "smoke test passed yesterday but recipe fails today"
- "Lab MCP and ahujasid both installed"
- "Claude Desktop and Cursor both pointing at Blender"
- "port 9876 already in use"
- "single-bridge constraint violation"

## Prerequisites / readiness

- list of configured MCP servers per client (`mcpServers` in client config files and host toggles)
- list of installed and enabled Blender add-ons inside Blender (Official Blender Lab MCP 5.1+ add-on and community `mcp-for-blender`, renamed from `ahujasid/blender-mcp`)
- log or port output if available (checking default port `9876`)
- no Blender execution required from this skill

## Input schema

### Required inputs

- target Blender instance (binary path or running session identifier)
- list of MCP clients and host options currently configured to talk to that Blender instance
- list of Blender-side add-ons currently enabled (Path 1 Official Blender Lab MCP 5.1+ add-on / Path 2 community `mcp-for-blender`, renamed from `ahujasid/blender-mcp`)

### Optional inputs

- recent `official-runtime-readiness-checker` report
- recent smoke test record
- port usage output (around default port `9876`)

### Assumptions to confirm

- the operator can disable residual add-ons, update configs, or change ports manually
- only one bridge session is intended per Blender instance (or explicit port isolation across separate instances)
- truth states are unchanged by diagnosis and downgrade-only (never upgrade):
  - Runtime: `Not Run | Attempted | Produced | Verified | Failed`
  - Artifacts: `Not Run | Not Produced | Produced | Verified | Failed` (default `Not Produced`)

## Output schema

### Primary output

- conflict diagnosis: which paths/hosts are present, which path is intended, and which bridges are residual
- cheapest resolution step (propose disabling residual add-on, unregistering extra MCP client/host option, or isolating ports)
- post-resolution verification handoff to `official-runtime-readiness-checker`

### Secondary output

- per-bridge state matrix
- explicit "do not run X concurrently with Y" reminders

### Evidence / caveat output

- runtime status: unchanged by diagnosis (`Not Run | Attempted | Produced | Verified | Failed`; downgrade-only, never upgrade)
- artifact status: unchanged by diagnosis (`Not Run | Not Produced | Produced | Verified | Failed`, default `Not Produced`; downgrade-only, never upgrade)
- explicit note that resolution requires operator action; this skill only diagnoses and plans, and never executes

## Required laws

- ../../laws/official-runtime-only.md
- ../../laws/evidence-before-done.md
- ../../laws/no-arbitrary-python-interface.md
- ../../laws/non-blender-user-language.md

## Official runtime boundary

This skill never disables add-ons, edits MCP client configs, changes ports, kills processes, or runs Blender. It only diagnoses the conflict, proposes the cheapest resolution for the operator to perform, and hands off to `official-runtime-readiness-checker`.

## Operating procedure

1. Build the bridge state matrix:
   - For each MCP client and host option (e.g. Path 1 host (a) Anthropic Connector, Path 1 host (b) manual MCP, Cursor, Claude Code, etc.), record whether it is registered for the target Blender instance.
   - For the Blender side, record whether Path 1 (Official Blender Lab MCP 5.1+) add-on is enabled and whether Path 2 (community `mcp-for-blender`, renamed from `ahujasid/blender-mcp`) add-on is enabled.
   - Record configured ports (default port `9876`) if known.
2. Identify the intended path from the user, brief, `runtime-path-picker`, or `official-runtime-readiness-checker`.
3. Identify residual / unintended bridges:
   - Both Path 1 (Official Blender Lab MCP 5.1+) and Path 2 (`mcp-for-blender`) add-ons enabled -> conflict.
   - Two MCP clients pointing at the same Blender instance -> conflict.
   - Port collision on default port `9876` (or another shared port) -> conflict.
   - Path 1 host (a) and host (b) both enabled on one session -> conflict.
4. Propose the cheapest fix for the operator:
   - If only Path 1 (Official Blender Lab MCP 5.1+) is intended: propose disabling the Path 2 (`mcp-for-blender`) add-on in Blender, removing the Path 2 server entry from the MCP client config, and restarting the client.
   - If only Path 2 (`mcp-for-blender`, renamed from `ahujasid/blender-mcp`) is intended: propose disabling the Official Blender Lab MCP 5.1+ add-on in Blender, disabling Path 1 host (a)/(b) entries, and restarting the client.
   - If Path 1 host (a) and host (b) are both active: propose disabling one host option so only one remains active for the session.
   - If both paths are wanted across separate Blender instances: propose explicit port isolation, separate Blender processes, and separate client configs.
5. State explicit `do-not` reminders for the operator.
6. Hand off to `official-runtime-readiness-checker` to re-verify that only the single intended bridge is active.

## Decision tree

- Both Path 1 (Official Blender Lab MCP 5.1+) and Path 2 (`mcp-for-blender`) add-ons enabled -> confirm intended path (or route to `runtime-path-picker` if undecided); propose disabling the residual add-on and server entry.
- Two MCP clients configured for the same Blender instance -> confirm which client is the working session; propose unregistering the other client for this instance.
- Two bridges colliding on `localhost:9876` -> propose moving one server to a different port and updating its client config to match.
- Path 1 host (a) + Path 1 host (b) both enabled on one session -> propose keeping only one Path 1 host option per session.
- User wants to switch paths or perform a fresh path setup -> route to `official-runtime-setup-guide`.
- Matrix is completely clean (single bridge, no port or host conflict) but smoke tests still fail -> route to `blender-troubleshooting`.

## Playbooks

- Playbook A: "Path 1 + Path 2 both installed" — disable the unintended path's Blender-side add-on first, then unregister its MCP server.
- Playbook B: "Two MCP clients" — pick one client per Blender session; unregister the other from this Blender (its config can stay for other Blender instances).
- Playbook C: "Port collision" — change one server's port; update that client's config to match.
- Playbook D: "Path 1 host (a) Anthropic Connector + Path 1 host (b) manual MCP both ON" — pick one host per session per `docs/runtime-stack-strategy.md`.

## Mode handling

### Text-only mode

- diagnosis only, no execution
- runtime status unchanged
- artifact status unchanged

### Runtime-ready mode

- diagnose + propose + hand off; this skill never executes the resolution

### Blocked runtime mode

- still useful: even when blocked, the conflict can be diagnosed from configs
- mark resolution proposal as text-only

## Validation checklist

- [ ] bridge state matrix built (all clients/hosts + both Blender-side add-ons)
- [ ] intended path identified explicitly
- [ ] residual / unintended bridges named
- [ ] port collisions checked around default port `9876` (or marked unknown if no log access)
- [ ] cheapest resolution proposed
- [ ] explicit "do-not" reminders provided for the operator
- [ ] truth states kept unchanged (downgrade-only rule respected; default artifact state `Not Produced`)
- [ ] no execution claimed by this skill
- [ ] handoff to `official-runtime-readiness-checker` named

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| State matrix | Complete | Partial with note | Missing |
| Intended path | Explicit | Inferred without confirmation | Not identified |
| Residual identified | Named with reason | Named without reason | Not named |
| Port check | Done or marked unknown | Done partially | Skipped |
| Resolution proposal | Cheapest step + rationale | Step without rationale | None |
| Execution claim | None | None | Claimed disabled / changed config from this skill |

## Failure handling

- Operator cannot access Blender's add-on list: ask them to inspect Blender Preferences -> Add-ons; meanwhile mark Blender-side state `Unknown`.
- Operator cannot access MCP client configs: ask for the client config contents; meanwhile mark client-side state `Unknown`.
- Operator is unsure which runtime path should be used: route to `runtime-path-picker` to select the path (or `official-runtime-setup-guide` if setting up a new path), then verify via `official-runtime-readiness-checker`.

## Troubleshooting

- If the matrix indicates only Path 1 (Official Blender Lab MCP 5.1+) is active but `official-runtime-readiness-checker` still reports inconsistent signals or a mismatched tool surface -> re-check hidden client configs and port `9876` bindings, then hand off to `official-runtime-readiness-checker` to re-verify.
- If the matrix is confirmed clean (single bridge, single client/host, no port collision) but smoke tests still fail -> route to `blender-troubleshooting`.

## Best practices

- Diagnose the complete bridge matrix before proposing a fix.
- Include explicit `do-not` reminders to prevent re-introducing residual bridges.
- Always hand off to `official-runtime-readiness-checker` for re-verification; never claim a resolution was executed or verified by this skill.

## Good examples

- "Bridge matrix: Path 1 (Official Blender Lab MCP 5.1+) add-on enabled in Blender, Path 2 (`mcp-for-blender`, renamed from `ahujasid/blender-mcp`) add-on also enabled in Blender; Claude Desktop has Path 1 host (a) Anthropic Connector ON and Path 1/Path 2 manual `mcpServers.blender` configured on port 9876. Conflict: both Path 1 and Path 2 add-ons enabled + two host configs targeting one Blender instance. Intended path (per `runtime-path-picker`): Path 1 host (a). Cheapest fix: disable the `mcp-for-blender` add-on inside Blender, remove the manual `mcpServers.blender` entry, and restart Claude Desktop. Do-not: enable both Path 1 and Path 2 add-ons or both host (a) and (b) on the same Blender session. Truth states: Runtime and Artifact status unchanged (default Artifact status `Not Produced`). Handoff: `official-runtime-readiness-checker`."

## Bad examples

- "Both look configured, just try restarting" (no matrix, no intended path, no resolution rationale, no do-not reminder, no handoff).

## User-facing response template

- Bridge state matrix (markdown table)
- Intended path (explicit)
- Conflicts found
- Cheapest resolution step
- Do-not reminders
- Handoff: `official-runtime-readiness-checker`

## Anti-patterns

- proposing a fix without building the matrix
- executing the fix from this skill
- ignoring port collisions
- treating Anthropic Connector and manual MCP as if they were independent paths (they are both Path 1 host options; pick one)

## Cross-skill handoff

- When `official-runtime-readiness-checker` reports inconsistent signals: enter this skill (`runtime-bridge-conflict-resolver`) to resolve the conflict
- After proposing a conflict resolution: hand off to `official-runtime-readiness-checker` to re-verify
- If the bridge matrix is clean but failures persist: hand off to `blender-troubleshooting`
- If the user wants to change paths or set up a path: hand off to `official-runtime-setup-guide`
- If the intended runtime path has not been chosen yet: hand off to `runtime-path-picker`

## Non-goals

- Disabling add-ons, editing MCP client configs, changing ports, killing processes, or running Blender
- Upgrading Runtime or Artifact truth states
- Replacing `official-runtime-readiness-checker`, `runtime-path-picker`, `official-runtime-setup-guide`, or `blender-troubleshooting`

## References

- BlendOps doc: ../../docs/runtime-stack-strategy.md (Single-bridge constraint)
- BlendOps doc: ../../docs/external-runtime-setup.md
- BlendOps doc: ../../docs/unofficial-runtime-bridges.md
- Skill system: ../../docs/skill-system.md
