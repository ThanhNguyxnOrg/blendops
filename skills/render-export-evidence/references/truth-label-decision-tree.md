# Truth Label Decision Tree

Walk this tree to assign one of the 5 truth labels to each artifact item. Stop at the first matching condition.

```
1. Was a runtime action ATTEMPTED?
   NO  → label = `Not Run`. Stop.
   YES → continue to 2.

2. Did the runtime action COMPLETE?
   NO (failed mid-execution / errored out) → label = `Failed`. Stop.
   YES → continue to 3.

3. Does the OUTPUT PATH exist on disk OR is the output VISIBLE in a viewer?
   NO  → label = `Attempted`. Stop.
   YES → continue to 4.

4. Are VALIDATION NOTES recorded against acceptance criteria?
   NO  → label = `Produced`. Stop.
   YES → continue to 5.

5. Did validation PASS the stated acceptance criteria?
   NO  → label = `Failed` (or `Produced` if validation is partial; choose conservatively).
   YES → label = `Verified`. Stop.
```

## State transitions

Labels can only move in these directions:

| From | To | When |
|---|---|---|
| `Not Run` | `Attempted` | Runtime action started but evidence incomplete |
| `Not Run` | `Failed` | Runtime action started and confirmed failed |
| `Attempted` | `Produced` | Output path or visible output now exists |
| `Attempted` | `Failed` | Confirmed the action did not produce output |
| `Produced` | `Verified` | Validation notes recorded and pass acceptance criteria |
| `Produced` | `Failed` | Validation notes recorded and fail acceptance criteria |
| `Verified` | (downgrade only) | Per `pre-handoff-verification` rules |

## Forbidden transitions

| From | To | Why forbidden |
|---|---|---|
| `Not Run` | `Produced` directly | Cannot produce without an attempt |
| `Not Run` | `Verified` directly | Cannot validate non-existent output |
| `Attempted` | `Verified` directly | Verification requires output path + validation notes |
| Any | upgrade by `pre-handoff-verification` | That skill never upgrades; only downgrades or confirms |

## Common confusion

| Mistake | Correct label |
|---|---|
| "It rendered, so `Verified`" | `Produced` until validation notes exist |
| "I saw the file, so `Produced`" | Confirm path on disk explicitly; otherwise `Attempted` |
| "The smoke test passed, so render `Verified`" | Smoke covers read-only access; render is a separate claim |
| "Most checks passed, so `Verified`" | If any acceptance criterion failed → `Failed` or `Produced`, not `Verified` |
