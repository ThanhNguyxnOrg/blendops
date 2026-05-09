# blender-checklist-driven-workflow

Purpose: enforce per-stage gates and acceptance checklists for a Blender recipe; work advances only when each previous gate `Pass`.

Use for complex multi-stage recipes (4+ stages), when previous attempts had drift / scope creep, or before runtime work where evidence-bound progress matters.

Do not use for single-step requests, pure brainstorming, or fixing broken renders (those have their own skills).

Output contract: per-stage gate table (acceptance criteria, evidence required, current state), failed-gate action, final handoff to pre-handoff-verification.
