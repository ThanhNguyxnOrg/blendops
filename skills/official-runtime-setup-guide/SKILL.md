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
- This skill recognizes **two MCP execution paths plus a CLI fallback appendix** (see `../../docs/runtime-stack-strategy.md`):
  - **Path 1 — Official Blender Lab MCP** (Lab add-on + Lab server installed in Blender 5.1+, hosted from either (a) Anthropic Blender Connector in Claude Desktop OR (b) any other MCP client configured manually). Anthropic Connector is **not** standalone — Anthropic's tutorial step 2 tells you to install the Lab add-on inside Blender, so Lab is required for Path 1 regardless of host. Sources: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude (host a), https://www.blender.org/lab/mcp-server/ (Blender side, both hosts).
  - **Path 2 — Community `ahujasid/blender-mcp`** (different `addon.py` + server via `uvx blender-mcp`, mature 21K+ stars third-party, min Blender 3.0+). Source: https://github.com/ahujasid/blender-mcp
  - **CLI fallback (appendix)** — direct `blender --background --python`, no MCP. **BlendOps publisher has not verified this path in-repo.** Documented for completeness only. Source: https://docs.blender.org/manual/en/latest/advanced/command_line/index.html

## Operating procedure
1. Confirm user objective and whether runtime execution is needed now.
2. Confirm install mode preference (project-local default, global only if explicit).
3. Detect likely client (Claude Desktop / Claude Code / Cursor / Codex / OpenCode / Cline / generic).
4. Map client → applicable paths:
   - Claude Desktop → Path 1 host (a) Anthropic Connector (recommended for one-click), Path 1 host (b) manual MCP, Path 2, CLI fallback.
   - Any other MCP client → Path 1 host (b) manual MCP, Path 2, CLI fallback (Anthropic Connector host (a) is Claude Desktop only).
   - No MCP client available → CLI fallback only (and warn it is not publisher-verified).
5. Confirm the user's installed Blender version against per-path minimums:
   - **Path 1 (either host) → Blender 5.1+** (Lab add-on `blender_version_min = 5.1.0`). Anthropic's tutorial says "4.2+" but the add-on it requires is 5.1+, so 5.1+ is the binding floor.
   - Path 2 → Blender 3.0+.
   - CLI fallback → Blender 4.2+ recommended; not publisher-verified.
6. Apply source-confidence labels (`verified-read` / `linked-only` / `unknown`) to each path reference.
7. Record local known/unknown setup signals without overclaiming.
8. Build readiness checklist with explicit pass/warn/block items per chosen path + host.
9. Mark runtime execution status as Not Run until readiness checker confirms.
10. Provide upstream links for exact/current setup details per path.
11. Enforce single-bridge constraint: warn if Path 1 + Path 2 are both configured against the same Blender instance, or if both Path 1 host options (a) and (b) target the same Blender instance.
12. Summarize what is verified vs linked-only and what to do next.

## Decision tree
- If user only needs planning now → planning mode; keep runtime Not Run.
- If user is on Claude Desktop and wants lowest friction → Path 1 host (a) Anthropic Connector. Still install Lab add-on in Blender 5.1+.
- If user is on Claude Desktop but cannot use the Connector toggle → Path 1 host (b) manual MCP via Settings → Developer → Edit Config.
- If user is on a non-Claude-Desktop MCP client → Path 1 host (b) manual MCP, OR Path 2 if simpler.
- If user wants Hyper3D/Hunyuan3D/Poly Haven/Sketchfab integrations or is on Blender 3.x/4.x → Path 2 (read `../../docs/unofficial-runtime-bridges.md` first).
- If MCP is unavailable or scripted batch processing fits the task → CLI fallback (warn that publisher has not verified).
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
- 2-path + CLI appendix runtime model: ../../docs/runtime-stack-strategy.md
- Per-path setup details: ../../docs/external-runtime-setup.md
- Path 2 caveats: ../../docs/unofficial-runtime-bridges.md
- Path 1 host (a) source — Anthropic Connector: https://claude.com/resources/tutorials/using-the-blender-connector-in-claude
- Path 1 Blender-side source — Lab MCP (required for both hosts): https://www.blender.org/lab/mcp-server/
- Path 2 source: https://github.com/ahujasid/blender-mcp
- CLI fallback source (not publisher-verified): https://docs.blender.org/manual/en/latest/advanced/command_line/index.html
