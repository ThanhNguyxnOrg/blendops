# blender-brainstorming

Purpose: run a structured Socratic intent exploration on a vague non-Blender-user 3D request before any planner is invoked. Inspired by Anthropic Superpowers `/brainstorming`.

Use when the request is vague, multiple interpretations exist, or the user is non-Blender-technical. Skip if intent is already structured (route directly to `intent-to-3d-brief-writer`).

Output contract: 3-5 batched clarifying questions, 2-3 alternative scopings with trade-offs, one-paragraph confirmed intent summary in plain language, decisions taken vs. deferred. Runtime status remains `Not Run`. Hand off to `intent-to-3d-brief-writer` (or planner if brief is trivial).
