# Eval Result: Cyberpunk Shoe Hero v0 Runtime Eval

Status: Blocked / Runtime unavailable

> [!WARNING]
> **Historical eval — environment-specific evidence, not reproducible from a clean clone. Legacy Stack labels superseded 2026-05-08 by the 2-path + CLI appendix model.**
>
> 1. **Blender 4.2.5 reported below maps as follows under the 2-path + CLI appendix model** (see [`docs/runtime-stack-strategy.md`](../runtime-stack-strategy.md)):
>    - **Insufficient for Path 1** (Official Blender Lab MCP — Lab add-on requires Blender 5.1+, regardless of which host you pick: Anthropic Connector or manual MCP). An earlier WARNING in this file claimed 4.2.5 was sufficient for the Anthropic Connector path; that was wrong because the Connector still requires the Lab add-on inside Blender, which is 5.1+.
>    - **Sufficient for Path 2** (community `ahujasid/blender-mcp`, Blender 3.0+).
>    - **Sufficient for CLI fallback** (Blender 4.2+ recommended), but **publisher has not verified** that path in-repo.
>
>    The "Blender installed: Pass" row below reflects local CLI availability at eval time, not Path 1 readiness.
> 2. **Pre-existing artifact files referenced in this eval (`renders/preview.png`, `exports/test_scene.fbx`, `exports/test_scene.glb`) are gitignored** (see [`.gitignore`](../../.gitignore) lines 12–13, 31–33). They do NOT ship in the cloned repo. They were observed locally at eval time and are explicitly NOT counted as fresh runtime-eval evidence here. External verifiers cannot reproduce these paths from a clean clone.

## Purpose

Evaluate whether the v0 product hero pack works with official runtime paths.

## Runtime path attempted

- Official Claude Blender Connector
- Official Blender MCP Server
- Blender CLI reference

Per-path status:

1. **Official Claude Blender Connector**
   - attempted: readiness check only
   - status: unavailable / unknown
   - evidence: local Claude Desktop config file exists, but no connector runtime configuration entries were found in this environment

2. **Official Blender MCP Server**
   - attempted: readiness check only
   - status: unavailable / unknown
   - evidence: no repository MCP configuration file (`.mcp.json`) present; no confirmed local official MCP runtime path for this eval

3. **Blender CLI reference**
   - attempted: yes (local executable probe)
   - status: available as reference
   - evidence: `C:\Program Files\Blender Foundation\Blender 4.2\blender.exe --version` returned Blender 4.2.5 LTS

## Setup/readiness checks

| Check | Status | Evidence | Notes |
|---|---|---|---|
| Blender installed | Pass | Blender 4.2.5 LTS version output from local executable | Blender executable exists at known path, though not available via `blender` command in PATH |
| official runtime path available | Warn | Official docs links present in active docs | Local executable path exists for CLI reference; connector/MCP execution paths not confirmed |
| connector/MCP reachable | Fail | Claude config has preferences only; no repo `.mcp.json` | No confirmed connector/MCP runtime channel available for this eval run |
| execution possible | Fail | Runtime channel for official connector/MCP not confirmed | Runtime eval execution blocked |
| artifact output path available | Pass | `renders/` and `exports/` directories exist | Existing files are pre-existing and not treated as fresh runtime-eval outputs |

## Prompt used

“Create a cyberpunk shoe web hero with a floating shoe, neon lights, glossy dark floor, cinematic camera, export GLB, and give me web usage guidance.”

## BlendOps units applied

- laws/official-runtime-only
- laws/no-arbitrary-python-interface
- laws/evidence-before-done
- laws/non-blender-user-language
- skills/official-runtime-setup-guide
- skills/product-hero-scene-planner
- skills/blender-scene-quality-checker
- skills/glb-web-handoff
- skills/non-blender-user-response-writer
- workflow/product-hero-workflow
- recipe/cyberpunk-shoe-hero
- pack/v0-product-hero-pack

## Execution log / evidence

This run was **blocked before runtime execution**.

Evidence gathered:
- Blender command in PATH: not found
- Blender executable path check: found (`C:\Program Files\Blender Foundation\Blender 4.2\blender.exe`)
- Blender version call: successful (4.2.5 LTS)
- Claude Desktop config: present at `C:\Users\Admin\AppData\Roaming\Claude\claude_desktop_config.json`
- Claude config connector entries: none found
- Repository MCP config (`.mcp.json`): not found
- Existing artifact directories:
  - `renders/preview.png`
  - `exports/test_scene.fbx`
  - `exports/test_scene.glb`

Important:
- No official runtime execution path was successfully established.
- No new preview/render/GLB output was produced by this eval run.
- Existing files above are treated as pre-existing, not new runtime-eval evidence.

## Rubric result

| Category | Status | Notes |
|---|---|---|
| official-runtime-only compliance | Pass | Only official runtime paths were considered. |
| no arbitrary Python final interface | Pass | No arbitrary-code user interface was used or proposed. |
| evidence-before-done compliance | Pass | Runtime blockage and missing execution evidence are explicitly reported. |
| non-Blender-user language | Pass | Findings are presented in plain language with actionable next steps. |
| scene plan completeness | Warn | Runtime execution blocked; this eval did not test plan-to-runtime transition. |
| composition clarity | Warn | Not runtime-tested in this run. |
| lighting/material/camera plan quality | Warn | Not runtime-tested in this run. |
| validation checklist quality | Warn | Runtime validation stage could not be executed. |
| GLB/web handoff clarity | Warn | Handoff guidance exists, but runtime artifact evidence from this run is unavailable. |
| runtime artifact evidence | Fail | No runtime execution, no newly produced artifacts. |

## Final verdict

**Blocked — runtime unavailable, setup required**.

## Required changes

- laws: no mandatory changes from this blocked run
- skills: no mandatory changes from this blocked run
- workflow: no mandatory changes from this blocked run
- recipe: no mandatory changes from this blocked run
- pack: no mandatory changes from this blocked run
- runtime setup docs:
  - document a minimal local readiness checklist for confirming official connector/MCP path availability before manual runtime eval
  - keep distinction between existing files and fresh eval-generated evidence explicit
