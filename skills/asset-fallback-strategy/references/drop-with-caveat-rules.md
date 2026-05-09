# Drop-with-caveat rules

When dropping an asset, document the caveat; do not silently dilute the deliverable.

## What to record

- Original asset that was dropped
- Reason it was dropped
- Visual / functional change in the deliverable
- Whether the brief still matches after drop
- Updated stop condition (if changed)

## Example caveat

"Dropped: hero-shoe-mesh.glb (license-blocked, no fallback in time). Visual change: hero render now uses procedural-only abstraction instead of recognizable shoe. Brief match: lower (style match acceptable; shoe-specific recognition lost). User accepted change on <date>. Updated stop condition: 'render shows abstract product silhouette instead of literal shoe'."

## When NOT to drop

- The brief explicitly requires the asset (e.g., "render of THE shoe").
- Dropping breaks the recipe's purpose.
- Stakeholder expects the original.

In these cases, escalate scope reduction (drop the deliverable) or push the deadline.

## When drop is actually fine

- The asset is a "nice-to-have" not a "must-have" in the brief.
- An equivalent alternative is already accepted.
- The visual change is small.

## Recording in evidence

Drop-with-caveat events are part of the evidence trail. Append to `docs/evals/...` if a runtime evidence file is being maintained, or to the recipe handoff.

## Related skill
`../SKILL.md`
