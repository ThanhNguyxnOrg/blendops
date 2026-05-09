# blender-brainstorming (reference summary)

## Purpose
Run a structured Socratic exploration of a vague non-Blender-user 3D request before any planner is invoked. Inspired by Anthropic Superpowers `/brainstorming`.

## When to use
- the user request is short, ambiguous, or missing context
- multiple plausible interpretations exist
- the user is non-Blender-technical

## When not to use
- the user provided a structured brief (route to `intent-to-3d-brief-writer`)
- the user explicitly asked to skip clarification

## Output/evidence contract
3-5 batched clarifying questions, 2-3 alternative scopings with trade-offs, one-paragraph confirmed intent summary in plain language, decisions taken vs. deferred. Runtime status `Not Run`.

## Handoff notes
After confirmed intent: `intent-to-3d-brief-writer` (recommended) or directly `product-hero-scene-planner` if brief is trivial.
