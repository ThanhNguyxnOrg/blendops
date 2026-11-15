# Changelog

All notable changes to BlendOps are documented here. BlendOps is a **production v1.0.0**
content and tooling layer (skills + contracts + laws + packs + CLI); it does not own runtime execution,
which is redirected to upstream (Blender Lab MCP, Anthropic Connector,
community `mcp-for-blender`, Blender CLI).

## [v1.0.0] - Production Release

### Added & Changed
- **Production Release Normalization (`v1.0.0`)**:
  - Promoted package metadata, JSON Schemas, CLI version (`1.0.0`), documentation, install targets (`26` docs, `35+` CLI targets), adapters (`6`), packs, laws, bundles, and review guides from draft snapshots to clean `v1.0.0`.
  - Removed obsolete intermediate development phase snapshots and promoted current-state audit truth (`docs/audits/current/*`) to `v1.0.0-current` (`87.0/100`, `48/48` contracted skills, `269/269` deterministic eval cases passing, `90/90` bilingual retrieval evals passing).
  - Normalized descriptive test suite filenames across `scripts/test-*.mjs` and removed legacy draft/phase inspector scaffolding from `scripts/dev-server.mjs`.
- **Skill & Reference Hardening (`skills/*/references/*.md`)**:
  - Enriched all **151/151 skill reference guides** (Principled BSDF PBR numeric lookup tables, multi-engine Web/Unreal/Unity/Godot export parity, 6-gate mesh/UV QA tolerances, AgX vs Khronos PBR Neutral tone-mapping rules, Reference-Image-Match silhouette loops, and Superpowers-style verification rubrics).
  - Updated runtime readiness matrices (`skills/runtime-readiness/references/readiness-matrix.md`) and attempt record templates (`skills/runtime-attempt-report/references/attempt-record-template.md`) for complete v1.0.0 operator provenance capture.
- **Secure Async MCP Client, Runtime Governance & `skills.sh` Compatibility (`scripts/runtime-orchestrator.mjs`, `scripts/install-skills.mjs`, `skills.sh.json`, `registry/runtime-operations.json`)**:
  - Added `@modelcontextprotocol/sdk@1.32.2` async STDIO and Streamable HTTP client (`connectMcpRuntimeClient`), 7-state connection lifecycle, 4-part SHA-256 tool contract fingerprinting, unforgeable mock-fixture provenance, 7-check rollback verification, output staging + `gltf-validator` helpers, governed live read-only (`L0`) inspection, deterministic CLI exit codes `0..7`, root `skills.sh.json` 8-group catalog, `vercel-labs/skills` Lockfile v2 (`skills-lock.json`), and `--with-skills-dir` + `--skill <slug>` installation with transactional rollback.
- **Repository Architecture & Finalization (`scripts/validate-repository-architecture.mjs`, `docs/audits/current/repository-inventory.json`)**:
  - Complete machine-readable repository inventory classifying tracked files, automated internal reference & schema integrity verification (`npm run arch:check`), `.gitattributes` and `.editorconfig` cross-platform hygiene, and comprehensive architecture documentation (`docs/architecture.md`).
- **Web-Ready GLB Delivery & Viewer Integration (`schemas/glb-web-handoff-manifest.schema.json`, `scripts/inspect-glb.mjs`, `scripts/generate-glb-handoff-report.mjs`, `docs/examples/glb-web-handoff/`)**:
  - GLB 2.0 scene hierarchy, accessor bounds, extension, and URI safety inspection, deterministic JSON/Markdown/HTML web handoff reports, CLI subcommands (`blendops glb-inspect`, `blendops glb-handoff`, `blendops glb-validate-manifest`), and Three.js / React Three Fiber viewer modules.
- **Distributable CLI & Safe Project-Local Installer (`bin/blendops.mjs`, `scripts/install-skills.mjs`)**:
  - Added `blendops` CLI entrypoint, `package.json` `"bin"` and `"files"` allowlist for `npm pack` tarballs, public-release metadata (`publishConfig.access: public`), `--doctor`, `--dry-run`, `--write`, and `--rollback` with transactional journals and SHA-256 ownership tracking.

### Truth-State Posture
- In-repo live Blender runtime status remains `Not Run` and live Blender artifacts remain `Not Produced`.
- Public npm distribution is live as [`blendops@1.0.0`](https://www.npmjs.com/package/blendops) (`latest` dist-tag); the repository's Agent Skills source is also [listed on skills.sh](https://www.skills.sh/ThanhNguyxnOrg/blendops). Official marketplace/plugin listings remain unpublished.

## [v0.8.0-draft] — 2026-10-16

Skills-layer review hardening + runtime consistency.

### Changed
- All 48 skills hardened through external review packets: role boundaries,
  truth-state discipline (`Not Run` runtime / `Not Produced` artifact,
  downgrade-only), cross-skill handoff wiring.
- Runtime docs swept to the 2-path + CLI appendix model (Path 1 Lab MCP in
  Blender 5.1+ via Anthropic Connector or manual host; Path 2 community
  `mcp-for-blender`; CLI appendix-only, never a peer path).

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
