# Runtime Smoke Test Report - Scene Clear (Guarded Destructive + Dry Run)

**Status**: PASS
**Date**: 2026-04-27
**Blender Mode**: GUI bridge (`bridge start --mode gui`)
**Operation**: `scene.clear`
**Guard**: exact confirmation token `CLEAR_SCENE`
**Dry Run**: supported via `--dry-run` flag (CLI) or `dry_run: true` (MCP)

---

## Commands

```bash
node apps/cli/dist/index.js scene clear --verbose
node apps/cli/dist/index.js scene clear --confirm WRONG --verbose
node apps/cli/dist/index.js bridge start --mode gui --verbose
node apps/cli/dist/index.js object create --type cube --name clear_test_cube_seq --location 0,0,1
node apps/cli/dist/index.js scene inspect --verbose
node apps/cli/dist/index.js scene clear --confirm CLEAR_SCENE --dry-run --verbose
node apps/cli/dist/index.js scene inspect --verbose
node apps/cli/dist/index.js scene clear --confirm CLEAR_SCENE --verbose
node apps/cli/dist/index.js scene inspect --verbose
node apps/cli/dist/index.js bridge stop --verbose
```

## Guard validation (CLI)

### Missing confirmation

```json
{
  "ok": false,
  "operation": "cli.invalid_arguments",
  "message": "scene clear requires --confirm CLEAR_SCENE"
}
```

### Wrong confirmation

```json
{
  "ok": false,
  "operation": "cli.invalid_arguments",
  "message": "scene clear requires --confirm CLEAR_SCENE"
}
```

Both guard failures occur before bridge command execution.

## Runtime sequence summary

```text
START_OK=True
CREATE_OK=True
PRE_COUNT=4
DRY_RUN_OK=True DRY_RUN_WOULD_REMOVE=4 DRY_RUN_REMOVED=0
DRY_RUN_POST_COUNT=4
CLEAR_OK=True REMOVED=4 REMAINING=0
POST_COUNT=0
STOP_OK=True
```

## Observed dry-run result

```json
{
  "ok": true,
  "operation": "scene.clear",
  "message": "Dry run: scene.clear would remove 4 object(s)",
  "data": {
    "removed_objects": 0,
    "removed_meshes": 0,
    "remaining_objects": 4,
    "dry_run": true,
    "would_remove_objects": 4,
    "would_remove_meshes": 3
  },
  "request_id": "req_...",
  "receipt": {
    "request_id": "req_...",
    "operation": "scene.clear",
    "ok": true,
    "duration_ms": 0
  }
}
```

## Observed real clear result

```json
{
  "ok": true,
  "operation": "scene.clear",
  "message": "Cleared 4 object(s) from scene",
  "data": {
    "removed_objects": 4,
    "removed_meshes": 3,
    "remaining_objects": 0,
    "dry_run": false,
    "would_remove_objects": 4,
    "would_remove_meshes": 3
  },
  "request_id": "req_...",
  "receipt": {
    "request_id": "req_...",
    "operation": "scene.clear",
    "ok": true,
    "duration_ms": 0
  }
}
```

## Verdict

- confirmation guard: PASS (`cli.invalid_arguments` on missing/wrong token)
- dry-run preview: PASS (`dry_run: true` returns would_remove counts without mutation)
- dry-run preserves state: PASS (object count unchanged after dry-run)
- destructive clear path: PASS (valid token clears scene)
- request correlation: PASS (`request_id` + `receipt` present)

## Remaining risk

- `scene.clear` removes all scene objects by design; callers should use `--dry-run` first and run `scene.inspect` before and after when human verification is required.
