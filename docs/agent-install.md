# BlendOps Agent Install Guide

## Mission
Install or attach the BlendOps v0 official-runtime core collection to the current AI coding workspace.

Core collection:
- `skills/`
- `laws/`
- `packs/`
- selected runtime boundary docs

## Safety rules
- Do not install Blender runtime.
- Do not run Blender.
- Do not claim runtime works.
- Do not use non-official MCP runtime paths.
- Do not modify global config unless user explicitly requested global install.
- Prefer project-local install.
- Do not overwrite existing config without backup.
- Ask before destructive changes.

## Step 1 — Build capability profile
Determine target and confidence:
- target name/type
- native skill/rules support (verified/unknown)
- project file write capability
- global config capability
- adapter confidence label

## Step 2 — Select install scope
Default order:
1. project-local (default)
2. tool-native (if verified)
3. generic-root fallback (if uncertain)
4. user-global (explicit user opt-in only)
5. docs-only/reference

## Step 3 — Select adapter
Choose from adapter registry:
- `docs/adapter-registry.md`
- `docs/adapters/*.md`

If target is uncertain, use `docs/adapters/generic-root.md`.

## Step 4 — Attach core collection
Attach by copy/reference:
- `skills/`
- `laws/`
- `packs/`
- `docs/external-runtime-setup.md`
- `docs/reference-runtime.md`

## Step 5 — Create entrypoint
- adapter-specific entrypoint when verified
- otherwise create `BLENDOPS.md` root fallback using template:
  - `docs/examples/blendops-root-entrypoint.md`

## Step 6 — Verify install
Report:
- adapter used
- scope used
- files changed
- confidence labels
- rollback steps

Checks:
- no runtime commands run
- no global config changes unless explicitly approved
- backups created where existing files were touched

## Step 7 — First-use prompt
Use the BlendOps v0 product hero pack to plan a cyberpunk shoe web hero.
Do not run Blender until runtime is explicitly available.
Do not claim preview/render/GLB exists without evidence.

## Rollback / uninstall
- remove newly attached project-local files
- restore backups for modified files
- confirm post-rollback state

## Source confidence note
When assumptions are uncertain, label as `linked-only` or `unknown` and avoid invented tool-specific behavior.
