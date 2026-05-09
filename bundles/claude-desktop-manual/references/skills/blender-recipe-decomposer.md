# blender-recipe-decomposer

Purpose: break a complex / over-scoped Blender intent into 2-5 smaller cohesive recipes, each with its own brief, stop condition, and handoff.

Use when intent has multiple distinct deliverables, crosses scene types, or previous attempts collapsed under their own scope.

Do not use for single deliverables or after recipes have started running.

Return recipe table (name / brief seed / stop condition / order / dependencies), shared assets list, recommended start recipe.

Each recipe hands off to intent-to-3d-brief-writer for full brief writing.
