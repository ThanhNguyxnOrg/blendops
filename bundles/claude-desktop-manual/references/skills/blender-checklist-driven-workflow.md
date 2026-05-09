# blender-checklist-driven-workflow

Purpose: enforce per-stage gates and acceptance checklists for a Blender recipe; work advances only when each previous gate `Pass`. Inspired by Anthropic Superpowers `/test-driven-development` analog.

Use for complex multi-stage recipes (4+ stages), when previous attempts drifted, or before runtime work.

Do not use for single-step requests or pure brainstorming.

Return per-stage gate table (acceptance criteria, evidence required, state), failed-gate action, final handoff to pre-handoff-verification.

Hand off on `Fail` to blender-troubleshooting; on final `Pass` to pre-handoff-verification.
