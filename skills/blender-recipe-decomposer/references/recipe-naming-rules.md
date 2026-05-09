# Recipe naming rules

## Format

Use kebab-case lowercase: `<subject>-<deliverable>` or `<subject>-<context>-<deliverable>`.

## Examples

Good:
- `shoe-hero-render`
- `shoe-color-variants-grid`
- `shoe-orbit-animation`
- `office-establishing-shot`
- `mascot-portrait-hero`
- `catalog-2x2-composite`

Bad:
- `render-1` (no subject)
- `make-the-shoe-look-good` (vague)
- `shoe-stuff` (vague)
- `Shoe Hero Render` (not kebab-case)

## Components

| Component | Purpose |
|---|---|
| Subject | What is in the scene (shoe, character, room) |
| Context | If multiple of same subject (hero, variants, orbit) |
| Deliverable | The output type (render / animation / grid / glb) |

## Why naming matters

- Recipe names appear in evidence files (`docs/evals/<recipe-name>-...md`).
- Other skills reference recipes by name (gates, stop conditions, decompositions).
- Future search / catalog of recipes uses the name as a key.

## Length

- 2-4 hyphen-separated words.
- < 30 characters.
- Reads as the deliverable, not as a sentence.

## Related skill
`../SKILL.md`
