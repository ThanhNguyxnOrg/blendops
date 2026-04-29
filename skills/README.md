# BlendOps Skills Collection

> [!NOTE]
> Status: Draft v0. These are installable AI-agent skill units for official-runtime Blender workflows.

## Collection posture

| Area | Current stance |
|---|---|
| Runtime | Skills don't install or run Blender runtime. |
| Runtime ownership | Skills don't provide custom runtime code. |
| Shared guardrails | Skills must obey shared laws under `laws/`. |
| Evals | Each skill includes `EVAL.md` for text-only gate testing. |
| Promotion | Skills should pass `skill-reviews/review-gates.md` before promotion. |
| Release posture | Draft v0 only, no stable or production-ready claim. |

## Skill categories

### 🧭 Setup and readiness

| Skill | Purpose | Use when | Depth status | Gate review | Eval |
|---|---|---|---|---|---|
| `official-runtime-setup-guide` | Runtime prerequisite guidance and confidence labels | Runtime setup path is unclear | Expanded Draft v0 | Pass | [EVAL](./official-runtime-setup-guide/EVAL.md) |
| `official-runtime-readiness-checker` | Readiness matrix and blocker reporting | Before a runtime eval attempt | Expanded Draft v0 | Pass | [EVAL](./official-runtime-readiness-checker/EVAL.md) |

### 🎬 Planning

| Skill | Purpose | Use when | Depth status | Gate review | Eval |
|---|---|---|---|---|---|
| `product-hero-scene-planner` | Full product-hero scene plan schema | User asks for hero scene planning | Expanded Draft v0 | Pass | [EVAL](./product-hero-scene-planner/EVAL.md) |
| `blender-composition-camera-planner` | Composition and camera strategy | Framing or camera decisions need depth | Expanded Draft v0 | Pass | [EVAL](./blender-composition-camera-planner/EVAL.md) |
| `blender-lighting-material-planner` | Lighting/material lookdev plan plus portability caveats | Lookdev strategy is required | Expanded Draft v0 | Pass | [EVAL](./blender-lighting-material-planner/EVAL.md) |

### ✅ Quality and eval

| Skill | Purpose | Use when | Depth status | Gate review | Eval |
|---|---|---|---|---|---|
| `blender-scene-quality-checker` | Pass/warn/fail readiness and verdict | A readiness decision is needed | Expanded Draft v0 | Pass | [EVAL](./blender-scene-quality-checker/EVAL.md) |

### 📦 Handoff and communication

| Skill | Purpose | Use when | Depth status | Gate review | Eval |
|---|---|---|---|---|---|
| `glb-web-handoff` | GLB/web handoff status and caveats | Handoff clarity is required | Expanded Draft v0 | Pass | [EVAL](./glb-web-handoff/EVAL.md) |
| `non-blender-user-response-writer` | Plain-language final response | Stakeholder-facing summary is needed | Expanded Draft v0 | Pass | [EVAL](./non-blender-user-response-writer/EVAL.md) |

## Review gate dependency

| Gate source | Applies to | Expected result |
|---|---|---|
| `skill-reviews/review-gates.md` | All root skills | Pass before promotion, or record explicit warnings |
| Per-skill `EVAL.md` | Individual skill behavior | Text-only baseline checks pass |
| Pack manifest | Composed pack behavior | Laws, skill order, eval expectations stay aligned |
