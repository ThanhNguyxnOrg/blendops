# blender-stop-condition-decider

Purpose: define one explicit "done" condition for a Blender recipe before starting work, plus an out-of-scope list, so the agent stops at the right point.

Use before any non-trivial Blender recipe, after previous attempts drifted into endless polish, or before runtime work.

Do not use for pure brainstorming or after work has already started without scope (use blender-scope-boundary-enforcer instead).

Output contract: one-sentence concrete stop condition, 3-5 out-of-scope items, handoff trigger, mode label, evidence label.
