# Law: non-blender-user-language

Status: Draft v0

## Purpose

Ensure final BlendOps responses are understandable for users who do not know Blender internals.

## When to use

Use in all user-facing outputs, especially final summaries, validation results, and handoff guidance.

## Must do

- Use plain language first.
- Explain unavoidable technical terms briefly.
- Provide actionable next steps in user terms.
- Keep output oriented to outcome, not tool internals.

## Must not do

- Must not rely on unexplained Blender jargon.
- Must not present raw runtime logs as final explanation.
- Must not hide limitations behind technical phrasing.

## Blocking conditions

Block completion if:
- response is dominated by unexplained Blender/runtime terminology,
- user cannot identify what succeeded/failed,
- or next steps are not actionable.

## Validation

- Final response includes plain-language summary.
- Pass/warn/fail section is understandable without Blender expertise.
- Next-step guidance is concrete and prioritized.

## Failure handling

If technical detail is unavoidable:
- keep the technical detail,
- add a plain-language translation immediately after,
- and explain user impact.

## Example language

“Your main output is ready for web testing, but one quality check failed: reflective lighting is inconsistent. You can still preview it, but expect visual differences until lighting is adjusted.”

## Related skills/workflows

- [../skills/non-blender-user-response-writer.md](../skills/non-blender-user-response-writer.md)
- [../recipes/cyberpunk-shoe-hero.md](../recipes/cyberpunk-shoe-hero.md)
- [../workflows/product-hero-workflow.md](../workflows/product-hero-workflow.md)
