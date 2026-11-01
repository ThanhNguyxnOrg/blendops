# Changelog

All notable changes to BlendOps are documented here. BlendOps is a **Draft v0**
content layer (docs + skills + laws + packs); it does not own runtime execution,
which is redirected to upstream (Blender Lab MCP, Anthropic Connector,
community `mcp-for-blender`, Blender CLI).

## [Unreleased] — Phase 10 & Phase 11 (Installer & Distributable CLI Readiness)

### Added
- **Phase 11 Distributable CLI (`bin/blendops.mjs`)**: Added `blendops` CLI entrypoint (`blendops --version`, `blendops --help`, `blendops doctor`, `blendops install`, `blendops rollback`), `package.json` `"bin"` and `"files"` allowlist for deterministic `npm pack` tarballs, runtime `fflate` dependency, and end-to-end consumer tarball test suite (`scripts/test-phase11.mjs`). Package remains unpublished (`"private": true`).
- **Phase 10 Safe Project-Local Installer (`scripts/install-skills.mjs`)**: Implemented `--doctor`, `--dry-run`, `--write`, and `--rollback` across supported project-local and bundle-output targets with transactional writes, crash-recovery journals (`.blendops/transaction-journal.json`), SHA-256 ownership tracking (`.blendops/install-manifest.json`), and user-edit preservation (`scripts/test-phase10.mjs`).

## [v0.8.0-draft] — 2026-10-16

Skills-layer review hardening + runtime consistency. `npm run ci` green
(`docs:check` 344 files, `skills:export` 48 skills).

### Changed
- All 48 skills hardened through external review packets: role boundaries,
  truth-state discipline (`Not Run` runtime / `Not Produced` artifact,
  downgrade-only), cross-skill handoff wiring.
- Runtime docs swept to the 2-path + CLI appendix model (Path 1 Lab MCP in
  Blender 5.1+ via Anthropic Connector or manual host; Path 2 community
  `mcp-for-blender`; CLI appendix-only, never a peer path).
- Review gates, acceptance criteria, and verification skills aligned with the
  2-path model; nonexistent MCP tool names fixed.
- Brand: logo mark + auto dark/light README header + social preview theme.
- Fixed stale baseline-16 counts to the 48-skill inventory across docs.

### Notes
- Runtime status stays `Not Run`; artifacts stay `Not Produced` — no runtime
  execution or artifact claims in this repo.

## [v0.7.0-draft]
- 26 install targets.

## [v0.6.0-draft]
- 20 install targets.

## [v0.5.0-draft]
- 48 skills.

## [v0.4.0-draft]
- 40 skills.

## [v0.3.0-draft]
- 32 skills.

## [v0.2.0-draft]
- 24 skills.

## [v0.1.0-draft]
- 16 baseline skills.
