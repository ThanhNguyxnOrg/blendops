# Caveat Language

## Purpose
Preserve strict factual honesty about unverified runtime steps or partial outputs without confusing non-Blender users with jargon or vague hedging.

## When to use
- Whenever runtime was `Not Run`, an export has not been validated yet, or a workaround/simplification was chosen for web performance.

## Four-Part Caveat Formula
Every caveat should explicitly state:
1. **What is unverified or skipped**: e.g., `"Blender did not run in this step."`
2. **Concrete impact on the user**: e.g., `"So there is no rendered image or 3D web file (.glb) on disk yet."`
3. **Why it is safe or blocked**: e.g., `"This pass was planning-only"` or `"Blender 5.1+ is missing the Lab MCP add-on."`
4. **Single clearest next step**: e.g., `"Open docs/install/cursor.md to enable Path 1, or run a read-only check first."`

## Good vs. Bad Caveat Examples

| Situation | Bad Caveat (Avoid) | Good Plain-Language Caveat |
|---|---|---|
| **Planning-only session** | `"Everything looks good, model ready soon!"` | `"This is a complete scene blueprint only. Blender has not run yet (Runtime status: Not Run), so no 3D file or image exists on disk yet (Artifact status: Not Produced). Next: connect Path 1 or CLI to build the scene."` |
| **File exported, validator not run** | `"GLB exported, should work fine in Three.js."` | `"The 3D web file was saved to exports/shoe.glb (3.1 MB), so the file exists (Artifact status: Produced), but it has not passed validator or browser viewer checks yet. Next: run blendops glb-inspect exports/shoe.glb."` |
| **Web material downgrade** | `"Removed transmission BSDF lobes."` | `"To keep mobile load fast (< 5 MB), glass transparency was switched to a glossy clearcoat finish instead of heavy refraction. You get smooth 60 fps scrolling with a slightly simpler glass look."` |

## Related skill
[../SKILL.md](../SKILL.md)
