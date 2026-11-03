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
<!-- blendops:generated:start exclusions -->
- prerequisite framing or install steps → use `../runtime-setup/SKILL.md` (Delegates out-of-scope requests to runtime-setup)
- running the readiness matrix → use `../runtime-readiness/SKILL.md` (Delegates out-of-scope requests to runtime-readiness)
- detailing Path 1 host (a) Connector vs (b) manual MCP client → use `../path-one-host-outline/SKILL.md` (Delegates out-of-scope requests to path-one-host-outline)
- outlining headless CLI jobs → use `../cli-appendix-job-outline/SKILL.md` (Delegates out-of-scope requests to cli-appendix-job-outline)
- resolving active bridge or port collisions → use `../bridge-conflicts/SKILL.md` (Delegates out-of-scope requests to bridge-conflicts)
- halting on contradictory constraints before handoff → use `../pre-handoff-verification/SKILL.md` (Delegates out-of-scope requests to pre-handoff-verification)
<!-- blendops:generated:end exclusions -->

## Trigger phrases
<!-- blendops:generated:start triggers -->
- "which MCP should I use"
- "Lab MCP or mcp-for-blender"
- "Path 1 or Path 2"
- "CLI vs MCP"
<!-- blendops:generated:end triggers -->

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
Artifact status: Not Produced | Produced | Verified | Failed
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
- **Role boundary**: Prerequisite framing belongs to `runtime-setup`; readiness matrix checks belong to `runtime-readiness`; Path 1 host a/b details belong to `path-one-host-outline`; headless job outlines belong to `cli-appendix-job-outline`; bridge conflicts belong to `bridge-conflicts`.

## Operating procedure

1. Check constraints for contradictions (e.g., requires official release evidence on Blender `<5.1`, or demands interactive MCP where all local ports/addons and CLI are forbidden). If constraints are contradictory, stop and exit to `pre-handoff-verification`.
2. Gate **Path 1** on Blender 5.1+ feasibility (`blender_version_min = "5.1.0"`) with host (a) Anthropic Connector in Claude Desktop or (b) manually configured MCP client (handoff host details to `path-one-host-outline`).
3. If Path 1 is impossible, Blender is `3.0+`, and interactive MCP is required → select **Path 2** (`mcp-for-blender`, formerly `ahujasid/blender-mcp`) only with explicit third-party caveats and a **non-release evidence** label.
4. If batch, headless, or CI constraints dominate → select the **CLI fallback** (`blender --background --python`) labeled strictly as **appendix-only** (never a peer path without an eval record) and hand off job structure to `cli-appendix-job-outline`.
5. Enforce the one MCP bridge per Blender instance rule (default port 9876); if multiple bridges are active or requested on one instance, hand off to `bridge-conflicts`.

## Decision tree

```txt
Are the user's constraints mutually contradictory (e.g., demands official Path 1 release evidence on Blender 4.2 LTS, or requires interactive MCP when all local ports/add-ons are forbidden)?
  Yes → STOP; record contradiction on Blockers line and exit to pre-handoff-verification
  No → continue
Are both Path 1 and Path 2 bridges configured or requested simultaneously on the same Blender instance (port 9876)?
  Yes → STOP; route to bridge-conflicts (Single-bridge constraint)
  No → continue
Does the workflow require non-interactive CI, render-farm, or headless batch automation rather than interactive viewport steering?
  Yes → select CLI fallback (`blender --background --python`) with mandatory **appendix-only** label (never a peer path without an eval record) and hand off to cli-appendix-job-outline
  No (interactive MCP steering required) → continue
Is Blender 5.1+ (`blender_version_min = "5.1.0"`) available and can the Official Blender Lab MCP add-on be installed inside Blender?
  Yes → select **Path 1 — Official Blender Lab MCP** (hosted via (a) Anthropic Connector in Claude Desktop or (b) manual MCP client; Connector is NOT standalone) and hand off host specifics to path-one-host-outline
  No (Blender is 3.0–5.0, e.g., Blender 4.2 LTS) →
    Does the user accept third-party community bridge maintenance and non-release evidence caveats?
      Yes → select **Path 2 — Community `mcp-for-blender`** (formerly `ahujasid/blender-mcp`, Blender 3.0+) with mandatory **non-release evidence** label
      No → block execution and route to pre-handoff-verification
```

## Playbooks

### Playbook A: Blender 5.1+ interactive workstation (`Path 1` selected)

- Verify Blender `>= 5.1.0` (`blender_version_min = "5.1.0"`) against `references/path-constraints-table.md`.
- Recommend **Path 1 — Official Blender Lab MCP** as the single primary path, explicitly noting both host options — **(a)** Anthropic Connector in Claude Desktop and **(b)** manual MCP client — and stating that the Lab MCP add-on inside Blender is required for both (**Connector is NOT standalone**).
- Reject Path 2 (unnecessary third-party surface when 5.1+ is available) and CLI appendix (poor fit for interactive look-dev), then hand off to `../path-one-host-outline/SKILL.md` or `../runtime-setup/SKILL.md`.

### Playbook B: Blender 3.0–4.x LTS interactive MCP request (`Path 2` selected with caveats)

- Explain succinctly that **Path 1** is unavailable because the Official Blender Lab MCP add-on manifest requires `blender_version_min = "5.1.0"`.
- Recommend **Path 2 — Community `mcp-for-blender`** (renamed from `ahujasid/blender-mcp`, `Blender 3.0+`) as the single primary path **only** with explicit third-party maintenance caveats (`../../docs/unofficial-runtime-bridges.md`) and a mandatory **never release evidence** label.
- Enforce the single-bridge rule (one MCP bridge per Blender instance on default port `9876`).

### Playbook C: Headless CI or batch export pipeline (`CLI fallback appendix` selected)

- Select the **CLI fallback (`blender --background --python`)** with the mandatory **appendix-only** label (documented upstream as a first-class Blender CLI surface, with no in-repo BlendOps eval record yet — never a peer MCP path).
- Reject Path 1 and Path 2 for stateless batch runners and hand off job structure to `../cli-appendix-job-outline/SKILL.md`.

## Mode handling

### Text-only mode

Deliver a single hypothetical path recommendation with rejected-paths rationale, required labels, Runtime status `Not Run`, and Artifact status `Not Produced`.

### Runtime-ready mode

Cross-check constraints against `runtime-readiness` output if present; preserve or downgrade truth states (downgrade-only, never upgrade; artifacts default `Not Produced`).

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

## Failure handling

- If constraints are contradictory (such as requiring official Path 1 release certification while locked to Blender 4.2 LTS, or demanding live MCP steering where local sockets and add-ons are banned by policy), do not force a broken pick; record the contradiction under `Blockers`, keep `Runtime status: Not Run` and `Artifact status: Not Produced`, and exit to `../pre-handoff-verification/SKILL.md`.
- If the user's Blender version is unknown, emit a `Warn`-level conditional pick that branches explicitly on `Blender >= 5.1.0` (Path 1) vs `Blender 3.0–5.0` (Path 2 with non-release caveats) until the version is confirmed.
- If the user attempts to attach both Path 1 and Path 2 to the same Blender instance, stop path selection and route to `../bridge-conflicts/SKILL.md`.

## Troubleshooting

| Symptom | Cause | Safe resolution |
|---|---|---|
| User on Blender 4.2 LTS asks to install the Anthropic Blender Connector | Anthropic tutorial prose mentions "Blender 4.2 or later", but the Lab MCP add-on manifest enforces `blender_version_min = "5.1.0"` | Explain the binding 5.1.0 manifest floor; reject Path 1 unless the user upgrades to Blender 5.1+, or recommend Path 2 (`mcp-for-blender`) with third-party non-release caveats. |
| User wants to run Path 1 in Claude Desktop and Path 2 in Cursor against one open Blender window | Violates the Single-bridge constraint on port `9876` | Warn that Blender accepts only one active MCP bridge session per instance and route to `../bridge-conflicts/SKILL.md`. |
| User treats `blender --background` as "Path 3 MCP" | Confusion between MCP bridges and Blender's native command-line interface | Clarify that `blender --background --python` is the **CLI fallback appendix** (no MCP involved, not a peer path without an eval record) and hand off to `../cli-appendix-job-outline/SKILL.md`. |

## Best practices

- Always select **exactly one** primary runtime path and provide explicit rejection rationales for the other two options (`references/path-constraints-table.md`).
- Whenever Path 1 is mentioned, state both `blender_version_min = "5.1.0"` (**Blender 5.1+**) and that the **Anthropic Connector is NOT standalone**.
- Whenever Path 2 (`mcp-for-blender`, formerly `ahujasid/blender-mcp`) is recommended, attach the `Blender 3.0+` floor, third-party maintenance caveat, and **never release evidence** label.
- Keep `Runtime status: Not Run` and `Artifact status: Not Produced` when choosing a runtime path.

## Good examples

- "Primary path: **Path 2 — Community `mcp-for-blender`** (formerly `ahujasid/blender-mcp`, `Blender 3.0+`, third-party community bridge — **never release evidence**). Rejected paths: **Path 1 — Official Blender Lab MCP** (rejected because the environment is pinned to Blender 4.2 LTS, below the binding `blender_version_min = \"5.1.0\"` floor; note that Anthropic Connector is also not standalone); **CLI fallback appendix** (`blender --background --python`, appendix-only, rejected because interactive Cursor look-dev steering is required). Single-bridge rule: one MCP bridge per Blender instance (port 9876). `Runtime status: Not Run`. `Artifact status: Not Produced`."
- "Primary path: **Path 1 — Official Blender Lab MCP** in **Blender 5.1+** (`blender_version_min = \"5.1.0\"`), hosted via **(a)** Anthropic Connector in Claude Desktop or **(b)** manual MCP client (both require the Lab MCP add-on inside Blender; Connector is NOT standalone). Hand off host details to `../path-one-host-outline/SKILL.md`. `Runtime status: Not Run`. `Artifact status: Not Produced`."

## Bad examples

- "You can use either Path 1 or Path 2, or run both together on port 9876." — fails to pick a single primary path and violates the Single-bridge constraint.
- "On Blender 4.2, use Path 1 via the standalone Anthropic Connector in Claude Desktop." — violates both the Blender 5.1+ manifest floor and the non-standalone Connector rule.
- "Use Path 2 (`blender-mcp`) to generate certified release evidence." — uses bare `blender-mcp` and falsely promotes Path 2 to release evidence.

## User-facing response template

```txt
Primary runtime path: <Path 1 — Official Blender Lab MCP (Blender 5.1+) | Path 2 — Community mcp-for-blender (Blender 3.0+, non-release evidence) | CLI fallback appendix (blender --background --python, appendix-only)>
Why this path fits: <constraint-mapped rationale>

Mandatory path guardrails:
- Path 1 note: Requires Lab MCP add-on (`blender_version_min = "5.1.0"`) inside Blender 5.1+ for both Host (a) Anthropic Connector and Host (b) manual MCP client; Connector is NOT standalone.
- Path 2 note: `mcp-for-blender` (formerly `ahujasid/blender-mcp`), third-party, Blender 3.0+, manual config, never release evidence.
- CLI fallback note: Appendix-only (`blender --background --python`), never a peer path without an eval record.
- Single-bridge rule: One MCP bridge per Blender instance (default port 9876).

Rejected paths & rationale:
- <Rejected option 1>: <why rejected>
- <Rejected option 2>: <why rejected>

Blockers: <none or contradictory constraints routed to pre-handoff-verification>
Runtime status: Not Run
Artifact status: Not Produced
Evidence used: <user-stated constraints + docs/runtime-stack-strategy.md>
Limitations: <unverified Blender build or host permissions>
Next skill: <path-one-host-outline | runtime-setup | cli-appendix-job-outline | bridge-conflicts | pre-handoff-verification>
```

## Anti-patterns

- Recommending two primary paths at once instead of committing to a single primary recommendation (`references/anti-patterns.md`).
- Claiming the Anthropic Blender Connector works standalone without installing the Official Blender Lab MCP add-on inside **Blender 5.1+**.
- Applying the Path 1 **Blender 5.1+** floor to Path 2 (`mcp-for-blender`) or the CLI fallback appendix.
- Recommending Path 2 without explicit third-party caveats and the **never release evidence** label, or calling it bare `blender-mcp`.
- Treating the CLI fallback appendix as a peer MCP path without an in-repo evaluation record.
- Writing `Artifact status: Not Run` or upgrading truth states during path selection.

## Cross-skill handoff
<!-- blendops:generated:start handoffs -->
- [progression] Prerequisite framing → `../runtime-setup/SKILL.md`
- [progression] Readiness matrix check → `../runtime-readiness/SKILL.md`
- [progression] Host (a)/(b) specifics for Path 1 → `../path-one-host-outline/SKILL.md`
- [progression] Headless CLI appendix job outline → `../cli-appendix-job-outline/SKILL.md`
- [fallback] Bridge or port 9876 conflicts → `../bridge-conflicts/SKILL.md`
- [fallback] Contradictory constraints failure exit → `../pre-handoff-verification/SKILL.md`
<!-- blendops:generated:end handoffs -->

## Non-goals

- Walking through step-by-step add-on installation or host config file edits (owned by `../runtime-setup/SKILL.md`).
- Probing live runtime connectivity (owned by `../runtime-readiness/SKILL.md`).
- Detailing Path 1 Host (a) vs Host (b) architecture (owned by `../path-one-host-outline/SKILL.md`) or CLI batch job phases (owned by `../cli-appendix-job-outline/SKILL.md`).
- Executing Blender, generating Python code, or verifying artifacts.

## References

- `references/path-constraints-table.md`
- `references/decision-tree.md`
- `references/anti-patterns.md`
- `../../docs/runtime-stack-strategy.md`
