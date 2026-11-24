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

## [2.0.0] - 2026-11-24

### Breaking Changes

- merge 48 skills into 14 (v2.0.0 catalog) ([f1a2fae](https://github.com/ThanhNguyxnOrg/blendops/commit/f1a2faea2c7640a78b4e1cef3aaaa8163dabf475))
- rename the 14 skills to blendops-* and rewrite README ([557b586](https://github.com/ThanhNguyxnOrg/blendops/commit/557b5860c159b6de96f2acb1954d568ab1db9363))

### Features

- add blendops-build skill for step-by-step scene building ([e6675ab](https://github.com/ThanhNguyxnOrg/blendops/commit/e6675ab544160ed88855748de53d0becaa9a123f))
- add blendops-look-check skill for the preview check and fix loop ([3159b14](https://github.com/ThanhNguyxnOrg/blendops/commit/3159b14fcc10db0c46bb5c5dc4f075854492231d))
- add shared read-only scene-state check for build, look-check and final-check ([c621cbc](https://github.com/ThanhNguyxnOrg/blendops/commit/c621cbce2d03e7f32aacd5f928bd48d4e47ee251))
- gate asset downloads and AI model generation behind the asset plan and user approval ([13d4ef4](https://github.com/ThanhNguyxnOrg/blendops/commit/13d4ef44a06f1d4a975058eae183c0242b3529c8))

### Bug Fixes and Performance

- harden regexes flagged by CodeQL (ReDoS, comment stripping) ([918ab12](https://github.com/ThanhNguyxnOrg/blendops/commit/918ab127d57f7db6691c8fe814a9e07385f4a682))
- strip HTML comments without regex (CodeQL incomplete sanitization) ([ccbd248](https://github.com/ThanhNguyxnOrg/blendops/commit/ccbd24841d9d44888dae61ef9f97aeb42ab68b42))
- include scripts/cli in the audited inputs digest ([63bb9a8](https://github.com/ThanhNguyxnOrg/blendops/commit/63bb9a8dbb7f8831eb505ddbc658c2f41a71249f))
- read CLI version from package.json and check the described skill count ([315e10b](https://github.com/ThanhNguyxnOrg/blendops/commit/315e10b541433ecc4ee4e99e8b3b9070e4d35e57))
- fall back to 'unknown' when package.json cannot be read ([b0e2de1](https://github.com/ThanhNguyxnOrg/blendops/commit/b0e2de1432d9f908930bcc778098380fe21a6672))
- skip the skill-count check when skills/ is missing ([a8ffbe3](https://github.com/ThanhNguyxnOrg/blendops/commit/a8ffbe387bbd3191f2617760e04a60ab347f1511))
- hand off to blendops-build only once the scene plan is locked ([155f81c](https://github.com/ThanhNguyxnOrg/blendops/commit/155f81cb5272f3af0b8d80fc18b5e8250aa80fc6))
- hand off to final-check only after a preview exists ([67a19e5](https://github.com/ThanhNguyxnOrg/blendops/commit/67a19e5043f065830ef247a89d6b0dac152b72c6))
- require user confirmation, CLI reopen, and current Path 2 preview tools in blendops-build ([1a56ce0](https://github.com/ThanhNguyxnOrg/blendops/commit/1a56ce0bb029550c613a4439fd486d5e5572fea0))
- scope GLB export to planned objects, reset preview resolution, read Lab thumbnail path ([38cc5f9](https://github.com/ThanhNguyxnOrg/blendops/commit/38cc5f9a26ac407ce72ee6b36519f8b533f08add))
- route final renders and GLB exports to final-check too ([292de46](https://github.com/ThanhNguyxnOrg/blendops/commit/292de46775e5ebd2fae21b60bb6a8993ce6bf73f))
- save only after approved changes and fail CLI steps on Python errors ([97838f9](https://github.com/ThanhNguyxnOrg/blendops/commit/97838f9d4ef980076f609116d35cfe9a89eafa26))
- final render after the preview check; CLI exit code in blendops-build ([a937552](https://github.com/ThanhNguyxnOrg/blendops/commit/a9375523cb77d310af9412ffae7ec706acfefe99))
- check only look criteria on the preview, full done criteria on the finished file ([028e9dd](https://github.com/ThanhNguyxnOrg/blendops/commit/028e9dde9e701f947562a2e170b77e236706ddf7))
- route look issues by quality.verdict and stop after round three ([60cafb0](https://github.com/ThanhNguyxnOrg/blendops/commit/60cafb070baed576ea09f5b629ad748cf959bb0b))
- plan-driven frame, extra-object and output checks; ground contact from vertices ([1eb6e5f](https://github.com/ThanhNguyxnOrg/blendops/commit/1eb6e5f79203145c1a8bdf21fb77af49fad04e48))
- set gate.status to pending each round so the build route matches ([06e9f45](https://github.com/ThanhNguyxnOrg/blendops/commit/06e9f45a5f959d7d9a6b5ff781d9c95438e777d2))
- compare output settings with the preview settings, not the final ones ([6df4859](https://github.com/ThanhNguyxnOrg/blendops/commit/6df48590ca58976d7870895a9a26240d2611a788))
- report empty evaluated meshes instead of aborting the numeric check ([750d6a1](https://github.com/ThanhNguyxnOrg/blendops/commit/750d6a1dccad18ac25a5f072d4b486652c88cfbb))
- send fix regressions to troubleshooting ([fa09c19](https://github.com/ThanhNguyxnOrg/blendops/commit/fa09c19dc32774247019de632e6a2e3c9494e316))
- scene-state measures in metres, counts instances, and checks ground on curves and heavy meshes ([bafecd4](https://github.com/ThanhNguyxnOrg/blendops/commit/bafecd4c0b6af32e69e3e3b6d1f45d07c68f4b7d))
- final-check reads only geometry issues from scene-state and keeps other input failures ([f5947cb](https://github.com/ThanhNguyxnOrg/blendops/commit/f5947cbb788c5d9c484829892c777dbcf8808bef))
- scene-state measures instances by their vertices, frames objects by their own box, and keeps base-mesh material and part checks ([9c3ddf9](https://github.com/ThanhNguyxnOrg/blendops/commit/9c3ddf9e56e0fd745846d1eb3aee19cf9bdad3c2))
- scene-state frames by evaluated vertices, reads node-set materials, and finds metaball bases by Blender's name rule ([14f3770](https://github.com/ThanhNguyxnOrg/blendops/commit/14f37700389e6820e3c6241bce83a686c87721bb))
- move Blender check helpers to evals/blender-checks and regenerate inventory ([28b7c54](https://github.com/ThanhNguyxnOrg/blendops/commit/28b7c54d64b47e4008230c0565453f4c204b93ac))
- fall back to the pre-4.0 Emission socket name in the campsite walkthrough ([48db4f3](https://github.com/ThanhNguyxnOrg/blendops/commit/48db4f3b677e2598f29430f3729a3668dbf3662f))
- quote GLB paths in the crate walkthrough inspect command ([c9985c8](https://github.com/ThanhNguyxnOrg/blendops/commit/c9985c8be5e6a760554725ea9ad84ddc07e75db3))
- keep parented children and shared materials intact in the chair GLB walkthrough ([7dd06ec](https://github.com/ThanhNguyxnOrg/blendops/commit/7dd06ec6c7ea1e467f2d2038c05af686cda6d141))
- pick the Wood slot by name in the chair material step ([69d7222](https://github.com/ThanhNguyxnOrg/blendops/commit/69d7222a66fa1003e7e7be28621fb6f7761a8221))
- hide expected skills from the live prompt pack behind opaque request keys ([1a79921](https://github.com/ThanhNguyxnOrg/blendops/commit/1a79921575977df98b4b0d836b7d5b4d4e40de17))
- score quoted null answers as abstentions and ask for JSON null in the prompt pack ([f232307](https://github.com/ThanhNguyxnOrg/blendops/commit/f232307cd752d12183e0e8bfe29579e092cbe1e7))
- regenerate the repository inventory with the tracked skill-selection files ([dff6c62](https://github.com/ThanhNguyxnOrg/blendops/commit/dff6c6208cc585feec0f01a8031a1255e9ac0af6))
- count blank selection answers as unanswered, not as choosing no skill ([9208460](https://github.com/ThanhNguyxnOrg/blendops/commit/9208460aaf8ab7afb4048f6ae1498a9d7a2abcc8))
- state the asset source gate inside blendops-build so its standalone upload carries it ([e013eab](https://github.com/ThanhNguyxnOrg/blendops/commit/e013eab6b673f5b60f46138d937958ee0aad066c))

### Other changes

- ci: follow ci-v1/agent-v1 tags and group Dependabot (#16) ([f909b73](https://github.com/ThanhNguyxnOrg/blendops/commit/f909b736c1ddbe419df0ea9e3f543ce697667865))
- chore: onboard ThanhNguyxnAgent PR event workflow [skip ci] ([0b1dcb2](https://github.com/ThanhNguyxnOrg/blendops/commit/0b1dcb22fcb635ab3eae3f220540bef677e3498d))
- Ship the files needed by catalog-eval and catalog-validate (#18) ([9594f43](https://github.com/ThanhNguyxnOrg/blendops/commit/9594f434bc765b81a692f950b5ca12c05a38561f))
- fix(ci): verify and retry npm releases at the tagged source (#19) ([b2a4376](https://github.com/ThanhNguyxnOrg/blendops/commit/b2a43762a5f3542343ca748f30863ee65455b3d1))
- docs: link Blender CLI fallback to the recorded mech-prop run (#20) ([657b5ba](https://github.com/ThanhNguyxnOrg/blendops/commit/657b5ba04235997d2212cee5f9cd2a2e3cfadaf8))
- docs: fix stale manual-bundle summary count ([4481675](https://github.com/ThanhNguyxnOrg/blendops/commit/4481675cf6d850a271d123dd3c9283e2fb5a2c49))
- refactor: split the 5.4k-line CLI into scripts/cli/ modules ([e37bbdc](https://github.com/ThanhNguyxnOrg/blendops/commit/e37bbdc330bf7a11f06234826b2fac7baa225928))
- Merge origin/main into build-skill branch ([50a65b3](https://github.com/ThanhNguyxnOrg/blendops/commit/50a65b33e6bf499c6a9005a506c897aa2ade881e))
- chore: regenerate registry, bundles and audit after review fixes ([ffc0975](https://github.com/ThanhNguyxnOrg/blendops/commit/ffc0975d02304154606cb642666148657fbebcaa))
- chore: regenerate artifacts after second review round ([f445c89](https://github.com/ThanhNguyxnOrg/blendops/commit/f445c893151b44e888031b3e0bbbe6ffead3fa8c))
- chore: regenerate bundles after preview-check wording ([8b6ffb3](https://github.com/ThanhNguyxnOrg/blendops/commit/8b6ffb3550ef5d3e283f3c50c801f866b3373449))
- chore(look-check): regenerate evals, bundles and audits after review fixes ([667d808](https://github.com/ThanhNguyxnOrg/blendops/commit/667d8089a54bfab90b29258aaa83345298d65c10))
- chore(look-check): regenerate bundles and audits after review fixes ([06f4c8d](https://github.com/ThanhNguyxnOrg/blendops/commit/06f4c8dfb95cf685089adb468e6ffccb4e56732e))
- chore: allow and check identical shared scene-state copies, update reference counts ([451d0c8](https://github.com/ThanhNguyxnOrg/blendops/commit/451d0c8b17a99dfe180e86db0fd56aa7299a2a6b))
- docs: record scene-state script check on Blender 4.2.23 and 5.1.2 ([bdb7856](https://github.com/ThanhNguyxnOrg/blendops/commit/bdb7856cd6508db186b664c3f6946f4160f97582))
- chore: regenerate registries, bundles, evals and audits ([debbffb](https://github.com/ThanhNguyxnOrg/blendops/commit/debbffb108dc2c094f3d61d95a1170eb0bd565b8))
- docs: extend scene-state evidence with curve, instance, heavy-mesh and centimetre scenes ([8198590](https://github.com/ThanhNguyxnOrg/blendops/commit/8198590fccd077956df0ec9fc0c092c51566b533))
- chore: regenerate catalogs, bundles and audits for scene-state fixes ([a05a775](https://github.com/ThanhNguyxnOrg/blendops/commit/a05a7759b1e3b5f8d195e1a732efad339981b0dc))
- docs: add rotated-instance, metaball and framing scene to scene-state evidence ([6f641d7](https://github.com/ThanhNguyxnOrg/blendops/commit/6f641d7b02be36f83afcc9184edaaf112dc30bd5))
- chore: regenerate catalogs, bundles and audits for scene-state review fixes ([5331408](https://github.com/ThanhNguyxnOrg/blendops/commit/5331408d266faebdbb6ce7e25d649ba58af899fc))
- docs: add node-material, metaball-name and tight-framing cases to scene-state evidence ([510dd4d](https://github.com/ThanhNguyxnOrg/blendops/commit/510dd4d2307fcd5042a1a66a24f7d2da771d43bc))
- chore: regenerate catalogs, bundles and audits for scene-state review fixes ([0204efb](https://github.com/ThanhNguyxnOrg/blendops/commit/0204efbd760c4451d355f70f2194603b579b2e5f))
- ci: run skill reference examples and scene-state in real Blender 4.2 and 5.1 ([ca8a0ec](https://github.com/ThanhNguyxnOrg/blendops/commit/ca8a0ec6ec983dce9b7d8c9e6e82b45f018cd50d))
- docs: link the CI run and list its artifacts in the Blender CI evidence ([fe483b2](https://github.com/ThanhNguyxnOrg/blendops/commit/fe483b223eac30806205e49e638ccc079f1c1bc7))
- chore(agent): sync npm and skills.sh distribution metadata ([9d861cd](https://github.com/ThanhNguyxnOrg/blendops/commit/9d861cd2c6980d0f6dd4cef27767ebad84dc00f2))
- docs: add runnable walkthroughs for the crate, campsite and chair GLB recipes, checked in real Blender ([a14a2a7](https://github.com/ThanhNguyxnOrg/blendops/commit/a14a2a7116eaef7780d966311507cb490b4e9a21))
- chore: regenerate audit inventories ([0fbaf8a](https://github.com/ThanhNguyxnOrg/blendops/commit/0fbaf8a3dfd476bf5fae6c44f4a8def76370cd3f))
- docs: link the PR #28 Blender CI run and artifacts in the walkthrough evidence ([482c3d6](https://github.com/ThanhNguyxnOrg/blendops/commit/482c3d6132402dc98635da7a3b20595d0183e0b2))
- chore: regenerate audit inventories ([9010bea](https://github.com/ThanhNguyxnOrg/blendops/commit/9010beac9da91add3120f91d4ca1ba9d7f240275))
- test: add bilingual skill selection eval with a word-overlap baseline and a live-run prompt pack ([145a65f](https://github.com/ThanhNguyxnOrg/blendops/commit/145a65f052958fb3f6eccce981bb58881caf0f46))
- chore: refresh the repository inventory ([a42dbd9](https://github.com/ThanhNguyxnOrg/blendops/commit/a42dbd9154c760251f490756c59bb0c432a43d95))
- chore: regenerate audit snapshots for the asset source gate ([479aa95](https://github.com/ThanhNguyxnOrg/blendops/commit/479aa95f3ae86653de1914d9bd4e0fb733833a11))
- chore: regenerate audit snapshots after rebasing on the selection eval fixes ([715f64e](https://github.com/ThanhNguyxnOrg/blendops/commit/715f64efc855da02d5c15ba17e40e3ede00feca5))
- refactor: split the 7.7k-line runtime orchestrator into scripts/runtime/ modules ([5ac71a0](https://github.com/ThanhNguyxnOrg/blendops/commit/5ac71a084c8acafd2082728a005cef9297f64f02))

