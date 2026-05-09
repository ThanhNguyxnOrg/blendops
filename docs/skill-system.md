# BlendOps Skill System

Status: Draft v0  
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

## How skills relate to laws, packs, evals, and runtime stacks

| Layer | Role | Example |
|---|---|---|
| Laws | Non-negotiable guardrails shared by every skill. | `laws/evidence-before-done.md` blocks artifact overclaims. |
| Skills | Focused workflows loaded by an agent when relevant. | `skills/product-hero-scene-planner/SKILL.md` plans a product hero scene. |
| Packs | Curated skill/law bundles for a scenario. | `packs/product-hero-v0/PACK.md` composes Draft v0 product-hero work. |
| Evals | Evidence records and checklists. | `docs/evals/runtime-availability-checklist.md`. |
| Runtime paths | External execution choices, separate from skill install. | Path 1 Official Blender Lab MCP (host: Anthropic Connector OR manual MCP client), Path 2 community `ahujasid/blender-mcp`, CLI fallback (publisher not verified). |

A skill may point to runtime docs, but it must not imply runtime was installed or run.

---

## Skill families

| Family | Purpose | Current examples |
|---|---|---|
| Workflow skills | Route goals, plan next steps, and coordinate handoffs. | `blendops-help`, `non-blender-user-response-writer` |
| Blender domain skills | Plan scene content, composition, camera, lighting, material, and quality. | `product-hero-scene-planner`, `blender-composition-camera-planner`, `blender-lighting-material-planner`, `blender-scene-quality-checker` |
| Runtime/eval skills | Check readiness and preserve runtime truth. | `official-runtime-setup-guide`, `official-runtime-readiness-checker` |
| Evidence skills | Verify artifact truth before claims. | `render-export-evidence`, `glb-web-handoff` |
| Packaging/adapter skills | Future install/package helpers for target agents. | Not packaged yet; tracked in install/distribution docs. |

---

## Canonical skill map

All 16 root skills, grouped by canonical role. The full per-skill table with depth and gate-review status lives in [`skills/README.md`](../skills/README.md).

| Canonical role | Active skill path | Notes |
|---|---|---|
| Help / next safe action | `skills/blendops-help/SKILL.md` | Routes between docs, skills, runtime readiness, evals, and packaging. Baseline eval: `skills/blendops-help/EVAL.md`. |
| Brainstorming (intent exploration) | `skills/blender-brainstorming/SKILL.md` | Socratic intent exploration before brief writer; Superpowers `/brainstorming` analog. |
| 3D brief writer | `skills/intent-to-3d-brief-writer/SKILL.md` | Convert confirmed intent into an 8-slot structured 3D brief; BMad analysis-phase analog. |
| Asset discovery | `skills/blender-asset-discovery-planner/SKILL.md` | Per-asset strategy (procedural / library / generative / photogrammetry) before scene planner. |
| Runtime setup prerequisites | `skills/official-runtime-setup-guide/SKILL.md` | Canonical role: `runtime-setup`; chooses Path 1 (host a or b) / Path 2 / CLI prerequisites without installing Blender. |
| Runtime readiness | `skills/official-runtime-readiness-checker/SKILL.md` | Canonical role: `runtime-readiness`; keep per-path + per-host boundaries. |
| Bridge-conflict resolution | `skills/runtime-bridge-conflict-resolver/SKILL.md` | Diagnose Single-bridge constraint conflicts (Path 1 + Path 2 + port `9876`); BlendOps-specific. |
| Scene planning | `skills/product-hero-scene-planner/SKILL.md` | Canonical role for product-hero scene planning. |
| Camera / lighting / composition | `skills/blender-composition-camera-planner/SKILL.md`, `skills/blender-lighting-material-planner/SKILL.md` | Domain planning, no runtime claim. |
| Scene quality gate | `skills/blender-scene-quality-checker/SKILL.md` | Pass/Warn/Fail readiness verdict before runtime mutation. |
| Troubleshooting | `skills/blender-troubleshooting/SKILL.md` | Structured 4-phase root-cause analysis when output looks wrong; Superpowers `/systematic-debugging` analog. |
| Render/export evidence | `skills/render-export-evidence/SKILL.md` | Artifact truth ledger for preview/render/GLB evidence. Baseline eval: `skills/render-export-evidence/EVAL.md`. |
| Pre-handoff verification | `skills/pre-handoff-verification/SKILL.md` | 7-point evidence gate before any "ready" / `Verified` claim; Superpowers `/verification-before-completion` analog. |
| GLB handoff | `skills/glb-web-handoff/SKILL.md` | Web handoff language after evidence state is known. |
| Plain-language final response | `skills/non-blender-user-response-writer/SKILL.md` | Stakeholder-friendly summary after evidence state is known. |

Do not create duplicate alias folders unless packaging evidence shows a target agent needs them.

---

## Runtime path boundaries every skill must preserve

BlendOps runtime guidance uses **two MCP execution paths** plus a **CLI fallback appendix** (replaces older 3-stack and 4-route drafts; see [`runtime-stack-strategy.md`](./runtime-stack-strategy.md) for the corrected attribution history):

1. **Path 1 — Official Blender Lab MCP** (Lab add-on + Lab server installed in Blender 5.1+, hosted from either (a) Anthropic Blender Connector in Claude Desktop, or (b) any other MCP client configured manually). The Anthropic Connector is **not** a separate path — it is one host option for Path 1, and the Lab add-on inside Blender is required either way.
2. **Path 2 — Community `ahujasid/blender-mcp`** (different `addon.py` + server via `uvx blender-mcp`, mature 21K+ stars third-party, Blender 3.0+).
3. **CLI fallback (appendix)** — direct `blender --background --python`, no MCP, **publisher has not verified** in this repository.

Skills must not present Anthropic Connector as a separate runtime that needs no Blender-side install. Skills must apply Blender 5.1+ to all of Path 1 (whichever host). Skills must label CLI as appendix, not peer.

Single-bridge constraint: Blender accepts one MCP bridge session per Blender instance. Skills must warn if Path 1 + Path 2 are both configured for the same Blender instance.

---

## How an agent should decide which skill to load

Use the smallest skill that can safely move the work forward.

| User intent | Load first | Then hand off to |
|---|---|---|
| “What should I do next?” | `blendops-help` | Readiness, planning, evidence, or packaging docs. |
| “Can I run Blender?” | `official-runtime-readiness-checker` | Runtime stack docs and manual eval packet. |
| “Plan this scene” | `product-hero-scene-planner` | Composition/lighting/material planners. |
| “Check this scene plan” | `blender-scene-quality-checker` | Response writer or evidence skill. |
| “Did render/export/GLB succeed?” | `render-export-evidence` | `glb-web-handoff` and response writer. |
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

| Target | Draft v0 package stance |
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
├─ README.md
├─ _template/
│  └─ SKILL.md                      # placeholder, excluded from export + spec checks
├─ blendops-help/
│  ├─ SKILL.md
│  └─ EVAL.md
├─ blender-brainstorming/
│  ├─ SKILL.md
│  └─ EVAL.md
├─ intent-to-3d-brief-writer/
│  ├─ SKILL.md
│  └─ EVAL.md
├─ blender-asset-discovery-planner/
│  ├─ SKILL.md
│  └─ EVAL.md
├─ official-runtime-setup-guide/
│  ├─ SKILL.md
│  └─ EVAL.md
├─ official-runtime-readiness-checker/
│  ├─ SKILL.md
│  └─ EVAL.md
├─ runtime-bridge-conflict-resolver/
│  ├─ SKILL.md
│  └─ EVAL.md
├─ product-hero-scene-planner/
│  ├─ SKILL.md
│  └─ EVAL.md
├─ blender-composition-camera-planner/
│  ├─ SKILL.md
│  └─ EVAL.md
├─ blender-lighting-material-planner/
│  ├─ SKILL.md
│  └─ EVAL.md
├─ blender-scene-quality-checker/
│  ├─ SKILL.md
│  └─ EVAL.md
├─ blender-troubleshooting/
│  ├─ SKILL.md
│  └─ EVAL.md
├─ render-export-evidence/
│  ├─ SKILL.md
│  └─ EVAL.md
├─ pre-handoff-verification/
│  ├─ SKILL.md
│  └─ EVAL.md
├─ glb-web-handoff/
│  ├─ SKILL.md
│  └─ EVAL.md
└─ non-blender-user-response-writer/
   ├─ SKILL.md
   └─ EVAL.md
```

Every active skill ships with both `SKILL.md` (operating contract) and `EVAL.md` (text-only baseline eval). Optional `references/` or `assets/` subfolders should be created only when they contain real reusable material.

---

## How to add a new skill

1. Start from `skills/_template/SKILL.md`.
2. Keep the skill narrow and composable.
3. Add precise trigger and skip conditions.
4. Link required laws and runtime docs.
5. Define input, output, evidence, and handoff contracts.
6. Add the skill to `skills/README.md` only when it is real and useful.
7. Add it to `packs/product-hero-v0/PACK.md` only if it belongs in that pack.
8. Update `scripts/check-docs.mjs` if the skill becomes required for Draft v0 checks.
9. Run `npm run docs:check`.

---

## Quality checklist

- [ ] Skill has clear frontmatter and a concise description.
- [ ] Trigger conditions are specific.
- [ ] “When not to use” prevents overreach.
- [ ] Runtime stack requirements are explicit.
- [ ] Evidence requirements are concrete.
- [ ] Output contract is easy to verify.
- [ ] Handoff points name the next skill/doc.
- [ ] No runtime or artifact success claim appears without evidence.
- [ ] No unofficial bridge is promoted as official.
- [ ] No marketplace/plugin/package availability is claimed without verification.
