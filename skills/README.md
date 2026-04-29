# BlendOps Skills Collection

Status: Draft v0

BlendOps skills are installable AI-agent skill units for official-runtime Blender workflows.

- Each skill is its own directory with `SKILL.md`.
- Each skill includes `EVAL.md` for text-only gate testing.
- Skills must obey shared laws under `laws/`.
- Skills do not install or run Blender runtime.
- Skills do not provide custom runtime code.

## Review gate dependency

All skills should pass `skill-reviews/review-gates.md` before promotion.

## Skill categories

| Category | Skill | Purpose | Use when | Eval |
|---|---|---|---|---|
| Setup / readiness | official-runtime-setup-guide | runtime prerequisite guidance and confidence labels | runtime setup path unclear | [EVAL](./official-runtime-setup-guide/EVAL.md) |
| Setup / readiness | official-runtime-readiness-checker | readiness matrix and blocker reporting | before runtime eval attempt | [EVAL](./official-runtime-readiness-checker/EVAL.md) |
| Planning | product-hero-scene-planner | full product-hero scene plan schema | user asks for hero scene planning | [EVAL](./product-hero-scene-planner/EVAL.md) |
| Planning | blender-composition-camera-planner | composition and camera strategy | framing/camera decisions need depth | [EVAL](./blender-composition-camera-planner/EVAL.md) |
| Planning | blender-lighting-material-planner | lighting/material lookdev plan + portability caveats | lookdev strategy required | [EVAL](./blender-lighting-material-planner/EVAL.md) |
| Quality / eval | blender-scene-quality-checker | pass/warn/fail readiness and verdict | readiness decision needed | [EVAL](./blender-scene-quality-checker/EVAL.md) |
| Handoff / communication | glb-web-handoff | GLB/web handoff status and caveats | handoff clarity required | [EVAL](./glb-web-handoff/EVAL.md) |
| Handoff / communication | non-blender-user-response-writer | plain-language final response | stakeholder-facing summary needed | [EVAL](./non-blender-user-response-writer/EVAL.md) |
