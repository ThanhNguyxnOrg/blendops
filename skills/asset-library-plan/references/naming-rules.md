# Naming rules

## Pattern

```
<asset-name>-<version>-<license-slug>.<ext>
```

Examples:
- `sneaker-hero-v01-cc0.glb`
- `studio-hdri-v02-cc0.exr`
- `oak-wood-pbr-v01-cc-by.zip`
- `helvetica-neue-v01-proprietary.ttf`

## Rules

- Kebab-case lowercase.
- No spaces.
- No special characters except hyphen and dot.
- Version always present (start at v01).
- License slug always present.

## License slugs

| License | Slug |
|---|---|
| CC0 | cc0 |
| CC-BY 4.0 | cc-by |
| CC-BY-SA 4.0 | cc-by-sa |
| CC-BY-NC 4.0 | cc-by-nc |
| MIT | mit |
| Apache 2.0 | apache-2 |
| Proprietary / commercial | proprietary |
| Internal / confidential | internal |
| Unknown / quarantine | quarantine |

## Versioning

- Bump version when the asset content changes meaningfully (re-modeled, re-textured, re-rendered HDRI).
- Do not bump version for metadata changes only.
- Keep prior versions in the library (do not delete) until referenced recipes are updated.

## Forbidden in names

- Date stamps (use git history instead).
- "Final", "v2-final", "v3-real-final" (use proper version numbers).
- Author initials (use git author info).
- Project codenames (assets are reusable; not project-bound).

## Related skill
`../SKILL.md`
