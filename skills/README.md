# BlendOps Skills Collection

> [!NOTE]
> Status: 2.0.0. 14 skills for Blender workflow planning, runtime readiness, evidence truth, and user-facing handoff. v2.0.0 merged the former 48 narrow skills into these 14; each former skill now lives as a reference file inside its new skill.

BlendOps skills are composable operating units. They load only when relevant, follow shared laws, preserve runtime boundaries, and hand off to the next skill instead of becoming one monolithic Blender prompt. Each skill keeps a short `SKILL.md` and loads its detailed playbooks from `references/` only when that step is in scope.

Core guide: [docs/skill-system.md](../docs/skill-system.md)

---

## Skill philosophy

| Principle | Required behavior |
|---|---|
| Few, focused skills | One skill per job a user recognizes; detail lives in one-level-deep references. |
| Evidence-bound | Runtime/artifact claims require recorded evidence. |
| Runtime-separated | Skill install does not install Blender or runtime bridges. |
| Evidence-safe | Keep `Not Run`, `Not Produced`, and truth-state caveats visible. |
| Portable | Keep core skill logic tool-agnostic; adapters map to target agents later. |

### Routing across the 4 `skills.sh.json` groups

| Group | Skills |
|---|---|
| **Start & Scope** | `blendops-start`, `blendops-brief`, `blendops-done-criteria` |
| **Scene Planning** | `blendops-product-shot`, `blendops-scene-plan`, `blendops-camera`, `blendops-lighting-materials`, `blendops-render-settings` |
| **Assets & Web 3D** | `blendops-assets`, `blendops-glb-budget`, `blendops-glb-web-handoff` |
| **Runtime & Verification** | `blendops-connect-blender`, `blendops-final-check`, `blendops-fix-problems` |

Start with `blendops-start` when unsure. Routing participants, in precedence order: `blendops-brief` (no recipe yet), `blendops-done-criteria` (recipe chosen, prerequisites not checked), `blendops-start` (ready, route by stage).

---

## Current skill inventory

| Skill | Purpose | Merged from (now in `references/`) | Eval |
|---|---|---|---|
| [`blendops-start`](./blendops-start/SKILL.md) | Entry point for BlendOps: pick the next stage from current artifacts and evidence, and keep every user-facing reply in plain language with honest truth states. | `workflow-stage-router`, `blendops-help`, `plain-language-response` | [EVAL](./blendops-start/EVAL.md) |
| [`blendops-brief`](./blendops-brief/SKILL.md) | Turn a vague or clear 3D goal into a locked brief, pick or decompose a recipe, and say whether the goal fits BlendOps. | `recipe-fit-assessor`, `intent-to-3d-brief-writer`, `blender-brainstorming`, `blender-recipe-decomposer` | [EVAL](./blendops-brief/EVAL.md) |
| [`blendops-done-criteria`](./blendops-done-criteria/SKILL.md) | Check pack prerequisites, write measurable done criteria and stage gates, and guard the locked scope against creep. | `pack-prerequisite-checker`, `done-criteria`, `stage-gates`, `acceptance-criteria-builder`, `scope-guard` | [EVAL](./blendops-done-criteria/EVAL.md) |
| [`blendops-product-shot`](./blendops-product-shot/SKILL.md) | Plan single-product hero shots and multi-product grid or catalog scenes, including staging, camera, lighting, and output targets. | `product-hero-scene-planner`, `product-grid-scene-planner` | [EVAL](./blendops-product-shot/EVAL.md) |
| [`blendops-scene-plan`](./blendops-scene-plan/SKILL.md) | Plan character portraits, environment shots, and interior scenes from a locked brief, with stage gates and evidence expectations. | `character-portrait`, `environment-shot`, `interior-scene` | [EVAL](./blendops-scene-plan/EVAL.md) |
| [`blendops-camera`](./blendops-camera/SKILL.md) | Plan camera, composition, resolution, and aspect ratio, and check framing quality against written criteria. | `camera-composition`, `composition-quality-checker`, `resolution-aspect-decision` | [EVAL](./blendops-camera/EVAL.md) |
| [`blendops-lighting-materials`](./blendops-lighting-materials/SKILL.md) | Plan lighting, materials, and color management, and check lighting and material quality against written criteria. | `lighting-material-plan`, `lighting-quality-checker`, `material-quality-checker`, `color-management-decision` | [EVAL](./blendops-lighting-materials/EVAL.md) |
| [`blendops-render-settings`](./blendops-render-settings/SKILL.md) | Choose Cycles or EEVEE and the output format for stills, sequences, video, or GLB based on the delivery target. | `cycles-vs-eevee-decision`, `output-format-decision` | [EVAL](./blendops-render-settings/EVAL.md) |
| [`blendops-assets`](./blendops-assets/SKILL.md) | Find assets, clear licenses, check style fit, plan fallbacks, and organize a reusable asset library. | `asset-discovery`, `asset-license-checker`, `asset-style-check`, `asset-fallback-strategy`, `asset-library-plan` | [EVAL](./blendops-assets/EVAL.md) |
| [`blendops-glb-budget`](./blendops-glb-budget/SKILL.md) | Set and check polycount, texture, and file-size budgets for GLB delivery on web and mobile. | `mobile-glb-budget`, `polycount-budget-checker` | [EVAL](./blendops-glb-budget/EVAL.md) |
| [`blendops-glb-web-handoff`](./blendops-glb-web-handoff/SKILL.md) | Prepare GLB handoff to web teams, including animation clips and a React Three Fiber component plan. | `glb-web-handoff`, `glb-animation-handoff`, `r3f-component-plan` | [EVAL](./blendops-glb-web-handoff/EVAL.md) |
| [`blendops-connect-blender`](./blendops-connect-blender/SKILL.md) | Pick a runtime path (Lab MCP, mcp-for-blender, or CLI fallback), guide setup, check readiness, and resolve bridge conflicts. | `runtime-readiness`, `runtime-setup`, `runtime-path-picker`, `path-one-host-outline`, `bridge-conflicts`, `cli-appendix-job-outline` | [EVAL](./blendops-connect-blender/EVAL.md) |
| [`blendops-final-check`](./blendops-final-check/SKILL.md) | Check scene readiness, collect render and export evidence, write preview and runtime-attempt reports, and verify before handoff. | `pre-handoff-verification`, `scene-readiness`, `render-export-evidence`, `preview-report`, `runtime-attempt-report` | [EVAL](./blendops-final-check/EVAL.md) |
| [`blendops-fix-problems`](./blendops-fix-problems/SKILL.md) | Diagnose wrong-looking renders, exports, and runtime errors in plain language and route to the fix without claiming results. | `blender-troubleshooting` | [EVAL](./blendops-fix-problems/EVAL.md) |

---

## Expected folder structure

```txt
skills/
├─ README.md
├─ _template/
│  └─ SKILL.md
├─ <skill-name>/
│  ├─ SKILL.md
│  ├─ references/   # optional, only when useful
│  ├─ evals/        # optional, only when useful
│  └─ assets/       # optional, only when useful
```

Do not create empty placeholder subfolders. Add references/assets/scripts only when they carry real reusable value.

---

## SKILL.md contract

Every real root skill should include:

- YAML frontmatter: `name` (kebab-case, ≤64 chars) and `description` (≤200 chars to clear the Claude.ai upload UI limit). Upstream requires `name` + `description` and allows additional metadata; BlendOps packaging additionally forbids `version`, `status`, `tags`, `allowed-tools`, and other non-spec keys in any uploadable SKILL.md (Claude.ai upload contract), and the docs:check script enforces the BlendOps subset.
- `## Purpose`
- `## When to use`
- `## When not to use`
- `## Trigger phrases`
- `## Official runtime boundary`
- `## Mode handling`
- `## Validation checklist`
- `## Pass / Warn / Fail rubric`
- `## Cross-skill handoff`
- evidence/caveat output fields
- required law links
- references to runtime/eval docs when relevant

Start from [`_template/SKILL.md`](./_template/SKILL.md).

---

## Naming rules

| Rule | Example |
|---|---|
| Use kebab-case folder names | `blendops-final-check` |
| Match `name` to folder slug | `name: blendops-final-check` |
| Prefer domain/action names | `blendops-lighting-materials` |
| Avoid duplicate aliases unless packaging requires them | Use canonical role notes instead. |

---

## Trigger rules

- Use `blendops-start` when the next action is unclear.
- Use readiness skills before runtime mutation/render/export.
- Use planning skills before runtime execution.
- Use evidence skills before artifact claims.
- Use handoff skills after evidence state is known.

If multiple skills could apply, load the routing/help skill first or choose the narrowest skill that answers the current request.

---

## Evidence-before-done rules

Every skill must preserve these states:

| State | Meaning |
|---|---|
| `Not Run` | No runtime attempt happened. |
| `Attempted` | Runtime was tried but evidence is incomplete or blocked. |
| `Produced` | A file/visible output exists but validation is incomplete. |
| `Verified` | Output exists and passed stated validation checks. |
| `Failed` | Attempt did not meet stated criteria. |

No preview/render/GLB claim is valid without output path or visible evidence plus validation notes.

---

## Runtime boundary rules

- Skills do not install Blender.
- Skills do not run Blender unless the user explicitly requests runtime work and readiness is satisfied.
- Skill install is separate from runtime install.
- The 2-path + CLI appendix runtime model lives in [`docs/runtime-stack-strategy.md`](../docs/runtime-stack-strategy.md):
  - **Path 1 — Official Blender Lab MCP** (Lab add-on + Lab server installed in Blender 5.1+, hosted from either (a) Anthropic Blender Connector in Claude Desktop, or (b) any other MCP client configured manually). Anthropic Connector is **not** standalone — Anthropic's tutorial step 2 tells you to install the Lab add-on inside Blender.
  - **Path 2 — Community `mcp-for-blender`** (different `addon.py` + server via `uvx mcp-for-blender`, mature third-party, Blender 3.0+).
  - **CLI fallback (appendix)** — direct `blender --background --python`, no MCP. **Documented upstream** as a first-class Blender CLI surface; see the [scoped mech-prop CLI eval](https://github.com/ThanhNguyxnOrg/blendops/blob/main/docs/evals/cli-fallback-mech-prop.md).
- Skills must name the path explicitly (and Path 1 host option a/b when relevant) and must apply Blender 5.1+ to all of Path 1 (whichever host).
- Single-bridge constraint: Blender accepts one MCP bridge session per Blender instance. Skills must warn if Path 1 + Path 2 are both configured for the same Blender instance.

Runtime docs:

- [Runtime stack strategy](../docs/runtime-stack-strategy.md)
- [External runtime setup](../docs/external-runtime-setup.md)
- [Reference runtime](../docs/reference-runtime.md)
- [Unofficial runtime bridges](../docs/unofficial-runtime-bridges.md)

---

## How to add a new skill

1. Copy `skills/_template/SKILL.md` into `skills/<new-skill>/SKILL.md`.
2. Keep the skill narrow and composable.
3. Fill trigger/skip conditions with concrete phrases.
4. Define required inputs and output contract.
5. Add runtime/evidence status handling.
6. Link required laws and relevant docs.
7. Add to this README only when useful.
8. Add to a pack only when it belongs in that workflow.
9. Update `scripts/check-docs.mjs` if the skill becomes required.
10. Run `npm run docs:check`.

---

## Packaging later

Future packaging should map this canonical source to target surfaces without duplicating skill logic.

| Target | Current stance |
|---|---|
| Claude Desktop | Future user-managed skill bundle; connector setup separate. |
| Claude Code | Project-local first; native path remains environment-scoped. |
| OpenCode | Research install options before claiming tool-native support. |
| Cursor | Project-local first (`.cursor/rules/*.mdc` or `AGENTS.md`, verified-read); native path remains environment-scoped. |
| Codex | `AGENTS.md` discovery verified; project-local instruction files. |
| Gemini | Future adapter; not researched enough for support claim. |

No packaged skill, plugin listing, marketplace listing, or release availability should be marked complete until verified.

---

## Review gate dependency

| Gate source | Applies to | Expected result |
|---|---|---|
| `skill-reviews/review-gates.md` | All promoted root skills | Pass before promotion, or record explicit warnings |
| Per-skill `EVAL.md` | Individual skill behavior | Text-only baseline checks pass |
| Pack manifest | Composed pack behavior | Laws, skill order, eval expectations stay aligned |
