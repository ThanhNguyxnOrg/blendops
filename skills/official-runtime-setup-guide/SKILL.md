---
name: official-runtime-setup-guide
description: Establish official runtime prerequisites and setup boundaries before any Blender execution claim.
---

# official-runtime-setup-guide

## Purpose
Establish runtime setup prerequisites, per-path minimum versions, source-confidence labels, truth-state defaults, and single-bridge boundaries before any Blender execution claim.

## Quick start
- confirm this skill fits your goal
- provide required inputs first
- keep runtime claims evidence-bound
- follow suggested next-skill handoff

## When to use
- beginning of a Blender-related task before any runtime path is executed
- user asks what prerequisites, version floors, or setup boundaries apply
- framing official vs third-party vs CLI appendix constraints before handoff

## When not to use
- to install or configure a runtime automatically
- to claim runtime execution has already succeeded
- to choose a runtime path (use `runtime-path-picker`), detail Path 1 host a/b setup (`path-one-host-outline`), or run the readiness matrix (`official-runtime-readiness-checker`)

## Trigger phrases
- “set up Blender runtime prerequisites”
- “what are the Blender runtime setup boundaries”
- “prepare Official Blender Lab MCP setup prerequisites”
- “runtime prerequisites and version minimums”

## Prerequisites / readiness
- ability to read/write project-local docs
- access to official runtime reference links
- no requirement to run Blender in this skill

## Input schema

### Required inputs
- user’s target tool/harness context
- user goal (planning-only vs runtime-eval intent)

### Optional inputs
- OS/platform details
- known local config paths
- team policy on project-local vs global changes

### Assumptions to confirm
- project-local attachment is default
- runtime setup is external to BlendOps
- runtime evidence may be unavailable in current environment

## Output schema

### Primary output
- per-path prerequisites, binding version minimums, and runtime boundary rules
- single-bridge constraint and truth-state baseline (Runtime: `Not Run`, Artifacts: `Not Produced`)

### Secondary output
- known vs unverified local setup signals
- source-confidence map and handoff recommendation

### Evidence / caveat output
- `verified-read` / `linked-only` / `mixed` confidence labels
- explicit unknowns, blockers, and Path 2 / CLI appendix caveats

## Required laws
- ../../laws/official-runtime-only.md
- ../../laws/no-arbitrary-python-interface.md
- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md

## Official runtime boundary
- This skill does not install or configure Blender runtime.
- This skill does not run Blender or emit Python.
- This skill does not provide custom CLI/MCP/addon runtime.
- This skill frames **two MCP execution paths plus a CLI fallback appendix** (see `../../docs/runtime-stack-strategy.md`):
  - **Path 1 — Official Blender Lab MCP** (in Blender 5.1+, add-on manifest literal `blender_version_min = "5.1.0"`, hosted from either (a) Anthropic Connector in Claude Desktop OR (b) any manually configured MCP client). The Anthropic Connector is **not** standalone — Anthropic's tutorial step 2 installs the Lab add-on inside Blender; although the tutorial prerequisite says "Blender 4.2 or later", the binding floor is **Blender 5.1+**. Sources: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude (host a), https://www.blender.org/lab/mcp-server/ (Blender side, both hosts).
  - **Path 2 — Community `mcp-for-blender` (renamed from `ahujasid/blender-mcp`)** (third-party, minimum **Blender 3.0+**, exposes nine tools including `get_scene_info` and `execute_blender_code`). Use **only with caveats** and **never as release evidence**. Source: https://github.com/ahujasid/mcp-for-blender
  - **CLI fallback (appendix only)** — direct `blender --background --python`, **never a peer path without an eval record**. Documented flags: `--background`, `--python`, `-E/--engine` (run `blender -E help` for exact engine tokens; Eevee token is `BLENDER_EEVEE` on 4.0–4.1 and 5.x, `BLENDER_EEVEE_NEXT` on 4.2–4.x). Source: https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

## Operating procedure
1. Confirm user objective and whether runtime execution is requested or planning-only.
2. Confirm install scope boundary (project-local default; global changes require explicit user approval).
3. Record stated client context (e.g., Claude Desktop via `Settings → Developer → Edit Config` for manual MCP JSON, Cursor via `.cursor/mcp.json`, Codex via `AGENTS.md` + MCP config, or another MCP client using its own config — never invent config paths).
4. State the per-path prerequisites, minimums, and boundaries without pre-empting `runtime-path-picker`:
   - **Path 1 (Official Blender Lab MCP, host a or b):** Requires **Blender 5.1+** (`blender_version_min = "5.1.0"`). Host (a) Anthropic Connector in Claude Desktop is not standalone and still requires the Lab add-on inside Blender 5.1+.
   - **Path 2 (Community `mcp-for-blender`):** Requires **Blender 3.0+**. Third-party only; allowed **only with caveats** and **never counts as release evidence**.
   - **CLI fallback (`blender --background --python`):** **Appendix only**, never a peer path without an eval record.
5. Apply source-confidence labels (`verified-read` / `linked-only` / `mixed`) to each reference.
6. Record known and unverified local setup signals without claiming readiness or execution.
7. Enforce the single-bridge rule: only one MCP bridge/host may target a given Blender instance at a time (hand off conflicts to `runtime-bridge-conflict-resolver`).
8. Set baseline truth states: Runtime status = `Not Run` (valid states: `Not Run | Attempted | Produced | Verified | Failed`) and Artifacts = `Not Produced` (downgrade-only, never upgrade).
9. Hand off to the appropriate next skill (`runtime-path-picker`, `path-one-host-outline`, `cli-appendix-job-outline`, or `official-runtime-readiness-checker`).

## Decision tree
- If user only needs planning now → stay in text-only planning mode; keep Runtime `Not Run` and Artifacts `Not Produced`.
- If user needs to choose which execution path fits their environment → state prerequisites/minimums, then hand off to `runtime-path-picker`.
- If user needs Path 1 host (a) vs host (b) setup structure (Claude Desktop Connector + Lab add-on in Blender 5.1+ vs manual MCP config such as Claude Desktop `Settings → Developer → Edit Config`, Cursor `.cursor/mcp.json`, or Codex `AGENTS.md` + MCP config) → hand off to `path-one-host-outline`.
- If user is below Blender 5.1 (on Blender 3.0–5.0) and asks about MCP → note Path 1 is blocked by the `5.1.0` manifest floor and Path 2 (`mcp-for-blender`) is third-party with caveats and never release evidence (`../../docs/unofficial-runtime-bridges.md`).
- If user asks about headless batch flags (`--background`, `--python`, `-E/--engine`) → note CLI fallback is appendix-only (never a peer path without an eval record) and hand off to `cli-appendix-job-outline`.
- If two bridges or hosts are configured against the same Blender instance → warn on the single-bridge rule and hand off to `runtime-bridge-conflict-resolver`.
- If prerequisites are understood and user wants to verify readiness → hand off to `official-runtime-readiness-checker`.

## Playbooks
- Playbook A: text-only planning path
- Playbook B: runtime-ready path with evidence gating
- Playbook C: blocked runtime path with caveat-first reporting

## Mode handling

### Text-only mode
- produce setup prerequisites and boundary guidance only
- no runtime execution claims
- Runtime status is `Not Run`; artifact status defaults to `Not Produced` (downgrade-only, never upgrade)

### Runtime-ready mode
- entered only after `official-runtime-readiness-checker` completes its readiness matrix
- setup guide still keeps Runtime at `Not Run` and Artifacts at `Not Produced` until execution evidence exists (downgrade-only, never upgrade)

### Blocked runtime mode
- explicit blockers and unmet version/prerequisite floors listed
- Runtime stays `Not Run` and Artifacts stay `Not Produced`
- provide upstream reference links and next setup handoff

## Validation checklist
- [ ] Path 1 (5.1+ binding floor, Connector not standalone), Path 2 (3.0+, third-party caveats, never release evidence), and CLI appendix (never a peer path without eval record) boundaries present
- [ ] confidence labels (`verified-read` / `linked-only` / `mixed`) present
- [ ] project-local default stated and global changes require explicit user approval
- [ ] single-bridge rule stated
- [ ] truth states explicit: Runtime `Not Run`, Artifacts `Not Produced` (downgrade-only, never upgrade)
- [ ] no invented client config paths or Blender UI menu paths
- [ ] no role blur with `runtime-path-picker`, `path-one-host-outline`, or `official-runtime-readiness-checker`
- [ ] plain-language user summary present with no Python or custom runtime ownership phrasing

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Runtime path & appendix refs | Path 1 official + Path 2 caveated + CLI appendix refs accurately framed | 1-2 refs present with explicit caveat | Path 2 without caveats, CLI fallback as peer path, or Connector described as standalone |
| Source confidence | All refs labeled (`verified-read` / `linked-only` / `mixed`) | Partial labeling | No labeling |
| Runtime & truth-state boundary | Runtime `Not Run`, Artifacts `Not Produced`, downgrade-only, no role blur | Mild ambiguity corrected | Runtime/artifacts upgraded without evidence or role blurred into execution/install |
| Install scope safety | Project-local default + explicit global approval guard | Scope partially documented | Global mutation implied by default |

## Failure handling
- Missing source access: mark linked-only and avoid procedural specifics.
- Unknown paths/config: mark unknown/blocked and request verifiable context.
- Conflicting user constraints: ask one clarification before proceeding.

## Troubleshooting
- If official page inaccessible: keep URL + linked-only confidence.
- If harness path uncertain: use neutral project-local AGENTS.md attachment note.
- If user asks destructive global changes: require explicit confirmation first.

## Best practices
- keep setup guidance reversible
- separate readiness from execution success
- include concise before/after change summaries

## Good examples
“Prerequisites framed for Official Blender Lab MCP (Path 1): requires Blender 5.1+ (`blender_version_min = "5.1.0"`) and the Lab add-on inside Blender even when using the Claude Desktop Connector. Source confidence: mixed. Runtime status: Not Run. Artifacts: Not Produced. Next: run `runtime-path-picker` or `official-runtime-readiness-checker`.”

## Bad examples
“Setup complete and runtime works now.” (no checks/evidence)

## User-facing response template
- Applicable runtime prerequisites and version minimums
- Boundary rules (single-bridge constraint, Path 2 third-party caveats, CLI appendix restriction)
- What is verified now vs unverified (`verified-read` / `linked-only` / `mixed`)
- Truth states (Runtime: `Not Run`, Artifacts: `Not Produced`)
- Next skill handoff

## Anti-patterns
- skipping required laws or runtime boundary statements
- describing the Anthropic Connector as standalone without the Blender 5.1+ Lab MCP add-on
- claiming runtime/artifact success without evidence or upgrading truth states
- using Path 2 without caveats (or as release evidence) or treating CLI fallback as a peer path
- inventing client config paths or Blender menu/UI paths
- blurring roles with `runtime-path-picker`, `path-one-host-outline`, or `official-runtime-readiness-checker`
- producing jargon-heavy final output or Python code

## Cross-skill handoff
- Path selection: `runtime-path-picker`
- Path 1 host (a)/(b) details: `path-one-host-outline`
- CLI appendix job structure: `cli-appendix-job-outline`
- Bridge conflict resolution: `runtime-bridge-conflict-resolver`
- Readiness matrix check: `official-runtime-readiness-checker`
- Scene planning after readiness: `product-hero-scene-planner`

## Non-goals
- runtime installer creation
- runtime execution automation
- custom runtime ownership

## References
- 2-path + CLI appendix runtime model: ../../docs/runtime-stack-strategy.md
- Per-path setup details: ../../docs/external-runtime-setup.md
- Path 2 caveats: ../../docs/unofficial-runtime-bridges.md
- Path 1 host (a) source — Anthropic Connector: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- Path 1 Blender-side source — Lab MCP (required for both hosts): https://www.blender.org/lab/mcp-server/
- Path 2 source: https://github.com/ahujasid/mcp-for-blender
- CLI fallback source (documented upstream as a first-class Blender CLI; no in-repo evidence file yet): https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
