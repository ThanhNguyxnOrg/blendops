# Stateless CLI Limitations & Verification Caveats

The `blender --background` CLI fallback is documented upstream as a **first-class Blender CLI surface** (currently carrying `Not Run` in-repo eval evidence in BlendOps). Operators using stateless batch jobs must account for these structural constraints:

1. **No mid-run conversational refinement**: A headless invocation executes its planned DAG once and exits. Visual lookdev tuning requires inspecting staged PNG/GLB outputs and running a bounded follow-up revision pass.
2. **UI & viewport operators fail without active GUI context**: Any script relying on `bpy.context.area`, viewport shading overrides, or interactive selection breaks under `-b` unless rewritten around headless `render(write_still=True)` or explicit data APIs (`bpy.data`).
3. **Simulation caches are not baked automatically**: Physics, cloth, rigid-body, or Geometry Nodes simulation zones remain replay-only unless explicitly baked (` Bake All` / `.bphys` / `simulation` cache) inside the `.blend` or pre-step before export/render.
4. **Device fallback ambiguity (`CYCLES_DEVICE` / GPU headless)**: Cloud/CI hosts without GPUs may silently fail or stall if `cycles.device` is forced to `OPTIX`/`CUDA` without falling back to `CPU`.
5. **Proof still requires output verification**: Exit code `0` alone proves nothing without checking rendered image dimensions/non-blank luminance and running `blendops glb-inspect` on exported GLBs.

## Related skill
- [SKILL.md](../SKILL.md)
