# Runtime Option Decision Tree

## Purpose
Establish prerequisite boundaries and select the lowest-risk runtime posture before any execution claim.

## When to use
At the start of any task that may touch Blender — before claiming readiness, recommending a bridge, or scheduling writes.

## Decision tree
1. **Pure planning / brief / web-code handoff only?**
   - Stay planning-only (`Runtime status: Not Run`, `Artifact status: Not Produced`). Do not invent runtime setup work the user did not ask for.
2. **Claude Desktop / Claude.ai UI with Path 1 Connector?**
   - State Path 1 prerequisites explicitly: **Blender 5.1+ + Blender Lab MCP add-on inside Blender** PLUS Connector linkage (never describe Connector as standalone).
3. **IDE / CLI coding agent (Claude Code, Cursor, Codex, OpenCode, Windsurf, Cline, Zed, etc.)?**
   - Recommend project-local BlendOps install + Path 1 host `(b)` manual MCP client (Blender 5.1+ Lab MCP) OR Path 2 `mcp-for-blender` (`3.0+`, community caveats) — never enable both simultaneously.
4. **Uncertain host support or unverified native config path?**
   - Fall back cleanly to `generic-root` adapter guidance with honest `linked-only` confidence label (`docs/adapter-registry.md`).
5. **Runtime execution requested before probes ran?**
   - Hand off to `runtime-path-picker` → `runtime-readiness` first; never assume readiness from installed config files alone.

## Good example
"Target client Cursor uses project-local install; Path 1 host `(b)` selected conditional on Blender 5.1+ + Lab MCP add-on enabled. Runtime readiness not verified yet (`Runtime status: Not Run`)."

## Bad example
"Installed Connector config, so Blender 5.1 runtime is ready to render." (Unverified premise + false readiness claim.)

## Related skill
- [SKILL.md](../SKILL.md)
