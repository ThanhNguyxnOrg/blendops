# Harness Notes: Codex

Status: Draft v0

## Attachment intent

Attach BlendOps guidance using project-local instruction files.

## Path assumptions (verify before writing)

- likely project-local file: `AGENTS.md`

If AGENTS.md is absent, create `BLENDOPS.md` fallback and explain decision.

## Safety constraints

- prefer project-local install
- avoid global config mutation unless explicitly requested
- do not run Blender during install
- keep runtime setup external and official-reference-only
