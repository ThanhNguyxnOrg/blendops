# Install target: Codex CLI/App

Status/confidence: Draft v0, verified-read for AGENTS.md discovery (Codex docs read 2026-10-14)

## Recommended near-term install mode

Project-local `AGENTS.md` (repository root and nested directories). `BLENDOPS.md` is a BlendOps convention file and is not auto-read by Codex unless it is added to `project_doc_fallback_filenames` or imported/referenced from `AGENTS.md`.

## Copy/paste prompt

```txt
Install BlendOps for Codex using project-local instruction files.

Requirements:
- Prefer root/nested `AGENTS.md` (verified Codex discovery: project root down to cwd, `AGENTS.override.md` wins per directory, 32 KiB default cap).
- Do not rely on `BLENDOPS.md` alone; Codex ignores filenames outside its discovery list unless configured. Either write the content into `AGENTS.md` or reference/import `BLENDOPS.md` from it.
- Do not assume a native Codex skills loader exists.
- Avoid global writes unless explicitly approved.
- Do not install/configure runtime components.
- Do not run Blender/runtime eval.
- Do not claim preview/render/GLB artifacts.

Report changed files and rollback steps.
Runtime status: Not Run.
Artifact status: Not Produced.
```

## Expected files/folders

Verified Codex-native path: root/nested `AGENTS.md` (plus `AGENTS.override.md` per-directory override). `BLENDOPS.md` is BlendOps fallback content, not a Codex discovery filename by default.

## Rollback notes

Remove fallback instruction files and restore backups.

## Runtime boundary

Skill install != runtime setup. For Blender execution this tool would be a Path 1 host-(b) manual-MCP host or Path 2 host; setup is separate — see `docs/external-runtime-setup.md`. Skill install here never configures runtime.

## What not to claim

- Native Codex skills-loader support without verification.
- Runtime/artifact success claims.
