---
name: runtime-bridge-conflict-resolver
description: Detect and resolve MCP bridge conflicts (Path 1 Lab MCP + Path 2 ahujasid running together, port 9876 collisions, host mismatch). Use when readiness checker reports inconsistent signals.
---

# runtime-bridge-conflict-resolver

## Purpose

Resolve the single-bridge constraint when more than one MCP runtime path is configured against the same Blender instance (or when ports collide). BlendOps documents that Blender accepts only one MCP bridge session per instance — but both Path 1 (Blender Lab MCP `bpype/blender_mcp`) and Path 2 (community `ahujasid/blender-mcp`) commonly bind to a `localhost:9876` range. If both are configured concurrently, the second connection silently fails and downstream planners get inconsistent signals.

This skill diagnoses the conflict, names the cheapest resolution, and hands off to the readiness checker for re-verification.

This skill is BlendOps-specific (no direct analog in Anthropic Superpowers or BMad), driven by the Single-bridge constraint described in `docs/runtime-stack-strategy.md`.

## Quick start

- list every active / configured bridge for the target Blender session
- check for port collision (commonly `localhost:9876`)
- identify which path is intended; which is residual
- propose the cheapest disable / port-isolation step
- hand off to `official-runtime-readiness-checker` to re-verify

## When to use

- `official-runtime-readiness-checker` reports inconsistent signals (e.g. "MCP host says connected" but tool calls return wrong tool surface)
- you see Lab MCP add-on AND `ahujasid/blender-mcp` `addon.py` both installed in Blender
- two MCP clients are pointing at the same Blender (e.g. Claude Desktop with Connector + Cursor with manual MCP)
- a recipe smoke test fails despite a recent successful read-only smoke
- log shows port collision around `localhost:9876`

## When not to use

- no readiness signal yet (run readiness checker first)
- only one path is configured and working (no conflict to resolve)
- the user explicitly wants both paths configured for separate Blender instances on different ports (note: still requires explicit port isolation)

## Trigger phrases

- "tool surface looks wrong"
- "smoke test passed yesterday but recipe fails today"
- "Lab MCP and ahujasid both installed"
- "Claude Desktop and Cursor both pointing at Blender"
- "port 9876 already in use"
- "single-bridge constraint violation"

## Prerequisites / readiness

- list of configured MCP servers per client (`mcpServers` in client config files)
- list of installed Blender add-ons inside Blender (Lab MCP add-on + `ahujasid/blender-mcp` `addon.py`)
- log / port output if available (`netstat -ano | grep 9876` or equivalent)
- no Blender execution required from this skill

## Input schema

### Required inputs

- target Blender instance (path to `blender` binary or "the running session")
- list of MCP clients that are currently configured to talk to that Blender
- list of Blender-side add-ons currently enabled (Lab MCP / `ahujasid/blender-mcp` `addon.py`)

### Optional inputs

- recent readiness checker report
- recent smoke test record
- port usage output

### Assumptions to confirm

- the operator can disable one path or change ports
- only one path is intended at a time (or explicit port isolation)
- runtime status is one of `Not Run` / `Attempted` / `Blocked`

## Output schema

### Primary output

- conflict diagnosis: which paths are present, which is intended, what's residual
- cheapest resolution step (disable add-on / unregister MCP client / change port)
- post-resolution verification handoff

### Secondary output

- per-bridge state matrix
- explicit "do not run X concurrently with Y" reminders

### Evidence / caveat output

- runtime status: unchanged by this skill (only readiness checker can update)
- artifact status: unchanged
- explicit note that resolution requires operator action; this skill plans, doesn't execute

## Required laws

- ../../laws/official-runtime-only.md
- ../../laws/evidence-before-done.md
- ../../laws/no-arbitrary-python-interface.md
- ../../laws/non-blender-user-language.md

## Official runtime boundary

This skill does not disable add-ons, edit MCP client configs, change ports, kill processes, or run Blender. It diagnoses and proposes a resolution. The operator (or another skill) executes.

## Operating procedure

1. Build the bridge state matrix:
   - For each MCP client (Claude Desktop with Connector, Claude Desktop manual MCP, Claude Code, Cursor, Codex, OpenCode, Cline, Continue, Zed, goose, LM Studio, Open WebUI, Ollama, etc.) record whether it is currently registered for this Blender.
   - For Blender-side: record whether Lab MCP add-on is enabled, and whether `ahujasid/blender-mcp` `addon.py` is enabled.
   - Record ports if known.
2. Identify the intended path from the user / brief / readiness checker.
3. Identify residual / unintended bridges:
   - Both Path 1 add-on AND Path 2 `addon.py` enabled → conflict.
   - Two MCP clients pointing at the same Blender → conflict.
   - Two servers binding the same port → conflict.
4. Propose the cheapest fix:
   - If only Path 1 intended: disable `ahujasid/blender-mcp` addon.py inside Blender; unregister `uvx blender-mcp` from MCP client config; restart MCP client.
   - If only Path 2 intended: disable Lab MCP add-on inside Blender; if Anthropic Connector is on, also disable that toggle; restart Claude Desktop.
   - If both wanted on different Blender instances: explicit port isolation, separate Blender processes, separate workspaces.
5. State explicit `do-not` reminders for the operator.
6. Hand off to `official-runtime-readiness-checker` to re-verify the single intended path is the only active one.

## Decision tree

- both Path 1 and Path 2 add-ons enabled → ask user which is intended; disable the other.
- two MCP clients configured for the same Blender → ask which is the working session; unregister the other.
- two servers on `localhost:9876` → change one to a different port (e.g. 9877) AND update its MCP client config to match.
- Anthropic Connector toggle ON + manual `mcpServers` JSON entry for Lab MCP → these are both Path 1 host options targeting the same Lab stack. Pick one host option per session (per `runtime-stack-strategy.md`).
- everything looks clean but smoke still fails → route to `blender-troubleshooting`.

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

- [ ] bridge state matrix built (all clients + both Blender-side add-ons)
- [ ] intended path identified explicitly
- [ ] residual / unintended bridges named
- [ ] port collisions checked (or marked unknown if no log access)
- [ ] cheapest resolution proposed
- [ ] explicit "do-not" reminders for the operator
- [ ] no execution claimed by this skill
- [ ] handoff to readiness checker named

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

- operator can't access Blender's add-on list: ask them to check Edit → Preferences → Add-ons; meanwhile mark Blender-side state `Unknown`.
- operator can't access MCP client configs: ask for paths (Settings → Developer → Edit Config in Claude Desktop, etc.); meanwhile mark client-side state `Unknown`.
- operator unsure which path is intended: route to readiness checker to gather one passing read-only smoke first.

## Troubleshooting

- if matrix says only Path 1 active but tool surface is Path 2 (`get_scene_info`) → readiness signal is wrong; re-run smoke with explicit tool name list before any resolution.
- if matrix is clean but smoke still fails → route to `blender-troubleshooting`.

## Best practices

- diagnose before proposing
- explicit do-not reminders prevent re-introduction
- hand off to readiness checker; never claim resolution worked from this skill

## Good examples

- "Bridge matrix: Lab MCP add-on enabled (Blender), `ahujasid/blender-mcp` `addon.py` also enabled (Blender), Claude Desktop has Anthropic Connector ON, Claude Desktop also has `mcpServers.blender = uvx blender-mcp`. Conflict: 2 Blender-side bridges + 2 host options (a) and (b) both targeting Path 1 + Path 2 mixed. Intended (per brief): Path 1 host (a) Anthropic Connector. Cheapest fix: disable `ahujasid/blender-mcp` `addon.py` inside Blender; remove the manual `mcpServers.blender` entry; restart Claude Desktop. Do-not: keep both Blender-side add-ons enabled at once. Handoff: `official-runtime-readiness-checker`."

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

- After resolution proposal: `official-runtime-readiness-checker` to re-verify
- If matrix is clean but smoke still fails: `blender-troubleshooting`
- If user wants to change paths entirely: `official-runtime-setup-guide`

## Non-goals

- executing the resolution (operator does that)
- running Blender
- editing MCP client configs from this skill
- replacing readiness checker

## References

- BlendOps doc: ../../docs/runtime-stack-strategy.md (Single-bridge constraint)
- BlendOps doc: ../../docs/external-runtime-setup.md
- BlendOps doc: ../../docs/unofficial-runtime-bridges.md
- Skill system: ../../docs/skill-system.md
