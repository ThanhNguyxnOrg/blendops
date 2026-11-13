# Artifact Status Language

## Purpose
Standardize every artifact truth claim during GLB export, validation, and web handoff so non-Blender stakeholders never mistake a planned file or config for a verified export on disk.

## When to use
- At the end of `glb-web-handoff`, `mobile-glb-budget`, `r3f-component-plan`, `preview-report`, and `pre-handoff-verification`.

## Canonical Artifact Truth Matrix

| Status Label | Allowed When | Required Companion Evidence |
|---|---|---|
| `Artifact status: Not Produced` | Planning-only pass, dry-run compile, blocked runtime, or export step did not write a file on disk | State what blocked output (`Runtime status: Not Run` or `Blocked`) and the exact next export command/path |
| `Artifact status: Produced` | Export file exists at a concrete disk path with verified byte size `> 0`, but viewer/validator checks have not completed | Exact path + file size (e.g., `exports/hero-shoe.glb`, `2.84 MB`); explicitly state `Validation: Not Run` or `Pending` |
| `Artifact status: Verified` | File exists on disk **AND** automated inspection (`blendops glb-inspect`, `gltf-validator`) + render/viewer smoke pass with `0` errors | Path, byte size, triangle/material/texture counts, `gltf-validator` error count (`0`), and verified viewer check |
| `Artifact status: Failed` | Export attempted but wrote `0` bytes, threw Blender glTF exporter error, or failed `gltf-validator` / budget gate | Exact error message + failing metric (e.g. `142k tris exceeds 50k mobile budget`) + concrete fix step |

> **Hard Rule**: Never assign `Not Run` to `Artifact status`. `Not Run` applies to **Runtime / Validation status** (`Runtime status: Not Run`), while files on disk default to **`Artifact status: Not Produced`**.

## Good vs. Bad Examples
- **Good**: `"Runtime status: Not Run. Artifact status: Not Produced — no .glb file was written in this planning pass. Planned target: exports/cyberpunk-shoe.glb (<= 5 MB, KTX2/Meshopt optional). Next: execute Path 1/CLI export and run blendops glb-inspect."`
- **Good**: `"Runtime status: Verified (CLI Blender 5.2.3). Artifact status: Verified — exports/hero.glb (2.41 MB, 31,420 tris, 3 materials, gltf-validator: 0 errors, Three.js Canvas render confirmed)."`
- **Bad**: `"GLB done and web-ready!"` (missing path, file size, validator result, or fabricated on a planning pass).

## Related skill
[../SKILL.md](../SKILL.md)
