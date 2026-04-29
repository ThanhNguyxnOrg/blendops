# Law: evidence-before-done

Status: Draft v0

## Purpose

No workflow may claim done/ready/exported/working without evidence, verification, or explicit caveat.

## When to use

Use at every completion boundary in skills/workflows/recipes and final user responses.

## Must do

- Require pass/warn/fail status.
- Require artifact presence/absence reporting.
- Require validation checklist results.
- Require caveat section for unresolved risks.

## Must not do

- Must not claim success without evidence.
- Must not omit missing artifact details.
- Must not collapse warnings into vague success language.

## Blocking conditions

Block completion if:
- no verification section,
- no artifact status,
- or no caveat disclosure for partial outcomes.

## Validation

- Verification section exists and is populated.
- Artifacts listed with status (present/missing).
- Final status uses Ready / Conditionally Ready / Not Ready taxonomy.

## Failure handling

If evidence is incomplete:
- mark as partial or not ready,
- explain what is missing,
- and provide concrete next checks.

## Example language

“Current status: Conditionally Ready. GLB export exists, but runtime compatibility evidence is incomplete. Next step: run loader validation and attach result.”

## Related skills/workflows

- [../skills/blender-scene-quality-checker.md](../skills/blender-scene-quality-checker.md)
- [../skills/glb-web-handoff.md](../skills/glb-web-handoff.md)
- [../workflows/product-hero-workflow.md](../workflows/product-hero-workflow.md)
