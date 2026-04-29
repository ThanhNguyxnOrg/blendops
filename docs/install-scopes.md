# Install Scopes

Status: Draft v0

BlendOps install/adoption uses scoped attachment modes rather than hard-coded one-off tool logic.

## Scope 1 — project-local

### When to use
- default mode
- safest and most reversible option
- working inside a single repository/workspace

### When not to use
- when user explicitly requests user-global install

### Allowed writes
- files inside current project/workspace only

### Backup/rollback requirement
- required when modifying existing project instruction files

### Risks
- project-specific drift if not documented

### Verification checklist
- changed files listed
- touched existing files backed up
- rollback steps included

---

## Scope 2 — user-global

### When to use
- only when user explicitly requests global install
- only when global target path is verified

### When not to use
- default attach flow
- uncertain environment/path assumptions

### Allowed writes
- user-level tool config only after explicit approval

### Backup/rollback requirement
- mandatory before writing global config

### Risks
- broad impact across projects
- harder rollback if not tracked

### Verification checklist
- explicit user approval logged
- global path evidence recorded
- backup path recorded
- rollback instructions recorded

---

## Scope 3 — tool-native

### When to use
- tool-native install path is verified for current target
- adapter confidence is high enough to apply

### When not to use
- path is linked-only/unknown

### Allowed writes
- verified tool-native project-local paths

### Backup/rollback requirement
- required before editing existing native files

### Risks
- path/version drift between tool versions

### Verification checklist
- adapter selected explicitly
- native path verified
- fallback path defined

---

## Scope 4 — generic-root fallback

### When to use
- default fallback for unknown or partially verified tools
- tool-native path not verified

### When not to use
- verified native adapter already available and approved

### Allowed writes
- `BLENDOPS.md` in project root
- optionally `AGENTS.md` with backup if modified

### Backup/rollback requirement
- required if updating existing `AGENTS.md`

### Risks
- lower native integration depth

### Verification checklist
- root entrypoint created
- links to `skills/`, `laws/`, `packs/` are valid
- fallback reason documented

---

## Scope 5 — docs-only/reference mode

### When to use
- user requests no workspace mutation
- environment is highly restricted

### When not to use
- user explicitly requests attachment mode

### Allowed writes
- none, or one minimal pointer file if approved

### Backup/rollback requirement
- not applicable unless writing a pointer file

### Risks
- lower automation convenience

### Verification checklist
- no unintended writes
- references provided clearly

---

## Scope selection rule

Default order:
1. project-local
2. tool-native (if verified)
3. generic-root fallback (if native uncertain)
4. user-global only by explicit opt-in
5. docs-only/reference on request or restriction
