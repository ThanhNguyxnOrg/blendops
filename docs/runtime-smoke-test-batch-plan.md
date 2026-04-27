# Runtime Smoke Test Report - Batch Plan (Plan-Only Validation)

**Status**: Pending runtime bridge validation
**Date**: 2026-04-27
**Operation**: `batch.plan`
**Mode**: Plan-only (must not execute any Blender scene mutation)

---

## CLI command

```bash
node apps/cli/dist/index.js batch plan --file examples/batch/basic-scene.json --verbose
```

## Expected response properties

- `ok: true` for a valid plan
- `operation: "batch.plan"`
- `data.executable: false` (always)
- `data.step_count` equals number of steps in file
- `data.operations` lists proposed operations in order
- `request_id` and `receipt` present when bridge/client response includes them

## Expected safety behavior

- No Blender operation execution occurs in `batch.plan`
- No scene mutation is performed
- Unsupported operations are reported via validation failures
- Nested `batch.plan` is rejected
- Bridge lifecycle operations inside plan are rejected (`bridge.start`, `bridge.stop`, `bridge.logs`, `bridge.status`, `bridge.operations`)
- Arbitrary code/shell fields are rejected (`python`, `script`, `shell`, `command`, `eval`, `exec`)

## If bridge is unavailable

Expected structured `bridge.error` response with request correlation fields from client.
Record static CLI behavior only. Do not claim runtime PASS.

## Runtime verification checklist (when bridge is available)

1. `node apps/cli/dist/index.js bridge start --mode gui --verbose`
2. `node apps/cli/dist/index.js scene inspect --verbose` (capture baseline)
3. `node apps/cli/dist/index.js batch plan --file examples/batch/basic-scene.json --verbose`
4. `node apps/cli/dist/index.js scene inspect --verbose` (confirm unchanged)
5. `node apps/cli/dist/index.js bridge stop --verbose`

Record:
- pre/post scene counts unchanged
- `batch.plan` returns `ok: true` and `data.executable: false`
- `step_count` and operations list match input file
