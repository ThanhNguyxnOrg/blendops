# BlendOps Agent Install Guide

> [!IMPORTANT]
> Draft v0 install flow. This attaches BlendOps docs, laws, skills, and pack files to an AI coding workspace. It doesn't install Blender, run Blender, or prove runtime behavior.

## Mission

Install or attach the BlendOps v0 official-runtime core collection to the current AI coding workspace.

| Core item | Path |
|---|---|
| Skills | `skills/` |
| Laws | `laws/` |
| Packs | `packs/` |
| Runtime boundary docs | Selected docs under `docs/` |

## Safety rules

| Rule | Required behavior |
|---|---|
| No runtime install | Don't install Blender runtime. |
| No runtime execution | Don't run Blender. |
| No runtime claims | Don't claim runtime works without evidence. |
| Official runtime only | Don't use non-official runtime paths. |
| No surprise global changes | Don't modify global config unless the user explicitly requested global install. |
| Project-local first | Prefer project-local install. |
| Backups before edits | Don't overwrite existing config without backup. |
| Human approval for risk | Ask before destructive changes. |

## Install flow

| Step | Action | Output |
|---|---|---|
| 1 | Build capability profile | Target type, write permissions, adapter confidence |
| 2 | Select install scope | One scope from the ordered list below |
| 3 | Select adapter | Adapter from registry, or generic fallback |
| 4 | Attach core collection | Copy or reference the allowed BlendOps files |
| 5 | Create entrypoint | Adapter-specific file, or `BLENDOPS.md` fallback |
| 6 | Verify install | Safety checks, file list, rollback plan |
| 7 | Share first-use prompt | Safe prompt with no runtime overclaim |

## Step 1: Build capability profile

Record these fields before editing files:

| Field | Examples |
|---|---|
| Target name/type | Claude Code, Claude app/Desktop, OpenCode, Cursor, Codex, unknown |
| Native skill/rules support | verified, linked-only, unknown |
| Project file write capability | yes, no, restricted |
| Global config capability | yes, no, unknown |
| Adapter confidence label | verified, linked-only, unknown |

## Step 2: Select install scope

Default order:

| Priority | Scope | Use when |
|---:|---|---|
| 1 | project-local | Default, safest, reversible workspace install |
| 2 | tool-native | Native path is verified for the target |
| 3 | generic-root fallback | Native path is uncertain, project writes are allowed |
| 4 | user-global | User explicitly opted in and path is verified |
| 5 | docs-only/reference | Writes are disallowed or user wants reference only |

Scope precedence:

| If | Then |
|---|---|
| Tool-native path is verified | Use project-local plus tool-native placement. |
| Tool-native path is linked-only or unknown | Use project-local plus generic-root fallback. |
| Writes aren't allowed or weren't requested | Use docs-only/reference mode. |

## Step 3: Select adapter

Use the adapter registry:

| Source | Purpose |
|---|---|
| `docs/adapter-registry.md` | Target list and confidence labels |
| `docs/adapters/*.md` | Target-specific install mapping |
| `docs/adapters/generic-root.md` | Fallback for uncertain targets |

If the target is uncertain, use `docs/adapters/generic-root.md`.

## Step 4: Attach core collection

Attach by copy or reference:

| Attach | Path |
|---|---|
| Skills | `skills/` |
| Laws | `laws/` |
| Packs | `packs/` |
| Runtime setup boundary | `docs/external-runtime-setup.md` |
| Runtime reference boundary | `docs/reference-runtime.md` |

## Step 5: Create entrypoint

| Condition | Entrypoint |
|---|---|
| Adapter-specific entrypoint is verified | Use the adapter doc. |
| Native path isn't verified | Create `BLENDOPS.md` in project root. |

Fallback template:

- `docs/examples/blendops-root-entrypoint.md`

## Step 6: Verify install

### Safety checks

| Check | Pass condition |
|---|---|
| Runtime commands | No Blender runtime commands were run. |
| Global config | No global config changed unless explicitly approved. |
| Backups | Backups exist for touched existing files. |
| Scope | Scope and fallback reason are recorded. |
| Rollback | Restore steps are clear and file-specific. |

### Final report template

```md
## BlendOps install report

Status: Draft v0 attachment complete

### Scope
- Scope used:
- Adapter used:
- Adapter confidence:
- Fallback reason, if any:

### Files changed
| Path | Action | Backup |
|---|---|---|
|  |  |  |

### Safety confirmation
- [ ] Blender runtime was not installed.
- [ ] Blender was not run.
- [ ] No runtime success was claimed.
- [ ] No global config changed unless explicitly approved.
- [ ] Existing files were backed up before modification.

### Rollback
1. Remove newly attached files:
2. Restore backups:
3. Confirm post-rollback state:

### First-use prompt
Use the BlendOps v0 product hero pack to plan a cyberpunk shoe web hero.
Do not run Blender until runtime is explicitly available.
Do not claim preview, render, or GLB artifacts exist without evidence.
```

## Step 7: First-use prompt

```txt
Use the BlendOps v0 product hero pack to plan a cyberpunk shoe web hero.
Do not run Blender until runtime is explicitly available.
Do not claim preview, render, or GLB artifacts exist without evidence.
```

## Rollback / uninstall

| Action | Requirement |
|---|---|
| Remove attached files | Delete only newly added project-local BlendOps files. |
| Restore modified files | Restore backups for every modified existing file. |
| Confirm state | Report remaining files, restored files, and any manual cleanup. |

## Source confidence note

When assumptions are uncertain, label them as `linked-only` or `unknown` and avoid invented tool-specific behavior.
