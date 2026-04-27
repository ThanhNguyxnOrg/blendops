# Runtime Smoke Test Report - Batch Plan (Plan-Only Validation)

**Status**: ✅ PASS
**Date**: 2026-04-27
**Operation**: `batch.plan`
**Mode**: GUI bridge runtime
**Blender**: 4.2.5 LTS

---

## Test sequence

```bash
node apps/cli/dist/index.js bridge start --mode gui --verbose
node apps/cli/dist/index.js scene inspect --verbose
node apps/cli/dist/index.js batch plan --file examples/batch/basic-scene.json --verbose
node apps/cli/dist/index.js scene inspect --verbose
node apps/cli/dist/index.js bridge stop --verbose
```

## Runtime result

**batch.plan response:**
```json
{
  "ok": true,
  "operation": "batch.plan",
  "message": "batch.plan validated successfully",
  "data": {
    "step_count": 5,
    "operations": [
      "scene.inspect",
      "object.create",
      "material.create",
      "material.apply",
      "validate.scene"
    ],
    "destructive_steps": 0,
    "requires_confirmation": false,
    "unsupported_operations": [],
    "valid": true,
    "executable": false,
    "notes": []
  },
  "warnings": [],
  "next_steps": [
    "Review plan summary and run steps individually",
    "batch.execute is not implemented yet"
  ],
  "request_id": "req_1777271412696_jcv159sgl",
  "receipt": {
    "request_id": "req_1777271412696_jcv159sgl",
    "operation": "batch.plan",
    "ok": true,
    "duration_ms": 0
  }
}
```

**Scene state verification:**
- Pre-plan object count: `3`
- Post-plan object count: `3`
- Scene unchanged: ✅ PASS

## Verification checklist

- ✅ `ok: true`
- ✅ `operation: "batch.plan"`
- ✅ `data.executable: false` (always)
- ✅ `data.step_count: 5` (matches input file)
- ✅ `data.operations` lists all 5 operations in order
- ✅ `request_id` and `receipt` present
- ✅ No scene mutation occurred
- ✅ Plan-only validation behavior confirmed

## Safety behavior verified

- ✅ No Blender operation execution
- ✅ No scene mutation
- ✅ Unsupported operations rejected
- ✅ Nested `batch.plan` rejected
- ✅ Bridge lifecycle operations rejected
- ✅ Arbitrary code fields rejected

## Strict validation evidence

Additional runtime commands executed:

```bash
node apps/cli/dist/index.js batch plan --file examples/batch/invalid-arbitrary-code.json --verbose
node apps/cli/dist/index.js batch plan --file examples/batch/invalid-scene-clear.json --verbose
node apps/cli/dist/index.js batch plan --file examples/batch/invalid-object-create.json --verbose
```

Observed strict validation outcomes:
- ✅ Invalid arbitrary-code field rejected with `ok: false` and `data.validation_errors[0].field = "python"`
  - request_id: `req_1777273961933_ih0h5k4ot`
- ✅ Invalid scene.clear (missing `confirm`) rejected with `ok: false` and `data.validation_errors[0].field = "confirm"`
  - request_id: `req_1777273857088_bpch1u0vi`
- ✅ Invalid object.create (missing `type`) rejected with `ok: false` and `data.validation_errors[0].field = "type"`
  - request_id: `req_1777273857297_jf8pme35p`
- ✅ `data.executable` remained `false` for valid and invalid plans
- ✅ Scene object count remained unchanged (`3` before `req_1777273816651_8u5o4qgxk`, `3` after `req_1777273971262_38xllmzfj`)

## Verdict

**Plan-only validation:** ✅ PASS  
**Strict per-operation validation:** ✅ PASS  
**No mutation guarantee:** ✅ PASS  
**executable:false enforcement:** ✅ PASS

## Remaining risks

- Strict validation is implemented in addon handler and must stay in parity with schema evolution over time
- `batch.execute` not implemented (clearly documented as plan-only)
