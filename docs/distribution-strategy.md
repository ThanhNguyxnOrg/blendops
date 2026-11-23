# Distribution Strategy

Status: `blendops@1.0.0` published on npm; GitHub skill source listed on skills.sh  
Scope: BlendOps content and CLI distribution, not Blender runtime distribution

> [!NOTE]
> BlendOps has two public developer distribution channels: the npm CLI package and the GitHub-hosted Agent Skills collection listed on skills.sh. Neither is a Blender runtime or MCP server. This document does not claim BlendOps is published in any marketplace; skills.sh is an Agent Skills discovery directory, not an official marketplace/plugin listing. Do not claim official marketplace listing until the listing is actually published and verified. Do not claim availability until it is verified for the specific surface.

---

## Distribution levels

| Level | Name | Meaning | Current posture |
|---:|---|---|---|
| 0 | Docs-only/reference | Users read docs, copy prompts, or link source material without installing files. | Available in this repository. |
| 1 | Project-local file install | Users or agents attach BlendOps docs, skills, laws, packs, and `.blendops/catalog/*` to a project. | Supported by the published npm CLI and local repository installer. |
| 2 | User-managed Claude Desktop skill import + shared catalog attachment | User manually imports individual skill ZIPs and optionally attaches the shared catalog to Claude Project Knowledge. | Supported via `npm run skills:export` or the CLI bundle target; manual UI import remains the user's action. |
| 3 | GitHub-hosted Agent Skills / skills.sh | The public GitHub repo exposes canonical `SKILL.md` folders to the Skills CLI; skills.sh provides discovery and install information. | [Listed now](https://www.skills.sh/ThanhNguyxnOrg/blendops); install with `npx skills add ThanhNguyxnOrg/blendops`. |
| 4 | npm CLI package | A self-contained `blendops` CLI package is published to the npm registry. | [Published: `blendops@1.0.0`](https://www.npmjs.com/package/blendops); dist-tag `latest`. |
| 5 | Official marketplace/plugin listing | BlendOps appears in a third-party product marketplace/catalog with its own review or approval. | Not published; future, evidence-gated work only. |

The npm CLI and skills.sh are complementary, not interchangeable. Use npm for the BlendOps installer and utility commands. Use `npx skills add` when the goal is to install selected Agent Skills into a supported coding agent.

---

## Install from the public channels

### npm CLI

The package supports Node.js `>=20.0.0`. No global install or repository clone is required:

```sh
npx blendops --help
npx blendops --version
npx blendops doctor --project .
npx blendops install --target auto --project . --dry-run
npx blendops install --target auto --project . --write
```

Review the dry-run plan before running the matching write. The CLI installer defaults to project-local operations; global file writes remain disabled.

Optional: install the CLI executable globally on PATH:

```sh
npm install --global blendops
blendops --help
```

Installing the executable globally does not enable global writes by the BlendOps installer. The `--allow-global` installer option remains disabled.

Verify the registry metadata independently:

```sh
npm view blendops version
npm view blendops dist-tags
npm view blendops dist.tarball
```

Expected current version and `latest` tag: `1.0.0`.

### skills.sh / Agent Skills CLI

BlendOps is listed at [skills.sh/ThanhNguyxnOrg/blendops](https://www.skills.sh/ThanhNguyxnOrg/blendops). Install from the public GitHub repository:

```sh
npx skills add ThanhNguyxnOrg/blendops
```

The Skills CLI guides you through selecting skills and supported agent targets. The root `skills.sh.json` supplies the four display groups used by the repository listing. It is repository metadata, not a ZIP or package that needs a separate upload. Keep the GitHub repository public and maintain valid canonical `SKILL.md` files and grouping metadata; there is no separate skills.sh package upload or npm stage/approve step.

The skills.sh page displays live catalog metrics. Those metrics are not the canonical source-of-truth skill count. BlendOps' canonical inventory remains **14 skills**, documented in [`skills/README.md`](../skills/README.md) and grouped in [`skills.sh.json`](../skills.sh.json).

---

## Package publication and release automation

- The npm registry currently serves `blendops@1.0.0` with dist-tag `latest`. The package metadata identifies `ThanhNguyxnOrg/blendops`, the MIT license, and `bin/blendops.mjs` as the `blendops` executable.
- The initial bootstrap used npm staged publishing. The temporary `0.0.0-stage` placeholder may remain in version history; it is not the `latest` version and is not the operational CLI release.
- [`.github/workflows/npm-publish.yml`](../.github/workflows/npm-publish.yml) skips the already-published bootstrap tag `v1.0.0`. Later `v*` tags run release validation and publish through npm Trusted Publishing (OIDC).
- Before the next version tag, configure npm Trusted Publishing once: provider GitHub Actions, organization `ThanhNguyxnOrg`, repository `blendops`, workflow filename `npm-publish.yml`, and no environment unless the workflow is changed. This Trusted Publisher account setting has not been independently verified as configured; check it before relying on the next tag.
- With Trusted Publishing configured, the workflow uses the GitHub OIDC identity; a long-lived `NPM_TOKEN` is not required.
- The README shown on npm for version `1.0.0` is an immutable snapshot bundled at publication time. GitHub README changes do not retroactively update that version page; refreshed npm documentation will appear with the next package version (for example, `1.0.1`).

A pre-publication registry check on 2026-10-31 returned `E404` for candidate names. That historical result is superseded by the successful publication of `blendops@1.0.0`. An npm registry `E404` only describes what was available at the time of the query; it does **not** guarantee reservation rights, npm similarity/anti-typosquatting clearance, trademark rights, or scope ownership.

---

## Permission and approval expectations

| Distribution route | Approval expectation | Requirement before claiming availability |
|---|---|---|
| User-managed install | No marketplace approval needed. | Clear manual instructions and rollback/safety caveats. |
| GitHub/skills.sh | No separate marketplace application; source must be public and discoverable by the Skills CLI. | Valid source skill folders and a live listing/install route. |
| npm CLI | Registry publication permission; first-time staged publication required maintainer 2FA approval. | Package version appears on npm and registry metadata confirms the intended dist-tag. |
| Official marketplace | May require platform approval, review, listing permission, or policy compliance. | Marketplace listing is published and install evidence is recorded. |

Do not claim availability until it is verified for the specific surface.

---

## Automated distribution metadata audit

The repository keeps these source files authoritative:

- `package.json` + `package-lock.json`: the next npm package manifest and dependency lock. A published npm version is immutable; changing these files on GitHub does not rewrite an already-published tarball or README.
- `skills.sh.json`: the curated eight-group skills.sh page manifest. Its grouped slugs must map one-to-one to the canonical `skills/<slug>/SKILL.md` directories. The upstream `notGrouped` enum is `top` or `bottom`; BlendOps currently uses `bottom`.
- `skills/*/SKILL.md`: canonical skill source and inventory.

Run `npm run distribution:check` for the offline local contract. The [Distribution Metadata Sync workflow](../.github/workflows/distribution-metadata-sync.yml) runs when these source files change and weekly. It checks the public npm registry and live skills.sh page, then lets **ThanhNguyxnAgent** commit the deterministic snapshot to `docs/audits/current/distribution-metadata.json`.

The workflow is intentionally conservative:

- It never increments `package.json.version`, publishes npm, or overwrites a published npm version. It reports when the repository is ahead of or behind the registry and when the published npm README is older than the current GitHub README; a new versioned release is required to update npm.
- It never invents skill categories or changes curated groupings. Missing, duplicate, or unknown skill slugs fail the local contract; a maintainer must assign a new skill to the right group.
- It compares the canonical grouped skills with the live skills.sh page but records the page's displayed metric separately. skills.sh may retain older ungrouped names in its “Other skills” area; that display/telemetry count is not the canonical BlendOps inventory.

This makes external distribution drift visible without silently rewriting release versions or taxonomy.

---

## Runtime boundary

Distribution strategy does not change runtime strategy.

- Public runtime guidance uses **2 MCP execution paths plus a CLI fallback appendix** (see [runtime-stack-strategy.md](./runtime-stack-strategy.md)):
  1. **Path 1 — Official Blender Lab MCP** (Lab add-on + Lab server installed in Blender 5.1+, hosted from either Anthropic Blender Connector in Claude Desktop or another manually configured MCP client).
  2. **Path 2 — Community `mcp-for-blender`** (mature third-party, Blender 3.0+).
  3. **CLI fallback (appendix)** — direct `blender --background --python`; documented upstream as a first-class Blender CLI surface; see the [scoped mech-prop CLI eval](./evals/cli-fallback-mech-prop.md).
- Anthropic Connector is **not** standalone. The Blender Lab MCP add-on must also be installed in Blender.
- Blender runtime setup is separate from BlendOps skill/CLI distribution.
- Runtime artifacts still require eval evidence before any claim. The full official runtime manual eval remains `Not Run` until an operator executes the eval packet and records evidence.

---

## What this strategy does not do

- It does not publish BlendOps to an official marketplace or plugin directory.
- It does not automatically create a new npm release when documentation changes; a versioned release is still required.
- It does not install Blender.
- It does not configure a runtime bridge.
- It does not create or claim preview/render/GLB artifacts.
- It does not introduce a BlendOps-owned custom runtime implementation.
