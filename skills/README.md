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
| `blendops-help` | Next-step routing across docs, skills, readiness, evidence, packaging, and release status | Goal/status is unclear or multiple skills could apply | Draft v0 | Pending review | [EVAL](./blendops-help/EVAL.md) |

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
| `render-export-evidence` | Preview/render/GLB evidence ledger and artifact truth labels | Artifact status must be proven or downgraded | Draft v0 | Pending review | [EVAL](./render-export-evidence/EVAL.md) |

### 📦 Handoff and communication

| Skill | Purpose | Use when | Depth status | Gate review | Eval |
|---|---|---|---|---|---|
| `glb-web-handoff` | GLB/web handoff status and caveats | Handoff clarity is required | Expanded Draft v0 | Pass | [EVAL](./glb-web-handoff/EVAL.md) |
| `non-blender-user-response-writer` | Plain-language final response | Stakeholder-facing summary is needed | Expanded Draft v0 | Pass | [EVAL](./non-blender-user-response-writer/EVAL.md) |

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

- YAML frontmatter: `name`, `description`, `version`, `status`, `tags`
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
- Stack 1 is the Claude Desktop official connector stack.
- Stack 2 is the official Blender CLI fallback.
- Stack 3 is optional, unofficial, user-managed, experimental/local only.
- Direct official MCP use from Claude Code/OpenCode/Cursor/Codex/Gemini is not verified and is not currently a supported BlendOps route.

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
