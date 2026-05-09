# runtime-bridge-conflict-resolver (reference summary)

## Purpose
Diagnose and propose resolutions for Single-bridge constraint conflicts (Path 1 Lab MCP + Path 2 community `ahujasid/blender-mcp` running together, port `9876` collisions, two MCP clients targeting same Blender). BlendOps-specific.

## When to use
- readiness checker reports inconsistent signals (e.g. host says connected but tool surface is wrong path)
- both Blender-side add-ons enabled (Lab MCP + ahujasid `addon.py`)
- two MCP clients pointing at same Blender
- recipe fails despite recent smoke pass
- log shows port collision around `localhost:9876`

## When not to use
- no readiness signal yet (run readiness checker first)
- only one path is configured cleanly
- user wants explicit port isolation across separate Blender instances

## Output/evidence contract
Bridge state matrix (every MCP client + Blender-side add-on), intended path identified explicitly, residual / unintended bridges named with reasons, port-collision check, cheapest resolution step + rationale, explicit "do-not" reminders. This skill diagnoses; the operator executes.

## Handoff notes
After resolution proposal: `official-runtime-readiness-checker` for re-verification. If matrix is clean but smoke still fails: `blender-troubleshooting`. If user wants to switch paths entirely: `official-runtime-setup-guide`.
