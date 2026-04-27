# 🧪 Runtime Smoke Test: batch.execute (dry-run only)

> 📚 Docs: [Index](./README.md) · [Manual test](./manual-test.md) · [Runtime evidence](./README.md#-runtime-evidence)

**Operation:** `batch.execute`  
**Status:** Dry-run only; validates and previews steps without executing  
**Date:** 2026-04-27  
**Blender:** 4.2.5 LTS  
**Mode:** GUI bridge  

---

## ✅ Test sequence

### 1) Valid dry-run with --dry-run flag

```bash
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --dry-run --verbose
```

**Expected:**
- `ok: true`
- `operation: "batch.execute"`
- `data.dry_run: true`
- `data.executable: false`
- `data.valid: true`
- `data.would_execute` array with step previews
- `data.step_count: 5`
- `data.operations` array matches steps
- `data.plan_fingerprint` present (`sha256:<hex>`)
- `data.dry_run_id` present (`dryrun:<16hex>:<request_id>`)
- `next_steps` includes "Review dry-run output" and "Real batch execution is not implemented yet"

### 2) Missing --dry-run flag (local CLI rejection)

```bash
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --verbose
```

**Expected:**
- `ok: false`
- `operation: "cli.invalid_arguments"`
- `message: "batch execute requires --dry-run; real execution is not implemented"`
- No bridge call made (local CLI validation)
- `next_steps` includes "Add --dry-run flag to preview batch execution"

### 3) Scene state unchanged after dry-run

```bash
node apps/cli/dist/index.js scene inspect --verbose
node apps/cli/dist/index.js batch execute --file examples/batch/basic-scene.json --dry-run --verbose
node apps/cli/dist/index.js scene inspect --verbose
```

**Expected:**
- Object count unchanged before/after dry-run
- No scene mutation from dry-run preview

---

## 🧪 Validation criteria

| Check | Expected | Result |
|---|---|---|
| Dry-run requires --dry-run flag | ✅ CLI rejects without flag | PASS |
| Missing flag returns cli.invalid_arguments | ✅ No bridge call | PASS |
| Valid dry-run returns ok: true | ✅ Structured response | PASS |
| data.dry_run: true | ✅ Present | PASS |
| data.executable: false | ✅ Present | PASS |
| data.plan_fingerprint present | ✅ SHA-256 fingerprint | PASS |
| data.dry_run_id present | ✅ Correlates fingerprint + request_id | PASS |
| data.would_execute preview array | ✅ Per-step effects | PASS |
| Scene state unchanged | ✅ No mutation | PASS |
| Invalid steps rejected | ✅ validation_errors | PASS |

---

## 🛡️ Safety constraints

- `batch.execute` requires `dry_run: true` in schema
- CLI requires `--dry-run` flag; missing flag rejected locally
- MCP requires `dry_run: true` in input; missing/false rejected locally
- Blender addon rejects `dry_run != true` before validation
- No step execution occurs in dry-run mode
- Real batch execution is not implemented

---

## 📋 Sample output (valid dry-run)

```json
{
  "ok": true,
  "operation": "batch.execute",
  "message": "batch.execute dry-run preview complete",
  "data": {
    "dry_run": true,
    "executable": false,
    "step_count": 5,
    "operations": [
      "scene.inspect",
      "object.create",
      "material.create",
      "material.apply",
      "validate.scene"
    ],
    "valid": true,
    "would_execute": [
      {
        "step": 1,
        "operation": "scene.inspect",
        "effect": "inspect scene state"
      },
      {
        "step": 2,
        "operation": "object.create",
        "effect": "create cube object 'batch_cube'"
      },
      {
        "step": 3,
        "operation": "material.create",
        "effect": "create material 'batch_red'"
      },
      {
        "step": 4,
        "operation": "material.apply",
        "effect": "apply material 'batch_red' to object 'batch_cube'"
      },
      {
        "step": 5,
        "operation": "validate.scene",
        "effect": "validate scene with basic preset"
      }
    ],
    "destructive_steps": 0,
    "requires_confirmation": false,
    "validation_errors": [],
    "notes": [],
    "plan_fingerprint": "sha256:7fed7d5e95670321d3999371292f3c5a83ab3484178383da903d1184f585a2d8",
    "dry_run_id": "dryrun:7fed7d5e95670321:req_1777280743574_rfdjgtax9"
  },
  "warnings": [],
  "next_steps": [
    "Review dry-run output",
    "Real batch execution is not implemented yet",
    "Run individual operations manually or wait for future batch.execute support"
  ],
  "request_id": "req_1777280743574_rfdjgtax9",
  "receipt": {
    "request_id": "req_1777280743574_rfdjgtax9",
    "operation": "batch.execute",
    "ok": true,
    "duration_ms": 0
  }
}
```

---

## 📊 Runtime evidence verdict

**Captured evidence (2026-04-27):**

- **batch.plan fingerprint:** `sha256:7fed7d5e95670321d3999371292f3c5a83ab3484178383da903d1184f585a2d8`
- **batch.execute fingerprint:** `sha256:7fed7d5e95670321d3999371292f3c5a83ab3484178383da903d1184f585a2d8`
- **dry_run_id:** `dryrun:7fed7d5e95670321:req_1777280743574_rfdjgtax9`
- **Scene object count:** 3 (before) → 3 (after)

**Verification results:**

| Check | Result |
|---|---|
| Fingerprint generated | ✅ PASS |
| Dry-run fingerprint matches batch.plan | ✅ PASS |
| dry_run_id generated | ✅ PASS |
| dry_run_id format correct (dryrun:16hex:request_id) | ✅ PASS |
| No scene mutation | ✅ PASS |
| executable:false enforced | ✅ PASS |
| Real execution NOT IMPLEMENTED | ✅ PASS |

---

## 🔍 Next steps

- Real `batch.execute` implementation remains future work
- Dry-run preview enables AI agents to validate batch plans before manual execution
- After dry-run, agents should run individual typed operations or wait for real batch execution support
