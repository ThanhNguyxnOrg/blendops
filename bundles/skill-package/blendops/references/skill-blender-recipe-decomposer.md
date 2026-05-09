# blender-recipe-decomposer

Purpose: break a complex / over-scoped Blender intent into 2-5 smaller cohesive recipes, each with its own brief, stop condition, and handoff.

Use when intent has multiple distinct deliverables, crosses scene types, or previous attempts collapsed under their own scope.

Do not use for single deliverables (already right-sized) or after recipes have started running.

Output contract: recipe table (name / brief seed / stop condition / order / dependencies), shared assets list, recommended start recipe, each handing off to intent-to-3d-brief-writer.
