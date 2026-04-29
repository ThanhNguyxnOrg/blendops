# Law: no-arbitrary-python-interface

Status: Draft v0

## Purpose

Prevent BlendOps from becoming an arbitrary-code user interface.

External runtimes may expose powerful operations, but BlendOps user-facing behavior must stay constrained by intent, validation, and evidence.

## When to use

Use for all active skills/workflows/recipes that discuss execution, export, or runtime operations.

## Must do

- Keep user-facing interactions intent-first and workflow-constrained.
- Require validation checkpoints before “ready/exported/working” claims.
- Present caveats when runtime operations are uncertain or incomplete.

## Must not do

- Must not present arbitrary Python execution as BlendOps product interface.
- Must not bypass workflow gates to run opaque low-level actions.
- Must not hide execution risk in user-facing responses.

## Blocking conditions

Block completion when:
- user-facing output relies on arbitrary code interface claims,
- workflow lacks validation gates,
- or runtime caveats are omitted.

## Validation

- Workflow includes explicit gated steps.
- Runtime evidence/caveat section is present.
- User-facing output avoids arbitrary-code framing.

## Failure handling

If execution requires unsafe/opaque behavior:
- stop and declare limitation,
- provide safer next-step options,
- and preserve non-technical clarity.

## Example language

“BlendOps does not use arbitrary code execution as its product interface. It uses constrained workflow steps with explicit validation and caveat reporting.”

## Related skills/workflows

- [../skills/blender-scene-quality-checker.md](../skills/blender-scene-quality-checker.md)
- [../skills/glb-web-handoff.md](../skills/glb-web-handoff.md)
- [../workflows/product-hero-workflow.md](../workflows/product-hero-workflow.md)
