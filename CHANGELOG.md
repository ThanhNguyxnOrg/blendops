# Changelog

All notable changes to BlendOps are documented here. BlendOps is a **production v1.0.0**
content and tooling layer (skills + contracts + laws + packs + CLI); it does not own runtime execution,
which is redirected to upstream (Blender Lab MCP, Anthropic Connector,
community `mcp-for-blender`, Blender CLI).

## [Unreleased] - Breaking: skill catalog merged 48 → 14 (planned v2.0.0)

### Added
- `blendops-build`: builds the planned scene in Blender step by step (units, shapes, modifiers, materials, lights, camera, preview, render or GLB export) with a JSON report per step and API rules for Blender 4.0, 4.2 and 5.0. The catalog is now 15 skills; `blendops-connect-blender` hands off to it once the runtime is ready and the brief is locked.
- `blendops-look-check`: checks a built preview with read-only numeric checks (size, scale, ground contact, framing, materials, lights), captures at least three views, reviews them against the brief, and fixes one issue per round through `blendops-build` for at most three rounds. `blendops-build` now hands previews to it and hands only the final render or GLB to `blendops-final-check`. The catalog is now 16 skills.

### Breaking
- The 48 narrow skills are merged into 14 skills. Each former skill's body now lives as a reference file under its new skill (`skills/<new-id>/references/<old-id>.md`); old skill folders, ZIPs and `npx skills add --skill <old-id>` slugs are removed.
- Routing participants are now 3 (`blendops-brief` → `blendops-done-criteria` → `blendops-start`); `skills.sh.json` has 4 groups.
- Former quality-checker → planner retry loops (composition, lighting, material) now run inside one merged skill instead of as cross-skill `retry` handoffs.

### Unchanged
- Runtime model (Path 1 Lab MCP, Path 2 `mcp-for-blender`, CLI appendix), truth states, capability tiers, and all 269 deterministic eval cases (now in 14 suites).

### Legacy → new skill map

| New skill | Former skills |
|---|---|
| `blendops-start` | `blendops-help`, `workflow-stage-router`, `plain-language-response` |
| `blendops-brief` | `blender-brainstorming`, `intent-to-3d-brief-writer`, `blender-recipe-decomposer`, `recipe-fit-assessor` |
| `blendops-done-criteria` | `done-criteria`, `stage-gates`, `acceptance-criteria-builder`, `scope-guard`, `pack-prerequisite-checker` |
| `blendops-product-shot` | `product-hero-scene-planner`, `product-grid-scene-planner` |
| `blendops-scene-plan` | `character-portrait`, `environment-shot`, `interior-scene` |
| `blendops-camera` | `camera-composition`, `composition-quality-checker`, `resolution-aspect-decision` |
| `blendops-lighting-materials` | `lighting-material-plan`, `lighting-quality-checker`, `material-quality-checker`, `color-management-decision` |
| `blendops-render-settings` | `cycles-vs-eevee-decision`, `output-format-decision` |
| `blendops-assets` | `asset-discovery`, `asset-license-checker`, `asset-style-check`, `asset-fallback-strategy`, `asset-library-plan` |
| `blendops-glb-budget` | `polycount-budget-checker`, `mobile-glb-budget` |
| `blendops-glb-web-handoff` | `glb-web-handoff`, `glb-animation-handoff`, `r3f-component-plan` |
| `blendops-connect-blender` | `runtime-setup`, `runtime-readiness`, `runtime-path-picker`, `path-one-host-outline`, `bridge-conflicts`, `cli-appendix-job-outline` |
| `blendops-final-check` | `scene-readiness`, `pre-handoff-verification`, `render-export-evidence`, `preview-report`, `runtime-attempt-report` |
| `blendops-fix-problems` | `blender-troubleshooting` |

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

## [1.0.1] - 2026-11-20

### Bug Fixes and Performance

- SemVer 2.0 prerelease order, exact skills.sh matching, <=255 description, and CodeQL-clean tests ([12a7a12](https://github.com/ThanhNguyxnOrg/blendops/commit/12a7a1257d740441d2e212df5f482e7819d0abab))
- restore original scripts, files, and keywords while keeping <=255 char description ([9cc3de8](https://github.com/ThanhNguyxnOrg/blendops/commit/9cc3de808a567b99d4d6420bf5b8ce1ae5042266))

## [1.1.0] - 2026-11-21

Re-declared at 466a4a92232b after prepared commit fcd0a0e8eb2f failed its required checks.

