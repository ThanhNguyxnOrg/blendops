# Stakeholder-Friendly Examples

## Purpose
Provide concrete before-and-after response examples for non-technical product managers, founders, and designers receiving BlendOps updates.

## When to use
- When formatting final milestone summaries, blocked-runtime updates, or web-handoff reports.

## Three Canonical Examples

### 1. Concise Executive Summary (Planning Pass Complete)
> **Goal**: Futuristic sneaker hero visual + lightweight web 3D file for your product page.  
> **What is ready**: Scene layout blueprint, three-quarter camera angle leaving the left side clear for your headline, neon rim lighting plan, and a 5 MB mobile web budget target.  
> **Important note**: Blender has **not** run yet (`Runtime status: Not Run`), so **no image or `.glb` 3D file has been created yet** (`Artifact status: Not Produced`).  
> **Next step**: Enable Blender Path 1 following `docs/install/cursor.md` and run a read-only check so we can generate your first preview render.

### 2. Implementation-Ready Web Handoff Summary (Verified Build)
> **Goal**: E-commerce 3D sneaker viewer ready for React/Next.js.  
> **Verified output**: `exports/hero-shoe.glb` (**2.84 MB**, **31,420 triangles** — well under the 50k mobile limit; `gltf-validator`: **0 errors**). Color balance verified with `Khronos PBR Neutral` so brand reds stay accurate.  
> **Truth status**: `Runtime status: Verified`, `Artifact status: Verified`.  
> **Next step**: Drop `exports/hero-shoe.glb` into the `<Canvas>` starter component in `docs/examples/glb-web-handoff/README.md`.

### 3. Blocked-Runtime Summary (Missing Prerequisite)
> **Goal**: Render final PNG + turntable video.  
> **What stopped us**: Blender 5.1+ is installed, but the **Lab MCP add-on** inside Blender Preferences is not switched on yet, so our agent cannot safely touch your scene.  
> **Truth status**: `Runtime status: Failed` (connection refused), `Artifact status: Not Produced`.  
> **Next step**: Open Blender -> *Edit -> Preferences -> Add-ons*, enable **Blender Lab MCP**, click **Start Server**, and re-run the check.

## Related skill
[../SKILL.md](../SKILL.md)
