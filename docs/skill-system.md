# BlendOps Skill System

Status: 1.0.0  
Scope: portable skill architecture for Blender workflow agents

> [!IMPORTANT]
> BlendOps skills install workflow knowledge. They do **not** install Blender, run Blender, configure runtime bridges, prove runtime success, or prove preview/render/GLB artifacts exist.

---

## What a BlendOps skill is

A BlendOps skill is a portable `SKILL.md`-based operating unit for an AI agent. Each skill answers four questions:

1. **When should this capability activate?**
2. **What inputs and constraints must be known first?**
3. **What workflow should the agent follow?**
4. **What evidence is required before any success claim?**

Skills are intentionally composable. A helper skill routes the task, planning skills produce scene intent, runtime/eval skills check readiness, evidence skills verify outputs, and response skills explain results to non-Blender users.

---

## How skills relate to knowledge records, recipes, laws, packs, evals, and runtime stacks

| Layer | Role | Example |
|---|---|---|
| Laws | Non-negotiable guardrails shared by every skill. | `laws/evidence-before-done.md` blocks artifact overclaims. |
| Skills (`skills/*/SKILL.md`) | Focused operating workflows loaded by an agent when relevant (16 total). | `skills/blendops-product-shot/SKILL.md` plans a product hero scene. |
| Knowledge (`registry/knowledge-catalog.json`) | Source-backed, version-aware 3D domain rules (`knowledge.*`, 30 records across 11 domains) cited by multiple skills and recipes. | `knowledge.principled-bsdf-v2-energy-conserving-pbr`, `knowledge.agx-filmic-color-management-and-cycles-eevee`. |
| Recipes (`registry/recipe-catalog.json`) | Multi-stage composable blueprints (`recipe.*`, 10 canonical recipes) chaining skills and knowledge records for an end-to-end deliverable. | `recipe.product-hero-scene` (bound to `packs/product-hero-v0/PACK.md` and `docs/recipes/cyberpunk-shoe-hero.md`). |
| SceneSpec & Skill Harmonizer (`scripts/compile-scene-plan.mjs`) | Structured intermediate representation (`schemas/scene-spec.schema.json`) compiled into a 7-stage `ExecutionPlan` (`schemas/execution-plan.schema.json`) with an 8-level conflict precedence hierarchy (`1_laws` > `2_runtime_boundary_and_version_floor` > `3_hard_budget_and_export_constraints` > `4_scene_spec_explicit_constraints` > `5_recipe_stage_contracts` > `6_knowledge_record_rules` > `7_skill_heuristics` > `8_aesthetic_defaults`). | `blendops plan-compile evals/scene-specs/cyberpunk-shoe-hero.scene-spec.json` |
| Packs | Curated skill/law bundles for a scenario. | `packs/product-hero-v0/PACK.md` composes product-hero work. |
| Evals & Audits | Deterministic behavioral/retrieval suites and evidence records. | `evals/catalog-retrieval-evals.json`, `evals/scene-specs/*.json`, `docs/audits/skill-architecture-audit.md`, `docs/evals/runtime-availability-checklist.md`. |
| Runtime paths | External execution choices, separate from skill install. | Path 1 Official Blender Lab MCP (host: Anthropic Connector OR manual MCP client), Path 2 community `mcp-for-blender`, CLI fallback (documented upstream as first-class Blender CLI; see the [scoped mech-prop CLI eval](./evals/cli-fallback-mech-prop.md)). |

A skill may point to runtime docs, knowledge records (`knowledge.*`), or recipes (`recipe.*`), but it must not imply runtime was installed or run. See [`knowledge-and-recipe-catalog.md`](./knowledge-and-recipe-catalog.md) for the full catalog and [`audits/skill-architecture-audit.md`](./audits/skill-architecture-audit.md) for the 15-skill and 209-reference classification audit.

---

## Skill families

| Family | Purpose | Current examples |
|---|---|---|
| Workflow skills | Route goals, plan next steps, and coordinate handoffs. | `blendops-start` |
| Blender domain skills | Plan scene content, composition, camera, lighting, material, and quality. | `blendops-product-shot`, `blendops-camera`, `blendops-lighting-materials`, `blendops-final-check` |
| Runtime/eval skills | Check readiness, build in Blender, and preserve runtime truth. | `blendops-connect-blender`, `blendops-build`, `blendops-look-check` |
| Evidence skills | Verify artifact truth before claims. | `blendops-final-check`, `blendops-glb-web-handoff` |
| Packaging/adapter skills | Future install/package helpers for target agents. | Not packaged yet; tracked in install/distribution docs. |

---

## Canonical skill map

All 16 skills, grouped by canonical role (merged from the former 48 narrow skills in v2.0.0). The full per-skill table with depth and gate-review status lives in [`skills/README.md`](../skills/README.md).

| Canonical role | Active skill path | Notes |
|---|---|---|
| Help / next safe action | `skills/blendops-start/SKILL.md` | Routes between docs, skills, runtime readiness, evals, and packaging. Baseline eval: `skills/blendops-start/EVAL.md`. |
| Brainstorming (intent exploration) | `skills/blendops-brief/SKILL.md` | Socratic intent exploration before brief writer; Superpowers `/brainstorming` analog. |
| 3D brief writer | `skills/blendops-brief/SKILL.md` | Convert confirmed intent into an 8-slot structured 3D brief; BMad analysis-phase analog. |
| Asset discovery | `skills/blendops-assets/SKILL.md` | Per-asset strategy (procedural / library / generative / photogrammetry) before scene planner. |
| Runtime setup prerequisites | `skills/blendops-connect-blender/SKILL.md` | Canonical role: `blendops-connect-blender`; chooses Path 1 (host a or b) / Path 2 / CLI prerequisites without installing Blender. |
| Runtime readiness | `skills/blendops-connect-blender/SKILL.md` | Canonical role: `blendops-connect-blender`; keep per-path + per-host boundaries. |
| Bridge-conflict resolution | `skills/blendops-connect-blender/SKILL.md` | Diagnose Single-bridge constraint conflicts (Path 1 + Path 2 + port `9876`); BlendOps-specific. |
| Scene planning | `skills/blendops-product-shot/SKILL.md` | Canonical role for product-hero scene planning. |
| Camera / lighting / composition | `skills/blendops-camera/SKILL.md`, `skills/blendops-lighting-materials/SKILL.md` | Domain planning, no runtime claim. |
| Scene quality gate | `skills/blendops-final-check/SKILL.md` | Pass/Warn/Fail readiness verdict before runtime mutation. |
| Troubleshooting | `skills/blendops-fix-problems/SKILL.md` | Structured 4-phase root-cause analysis when output looks wrong; Superpowers `/systematic-debugging` analog. |
| Render/export evidence | `skills/blendops-final-check/SKILL.md` | Artifact truth ledger for preview/render/GLB evidence. Baseline eval: `skills/blendops-final-check/EVAL.md`. |
| Pre-handoff verification | `skills/blendops-final-check/SKILL.md` | 7-point evidence gate before any "ready" / `Verified` claim; Superpowers `/verification-before-completion` analog. |
| GLB handoff | `skills/blendops-glb-web-handoff/SKILL.md` | Web handoff language after evidence state is known. |
| Plain-language final response | `skills/blendops-start/SKILL.md` | Stakeholder-friendly summary after evidence state is known. |

Do not create duplicate alias folders unless packaging evidence shows a target agent needs them.

---

## Runtime path boundaries every skill must preserve

BlendOps runtime guidance uses **two MCP execution paths** plus a **CLI fallback appendix** (replaces older 3-stack and 4-route drafts; see [`runtime-stack-strategy.md`](./runtime-stack-strategy.md) for the corrected attribution history):

1. **Path 1 — Official Blender Lab MCP** (Lab add-on + Lab server installed in Blender 5.1+, hosted from either (a) Anthropic Blender Connector in Claude Desktop, or (b) any other MCP client configured manually). The Anthropic Connector is **not** a separate path — it is one host option for Path 1, and the Lab add-on inside Blender is required either way.
2. **Path 2 — Community `mcp-for-blender`** (different `addon.py` + server via `uvx mcp-for-blender`, mature third-party, Blender 3.0+).
3. **CLI fallback (appendix)** — direct `blender --background --python`, no MCP. **Documented upstream** as a first-class Blender CLI surface; see the [scoped mech-prop CLI eval](./evals/cli-fallback-mech-prop.md).

Skills must not present Anthropic Connector as a separate runtime that needs no Blender-side install. Skills must apply Blender 5.1+ to all of Path 1 (whichever host). Skills must label CLI as appendix, not peer.

Single-bridge constraint: Blender accepts one MCP bridge session per Blender instance. Skills must warn if Path 1 + Path 2 are both configured for the same Blender instance.

---

## How an agent should decide which skill to load

Use the smallest skill that can safely move the work forward.

| User intent | Load first | Then hand off to |
|---|---|---|
| “What should I do next?” | `blendops-start` | Readiness, planning, evidence, or packaging docs. |
| “Can I run Blender?” | `blendops-connect-blender` | Runtime stack docs and manual eval packet. |
| “Build it in Blender.” | `blendops-build` | Locked scene plan and a ready runtime path. |
| “The preview looks off.” | `blendops-look-check` | A preview from `blendops-build` and the locked scene plan. |
| “Plan this scene” | `blendops-product-shot` | Composition/lighting/material planners. |
| “Check this scene plan” | `blendops-final-check` | Response writer or evidence skill. |
| “Did render/export/GLB succeed?” | `blendops-final-check` | `blendops-glb-web-handoff` and response writer. |
| “Package/install BlendOps” | Install/distribution docs | Future adapter/package skills when verified. |

If runtime status is unknown, check readiness before mutation/render/export. If artifact evidence is missing, keep status `Not Run` or `Not Produced`.

---

## Evidence-before-done rule

Every skill output that discusses runtime or artifacts must include an evidence state.

Allowed artifact/runtime states:

| State | Meaning |
|---|---|
| `Not Run` | No runtime attempt happened. |
| `Attempted` | Runtime was tried, but evidence is incomplete or blocked. |
| `Produced` | A file or visible output exists, but validation is incomplete. |
| `Verified` | Output exists and passed stated validation checks. |
| `Failed` | Attempt did not meet stated criteria. |

Never claim preview/render/GLB exists unless the output path, file existence, and validation notes are recorded.

---

## Skill install vs runtime install

| Install type | What it changes | What it does not prove |
|---|---|---|
| Skill install | Copies or references BlendOps `skills/`, `laws/`, `packs/`, and docs. | Blender availability, connector access, render/export success. |
| Runtime setup | User configures Blender, connector/bridge, or CLI. | Skill package correctness or artifact quality. |
| Eval evidence | Records real actions, outputs, paths, logs, and validation. | Broad production readiness beyond the scoped eval. |

A Claude Desktop Personal Skill import does not configure the Blender connector. A Claude Code/OpenCode/Cursor/Codex/Gemini adapter does not prove direct official MCP support.

For the current paste-this-into-your-agent install path, use [AI Agent Install Flow](./ai-agent-install-flow.md).

---

## Future packaging map

| Target | v1.0.0 package stance |
|---|---|
| Claude Desktop | User-managed skill import or docs attachment; connector setup remains separate. |
| Claude Code | Project-local files first; native skill path remains environment-scoped. |
| OpenCode | Project-local files now; tool-native install only after source-backed verification. |
| Cursor | Project/rules/docs attachment only after path verification. |
| Codex | Generic project instruction fallback until adapter evidence exists. |
| Gemini | Future adapter; keep linked-only/not researched until verified. |

Do not claim packaged skill, plugin listing, marketplace listing, or broad adapter availability until evidence exists for that surface.

---

## Canonical folder structure

```txt
skills/
├─ README.md                       # canonical inventory: all 16 skills by batch
├─ _template/
│  └─ SKILL.md                      # placeholder, excluded from export + spec checks
├─ <skill-name>/                    # one folder per skill (16 total)
│  ├─ SKILL.md
│  └─ EVAL.md
└─ ...                              # see skills/README.md for the full directory list
```

Every active skill ships with both `SKILL.md` (operating contract) and `EVAL.md` (text-only baseline eval). Optional `references/` or `assets/` subfolders should be created only when they contain real reusable material.

---

## How to add a new skill

1. Start from `skills/_template/SKILL.md` and include all 18 required level-2 (`## `) sections enforced by `scripts/check-docs.mjs` (9 core sections: `Purpose`, `When to use`, `When not to use`, `Trigger phrases`, `Official runtime boundary`, `Mode handling`, `Validation checklist`, `Pass / Warn / Fail rubric`, `Cross-skill handoff`; plus 9 extended sections: `Decision tree`, `Playbooks`, `Failure handling`, `Troubleshooting`, `Best practices`, `Good examples`, `Bad examples`, `User-facing response template`, `Anti-patterns`).
2. Keep the skill narrow and composable.
3. Add precise trigger and skip conditions.
4. Link required laws and runtime docs.
5. Define input, output, evidence, and handoff contracts.
6. Add the skill to `skills/README.md` only when it is real and useful.
7. Add it to `packs/product-hero-v0/PACK.md` only if it belongs in that pack.
8. Update `scripts/check-docs.mjs` if the skill becomes required for CI validation.
9. Run `npm run docs:check`.

---

## Quality checklist

- [ ] Skill has clear frontmatter (`name` <= 64 chars, `description` <= 200 chars, no extra keys).
- [ ] All 9 core and 9 extended template sections from `skills/_template/SKILL.md` are present with substantive, role-specific guidance and zero duplicate headings.
- [ ] Trigger conditions are specific.
- [ ] “When not to use” prevents overreach.
- [ ] Runtime stack requirements are explicit.
- [ ] Evidence requirements are concrete (`Runtime status` uses `Not Run` default; `Artifact status` uses `Not Produced` default).
- [ ] Output contract is easy to verify.
- [ ] Handoff points name the next skill/doc.
- [ ] No runtime or artifact success claim appears without evidence.
- [ ] No unofficial bridge is promoted as official.
- [ ] No marketplace/plugin/package availability is claimed without verification.
