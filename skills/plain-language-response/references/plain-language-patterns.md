# Plain-Language Patterns

## Purpose
Standardize clear, jargon-free user communication so anyone who has never opened Blender understands exactly what happened, what files exist, and what single action comes next.

## When to use
- At the final synthesis step of any workflow (`plain-language-response`) before presenting results to stakeholders or end users.

## Core Communication Structure (4-Block Pattern)
1. **What you asked for (1 sentence)**: Mirror the user's goal in everyday terms (`"a clean 3D sneaker render and web file for your landing page"`).
2. **What is ready right now**: Plain bullet list of completed plans, decisions, or verified files (`"Camera plan, 3-point neon lighting setup, and web budget checklist are ready"`).
3. **What is NOT done yet (Truth boundary)**: Explicitly separate plans from actual 3D files (`Runtime status` + `Artifact status`), translating any unavoidable Blender term in brackets (`"cycles raytracing (photo-realistic lighting engine)"`).
4. **Your one next step**: A single concrete action — never dump five competing technical options on a beginner.

## Jargon Translation Quick Table

| Blender / 3D Term (Never leave unexplained) | Plain-Language Translation |
|---|---|
| `Principled BSDF / PBR` | Standard realistic surface shader (controls shine, roughness, and metal look) |
| `GLB / glTF 2.0` | Standard lightweight 3D file format that runs directly inside web browsers |
| `Triangle budget / Polycount` | How detailed the 3D shape is (fewer triangles = faster page loads on phones) |
| `View Transform (AgX / PBR Neutral)` | Color lens setting that keeps bright lights natural and brand colors true |
| `UV unwrap / Texel density` | How cleanly 2D textures wrap onto the 3D shape without blurry or stretched patches |
| `Bake textures` | Turning complex Blender effects into regular image maps so websites can load them |

## Bad Pattern to Avoid
- Pasting raw `bpy.ops` Python snippets, node-graph dumps, or ambiguous `"Done!"` claims when no render or `.glb` file was actually written.

## Related skill
[../SKILL.md](../SKILL.md)
