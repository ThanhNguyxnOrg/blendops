# BlendOps Skills Collection

Status: Draft v0

BlendOps skills are installable AI-agent skill units for official-runtime Blender workflows.

- Each skill is its own directory with `SKILL.md`.
- Skills are meant to be copied or referenced by AI coding tools.
- Skills must obey shared laws under `laws/`.
- Skills do not install or run Blender.
- Skills do not provide custom runtime code.

## Skill index

| Skill | Purpose | Use when |
|---|---|---|
| official-runtime-setup-guide | Explain official runtime prerequisites and boundaries | You need to set expectations before any runtime claim |
| official-runtime-readiness-checker | Evaluate whether official runtime appears ready | You need a readiness verdict before execution |
| product-hero-scene-planner | Convert user intent into hero-scene plan | A non-Blender user asks for product hero planning |
| blender-composition-camera-planner | Focus planning for composition and camera | You need detailed framing/camera direction |
| blender-lighting-material-planner | Focus planning for lighting/material design | You need look-dev planning with portability caveats |
| blender-scene-quality-checker | Score readiness via pass/warn/fail | You need explicit quality gate outcomes |
| glb-web-handoff | Define GLB/web handoff assumptions and caveats | You need web handoff clarity without overclaims |
| non-blender-user-response-writer | Produce plain-language final responses | You need non-jargon user-facing summaries |
