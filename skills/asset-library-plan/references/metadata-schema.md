# Metadata schema

Each asset has a sidecar `<asset-name>.metadata.json` (or .yaml) with these fields.

## Required fields

```json
{
  "name": "sneaker-hero",
  "version": "v01",
  "category": "models/products",
  "license": "CC0 1.0",
  "license_url": "https://creativecommons.org/publicdomain/zero/1.0/",
  "source_url": "https://polyhaven.com/...",
  "source_platform": "polyhaven",
  "acquired_date": "2026-05-09",
  "file_hash_sha256": "<hash>",
  "file_size_bytes": 1234567,
  "format": "glb"
}
```

## Optional fields

```json
{
  "author": "Original creator name",
  "tags": ["sneaker", "footwear", "product-hero"],
  "polycount": 24500,
  "texture_resolutions": ["2048x2048", "1024x1024"],
  "uv_layouts": 1,
  "rigged": false,
  "animated": false,
  "preview_image": "preview.png",
  "notes": "Free-form notes",
  "supersedes": "sneaker-hero-old-v01-cc0.glb",
  "review_status": "approved",
  "reviewer": "alice"
}
```

## Why a sidecar file

- Survives version control (text diffs).
- Searchable by tools.
- Decoupled from binary file format.
- Re-readable without opening the asset.

## Required fields rationale

- `license` + `license_url`: enables `asset-license-checker` lookups.
- `source_url`: provenance.
- `acquired_date`: license version pinning.
- `file_hash_sha256`: detect tampering / accidental changes.
- `file_size_bytes`: inform storage / VCS choice.

## Generating metadata

Most fields can be auto-derived (size, hash, format, polycount). License + source require human input at acquisition time.

## Related skill
`../SKILL.md`
