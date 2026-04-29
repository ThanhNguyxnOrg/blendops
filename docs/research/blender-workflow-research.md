# Blender Production Workflow Research (BlendOps)

Status: Research draft (pre-law)
Date: 2026-04-29

## Scope

This research focuses on production-quality Blender workflow guidance suitable for non-Blender users via BlendOps.

Prioritization:
1. Official Blender documentation
2. Khronos glTF guidance
3. Official/maintainer-level runtime docs (Three.js, R3F)
4. High-quality secondary production references (explicitly marked)

---

## Source confidence legend

- **High**: official Blender / Khronos / official framework docs
- **Medium**: reputable production workflow docs (e.g., Blender Studio workflow pages)
- **Low**: uncited community content (excluded from core guidance)

---

## Core workflow sequence (recommended)

1. **Intent and composition target**
2. **Blockout / clay pass**
3. **Scale and proportion validation**
4. **Lighting pass**
5. **Material/PBR pass**
6. **Camera/framing finalization**
7. **Render/preview iteration**
8. **GLB export and handoff validation**

Rationale: this ordering minimizes late-stage rework and aligns visual decisions with output constraints.

---

## 1) Scene composition workflow

### What to do
- Define the subject, hierarchy (primary/secondary elements), and negative space before detailed modeling.
- Establish one “hero viewpoint” early.
- Use composition guides and safe areas to avoid accidental framing drift.

### Sources
- Blender camera docs: https://docs.blender.org/manual/en/latest/render/cameras.html (**High**)
- Camera view/framing workflow: https://docs.blender.org/manual/en/latest/editors/3dview/navigate/camera_view.html (**High**)
- View overlays and composition aids: https://docs.blender.org/manual/en/4.5/editors/3dview/display/overlays.html (**High**)

---

## 2) Blockout / clay render phase

### What to do
- Build large shapes first; defer fine details.
- Use simple materials or material override for form/lighting readability.
- Keep collections and references organized during blockout.

### Sources
- View Layer Material Override: https://docs.blender.org/manual/en/latest/render/layers/override.html (**High**)
- Collections management: https://docs.blender.org/manual/en/latest/scene_layout/collections/collections.html (**High**)
- Empties/reference objects: https://docs.blender.org/manual/en/latest/modeling/empties.html (**High**)
- Blender Studio production process references (workflow nuance): https://studio.blender.org/pipeline/ (**Medium**)

---

## 3) Scale and proportions

### What to do
- Set scene units up front.
- Measure key dimensions during blockout.
- Apply transforms before export/validation to avoid runtime mismatch.

### Sources
- Scene units/properties: https://docs.blender.org/manual/en/latest/scene_layout/scene/properties.html (**High**)
- Measure tool: https://docs.blender.org/manual/en/latest/editors/3dview/toolbar/measure.html (**High**)
- Apply transforms: https://docs.blender.org/manual/en/latest/scene_layout/object/editing/apply.html (**High**)

---

## 4) Lighting workflow

### What to do
- Start with broad key/fill/environment intent.
- Validate silhouette readability before texture polishing.
- Iterate lighting while still in simplified material context.

### Sources
- Light objects: https://docs.blender.org/manual/en/latest/render/lights/light_object.html (**High**)
- World lighting/environment: https://docs.blender.org/manual/en/latest/render/lights/world.html (**High**)
- Blender Studio shot-lighting references: https://studio.blender.org/tools/pipeline-overview/shot-production/lighting (**Medium**)

---

## 5) Material/PBR workflow

### What to do
- Prefer Principled/PBR-compatible material strategy when web export is a target.
- Keep color-space semantics clear (color textures vs data textures).
- Avoid highly Blender-specific shader tricks that do not survive glTF handoff.

### Sources
- Principled BSDF docs: https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/principled.html (**High**)
- Blender materials intro: https://docs.blender.org/manual/en/latest/render/materials/introduction.html (**High**)
- glTF exporter notes in Blender docs: https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html (**High**)

---

## 6) Camera/framing workflow

### What to do
- Set final lens intent and camera position deliberately.
- Lock camera workflow during final iteration to avoid accidental framing changes.
- Check foreground/background separation from the hero angle.

### Sources
- Cameras: https://docs.blender.org/manual/en/latest/render/cameras.html (**High**)
- Camera view tools: https://docs.blender.org/manual/en/latest/editors/3dview/navigate/camera_view.html (**High**)

---

## 7) Render/preview workflow

### What to do
- Iterate in viewport shading modes quickly.
- Use Rendered preview checks before declaring scene “done”.
- Tune sampling/denoise to balance quality vs iteration speed.

### Sources
- Viewport shading: https://docs.blender.org/manual/en/latest/editors/3dview/display/shading.html (**High**)
- Viewport render behavior: https://docs.blender.org/manual/en/3.5/editors/3dview/viewport_render.html (**High**)
- Cycles sampling settings: https://docs.blender.org/manual/en/latest/render/cycles/render_settings/sampling.html (**High**)

---

## 8) GLB/export workflow

### What to do
- Validate transform, scale, and naming before export.
- Export with glTF/GLB settings aligned to runtime requirements.
- Re-open and check exported assets in independent viewers/runtime.

### Sources
- Blender glTF exporter docs: https://docs.blender.org/manual/en/latest/addons/import_export/scene_gltf2.html (**High**)
- Khronos glTF spec: https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html (**High**)
- Khronos glTF portal (validator/tools ecosystem): https://www.khronos.org/gltf/ (**High**)

---

## Common AI-generated Blender failure modes

1. **Detail-first modeling without composition lock**
2. **Scale inconsistency across imported/generated assets**
3. **Lighting done too late (after excessive detail investment)**
4. **Non-portable materials for glTF/web runtimes**
5. **Unapplied transforms causing web handoff issues**
6. **Preview-only validation (no export/runtime validation)**
7. **No explicit failure/caveat reporting to end user**

These failure modes are repeatedly implied by official workflow requirements and exporter constraints above.

---

## What to hide from non-Blender users

Hide (implementation detail):
- Blender UI panel/checkbox depth
- low-level node-graph mechanics
- engine-specific micro-tuning unless required

Why: these details increase cognitive load and reduce user success rate.

---

## What to surface in plain language

Surface (outcome-oriented):
- scene goal and visual intent
- composition confidence
- scale realism confidence
- lighting readability confidence
- material portability confidence
- export/runtime readiness status
- clear caveats and next actions

Suggested reporting format:
- **Passed checks**
- **Warnings**
- **Blocking issues**
- **Recommended next step**

---

## Weak/uncertain claim flags

- Blender Studio workflow links are valuable but project/pipeline-specific (**Medium**, not universal law).
- Any strict numeric quality threshold (samples/polycount/texture budgets) should be treated as scenario-specific and verified per target runtime.

No low-trust blog sources were used as core evidence in this draft.
