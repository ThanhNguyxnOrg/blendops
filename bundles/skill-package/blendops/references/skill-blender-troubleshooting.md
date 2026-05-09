# blender-troubleshooting

Purpose: structured 4-phase root-cause analysis when Blender output (render, export, GLB, response) does not match intent. Inspired by Anthropic Superpowers `/systematic-debugging`.

Use when output diverges from intent in a specific, reproducible way. Skip if intent itself is unclear (run brainstorming or brief writer first) or if request is creative iteration, not debugging.

Output contract: 4-phase diagnostic record (reproduce → narrow → identify → propose), one-sentence root cause, 1-2 rejected alternatives with reasons, fix proposal with explicit pass criteria, handoff skill named. This skill diagnoses; it never executes. Runtime status unchanged by this skill.
