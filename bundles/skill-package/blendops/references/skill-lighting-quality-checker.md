# lighting-quality-checker

Purpose: validate lighting intensity ranges, shadow softness, color temperature, and HDRI use against the scene brief before render.

Use before render, after a lighting change, as a sub-check during full quality review, or when render mood feels off.

Do not use for material / composition / broad readiness. Do not edit lights — this skill validates only.

Output contract: per-light verdict table (intensity, color, soft size, verdict), HDRI line, mood match Yes/No/Unknown, top-line status, worst-offender list, evidence label.
