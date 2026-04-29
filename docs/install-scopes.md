# Install Scopes

> [!NOTE]
> Status: Draft v0. BlendOps install/adoption uses scoped attachment modes, not hard-coded one-off tool logic.

## Scope selection at a glance

| Priority | Scope | Default? | Writes allowed | Use when | Avoid when |
|---:|---|---|---|---|---|
| 1 | project-local | Yes | Current project/workspace only | Working inside one repository or workspace | User explicitly requests user-global install |
| 2 | tool-native | Conditional | Verified project-local native paths | Native target path is verified | Path is linked-only or unknown |
| 3 | generic-root fallback | Conditional | `BLENDOPS.md`, optionally backed-up `AGENTS.md` | Native path isn't verified, project writes are allowed | Verified native adapter is available and approved |
| 4 | user-global | No | User-level tool config after explicit approval | User explicitly requests global install and path is verified | Default attach flow or uncertain environment |
| 5 | docs-only/reference | No | None, or one approved pointer file | User requests no mutation or environment is restricted | User explicitly requests attachment mode |

## Safety and rollback matrix

| Scope | Backup requirement | Main risk | Verification checklist |
|---|---|---|---|
| project-local | Required when modifying existing project instruction files | Project-specific drift if not documented | Changed files listed, touched existing files backed up, rollback steps included |
| tool-native | Required before editing existing native files | Path or version drift between tool versions | Adapter selected, native path verified, fallback path defined |
| generic-root fallback | Required if updating existing `AGENTS.md` | Lower native integration depth | Root entrypoint created, collection links valid, fallback reason documented |
| user-global | Mandatory before writing global config | Broad impact across projects | Explicit approval logged, global path evidence recorded, backup path recorded, rollback instructions recorded |
| docs-only/reference | Not applicable unless writing a pointer file | Lower automation convenience | No unintended writes, references provided clearly |

## Scope details

### 1. Project-local

Use as the default because it's the safest and easiest to reverse.

| Field | Value |
|---|---|
| Best fit | Single repository or workspace |
| Allowed writes | Files inside the current project/workspace only |
| Backup rule | Back up existing project instruction files before edits |
| Verification | Changed files, backups, and rollback steps are listed |

### 2. Tool-native

Use only when the target's native project-local path is verified.

| Field | Value |
|---|---|
| Best fit | Verified adapter path with enough confidence to apply |
| Allowed writes | Verified tool-native project-local paths |
| Backup rule | Back up existing native files before edits |
| Verification | Adapter, native path evidence, and fallback path are recorded |

### 3. Generic-root fallback

Use when the target is unknown or partially verified, but project writes are allowed.

| Field | Value |
|---|---|
| Best fit | Unknown or linked-only native adapter path |
| Allowed writes | `BLENDOPS.md` in project root, optionally `AGENTS.md` with backup if modified |
| Backup rule | Back up existing `AGENTS.md` before updates |
| Verification | Root entrypoint exists, links to `skills/`, `laws/`, and `packs/` are valid |

### 4. User-global

Use only after explicit opt-in from the user.

> [!CAUTION]
> Don't use user-global as a fallback. It can affect multiple projects and must have path evidence, approval, backup, and rollback notes.

| Field | Value |
|---|---|
| Best fit | User explicitly asks for a global install |
| Allowed writes | User-level tool config only after explicit approval |
| Backup rule | Mandatory before writing global config |
| Verification | Approval, global path evidence, backup path, and rollback instructions are recorded |

### 5. Docs-only/reference mode

Use when the user wants guidance without workspace mutation, or when writes are restricted.

| Field | Value |
|---|---|
| Best fit | Restricted environment or no-write request |
| Allowed writes | None, or one minimal pointer file if approved |
| Backup rule | Not applicable unless writing a pointer file |
| Verification | Confirm no unintended writes and provide clear references |

## Default selection rule

1. project-local
2. tool-native, if verified
3. generic-root fallback, if native path is uncertain
4. user-global, only by explicit opt-in
5. docs-only/reference, on request or restriction

## Generic-root vs docs-only quick rule

| Situation | Scope |
|---|---|
| Tool-native path is linked-only/unknown but project writes are allowed | generic-root fallback |
| User requests no file writes or environment is restricted | docs-only/reference |
| Project-local instruction file can be created safely | generic-root fallback |
| Compliance/policy forbids writing project files | docs-only/reference |
