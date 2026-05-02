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
| Runtime stacks | External execution choices, separate from skill install. | Stack 1 connector, Stack 2 CLI fallback, Stack 3 optional local experiment. |

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

| Canonical role | Active skill path | Notes |
|---|---|---|
| Help / next safe action | `skills/blendops-help/SKILL.md` | Routes between docs, skills, runtime readiness, evals, and packaging. Baseline eval: `skills/blendops-help/EVAL.md`. |
| Runtime readiness | `skills/official-runtime-readiness-checker/SKILL.md` | Canonical role: `runtime-readiness`; keep 3-stack boundaries. |
| Scene planning | `skills/product-hero-scene-planner/SKILL.md` | Canonical role for product-hero scene planning. |
| Camera / lighting / composition | `skills/blender-composition-camera-planner/SKILL.md`, `skills/blender-lighting-material-planner/SKILL.md` | Domain planning, no runtime claim. |
| Render/export evidence | `skills/render-export-evidence/SKILL.md` | Artifact truth ledger for preview/render/GLB evidence. Baseline eval: `skills/render-export-evidence/EVAL.md`. |
| GLB handoff | `skills/glb-web-handoff/SKILL.md` | Web handoff language after evidence state is known. |

Do not create duplicate alias folders unless packaging evidence shows a target agent needs them.

---

## Runtime stack boundaries every skill must preserve

BlendOps public runtime guidance uses exactly three stacks:

1. **Stack 1 — Claude Desktop official connector stack**: Claude Desktop Blender Connector plus official Blender MCP bridge/add-on inside Blender plus Blender app/session.
2. **Stack 2 — Official Blender CLI fallback**: explicit Blender executable / CLI invocation, no MCP, no Claude Desktop required.
3. **Stack 3 — Optional unofficial third-party bridge stack**: user-managed, experimental/local, outside official release-eval evidence.

Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

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
│  └─ SKILL.md
├─ blendops-help/
│  └─ SKILL.md
├─ official-runtime-readiness-checker/
│  └─ SKILL.md
├─ product-hero-scene-planner/
│  └─ SKILL.md
├─ blender-composition-camera-planner/
│  └─ SKILL.md
├─ blender-lighting-material-planner/
│  └─ SKILL.md
├─ blender-scene-quality-checker/
│  └─ SKILL.md
├─ render-export-evidence/
│  └─ SKILL.md
├─ glb-web-handoff/
│  └─ SKILL.md
└─ non-blender-user-response-writer/
   └─ SKILL.md
```

Optional `references/`, `evals/`, or `assets/` subfolders should be created only when they contain real reusable material.

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
