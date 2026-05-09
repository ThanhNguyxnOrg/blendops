# BlendOps Skills Collection

> [!NOTE]
> Status: Draft v0. These are portable AI-agent skill units for Blender workflow planning, runtime readiness, evidence truth, and user-facing handoff.

BlendOps skills are composable operating units. They load only when relevant, follow shared laws, preserve runtime boundaries, and hand off to the next narrow skill instead of becoming one monolithic Blender prompt.

Core guide: [docs/skill-system.md](../docs/skill-system.md)

---

## Skill philosophy

| Principle | Required behavior |
|---|---|
| Composable | Prefer narrow skills with explicit handoffs. |
| Evidence-bound | Runtime/artifact claims require recorded evidence. |
| Runtime-separated | Skill install does not install Blender or runtime bridges. |
| Draft-safe | Keep Draft v0, `Not Run`, and `Not Produced` caveats visible. |
| Portable | Keep core skill logic tool-agnostic; adapters map to target agents later. |

---

## Current skill inventory

### 🧭 Help and routing

| Skill | Purpose | Use when | Depth status | Gate review | Eval |
|---|---|---|---|---|---|
| `blendops-help` | Next-step routing across docs, skills, readiness, evidence, packaging, and release status | Goal/status is unclear or multiple skills could apply | Expanded Draft v0 | Pass | [EVAL](./blendops-help/EVAL.md) |

### 🧭 Setup and readiness

| Skill | Purpose | Use when | Depth status | Gate review | Eval |
|---|---|---|---|---|---|
| `official-runtime-setup-guide` | Runtime prerequisite guidance and confidence labels | Runtime setup path is unclear | Expanded Draft v0 | Pass | [EVAL](./official-runtime-setup-guide/EVAL.md) |
| `official-runtime-readiness-checker` | Readiness matrix and blocker reporting; canonical role `runtime-readiness` | Before a runtime eval attempt | Expanded Draft v0 | Pass | [EVAL](./official-runtime-readiness-checker/EVAL.md) |

### 🎬 Planning

| Skill | Purpose | Use when | Depth status | Gate review | Eval |
|---|---|---|---|---|---|
| `product-hero-scene-planner` | Full product-hero scene plan schema; canonical role `scene-planning` for product-hero workflows | User asks for hero scene planning | Expanded Draft v0 | Pass | [EVAL](./product-hero-scene-planner/EVAL.md) |
| `blender-composition-camera-planner` | Composition and camera strategy | Framing or camera decisions need depth | Expanded Draft v0 | Pass | [EVAL](./blender-composition-camera-planner/EVAL.md) |
| `blender-lighting-material-planner` | Lighting/material lookdev plan plus portability caveats | Lookdev strategy is required | Expanded Draft v0 | Pass | [EVAL](./blender-lighting-material-planner/EVAL.md) |

### ✅ Quality and eval

| Skill | Purpose | Use when | Depth status | Gate review | Eval |
|---|---|---|---|---|---|
| `blender-scene-quality-checker` | Pass/warn/fail readiness and verdict | A readiness decision is needed | Expanded Draft v0 | Pass | [EVAL](./blender-scene-quality-checker/EVAL.md) |
| `render-export-evidence` | Preview/render/GLB evidence ledger and artifact truth labels | Artifact status must be proven or downgraded | Expanded Draft v0 | Pass | [EVAL](./render-export-evidence/EVAL.md) |

### 📦 Handoff and communication

| Skill | Purpose | Use when | Depth status | Gate review | Eval |
|---|---|---|---|---|---|
| `glb-web-handoff` | GLB/web handoff status and caveats | Handoff clarity is required | Expanded Draft v0 | Pass | [EVAL](./glb-web-handoff/EVAL.md) |
| `non-blender-user-response-writer` | Plain-language final response | Stakeholder-facing summary is needed | Expanded Draft v0 | Pass | [EVAL](./non-blender-user-response-writer/EVAL.md) |

### 🌐 Web 3D handoff deep (Batch 1, post-v0.1.0-draft)

Each ships with `SKILL.md` + `EVAL.md` + 3 `references/` files.

| Skill | Purpose | Use when | Depth status | Eval | References |
|---|---|---|---|---|---|
| `glb-mobile-performance-budget` | Set explicit triangle / texture / draw-call / file-size / animation budgets per device tier before any export decision | User mentions "mobile" / "phone" / "low-end" / "for the web" | Expanded Draft v0 | [EVAL](./glb-mobile-performance-budget/EVAL.md) | budget-tiers / violation-rules / degradation-plan |
| `glb-animation-handoff` | Document GLB animation contract (skeletal / morph, FPS, looping, root motion, blend) with web-stack caveats | GLB ships with at least one animation clip and consumer is a web app | Expanded Draft v0 | [EVAL](./glb-animation-handoff/EVAL.md) | animation-types / web-stack-caveats / transition-rules |
| `three-fiber-component-shape-planner` | Plan the React Three Fiber component shape (props, refs, Suspense, useGLTF cache, animation hook) before delivering a GLB to the web team | Consumer is using R3F, before component code is written | Expanded Draft v0 | [EVAL](./three-fiber-component-shape-planner/EVAL.md) | component-shape-patterns / suspense-placement-rules / usegltf-caching-rules |
| `preview-report-template-writer` | Generate the structured preview-report Markdown that glb-web-handoff and non-blender-user-response-writer consume | After render-export-evidence produces measurements, before web/final handoff | Expanded Draft v0 | [EVAL](./preview-report-template-writer/EVAL.md) | report-schema / truth-label-rules / handoff-recipients |

### 🧠 Process and discipline (Phase 4 expansion — Superpowers + BMad inspired)

Each ships with `SKILL.md` + `EVAL.md` + 3 `references/` files (templates / playbooks / patterns).

| Skill | Purpose | Use when | Depth status | Eval | References |
|---|---|---|---|---|---|
| `blender-brainstorming` | Socratic intent exploration before planning (Superpowers `/brainstorming` analog) | User request is vague or ambiguous | Expanded Draft v0 | [EVAL](./blender-brainstorming/EVAL.md) | clarification-patterns / alternative-scoping-templates / intent-summary-style-guide |
| `blender-troubleshooting` | 4-phase root-cause analysis when output looks wrong (Superpowers `/systematic-debugging` analog) | Render / GLB / response diverges from intent | Expanded Draft v0 | [EVAL](./blender-troubleshooting/EVAL.md) | four-phase-template / divergence-routing-table / common-symptom-playbooks |
| `pre-handoff-verification` | 7-point evidence gate before any "ready" / `Verified` claim (Superpowers `/verification-before-completion` analog) | Before any handoff, evidence file save, or release | Expanded Draft v0 | [EVAL](./pre-handoff-verification/EVAL.md) | seven-point-checklist / downgrade-rules / text-only-mode-handling |
| `intent-to-3d-brief-writer` | Convert NL intent → 8-slot structured 3D brief (BMad analysis-phase analog) | First step before any planner | Expanded Draft v0 | [EVAL](./intent-to-3d-brief-writer/EVAL.md) | eight-slot-template / acceptance-criteria-patterns / mixed-audience-handling |
| `blender-asset-discovery-planner` | Per-asset strategy (procedural / library / generative / photogrammetry) before scene plan | Brief is locked, scene plan needs asset commitment | Expanded Draft v0 | [EVAL](./blender-asset-discovery-planner/EVAL.md) | asset-strategy-decision-tree / license-confidence-table / budget-reconciliation-patterns |
| `runtime-bridge-conflict-resolver` | Diagnose Single-bridge constraint conflicts (Path 1 + Path 2 + port `9876`) | Readiness signals inconsistent or two bridges installed | Expanded Draft v0 | [EVAL](./runtime-bridge-conflict-resolver/EVAL.md) | bridge-state-matrix-template / conflict-playbooks / do-not-reminders |

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

- YAML frontmatter: `name` (kebab-case, ≤64 chars) and `description` (≤200 chars to clear the Claude.ai upload UI limit). Do not add `version`, `status`, `tags`, or other non-spec keys; they are not part of the [Anthropic Skills frontmatter spec](https://support.anthropic.com/en/articles/12512198-creating-custom-skills) and the docs:check script will reject them in any uploadable SKILL.md.
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
| Use kebab-case folder names | `render-export-evidence` |
| Match `name` to folder slug | `name: render-export-evidence` |
| Prefer domain/action names | `blender-lighting-material-planner` |
| Avoid duplicate aliases unless packaging requires them | Use canonical role notes instead. |

---

## Trigger rules

- Use `blendops-help` when the next action is unclear.
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
  - **Path 2 — Community `ahujasid/blender-mcp`** (different `addon.py` + server via `uvx blender-mcp`, mature 21K+ stars third-party, Blender 3.0+).
  - **CLI fallback (appendix)** — direct `blender --background --python`, no MCP. **Documented upstream** as a first-class Blender CLI surface; no in-repo evidence file yet.
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
| Cursor | Adapter evidence required before project/rules guidance is promoted. |
| Codex | Generic project instruction fallback until verified. |
| Gemini | Future adapter; not researched enough for support claim. |

No packaged skill, plugin listing, marketplace listing, or release availability should be marked complete until verified.

---

## Review gate dependency

| Gate source | Applies to | Expected result |
|---|---|---|
| `skill-reviews/review-gates.md` | All promoted root skills | Pass before promotion, or record explicit warnings |
| Per-skill `EVAL.md` | Individual skill behavior | Text-only baseline checks pass |
| Pack manifest | Composed pack behavior | Laws, skill order, eval expectations stay aligned |
