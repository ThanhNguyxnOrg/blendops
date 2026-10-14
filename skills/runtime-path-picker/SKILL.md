---
name: runtime-path-picker
description: Choose Path 1 Lab MCP, Path 2 mcp-for-blender bridge, or CLI appendix from constraints; Connector hosts Path 1 only with Lab add-on inside Blender.
---

# runtime-path-picker

## Purpose

Produce a **single primary** runtime execution choice among Path 1 (Blender Lab MCP), Path 2 (community `mcp-for-blender` (formerly `ahujasid/blender-mcp`)), or the CLI fallback appendix — with explicit tradeoffs and no false "standalone Connector" claims.

## Quick start

- collect Blender version band, host app (Claude Desktop vs coding agent vs CI), interactivity needs
- score against `references/path-constraints-table.md`
- walk `references/decision-tree.md`
- document choice using `references/anti-patterns.md` guardrails

## When to use

- user unsure Lab vs community vs CLI
- environment pinned to Blender below 5.1 (Path 1 unavailable)
- automation / batch render discussion

## When not to use

- prerequisite framing or install steps → `official-runtime-setup-guide`
- running the readiness matrix → `official-runtime-readiness-checker`
- detailing Path 1 host (a) Connector vs (b) manual MCP client → `path-one-host-outline`
- outlining headless CLI jobs → `cli-appendix-job-outline`
- resolving active bridge or port collisions → `runtime-bridge-conflict-resolver`
- halting on contradictory constraints before handoff → `pre-handoff-verification`

## Trigger phrases

- "which MCP should I use"
- "Lab MCP or mcp-for-blender"
- "Path 1 or Path 2"
- "CLI vs MCP"

## Prerequisites / readiness

- target Blender major/minor known or explicitly unknown
- whether interactive steering vs batch matters

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Blender version (or uncertainty) | Gates Path 1 |
| Host environment category | Connector vs generic MCP vs CI |

### Optional inputs

| Input | Use |
|---|---|
| Org IT constraints | May force CLI appendix |
| Prior tooling investment | Path loyalty |

## Output schema

### Primary output

- **single** primary path recommendation + rationale (this skill configures nothing)
- rejected paths + explicit rationale for each rejected option
- if **Path 1** is recommended: host option note covering (a) Anthropic Connector in Claude Desktop or (b) any manually configured MCP client — **both** require the Official Blender Lab MCP add-on (`blender_version_min = "5.1.0"`) inside Blender; Connector is NOT standalone
- if **Path 2** (`mcp-for-blender`, renamed from `ahujasid/blender-mcp`) is recommended: explicit third-party caveats (`Blender 3.0+`) + mandatory **non-release evidence** label (never release evidence)
- if **CLI fallback** is recommended: mandatory **appendix-only** label (`blender --background --python`), stating it is never a peer path without an eval record

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Blockers: <separate line; route contradictory constraints to pre-handoff-verification>
Evidence used: <user-stated constraints only unless logs provided>
Limitations: <unknown Blender build or unverified host state>
```

- Artifacts default to `Not Produced`; truth states are **downgrade-only, never upgrade**.

## Required laws

- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Decision skill only — chooses a single primary path from constraints and configures nothing (see `../../docs/runtime-stack-strategy.md` for the canonical model).
- **Path 1**: Official Blender Lab MCP in Blender 5.1+ (add-on manifest literal `blender_version_min = "5.1.0"`), hosted from (a) Anthropic Connector in Claude Desktop or (b) any manually configured MCP client. Connector is NOT standalone.
- **Path 2**: Community `mcp-for-blender` (renamed from `ahujasid/blender-mcp`), third-party, Blender 3.0+, recommended only with explicit caveats and **never as release evidence**. Manual configuration responsibility; see `docs/unofficial-runtime-bridges.md`.
- **CLI fallback**: Appendix only (`blender --background --python`), never a peer path without an eval record. Documented upstream as a first-class Blender CLI surface (render/Cycles/format/Python sections read in the current Blender 5.2 LTS Manual); **no in-repo evidence file yet** for BlendOps-run CLI examples.
- **Bridge limit**: One MCP bridge per Blender instance (default port 9876).
- **Role boundary**: Prerequisite framing belongs to `official-runtime-setup-guide`; readiness matrix checks belong to `official-runtime-readiness-checker`; Path 1 host a/b details belong to `path-one-host-outline`; headless job outlines belong to `cli-appendix-job-outline`; bridge conflicts belong to `runtime-bridge-conflict-resolver`.

## Operating procedure

1. Check constraints for contradictions (e.g., requires official release evidence on Blender `<5.1`, or demands interactive MCP where all local ports/addons and CLI are forbidden). If constraints are contradictory, stop and exit to `pre-handoff-verification`.
2. Gate **Path 1** on Blender 5.1+ feasibility (`blender_version_min = "5.1.0"`) with host (a) Anthropic Connector in Claude Desktop or (b) manually configured MCP client (handoff host details to `path-one-host-outline`).
3. If Path 1 is impossible, Blender is `3.0+`, and interactive MCP is required → select **Path 2** (`mcp-for-blender`, formerly `ahujasid/blender-mcp`) only with explicit third-party caveats and a **non-release evidence** label.
4. If batch, headless, or CI constraints dominate → select the **CLI fallback** (`blender --background --python`) labeled strictly as **appendix-only** (never a peer path without an eval record) and hand off job structure to `cli-appendix-job-outline`.
5. Enforce the one MCP bridge per Blender instance rule (default port 9876); if multiple bridges are active or requested on one instance, hand off to `runtime-bridge-conflict-resolver`.

## Mode handling

### Text-only mode

Deliver a single hypothetical path recommendation with rejected-paths rationale, required labels, Runtime status `Not Run`, and Artifact status `Not Produced`.

### Runtime-ready mode

Cross-check constraints against `official-runtime-readiness-checker` output if present; preserve or downgrade truth states (downgrade-only, never upgrade; artifacts default `Not Produced`).

### Blocked runtime mode

Record blockers on a separate line, keep truth states downgraded (`Not Run` / `Failed` for runtime, `Not Produced` / `Failed` for artifacts), and route contradictory constraints to `pre-handoff-verification`.

## Validation checklist

- [ ] Exactly one primary path recommended, with rejected paths and rationale included
- [ ] Path 1 mentions include `blender_version_min = "5.1.0"` and state that Anthropic Connector is NOT standalone
- [ ] Path 2 pick includes `Blender 3.0+` floor, third-party caveats, and **never release evidence** label
- [ ] CLI pick includes **appendix-only** label (`blender --background --python`) and is never framed as a peer path without an eval record
- [ ] One MCP bridge per Blender instance (default port 9876) noted; no role blur into setup, readiness, host outline, CLI outline, or conflict resolution
- [ ] Truth states use allowed values only, default artifacts to `Not Produced`, and strictly downgrade-only
- [ ] Contradictory constraints exit to `pre-handoff-verification`

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | Single primary path + rejected-paths rationale mapped to constraints, required Path 1/Path 2/CLI labels attached, boundaries respected, truth states valid. |
| Warn | Blender version or host detail unknown — single primary path chosen conditionally with explicit fallback branches and `Not Produced` artifact default. |
| Fail | Recommends multiple primary paths; claims Connector is standalone; picks Path 2 without caveats + non-release label; treats CLI as a peer path without an eval record; blurs roles with neighbor skills; upgrades truth states; or fails to exit to `pre-handoff-verification` on contradictory constraints. |

## Cross-skill handoff

- Prerequisite framing → `../official-runtime-setup-guide/SKILL.md`
- Readiness matrix check → `../official-runtime-readiness-checker/SKILL.md`
- Host (a)/(b) specifics for Path 1 → `../path-one-host-outline/SKILL.md`
- Headless CLI appendix job outline → `../cli-appendix-job-outline/SKILL.md`
- Bridge or port 9876 conflicts → `../runtime-bridge-conflict-resolver/SKILL.md`
- Contradictory constraints failure exit → `../pre-handoff-verification/SKILL.md`

## References

- `references/path-constraints-table.md`
- `references/decision-tree.md`
- `references/anti-patterns.md`
- `../../docs/runtime-stack-strategy.md`
