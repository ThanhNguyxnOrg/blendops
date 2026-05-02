# Local Installer Script Spec

Status: Draft v0 design spec only  
Scope: future local installer for BlendOps skill/law/pack project-local attachment

> [!IMPORTANT]
> This is a specification only. `scripts/install-skills.mjs` is not implemented yet. Do not tell users to run these commands until the script exists and has install/rollback test evidence.

## Purpose

Define the expected behavior for a future local installer script that attaches BlendOps skills, laws, packs, and selected docs to a project or prepares a Claude Desktop bundle output.

The first static reference fixture for this behavior is `bundles/generic-project-local/`.

The installer must preserve the existing BlendOps boundaries:

- Skill install is not Blender runtime setup.
- The installer does not install Blender.
- The installer does not configure Claude Desktop Connector.
- The installer does not configure the official Blender MCP bridge/add-on.
- The installer does not configure third-party runtime bridges.
- The installer does not run Blender or runtime eval.
- The installer does not create, render, export, or claim preview/render/GLB artifacts.

## Future command shape

These commands are proposed future UX only.

```sh
# Future only — not implemented
node scripts/install-skills.mjs --target auto --project .

# Future only — not implemented
node scripts/install-skills.mjs --target claude-code --project .

# Future only — not implemented
node scripts/install-skills.mjs --target opencode --project .

# Future only — not implemented
node scripts/install-skills.mjs --target antigravity --project .

# Future only — not implemented
node scripts/install-skills.mjs --target claude-desktop --out dist/claude-desktop

# Future only — not implemented
node scripts/install-skills.mjs --doctor
```

## Required command behavior

| Flag | Required behavior |
|---|---|
| `--target <name>` | Select exactly one target. `auto` may inspect the project but must not override explicit user choice. |
| `--project <path>` | Project-local install root. Required for project targets. Defaults should be conservative and explicit. |
| `--out <path>` | Output directory for bundle-style targets such as Claude Desktop. Must not imply runtime setup. |
| `--doctor` | Read-only diagnostics only. Must not write files. |
| `--dry-run` | Required before write mode. Shows planned writes, skips, backups, and rollback manifest path. |
| `--write` | Allowed only after a successful dry-run plan is shown or recorded. |
| `--allow-global` | Future explicit opt-in only. No global writes are allowed without this plus verified path and backup. |

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

## Rollback manifest

Every write-mode run must create a rollback manifest before changing files.

Manifest fields:

| Field | Required content |
|---|---|
| installer_version | Script version or `unknown` during draft. |
| timestamp | Local timestamp. |
| target | Selected target. |
| scope | `project-local`, `docs-only`, `bundle-output`, or explicitly approved `global`. |
| project | Project root or output path. |
| files_created | List of created paths. |
| files_modified | List of modified paths. |
| backups | Backup paths for every modified existing file. |
| files_skipped | Skipped paths and reasons. |
| global_touched | `false` unless explicitly approved. |
| runtime_status | Always `Not Run` for install. |
| artifact_status | Always `Not Produced` for install. |
| rollback_steps | File-specific restore/remove commands. |

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

## Implementation gates before promotion

Before this spec becomes an implemented script, require:

- dry-run tests for every target key
- write-mode tests in disposable fixture projects
- rollback tests
- no-global-write tests
- ambiguity detection tests
- docs/check integration
- conservative report snapshots
- explicit evidence that no runtime/artifact actions occurred
