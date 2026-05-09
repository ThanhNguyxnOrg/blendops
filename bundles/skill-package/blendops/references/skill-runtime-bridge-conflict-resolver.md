# runtime-bridge-conflict-resolver

Purpose: detect and resolve Single-bridge constraint conflicts (Path 1 Lab MCP + Path 2 community `ahujasid/blender-mcp` running together, port `9876` collisions, host mismatch). BlendOps-specific.

Use when readiness checker reports inconsistent signals, both Blender-side add-ons are enabled, two MCP clients point at the same Blender, or a recent smoke pass is followed by recipe failure. Skip if no readiness signal yet (run readiness checker first) or if only one path is configured cleanly.

Output contract: bridge state matrix (every MCP client + Blender-side add-on), intended path identified explicitly, residual / unintended bridges named, port-collision check (or marked unknown), cheapest resolution step + rationale, explicit "do-not" reminders, handoff to `official-runtime-readiness-checker` for re-verification. This skill diagnoses; the operator executes the fix.
