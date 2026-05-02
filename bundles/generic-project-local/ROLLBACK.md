# Generic Project-Local Rollback

Status: Draft v0 rollback notes  
Target: generic-project

## Remove BLENDOPS.md

If the generic bundle installed `BLENDOPS.md` at the project root:

```sh
rm BLENDOPS.md
```

On PowerShell:

```powershell
Remove-Item BLENDOPS.md
```

## Restore AGENTS.md if patched later

If a future install patched `AGENTS.md`, restore the backup recorded in the install report.

Example:

```sh
cp AGENTS.md.blendops-backup AGENTS.md
```

On PowerShell:

```powershell
Copy-Item AGENTS.md.blendops-backup AGENTS.md -Force
```

Only run the restore command if that backup file exists and the install report confirms it was created.

## Remove project-local metadata if added later

If a future installer creates a project-local metadata folder such as `.blendops/`, remove only the folder listed in the install report.

Example:

```sh
rm -rf .blendops
```

On PowerShell:

```powershell
Remove-Item .blendops -Recurse -Force
```

## No global rollback

The generic project-local bundle must not touch global files. If an install report says global files were touched, treat that as outside this fixture's expected behavior and review manually before deleting anything.

## Post-rollback check

After rollback, verify:

- `BLENDOPS.md` is absent or restored to its pre-install state,
- `AGENTS.md` is restored if it was patched,
- any project-local metadata folder listed by the report is removed,
- runtime status remains `Not Run`,
- artifact status remains `Not Produced`.
