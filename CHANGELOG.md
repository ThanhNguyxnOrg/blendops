# Changelog

All notable changes to BlendOps are documented here. BlendOps is a **Draft v0**
content layer (docs + skills + laws + packs); it does not own runtime execution,
which is redirected to upstream (Blender Lab MCP, Anthropic Connector,
community `mcp-for-blender`, Blender CLI).

## [Unreleased] — Pre-Release Hardening (Post-v0.9.0-draft) & Phase 3.3

### Added
- **Pre-Release Skill & Reference Hardening (`README.md`, `skills/README.md`, `docs/release-readiness.md`, `skills/*/references/*.md`)**: Synthesized community and discipline best practices while preserving strict Anthropic YAML frontmatter (`name` + `description <= 200`), 48 canonical skills, and downgrade-only truth discipline:
  - Added Principled BSDF real-world PBR numeric lookup (Albedo, Roughness, Metallic, IOR), 5-layer physical wear ordering, and Blender 4.x/5.x shader hygiene (`Specular IOR Level`, `surface_render_method`, linear `Non-Color`) in `skills/material-quality-checker/references/pbr-sanity-rules.md`.
  - Added multi-engine export parity matrix (Web glTF/Three.js, Unreal ORM+DirectX, Unity URP/HDRP, Godot 4) and `EXT_meshopt_compression` / KTX2 / WebP budgets across `skills/material-quality-checker/references/consumer-stack-rules.md` and `skills/glb-web-handoff/references/glb-handoff-checklist.md`.
  - Added 6-gate mesh/UV QA tolerances (`merge_by_distance 1e-4`, sharp-edge UV seams `>60°`, texel density spread `<= 1.3x`, `Z=0` grounding), six-face & paired-component anatomy completeness checks, Kelvin color temperature pairings, and `AgX` vs `Khronos PBR Neutral` tone-mapping parity in `polycount-budget-checker`, `lighting-quality-checker`, `product-hero-scene-planner`, and `intent-to-3d-brief-writer`.
  - Added Reference-Image-Match silhouette verification loop, quantitative scene introspection, Simulation/Bake Cache `ALL` gate (`skills/scene-readiness/references/quality-rubric.md`), and Superpowers-style Iron Law, Red Flags, and Anti-Rationalization tables (`pre-handoff-verification`, `done-criteria`, `runtime-attempt-report`).
  - Upgraded `README.md` and `skills/README.md` with `v0.9.0-draft` status, `npx skills add ThanhNguyxnOrg/blendops` quickstart, `35+` CLI install targets badge, and a 10-second ASCII Skill Decision Tree across the 8 `skills.sh.json` groups.
  - Enriched thin runtime, camera, lighting, web-handoff, acceptance, and pack-prerequisite references (`runtime-path-picker`, `path-one-host-outline`, `cli-appendix-job-outline`, `runtime-attempt-report`, `runtime-setup`, `runtime-readiness`, `camera-composition`, `lighting-material-plan`, `glb-web-handoff`, `acceptance-criteria-builder`, `pack-prerequisite-checker`), sharpened 9 core `SKILL.md` trigger descriptions (`<= 200` chars), updated `CONTRIBUTING.md` (`Node 20+`, `test-phase1..19.mjs`) and `docs/install/README.md` (`skills.sh.json` / `35+` targets), and decluttered the `scripts/dev-server.mjs` release inspector UI.
- **Phase 3.3 Secure Async MCP Client, Runtime Trust Verification, Governed Live Read-Only Integration & `skills.sh` Ecosystem Compatibility (`scripts/runtime-orchestrator.mjs`, `scripts/install-skills.mjs`, `skills.sh.json`, `registry/runtime-operations.json`, `schemas/runtime-*.schema.json`, `scripts/test-phase19.mjs`)**: Added official `@modelcontextprotocol/sdk@1.32.2` async STDIO and Streamable HTTP client (`connectMcpRuntimeClient`), 7-state connection lifecycle, 4-part SHA-256 tool contract fingerprinting (`computeFullToolContractFingerprints`), unforgeable mock-fixture provenance (`isTrustedMockRuntimeFixture`), 7-check rollback verification (`verifyRollbackRestoration`), Path 1 viewport/thumbnail conditional reclassification for upstream issues `#12` and `#70`, output staging and `gltf-validator` helpers (`verifyStagedOutputArtifact`, `evaluateGltfValidatorReport`), governed live read-only (`L0`) inspection (`inspectLiveReadOnlyRuntimeAsync`), deterministic CLI exit codes `0..7` (`computeRuntimeCliExitCode`), root `skills.sh.json` 8-group catalog customization, `vercel-labs/skills` Lockfile v2 (`skills-lock.json` `computedHash`), and opt-in `--with-skills-dir` + `--skill <slug>` multi-provider skill folder installation with transactional rollback.
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
