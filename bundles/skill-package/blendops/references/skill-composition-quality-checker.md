# composition-quality-checker

Purpose: validate camera framing, subject placement, headroom/lead-room, and visual hierarchy against the scene brief before render.

Use before render, after a camera change, or as a sub-check during full quality review.

Do not use for material / lighting / broad readiness. Do not move the camera — this skill validates only.

Output contract: per-check verdict table (rule of thirds, subject placement, headroom, lead room, negative space, hierarchy, lens / FOV), aspect ratio + framing intent header, top-line status, worst-offender list, evidence label.
