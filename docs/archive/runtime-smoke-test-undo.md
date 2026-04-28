# Runtime Smoke Test Report - Undo Last (Safe Failure Evidence)

**Status**: PASS (safe failure path)
**Date**: 2026-04-26
**Blender Mode**: GUI bridge (`bridge start --mode gui`)
**Operation**: `undo.last`
**Implementation**: implemented
**Runtime result**: safe failure verified

---

## Commands

```bash
node apps/cli/dist/index.js bridge start --mode gui --verbose
node apps/cli/dist/index.js object create --type cube --name undo_test_cube --location 0,0,1
node apps/cli/dist/index.js scene inspect
node apps/cli/dist/index.js undo last --verbose
node apps/cli/dist/index.js scene inspect
node apps/cli/dist/index.js bridge stop --verbose
```

## Observed undo.last result

```json
{
  "ok": false,
  "operation": "undo.last",
  "message": "No undo step available",
  "data": {
    "undone": false,
    "detail": "Blender undo stack is empty or undo is unavailable in current context"
  },
  "warnings": [
    "Undo not executed because no undo step is available"
  ],
  "next_steps": [
    "Run `blendops scene inspect` to confirm current scene state"
  ],
  "request_id": "req_1777208645932_uq27w418e",
  "receipt": {
    "request_id": "req_1777208645932_uq27w418e",
    "operation": "undo.last",
    "ok": false,
    "duration_ms": 0
  }
}
```

## Scene inspect before/after

- Before undo: `undo_test_cube` present, `object_count=4`
- After undo: `undo_test_cube` present, `object_count=4`
- Observed change: none

## Verdict

- safe failure path: PASS
- successful undo path: NOT VERIFIED

## Remaining risk

- Blender undo stack availability is context/runtime dependent. `undo.last` may safely return `ok: false` even in GUI mode when no undo step is available.
