# Blocker Report Template — Runtime Readiness

## Purpose
Standardize evidence-bound blocker reporting whenever readiness checks fail (`Not Ready`) or lack observable proof (`Unknown`). Do **not** use the generic label `Blocked` as a truth state in runtime reports; distinguish **failed readiness checks** from **missing evidence** cleanly.

## When to use
Whenever `runtime-readiness` discovers missing Blender version confirmation, unenabled Lab MCP add-on, dual-bridge conflict, or unreachable MCP endpoint.

## Required Template
- **Check area**: (e.g., `blender_version`, `blender_addon_enabled`, `single_bridge_check`, `mcp_handshake`)
- **Truth state**: `Not Run` | `Attempted` | `Failed` (paired with Readiness verdict: `Not Ready` or `Unknown`)
- **Observed signal / evidence**: Exact verbatim message, port state, or note *"No probe run yet"*
- **User-facing impact (plain language)**: What cannot run safely until fixed
- **Exact next action**: Single concrete step (and target skill if routing needed, e.g., `bridge-conflicts` or `runtime-path-picker`)
- **Source confidence label**: `verified-read` | `linked-only` | `unknown`

## Good example
- **Check area**: `blender_version` (Path 1 requirement)
- **Truth state**: `Failed` (Readiness: `Not Ready` for Path 1)
- **Observed signal**: `blender --version` returned `Blender 4.2.3 LTS`; Path 1 Lab MCP add-on declares `blender_version_min = 5.1.0`.
- **Impact**: Official Path 1 add-on cannot load on Blender 4.2.3.
- **Next action**: Route to `runtime-path-picker` to either upgrade Blender to 5.1+ OR switch to Path 2 (`mcp-for-blender` for 3.0+) or CLI appendix.

## Bad example
"Blocked — Blender didn't connect, please fix your setup and retry."

## Related skill
- [SKILL.md](../SKILL.md)
