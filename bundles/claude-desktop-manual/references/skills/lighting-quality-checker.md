# lighting-quality-checker

Purpose: validate lighting intensity ranges, shadow softness, color temperature, and HDRI use against the scene brief before render.

Use before render, after a lighting change, as a sub-check during full quality review, or when render mood feels off.

Do not edit lights; this skill validates only.

Return per-light verdict table (intensity, color, soft size, verdict), HDRI line, mood match Yes/No/Unknown, top-line status, worst-offender list, evidence label.

Hand off to blender-scene-quality-checker (broad review) or blender-lighting-material-planner (re-plan). Pair with material-quality-checker, composition-quality-checker, polycount-budget-checker.
