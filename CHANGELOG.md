# Changelog

All notable changes to BlendOps are documented here. BlendOps is a **Draft v0**
content layer (docs + skills + laws + packs); it does not own runtime execution,
which is redirected to upstream (Blender Lab MCP, Anthropic Connector,
community `mcp-for-blender`, Blender CLI).

## [Unreleased]

## [v0.9.0-draft] — 2026-11-01 (Draft v9: Deterministic ZIP Export & CI Closure)

This release candidate closes the repository-owned implementation scope through Phase 13.1. It remains a draft content/workflow layer, not a production or stable runtime release.

### Verified
- Phase 13.1 bundle identity was verified locally: 3,066,010 bytes; SHA-256 `0fe7a97b1dbb6193a9ababf2c05c8c9910ff105d590b106278af57251a7b478d`; Git bundle integrity and all 10 refs passed.
- Commit `d1b2e6b4c539171456d229f16433f5e12202dbee` contains the Phase 13.1 implementation.
- GitHub Actions run [#180](https://github.com/ThanhNguyxnOrg/blendops/actions/runs/41323580235) passed all four jobs: Windows CLI tests, macOS CLI tests, Ubuntu CLI tests, and docs `npm run ci`.
- The npm package remains private and unpublished; no npm registry release is included.

### Added
- **Phase 13.1 Deterministic ZIP Export & CI Closure (`scripts/export-claude-skills.mjs`, `scripts/test-phase13.mjs`)**: Fixed ZIP entry timestamps to a canonical DOS timestamp, replaced locale-dependent entry sorting with deterministic code-unit ordering, and added cross-time-zone byte-identity checks. The Phase 13.1 cross-platform workflow passed on Windows, macOS, Ubuntu, and the docs CI job.
- **Phase 13 Repository Architecture, Organization & Finalization (`scripts/validate-repository-architecture.mjs`, `docs/audits/current/repository-inventory.json`, `scripts/test-phase13.mjs`)**: Added complete machine-readable repository inventory classifying all tracked files, automated internal reference & schema integrity verification (`npm run arch:check`), `.gitattributes` and `.editorconfig` cross-platform hygiene, Windows drive-root & parallel suite guard remediation for Phase 12 CI, and comprehensive architecture documentation (`docs/architecture.md`).
- **Phase 12 Web-Ready GLB Delivery & Viewer Integration (`schemas/glb-web-handoff-manifest.schema.json`, `scripts/inspect-glb.mjs`, `scripts/generate-glb-handoff-report.mjs`, `docs/examples/glb-web-handoff/`)**: Added GLB 2.0 scene hierarchy, accessor bounds, extension, and URI safety inspection, deterministic JSON/Markdown/HTML web handoff reports, CLI subcommands (`blendops glb-inspect`, `blendops glb-handoff`, `blendops glb-validate-manifest`), and Three.js / React Three Fiber viewer integration modules (`scripts/test-phase12.mjs`).
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
