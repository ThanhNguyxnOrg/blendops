# Local Installer & Distributable CLI Spec

Status: 1.0.0 — local repository script (`scripts/install-skills.mjs`) and distributable CLI (`bin/blendops.mjs`) implemented
Scope: project-local installer and tarball-packable CLI for BlendOps skill/law/pack attachment and manual Claude Desktop export prep

> [!IMPORTANT]
> `scripts/install-skills.mjs` is implemented as the local repository installer and verified by `scripts/test-project-installer.mjs`, and `bin/blendops.mjs` provides the distributable CLI entrypoint verified via `npm pack` + consumer tarball installation in `scripts/test-cli-package.mjs`. No `npx blendops` CLI, published npm package, or marketplace listing exists yet; the initial staged npm publication is pending maintainer approval. Global installs (`--allow-global`) remain disabled.

## Purpose

Define the behavior contract for the local repository installer script (`scripts/install-skills.mjs`) and the distributable CLI entrypoint (`bin/blendops.mjs`) that attach BlendOps skills, laws, packs, and selected docs to a target project or prepare a Claude Desktop manual upload bundle output.

The first static reference fixture for this behavior is `bundles/generic-project-local/`.

The installer must preserve the existing BlendOps boundaries:

- Skill install is not Blender runtime setup.
- The installer does not install Blender.
- The installer does not configure Claude Desktop Connector.
- The installer does not configure the official Blender MCP bridge/add-on.
- The installer does not configure third-party runtime bridges.
- The installer does not run Blender or runtime eval.
- The installer does not create, render, export, or claim preview/render/GLB artifacts.

## Distributable CLI & local repository command shape

Invoke either via the `blendops` binary (`bin/blendops.mjs` or `node_modules/.bin/blendops` after installing a local `npm pack` tarball) or via `node scripts/install-skills.mjs` from a local checkout (dry-run is mandatory before write):

```sh
# Version & help
blendops --version
blendops --help

# Read-only diagnostics (package health + target project inspection)
blendops doctor
blendops doctor --target auto --project /path/to/project
node scripts/install-skills.mjs --doctor --target auto --project /path/to/project

# Generic project-local install (dry-run then write)
blendops install --target auto --project /path/to/project --dry-run
blendops install --target auto --project /path/to/project --write
node scripts/install-skills.mjs --target auto --project /path/to/project --dry-run
node scripts/install-skills.mjs --target auto --project /path/to/project --write

# Claude Code project-local attachment (CLAUDE.md + BLENDOPS.md)
blendops install --target claude-code --project /path/to/project --dry-run
blendops install --target claude-code --project /path/to/project --write

# Cursor / Codex with explicit target-path confirmation
blendops install --target cursor --project /path/to/project --confirm-target-path --dry-run
blendops install --target cursor --project /path/to/project --confirm-target-path --write

# Claude Desktop manual upload bundle output (48 per-skill ZIPs + manual bundle)
blendops install --target claude-desktop --out /tmp/blendops-claude-desktop --dry-run
blendops install --target claude-desktop --out /tmp/blendops-claude-desktop --write

# Deterministic rollback from recorded .blendops/install-manifest.json
blendops rollback --project /path/to/project
node scripts/install-skills.mjs --rollback --project /path/to/project
```

## Package readiness & publish-safety boundary

- `package.json` declares `"bin": { "blendops": "bin/blendops.mjs" }`, runtime `"dependencies": { "fflate": "0.8.3" }`, and an explicit `"files"` allowlist so `npm pack` produces a self-contained tarball (`blendops-1.0.0.tgz`) containing all 48 skills, 4 laws, 1 pack, bundles, registry files, schemas, and scripts while excluding test suites, dev server, audit snapshots, and `.git` artifacts.
- Historical registry check (2026-10-31): `npm view` returned `E404` for `blendops`, `@thanhnguyxn/blendops`, and `@blendops/cli`. This result is not a live availability guarantee; re-check the exact package name before staging.
- `package.json` omits `private` and sets `publishConfig.access: public`. The package is publishable, but is not live on npm until its first staged version is reviewed and approved.

## First npm publication

1. From the repository root, confirm the exact name is still available with `npm view blendops version` (a not-found response is expected only if the name remains unclaimed).
2. Use Node `22.14.0+` and npm CLI `11.15.0+`, then run `npm stage publish`.
3. Open npmjs.com → **Staged Packages**, inspect the submitted `blendops@1.0.0`, and approve it with npm 2FA. For a new package, npm may create a public `0.0.0-stage` placeholder; the staged `1.0.0` contents remain unavailable until approval.
4. After approval, verify `npm view blendops version` and install the package in a clean consumer project before claiming public availability.
5. Configure npm Trusted Publishing for GitHub Actions (`ThanhNguyxnOrg` / `blendops` / `.github/workflows/npm-publish.yml`). The existing workflow intentionally skips the bootstrap tag `v1.0.0`; future version tags use OIDC and do not need a long-lived `NPM_TOKEN` secret.

## Required command behavior

| Subcommand / Flag | Required behavior |
|---|---|
| `doctor` / `--doctor` | Read-only diagnostics only. Verifies Node.js runtime, required package assets, 48 canonical skills, target project markers, and existing `.blendops/install-manifest.json` or `.blendops/transaction-journal.json` state without writing files. |
| `install` | Subcommand for `--dry-run` or `--write` installation. Defaults `--target` to `auto` when `--project <path>` is supplied without `--target`. |
| `rollback` / `--rollback` | Restores modified files byte-for-byte from `.blendops/backups/` and removes installer-created files recorded in `.blendops/install-manifest.json`. Refuses to overwrite post-install user edits unless `--force-rollback` (`--force`) is explicitly passed. |
| `--version`, `-v`, `version` | Prints `blendops <version>` and exits with code 0 without modifying files. |
| `--help`, `-h`, `help` | Prints CLI and script usage, supported targets, and runtime boundaries without modifying files. |
| `--target <name>` | Select exactly one target (`auto`, `claude-code`, `opencode`, `cursor`, `codex`, `gemini`, `antigravity`, `github-copilot`, `generic-project`, `claude-desktop`). `auto` may inspect the project but must not override explicit user choice. |
| `--project <path>` | Project-local install root. Required for project targets. Must be an existing, non-symlinked directory outside the BlendOps repository and outside global home configs. |
| `--out <path>` / `--output <path>` | Output directory for bundle-style targets such as `claude-desktop`. Must not exist prior to write and must not imply UI import or runtime setup. |
| `--dry-run` | Required before write mode. Records a verified plan and shows planned writes, skips, backups, and rollback manifest path without mutating target project files. |
| `--write` | Allowed only after a matching, non-stale `--dry-run` plan is recorded for the exact target, options, source fingerprint, and target file state. |
| `--confirm-target-path` | Explicit opt-in for documented `linked-only` project-local target files (`.cursor/rules/blendops.mdc` for `cursor` or `AGENTS.md` for `codex`). Never invents unverified directories. |
| `--patch-agents-md` | Explicit opt-in to create or append a managed BlendOps section in `AGENTS.md` (with pre-install backup when `AGENTS.md` already exists). |
| `--patch-claude-md` | Explicit opt-in to create or append a managed BlendOps section in `CLAUDE.md` (with pre-install backup when `CLAUDE.md` already exists). |
| `--allow-global` | Disabled. Global writes are not permitted. |

## Dry-run-before-write requirement

Write mode must be gated by dry-run.

Dry-run output must include:

- selected target and confidence label
- detected project markers
- files to create
- files to modify
- files to skip
- backups that would be created
- rollback manifest path
- runtime status: `Not Run`
- artifact status: `Not Produced`

Write mode must refuse to proceed if:

- no dry-run plan exists for the same target/project/out path
- multiple targets are detected and user did not choose one
- a target path is unverified and no generic fallback was selected
- a write would touch global config without explicit opt-in
- rollback manifest cannot be created

## Target detection rules

Auto-detect is convenience, not authority.

| Detection | Required action |
|---|---|
| Explicit `--target` provided | Use that target only. Do not auto-switch. |
| Exactly one confident target marker found | Select that target and report confidence. |
| Multiple target markers found | Stop and ask for explicit target; dry-run may show options only. |
| No target markers found | Use `generic-project` fallback. |
| Target path is candidate/unverified | Use generic fallback unless user explicitly confirms that target and path. |
| Claude Desktop requested | Produce manual/user-managed output bundle only; do not interact with UI. |

## Ambiguity handling

The installer must be conservative:

- one target per install run
- no silent merge of multiple target behaviors
- no invented native paths
- no global fallback
- no runtime setup fallback
- no package/plugin/marketplace claim

If ambiguity exists, output an action-required message with choices and stop before writing.

## Project-local default

The default install scope is project-local.

Allowed project-local outputs may include:

- `BLENDOPS.md`
- backed-up minimal patch to `AGENTS.md`
- target-specific project instruction file only when path is verified
- copied or referenced `skills/`, `laws/`, `packs/`, and selected docs
- install report and rollback manifest under a project-local metadata path if one is later defined

## No global writes unless explicit

Global writes require all of the following:

1. explicit user request,
2. verified global target path,
3. dry-run plan,
4. backup plan,
5. rollback manifest,
6. write-mode confirmation.

Global writes must never be the fallback path.

## Target path map

| Target | Future target key | Near-term path behavior | Confidence |
|---|---|---|---|
| Auto | `auto` | Detect one target or fall back to `generic-project`; stop on ambiguity. | detection-dependent |
| Claude Code | `claude-code` | Project-local `CLAUDE.md`/generic fallback; native path only if verified in environment. | verified-read for project-local; native unresolved |
| OpenCode | `opencode` | Project-local fallback; native path candidate only. | linked-only |
| Cursor | `cursor` | `.cursor/rules` only if verified; otherwise generic fallback. | linked-only |
| Codex CLI/App | `codex` | `BLENDOPS.md` and optional backed-up `AGENTS.md`; no native loader assumed. | linked-only |
| Gemini CLI | `gemini` | Generic fallback until adapter evidence exists. | not researched |
| Antigravity | `antigravity` | Generic fallback; `.agent/skills` or similar paths are candidate/needs verification. | not researched |
| GitHub Copilot | `github-copilot` | Generic project docs/instructions fallback; no extension/listing claim. | linked-only/generic |
| Generic project | `generic-project` | Project-root `BLENDOPS.md`; optional backed-up `AGENTS.md`. | verified-read fallback |
| Claude Desktop | `claude-desktop` | User-managed manual import/copy bundle under `--out`; no UI automation. | linked-only/manual |

## Rollback manifest, transactional writes, and user-edit preservation

Every write-mode run executes as a single recoverable transaction backed by `.blendops/transaction-journal.json` and persists a provisional rollback manifest before mutating target project files.

Manifest fields:

| Field | Required content |
|---|---|
| installer_version | Script version (`1.0.0` or package version). |
| timestamp | Local timestamp. |
| target | Selected target. |
| scope | `project-local`, `docs-only`, `bundle-output`, or explicitly approved `global`. |
| project | Project root or output path. |
| files_created | List of created paths. |
| files_modified | List of modified paths. |
| backups | Backup paths for every modified existing file. |
| files_skipped | Skipped paths and reasons. |
| created_file_hashes | Exact post-install SHA-256 hashes for every file in `files_created`. |
| modified_file_hashes | Pre-install backup SHA-256, post-install SHA-256, and `.blendops/backups/*.bak` path for every file in `files_modified`. |
| metadata_files | SHA-256 integrity metadata for `.blendops/INSTALL_REPORT.md` and `.blendops/install-manifest.json`. |
| global_touched | `false` unless explicitly approved. |
| runtime_status | Always `Not Run` for install. |
| artifact_status | Always `Not Produced` for install. |
| rollback_steps | File-specific restore/remove commands. |

### Transactional write recovery

1. Before any disk write, the installer captures the exact pre-transaction bytes and existence state of `.blendops/install-manifest.json`, `.blendops/INSTALL_REPORT.md`, every backup file newly created by the transaction, and every target file to be created or modified.
2. During `--write`, the installer records a transaction journal, writes newly created backups, persists the provisional rollback manifest, applies target file writes with immediate path and SHA-256 revalidation, and writes and verifies `.blendops/INSTALL_REPORT.md` inside the same transaction `try / catch`.
3. If any target write or report write fails, transactional recovery restores modified target files byte-for-byte, removes only target files newly created by the failed transaction, restores the previous manifest and report byte-for-byte (or removes them if this was the first install), removes only backups created by the failed transaction, verifies every restoration with SHA-256, and explicitly surfaces any cleanup/restoration error.

### User-edit preservation on installer-created files

1. Before modifying any path previously recorded in `files_created`, the installer compares the file's current SHA-256 against the previous manifest's `created_file_hashes[path]`.
2. When an installer-created file (`BLENDOPS.md`, `AGENTS.md`, `CLAUDE.md`, or `.cursor/rules/blendops.mdc`) has been edited by the user outside the intact `<!-- BLENDOPS:BEGIN --> ... <!-- BLENDOPS:END -->` managed block, rerunning the installer transitions the file from `files_created` to `files_modified`, saves a verified backup of the user's pre-rerun bytes under `.blendops/backups/`, preserves the user's custom section while updating only the managed block, and restores the user-edited file on `--rollback` instead of deleting it.
3. If preservation cannot be guaranteed (missing, duplicated, or out-of-order managed markers; edits made inside the managed block; binary/NUL content; or unrolled-back edits on a file already in `files_modified`), `--dry-run` and `--write` fail closed without modifying target files or refreshing ownership hashes.

## Install report contract

Every run should end with a concise report.

```md
## BlendOps installer report

- Target selected:
- Confidence:
- Mode: dry-run | write | doctor
- Scope:
- Project/out path:
- Files created:
- Files modified:
- Files skipped:
- Backups:
- Rollback manifest:
- Global files touched: No
- Runtime status: Not Run
- Artifact status: Not Produced
- Runtime setup: Separate; not performed
- Limitations:
```

## Doctor mode

`--doctor` is read-only.

It may check:

- whether required BlendOps source files exist
- whether target markers exist
- whether multiple targets appear present
- whether removed duplicate docs-level skill/law/pack collection folders are absent
- whether runtime/artifact claims are absent from install outputs

It must not:

- write files
- install runtime components
- run Blender
- run runtime eval
- create artifacts

## Runtime and artifact non-actions

Installer success means only that files were copied, referenced, or bundled as planned.

It must not claim:

- Blender is installed,
- Claude Desktop Connector is configured,
- official Blender MCP bridge/add-on is configured,
- `agents/openai.yaml` in the canonical package is a universal adapter layer (it is OpenAI/ChatGPT Skills UI metadata only),
- direct official MCP is supported from non-Claude Desktop agents,
- runtime eval passed,
- preview/render/GLB artifacts were produced,
- package/plugin/marketplace availability exists.

Runtime status remains `Not Run`. Artifact status remains `Not Produced`.

## Regression gates enforced

Automated tests verify:

- dry-run tests for every target key
- write-mode tests in disposable fixture projects
- rollback tests
- no-global-write tests
- ambiguity detection tests
- docs/check integration
- conservative report snapshots
- explicit evidence that no runtime/artifact actions occurred
