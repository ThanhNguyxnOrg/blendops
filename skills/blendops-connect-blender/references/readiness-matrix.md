# Readiness Matrix

## Purpose
Map observable environment signals to deterministic pre-attempt readiness verdicts (`Ready`, `Partially Ready`, `Blocked`, `Unknown`) before launching any Blender MCP or CLI execution.

## When to use
- Inside every `blendops-connect-blender` preflight report before scene mutation, render, or GLB export.
- Before escalating from planning-only mode (`Runtime status: Not Run`) to an official Path 1, community Path 2, or CLI appendix attempt.

## Pre-attempt readiness matrix

| Check dimension | Observable signal | Pass | Warn / Unknown | Fail (Blocks Execution) |
|---|---|---|---|---|
| **Blender binary & floor** | `blender --version` | Matches path floor (`5.1+` required for Path 1 Lab MCP; `3.0+` for Path 2; `4.2+` recommended for CLI) | Version unrecorded (`Unknown`) or only verified verbally | Missing binary, or below `5.1.0` when targeting Path 1 (`blender_version_min = "5.1.0"`) |
| **Add-on / bridge posture** | Active Blender add-on + single listener check | Exactly **one** add-on enabled matching chosen path (Lab MCP add-on for Path 1; `addon.py` for Path 2; none needed for CLI) | Add-on state not directly inspected (`Unknown`) | Path 1 + Path 2 both active on `localhost:9876`, or Connector enabled without Lab add-on inside Blender |
| **MCP host / CLI entrypoint** | Host client config + read-only handshake | Target host configured for chosen path (`Connector` or `mcpServers` for Path 1; `uvx mcp-for-blender` for Path 2) | Config present but read-only smoke test not yet run | Host targets conflicting bridge, unconfigured server, or unsupported direct official MCP claim |
| **Output & sandbox hygiene** | Target output directory & credential check | Writable non-sensitive output path verified; no secrets/tokens in `.blend` or prompts | Output path implied but write permissions unchecked | Target path missing/read-only, unsafe global write requested, or unredacted credentials detected |
| **Trusted read-only smoke** | Non-mutating summary query (`get_blendfile_summary_*` / `get_scene_info`) | Clean JSON response without running `execute_blender_code` | Prior smoke test exists from same host/version | Smoke test timed out, refused connection, or invoked mutating code |

## Verdict mapping rules (downgrade-only)

| Verdict | Criteria | Permitted next action |
|---|---|---|
| **Ready** | All 5 rows `Pass` for the chosen path and single-bridge constraint verified | Proceed to scoped read-only or user-confirmed execution; record outputs via `blendops-final-check` |
| **Partially Ready** | Zero `Fail` rows, but 1+ `Warn / Unknown` rows remain (e.g., pending read-only smoke test) | Run read-only smoke test first; do **not** run mutating Python, render, or GLB export yet |
| **Blocked** | Any row is `Fail` (below Blender 5.1+ on Path 1, dual-bridge conflict on `localhost:9876`, missing binary) | Halt execution immediately; route to `blendops-connect-blender`, or remain planning-only (`Runtime status: Not Run`) |
| **Unknown** | Operator provided zero environment signals or conflicting claims without inspection | Collect versions and host configuration (`blendops-final-check` Section B) before retrying |

## Good example
```txt
Path posture: Path 1 — Official Blender Lab MCP, Host (a) Anthropic Connector in Claude Desktop
Checks: Blender 5.1.0 (Pass), Lab add-on active alone on 9876 (Pass), Connector active (Pass), output path writable (Pass), read-only smoke (Not yet run -> Warn).
Verdict: Partially Ready. Next step: run one read-only `get_blendfile_summary_path_info` call before any mutation.
Runtime status: Not Run | Artifact status: Not Produced
```

## Bad example
```txt
Verdict: Ready — User enabled Anthropic Blender Connector on Blender 4.2 with mcp-for-blender also active.
```
Why bad: Path 1 requires Blender 5.1+ (`blender_version_min = "5.1.0"`), Connector is never standalone, and running both bridges on `localhost:9876` violates the single-bridge constraint (`Blocked`, route to `blendops-connect-blender`).

## Related skill
- [../SKILL.md](runtime-readiness.md)
- [../../blendops-connect-blender/SKILL.md](runtime-readiness.md)
- [../../blendops-final-check/SKILL.md](../../blendops-final-check/SKILL.md) (attempt report: [runtime-attempt-report](../../blendops-final-check/references/runtime-attempt-report.md))
