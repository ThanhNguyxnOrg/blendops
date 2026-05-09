---
name: asset-library-organization-planner
description: Plan an internal asset library structure (folders, naming, metadata, license tracking, version control) so future recipes find and reuse assets reliably.
---

# asset-library-organization-planner

## Purpose
Set up a maintainable internal asset library so future recipes can:
- find existing assets quickly,
- avoid re-licensing the same source,
- reuse PBR materials and HDRIs,
- track versions and revisions.

## Quick start
- pin folder structure (kebab-case, by category)
- pin naming convention (asset name + version + license slug)
- pin metadata schema (license, source, date, version, hash)
- pin version control rules (LFS for large binaries, plain text for metadata)
- emit a library-init plan

## When to use
- starting a new BlendOps repo with multiple recipes
- existing library is disorganized; recipes can't find assets
- before scaling to 50+ assets

## When not to use
- single-recipe repo with < 5 assets
- pure planning before any asset is sourced
- as a substitute for license check (use `asset-license-checker`)

## Trigger phrases
- "organize the assets"
- "asset library structure"
- "where should assets go"
- "name our assets"

## Prerequisites / readiness
- baseline asset count + categories known
- version control system known (git + LFS / Perforce / DAM)
- internal team conventions (if any)

## Input schema

### Required inputs

| Input | Why it is required |
|---|---|
| Asset categories | Drives folder structure |
| Version control system | Drives binary storage rules |
| Existing convention (if any) | Maintain consistency |

### Optional inputs

| Input | Use |
|---|---|
| Team size | Affects review process |
| Cloud storage / DAM | Alternative storage path |

### Assumptions to confirm
- The library is shared across future recipes.
- License metadata must be queryable.
- Versioning is discrete (not "latest" symlinks; pinned versions).

## Output schema

### Primary output
A library plan: folder tree, naming convention, metadata schema, version control rules, license tracking strategy.

### Secondary output
- migration steps if existing assets need re-organizing
- review process for adding new assets
- evidence label

### Evidence / caveat output

```txt
Runtime status: Not Run | Attempted | Produced | Verified | Failed | Blocked / Not Run
Artifact status: Not Run | Not Produced | Produced | Verified | Failed
Evidence used: <links, paths, logs, or "none">
Limitations: <known gaps>
```

## Required laws
- `../../laws/evidence-before-done.md`
- `../../laws/non-blender-user-language.md`
- `../../laws/no-arbitrary-python-interface.md`
- `../../laws/official-runtime-only.md`

## Official runtime boundary

Planning skill — does not move files, does not run Blender, does not configure version control. Outputs a structure spec.

## Operating procedure
1. Read asset categories.
2. Pin folder structure (see `references/folder-structure-rules.md`).
3. Pin naming convention (see `references/naming-rules.md`).
4. Pin metadata schema (see `references/metadata-schema.md`).
5. Pin version control rules (LFS thresholds, branching).
6. Pin license tracking (one license file per asset folder).
7. Recommend a review process for new asset additions.
8. Emit library-init plan + migration steps.

## Decision tree

```txt
< 50 total assets?
  → Simple flat structure may suffice
50-500 assets?
  → Categorical folders + subfolders
500+ assets?
  → DAM (Digital Asset Management) tool recommended
Mostly small files (< 50MB each)?
  → Plain git OK
Mixed sizes including > 50MB?
  → Git LFS or external storage
> 1GB total?
  → External DAM strongly recommended
```

## Playbooks

### Playbook A: Small repo (< 50 assets)
Flat folders by category: `assets/models/`, `assets/textures/`, `assets/hdris/`, `assets/fonts/`. One README + LICENSES.md per folder.

### Playbook B: Medium repo (50-500 assets)
Nested by category + sub-category: `assets/models/products/`, `assets/models/characters/`, `assets/textures/pbr/`, etc. Per-asset LICENSE.txt + metadata.json.

### Playbook C: Large repo (500+)
External DAM (e.g. Tractor, Razuna, custom) + git pointer files. Library plan focuses on naming + metadata schema; storage is offloaded.

## Mode handling

### Text-only mode
Library plan only.

### Runtime-ready mode
Plan + recommended directory creation steps (operator runs them; this skill does not).

### Blocked runtime mode
Plan only.

## Validation checklist
- [ ] Folder structure pinned
- [ ] Naming convention pinned
- [ ] Metadata schema pinned
- [ ] Version control rules pinned
- [ ] License tracking strategy pinned
- [ ] Review process for new assets
- [ ] Migration steps (if existing library)

## Pass / Warn / Fail rubric

| Verdict | Criteria |
|---|---|
| Pass | All sections pinned + migration plan if needed + review process. |
| Warn | One section soft (e.g. metadata schema partial). |
| Fail | "Just dump in a folder" advice; no naming convention; no license tracking. |

## Failure handling
- Existing library cannot be reorganized → plan a parallel new library + gradual migration.
- VCS not in place → recommend git or alternative before any asset commit.
- Team lacks process discipline → recommend lightweight review checklist (1-page).

## Troubleshooting

| Problem | Response |
|---|---|
| Asset duplicates across folders | Add a hash check; deduplicate before re-organizing. |
| Lost license info on old assets | Mark as Quarantine; do not use until re-licensed. |
| Naming inconsistency | Apply convention to new only; rename old in batches with care. |

## Best practices
- One library, one source of truth.
- License lives next to the asset, always.
- Naming convention is unforgiving; enforce in code review.
- Avoid deeply-nested folders (> 4 levels gets confusing).

## Good examples
- "assets/models/products/sneaker-v01-cc0.glb + assets/models/products/sneaker-v01-cc0.metadata.json + assets/models/products/sneaker-v01-cc0.LICENSE.txt"

## Bad examples
- "Just use a Drive folder." — no version, no license tracking.

## User-facing response template

```txt
Library size estimate: <N assets>
VCS: <git / git+lfs / DAM>

Folder structure:
  <tree>

Naming convention: <pattern + examples>

Metadata schema (per asset):
  <fields>

Version control:
  <rules>

License tracking: <strategy>

Review process: <1-page checklist>

Migration steps (if applicable): <list>
Limitations: <gaps>
Next: implement plan; future recipes use this library
```

## Anti-patterns
- "Just a folder."
- No license file.
- Mutable "latest" pointers.
- Mixing assets and recipes in the same folders.

## Cross-skill handoff
- Asset discovery → `../blender-asset-discovery-planner/SKILL.md`
- License → `../asset-license-checker/SKILL.md`
- Style → `../asset-style-consistency-checker/SKILL.md`
- Fallback → `../asset-fallback-strategy/SKILL.md`

## Non-goals
- Move files.
- Configure git / DAM.
- Run Blender.
- Buy assets.

## References
- `references/folder-structure-rules.md`
- `references/naming-rules.md`
- `references/metadata-schema.md`
- `../../docs/skill-system.md`
