# EVAL — asset-library-organization-planner

## Text-only eval prompt
Apply asset-library-organization-planner for a medium repo (~150 assets, mixed models / textures / HDRIs, git + LFS).

## Expected behavior
- folder tree pinned
- naming convention with examples
- metadata schema (fields)
- VCS rules (LFS threshold)
- license tracking strategy
- review process
- migration steps if relevant

## Pass / Warn / Fail criteria
- Pass: all sections pinned + naming + license tracking
- Warn: metadata schema partial
- Fail: "just dump in a folder", no naming, no license tracking

## Sample passing response outline
- Library size + VCS header
- Tree
- Naming + metadata + VCS + license + review sections
- Migration steps

## Sample failing response outline
- "Use a Drive folder"
- No naming or metadata
