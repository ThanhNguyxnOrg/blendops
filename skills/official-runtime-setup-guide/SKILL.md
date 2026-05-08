---
name: official-runtime-setup-guide
description: Establish official runtime prerequisites and setup boundaries before any Blender execution claim.
---

# official-runtime-setup-guide

## Purpose
Define a safe, official-runtime-only setup path for users/agents before runtime execution.

## Quick start
- confirm this skill fits your goal
- provide required inputs first
- keep runtime claims evidence-bound
- follow suggested next-skill handoff

## When to use
- beginning of a Blender-related task
- runtime path is unknown
- user asks how to set up runtime prerequisites

## When not to use
- to install runtime automatically
- to claim runtime execution has already succeeded

## Trigger phrases
- “set up Blender runtime”
- “which runtime path should I use”
- “prepare official connector/MCP setup”
- “runtime prerequisites checklist”

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
- official runtime option selection + rationale

### Secondary output
- setup/readiness checklist
- source-confidence map

### Evidence / caveat output
- `verified-read` / `linked-only` / `mixed` confidence labels
- explicit unknowns and blockers

## Required laws
- ../../laws/official-runtime-only.md
- ../../laws/no-arbitrary-python-interface.md
- ../../laws/evidence-before-done.md
- ../../laws/non-blender-user-language.md

## Official runtime boundary
- This skill does not install Blender runtime.
- This skill does not run Blender.
- This skill does not provide custom CLI/MCP/addon runtime.
- This skill recognizes exactly four runtime routes (see `../../docs/runtime-stack-strategy.md`):
  - **Route A — Anthropic Blender Connector** (one-click in Claude Desktop, min Blender 4.2+ / 4.5 LTS recommended) — https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
  - **Route B — Blender Foundation MCP Server** (`bpype/blender_mcp`, manual install, min Blender 5.1+) — https://www.blender.org/lab/mcp-server/
  - **Route C — Community Blender MCP** (`ahujasid/blender-mcp`, mature 21K+ stars third-party, min Blender 3.0+) — https://github.com/ahujasid/blender-mcp
  - **Route D — Official Blender CLI** (no MCP, deterministic) — https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

## Operating procedure
1. Confirm user objective and whether runtime execution is needed now.
2. Confirm install mode preference (project-local default, global only if explicit).
3. Detect likely client (Claude Desktop / Claude Code / Cursor / Codex / OpenCode / Cline / generic).
4. Map client → applicable routes:
   - Claude Desktop → Route A (recommended), Route B, Route C, Route D.
   - Any other MCP client → Route B, Route C, Route D (Route A is Claude Desktop only).
   - No MCP client available → Route D.
5. Confirm the user's installed Blender version against per-route minimums (do NOT apply Route B's 5.1+ to other routes).
6. Apply source-confidence labels (`verified-read` / `linked-only` / `unknown`) to each route reference.
7. Record local known/unknown setup signals without overclaiming.
8. Build readiness checklist with explicit pass/warn/block items per chosen route.
9. Mark runtime execution status as Not Run until readiness checker confirms.
10. Provide upstream links for exact/current setup details per route.
11. Enforce single-client constraint: warn if user has multiple route servers configured for the same Blender instance.
12. Summarize what is verified vs linked-only and what to do next.

## Decision tree
- If user only needs planning now → planning mode; keep runtime Not Run.
- If user is on Claude Desktop and wants lowest friction → recommend Route A.
- If user is on Blender 5.1+ and wants Blender Foundation's MCP server → Route B.
- If user is on a non-Claude MCP client (Cursor/Codex/OpenCode/Cline) OR wants Hyper3D/Hunyuan3D/Poly Haven/Sketchfab integrations → Route C (read `../../docs/unofficial-runtime-bridges.md` first).
- If MCP is unavailable or scripted batch processing fits the task → Route D.
- If user requests runtime eval now and readiness is unknown → run readiness checker first.
- If runtime signals are blocked → return blocked setup summary + next setup actions.

## Playbooks
- Playbook A: text-only planning path
- Playbook B: runtime-ready path with evidence gating
- Playbook C: blocked runtime path with caveat-first reporting

## Mode handling

### Text-only mode
- produce setup/readiness guidance only
- no runtime execution claims
- status uses Not Run for runtime artifacts

### Runtime-ready mode
- only after readiness checker reports Ready/Partially Ready
- still no artifact claims without evidence

### Blocked runtime mode
- explicit blockers listed
- no execution attempt claim
- provide official-link next steps

## Validation checklist
- [ ] official runtime hierarchy present
- [ ] confidence labels present
- [ ] project-local default stated
- [ ] global changes require explicit user approval
- [ ] no non-official runtime references
- [ ] no runtime-executed claim
- [ ] blockers or unknowns explicitly listed
- [ ] next actions actionable
- [ ] plain-language user summary present
- [ ] no custom runtime ownership phrasing

## Pass / Warn / Fail rubric

| Category | Pass | Warn | Fail |
|---|---|---|---|
| Official runtime references | All 3 official refs present | 1-2 refs present with caveat | Non-official path used |
| Source confidence | All refs labeled | Partial labeling | No labeling |
| Runtime boundary | No install/run overclaim | Mild ambiguity corrected | Runtime claimed working without evidence |
| Install scope safety | Project-local default + approval guard | Scope partially documented | Global mutation implied by default |

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
“Selected official path: Claude Connector. Source confidence: mixed. Runtime status: Not Run. Next: verify local connector config, then run readiness checker.”

## Bad examples
“Setup complete and runtime works now.” (no checks/evidence)

## User-facing response template
- Selected official runtime path
- Why this path fits your context
- What is verified now
- What remains unverified
- Next setup step

## Anti-patterns
- skipping required laws or runtime boundary statements
- claiming runtime/artifact success without evidence
- using non-official runtime setup paths
- producing jargon-heavy final output without explanation

## Cross-skill handoff
- Next: `official-runtime-readiness-checker`
- Then: `product-hero-scene-planner`

## Non-goals
- runtime installer creation
- runtime execution automation
- custom runtime ownership

## References
- 4-route runtime model: ../../docs/runtime-stack-strategy.md
- Per-route setup details: ../../docs/external-runtime-setup.md
- Route C caveats: ../../docs/unofficial-runtime-bridges.md
- Route A source: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- Route B source: https://www.blender.org/lab/mcp-server/
- Route C source: https://github.com/ahujasid/blender-mcp
- Route D source: https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
