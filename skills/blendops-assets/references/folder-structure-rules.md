# Folder structure rules

## Top-level structure (recommended)

```
assets/
  models/
  textures/
  hdris/
  fonts/
  audio/
  brushes/
  presets/
```

All kebab-case, all lowercase.

## Per-category sub-structure

### models/
- products/
- characters/
- environments/
- props/

### textures/
- pbr/
  - metals/
  - woods/
  - fabrics/
- gradients/
- alphas/

### hdris/
- studio/
- outdoor/
- indoor/

### fonts/
- (subfolders only if >50 fonts)

## Rules

- Max nesting depth: 4 levels.
- Each folder has a README.md describing what belongs there.
- Each asset folder has a LICENSE.txt or LICENSE per asset.

## Anti-patterns

- "misc/" or "other/" folders → vague; rejects organization discipline.
- Date-prefixed folder names ("2026-projects/") → mixes time-based and category-based; pick one.
- Per-recipe folders inside `assets/` → assets are reusable; recipes consume them.

## Migration

When reorganizing existing assets:
1. Inventory existing assets with paths.
2. Map each to new location.
3. Update references (Blender file paths, recipes).
4. Re-test renders that used the assets.

## Related skill
`../SKILL.md`
