---
name: official-runtime-readiness-checker
description: Evaluate whether official runtime appears ready using evidence-bound checks and explicit readiness states.
---

# official-runtime-readiness-checker

## Purpose
Run the evidence-bound readiness matrix to evaluate check completeness (`Ready | Partially Ready | Blocked | Unknown`) before any runtime attempt.

Canonical role: `runtime-readiness` in the BlendOps skill system. Respect strict role boundaries:
- `official-runtime-setup-guide` frames prerequisites and boundaries.
- `runtime-path-picker` chooses the runtime path.
- `path-one-host-outline` details Path 1 host (a) and host (b) setup.
- THIS skill (`official-runtime-readiness-checker`) runs the readiness matrix only.

## Quick start
- confirm this skill fits your goal
- provide required inputs first
- keep runtime claims evidence-bound
- follow suggested next-skill handoff

## When to use
- to run the readiness matrix after prerequisites are framed (`official-runtime-setup-guide`) and a target path is selected (`runtime-path-picker`)
- before any runtime manual evaluation or planning handoff

## When not to use
- as proof that Blender ran or that runtime execution succeeded
- as a substitute for runtime truth states (`Not Run | Attempted | Produced | Verified | Failed`) or artifact status (default `Not Produced`)
- to choose a runtime path (use `runtime-path-picker`) or walk through Path 1 host setup (use `path-one-host-outline`)

## Trigger phrases
- “check runtime readiness”
- “is runtime available”
- “can we run this now”
- “run the readiness matrix for our chosen Blender path”

## Prerequisites / readiness
- non-destructive local environment access
- ability to read config/path signals
- clear distinction between readiness and execution

## Input schema

### Required inputs
- expected runtime path(s)
- target harness context

### Optional inputs
- known executable paths
- known config file locations
- prior blocker records

### Assumptions to confirm
- no Blender run required for readiness-only pass
- Path 2 used only with third-party caveats; CLI appendix never a peer path

## Output schema

### Primary output
- readiness matrix + final readiness status (`Ready | Partially Ready | Blocked | Unknown`, describing check completeness only)
- explicit runtime truth state reminder (runtime remains `Not Run`; artifacts remain `Not Produced`)

### Secondary output
- blocker list + next-skill handoff or retry steps

### Evidence / caveat output
- per-check evidence lines
- confidence label per check: `verified-read | linked-only | unknown | blocked`

## Required laws
- ../../laws/official-runtime-only.md
- ../../laws/evidence-before-done.md
- ../../laws/no-arbitrary-python-interface.md
- ../../laws/non-blender-user-language.md

## Official runtime boundary
- Readiness ≠ execution: `Ready` means readiness checks passed, never that Blender executed or artifacts exist.
- Readiness statuses (`Ready | Partially Ready | Blocked | Unknown`) describe check completeness only; never conflate them with runtime truth states (`Not Run | Attempted | Produced | Verified | Failed`, downgrade-only) or artifact state (default `Not Produced`).
- This skill can check local readiness signals.
- This skill must not claim runtime artifact production.
- This skill must not claim execution success without execution evidence.
- Path 1 Anthropic Connector is never standalone: it always requires the Official Blender Lab MCP add-on installed inside Blender 5.1+.
- Path 2 (`mcp-for-blender`) is third-party only, carries mandatory caveats, and is never release evidence.
- CLI fallback (`blender --background --python`) is appendix-only and never a peer path without an evaluation record.

## Operating procedure
1. Confirm chosen runtime path (Path 1 or Path 2 from `../../docs/runtime-stack-strategy.md`); for Path 1 also confirm host option (a Anthropic Connector, b manual MCP). CLI fallback is appendix only — documented upstream as a first-class Blender CLI surface but no in-repo evidence file yet; flag this if user picks it.
2. Check Blender executable availability (command/path evidence) AND record exact `blender --version` output for per-path minimum check:
   - **Path 1 (either host)** → 5.1+ required (Lab install-link parameter + add-on manifest literal `blender_version_min=5.1.0`, re-verified 2026-10-13).
   - Path 2 → 3.0+ required (per upstream).
   - CLI fallback → 4.2+ recommended; documented upstream as a first-class Blender CLI surface; no in-repo evidence file yet.
3. Per chosen path + host, check the path-specific configuration:
   - **Path 1 Blender-side (always required)**: Lab MCP add-on installed in Blender + MCP server (`.mcpb` bundle or source) reachable.
   - Path 1 host (a): Anthropic Connector enabled in Claude Desktop → Customize → Connectors.
   - Path 1 host (b): Lab MCP server registered in MCP client config (`mcpServers` JSON or equivalent).
   - Path 2: `mcp-for-blender` (formerly `blender-mcp`) server registered (`uvx mcp-for-blender` or equivalent) + upstream `addon.py` installed + enabled in Blender.
   - CLI fallback: Blender executable resolvable from agent shell.
4. Check single-bridge constraint: at most one MCP bridge session active per Blender instance on the default port (Path 1 + Path 2 must not both target the same Blender on `localhost:9876`; per-instance `--port 9877` is the supported multi-instance pattern; Path 1 host (a) + host (b) must not both target the same Blender).
5. Check operator sandbox hygiene: trusted environment, no secrets in scenes/logs, disposable ports/paths.
6. Check artifact/output location readiness for future run.
7. Assign confidence label to each check (`verified-read` / `linked-only` / `unknown` / `blocked`).
8. Populate readiness matrix table per path + host.
9. Derive final status (Ready / Partially Ready / Blocked / Unknown) while keeping runtime truth at `Not Run` and artifacts at `Not Produced`.
10. Produce blocker summary and next actions.
11. Route to planner or setup skill based on status.

## Decision tree
- Blender missing + no connector/MCP evidence → Blocked.
- Blender found but connector/MCP uncertain → Partially Ready or Unknown.
- Blender found + connector/MCP signals sufficient → Ready candidate (still no artifact claim).

## Playbooks
- Playbook A: text-only planning path
- Playbook B: runtime-ready path with evidence gating
- Playbook C: blocked runtime path with caveat-first reporting

## Mode handling

### Text-only mode
- evaluate readiness matrix from provided evidence only
- runtime truth state stays `Not Run`; artifacts stay `Not Produced`

### Runtime-ready mode
- status `Ready` or `Partially Ready` with explicit path caveats
- handoff to scene planning or host outline skills (never claim execution occurred)

### Blocked runtime mode
- status `Blocked` or `Unknown`
- list explicit blockers and handoff to setup or conflict-resolution skills

## Validation checklist
- [ ] Blender check recorded
- [ ] connector check recorded
- [ ] MCP check recorded
- [ ] artifact path readiness recorded
- [ ] confidence labels assigned
- [ ] final status assigned
- [ ] blocker list included
- [ ] no execution success claim
- [ ] runtime truth state kept at `Not Run`, artifacts at `Not Produced` (readiness is not execution)
- [ ] Path 2 references carry third-party caveats; CLI appendix never a peer path
- [ ] operator sandbox hygiene noted (trusted environment, no secrets in scenes/logs, disposable ports/paths)
- [ ] next actions clear

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Blender availability | Verified with local evidence | Partial path evidence | Missing/not found |
| Path & host signals | Both in-Blender Lab add-on + host (a/b) verified for Path 1 (or caveated Path 2/CLI) | Incomplete signal downgraded to `Unknown`/`Partially Ready` | Standalone-Connector assumed or claimed without evidence |
| Sandbox hygiene & confidence | Sandbox hygiene noted; every check labeled (`verified-read`/`linked-only`/`unknown`/`blocked`) | Partial labels or hygiene caveats | Missing labels or hygiene ignored |
| Status vs truth separation | Matrix status matches evidence; runtime kept at `Not Run` and artifacts `Not Produced` | Minor ambiguity with conservative downgrade | Readiness conflated with execution or truth upgraded |

## Failure handling
- Unknown state: mark Unknown, not Ready.
- Missing config path: mark Blocked and provide exact next check.
- Conflicting signals: choose safer status with caveat.

## Troubleshooting
- Blender not on PATH: check absolute path.
- Config file exists but missing runtime entries: mark unknown/blocked.
- Existing artifacts found: treat as pre-existing unless run-specific evidence ties them to current eval.

## Best practices
- keep checks reproducible and non-destructive
- include exact evidence lines in report
- separate readiness from artifact claims

## Good examples
“Status: Blocked. Blender binary exists, but official connector/MCP runtime path is not confirmed in this environment.”

## Bad examples
“Looks good; runtime should work.” (no matrix, no evidence)

## User-facing response template
- Current runtime status
- Evidence observed
- Missing readiness signals
- Next setup action

## Anti-patterns
- skipping required laws or runtime boundary statements
- claiming runtime/artifact success without evidence
- conflating readiness status (`Ready`) with runtime truth states (`Produced | Verified`) or claiming artifacts exist
- treating the Path 1 Anthropic Connector as standalone without the Blender 5.1+ Lab MCP add-on
- using Path 2 (`mcp-for-blender`) without third-party caveats or as release evidence
- treating CLI fallback (`blender --background --python`) as a peer path without an eval record
- blurring roles with `official-runtime-setup-guide`, `runtime-path-picker`, or `path-one-host-outline`
- producing jargon-heavy final output without explanation

## Cross-skill handoff
- If runtime path is not yet chosen: `runtime-path-picker`
- If Path 1 host (a) or (b) outline is needed: `path-one-host-outline`
- If prerequisites/boundaries are missing (`Blocked` / `Unknown`): `official-runtime-setup-guide`
- If bridge contention is detected: `runtime-bridge-conflict-resolver`
- If CLI appendix job structure is needed: `cli-appendix-job-outline`
- If `Ready` / `Partially Ready` and moving to scene planning: `workflow-stage-router` or `product-hero-scene-planner`

## Non-goals
- runtime execution
- artifact generation claims
- uncaveated Path 2 / peer-path CLI fallback

## References
- 2-path + CLI appendix runtime model: ../../docs/runtime-stack-strategy.md
- Per-path setup details: ../../docs/external-runtime-setup.md
- Path 1 host (a) source — Anthropic Connector: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- Path 1 Blender-side source — Lab MCP (required for both hosts): https://www.blender.org/lab/mcp-server/
- Path 2 source: https://github.com/ahujasid/mcp-for-blender
- CLI fallback source (documented upstream as first-class Blender CLI; no in-repo evidence file yet): https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
